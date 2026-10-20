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
  { slug: 'furniture', name: 'Furniture & Room', icon: Sofa, image: '/categories/furniture.webp' },
  { slug: 'electronics', name: 'Electronics', icon: Laptop, image: '/categories/electronics.webp' },
  { slug: 'kitchen', name: 'Kitchen & Appliances', icon: CookingPot, image: '/categories/kitchen.webp' },
  { slug: 'food', name: 'Food & Specialties', icon: UtensilsCrossed, image: '/categories/food.webp' },
  { slug: 'tickets', name: 'Events & Tickets', icon: Ticket, image: '/categories/tickets.webp' },
  { slug: 'clothing', name: 'Clothing', icon: Shirt, image: '/categories/clothing.webp' },
  { slug: 'books', name: 'Books & Study', icon: BookOpen, image: '/categories/books.webp' },
  { slug: 'bikes', name: 'Bikes & Transport', icon: Bike, image: '/categories/bikes.webp' },
  { slug: 'sports', name: 'Sports & Leisure', icon: Dumbbell, image: '/categories/sports.webp' },
  { slug: 'services', name: 'Services', icon: HandHelping, image: '/categories/services.webp' },
  { slug: 'other', name: 'Other', icon: Package, image: '/categories/other.webp' },
]

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug)
}
