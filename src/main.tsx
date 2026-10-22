import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
// Tipografías servidas desde nuestra propia web (antes venían de Google Fonts y frenaban el primer pintado).
// Solo los grosores que usamos y el alfabeto latino (con acentos de francés, español, italiano, portugués…).
import '@fontsource/plus-jakarta-sans/latin-400.css'
import '@fontsource/plus-jakarta-sans/latin-ext-400.css'
import '@fontsource/plus-jakarta-sans/latin-500.css'
import '@fontsource/plus-jakarta-sans/latin-ext-500.css'
import '@fontsource/plus-jakarta-sans/latin-600.css'
import '@fontsource/plus-jakarta-sans/latin-ext-600.css'
import '@fontsource/plus-jakarta-sans/latin-700.css'
import '@fontsource/plus-jakarta-sans/latin-ext-700.css'
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/space-grotesk/latin-600.css'
import '@fontsource/space-grotesk/latin-700.css'
import '@fontsource/montserrat/latin-700.css'
import '@fontsource/montserrat/latin-800.css'
import './index.css'
import App from './App.tsx'
import AuthProvider from './components/AuthProvider'
import { LangProvider } from './i18n/lang'
import './lib/theme' // modo oscuro / claro (sigue al sistema si se elige "Auto")
import './lib/install' // escucha desde el principio el aviso de instalación de Android
import { Analytics } from '@vercel/analytics/react'
import { listenForErrors } from './lib/errors'
import ErrorBoundary from './components/ErrorBoundary'

// Errores que nadie captura: se guardan para verlos en Admin → Errors (lib/errors.ts).
listenForErrors()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
          {/* Visitas, sin cookies ni datos personales (se ven en Vercel → Analytics) */}
          <Analytics />
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
