import { NavLink } from 'react-router'
import { SPACES } from '../data/spaces'

// Selector tipo iPhone para saltar de una pantalla a otra.
function SpaceTabs() {
  return (
    <nav aria-label="Sections" className="glass grid grid-cols-3 gap-1 rounded-full p-1 md:hidden">
      {SPACES.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex min-h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition ${
              isActive ? 'btn-primary text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export default SpaceTabs
