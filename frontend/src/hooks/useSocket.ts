import { useEffect, useState } from 'react';
import { connectSocket, getSocket, disconnectSocket } from '../services/socket';
import { useAuthStore } from '../store/authStore';

export const useSocket = () => {
  const [socket, setSocket] = useState(getSocket());
  const token = useAuthStore((s) => s.accessToken);
  useEffect(() => {
    if (!token) { disconnectSocket(); return; }
    const s = connectSocket(token);
    setSocket(s);
    return () => {};
  }, [token]);
  return socket;
};