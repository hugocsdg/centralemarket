import { supabase } from './supabase'

// Registro de errores (supabase/12_errores.sql): si la app falla en el móvil de alguien, se guarda
// qué falló y en qué pantalla, sin datos personales. Los administradores lo ven en Admin → Errors.
// - Como mucho 5 errores por visita, y el mismo error solo una vez.
// - En local (npm run dev) no se envía nada: solo se ve en la consola.

declare const __APP_VERSION__: string

const sent = new Set<string>()

export function reportError(error: unknown, where?: string) {
  const err = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error))
  const message = `${where ? `[${where}] ` : ''}${err.message || 'Unknown error'}`.slice(0, 500)
  if (sent.has(message) || sent.size >= 5) return
  sent.add(message)
  if (import.meta.env.DEV) return
  // Sin "await": si falla el envío, no hacemos nada (no queremos un error por culpa de otro).
  void supabase
    .from('client_errors')
    .insert({
      message,
      stack: err.stack?.slice(0, 4000) ?? null,
      page: location.pathname.slice(0, 300),
      user_agent: navigator.userAgent.slice(0, 300),
      app_version: __APP_VERSION__,
    })
    .then(() => {})
}

// Errores que nadie captura (en cualquier pantalla).
export function listenForErrors() {
  window.addEventListener('error', (event) => {
    // Las imágenes que no cargan (p. ej. una miniatura que falta) no son errores de la app.
    if (event.error || event.message) reportError(event.error ?? event.message, 'window')
  })
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    // Sin conexión no es un fallo de la app.
    if (reason instanceof TypeError && /fetch|network|load failed/i.test(reason.message)) return
    reportError(reason, 'promise')
  })
}

export type ClientError = {
  id: number
  message: string
  stack: string | null
  page: string | null
  user_agent: string | null
  app_version: string | null
  created_at: string
}

export async function fetchErrors() {
  const { data, error } = await supabase
    .from('client_errors')
    .select('id, message, stack, page, user_agent, app_version, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data as ClientError[]
}

export async function clearErrors(ids: number[]) {
  const { error } = await supabase.from('client_errors').delete().in('id', ids)
  if (error) throw error
}
