// Pequeñas utilidades para mostrar precios y fechas, en el idioma elegido
// ("21 oct." en francés, "21 Oct" en inglés…). Los textos pasan por translate() (ver i18n/lang.tsx).
import { currentLocale, translate as t } from '../i18n/core'

export function formatPrice(price: number, unit?: string | null) {
  return price === 0 ? t('Free') : `${Number(price).toLocaleString('fr-FR')} €${unit ?? ''}`
}

export function formatPosted(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
  if (days <= 0) return t('Today')
  if (days === 1) return t('Yesterday')
  if (days < 30) return t('{n} days ago', { n: days })
  return new Date(createdAt).toLocaleDateString(currentLocale(), { day: 'numeric', month: 'short' })
}

const shortDate = (date: Date) =>
  date.toLocaleDateString(currentLocale(), { weekday: 'short', day: 'numeric', month: 'short' })
const shortTime = (date: Date) => date.toLocaleTimeString(currentLocale(), { hour: '2-digit', minute: '2-digit' })

// "Sat 25 Oct · 22:00" (la hora de París, como el campus).
export function formatEventDate(iso: string) {
  const date = new Date(iso)
  return `${shortDate(date)} · ${shortTime(date)}`
}

// Para el "calendario" de los carteles: SAT / 25 / OCT.
export function dateBadge(iso: string) {
  const date = new Date(iso)
  const clean = (text: string) => text.replace('.', '').toUpperCase()
  return {
    weekday: clean(date.toLocaleDateString(currentLocale(), { weekday: 'short' })),
    day: date.getDate(),
    month: clean(date.toLocaleDateString(currentLocale(), { month: 'short' })),
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
  const time = shortTime(date)
  if (date < new Date()) return t('Ready now')
  if (date < startOfDay(1)) return t('Ready today at {time}', { time })
  if (date < startOfDay(2)) return t('Ready tomorrow at {time}', { time })
  return t('Ready {date} at {time}', { date: shortDate(date), time })
}
