import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const JWT_KEY = 'xelma_jwt';

interface AuthState {
  jwt: string | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  setJwt: (token: string) => void;
  setIsAuthenticating: (isAuthenticating: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      jwt: null,
      isAuthenticated: false,
      isAuthenticating: false,

      setJwt: (token: string) => {
        localStorage.setItem(JWT_KEY, token);
        set({ jwt: token, isAuthenticated: true, isAuthenticating: false });
      },

      setIsAuthenticating: (isAuthenticating: boolean) => {
        set({ isAuthenticating });
      },

      clearAuth: () => {
        localStorage.removeItem(JWT_KEY);
        set({ jwt: null, isAuthenticated: false, isAuthenticating: false });
      },
    }),
    {
      name: JWT_KEY,
      partialize: (state) => ({ jwt: state.jwt, isAuthenticated: state.isAuthenticated }),
    }
  )
);
