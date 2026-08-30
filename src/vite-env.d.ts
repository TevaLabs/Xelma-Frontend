/// <reference types="vite/client" />

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
