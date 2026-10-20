# CentraleMarket

Marketplace de segunda mano **solo para estudiantes de CentraleSupélec** (campus Paris-Saclay).
Web pública: https://centralemarket.vercel.app

El contexto completo del proyecto (qué funciona, qué falta, diseño, estructura) está en [`CLAUDE.md`](CLAUDE.md).
Claude Code lo lee solo al abrir el proyecto.

## Empezar en tu ordenador (una sola vez)

1. **Acepta la invitación** de GitHub que te ha mandado Hugo (llega por email).
2. **Instala** estas tres cosas:
   - [Node.js](https://nodejs.org) (la versión LTS)
   - [Git](https://git-scm.com/downloads) (en Mac ya viene; si te lo pide, acepta instalar las "Command Line Tools")
   - [Claude](https://claude.ai/download), la app de escritorio con la pestaña **Code**
3. **Descarga el proyecto** en una terminal:

   ```bash
   git clone https://github.com/hugocsdg/centralemarket.git
   cd centralemarket
   npm install
   ```

4. **Claves de Supabase**: copia `.env.example` como `.env.local` y pon los dos valores que te pase Hugo
   (`VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`). Son claves públicas. Las claves secretas
   (`sb_secret_…`, `service_role`) **no** se comparten nunca ni se ponen en ningún archivo.
5. **Arranca la web**:

   ```bash
   npm run dev
   ```

   y abre http://localhost:5173.

Ojo: la web en tu ordenador usa la **base de datos real**. Si publicas anuncios de prueba, bórralos después.
Para entrar necesitas un email `@student-cs.fr`.

## Cómo trabajamos a dos

La regla de oro: **nadie trabaja directamente en `main`**. `main` es lo que está publicado: cada cambio
que llega a `main` sale en la web en un minuto.

1. **Antes de empezar**, trae lo último:

   ```bash
   git switch main
   git pull
   ```

2. **Cada tarea en su propia rama**, con un nombre claro:

   ```bash
   git switch -c avisos-email
   ```

3. Trabaja y haz commits pequeños con mensajes claros.
4. **Sube tu rama** (`git push -u origin avisos-email`). Vercel crea una **vista previa** con su propia
   dirección, sin tocar la web publicada.
5. **Abre un Pull Request** en GitHub hacia `main`. El otro mira la vista previa y, si está bien,
   se fusiona (botón "Merge"). Entonces se publica.

Con Claude Code basta con decirlo en palabras ("crea una rama para los avisos por email", "sube la rama",
"abre un pull request"): las reglas están en `CLAUDE.md`.

### Para no pisarnos

- **Repartid por zonas**: si los dos tocáis el mismo archivo a la vez, al juntarlo habrá conflictos.
  Reparto actual (cambiadlo cuando queráis):
  - **Hugo**: la intro y el diseño (`src/components/intro/`, `src/pages/IntroPage.tsx`, `src/i18n/`, `public/intro/`).
  - **Su compañero**: avisos por email y backend (`supabase/`, emails, Supabase), y la página de privacidad/normas con el botón "Report".
- **Base de datos**: cada cambio va en un archivo nuevo `supabase/0X_nombre.sql`. Avisad al otro **antes**
  de ejecutarlo en Supabase (afecta a la web publicada).
- Si una rama lleva días abierta, tráete lo nuevo de `main` antes de seguir (`git merge main` estando en tu rama).

## Lo que no está en Git

- `.env.local` (claves; cada uno el suyo).
- `review/`: originales de las imágenes y vídeos de Higgsfield (solo en el ordenador de Hugo; los créditos son de su cuenta).
- `node_modules/` (se crea con `npm install`).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Web en http://localhost:5173 |
| `npm run build` | Comprueba que todo compila (lo mismo que hace Vercel) |
| `npm run lint` | Busca errores en el código |
