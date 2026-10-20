import { supabase } from './supabase'

// Fotos de perfil (almacén "avatars", supabase/05_avatars.sql).
// La foto se recorta en cuadrado por el centro y se reduce a 400×400 antes de subirla:
// así pesa unos 40 KB y se ve nítida en cualquier tamaño de la app.

const BUCKET = 'avatars'
const SIZE = 400

async function squareJpeg(file: File): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error("This photo can't be read. Please use a JPG, PNG or WebP image.")
  }
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  canvas
    .getContext('2d')!
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process the photo.'))),
      'image/jpeg',
      0.88,
    ),
  )
}

// Borra las fotos anteriores de la carpeta del usuario (menos la que se quiere conservar).
async function removeOld(userId: string, keep?: string) {
  const { data } = await supabase.storage.from(BUCKET).list(userId)
  const old = (data ?? []).map((file) => `${userId}/${file.name}`).filter((path) => path !== keep)
  if (old.length) await supabase.storage.from(BUCKET).remove(old)
}

// Sube una foto nueva y la pone como foto de perfil. Devuelve su dirección.
export async function uploadAvatar(userId: string, file: File) {
  const blob = await squareJpeg(file)
  // Un nombre nuevo cada vez: así el móvil no enseña la foto vieja guardada en caché.
  const path = `${userId}/avatar-${Date.now()}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw new Error('Could not upload the photo. Please try again.')
  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  const { error: saveError } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
  if (saveError) {
    await supabase.storage.from(BUCKET).remove([path])
    throw new Error('Could not save the photo. Please try again.')
  }
  await removeOld(userId, path)
  return url
}

// Quita la foto de perfil (vuelve la inicial).
export async function removeAvatar(userId: string) {
  const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId)
  if (error) throw new Error('Could not remove the photo. Please try again.')
  await removeOld(userId)
}
