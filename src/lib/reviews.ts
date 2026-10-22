import { supabase } from './supabase'

// Valoraciones de 1 a 5 estrellas, en los dos sentidos (supabase/07_mejoras_vinted.sql y 10_valoraciones_dobles.sql):
// cuando el vendedor marca un anuncio como "vendido a" alguien, el comprador valora al vendedor
// (role 'seller') y el vendedor al comprador (role 'buyer'). Una vez cada uno.

export type Review = {
  id: number
  listing_id: number
  reviewer_id: string
  seller_id: string
  // A quién se valora y en qué papel (como vendedor o como comprador).
  reviewee_id: string
  role: 'seller' | 'buyer'
  rating: number
  comment: string
  created_at: string
  reviewer: { display_name: string; avatar_url: string | null } | null
  listing: { title: string } | null
}

export type Rating = { average: number; total: number }

// Detalle para el perfil: nota total, como vendedor, como comprador y cuántas de cada estrella.
export type RatingDetail = Rating & {
  seller: Rating | null
  buyer: Rating | null
  stars: Record<1 | 2 | 3 | 4 | 5, number>
}

export async function fetchRatingDetail(userId: string): Promise<RatingDetail | null> {
  const { data, error } = await supabase.from('user_ratings').select('*').eq('user_id', userId).maybeSingle()
  if (error || !data) return null
  const part = (average: unknown, total: number) => (total ? { average: Number(average), total } : null)
  return {
    average: Number(data.average),
    total: data.total,
    seller: part(data.seller_average, data.seller_total),
    buyer: part(data.buyer_average, data.buyer_total),
    stars: { 5: data.stars_5, 4: data.stars_4, 3: data.stars_3, 2: data.stars_2, 1: data.stars_1 },
  }
}

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

// Las valoraciones que ha recibido una persona (como vendedora y como compradora).
export async function fetchReviews(userId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select(
      '*, reviewer:profiles!reviews_reviewer_id_fkey(display_name, avatar_url), listing:listings(title)',
    )
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data as unknown as Review[]
}

// Mi valoración de una venta en la que participé (para no pedirla dos veces).
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

// A quién se valora lo decide la base de datos (así nadie puede valorar a quien quiera).
export async function createReview(listingId: number, rating: number, comment: string) {
  const { error } = await supabase.from('reviews').insert({ listing_id: listingId, rating, comment: comment.trim() })
  if (error) throw error
}

// El nombre de una persona (p. ej. a quién le vendiste algo, para valorarle).
export async function fetchPersonName(userId: string) {
  const { data } = await supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle()
  return (data?.display_name as string | undefined) ?? null
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
