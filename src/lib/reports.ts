import { supabase } from './supabase'

// Denunciar un anuncio o a un usuario (tabla "reports", ver supabase/08_reports.sql).
// Desde la app solo se pueden ENVIAR: las denuncias se revisan en Supabase.
// Con 3 denuncias de personas distintas, un anuncio se oculta solo.

export type ReportTarget = { listingId: number } | { userId: string }

export type ReportReason = 'scam' | 'prohibited' | 'offensive' | 'harassment' | 'not_student' | 'spam' | 'other'

export const LISTING_REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: 'scam', label: 'Scam or fraud', hint: 'Asks for payment upfront, fake item, too good to be true' },
  { value: 'prohibited', label: 'Prohibited item', hint: 'Weapons, drugs, alcohol, stolen or dangerous things' },
  { value: 'offensive', label: 'Offensive content', hint: 'Insulting, discriminatory or sexual photos or text' },
  { value: 'spam', label: 'Spam or duplicate', hint: 'Posted many times, ads, not a real item' },
  { value: 'other', label: 'Something else', hint: 'Tell us below' },
]

export const USER_REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: 'harassment', label: 'Harassment', hint: 'Rude, threatening or unwanted messages' },
  { value: 'scam', label: 'Scam or fraud', hint: 'Did not pay, did not deliver, asked for money upfront' },
  { value: 'not_student', label: 'Not a CentraleSupélec student', hint: 'Using someone else’s account' },
  { value: 'offensive', label: 'Offensive profile', hint: 'Name or photo is insulting or inappropriate' },
  { value: 'other', label: 'Something else', hint: 'Tell us below' },
]

// Devuelve true si se envió (o si ya lo habías denunciado antes).
export async function sendReport(target: ReportTarget, reason: ReportReason, details: string) {
  const { error } = await supabase.from('reports').insert({
    ...('listingId' in target ? { listing_id: target.listingId } : { reported_user_id: target.userId }),
    reason,
    details: details.trim().slice(0, 500),
  })
  if (!error) return 'sent' as const
  if (error.code === '23505') return 'already' as const // ya lo habías denunciado
  throw new Error(
    error.message.includes('yourself') ? 'You cannot report yourself.' : 'Could not send the report. Please try again.',
  )
}
