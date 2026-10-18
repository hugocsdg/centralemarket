# CentraleMarket — guía para Claude

Marketplace estilo Vinted/Wallapop **solo para estudiantes de CentraleSupélec** (campus Paris-Saclay).
Lo construye Hugo (estudiante Erasmus de Barcelona) con un amigo. Web pública: https://centralemarket.vercel.app

## Cómo trabajar con Hugo

- Habla en **español**. La interfaz de la web está en **inglés**.
- Hugo **no programa**: dice lo que quiere y tú lo implementas directamente en este proyecto. Antes o mientras, explica **la lógica** en pocas líneas (qué piezas, frontend/backend, por qué), con ejemplos sencillos; viene de Python básico.
- Comprueba siempre en el navegador (escritorio **y** móvil 375×812) antes de decir que algo funciona. Di claramente qué no has podido probar (p. ej. todo lo que necesita sesión iniciada: no puedes entrar con su email).
- **Pide permiso antes de hacer `git push`** (publicar en Vercel). Hacer commits locales sí puedes.
- Los pasos que dependen de sus cuentas (Supabase, Vercel, Google) los hace él: guíale paso a paso, con capturas si las manda. Nunca le pidas contraseñas ni claves secretas (`sb_secret_…`, `service_role`).
- Le gusta lo visual e "impresionante" (estilo Apple/Linear). Cuando una idea suya es ambigua, propón una versión concreta y hazla.

## Stack

