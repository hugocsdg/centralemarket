import { supabase } from './supabase'

// Borrar la cuenta (supabase/06_delete_account.sql).
// 1. Borra los archivos de fotos del usuario (anuncios y foto de perfil): la base de datos no
//    puede borrar archivos del almacén por su cuenta.
// 2. Llama a delete_my_account(), que borra el usuario y, en cadena, todo lo suyo.
// 3. Cierra la sesión en este móvil u ordenador.

// Borra todos los archivos de una carpeta, también los de sus subcarpetas
// (las fotos de anuncios van en <usuario>/<anuncio>/foto.jpg).
async function emptyFolder(bucket: string, folder: string, depth = 0): Promise<void> {
  if (depth > 3) return
  // El almacén devuelve los archivos de 100 en 100: repetimos hasta vaciar la carpeta.
  for (let round = 0; round < 50; round++) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: 100 })
    if (error || !data || data.length === 0) return
    // Las subcarpetas vienen sin "id"; los archivos, con él.
    const files = data.filter((entry) => entry.id !== null).map((file) => `${folder}/${file.name}`)
    const subfolders = data.filter((entry) => entry.id === null)
    for (const sub of subfolders) await emptyFolder(bucket, `${folder}/${sub.name}`, depth + 1)
    if (files.length) {
      const { error: removeError } = await supabase.storage.from(bucket).remove(files)
      if (removeError) return
    }
    if (files.length === 0) return // solo había subcarpetas, ya vaciadas
  }
}

export async function deleteAccount(userId: string) {
  await emptyFolder('listing-images', userId)
  await emptyFolder('avatars', userId)
  const { error } = await supabase.rpc('delete_my_account')
  if (error) throw new Error('Could not delete your account. Please try again.')
  // El usuario ya no existe: cerramos la sesión solo en este dispositivo.
  await supabase.auth.signOut({ scope: 'local' })
}
