// Pequeñas utilidades para mostrar precios y fechas.

export function formatPrice(price: number, unit?: string | null) {
  return price === 0 ? 'Free' : `${Number(price).toLocaleString('fr-FR')} €${unit ?? ''}`
}

export function formatPosted(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  return new Date(createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
