import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { MessageCircle, Plus, Search, User } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../lib/auth'

function Header({ unread }: { unread: number }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { session, profile } = useAuth()

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    navigate(query ? `/explore?q=${encodeURIComponent(query)}` : '/explore')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-noche/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" aria-label="CentraleMarket home">
          <Logo />
        </Link>

        <form onSubmit={handleSearch} className="hidden flex-1 md:block">
          <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2">
            <Search className="h-4 w-4 text-white/50" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search lamps, bikes, tickets…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/50"
            />
          </label>
        </form>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          <NavLink
            to="/explore"
            className={({ isActive }) =>
              `rounded-full px-3 py-2 text-sm font-medium ${isActive ? 'text-rosa' : 'text-white/80 hover:text-white'}`
            }
          >
            Explore
          </NavLink>
          <NavLink
            to="/messages"
            aria-label="Messages"
            className="relative rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <MessageCircle className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-carmin px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </NavLink>
          {session ? (
            <NavLink
              to="/profile"
              aria-label="Profile"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-carmin to-burdeos text-sm font-bold"
            >
              {profile?.display_name[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
            </NavLink>
          ) : (
            <Link to="/login" className="rounded-full px-3 py-2 text-sm font-medium text-white/80 hover:text-white">
              Log in
            </Link>
          )}
          <Link
            to="/sell"
            className="ml-2 flex items-center gap-1 rounded-full bg-gradient-to-r from-rojo to-carmin px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rojo/30 hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Sell an item
          </Link>
        </nav>

        <Link to="/explore" aria-label="Search" className="ml-auto rounded-full p-2 text-white/80 md:hidden">
          <Search className="h-5 w-5" />
        </Link>
      </div>
    </header>
  )
}

export default Header
