import { create } from 'zustand';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface AuthState {
  user: any | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise < void > ;
  register: (email: string, password: string, name: string) => Promise < void > ;
  verifyEmail: (email: string, code: string) => Promise < void > ;
  logout: () => Promise < void > ;
  refreshAccessToken: () => Promise < string | null > ;
}

export const useAuthStore = create < AuthState > ((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  error: null,
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      const res = await axios.post(`${API_URL}/auth/login`, { idToken }, { withCredentials: true });
      set({ accessToken: res.data.accessToken, user: res.data.user, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },
  register: async (email, password, name) => {
    set({ isLoading: true });
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await axios.post(`${API_URL}/auth/register`, { email, password, name });
      set({ isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },
  verifyEmail: async (email, code) => {
    set({ isLoading: true });
    try {
      await axios.post(`${API_URL}/auth/verify-email`, { email, code });
      set({ isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },
  logout: async () => {
    await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    set({ user: null, accessToken: null });
  },
  refreshAccessToken: async () => {
    try {
      const res = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
      set({ accessToken: res.data.accessToken });
      return res.data.accessToken;
    } catch {
      set({ user: null, accessToken: null });
      return null;
    }
  },
}));