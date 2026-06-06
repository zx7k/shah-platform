import { useState, useCallback } from 'react';
import api from '../services/api';
import { useCrypto } from '../context/CryptoContext';
import { useAuthStore } from '../store/authStore';
import { getSharedAESKey, encryptMessage, decryptMessage, generateKeyPair, exportPublicKey } from '../utils/crypto';
import { arrayBufferToBase64, uint8ArrayToBase64, base64ToArrayBuffer, base64ToUint8Array } from '../utils/convert';

// Export/import group key as JWK
const generateGroupKey = async (): Promise<CryptoKey> => {
  return await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

const exportGroupKey = async (key: CryptoKey): Promise<string> => {
  const jwk = await window.crypto.subtle.exportKey('jwk', key);
  return JSON.stringify(jwk);
};

const importGroupKey = async (jwkStr: string): Promise<CryptoKey> => {
  const jwk = JSON.parse(jwkStr);
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const useGroupCrypto = () => {
  const { myPrivateKey, myPublicKeyJWK } = useCrypto();
  const [groupKeys, setGroupKeys] = useState<Record<string, CryptoKey>>({});
  const user = useAuthStore(s => s.user);

  const getGroupKey = useCallback(async (groupId: string): Promise<CryptoKey | null> => {
    if (groupKeys[groupId]) return groupKeys[groupId];
    if (!myPrivateKey) return null;
    try {
      const res = await api.get(`/groups/${groupId}/keys/${user.uid}`);
      const { encryptedKey, adminPublicJWK } = res.data; // assuming stored as { encryptedKey: { ciphertext, iv }, adminPublicJWK }
      const sharedAES = await getSharedAESKey(myPrivateKey, adminPublicJWK);
      const plain = await decryptMessage(
        sharedAES,
        base64ToArrayBuffer(encryptedKey.ciphertext),
        base64ToUint8Array(encryptedKey.iv)
      );
      const groupKey = await importGroupKey(plain);
      setGroupKeys(prev => ({ ...prev, [groupId]: groupKey }));
      return groupKey;
    } catch (err) {
      console.error('Failed to get group key', err);
      return null;
    }
  }, [myPrivateKey, groupKeys, user.uid]);

  const createAndDistributeKeys = useCallback(async (groupId: string, memberUids: string[]) => {
    if (!myPrivateKey || !myPublicKeyJWK) throw new Error('No key pair');
    const groupKey = await generateGroupKey();
    const groupKeyJWK = await exportGroupKey(groupKey);
    const keysPayload: Record<string, any> = {};

    for (const memberUid of memberUids) {
      // skip self? we already have the key
      if (memberUid === user.uid) {
        // store locally directly
        setGroupKeys(prev => ({ ...prev, [groupId]: groupKey }));
        continue;
      }
      try {
        const userRes = await api.get(`/users/${memberUid}`);
        const peerJWK = userRes.data.publicKey;
        if (!peerJWK) continue;
        const sharedAES = await getSharedAESKey(myPrivateKey, peerJWK);
        const { ciphertext, iv } = await encryptMessage(sharedAES, groupKeyJWK);
        keysPayload[memberUid] = {
          encryptedKey: {
            ciphertext: arrayBufferToBase64(ciphertext),
            iv: uint8ArrayToBase64(iv),
          },
          adminPublicJWK: myPublicKeyJWK,
        };
      } catch (err) {
        console.error('Failed to encrypt for member', memberUid, err);
      }
    }

    if (Object.keys(keysPayload).length > 0) {
      await api.post(`/groups/${groupId}/keys`, { keys: keysPayload });
    }
    return groupKey;
  }, [myPrivateKey, myPublicKeyJWK, user.uid]);

  return { getGroupKey, createAndDistributeKeys, groupKeys };
};