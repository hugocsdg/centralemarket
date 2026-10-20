import { supabase } from './supabase'

// Todo lo que la web hace con los anuncios en Supabase: leer, buscar y publicar.

export type Condition = 'New' | 'Like new' | 'Good' | 'Fair'
export type ListingStatus = 'available' | 'reserved' | 'sold'

export type Listing = {
  id: number
  seller_id: string
  title: string
  description: string
  category: string
  price: number
  price_unit: string | null
  condition: Condition | null
  location: string
  status: ListingStatus
  moving_out: boolean
  created_at: string
  seller: { display_name: string; created_at: string } | null
  images: { path: string; position: number }[]
}

export const CONDITIONS: Condition[] = ['New', 'Like new', 'Good', 'Fair']
const BUCKET = 'listing-images'

// Cada anuncio viene con su vendedor y sus fotos, en una sola petición.
// "!listings_seller_id_fkey" = el perfil del VENDEDOR (desde que existe la tabla de favoritos hay
// otro camino de anuncio a perfil, el de quien lo guardó, y Supabase necesita saber cuál queremos).
export const SELECT =
  '*, seller:profiles!listings_seller_id_fkey(display_name, created_at), images:listing_images(path, position)'

export function withSortedImages(listing: Listing): Listing {
  return { ...listing, images: [...(listing.images ?? [])].sort((a, b) => a.position - b.position) }
}

export function imageUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

export type Sort = 'newest' | 'price-asc' | 'price-desc'

type ListingFilters = {
  query?: string
  category?: string
  sort?: Sort
  maxPrice?: number
  sellerId?: string
  includeSold?: boolean
  limit?: number
}

export async function fetchListings(filters: ListingFilters = {}) {
  const { query = '', category, sort = 'newest', maxPrice, sellerId, includeSold = false, limit = 60 } = filters
  let request = supabase.from('listings').select(SELECT)

  if (!includeSold) request = request.neq('status', 'sold')
  if (category) request = request.eq('category', category)
  if (sellerId) request = request.eq('seller_id', sellerId)
  if (maxPrice !== undefined) request = request.lt('price', maxPrice)

  // Buscar en título y descripción (quitamos símbolos que romperían la búsqueda).
  const text = query.trim().replace(/[%,()*"\\]/g, ' ')
  if (text) request = request.or(`title.ilike."%${text}%",description.ilike."%${text}%"`)

  if (sort === 'price-asc') request = request.order('price', { ascending: true })
  else if (sort === 'price-desc') request = request.order('price', { ascending: false })
  else request = request.order('created_at', { ascending: false })

  const { data, error } = await request.limit(limit)
  if (error) throw error
  return (data as Listing[]).map(withSortedImages)
}

export async function fetchListing(id: number) {
  const { data, error } = await supabase.from('listings').select(SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? withSortedImages(data as Listing) : null
}

// Reduce las fotos del móvil (que pueden pesar 5-10 MB) a máx. 1600 px en JPEG.
// Así suben más rápido y caben en el límite de 5 MB del almacén.
export async function prepareImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error(`"${file.name}" can't be read. Please use a JPG, PNG or WebP photo.`)
  }
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not process the photo.'))), 'image/jpeg', 0.85),
  )
}

export type NewListing = {
  title: string
  description: string
  category: string
  price: number
  price_unit: string | null
  condition: Condition | null
  location: string
  moving_out: boolean
}

// Una foto del formulario: o ya estaba subida (al editar) o es nueva del móvil/ordenador.
export type PhotoItem =
  | { kind: 'existing'; path: string; preview: string }
  | { kind: 'new'; file: File; preview: string }

// Sube fotos nuevas a la carpeta del usuario y devuelve dónde quedaron.
async function uploadPhotos(
  userId: string,
  listingId: number,
  files: File[],
  uploaded: string[],
  onProgress?: (message: string) => void,
) {
  for (const [index, file] of files.entries()) {
    onProgress?.(`Uploading photo ${index + 1} of ${files.length}…`)
    const blob = await prepareImage(file)
    // Cada usuario sube a su propia carpeta (lo exige la regla de seguridad del almacén).
    const path = `${userId}/${listingId}/${crypto.randomUUID()}.jpg`
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' })
    if (error) throw error
    uploaded.push(path)
  }
}

// Publicar: 1) crear el anuncio  2) subir las fotos  3) guardar dónde están.
// Si algo falla por el camino, se deshace todo para no dejar anuncios a medias.
export async function createListing(
  userId: string,
  listing: NewListing,
  photos: File[],
  onProgress?: (message: string) => void,
) {
  onProgress?.('Creating your listing…')
  const { data, error } = await supabase.from('listings').insert(listing).select('id').single()
  if (error) throw error
  const listingId = data.id as number
  const uploaded: string[] = []

  try {
    await uploadPhotos(userId, listingId, photos, uploaded, onProgress)
    const rows = uploaded.map((path, position) => ({ listing_id: listingId, path, position }))
    const { error: imagesError } = await supabase.from('listing_images').insert(rows)
    if (imagesError) throw imagesError
  } catch (failure) {
    if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded)
    await supabase.from('listings').delete().eq('id', listingId)
    throw failure
  }

  return listingId
}

// Editar: guardar los datos, subir las fotos nuevas, ordenar todas y borrar las que quitaste.
export async function updateListing(
  userId: string,
  listingId: number,
  listing: NewListing,
  photos: PhotoItem[],
  originalPaths: string[],
  onProgress?: (message: string) => void,
) {
  onProgress?.('Saving changes…')
  const { error } = await supabase.from('listings').update(listing).eq('id', listingId)
  if (error) throw error

  const newFiles = photos.flatMap((photo) => (photo.kind === 'new' ? [photo.file] : []))
  const uploaded: string[] = []
  try {
    await uploadPhotos(userId, listingId, newFiles, uploaded, onProgress)
  } catch (failure) {
    if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded)
    throw failure
  }

  // Orden final: tal como aparecen en el formulario.
  let next = 0
  const finalPaths = photos.map((photo) => (photo.kind === 'existing' ? photo.path : uploaded[next++]))

  onProgress?.('Updating photos…')
  const { error: deleteError } = await supabase.from('listing_images').delete().eq('listing_id', listingId)
  if (deleteError) throw deleteError
  const rows = finalPaths.map((path, position) => ({ listing_id: listingId, path, position }))
  const { error: insertError } = await supabase.from('listing_images').insert(rows)
  if (insertError) throw insertError

  const removed = originalPaths.filter((path) => !finalPaths.includes(path))
  if (removed.length) await supabase.storage.from(BUCKET).remove(removed)
}

// Cambiar a disponible, reservado o vendido.
export async function setListingStatus(listingId: number, status: ListingStatus) {
  const { error } = await supabase.from('listings').update({ status }).eq('id', listingId)
  if (error) throw error
}

// Borrar el anuncio y sus fotos. (Las conversaciones sobre él también se borran.)
export async function deleteListing(listing: Listing) {
  const { error } = await supabase.from('listings').delete().eq('id', listing.id)
  if (error) throw error
  const paths = listing.images.map((image) => image.path)
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths)
}
