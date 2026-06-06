export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return window.btoa(binary);
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

export const uint8ArrayToBase64 = (bytes: Uint8Array): string => arrayBufferToBase64(bytes.buffer);
export const base64ToUint8Array = (base64: string): Uint8Array => new Uint8Array(base64ToArrayBuffer(base64));