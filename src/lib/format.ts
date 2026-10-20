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

// "Sat 25 Oct · 22:00" (la hora de París, como el campus).
export function formatEventDate(iso: string) {
  const date = new Date(iso)
  const day = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${day} · ${time}`
}

// Para el "calendario" de los carteles: SAT / 25 / OCT.
export function dateBadge(iso: string) {
  const date = new Date(iso)
  return {
    weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(),
    day: date.getDate(),
    month: date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
  }
}

// Medianoche de hoy + "days" días (para agrupar por días).
export function startOfDay(days = 0) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date
}

// "Ready today at 19:00", "Ready tomorrow at 12:30", "Ready Sat 25 Oct at 13:00".
export function formatReady(iso: string) {
  const date = new Date(iso)
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (date < new Date()) return 'Ready now'
  if (date < startOfDay(1)) return `Ready today at ${time}`
  if (date < startOfDay(2)) return `Ready tomorrow at ${time}`
  return `Ready ${date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at ${time}`
}
