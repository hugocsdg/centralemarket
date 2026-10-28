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
- **Modo claro** (Profile → Settings → Appearance: Dark / Light / Auto, guardado en el dispositivo; `src/lib/theme.ts` + script en `index.html`): con `data-theme="light"` en `<html>`, `index.css` cambia `--color-white` (texto → casi negro) y `--color-noche` (fondo → #F5F4F2), así que usa siempre `white`/`noche` (no `#fff` ni `rgb(255…)` a mano). Lo que va sobre fotos lleva la clase `keep-dark`; lo rojo (`btn-primary`, `bg-rojo`, `from-carmin`…) mantiene texto blanco solo. La intro siempre en oscuro (`forceDarkTheme`).
- Respeta `prefers-reduced-motion` y anima solo `transform`/`opacity`.
- Reglas de accesibilidad ya aplicadas en toda la web (mantenlas): texto gris como mínimo `text-white/60` (placeholders `/50`), nada por debajo de 11px, botones y enlaces de al menos 44px (`min-h-11`), anillo rojo de foco con teclado (`:focus-visible` en `index.css`), `aria-label` en buscadores y botones de solo icono, `loading="lazy"` en fotos que no se ven al cargar.
- Más utilidades: `spotlight` y `text-outline` (ya no se usan en la intro). La skill **impeccable** se usó para la intro v2 (`PRODUCT.md`, diagnóstico en `.impeccable/critique/`): nada de etiquetas pequeñas encima de los títulos ni texto con degradado.
- La skill **ui-ux-pro-max** (base de datos de estilos, tipografías, reglas UX y presets de GSAP) se usó para la auditoría y el rediseño de la intro. Sus paletas y fuentes genéricas **no** se aplican: manda la paleta de arriba.

## Estructura

- `src/pages/` páginas: `IntroPage` (/welcome), `HomePage` (/), `ExplorePage`, `ProductPage` (/item/:id), `SellPage`, `EditListingPage`, `MessagesPage`, `ChatPage`, `ProfilePage`, `LoginPage`.
- `src/components/intro/` escenas de la intro: `HeroScene` (vídeo «campus de noche»), `CampusScene` (3D real), `GalleryScene` (vídeo «la galería» + precios), `OrderScene` (WhatsApp → «en orden», mantener pulsado), `PhoneStory` (4 pasos en el iPhone), `LifeSection` (Arrive/Stay/Leave + Campus Storage), `ScrubVideo` (vídeo que avanza con el scroll; en móvil y con reducir movimiento, imagen fija; condición en `src/lib/scrub.ts`). Animaciones generales en `src/lib/useIntroAnimations.ts`; 3D en `src/lib/campus3d.ts`.
- Campus 3D: geometría real de OpenStreetMap en `src/data/campus.json`, generada con `node scripts/campus-from-osm.mjs` (no se llama a OSM desde la web). El crédito «© OpenStreetMap contributors» del pie es obligatorio.
- **Idiomas: inglés, francés, español, italiano y portugués (de Brasil)** en toda la web. Los textos se escriben en inglés en el código con `const t = useT()` → `t('Message seller')` o `t('{n} days ago', { n })`; fuera de React, `translate()` de `src/i18n/core.ts`. Las traducciones están en `src/i18n/locales/<idioma>.ts` (`app`: frase inglesa → traducción; `intro`: textos de /welcome, en inglés en `src/i18n/intro.ts`). Cada idioma se descarga solo si se elige (~16 KB). Al añadir o cambiar un texto, tradúcelo en los 4 archivos y pasa `npm run i18n` (dice qué falta; lo que falte se ve en inglés). Selector: Profile → Language, `LangSwitch` en login e intro; se elige según el móvil la primera vez y se recuerda. Fechas con `currentLocale()`. Los mensajes automáticos de ofertas (los escribe la base de datos en inglés) se traducen al mostrarlos en `ChatPage`.
- Email de contacto: `centralemarket.contact@gmail.com`, en `src/data/contact.ts` (Profile → Contact, aviso de cuenta suspendida, privacidad y normas). Al tener dominio, cambiarlo ahí y en los textos de `src/content/info.ts` + traducciones.
- Prueba social: `src/data/socialProof.ts`, oculta hasta tener datos reales (no inventar).
- Orden de la intro (v2, ~14 pantallas en ordenador, ~12 en móvil): portada con vídeo → campus 3D (#campus) → galería (#market) → WhatsApp/en orden (#order) → iPhone (#how) + botón → Arrive/Stay/Leave (#life) → [prueba social] → final con la ventana (#join) → pie. Índice de capítulos a la derecha (escritorio), "Skip intro" en la cabecera (escritorio) o pastilla flotante (móvil). Para saltar a un capítulo: `scrollToSection(id)` de `useIntroAnimations.ts`.
- Los `ScrollTrigger` que dependen de posiciones (índice, pastilla) se crean **después** de las escenas fijadas; si no, calculan mal las posiciones.
- Las escenas fijadas (pin) van envueltas en un `<div>` propio en `IntroPage`: sin él, React falla al salir de la página.
- Datos: `src/lib/listings.ts` (anuncios, fotos, publicar/editar/borrar, filtros, eventos), `src/lib/chat.ts` (chat y ofertas), `src/lib/reviews.ts` (valoraciones y "vendido a"), `src/lib/notifications.ts` (campana), `src/lib/filters.ts` (filtros de Explore en la URL), `src/lib/auth.ts` + `components/AuthProvider.tsx` (sesión), `src/lib/useQuery.ts` (pedir datos).
- Tres "pantallas" (`src/data/spaces.ts`, pestañas `SpaceTabs` en móvil y enlaces en la cabecera en escritorio): **Market** (`/explore`, con panel `FilterSheet`), **Events** (`/events`, carteles `EventCard` por fecha, anuncios de categoría `tickets` con `event_at`) y **Food** (`/food`, `FoodCard`, categoría `food` con `ready_at`, raciones, `dietary` y alérgenos). Perfil público en `/user/:id`, avisos en `/notifications`.
- Base de datos: `supabase/schema.sql`, `02_chat.sql`, `04_favorites.sql`, `05_avatars.sql`, `06_delete_account.sql`, `07_mejoras_vinted.sql` (ofertas, valoraciones, "vendido a", bajadas de precio, avisos, campos de eventos y comida; se puede ejecutar dos veces sin problema), `08_reports.sql` (denuncias: solo se envían desde la app, se revisan en Supabase → Table Editor → `reports_overview`; con 3 denuncias abiertas de personas distintas el anuncio se oculta salvo para su vendedor; para mostrarlo otra vez, status `dismissed`) `09_push.sql` (notificaciones push: dispositivos, ajustes por tipo, búsquedas guardadas, avisos nuevos y tareas programadas con pg_cron) y `10_valoraciones_dobles.sql` (comprador y vendedor se valoran mutuamente tras "vendido a": `reviews.reviewee_id` y `role`; vista `user_ratings` con el desglose por estrellas), `11_admin.sql` (tabla `admins` + `is_admin()`, cuentas suspendidas `profiles.banned_at` con `admin_set_ban`, bloqueos entre estudiantes `blocks`, reglas restrictivas, poderes de admin y `admin_stats`/`admin_search_users`; los emails de los administradores NO van en git: el archivo lleva `ADMIN_EMAIL_1/2` y se rellenan solo en la copia que se pega en Supabase), `12_errores.sql` (registro de errores de la app `client_errors`: cualquiera envía, solo admins leen; máx. 300/h y se borran a los 60 días) y `13_antiabuso.sql` (límites contra spam y estafas con una cuenta robada: 10 chats nuevos/hora y 40/día, 20 mensajes/minuto y 300/hora, 20 anuncios/día, y cuentas de menos de 24 h sin enlaces; `has_link()`). **Hugo los ejecuta a mano** en Supabase → SQL Editor (cópiale el SQL al portapapeles con `pbcopy` en Mac o `Get-Content … | Set-Clipboard` en Windows). Cualquier cambio nuevo de base de datos va en un archivo nuevo `supabase/0X_….sql`.
- **Notificaciones push** (móvil, también con la app cerrada): el dispositivo se suscribe en Profile → Notifications (`src/lib/push.ts`, `NotificationSettingsPage`, tarjeta `PushPrompt`), `public/sw.js` las muestra y abre la pantalla al tocarlas. Las envía la Edge Function `supabase/functions/send-push` (sin librerías, cifrado Web Push hecho a mano, probado contra `web-push` y con un envío real por Google), llamada por dos webhooks de Supabase (INSERT en `messages` y en `notifications`). Respeta los ajustes (`notification_prefs`) y las horas de silencio (23–8, salvo mensajes), en el idioma de cada dispositivo. Clave pública VAPID en `push.ts` y en `send-push`; la privada solo en `.env.local` (`VAPID_PRIVATE_KEY`) y como secreto en Supabase. En iPhone solo con la app instalada (iOS 16.4+).
- **Panel de administración** `/admin` (`AdminPage`, en inglés y sin traducir; `src/lib/admin.ts`): resumen con números, denuncias (sin motivo / borrar anuncio / suspender), usuarios (buscar por nombre o email, suspender/reactivar) y anuncios (borrar). Solo lo ven los de la tabla `admins` (botón en Profile). Estudiantes: botón «Block» en perfiles (`BlockButton`, `src/lib/blocks.ts`), lista en Profile → Blocked students, y aviso `SuspendedNotice` si su cuenta está suspendida.
- **Velocidad y fiabilidad**: tipografías servidas desde la propia web (`@fontsource`, solo alfabeto latino y los grosores usados; nada de Google Fonts). Cada foto de anuncio se sube también como miniatura de 600 px (`<uuid>.thumb.jpg`, ver `thumbPath` en `listings.ts`); tarjetas y listas usan `ListingPhoto`, que cae a la foto grande si no hay miniatura (anuncios antiguos). `ErrorBoundary` evita la pantalla en blanco y, con `src/lib/errors.ts`, guarda los fallos (Admin → Errors). Visitas con Vercel Web Analytics (`@vercel/analytics`, sin cookies; hay que activarlo en Vercel → Analytics). Lighthouse móvil (Market): 66 → 75–81, primer pintado 2,8–4,1 s → 1,4–2,2 s; lo que queda es el JS principal (React + Supabase).
- **Seguridad** (auditoría de octubre 2026): sin secretos en el código, el historial ni la web publicada (solo la clave pública `sb_publishable_…`); `npm audit` sin fallos; 40 ataques simulados contra la base de datos, todos bloqueados (script en la carpeta temporal: `attack.mjs` con PGlite y todos los SQL). Cabeceras de seguridad en `vercel.json` (CSP estricta: solo código de la propia web, Supabase para datos e imágenes; `frame-ancestors 'none'`, nosniff, etc.). **Si se añade algo de fuera** (un script, imágenes de otro dominio, un iframe), hay que permitirlo en la CSP o no funcionará. Por eso no hay código en línea en `index.html`: va en `public/boot.js` (tema claro sin parpadeo + precarga de la intro). `src/lib/safety.ts`: `safeNext` (tras el login solo se vuelve a páginas propias), `hasLink` (aviso antiestafas en enlaces recibidos en el chat) y `limitMessage` (mensajes claros de los límites antiabuso). `sw.js` solo abre páginas propias al tocar una notificación.
- Las reglas de seguridad nuevas (ofertas, valoraciones, avisos) se probaron con Postgres en memoria (`@electric-sql/pglite`) simulando usuarios; las pantallas, con un Supabase de mentira y Chrome sin ventana. Lo que pide sesión real hay que probarlo con cuentas de verdad.

## Funciona ya (probado por Hugo)

- Login sin contraseña con código por email, solo `@student-cs.fr` (bloqueo también en la base de datos). Emails vía Gmail SMTP en Supabase.
- Publicar con fotos, explorar/buscar/filtrar, detalle, editar, reservado/vendido, borrar.
- Chat interno en tiempo real con contador de no leídos (Hugo **no** quiere contacto por WhatsApp).
- Intro animada en /welcome: se ve sin sesión y la primera vez en cada dispositivo. Versión 2 en la rama `intro-v2` (sin publicar hasta que Hugo diga que le gusta).
- Vista previa al compartir (etiquetas og + `public/og-image.png` 1200×630) y `theme-color` #09090B. Falta que Hugo la confirme en WhatsApp.

## Pendiente antes de lanzar (por orden)

1. Avisos por email cuando llega un mensaje nuevo del chat.
2. Servicio de emails profesional (Resend o Brevo) + dominio propio: Gmail limita a 30 emails/hora en Supabase.
3. ~~Privacidad/normas~~ (hecho) + botón "Report" (hecho en la rama `report`; falta ejecutar `08_reports.sql`).
4. Prueba con 5–10 amigos (iPhone y Android).
5. Rama `mejoras-vinted`: ejecutar `supabase/07_mejoras_vinted.sql` **antes** de fusionar y probar con dos cuentas: oferta → aceptar, marcar vendido a alguien → valorar, bajar el precio de un favorito → aviso. Avisos solo dentro de la app (no por email).
6. Rendimiento: tipografías propias y miniaturas hechas (Lighthouse móvil Market 75–81). Lo que queda es el JS principal (React + Supabase).

Dominio: Hugo pregunta por **Hostinger**. Recomendación dada: usarlo solo para comprar el dominio (y quizá correo profesional), apuntarlo a Vercel con DNS; **no** su hosting. Ese dominio desbloquea Resend/Brevo (punto 2).

Pendiente de idiomas: los emails de Supabase (código de acceso) siguen en inglés; los textos legales traducidos son un borrador.

Ideas de futuro: almacén en el campus para quien se va (necesita permiso de la escuela), afinar el campus 3D con más capturas del mapa, quizá cambiar la foto del concierto por una más oscura.

## Trabajar a dos (Hugo + su compañero)

- El proyecto lo llevan **dos personas**, cada una con su Claude Code. La guía para arrancar está en `README.md`.
- **Nunca trabajes directamente en `main`** (es lo publicado). Cada tarea en su rama, creada desde un `main` al día (`git switch main && git pull && git switch -c <tarea>`). Antes de empezar, `git pull`.
- Para publicar: subir la rama (pide permiso antes de cada `git push`), abrir un **Pull Request** hacia `main` y que la otra persona mire la vista previa de Vercel. Fusionar con `main` solo cuando el dueño de la tarea lo diga.
- Reparto por zonas para no tocar los mismos archivos: **Hugo** = intro y diseño (`src/components/intro/`, `src/pages/IntroPage.tsx`, `src/i18n/`, `public/intro/`); **su compañero** = avisos por email, emails profesionales, privacidad/normas y botón "Report" (`supabase/`, páginas nuevas). Si una tarea necesita tocar la zona del otro, avisa antes.
- Base de datos: archivo nuevo `supabase/0X_….sql` por cambio, y avisar al otro antes de ejecutarlo en Supabase.
- Si una rama lleva tiempo abierta, `git merge main` estando en ella antes de seguir.
- No están en git: `.env.local` (cada uno el suyo, solo claves públicas), `review/` (originales de Higgsfield; los créditos son de la cuenta de Hugo).
