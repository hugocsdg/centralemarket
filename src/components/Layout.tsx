import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import Background from './Background'
import Header from './Header'
import BottomNav from './BottomNav'

// El "marco" de la app: fondo, cabecera arriba, menú abajo y en medio la página actual (<Outlet />).
function Layout() {
  const { pathname } = useLocation()

  // Al cambiar de página, volver arriba del todo.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="relative min-h-screen text-white">
      <Background />
      <Header />
      <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 md:pb-12">
        <Outlet />
      </main>
      <footer className="hidden border-t border-white/10 py-6 text-center text-xs text-white/50 md:block">
        An independent student initiative for the CentraleSupélec community.
      </footer>
      <BottomNav />
    </div>
  )
}

export default Layout
