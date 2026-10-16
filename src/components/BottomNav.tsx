import { NavLink } from 'react-router'
import { Compass, Heart, Home, Plus, User } from 'lucide-react'

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/sell', label: 'Sell', icon: Plus },
  { to: '/favorites', label: 'Favorites', icon: Heart },
  { to: '/profile', label: 'Profile', icon: User },
]

// Menú inferior: solo se ve en móvil (md:hidden).
function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-noche/85 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-rosa' : 'text-white/50'}`
              }
            >
              {to === '/sell' ? (
                <span className="-mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-carmin to-burdeos text-white shadow-lg shadow-rojo/40 ring-4 ring-noche">
                  <Icon className="h-6 w-6" />
                </span>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default BottomNav
