import { ShoppingBag, Ticket, UtensilsCrossed } from 'lucide-react'

// Las tres "pantallas" de CentraleMarket: cosas, eventos y comida casera.
export const SPACES = [
  { to: '/explore', label: 'Market', icon: ShoppingBag },
  { to: '/events', label: 'Events', icon: Ticket },
  { to: '/food', label: 'Food', icon: UtensilsCrossed },
]
