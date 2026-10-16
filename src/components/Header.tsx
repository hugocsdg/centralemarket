import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { Heart, Plus, Search, User } from 'lucide-react'
import Logo from './Logo'

function Header() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    navigate(query ? `/explore?q=${encodeURIComponent(query)}` : '/explore')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" aria-label="CentraleMarket home">
          <Logo />
        </Link>

        <form onSubmit={handleSearch} className="hidden flex-1 md:block">
          <label className="flex items-center gap-2 rounded-full bg-lavanda px-4 py-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search lamps, bikes, tickets…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500"
            />
          </label>
        </form>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          <NavLink
            to="/explore"
            className={({ isActive }) =>
              `rounded-full px-3 py-2 text-sm font-medium ${isActive ? 'text-rojo' : 'text-gray-700 hover:text-burdeos'}`
            }
          >
            Explore
          </NavLink>
          <NavLink to="/favorites" aria-label="Favorites" className="rounded-full p-2 text-gray-700 hover:bg-lavanda">
            <Heart className="h-5 w-5" />
          </NavLink>
          <NavLink to="/profile" aria-label="Profile" className="rounded-full p-2 text-gray-700 hover:bg-lavanda">
            <User className="h-5 w-5" />
          </NavLink>
          <Link
            to="/sell"
            className="ml-2 flex items-center gap-1 rounded-full bg-rojo px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Sell an item
          </Link>
        </nav>

        <Link to="/explore" aria-label="Search" className="ml-auto rounded-full p-2 text-gray-700 md:hidden">
          <Search className="h-5 w-5" />
        </Link>
      </div>
    </header>
  )
}

export default Header
