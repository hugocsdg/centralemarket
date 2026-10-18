// Convierte los datos de OpenStreetMap del campus en un JSON pequeño para el mapa 3D de la intro.
// Se ejecuta a mano, una sola vez (la web nunca llama a OpenStreetMap):
//
//   node scripts/campus-from-osm.mjs              → descarga la zona con la API oficial de OSM
//   node scripts/campus-from-osm.mjs map.json     → usa un archivo ya descargado
//
// Resultado: src/data/campus.json. Coordenadas en metros: x hacia el este, z hacia el sur
// (como en Three.js), con el origen en el centro de nuestro campus.
// Datos © OpenStreetMap contributors (licencia ODbL): el crédito va en el pie de la intro.

import { readFileSync, writeFileSync } from 'node:fs'

const BBOX = '2.1580,48.7060,2.1715,48.7118'
const API = `https://api.openstreetmap.org/api/0.6/map.json?bbox=${BBOX}`
const OUT = new URL('../src/data/campus.json', import.meta.url)

// Edificios de CentraleSupélec y residencias (ids de OSM). "r" = relación (edificio con patios).
const CAMPUS = [
  { group: 'eiffel', kind: 'school', ids: ['w384147589'] },
  { group: 'bouygues', kind: 'school', ids: ['r13271105', 'w785429898'] },
  { group: 'breguet', kind: 'school', ids: ['r170743'] },
  { group: 'rez1', kind: 'residence', ids: ['w63455658'] },
  { group: 'rez2', kind: 'residence', ids: ['w63450352', 'w63429464', 'w63452837', 'w63437393'] },
  { group: 'rez3', kind: 'residence', ids: ['w158435543'] },
  {
    group: 'rez4',
    kind: 'residence',
    ids: ['w685010994', 'w515541369', 'w520533871', 'w520533870', 'w520533867', 'w520533869', 'w515541368',
      'w515541370', 'w515541376', 'w515541374', 'w515541373', 'w515541372'],
  },
  { group: 'rez5', kind: 'residence', ids: ['w550700050'] },
  { group: 'rez6', kind: 'residence', ids: ['w758213433', 'w758213434', 'w1227785407', 'w1227785408'] },
]

// Complexe sportif du Moulon: la pista de atletismo y los campos de alrededor.
const SPORTS = ['r3169488', 'w1366265218', 'w235440700', 'w235440704', 'w235440706', 'w376517474']
const ROADS = ['Rue Joliot-Curie', 'Chemin du Moulon', 'Rue Sébastienne Guyot', 'Mail Pierre Potier', 'Rue Pierre Potier']
const GREEN = new Set(['grass', 'park', 'garden', 'meadow', 'grassland', 'wood', 'forest'])

const raw = process.argv[2]
  ? JSON.parse(readFileSync(process.argv[2], 'utf8'))
  : await (await fetch(API, { headers: { 'User-Agent': 'CentraleMarket build script' } })).json()

const nodes = new Map()
const ways = new Map()
const relations = new Map()
for (const e of raw.elements) {
  if (e.type === 'node') nodes.set(e.id, e)
  else if (e.type === 'way') ways.set(e.id, e)
  else relations.set(e.id, e)
}

// Latitud/longitud → metros (proyección local, de sobra precisa para 1 km).
const LAT0 = 48.709
const LON0 = 2.164
const R = 6378137
const toXY = (n) => [
  ((n.lon - LON0) * Math.PI * R * Math.cos((LAT0 * Math.PI) / 180)) / 180,
  ((n.lat - LAT0) * Math.PI * R) / 180,
]
const ringOf = (way) => way.nodes.map((id) => nodes.get(id)).filter(Boolean).map(toXY)

// Quitar puntos que no cambian la forma (Douglas-Peucker).
function simplify(points, tolerance) {
  if (points.length < 4) return points
  // Contorno cerrado (empieza y acaba en el mismo punto): partirlo por el punto más lejano.
  const [fx, fy] = points[0]
  const [lx, ly] = points.at(-1)
  if (fx === lx && fy === ly) {
    let far = 1
    for (let i = 1; i < points.length - 1; i++) {
      if (Math.hypot(points[i][0] - fx, points[i][1] - fy) > Math.hypot(points[far][0] - fx, points[far][1] - fy)) far = i
    }
    return [...simplify(points.slice(0, far + 1), tolerance), ...simplify(points.slice(far), tolerance).slice(1)]
  }
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    const [ax, ay] = points[a]
    const [bx, by] = points[b]
    const len = Math.hypot(bx - ax, by - ay) || 1
    let max = 0
    let index = -1
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - points[i][1]) - (ax - points[i][0]) * (by - ay)) / len
      if (d > max) [max, index] = [d, i]
    }
    if (max > tolerance && index > 0) {
      keep[index] = 1
      stack.push([a, index], [index, b])
    }
  }
  return points.filter((_, i) => keep[i])
}

