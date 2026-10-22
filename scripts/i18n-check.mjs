// Comprueba las traducciones: npm run i18n
// 1) Busca todos los textos de la app (los que pasan por t()/translate() y los de listas de datos).
// 2) Mira en src/i18n/locales/*.ts cuáles faltan en cada idioma (y cuáles sobran).
// Si falta alguno, la app lo enseña en inglés: no se rompe nada, pero conviene traducirlo.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
const ROOT = new URL('../src', import.meta.url).pathname
const skip = ['i18n', 'components/intro', 'lib/campus3d.ts', 'lib/useIntroAnimations.ts', 'pages/IntroPage.tsx', 'data/campus.json', 'lib/scrub.ts']
const files = []
const walk = (dir) => readdirSync(dir).forEach((name) => {
  const p = join(dir, name)
  if (skip.some((s) => p.includes(s))) return
  if (statSync(p).isDirectory()) walk(p)
  else if (/\.tsx?$/.test(p)) files.push(p)
})
walk(ROOT)

// Lee un literal de cadena que empieza en s[i] (', " o `). Devuelve [texto, fin].
function readString(s, i) {
  const q = s[i]
  let out = ''
  let j = i + 1
  while (j < s.length && s[j] !== q) {
    if (s[j] === '\\') { out += s[j + 1]; j += 2; continue }
    if (q === '`' && s[j] === '$' && s[j + 1] === '{') return [null, j]
    out += s[j]; j++
  }
  return [out, j + 1]
}

const keys = new Map() // texto -> archivos
const add = (text, file) => {
  if (!text || !/[A-Za-z]/.test(text)) return
  if (!keys.has(text)) keys.set(text, new Set())
  keys.get(text).add(file.replace(ROOT + '/', ''))
}

// Ficheros donde TODAS las frases (con mayúscula y una minúscula) son textos para mostrar.
const dataFiles = ['data/categories.ts', 'data/spaces.ts', 'content/info.ts', 'lib/reports.ts', 'lib/account.ts', 'lib/avatars.ts', 'lib/useQuery.ts', 'lib/listings.ts']

for (const file of files) {
  const s = readFileSync(file, 'utf8')
  const rel = file.replace(ROOT + '/', '')
  // 1) t(...) y translate(...)
  const re = /\b(?:t|translate)\(/g
  let m
  while ((m = re.exec(s))) {
    let depth = 1, i = m.index + m[0].length
    const start = i
    while (i < s.length && depth > 0) {
      const c = s[i]
      if (c === "'" || c === '"' || c === '`') {
        const [text, end] = readString(s, i)
        // solo el primer argumento (antes de una coma de nivel 1) cuenta como clave
        if (text !== null && depth === 1 && !s.slice(start, i).match(/,\s*\{[^]*$/)) add(text, file)
        i = end; continue
      }
      if (c === '(' || c === '{' || c === '[') depth++
      if (c === ')' || c === '}' || c === ']') depth--
      i++
    }
  }
  // 2) listas de datos y mensajes de error
  const lines = s.split('\n')
  for (const line of lines) {
    if (/^\s*(\/\/|import)/.test(line)) continue
    const isData = dataFiles.includes(rel)
    const keyed = line.match(/\b(label|hint|title|text|cta|blurb|name|intro|body|button|eyebrow|updated):\s*(['"])/)
    const errorish = /new Error\(|onProgress\?\.\(|return ['"]|setMessage\(|\? ['"]|: ['"]/.test(line)
    if (!(isData || keyed || errorish || /LABELS|CONDITIONS|STATUS_LABEL/.test(line) || rel === 'pages/DeleteAccountPage.tsx')) continue
    const strRe = /(['"])((?:\\.|(?!\1).)*)\1/g
    let sm
    while ((sm = strRe.exec(line))) {
      const text = sm[2].replace(/\\(.)/g, '$1')
      if (/^[A-Z“"].*[a-z]/.test(text) && !/^(h-|w-|text-|bg-|flex|min-|rounded|border|absolute|relative|grid|mt-|mb-|px-|py-)/.test(text)) add(text, file)
    }
  }
}
// Valores internos que también aparecen dentro de t(…) pero no se enseñan tal cual.
const IGNORE = new Set(['buyer', 'PushManager', 'Notification', 'already', 'deleting', 'food', 'login', 'other', 'pending', 'saved', 'saving', 'sending', 'sold'])
const list = [...keys.keys()].filter((k) => !IGNORE.has(k) && !k.startsWith('Missing VITE_'))
list.push('OK') // nota de 3 estrellas (Rating.tsx)

let problems = 0
for (const lang of ['fr', 'es', 'it', 'pt']) {
  const text = readFileSync(join(ROOT, 'i18n/locales', `${lang}.ts`), 'utf8')
  const have = new Set([...text.matchAll(/^\s+("(?:\\.|[^"\\])*"): "/gm)].map((m) => JSON.parse(m[1])))
  const missing = list.filter((k) => !have.has(k))
  const extra = [...have].filter((k) => !keys.has(k) && k !== 'OK')
  console.log(`${lang}: ${have.size} traducciones, faltan ${missing.length}, sobran ${extra.length}`)
  missing.forEach((k) => console.log('   falta:', JSON.stringify(k)))
  extra.forEach((k) => console.log('   sobra:', JSON.stringify(k)))
  problems += missing.length
}
console.log(`${list.length} textos en la app.`)
process.exitCode = problems ? 1 : 0
