// Motor de partículas de la introducción.
// Miles de puntos de luz que forman el logo y se deshacen en un anillo de fondo según el scroll.
//
// Cómo funciona:
// 1) Al empezar, dibujamos cada figura en un lienzo invisible y apuntamos qué píxeles están "pintados".
//    De ahí sacamos N posiciones por figura.
// 2) El scroll decide entre qué dos "poses" estamos y cuánto hemos avanzado (morph.from, morph.to, morph.t).
// 3) En cada fotograma, cada partícula se mueve suavemente hacia su sitio en la mezcla de las dos figuras.

export type Pose = {
  shape: number // índice de la figura
  cx: number // centro horizontal (0 = izquierda, 1 = derecha)
  cy: number // centro vertical
  size: number // tamaño respecto al lado corto de la pantalla
  alpha: number // brillo
  spin?: number // si gira despacio (anillo)
}

export type Morph = { from: number; to: number; t: number }

// Figuras: 0 logo, 1 anillo.

const SAMPLE = 220 // tamaño del lienzo invisible donde se dibuja cada figura

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

// Saca N puntos (x, y entre -0.5 y 0.5) de los píxeles visibles de una imagen.
function samplePoints(image: CanvasImageSource, width: number, height: number, count: number) {
  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE
  canvas.height = SAMPLE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const scale = Math.min(SAMPLE / width, SAMPLE / height) * 0.92
  const w = width * scale
  const h = height * scale
  ctx.drawImage(image, (SAMPLE - w) / 2, (SAMPLE - h) / 2, w, h)
  const data = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data

  const candidates: number[] = []
  for (let y = 0; y < SAMPLE; y++) {
    for (let x = 0; x < SAMPLE; x++) {
      if (data[(y * SAMPLE + x) * 4 + 3] > 140) candidates.push(x, y)
    }
  }
  const points = new Float32Array(count * 2)
  const total = candidates.length / 2
  for (let i = 0; i < count; i++) {
    const pick = total > 0 ? Math.floor(Math.random() * total) : 0
    const jitter = () => (Math.random() - 0.5) * 0.8
    points[i * 2] = total > 0 ? (candidates[pick * 2] + jitter()) / SAMPLE - 0.5 : 0
    points[i * 2 + 1] = total > 0 ? (candidates[pick * 2 + 1] + jitter()) / SAMPLE - 0.5 : 0
  }
  return points
}

// Un anillo tipo galaxia, para el fondo de las escenas con texto.
function ringPoints(count: number) {
  const points = new Float32Array(count * 2)
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 0.32 + (Math.random() - 0.5) * 0.22 * Math.random()
    points[i * 2] = Math.cos(angle) * radius
    points[i * 2 + 1] = Math.sin(angle) * radius * 0.42
  }
  return points
}

export async function buildShapes(count: number) {
  const shapes: Float32Array[] = []
  const logo = await loadImage('/logo-mark.png')
  shapes.push(samplePoints(logo, logo.naturalWidth, logo.naturalHeight, count))
  shapes.push(ringPoints(count))
  return shapes
}

