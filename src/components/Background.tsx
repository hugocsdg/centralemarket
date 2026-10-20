// Fondo de la web: negro y gris oscuro, con una luz roja muy suave (el color del logo)
// y reflejos grises que se mueven despacio, una rejilla muy tenue y un poco de grano.
// Va fijo detrás de todo (fixed + -z-10), así el contenido se desliza por encima.

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")"

function Background() {
  return (
    <div aria-hidden="true" className="app-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-noche">
      {/* Luces suaves */}
      <div className="bg-aurora absolute -top-[25vh] -left-[15vw] h-[70vh] w-[70vh] animate-aurora-1 rounded-full bg-carmin/[0.14] blur-[130px]" />
      <div className="bg-aurora absolute top-[10vh] -right-[20vw] h-[80vh] w-[80vh] animate-aurora-2 rounded-full bg-zinc-500/[0.10] blur-[140px]" />
      <div className="bg-aurora absolute -bottom-[30vh] left-[20vw] h-[70vh] w-[70vh] animate-aurora-3 rounded-full bg-zinc-300/[0.06] blur-[150px]" />
      <div className="bg-aurora absolute top-[50vh] left-[50vw] h-[35vh] w-[35vh] animate-aurora-1 rounded-full bg-rojo/[0.10] blur-[120px] [animation-delay:-8s]" />

      {/* Rejilla que se desvanece hacia los bordes */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)',
        }}
      />

      {/* Grano */}
      <div className="bg-grain absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: NOISE }} />

      {/* Viñeta: oscurece los bordes para centrar la atención */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(9_9_11/0.85))]" />
    </div>
  )
}

export default Background
