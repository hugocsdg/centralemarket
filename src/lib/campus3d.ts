import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import campus from '../data/campus.json'

// El campus REAL de CentraleSupélec en 3D, con arcos de luz entre residencias y escuela.
// La geometría sale de OpenStreetMap (scripts/campus-from-osm.mjs → src/data/campus.json):
// cada edificio con su forma y su altura reales. © OpenStreetMap contributors.
//
// El scroll controla "state.progress" (de 0 a 1):
//   0.00–0.33  vista del campus, la cámara gira despacio
//   0.33–0.66  se encienden las residencias y salen las primeras conexiones
//   0.66–1.00  muchas conexiones a la vez, como un campus vivo
//
// Coordenadas del JSON: metros, x hacia el este, z hacia el sur. Aquí se escalan a 1/4.

export type CampusState = { progress: number }
export type CampusLabel = { id: string; text: string; kind: 'school' | 'residence' | 'place'; position: THREE.Vector3 }

type Data = typeof campus
type Building = Data['buildings'][number]

const SCALE = 0.25
const COLORS = {
  ground: 0x09090b,
  green: 0x0d1511,
  road: 0x1c1c21,
  tree: 0x16271d,
  school: 0x2a0b12,
  schoolEdge: 0xe0153f,
  residence: 0x2a2a30,
  residenceEdge: 0xd4d4d8,
  track: 0x3a0d16,
  pitch: 0x0f1d15,
  pitchLine: 0x2f4a3a,
  red: 0xe0153f,
  white: 0xf4f4f5,
}

// Generador de números "aleatorios" siempre iguales, para que el campus no cambie al recargar.
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

// Lista plana [x, z, x, z…] → forma 2D de Three.js. La z se invierte porque luego se tumba la forma.
function toPoints(flat: number[]) {
  const points: THREE.Vector2[] = []
  for (let i = 0; i < flat.length; i += 2) points.push(new THREE.Vector2(flat[i] * SCALE, -flat[i + 1] * SCALE))
  return points
}
function toShape(outer: number[], holes: number[][] = []) {
  const shape = new THREE.Shape(toPoints(outer))
  for (const hole of holes) shape.holes.push(new THREE.Path(toPoints(hole)))
  return shape
}

