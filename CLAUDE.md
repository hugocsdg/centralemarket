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
- Comandos: `npm run dev` (http://localhost:5173), `npm run build`, `npm run lint` (oxlint). Deja build y lint sin errores ni avisos.

## Diseño

- Fondo negro/gris oscuro (`noche` #09090B), el **rojo del logo** solo como acento (`rojo`, `carmin`, `rosa`), gris `plata`. **Nada de violetas.**
- Utilidades propias: `glass` (cristal), `btn-primary` (botón rojo con brillo), `text-shine` (texto con degradado animado), `glow-border`.
- Logo original de Hugo en `public/logo-mark.png` y `public/logo-full.png` (componente `src/components/Logo.tsx`).
- Fotos de la intro: Unsplash (licencia libre), lista en `src/data/photos.ts`.
- Respeta `prefers-reduced-motion` y anima solo `transform`/`opacity`.

## Estructura

- `src/pages/` páginas: `IntroPage` (/welcome), `HomePage` (/), `ExplorePage`, `ProductPage` (/item/:id), `SellPage`, `EditListingPage`, `MessagesPage`, `ChatPage`, `ProfilePage`, `LoginPage`.
- `src/components/intro/` escenas de la intro: `CampusScene` (3D), `MacScene` (zoom a la pantalla con transiciones), `PhoneStory` (iPhone que cuenta la historia), `Journey` (scroll horizontal). Animaciones en `src/lib/useIntroAnimations.ts`; partículas en `src/lib/particles.ts`; 3D en `src/lib/campus3d.ts`.
- Las escenas fijadas (pin) van envueltas en un `<div>` propio en `IntroPage`: sin él, React falla al salir de la página.
- Datos: `src/lib/listings.ts` (anuncios, fotos, publicar/editar/borrar), `src/lib/chat.ts` (chat), `src/lib/auth.ts` + `components/AuthProvider.tsx` (sesión), `src/lib/useQuery.ts` (pedir datos).
- Base de datos: `supabase/schema.sql` y `supabase/02_chat.sql`. **Hugo los ejecuta a mano** en Supabase → SQL Editor (cópiale el SQL al portapapeles con `pbcopy`). Cualquier cambio nuevo de base de datos va en un archivo nuevo `supabase/03_….sql`.

## Funciona ya (probado por Hugo)

- Login sin contraseña con código por email, solo `@student-cs.fr` (bloqueo también en la base de datos). Emails vía Gmail SMTP en Supabase.
- Publicar con fotos, explorar/buscar/filtrar, detalle, editar, reservado/vendido, borrar.
- Chat interno en tiempo real con contador de no leídos (Hugo **no** quiere contacto por WhatsApp).
- Intro animada en /welcome: se ve sin sesión y la primera vez en cada dispositivo.

## Pendiente antes de lanzar (por orden)

1. Avisos por email cuando llega un mensaje nuevo del chat.
2. Servicio de emails profesional (Resend o Brevo) + dominio propio: Gmail limita a 30 emails/hora en Supabase.
3. Página de privacidad/normas + botón "Report" para anuncios.
4. Prueba con 5–10 amigos (iPhone y Android).
5. Quitar o terminar "Favorites" (ahora es "Coming soon"); vista previa bonita al compartir enlaces en WhatsApp (etiquetas og).

Ideas de futuro: almacén en el campus para quien se va (necesita permiso de la escuela), afinar el campus 3D con más capturas del mapa, quizá cambiar la foto del concierto por una más oscura.
