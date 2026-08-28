/// <reference types="vite-plugin-pwa/client" />
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'

/**
 * Opt-in MSW mocking for offline development. Set `VITE_ENABLE_MSW=true` and
 * run `pnpm dev` to serve fixture data for the education, stats, and pools
 * endpoints — see the README section "Mocking the API with MSW".
 */
async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV) return;
  if (import.meta.env.VITE_ENABLE_MSW !== 'true') return;
  const { worker } = await import('./test/msw/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onRegistered(registration: ServiceWorkerRegistration) {
        if (registration) {
          registration.update();
        }
      },
      onRegisterError(error: unknown) {
        console.warn('Service worker registration failed:', error);
      },
    });
  });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
})
