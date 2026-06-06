import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { generateKeyPair, exportPublicKey, getSharedAESKey } from '../utils/crypto';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

interface CryptoContextType {
  myPrivateKey: CryptoKey | null;
  myPublicKeyJWK: string | null;
  getChatKey: (chatId: string, peerPublicJWK?: string) => Promise<CryptoKey | null>;
}

const CryptoContext = createContext<CryptoContextType>({
  myPrivateKey: null, myPublicKeyJWK: null,
  getChatKey: async () => null,
});

export const CryptoProvider = ({ children }: { children: React.ReactNode }) => {
  const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null);
  const [myPublicKeyJWK, setMyPublicKeyJWK] = useState<string | null>(null);
  const [chatKeys, setChatKeys] = useState<Record<string, CryptoKey>>({});
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const kp = await generateKeyPair();
      setKeyPair(kp);
      const jwk = await exportPublicKey(kp.publicKey);
      setMyPublicKeyJWK(jwk);
      await api.put('/users/me/key', { publicKey: jwk });
    };
    init();
  }, [user]);

  const getChatKey = useCallback(async (chatId: string, peerPublicJWK?: string): Promise<CryptoKey | null> => {
    if (!keyPair) return null;
    if (chatKeys[chatId]) return chatKeys[chatId];
    let jwk = peerPublicJWK;
    if (!jwk) {
      const chatRes = await api.get(`/chats/${chatId}`);
      const peerUid = chatRes.data.participants.find((u: string) => u !== user.uid);
      const peerRes = await api.get(`/users/${peerUid}`);
      jwk = peerRes.data.publicKey;
    }
    if (!jwk) throw new Error('No public key');
    const aesKey = await getSharedAESKey(keyPair.privateKey, jwk);
    setChatKeys((prev) => ({ ...prev, [chatId]: aesKey }));
    return aesKey;
  }, [keyPair, chatKeys, user]);

  return (
    <CryptoContext.Provider value={{ myPrivateKey: keyPair?.privateKey || null, myPublicKeyJWK, getChatKey }}>
      {children}
    </CryptoContext.Provider>
  );
};

export const useCrypto = () => useContext(CryptoContext);