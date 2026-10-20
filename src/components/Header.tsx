import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { Bell, Heart, MessageCircle, Plus, Search, User } from 'lucide-react'
import Logo from './Logo'
import Avatar from './Avatar'
import { useAuth } from '../lib/auth'
import { SPACES } from '../data/spaces'

// Cabecera flotante de cristal. Al hacer scroll se vuelve un poco más opaca.
// "unread" = conversaciones sin leer; "alerts" = avisos sin leer (la campana).
function Header({ unread, alerts }: { unread: number; alerts: number }) {
  const [query, setQuery] = useState('')
  const [scrolled, setScrolled] = useState(() => window.scrollY > 12)
  const navigate = useNavigate()
  const { session, profile } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    navigate(query ? `/explore?q=${encodeURIComponent(query)}` : '/explore')
  }

  return (
    <header className="fixed inset-x-0 top-0 z-30 px-3 pt-3">
      <div
        className={`glass mx-auto flex h-14 max-w-6xl items-center gap-3 rounded-full pr-2 pl-4 transition-colors duration-300 ${
          scrolled ? 'bg-noche/70' : ''
        }`}
      >
        <Link to="/" aria-label="CentraleMarket home" className="shrink-0">
          <Logo />
        </Link>

        <form onSubmit={handleSearch} className="hidden flex-1 md:block">
          <label className="group mx-auto flex max-w-md items-center gap-2 rounded-full glass px-4 py-2 transition focus-within:border-rosa/60 focus-within:bg-white/10 focus-within:shadow-[0_0_0_4px_rgb(224_21_63/0.15)]">
            <Search className="h-4 w-4 text-white/60 transition group-focus-within:text-rosa" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search listings"
              placeholder="Search lamps, bikes, tickets…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/50"
            />
          </label>
        </form>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {SPACES.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-h-11 items-center rounded-full px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <NavLink
            to="/notifications"
            aria-label={alerts ? `Notifications (${alerts} new)` : 'Notifications'}
            className={({ isActive }) =>
              `relative flex h-11 w-11 items-center justify-center rounded-full transition ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'}`
            }
          >
            <Bell className="h-5 w-5" />
            {alerts > 0 && <Badge count={alerts} />}
          </NavLink>
          <NavLink
            to="/favorites"
            aria-label="Favorites"
            className={({ isActive }) =>
              `flex h-11 w-11 items-center justify-center rounded-full transition ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'}`
            }
          >
            <Heart className="h-5 w-5" />
          </NavLink>
          <NavLink
            to="/messages"
            aria-label="Messages"
            className={({ isActive }) =>
              `relative flex h-11 w-11 items-center justify-center rounded-full transition ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'}`
            }
          >
            <MessageCircle className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-carmin px-1 text-[11px] font-bold text-white shadow-[0_0_12px_rgb(224_21_63/0.8)]">
                {unread}
              </span>
            )}
          </NavLink>
          {session ? (
            <NavLink
              to="/profile"
              aria-label="Profile"
              className="mx-1 flex h-11 w-11 items-center justify-center rounded-full ring-2 ring-white/10 transition hover:ring-rosa/50"
            >
              {profile ? (
                <Avatar name={profile.display_name} url={profile.avatar_url} className="h-11 w-11 text-sm" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </NavLink>
          ) : (
            <Link
              to="/login"
              className="flex min-h-11 items-center rounded-full px-3 py-2 text-sm font-medium text-white/70 hover:text-white"
            >
              Log in
            </Link>
          )}
          <Link
            to="/sell"
            className="btn-primary flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Sell
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:hidden">
          <Link
            to="/notifications"
            aria-label={alerts ? `Notifications (${alerts} new)` : 'Notifications'}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/80"
          >
            <Bell className="h-5 w-5" />
            {alerts > 0 && <Badge count={alerts} />}
          </Link>
          <Link
            to="/favorites"
            aria-label="Favorites"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/80"
          >
            <Heart className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}

// Numerito rojo encima de un icono.
function Badge({ count }: { count: number }) {
  return (
    <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-carmin px-1 text-[11px] font-bold text-white shadow-[0_0_12px_rgb(224_21_63/0.8)]">
      {count > 9 ? '9+' : count}
    </span>
  )
}

export default Header
