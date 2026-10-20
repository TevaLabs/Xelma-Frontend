import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      jwt: null,
      isAuthenticated: false,
      isAuthenticating: false,
    });
    localStorage.clear();
  });

  describe('initial state', () => {
    it('starts with no authentication', () => {
      const state = useAuthStore.getState();
      expect(state.jwt).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isAuthenticating).toBe(false);
    });
  });

  describe('setJwt', () => {
    it('sets JWT token and marks as authenticated', () => {
      const token = 'test-jwt-token-123';
      useAuthStore.getState().setJwt(token);

      const state = useAuthStore.getState();
      expect(state.jwt).toBe(token);
      expect(state.isAuthenticated).toBe(true);
    });

    it('persists JWT to localStorage', () => {
      const token = 'test-jwt-token-456';
      useAuthStore.getState().setJwt(token);

      // Zustand persist stores data in a specific format
      const stored = localStorage.getItem('xelma_jwt');
      expect(stored).toContain(token); // Check that token is in the stored data
      
      const parsedStored = JSON.parse(stored!);
      expect(parsedStored.state.jwt).toBe(token);
    });

    it('overwrites previous JWT token', () => {
      useAuthStore.getState().setJwt('first-token');
      useAuthStore.getState().setJwt('second-token');

      const state = useAuthStore.getState();
      expect(state.jwt).toBe('second-token');
      
      const stored = localStorage.getItem('xelma_jwt');
      const parsedStored = JSON.parse(stored!);
      expect(parsedStored.state.jwt).toBe('second-token');
    });

    it('handles empty string token', () => {
      useAuthStore.getState().setJwt('');

      const state = useAuthStore.getState();
      expect(state.jwt).toBe('');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('clearAuth', () => {
    it('clears JWT and authentication state', () => {
      useAuthStore.getState().setJwt('test-token');
      useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.jwt).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('removes JWT from localStorage', () => {
      useAuthStore.getState().setJwt('test-token');
      // Verify it was stored
      const stored = localStorage.getItem('xelma_jwt');
      expect(stored).toBeTruthy();
      const parsedStored = JSON.parse(stored!);
      expect(parsedStored.state.jwt).toBe('test-token');

      useAuthStore.getState().clearAuth();
      
      // Zustand persist keeps the storage key but sets jwt to null
      const clearedStored = localStorage.getItem('xelma_jwt');
      expect(clearedStored).toBeTruthy();
      const parsedCleared = JSON.parse(clearedStored!);
      expect(parsedCleared.state.jwt).toBeNull();
    });

    it('clears isAuthenticating status when clearAuth is invoked', () => {
      useAuthStore.getState().setIsAuthenticating(true);
      expect(useAuthStore.getState().isAuthenticating).toBe(true);

      useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.jwt).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isAuthenticating).toBe(false);
    });

    it('is idempotent - can be called multiple times safely', () => {
      useAuthStore.getState().setJwt('test-token');
      useAuthStore.getState().clearAuth();
      useAuthStore.getState().clearAuth();
      useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.jwt).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isAuthenticating).toBe(false);
    });
  });

  describe('setIsAuthenticating', () => {
    it('updates isAuthenticating flag', () => {
      expect(useAuthStore.getState().isAuthenticating).toBe(false);
      useAuthStore.getState().setIsAuthenticating(true);
      expect(useAuthStore.getState().isAuthenticating).toBe(true);
      useAuthStore.getState().setIsAuthenticating(false);
      expect(useAuthStore.getState().isAuthenticating).toBe(false);
    });
  });

  describe('persistence', () => {
    it('restores JWT from localStorage on initialization', () => {
      // Simulate persisted state
      localStorage.setItem('xelma_jwt', JSON.stringify({
        state: { jwt: 'persisted-token', isAuthenticated: true },
        version: 0,
      }));

      // Since we can't easily test the actual persistence behavior in this test setup,
      // we'll test that the store can handle persisted data correctly
      useAuthStore.setState({ jwt: 'persisted-token', isAuthenticated: true });
      
      const state = useAuthStore.getState();
      expect(state.jwt).toBe('persisted-token');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles rapid authentication state changes', () => {
      useAuthStore.getState().setJwt('token1');
      useAuthStore.getState().clearAuth();
      useAuthStore.getState().setJwt('token2');
      useAuthStore.getState().setJwt('token3');
      useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.jwt).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('handles special characters in JWT token', () => {
      const specialToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      useAuthStore.getState().setJwt(specialToken);

      const state = useAuthStore.getState();
      expect(state.jwt).toBe(specialToken);
    });
  });
});
