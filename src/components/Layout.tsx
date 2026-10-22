import { Suspense, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import Background from './Background'
import Header from './Header'
import InstallAppBanner from './InstallAppBanner'
import BottomNav from './BottomNav'
import { useAuth } from '../lib/auth'
import { useUnreadCount } from '../lib/useUnread'
import { useNotificationCount } from '../lib/notifications'
import { useLang } from '../i18n/lang'
import { syncPushLanguage } from '../lib/push'
import SuspendedNotice from './SuspendedNotice'
import ErrorBoundary from './ErrorBoundary'

// El "marco" de la app: fondo, cabecera arriba, menú abajo y en medio la página actual (<Outlet />).
function Layout() {
  const { pathname } = useLocation()
  const { session } = useAuth()
  const unread = useUnreadCount(session?.user.id)
  const alerts = useNotificationCount(session?.user.id)
  const { t, lang } = useLang()

  // Si cambias el idioma, los avisos del móvil llegan en el idioma nuevo.
  useEffect(() => {
    if (session) syncPushLanguage(lang)
  }, [lang, session])

  // Al cambiar de página, volver arriba del todo.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="relative min-h-screen text-white">
      <Background />
      <Header unread={unread} alerts={alerts} />
      <main className="mx-auto max-w-6xl px-4 pt-24 pb-32 md:pt-28 md:pb-16">
        {/* Mientras llega el código de la página, la cabecera y el menú se quedan */}
        {/* "Get the app" solo en el inicio y en el perfil (y solo en móvil, si no está instalada) */}
        {(pathname === '/' || pathname === '/profile') && <InstallAppBanner />}
        <SuspendedNotice />
        {/* Si una pantalla falla, solo esa enseña "Algo ha fallado" (al cambiar de página se recupera). */}
        <ErrorBoundary key={pathname}>
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer className="hidden border-t border-white/5 py-8 text-center text-xs text-white/60 md:block">
        {t('An independent student initiative for the CentraleSupélec community.')} ·{' '}
        <Link to="/welcome" className="underline-offset-4 hover:text-white hover:underline">
          {t('About CentraleMarket')}
        </Link>
      </footer>
      <BottomNav unread={unread} />
    </div>
  )
}

export default Layout