// Polígonos de una pieza de OSM: cada contorno exterior con sus patios (holes).
function polygonsOf(ref) {
  const id = Number(ref.slice(1))
  if (ref[0] === 'w') {
    const way = ways.get(id)
    return way ? [{ outer: ringOf(way), holes: [], tags: way.tags ?? {} }] : []
  }
  const rel = relations.get(id)
  if (!rel) return []
  const outer = rel.members.filter((m) => m.role === 'outer').map((m) => ways.get(m.ref)).filter(Boolean)
  const inner = rel.members.filter((m) => m.role === 'inner').map((m) => ways.get(m.ref)).filter(Boolean)
  return outer.map((w) => ({ outer: ringOf(w), holes: inner.map(ringOf), tags: rel.tags ?? {} }))
}

const heightOf = (tags) =>
  Number(tags.height) || (Number(tags['building:levels']) || 3) * 3.2

const buildingsRaw = []
for (const { group, kind, ids } of CAMPUS) {
  for (const ref of ids) {
    for (const poly of polygonsOf(ref)) {
      if (!poly.outer.length) throw new Error(`Falta la geometría de ${ref}`)
      buildingsRaw.push({ group, kind, ref, h: heightOf(poly.tags), ...poly })
    }
  }
}

// Origen y límites: el centro de nuestros edificios, con un margen alrededor.
const all = buildingsRaw.flatMap((b) => b.outer)
const minX = Math.min(...all.map((p) => p[0]))
const maxX = Math.max(...all.map((p) => p[0]))
const minY = Math.min(...all.map((p) => p[1]))
const maxY = Math.max(...all.map((p) => p[1]))
const cx = (minX + maxX) / 2
const cy = (minY + maxY) / 2
const MARGIN = 70
const box = { x0: minX - cx - MARGIN, x1: maxX - cx + MARGIN, z0: -(maxY - cy) - MARGIN, z1: -(minY - cy) + MARGIN }

// Pasar a coordenadas finales (x este, z sur) con 1 decimal, y aplanar para que ocupe poco.
const local = ([x, y]) => [Math.round((x - cx) * 10) / 10, Math.round(-(y - cy) * 10) / 10]
const flat = (points) => points.flatMap(local)
// Contorno sin repetir el primer punto al final (así lo espera Three.js).
const open = (points) => (points.length > 1 && points[0][0] === points.at(-1)[0] && points[0][1] === points.at(-1)[1] ? points.slice(0, -1) : points)
const inBox = ([x, z]) => x >= box.x0 && x <= box.x1 && z >= box.z0 && z <= box.z1

// Recortar un polígono al rectángulo del mapa (Sutherland-Hodgman).
function clipPolygon(points) {
  let out = points.map(local)
  const edges = [
    [(p) => p[0] >= box.x0, (a, b) => cut(a, b, 0, box.x0)],
    [(p) => p[0] <= box.x1, (a, b) => cut(a, b, 0, box.x1)],
    [(p) => p[1] >= box.z0, (a, b) => cut(a, b, 1, box.z0)],
    [(p) => p[1] <= box.z1, (a, b) => cut(a, b, 1, box.z1)],
  ]
  for (const [inside, intersect] of edges) {
    const input = out
    out = []
    for (let i = 0; i < input.length; i++) {
      const cur = input[i]
      const prev = input[(i + input.length - 1) % input.length]
      if (inside(cur)) {
        if (!inside(prev)) out.push(intersect(prev, cur))
        out.push(cur)
      } else if (inside(prev)) out.push(intersect(prev, cur))
    }
    if (!out.length) break
  }
  return out
}
function cut(a, b, axis, value) {
  const t = (value - a[axis]) / (b[axis] - a[axis])
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t].map((v) => Math.round(v * 10) / 10)
}

