import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type Profile = {
  id: string
  display_name: string
  avatar_url: string | null
  whatsapp: string | null
  created_at: string
  // Cuenta suspendida por un administrador (supabase/11_admin.sql): no puede publicar ni escribir.
  banned_at?: string | null
  ban_reason?: string | null
}

export type AuthState = {
  session: Session | null
  profile: Profile | null
  // true mientras se comprueba si ya había una sesión abierta
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

// Dominios aceptados. Debe coincidir con la tabla allowed_email_domains de Supabase,
// que es la que manda de verdad: esto solo sirve para avisar antes en el formulario.
export const ALLOWED_DOMAINS = ['student-cs.fr']

export function isAllowedEmail(email: string) {
  const domain = email.trim().toLowerCase().split('@')[1]
  return ALLOWED_DOMAINS.includes(domain)
}

// Para usar la sesión desde cualquier componente: const { session, profile } = useAuth()
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