- **Vite + React 19 + TypeScript**, **Tailwind v4** (tokens y utilidades en `src/index.css`), **React Router** (`react-router`), iconos **lucide-react**.
- **Supabase** (proyecto `qlhalomjqpfpyqpczszn`, región UE): Auth, Postgres con RLS, Storage, Realtime. Cliente en `src/lib/supabase.ts`; claves públicas en `.env.local` (no se sube) y en Vercel como `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **Vercel**: cada `git push` a `main` publica solo. `vercel.json` reescribe todas las rutas a `index.html`.
- Animaciones: **GSAP + ScrollTrigger + Lenis** (intro), **Three.js** (campus 3D, se carga bajo demanda).
- Comandos: `npm run dev` (http://localhost:5173, también en `.claude/launch.json` como "dev"), `npm run build`, `npm run lint` (oxlint). Deja build y lint sin errores ni avisos (el aviso de "chunks larger than 500 kB" ya existía).
- Si el panel del navegador es demasiado estrecho para capturas fiables, se puede capturar con el Chrome instalado en modo sin ventana (protocolo DevTools) desde un script en la carpeta temporal.

## Diseño

- Fondo negro/gris oscuro (`noche` #09090B), el **rojo del logo** solo como acento (`rojo`, `carmin`, `rosa`), gris `plata`. **Nada de violetas.**
- Utilidades propias: `glass` (cristal), `btn-primary` (botón rojo con brillo), `text-shine` (texto con degradado animado), `glow-border`.
- Logo original de Hugo en `public/logo-mark.png` y `public/logo-full.png` (componente `src/components/Logo.tsx`).
- Imágenes y vídeos de la intro: generados con **Higgsfield** (conector), en `public/intro/` (WebP + 2 vídeos MP4 de menos de 3 MB). Los originales sin procesar van en `review/` (no se sube a git). Reglas de Hugo: preguntar antes de **cada** generación con modelo, precio (consulta `get_cost`, gratis) y créditos que quedan; sin texto ni logos; nada de Veo (caro). Vídeos para scroll: `ffmpeg -crf 23 -g 8 -keyint_min 8 -an -movflags +faststart`, escalados a 1600 px (ffmpeg en `~/.local/bin/ffmpeg`).
- Respeta `prefers-reduced-motion` y anima solo `transform`/`opacity`.
- Reglas de accesibilidad ya aplicadas en toda la web (mantenlas): texto gris como mínimo `text-white/60` (placeholders `/50`), nada por debajo de 11px, botones y enlaces de al menos 44px (`min-h-11`), anillo rojo de foco con teclado (`:focus-visible` en `index.css`), `aria-label` en buscadores y botones de solo icono, `loading="lazy"` en fotos que no se ven al cargar.
- Más utilidades: `spotlight` y `text-outline` (ya no se usan en la intro). La skill **impeccable** se usó para la intro v2 (`PRODUCT.md`, diagnóstico en `.impeccable/critique/`): nada de etiquetas pequeñas encima de los títulos ni texto con degradado.
- La skill **ui-ux-pro-max** (base de datos de estilos, tipografías, reglas UX y presets de GSAP) se usó para la auditoría y el rediseño de la intro. Sus paletas y fuentes genéricas **no** se aplican: manda la paleta de arriba.

## Estructura

- `src/pages/` páginas: `IntroPage` (/welcome), `HomePage` (/), `ExplorePage`, `ProductPage` (/item/:id), `SellPage`, `EditListingPage`, `MessagesPage`, `ChatPage`, `ProfilePage`, `LoginPage`.
- `src/components/intro/` escenas de la intro: `HeroScene` (vídeo «campus de noche»), `CampusScene` (3D real), `GalleryScene` (vídeo «la galería» + precios), `OrderScene` (WhatsApp → «en orden», mantener pulsado), `PhoneStory` (4 pasos en el iPhone), `LifeSection` (Arrive/Stay/Leave + Campus Storage), `ScrubVideo` (vídeo que avanza con el scroll; en móvil y con reducir movimiento, imagen fija; condición en `src/lib/scrub.ts`). Animaciones generales en `src/lib/useIntroAnimations.ts`; 3D en `src/lib/campus3d.ts`.
- Campus 3D: geometría real de OpenStreetMap en `src/data/campus.json`, generada con `node scripts/campus-from-osm.mjs` (no se llama a OSM desde la web). El crédito «© OpenStreetMap contributors» del pie es obligatorio.
- Textos de la intro en `src/i18n/intro.ts` (inglés y francés); idioma en `src/i18n/lang.tsx` (según el navegador, se recuerda; selector `LangSwitch`). El resto de la web sigue solo en inglés.
- Prueba social: `src/data/socialProof.ts`, oculta hasta tener datos reales (no inventar).
- Orden de la intro (v2, ~14 pantallas en ordenador, ~12 en móvil): portada con vídeo → campus 3D (#campus) → galería (#market) → WhatsApp/en orden (#order) → iPhone (#how) + botón → Arrive/Stay/Leave (#life) → [prueba social] → final con la ventana (#join) → pie. Índice de capítulos a la derecha (escritorio), "Skip intro" en la cabecera (escritorio) o pastilla flotante (móvil). Para saltar a un capítulo: `scrollToSection(id)` de `useIntroAnimations.ts`.
- Los `ScrollTrigger` que dependen de posiciones (índice, pastilla) se crean **después** de las escenas fijadas; si no, calculan mal las posiciones.
- Las escenas fijadas (pin) van envueltas en un `<div>` propio en `IntroPage`: sin él, React falla al salir de la página.
- Datos: `src/lib/listings.ts` (anuncios, fotos, publicar/editar/borrar), `src/lib/chat.ts` (chat), `src/lib/auth.ts` + `components/AuthProvider.tsx` (sesión), `src/lib/useQuery.ts` (pedir datos).
- Base de datos: `supabase/schema.sql` y `supabase/02_chat.sql`. **Hugo los ejecuta a mano** en Supabase → SQL Editor (cópiale el SQL al portapapeles con `pbcopy`). Cualquier cambio nuevo de base de datos va en un archivo nuevo `supabase/03_….sql`.

## Funciona ya (probado por Hugo)

- Login sin contraseña con código por email, solo `@student-cs.fr` (bloqueo también en la base de datos). Emails vía Gmail SMTP en Supabase.
- Publicar con fotos, explorar/buscar/filtrar, detalle, editar, reservado/vendido, borrar.
- Chat interno en tiempo real con contador de no leídos (Hugo **no** quiere contacto por WhatsApp).
- Intro animada en /welcome: se ve sin sesión y la primera vez en cada dispositivo. Versión 2 en la rama `intro-v2` (sin publicar hasta que Hugo diga que le gusta).
- Vista previa al compartir (etiquetas og + `public/og-image.png` 1200×630) y `theme-color` #09090B. Falta que Hugo la confirme en WhatsApp.

## Pendiente antes de lanzar (por orden)

1. Avisos por email cuando llega un mensaje nuevo del chat.
2. Servicio de emails profesional (Resend o Brevo) + dominio propio: Gmail limita a 30 emails/hora en Supabase.
3. Página de privacidad/normas + botón "Report" para anuncios.
4. Prueba con 5–10 amigos (iPhone y Android).
5. Quitar o terminar "Favorites" (ahora es "Coming soon").
6. Rendimiento: ya partido por páginas (intro v2). En móvil la nota de Lighthouse sigue en ~50: lo que más pesa es el JS principal (Supabase + React).

Dominio: Hugo pregunta por **Hostinger**. Recomendación dada: usarlo solo para comprar el dominio (y quizá correo profesional), apuntarlo a Vercel con DNS; **no** su hosting. Ese dominio desbloquea Resend/Brevo (punto 2).

Ideas de futuro: almacén en el campus para quien se va (necesita permiso de la escuela), afinar el campus 3D con más capturas del mapa, quizá cambiar la foto del concierto por una más oscura.
