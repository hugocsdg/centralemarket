import { NavLink } from 'react-router'
import { Compass, Home, MessageCircle, Plus, User } from 'lucide-react'

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/sell', label: 'Sell', icon: Plus },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: User },
]

// Menú inferior flotante de cristal: solo se ve en móvil (md:hidden).
function BottomNav({ unread }: { unread: number }) {
  return (
    <nav className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 md:hidden">
      <ul className="glass grid grid-cols-5 rounded-[28px] bg-noche/60 px-1 py-1.5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1 text-[11px] font-medium transition ${
                  isActive ? 'text-white' : 'text-white/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {to === '/sell' ? (
                    <span className="btn-primary -mt-1 flex h-10 w-10 items-center justify-center rounded-2xl">
                      <Icon className="h-5 w-5 text-white" />
                    </span>
                  ) : (
                    <span className="relative flex h-10 w-10 items-center justify-center">
                      {isActive && <span className="absolute inset-1 rounded-xl bg-white/10" />}
                      <Icon className="relative h-5 w-5" />
                      {to === '/messages' && unread > 0 && (
                        <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-carmin px-1 text-[11px] font-bold text-white shadow-[0_0_12px_rgb(224_21_63/0.8)]">
                          {unread}
                        </span>
                      )}
                    </span>
                  )}
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default BottomNav
