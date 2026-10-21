import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import AuthProvider from './components/AuthProvider'
import { LangProvider } from './i18n/lang'
import './lib/theme' // modo oscuro / claro (sigue al sistema si se elige "Auto")
import './lib/install' // escucha desde el principio el aviso de instalación de Android

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  </StrictMode>,
)

// Registrar el service worker (public/sw.js): necesario para instalar la web como app en el móvil.
// Solo en la web publicada; en local (npm run dev) no hace falta.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
