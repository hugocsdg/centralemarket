import * as THREE from 'three'

// Recreación 3D (aproximada y estilizada) del campus de CentraleSupélec en Paris-Saclay,
// con estudiantes (puntos de luz) y arcos que unen a compradores y vendedores.
//
// El scroll controla "state.progress" (de 0 a 1):
//   0.00–0.33  vista del campus, la cámara gira
//   0.33–0.66  aparecen los estudiantes y se dibujan las conexiones
//   0.66–1.00  muchas conexiones a la vez, como un campus vivo
//
// Coordenadas: el eje X sigue la Avenue des Sciences (que en el mapa va en diagonal);
// todo el campus se gira al final para que quede como en el mapa.

export type CampusState = { progress: number }
export type CampusLabel = { id: string; position: THREE.Vector3 }

const COLORS = {
  ground: 0x0b0b0d,
  road: 0x1c1c20,
  building: 0x1d1d22,
  edge: 0x8a8a93,
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

export class CampusScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400)
  private campus = new THREE.Group()
  private links: { line: THREE.Line; curve: THREE.QuadraticBezierCurve3; packet: THREE.Mesh; offset: number; at: number }[] = []
  private people: { mesh: THREE.Mesh; at: number }[] = []
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
    this.scene.fog = new THREE.Fog(COLORS.ground, 130, 280)

    this.addLights()
    this.addGround()
    this.addCampus()
    this.addPeopleAndLinks()
    this.campus.rotation.y = -0.55 // girar como en el mapa
    this.scene.add(this.campus)
    this.resize()
  }

  private addLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const sun = new THREE.DirectionalLight(0xffffff, 1.3)
    sun.position.set(-40, 60, 30)
    this.scene.add(sun)
    const glow = new THREE.PointLight(COLORS.red, 600, 120, 1.6)
    glow.position.set(8, 25, -6)
    this.scene.add(glow)
  }

  private addGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshStandardMaterial({ color: COLORS.ground, roughness: 1 }),
    )
    ground.rotation.x = -Math.PI / 2
    this.scene.add(ground)

    const grid = new THREE.GridHelper(220, 88, 0x3a0a14, 0x1a1a1e)
    ;(grid.material as THREE.Material).transparent = true
    ;(grid.material as THREE.Material).opacity = 0.55
    grid.position.y = 0.01
    this.scene.add(grid)
  }

  private road(x: number, z: number, length: number, width: number, angle = 0) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(length, width),
      new THREE.MeshStandardMaterial({ color: COLORS.road, roughness: 0.9 }),
    )
    mesh.rotation.x = -Math.PI / 2
    mesh.rotation.z = angle
    mesh.position.set(x, 0.03, z)
    this.campus.add(mesh)
  }

  private building(x: number, z: number, w: number, d: number, h: number, accent = false) {
    const geometry = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: COLORS.building,
        roughness: 0.7,
        metalness: 0.3,
        emissive: accent ? COLORS.red : 0x000000,
        emissiveIntensity: accent ? 0.12 : 0,
      }),
    )
    mesh.position.set(x, h / 2, z)
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: accent ? COLORS.red : COLORS.edge, transparent: true, opacity: accent ? 1 : 0.7 }),
    )
    edges.position.copy(mesh.position)
    this.campus.add(mesh, edges)
  }

  private addCampus() {
    const random = seeded(7)

    // Carreteras: la Avenue des Sciences, la calle paralela y algunas transversales.
    this.road(0, 0, 150, 2.6) // Avenue des Sciences
    this.road(-6, 13, 110, 1.6) // calle paralela al sur
    this.road(-6, -14, 120, 1.4) // calle al norte
    for (const x of [-34, -12, 14, 34]) this.road(x, 0, 30, 1.2, Math.PI / 2)
    // Gran vía al norte (N118), en curva suave
    for (let i = 0; i < 12; i++) {
      const t = i / 11
      this.road(-60 + t * 120, -38 - Math.sin(t * Math.PI) * 6, 12, 2.2, Math.cos(t * Math.PI) * 0.12)
    }

    // Banda principal de la escuela a ambos lados de la avenida.
    for (let x = -48; x < 48; x += 4 + random() * 4) {
      for (const side of [-1, 1]) {
        if (random() < 0.18) continue
        const w = 3 + random() * 5
        const d = 3 + random() * 5
        const h = 1.5 + random() * (side < 0 ? 6 : 4)
        this.building(x, side * (4 + d / 2 + random() * 3), w, d, h)
      }
    }

    // Bâtiment Eiffel: el grande, destacado en rojo.
    this.building(10, -8, 16, 7, 9, true)
    this.labels.push({ id: 'eiffel', position: new THREE.Vector3(10, 11, -8) })

    // Edificios más altos de investigación hacia el oeste.
    this.building(-30, -9, 9, 6, 7)
    this.building(-38, -7, 6, 6, 5)

    // Barrio del Moulon (residencias y tiendas): bloques pequeños al suroeste.
    for (let x = -46; x < -18; x += 4) {
      for (let z = 16; z < 32; z += 4) {
        if (random() < 0.25) continue
        this.building(x + random(), z + random(), 2.5 + random() * 1.5, 2.5 + random() * 1.5, 1 + random() * 2.5)
      }
    }
    this.labels.push({ id: 'moulon', position: new THREE.Vector3(-32, 5, 24) })

    // Campo de deporte con su pista.
    const field = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 10),
      new THREE.MeshStandardMaterial({ color: 0x101a13, roughness: 1 }),
    )
    field.rotation.x = -Math.PI / 2
    field.position.set(28, 0.04, 24)
    this.campus.add(field)
    const track = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        new THREE.EllipseCurve(0, 0, 10.5, 6, 0, Math.PI * 2).getPoints(64).map((p) => new THREE.Vector3(p.x, 0, p.y)),
      ),
      new THREE.LineBasicMaterial({ color: COLORS.red, transparent: true, opacity: 0.8 }),
    )
    track.position.set(28, 0.06, 24)
    this.campus.add(track)
    this.labels.push({ id: 'sports', position: new THREE.Vector3(28, 3, 24) })

    // Estanque
    const pond = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 32),
      new THREE.MeshStandardMaterial({ color: 0x1b1b2e, roughness: 0.2, metalness: 0.6 }),
    )
    pond.rotation.x = -Math.PI / 2
    pond.position.set(-16, 0.05, 18)
    this.campus.add(pond)
  }

  private addPeopleAndLinks() {
    const random = seeded(42)
    const count = this.mobile ? 18 : 28
    const spots: THREE.Vector3[] = []
    const dotGeometry = new THREE.SphereGeometry(0.45, 16, 12)

    for (let i = 0; i < count; i++) {
      const spot = new THREE.Vector3(-44 + random() * 88, 0.6, -18 + random() * 48)
      spots.push(spot)
      const mesh = new THREE.Mesh(
        dotGeometry,
        new THREE.MeshBasicMaterial({ color: random() < 0.5 ? COLORS.red : COLORS.white, transparent: true, opacity: 0 }),
      )
      mesh.position.copy(spot)
      mesh.scale.setScalar(0.001)
      this.campus.add(mesh)
      this.people.push({ mesh, at: 0.3 + random() * 0.2 }) // cuándo aparece (progreso del scroll)
    }

    const packetGeometry = new THREE.SphereGeometry(0.3, 10, 8)
    const linkCount = this.mobile ? 16 : 26
    for (let i = 0; i < linkCount; i++) {
      const a = spots[Math.floor(random() * spots.length)]
      let b = spots[Math.floor(random() * spots.length)]
      if (a === b) b = spots[(spots.indexOf(a) + 3) % spots.length]
      const distance = a.distanceTo(b)
      const middle = a.clone().lerp(b, 0.5)
      middle.y = 3 + distance * 0.35
      const curve = new THREE.QuadraticBezierCurve3(a, middle, b)
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(60)),
        new THREE.LineBasicMaterial({
          color: COLORS.red,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
        }),
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
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.mobile = width < 768
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

    // Cámara: gira despacio alrededor del campus y se acerca al bajar.
    const angle = 0.6 + t * 0.00006 + p * 1.1
    const radius = (this.mobile ? 150 : 118) - p * (this.mobile ? 40 : 38)
    const height = (this.mobile ? 105 : 78) - p * 30
    this.camera.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius)
    this.camera.lookAt(0, 0, 4)

    // Estudiantes: aparecen con un pequeño rebote y "laten".
    for (const person of this.people) {
      const k = Math.min(1, Math.max(0, (p - person.at) / 0.08))
      const pulse = 1 + Math.sin(t * 0.004 + person.at * 40) * 0.15
      person.mesh.scale.setScalar(Math.max(0.001, k * pulse))
      ;(person.mesh.material as THREE.MeshBasicMaterial).opacity = k
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
