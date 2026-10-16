import { createClient } from '@supabase/supabase-js'

// La URL y la clave pública vienen de variables de entorno:
// - en tu Mac, del archivo .env.local (no se sube a GitHub)
// - en Vercel, de Settings → Environment Variables
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. See .env.example')
}

// "supabase" es el teléfono con el que la web llama a la base de datos.
export const supabase = createClient(url, key)
