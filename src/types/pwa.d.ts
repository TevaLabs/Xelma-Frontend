declare module 'virtual:pwa-register' {
  import type { RegisterSWOptions } from 'vite-plugin-pwa';

  export function registerSW(options?: RegisterSWOptions): void;
}
