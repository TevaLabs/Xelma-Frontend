/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to "true" in dev to serve education/stats/pools from MSW fixtures. */
  readonly VITE_ENABLE_MSW?: string;
  /** Set to "error" (with VITE_ENABLE_MSW) to make mocked endpoints fail. */
  readonly VITE_MSW_SCENARIO?: string;
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