const COLORS = ['#ff4d73', '#e0153f', '#f43f5e', '#a1a1aa', '#ffffff']
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export class ParticleField {
  private ctx: CanvasRenderingContext2D
  private positions: Float32Array
  private scatter: Float32Array
  private phase: Float32Array
  private color: Uint8Array
  private frame = 0
  private width = 0
  private height = 0
  private dpr = 1
  private canvas: HTMLCanvasElement
  private shapes: Float32Array[]
  private poses: { desktop: Pose[]; mobile: Pose[] }
  private morph: Morph
  private count: number

  constructor(
    canvas: HTMLCanvasElement,
    shapes: Float32Array[],
    poses: { desktop: Pose[]; mobile: Pose[] },
    morph: Morph,
  ) {
    this.canvas = canvas
    this.shapes = shapes
    this.poses = poses
    this.morph = morph
    this.count = shapes[0].length / 2
    this.ctx = canvas.getContext('2d')!
    this.positions = new Float32Array(this.count * 2)
    this.scatter = new Float32Array(this.count * 2)
    this.phase = new Float32Array(this.count)
    this.color = new Uint8Array(this.count)
    for (let i = 0; i < this.count; i++) {
      // Al cambiar de figura, cada partícula "explota" un poco en su propia dirección.
      const angle = Math.random() * Math.PI * 2
      const force = 0.06 + Math.random() * 0.24
      this.scatter[i * 2] = Math.cos(angle) * force
      this.scatter[i * 2 + 1] = Math.sin(angle) * force
      this.phase[i] = Math.random() * Math.PI * 2
      const r = Math.random()
      this.color[i] = r < 0.45 ? 0 : r < 0.7 ? 1 : r < 0.85 ? 2 : r < 0.97 ? 3 : 4
    }
    this.resize()
    // Las partículas empiezan dispersas por la pantalla y se juntan al cargar.
    for (let i = 0; i < this.count; i++) {
      this.positions[i * 2] = Math.random() * this.width
      this.positions[i * 2 + 1] = Math.random() * this.height
    }
  }

  resize = () => {
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.canvas.width = this.width * this.dpr
    this.canvas.height = this.height * this.dpr
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  start() {
    window.addEventListener('resize', this.resize)
    const loop = (time: number) => {
      this.draw(time)
      this.frame = requestAnimationFrame(loop)
    }
    this.frame = requestAnimationFrame(loop)
  }

  // Un solo fotograma, ya colocado (para quien prefiere menos movimiento).
  drawStatic() {
    for (let k = 0; k < 120; k++) this.draw(0, 1)
  }

  stop() {
    cancelAnimationFrame(this.frame)
    window.removeEventListener('resize', this.resize)
  }

  private draw(time: number, follow = 0.085) {
    const { ctx, width, height, count } = this
    const poses = width < 768 ? this.poses.mobile : this.poses.desktop
    const a = poses[this.morph.from] ?? poses[0]
    const b = poses[this.morph.to] ?? poses[0]
    const t = ease(Math.min(1, Math.max(0, this.morph.t)))
    const shapeA = this.shapes[a.shape]
    const shapeB = this.shapes[b.shape]

    const base = width < 768 ? width : Math.min(width, height)
    const cx = lerp(a.cx, b.cx, t) * width
    const cy = lerp(a.cy, b.cy, t) * height
    const size = lerp(a.size, b.size, t) * base
    const alpha = lerp(a.alpha, b.alpha, t)
    const spin = lerp(a.spin ?? 0, b.spin ?? 0, t) * time * 0.00012
    const cos = Math.cos(spin)
    const sin = Math.sin(spin)
    const burst = Math.sin(Math.PI * t) // 0 al principio y al final, 1 a mitad del cambio

    ctx.clearRect(0, 0, width, height)
    ctx.globalCompositeOperation = 'lighter'

    const pos = this.positions
    for (let i = 0; i < count; i++) {
      const ix = i * 2
      let x = lerp(shapeA[ix], shapeB[ix], t) + this.scatter[ix] * burst
      let y = lerp(shapeA[ix + 1], shapeB[ix + 1], t) + this.scatter[ix + 1] * burst
      if (spin) {
        const rx = x * cos - y * sin
        y = x * sin + y * cos
        x = rx
      }
      const wobble = Math.sin(time * 0.0012 + this.phase[i]) * 1.4
      const targetX = cx + x * size + wobble
      const targetY = cy + y * size + Math.cos(time * 0.001 + this.phase[i]) * 1.4
      pos[ix] += (targetX - pos[ix]) * follow
      pos[ix + 1] += (targetY - pos[ix + 1]) * follow
    }

    // Dibujar por colores (más rápido que cambiar de color en cada punto).
    const dot = width < 768 ? 1.5 : 1.8
    for (let c = 0; c < COLORS.length; c++) {
      ctx.fillStyle = COLORS[c]
      ctx.globalAlpha = alpha * (c === 4 ? 0.9 : 0.75)
      for (let i = 0; i < count; i++) {
        if (this.color[i] !== c) continue
        ctx.fillRect(pos[i * 2], pos[i * 2 + 1], dot, dot)
      }
    }
    ctx.globalAlpha = 1
  }
}
