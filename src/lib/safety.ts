// Pequeñas piezas de seguridad que usan varias pantallas.

// Después de entrar, volver solo a páginas de NUESTRA app. Así nadie puede mandar un enlace tipo
// /login?next=https://web-falsa.com para llevarte a una web de estafa justo después de iniciar sesión.
export function safeNext(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/'
  return value
}

// ¿Este texto lleva un enlace? (mismo criterio que has_link() en supabase/13_antiabuso.sql)
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|fr|net|org|io|co|me|ly|link|site|online|xyz|info|app|shop|top|click)\b)/i
export function hasLink(text: string) {
  return LINK.test(text)
}

// Los límites antiabuso de la base de datos (13_antiabuso.sql y 11_admin.sql) devuelven errores en inglés:
// aquí se convierten en un texto claro (que luego se traduce con t()). null = otro error.
export function limitMessage(error: unknown) {
  const text = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : String(error)
  if (/too many new chats/i.test(text)) return 'You’ve started many chats in a short time. Please try again in a while.'
  if (/sending messages too fast/i.test(text)) return 'You’re sending messages too fast. Please wait a moment.'
  if (/can.t send links/i.test(text)) return 'For safety, new accounts can’t send links during their first 24 hours.'
  if (/20 listings per day/i.test(text)) return 'You can publish up to 20 listings per day.'
  if (/banned or blocked/i.test(text)) return 'You can’t message this person.'
  return null
}
