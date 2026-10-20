import { supabase } from './supabase'

// Valoraciones: el comprador puntúa al vendedor de 1 a 5 estrellas (supabase/06_mejoras_vinted.sql).
// Solo puede valorar quien el vendedor marcó como comprador al poner el anuncio en "Sold".

export type Review = {
  id: number
  listing_id: number
  reviewer_id: string
  seller_id: string
  rating: number
  comment: string
  created_at: string
  reviewer: { display_name: string; avatar_url: string | null } | null
  listing: { title: string } | null
}

export type Rating = { average: number; total: number }

// Nota media de un vendedor. Sin valoraciones (o sin el SQL ejecutado): null.
export async function fetchSellerRating(sellerId: string): Promise<Rating | null> {
  const { data, error } = await supabase
    .from('seller_ratings')
    .select('average, total')
    .eq('seller_id', sellerId)
    .maybeSingle()
  if (error || !data) return null
  return { average: Number(data.average), total: data.total as number }
}

export async function fetchReviews(sellerId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select(
      '*, reviewer:profiles!reviews_reviewer_id_fkey(display_name, avatar_url), listing:listings(title)',
    )
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data as unknown as Review[]
}

// Mi valoración de un anuncio que compré (para no pedirla dos veces).
export async function fetchMyReview(listingId: number, userId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment')
    .eq('listing_id', listingId)
    .eq('reviewer_id', userId)
    .maybeSingle()
  if (error) throw error
  return data as { id: number; rating: number; comment: string } | null
}

// El vendedor lo rellena la base de datos (así nadie puede valorar a otra persona).
export async function createReview(listingId: number, rating: number, comment: string) {
  const { error } = await supabase.from('reviews').insert({ listing_id: listingId, rating, comment: comment.trim() })
  if (error) throw error
}

// Quienes te escribieron por un anuncio: entre ellos eliges a quién se lo vendiste.
export async function fetchBuyers(listingId: number) {
  const { data, error } = await supabase
    .from('conversations')
    .select('buyer_id, buyer:profiles!conversations_buyer_fk(display_name, avatar_url)')
    .eq('listing_id', listingId)
    .order('last_message_at', { ascending: false })
  if (error) throw error
  return data as unknown as { buyer_id: string; buyer: { display_name: string; avatar_url: string | null } | null }[]
}
