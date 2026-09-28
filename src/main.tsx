/// <reference types="vite-plugin-pwa/client" />
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'

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

// App is forced-dark via Tailwind CSS dark: utilities.
// next-themes and any ThemeProvider/ThemeContext have been intentionally removed.
// See: https://github.com/TevaLabs/Xelma-Frontend/issues/589
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