export class CampusScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(36, 1, 1, 1200)
  private campus = new THREE.Group()
  private links: { line: THREE.Line; curve: THREE.QuadraticBezierCurve3; packet: THREE.Mesh; offset: number; at: number }[] = []
  private beacons: { mesh: THREE.Mesh; at: number }[] = []
  private residenceMaterial!: THREE.MeshStandardMaterial
  private frame = 0
  private running = false
  private clock = new THREE.Clock()
  private canvas: HTMLCanvasElement
  private state: CampusState
  private mobile: boolean
  readonly labels: CampusLabel[] = []

  constructor(canvas: HTMLCanvasElement, state: CampusState) {
    this.canvas = canvas
    this.state = state
    this.mobile = window.innerWidth < 768
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.mobile, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mobile ? 1.25 : 1.75))
    this.scene.fog = new THREE.Fog(COLORS.ground, 190, 380)

    this.addLights()
    this.addGround()
    this.addBuildings()
    this.addLabels()
    this.addLinks()
    this.scene.add(this.campus)
    this.resize()
  }

  private addLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const moon = new THREE.DirectionalLight(0xdfe3ff, 1.1)
    moon.position.set(-60, 120, 80)
    this.scene.add(moon)
    // Resplandor rojo sobre la escuela (Eiffel, Bouygues, Bréguet).
    const glow = new THREE.PointLight(COLORS.red, 900, 140, 1.5)
    glow.position.set(40, 30, -10)
    this.scene.add(glow)
  }

  // Suelo, zonas verdes, calles, campos de deporte y árboles.
  private addGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 900),
      new THREE.MeshStandardMaterial({ color: COLORS.ground, roughness: 1 }),
    )
    ground.rotation.x = -Math.PI / 2
    this.scene.add(ground)

    const flatLayer = (geometries: THREE.BufferGeometry[], color: number, y: number) => {
      if (!geometries.length) return
      const mesh = new THREE.Mesh(mergeGeometries(geometries), new THREE.MeshStandardMaterial({ color, roughness: 1 }))
      mesh.rotation.x = -Math.PI / 2
      mesh.position.y = y
      this.campus.add(mesh)
    }

    flatLayer(campus.greens.map((g) => new THREE.ShapeGeometry(toShape(g))), COLORS.green, 0.02)

    // Calles: una cinta de ancho fijo a lo largo de cada tramo.
    const roads: THREE.BufferGeometry[] = []
    for (const road of campus.roads) {
      const half = (road.w * SCALE) / 2
      const p = toPoints(road.pts)
      for (let i = 1; i < p.length; i++) {
        const dir = p[i].clone().sub(p[i - 1]).normalize()
        const n = new THREE.Vector2(-dir.y, dir.x).multiplyScalar(half)
        const a = p[i - 1].clone().add(dir.clone().multiplyScalar(-half))
        const b = p[i].clone().add(dir.clone().multiplyScalar(half))
        roads.push(new THREE.ShapeGeometry(new THREE.Shape([a.clone().add(n), b.clone().add(n), b.clone().sub(n), a.clone().sub(n)])))
      }
    }
    flatLayer(roads, COLORS.road, 0.04)

    // Complexe sportif du Moulon: la pista roja y los campos verdes con su contorno.
    for (const field of campus.sports) {
      const isTrack = field.kind === 'track'
      flatLayer([new THREE.ShapeGeometry(toShape(field.outer, field.holes))], isTrack ? COLORS.track : COLORS.pitch, isTrack ? 0.06 : 0.05)
      const outline = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(toPoints(field.outer).map((v) => new THREE.Vector3(v.x, 0.08, -v.y))),
        new THREE.LineBasicMaterial({ color: isTrack ? COLORS.red : COLORS.pitchLine, transparent: true, opacity: isTrack ? 0.7 : 0.8 }),
      )
      this.campus.add(outline)
    }

    // Árboles: conos bajos, todos en una sola pieza (InstancedMesh) para que vaya fluido.
    const count = campus.trees.length / 2
    const trees = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1.1, 2.2, 6),
      new THREE.MeshStandardMaterial({ color: COLORS.tree, roughness: 1 }),
      count,
    )
    const random = seeded(3)
    const matrix = new THREE.Matrix4()
    for (let i = 0; i < count; i++) {
      const s = 0.75 + random() * 0.5
      matrix.makeScale(s, s, s).setPosition(campus.trees[i * 2] * SCALE, 1.1 * s, campus.trees[i * 2 + 1] * SCALE)
      trees.setMatrixAt(i, matrix)
    }
    this.campus.add(trees)
  }

  // Edificios con su planta y su altura reales. Todos los de un mismo tipo van en una sola pieza.
  private addBuildings() {
    const solids: Record<string, THREE.BufferGeometry[]> = { school: [], residence: [] }
    const edges: Record<string, THREE.BufferGeometry[]> = { school: [], residence: [] }
    for (const b of campus.buildings as Building[]) {
      const geometry = new THREE.ExtrudeGeometry(toShape(b.outer, b.holes), { depth: b.h * SCALE, bevelEnabled: false })
      geometry.rotateX(-Math.PI / 2)
      solids[b.kind].push(geometry)
      edges[b.kind].push(new THREE.EdgesGeometry(geometry, 25))
    }

    const school = new THREE.MeshStandardMaterial({
      color: COLORS.school,
      roughness: 0.6,
      metalness: 0.3,
      emissive: COLORS.red,
      emissiveIntensity: 0.18,
    })
    this.residenceMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.residence,
      roughness: 0.7,
      metalness: 0.25,
      emissive: 0xffb3a8,
      emissiveIntensity: 0,
    })
    this.campus.add(
      new THREE.Mesh(mergeGeometries(solids.school), school),
      new THREE.Mesh(mergeGeometries(solids.residence), this.residenceMaterial),
      new THREE.LineSegments(
        mergeGeometries(edges.school),
        new THREE.LineBasicMaterial({ color: COLORS.schoolEdge, transparent: true, opacity: 0.95 }),
      ),
      new THREE.LineSegments(
        mergeGeometries(edges.residence),
        new THREE.LineBasicMaterial({ color: COLORS.residenceEdge, transparent: true, opacity: 0.7 }),
      ),
    )
  }

  private addLabels() {
    for (const label of campus.labels) {
      const kind = label.id === 'sports' ? 'place' : label.id.startsWith('rez') ? 'residence' : 'school'
      this.labels.push({
        id: label.id,
        text: label.text,
        kind,
        position: new THREE.Vector3(label.x * SCALE, label.y * SCALE + 3, label.z * SCALE),
      })
    }
  }

  // Puntos sobre los tejados (residencias y escuela) unidos por arcos: compradores y vendedores.
  private addLinks() {
    const random = seeded(42)
    const roofs: THREE.Vector3[] = []
    for (const b of campus.buildings as Building[]) {
      // Uno o dos puntos por edificio, sobre un vértice de su contorno, metido un poco hacia dentro.
      const xs = b.outer.filter((_, i) => i % 2 === 0)
      const zs = b.outer.filter((_, i) => i % 2 === 1)
      const cx = xs.reduce((a, v) => a + v, 0) / xs.length
      const cz = zs.reduce((a, v) => a + v, 0) / zs.length
      const spots = b.kind === 'school' ? 2 : 1
      for (let s = 0; s < spots; s++) {
        const k = Math.floor(random() * xs.length)
        const x = cx + (xs[k] - cx) * 0.5
        const z = cz + (zs[k] - cz) * 0.5
        roofs.push(new THREE.Vector3(x * SCALE, b.h * SCALE + 0.6, z * SCALE))
      }
    }

    const dot = new THREE.SphereGeometry(0.7, 14, 10)
    for (const spot of roofs) {
      const mesh = new THREE.Mesh(dot, new THREE.MeshBasicMaterial({ color: COLORS.white, transparent: true, opacity: 0 }))
      mesh.position.copy(spot)
      mesh.scale.setScalar(0.001)
      this.campus.add(mesh)
      this.beacons.push({ mesh, at: 0.3 + random() * 0.18 })
    }

    const packetGeometry = new THREE.SphereGeometry(0.45, 10, 8)
    const linkCount = this.mobile ? 16 : 26
    for (let i = 0; i < linkCount; i++) {
      const a = roofs[Math.floor(random() * roofs.length)]
      let b = roofs[Math.floor(random() * roofs.length)]
      if (a.distanceTo(b) < 15) b = roofs[(roofs.indexOf(a) + 7) % roofs.length]
      const middle = a.clone().lerp(b, 0.5)
      middle.y = Math.max(a.y, b.y) + 6 + a.distanceTo(b) * 0.3
      const curve = new THREE.QuadraticBezierCurve3(a, middle, b)
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(60)),
        new THREE.LineBasicMaterial({ color: COLORS.red, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }),
      )
      line.geometry.setDrawRange(0, 0)
      const packet = new THREE.Mesh(packetGeometry, new THREE.MeshBasicMaterial({ color: COLORS.white }))
      packet.visible = false
      this.campus.add(line, packet)
      // Las primeras conexiones salen hacia el 40 % del scroll; las demás, poco a poco hasta el 90 %.
      this.links.push({ line, curve, packet, offset: random(), at: 0.4 + (i / linkCount) * 0.5 })
    }
  }

  resize = () => {
    const parent = this.canvas.parentElement
    if (!parent) return
    const width = parent.clientWidth
    const height = parent.clientHeight
    this.renderer.setSize(width, height, false)
    this.mobile = width < 768
    this.camera.aspect = width / height
    this.camera.fov = this.mobile ? 50 : 36
    this.camera.updateProjectionMatrix()
  }

  // Posición en pantalla (en píxeles) de un punto del campus, para colocar etiquetas encima.
  project(position: THREE.Vector3) {
    const world = position.clone().applyMatrix4(this.campus.matrixWorld)
    const projected = world.project(this.camera)
    const parent = this.canvas.parentElement!
    return {
      x: (projected.x * 0.5 + 0.5) * parent.clientWidth,
      y: (-projected.y * 0.5 + 0.5) * parent.clientHeight,
      visible: projected.z < 1,
    }
  }

  render(time: number, animate = true) {
    const p = this.state.progress
    const t = animate ? time : 0

    // Cámara: empieza alta, como un plano, y baja girando despacio.
    // Escritorio: el norte arriba y el campus a la derecha (los textos van a la izquierda).
    // Móvil: girada 90° para que el campus, que es alargado, quepa a lo alto, y por encima de los textos.
    const view = this.mobile
      ? { angle: 0.1, sweep: 0.35, radius: [175, 140], height: [205, 150], right: [0, 0], up: 42 }
      : { angle: Math.PI / 2 + 0.2, sweep: 0.5, radius: [150, 145], height: [180, 135], right: [30, 4], up: 22 }
    const angle = view.angle - p * view.sweep + t * 0.00003
    const radius = view.radius[0] + (view.radius[1] - view.radius[0]) * p
    const height = view.height[0] + (view.height[1] - view.height[0]) * p
    const toCamera = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle))
    const right = new THREE.Vector3(Math.sin(angle), 0, -Math.cos(angle))
    const shift = view.right[0] + (view.right[1] - view.right[0]) * p
    const target = toCamera.clone().multiplyScalar(view.up).addScaledVector(right, -shift)
    this.camera.position.copy(target).addScaledVector(toCamera, radius).setY(height)
    this.camera.lookAt(target)
    const fog = this.scene.fog as THREE.Fog
    fog.near = Math.hypot(radius, height) * 0.95
    fog.far = Math.hypot(radius, height) * 1.9

    // Las residencias se encienden poco a poco (cada luz, un anuncio nuevo).
    this.residenceMaterial.emissiveIntensity = Math.min(1, Math.max(0, (p - 0.25) / 0.3)) * 0.12

    // Puntos sobre los tejados: aparecen con un pequeño rebote y "laten".
    for (const beacon of this.beacons) {
      const k = Math.min(1, Math.max(0, (p - beacon.at) / 0.08))
      const pulse = 1 + Math.sin(t * 0.004 + beacon.at * 40) * 0.15
      beacon.mesh.scale.setScalar(Math.max(0.001, k * pulse))
      ;(beacon.mesh.material as THREE.MeshBasicMaterial).opacity = k
    }

    // Conexiones: el arco se dibuja de un extremo a otro; luego un destello viaja por él.
    for (const link of this.links) {
      const k = Math.min(1, Math.max(0, (p - link.at) / 0.1))
      link.line.geometry.setDrawRange(0, Math.floor(k * 61))
      link.packet.visible = k >= 1
      if (link.packet.visible) {
        const u = (t * 0.00035 + link.offset) % 1
        link.packet.position.copy(link.curve.getPoint(u))
      }
    }

    this.renderer.render(this.scene, this.camera)
  }

  start(onFrame?: () => void) {
    if (this.running) return
    this.running = true
    const loop = () => {
      if (!this.running) return
      this.render(this.clock.getElapsedTime() * 1000)
      onFrame?.()
      this.frame = requestAnimationFrame(loop)
    }
    this.frame = requestAnimationFrame(loop)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.frame)
  }

  dispose() {
    this.stop()
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        object.geometry.dispose()
        const material = object.material as THREE.Material | THREE.Material[]
        if (Array.isArray(material)) material.forEach((m) => m.dispose())
        else material.dispose()
      }
    })
    this.renderer.dispose()
  }
}
