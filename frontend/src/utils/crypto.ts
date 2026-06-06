export const generateKeyPair = async (): Promise<CryptoKeyPair> => {
  return window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  );
};

export const exportPublicKey = async (key: CryptoKey): Promise<string> => {
  const jwk = await window.crypto.subtle.exportKey('jwk', key);
  return JSON.stringify(jwk);
};

export const importPublicKey = async (jwkStr: string): Promise<CryptoKey> => {
  return window.crypto.subtle.importKey('jwk', JSON.parse(jwkStr), { name: 'ECDH', namedCurve: 'P-256' }, true, []);
};

const deriveSharedSecret = async (priv: CryptoKey, pub: CryptoKey): Promise<CryptoKey> => {
  const bits = await window.crypto.subtle.deriveBits({ name: 'ECDH', public: pub }, priv, 256);
  const hkdfKey = await window.crypto.subtle.importKey('raw', bits, { name: 'HKDF' }, false, ['deriveKey']);
  return window.crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: new TextEncoder().encode('shah-chat-key') },
    hkdfKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
};

export const getSharedAESKey = async (priv: CryptoKey, peerJWK: string): Promise<CryptoKey> => {
  const pub = await importPublicKey(peerJWK);
  return deriveSharedSecret(priv, pub);
};

export const encryptMessage = async (key: CryptoKey, plaintext: string): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return { ciphertext, iv };
};

export const decryptMessage = async (key: CryptoKey, ciphertext: ArrayBuffer, iv: Uint8Array): Promise<string> => {
  const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
};