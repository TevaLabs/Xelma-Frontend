/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to "true" to enable the MSW service worker for offline development. */
  readonly VITE_ENABLE_MSW?: string;
}

declare module 'virtual:pwa-register' {
  export interface ServiceWorkerRegistrationLike {
    update(): void;
  }

  export interface RegisterSWOptions {
    immediate?: boolean;
    onRegistered?: (registration: ServiceWorkerRegistrationLike | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  }

  export function registerSW(options: RegisterSWOptions): void;
}