const buildings = buildingsRaw.map((b) => ({
  group: b.group,
  kind: b.kind,
  h: Math.round(b.h * 10) / 10,
  outer: flat(open(simplify(b.outer, 0.6))),
  holes: b.holes.map((ring) => flat(open(simplify(ring, 0.6)))),
}))

const sports = SPORTS.flatMap((ref) =>
  polygonsOf(ref).map((p) => ({
    kind: p.tags.leisure === 'track' ? 'track' : 'pitch',
    outer: flat(open(simplify(p.outer, 0.6))),
    holes: p.holes.map((ring) => flat(open(simplify(ring, 0.6)))),
  })),
)

const greens = []
for (const way of ways.values()) {
  const t = way.tags ?? {}
  if (!GREEN.has(t.landuse) && !GREEN.has(t.leisure) && !GREEN.has(t.natural)) continue
  if (way.nodes[0] !== way.nodes.at(-1)) continue
  const clipped = clipPolygon(open(simplify(ringOf(way), 2)))
  if (clipped.length >= 3) greens.push(clipped.flat())
}

const roads = []
for (const way of ways.values()) {
  const t = way.tags ?? {}
  if (!t.highway || !ROADS.includes(t.name)) continue
  const pts = simplify(ringOf(way), 1.5).map(local)
  // Cortar en tramos que quedan dentro del mapa.
  let run = []
  for (const p of pts) {
    if (inBox(p)) run.push(p)
    else {
      if (run.length > 1) roads.push({ name: t.name, w: t.highway === 'pedestrian' ? 4 : 7, pts: run.flat() })
      run = []
    }
  }
  if (run.length > 1) roads.push({ name: t.name, w: t.highway === 'pedestrian' ? 4 : 7, pts: run.flat() })
}

// Árboles: los sueltos y los de las hileras (uno cada 9 m).
const trees = []
for (const n of nodes.values()) {
  if (n.tags?.natural !== 'tree') continue
  const p = local(toXY(n))
  if (inBox(p)) trees.push(...p)
}
for (const way of ways.values()) {
  if (way.tags?.natural !== 'tree_row') continue
  const pts = ringOf(way)
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]]
    const steps = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 9))
    for (let s = 0; s < steps; s++) {
      const p = local([a[0] + ((b[0] - a[0]) * s) / steps, a[1] + ((b[1] - a[1]) * s) / steps])
      if (inBox(p)) trees.push(...p)
    }
  }
}

// Etiquetas en el centro real de cada grupo, encima del edificio más alto del grupo.
const LABELS = { eiffel: 'Bâtiment Eiffel', bouygues: 'Bouygues', breguet: 'Bréguet', rez1: 'Rés. I', rez2: 'Rés. II', rez3: 'Rés. III', rez4: 'Rés. IV', rez5: 'Rés. V', rez6: 'Rés. VI' }
const labels = Object.entries(LABELS).map(([group, text]) => {
  const parts = buildings.filter((b) => b.group === group)
  const xs = parts.flatMap((b) => b.outer.filter((_, i) => i % 2 === 0))
  const zs = parts.flatMap((b) => b.outer.filter((_, i) => i % 2 === 1))
  const x = (Math.min(...xs) + Math.max(...xs)) / 2
  const z = (Math.min(...zs) + Math.max(...zs)) / 2
  return { id: group, text, x: Math.round(x), z: Math.round(z), y: Math.max(...parts.map((b) => b.h)) }
})
const track = sports.find((s) => s.kind === 'track')
const tx = track.outer.filter((_, i) => i % 2 === 0)
const tz = track.outer.filter((_, i) => i % 2 === 1)
labels.push({
  id: 'sports',
  text: 'Moulon sports',
  x: Math.round((Math.min(...tx) + Math.max(...tx)) / 2),
  z: Math.round((Math.min(...tz) + Math.max(...tz)) / 2),
  y: 2,
})

const round = (v) => Math.round(v)
const data = {
  attribution: '© OpenStreetMap contributors (ODbL)',
  bounds: { x0: round(box.x0), x1: round(box.x1), z0: round(box.z0), z1: round(box.z1) },
  buildings,
  sports,
  greens,
  roads,
  trees,
  labels,
}
writeFileSync(OUT, JSON.stringify(data))
console.log(
  `campus.json: ${buildings.length} edificios, ${sports.length} campos, ${greens.length} zonas verdes, ` +
    `${roads.length} tramos de calle, ${trees.length / 2} árboles, ${(JSON.stringify(data).length / 1024).toFixed(1)} KB`,
)
