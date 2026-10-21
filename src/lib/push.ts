import { supabase } from './supabase'
import { isIOS, isInstalled } from './install'

// Notificaciones en el móvil (push).
// 1. Al pulsar "Turn on", el navegador pide permiso y nos da una "dirección" de este dispositivo.
// 2. La guardamos en Supabase (push_subscriptions) con el idioma de la app.
// 3. Cuando llega un mensaje o un aviso, la función supabase/functions/send-push envía la notificación
//    a esa dirección, y public/sw.js la enseña aunque la app esté cerrada.
// En iPhone solo funciona con la app instalada en la pantalla de inicio (iOS 16.4 o más nuevo).

// Clave pública (la privada está solo en Supabase). Debe ser la misma que en send-push/index.ts.
const VAPID_PUBLIC_KEY = 'BF3F57aukon69Yw_2d2yBLdPrTzZQ7BSxmBC6CZ1OTJ16iTBE4llyqHrBy9hZrsVtp1WDE7uhBmuguevXU_RnK8'

export type PushState = 'unsupported' | 'install-first' | 'denied' | 'off' | 'on'

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register('/sw.js'))
}

async function currentSubscription() {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration()
  return (await reg?.pushManager.getSubscription()) ?? null
}

export async function getPushState(): Promise<PushState> {
  if (!pushSupported()) return isIOS() && !isInstalled() ? 'install-first' : 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  return (await currentSubscription()) && Notification.permission === 'granted' ? 'on' : 'off'
}

function keyBytes(base64url: string) {
  const base = base64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (base64url.length % 4)) % 4)
  return Uint8Array.from(atob(base), (char) => char.charCodeAt(0))
}

async function save(subscription: PushSubscription, lang: string) {
  const json = subscription.toJSON()
  const { error } = await supabase.rpc('save_push_subscription', {
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh ?? '',
    auth: json.keys?.auth ?? '',
    lang,
  })
  if (error) throw new Error('Could not turn on notifications. Please try again.')
}

// Activar en este dispositivo. Tiene que llamarse al pulsar un botón (el iPhone lo exige).
export async function enablePush(lang: string): Promise<PushState> {
  if (!pushSupported()) return getPushState()
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'
  const reg = await registration()
  await navigator.serviceWorker.ready
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }))
  await save(subscription, lang)
  return 'on'
}

// Desactivar en este dispositivo (los demás dispositivos siguen recibiendo).
export async function disablePush(): Promise<PushState> {
  const subscription = await currentSubscription()
  if (subscription) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
    await subscription.unsubscribe()
  }
  return getPushState()
}

// Si cambias el idioma de la app, los avisos llegan en el idioma nuevo.
export async function syncPushLanguage(lang: string) {
  try {
    const subscription = await currentSubscription()
    if (subscription && Notification.permission === 'granted') await save(subscription, lang)
  } catch {
    // Sin conexión o sin sesión: se actualizará la próxima vez.
  }
}

// ---------- Ajustes: qué avisos quiere cada uno ----------

export const PREF_KEYS = [
  'messages',
  'price_drops',
  'back_available',
  'saved_searches',
  'offer_reminders',
  'reviews',
  'event_reminders',
  'likes',
  'listing_tips',
] as const

export type PrefKey = (typeof PREF_KEYS)[number] | 'quiet_hours'
export type Prefs = Record<PrefKey, boolean>

export const DEFAULT_PREFS = Object.fromEntries([...PREF_KEYS, 'quiet_hours'].map((key) => [key, true])) as Prefs

export async function fetchPrefs(): Promise<Prefs> {
  const { data, error } = await supabase.from('notification_prefs').select('*').maybeSingle()
  if (error) throw error
  return { ...DEFAULT_PREFS, ...(data ?? {}) }
}

export async function savePref(key: PrefKey, value: boolean) {
  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user.id
  if (!userId) throw new Error('Not signed in')
  const { error } = await supabase
    .from('notification_prefs')
    .upsert({ user_id: userId, [key]: value, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}
