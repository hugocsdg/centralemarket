// Fondo de la web: casi negro, con "auroras" de luz roja y morada que se mueven despacio,
// una rejilla tecnológica muy suave y un poco de grano, como en una foto de cine.
// Va fijo detrás de todo (fixed + -z-10), así el contenido se desliza por encima.

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")"

function Background() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-noche">
      {/* Auroras de luz */}
      <div className="absolute -top-[20vh] -left-[15vw] h-[70vh] w-[70vh] animate-aurora-1 rounded-full bg-carmin/35 blur-[120px]" />
      <div className="absolute top-[10vh] -right-[20vw] h-[80vh] w-[80vh] animate-aurora-2 rounded-full bg-burdeos/60 blur-[130px]" />
      <div className="absolute -bottom-[25vh] left-[20vw] h-[70vh] w-[70vh] animate-aurora-3 rounded-full bg-morado/25 blur-[140px]" />
      <div className="absolute top-[45vh] left-[45vw] h-[40vh] w-[40vh] animate-aurora-1 rounded-full bg-rojo/25 blur-[110px] [animation-delay:-8s]" />

      {/* Rejilla que se desvanece hacia los bordes */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)',
        }}
      />

      {/* Grano */}
      <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay" style={{ backgroundImage: NOISE }} />

      {/* Viñeta: oscurece los bordes para centrar la atención */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(11_0_6/0.8))]" />
    </div>
  )
}

export default Background
