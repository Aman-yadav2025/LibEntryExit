import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'guard';
  rollNumber?: string;
  department?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (token, user) => {
        Cookies.set('setu_token', token, { expires: 7 });
        set({ token, user });
      },
      logout: () => {
        Cookies.remove('setu_token');
        set({ token: null, user: null });
      },
    }),
    { name: 'setu-auth' }
  )
);
