import {
  Bike,
  BookOpen,
  CookingPot,
  Dumbbell,
  HandHelping,
  Laptop,
  Package,
  Shirt,
  Sofa,
  Ticket,
  UtensilsCrossed,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type Category = {
  slug: string
  name: string
  icon: LucideIcon
  // Dibujo para la tarjeta de Explore (public/categories/<slug>.webp). Sin dibujo, se usa el icono.
  image?: string
}

export const categories: Category[] = [
  { slug: 'furniture', name: 'Furniture & Room', icon: Sofa },
  { slug: 'electronics', name: 'Electronics', icon: Laptop },
  { slug: 'kitchen', name: 'Kitchen & Appliances', icon: CookingPot },
  { slug: 'food', name: 'Food & Specialties', icon: UtensilsCrossed },
  { slug: 'tickets', name: 'Events & Tickets', icon: Ticket },
  { slug: 'clothing', name: 'Clothing', icon: Shirt },
  { slug: 'books', name: 'Books & Study', icon: BookOpen },
  { slug: 'bikes', name: 'Bikes & Transport', icon: Bike },
  { slug: 'sports', name: 'Sports & Leisure', icon: Dumbbell },
  { slug: 'services', name: 'Services', icon: HandHelping },
  { slug: 'other', name: 'Other', icon: Package },
]

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug)
}
