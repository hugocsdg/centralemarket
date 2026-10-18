// Cuándo se muestra la imagen fija en vez del vídeo (móviles, tablets en vertical,
// móviles tumbados y "reducir movimiento"). Igual en CSS (index.css, .scrub-video).
export const STATIC_QUERY = [
  '(max-width: 720px)',
  '(orientation: portrait) and (max-width: 1024px)',
  '(orientation: portrait) and (pointer: coarse)',
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
  '(prefers-reduced-motion: reduce)',
].join(', ')
