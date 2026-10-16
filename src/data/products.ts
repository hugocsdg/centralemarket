// DATOS DE EJEMPLO: no son anuncios reales.
// Se sustituirán por los anuncios guardados en Supabase.

export type Product = {
  id: number
  title: string
  price: number
  condition: 'New' | 'Like new' | 'Good' | 'Fair'
  category: string
  location: string
  description: string
  seller: string
  postedDaysAgo: number
  movingOut?: boolean
  image: string
}

export const products: Product[] = [
  {
    id: 1,
    title: 'IKEA desk lamp',
    price: 8,
    condition: 'Good',
    category: 'furniture',
    location: 'Gif-sur-Yvette',
    description: 'White adjustable desk lamp, works perfectly. Bulb included.',
    seller: 'Sample seller',
    postedDaysAgo: 1,
    movingOut: true,
    image: 'https://picsum.photos/seed/lamp/600',
  },
  {
    id: 2,
    title: 'Office chair',
    price: 25,
    condition: 'Good',
    category: 'furniture',
    location: 'Palaiseau',
    description: 'Comfortable swivel chair with adjustable height. Small mark on the seat.',
    seller: 'Sample seller',
    postedDaysAgo: 2,
    image: 'https://picsum.photos/seed/chair/600',
  },
  {
    id: 3,
    title: 'Nespresso coffee machine',
    price: 35,
    condition: 'Like new',
    category: 'kitchen',
    location: 'Gif-sur-Yvette',
    description: 'Used for one semester. Comes with 10 capsules.',
    seller: 'Sample seller',
    postedDaysAgo: 0,
    image: 'https://picsum.photos/seed/coffee/600',
  },
  {
    id: 4,
    title: 'Second-hand bicycle',
    price: 65,
    condition: 'Good',
    category: 'bikes',
    location: 'Orsay',
    description: 'City bike, 7 gears, lock included. Perfect for getting around the plateau.',
    seller: 'Sample seller',
    postedDaysAgo: 3,
    movingOut: true,
    image: 'https://picsum.photos/seed/bike/600',
  },
  {
    id: 5,
    title: 'Scientific calculator',
    price: 15,
    condition: 'Like new',
    category: 'books',
    location: 'Campus',
    description: 'Casio scientific calculator, allowed in exams.',
    seller: 'Sample seller',
    postedDaysAgo: 5,
    image: 'https://picsum.photos/seed/calc/600',
  },
  {
    id: 6,
    title: 'Kitchen essentials bundle',
    price: 20,
    condition: 'Good',
    category: 'kitchen',
    location: 'Palaiseau',
    description: 'Pan, pot, plates, glasses and cutlery for two people.',
    seller: 'Sample seller',
    postedDaysAgo: 4,
    movingOut: true,
    image: 'https://picsum.photos/seed/kitchen/600',
  },
  {
    id: 7,
    title: 'Bluetooth headphones',
    price: 25,
    condition: 'Good',
    category: 'electronics',
    location: 'Campus',
    description: 'Wireless over-ear headphones, around 20h of battery.',
    seller: 'Sample seller',
    postedDaysAgo: 6,
    image: 'https://picsum.photos/seed/headphones/600',
  },
  {
    id: 8,
    title: 'Small bookshelf',
    price: 15,
    condition: 'Like new',
    category: 'furniture',
    location: 'Orsay',
    description: 'Three-shelf bookshelf, easy to carry. 60 × 30 × 90 cm.',
    seller: 'Sample seller',
    postedDaysAgo: 7,
    image: 'https://picsum.photos/seed/shelf/600',
  },
  {
    id: 9,
    title: 'Student party ticket',
    price: 12,
    condition: 'New',
    category: 'tickets',
    location: 'Campus',
    description: 'Sample listing. Ticket resale must be allowed by the organiser.',
    seller: 'Sample seller',
    postedDaysAgo: 1,
    image: 'https://picsum.photos/seed/party/600',
  },
  {
    id: 10,
    title: 'Winter jacket (M)',
    price: 0,
    condition: 'Good',
    category: 'clothing',
    location: 'Gif-sur-Yvette',
    description: 'Warm jacket, size M. Free to whoever picks it up before Friday.',
    seller: 'Sample seller',
    postedDaysAgo: 2,
    movingOut: true,
    image: 'https://picsum.photos/seed/jacket/600',
  },
]

export function getProduct(id: number) {
  return products.find((product) => product.id === id)
}

export function formatPrice(price: number) {
  return price === 0 ? 'Free' : `${price} €`
}

export function formatPosted(daysAgo: number) {
  if (daysAgo === 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'
  return `${daysAgo} days ago`
}
