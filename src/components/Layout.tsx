import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import Background from './Background'
import Header from './Header'
import BottomNav from './BottomNav'
import { useAuth } from '../lib/auth'
import { useUnreadCount } from '../lib/useUnread'

// El "marco" de la app: fondo, cabecera arriba, menú abajo y en medio la página actual (<Outlet />).
function Layout() {
  const { pathname } = useLocation()
  const { session } = useAuth()
  const unread = useUnreadCount(session?.user.id)

  // Al cambiar de página, volver arriba del todo.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="relative min-h-screen text-white">
      <Background />
      <Header unread={unread} />
      <main className="mx-auto max-w-6xl px-4 pt-24 pb-32 md:pt-28 md:pb-16">
        <Outlet />
      </main>
      <footer className="hidden border-t border-white/5 py-8 text-center text-xs text-white/40 md:block">
        An independent student initiative for the CentraleSupélec community.
      </footer>
      <BottomNav unread={unread} />
    </div>
  )
}

export default Layout
