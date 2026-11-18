# CLAUDE.md — OpenDayCare

Punto de entrada para **Claude Code** (y para cualquier agente que lea `CLAUDE.md`). Resume las
reglas y el contexto del proyecto; el detalle completo está en [`AGENTS.md`](./AGENTS.md) y
[`README.md`](./README.md).

## Precedencia de la documentación

1. **`AGENTS.md`** — fuente de verdad operativa para agentes.
2. **`README.md`** — manual de producto, instalación, capturas y enlaces.
3. **`CLAUDE.md`** (este archivo) — resumen y adaptaciones para Claude Code.

Si hay contradicción, gana `AGENTS.md` en lo operativo y `README.md` en lo funcional. No dupliques
decisiones nuevas en tres archivos: actualiza la fuente correspondiente y enlázala.

## Contexto del proyecto

- Portal de guardería en español con dos roles: `staff` y `family`.
- Next.js **16.4.5**, React **19.3.0**, TypeScript **5.9.3**, Tailwind CSS **4.3.5**.
- Autenticación real con **Supabase Auth** (email y contraseña) y datos en Postgres con RLS.
- El SDK es `@supabase/ssr`; **la única vía de datos es `app/lib/dal.ts`** (sin ORM ni tipos
  generados de la DB).
- La UI se construye a partir de `references/pantallas/*.dc.html` y se compara con
  `references/screenshots/`; las capturas reales del README están en `docs/capturas/`.
- El producto y los comentarios del código se escriben en **español**.

## Inicio rápido

```bash
npm install
Copy-Item .env.example .env.local   # PowerShell
# cp .env.example .env.local        # bash
# completa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

Abre <http://localhost:3000> y entra con `staff@guarderia-demo.test` / `demo1234`
(staff, Guardería Sala Soles). No hay `SESSION_SECRET`: la sesión vive en las cookies `sb-*`.

## Reglas no negociables

- Responde en **español**.
- **No inventes** resultados de comandos, Playwright, Context7, Supabase ni APIs.
- **No hagas commits** salvo que la persona lo pida explícitamente.
- **No cambies el estado** de una spec (`Draft`, `Aprobado`, `Implementado`, etc.); esa decisión es
  humana.
- **No edites código** para hacer pasar una verificación.
- **No leas ni imprimas** `.env.local` ni secretos.
- No borres trabajo sin revisar `git status` y el diff.
- No agregues un runner de tests: el proyecto no tiene uno. Verifica con lint, `tsc`, `build` y
  Playwright.
- No toques los bloques `nextjs-agent-rules` / `nextjs-agent-feedback` de `AGENTS.md`: los escribe
  `next dev`.

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run dev` | Dev server en el puerto 3000 (Turbopack). |
| `npm run build` | Build de producción. |
| `npm run start` | Servir el build. |
| `npm run lint` | ESLint desde la raíz. |
| `npx tsc --noEmit` | Typecheck. No hay script `typecheck`. |

Antes de cerrar un cambio:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

`npm run lint` ya falla por deuda preexistente en `references/pantallas/support.js` y
`.agents/skills/**` (no es código de la app). No lo atribuyas a tu cambio ni lo maquilles.

## Flujo de trabajo recomendado

### 1. Explorar antes de tocar

- Lee `AGENTS.md`, la spec correspondiente y los archivos que menciona.
- Revisa `git status --short` y `git branch --show-current`.
- Si la tarea es grande, empieza por una spec.

### 2. Diseñar una spec

En OpenCode:

```text
/spec <descripción de una frase>
```

En Claude Code, si el comando no está disponible:

```text
Lee .agents/skills/spec/SKILL.md y sigue su flujo para diseñar una spec de: <descripción>.
```

La skill hace preguntas de aclaración antes de escribir. El archivo se guarda en `specs/NN-slug.md`
en estado `Draft`. No se escribe código en esta fase.

### 3. Implementar una spec aprobada

```text
/spec-impl 10-busqueda-alta-ninos
```

Reglas: solo si el estado significa **Aprobado**; rama `spec-NN-slug` (controlado por
`specs/.spec-config.yml`); paso a paso; **nunca commits automáticos**; si algo es ambiguo, pregunta.

### 4. Verificar

```text
/spec-verify 10
```

Marca `[x]` solo lo probado en esa ejecución, distingue **fallo** de **bloqueo**, solo edita
`specs/*.md` y agrega `## Verificación`.

### 5. Migraciones

```text
/db-migrate <tarea>
```

El subagente `db-migrator` inventaría `supabase/migrations/` contra `list_migrations`, aplica las
pendientes y crea archivos nuevos con las convenciones. Solo escribe en `supabase/migrations/*.sql`.

## Arquitectura: autenticación y rutas

- `proxy.ts` sustituye a `middleware.ts` en Next 16 y corre en runtime Node.js.
- `proxy.ts` hace una comprobación **optimista** de los claims (`user_metadata.role`); la
  autorización real está en `app/lib/dal.ts`.
- Antes de tocar datos, llama a:
  - `getSession()` → `Perfil | null`, sin redirigir.
  - `verifySession()` → redirige a `/login`.
  - `requireRole("staff" | "family")` → exige rol.
- La DB usa el enum `user_role` (`staff | parent | admin`); `mapearRol` lo traduce a `staff | family`.
- Un usuario autenticado **sin fila en `users`** se trata como no autenticado (falla cerrado).
- El enrutamiento es **deny-by-default**. Registra rutas públicas o por rol en `PUBLIC_ROUTES`,
  `STAFF_ONLY`, `FAMILY_ONLY` o `HOME_BY_ROLE` de `app/lib/routes.ts`.
- `/login` es login real con Supabase Auth; `?next=` se valida con `destinoSeguro` contra las rutas
  del rol (anti open redirect).
- `proxy.ts` manda al home del rol a cualquier sesión que entre en una ruta pública, incluida
  `/activar-cuenta`.

## Mapa de archivos clave

| Archivo | Qué hace |
| --- | --- |
| `proxy.ts` | Redirecciones y separación por rol (optimista). |
| `app/lib/dal.ts` | Autorización real, consultas y tipos de UI. |
| `app/lib/routes.ts` | Rutas públicas y por rol. |
| `app/login/actions.ts` | Server Actions `login` y `logout`. |
| `app/feed/page.tsx` | Home del staff con posts mock. |
| `app/ninos/page.tsx` | Listado real desde `children`. |
| `app/ninos/gestion-ninos.tsx` | Cliente: buscador, tarjetas y grupos por sala. |
| `app/ninos/[id]/page.tsx` | Perfil del niño (`instant = false`). |
| `app/ninos/actions.ts` | `altaNino` e `invitarPadre`. |
| `app/ninos/agregar-nino.tsx` | Diálogo de alta (persiste). |
| `app/ninos/vincular-padre.tsx` | Diálogo de invitación (persiste). |
| `app/components/nueva-publicacion-provider.tsx` | Provider del diálogo de publicación. |
| `utils/supabase/` | `client.ts`, `server.ts` y `proxy.ts` (`updateSession`). |
| `supabase/migrations/` | 20 migraciones aplicadas por MCP. |
| `docs/capturas/` | Capturas del README (versionadas). |
| `specs/` | Specs `NN-slug.md` (01–11). |

## Datos y base de datos

- Proyecto Supabase: `btknjzobaqtekofvfsof`.
- Niños, salas, guarderías e invitaciones son reales y se leen por la DAL.
- Feed y "crear publicación" siguen en mock; `/activar-cuenta` usa datos fijos.
- Lo persistido va **en inglés** y la DAL traduce: alergias (`peanut` → `MANÍ`) y parentesco
  (`mother` → `Mamá`).
- Sin tipos generados, las filas se castean (`as unknown as`) y los embeds pueden llegar como objeto
  o como lista.
- **Ocho tablas sin políticas RLS**: `posts`, `comments`, `reactions`, `post_children`,
  `post_photos`, `parent_children`, `daily_summaries` y `devices`. Por eso `parent_children` llega
  vacío y todos los niños muestran 0 padres. No es un bug de la UI.
- Las migraciones aplicadas no se editan: cualquier corrección va en un archivo nuevo.

## Convenciones y trampas

- `@/*` apunta a la raíz: usa `@/app/lib/...`, **no** `@/lib/...`.
- Tailwind v4 es CSS-first. No agregues `tailwind.config.*` ni PostCSS.
- `next.config.ts` activa `cacheComponents`, `partialPrefetching`,
  `experimental.agentFeedback` y el loader de `@tailwindcss/turbopack`.
- Con `cacheComponents`, cualquier lectura de `connection()`, `cookies()` o `searchParams` en una
  página debe ir dentro de `<Suspense>` (patrón `XContent` + `<Suspense>`).
- En `app/ninos/[id]/page.tsx`, `export const instant = false` es intencional para combinar
  `connection()` y `notFound()`.
- `allowedDevOrigins` depende de la IP de la LAN; actualízalo si cambia.
- Revisa `node_modules/next/dist/docs/` antes de cambiar data fetching o caché.
- Los textos visibles y los comentarios van en español.

## Diseño

- **Fredoka** para títulos (`font-display`) y **Nunito** para texto (`font-sans`).
- Paleta cálida: `cream`, `paper`, `surface`, `line*`, `ink*`, `coral*`, `sky*`, `mint*`, `lilac*`.
- Utilidades: `bg-cream`, `text-ink`, `rounded-card`, `shadow-card`.
- Compara con `references/pantallas/*.dc.html` y `references/screenshots/`.
- No cuentes el overlay de Next Dev Tools como diferencia; para capturas públicas usa
  `npm run build && npm run start`.

## Specs actuales

Todas en estado **Implementado**: `01-diseno-feed-home` (2026-11-09), `02-diseno-ninos-perfil`
(2026-11-10), `03-login-activar-cuenta` (2026-11-10), `04-vincular-padre` (2026-11-10),
`05-crear-publicacion-feed` (2026-11-10), `06-crear-tabla-daycares` (2026-11-12),
`07-crear-tabla-users` (2026-11-13), `08-conexion-supabase` (2026-11-13),
`09-autenticacion-supabase` (2026-11-15), `10-busqueda-alta-ninos` (2026-11-15) y
`11-vincular-padre-supabase` (2026-11-17).

## Skills y comandos

- Skills del proyecto en `.agents/skills/`: `spec`, `spec-impl`, `context7-mcp` y apoyo
  (`brainstorming`, `database-migration`, `postgresql-table-design`, `sql-optimization-patterns`,
  `frontend-design`, `interface-design`, `vercel-react-best-practices`, `changelog-generator`).
- `.claude/skills/` existe por compatibilidad; la fuente real está en `.agents/skills/`.
- Si Claude Code no descubre una skill, **léela directamente** y sigue sus instrucciones.
- `skills-lock.json` guarda la procedencia y el hash de las skills. Origen:
  <https://github.com/klerith/fernando-skills>.
- Comandos de OpenCode en `.opencode/commands/`: `/spec`, `/spec-impl`, `/spec-imp`, `/spec-verify`
  y `/db-migrate`.
- Agentes en `.opencode/agents/`: `spec-verify`, `db-migrator`, `db-security-auditor`,
  `accessibility-checker` y `react-best-practices`.

## MCP

### Si trabajas en Claude Code

Las herramientas MCP aparecen como herramientas directas (`mcp__context7__*`,
`mcp__playwright__*`). Úsalas directamente. Para instalarlas:

```bash
claude mcp list
claude mcp add playwright npx @playwright/mcp@latest
claude mcp add --scope user --transport http context7 https://mcp.context7.com/mcp
```

### Si trabajas en OpenCode (Code Mode)

Las herramientas MCP se llaman **dentro de `execute`** y cada llamada termina con `return`:

```js
const library = await tools.context7["resolve-library-id"]({
  libraryName: "Next.js",
  query: "proxy.ts vs middleware.ts en Next.js 16",
});
return library;
```

```js
const result = await tools.playwright.browser_navigate({
  url: "http://localhost:3000/login",
});
return result;
```

### Servidores del proyecto

| Servidor | Tipo | Comando / URL | Configuración |
| --- | --- | --- | --- |
| `playwright` | Local (stdio) | `npx @playwright/mcp@latest` | `opencode.json` |
| `supabase` | Remoto (HTTP) | `https://mcp.supabase.com/mcp?project_ref=btknjzobaqtekofvfsof…` | `opencode.json` |
| `context7` | Remoto (HTTP) | `https://mcp.context7.com/mcp` | Global del entorno |

Reglas de Playwright:

- Verifica la URL activa antes de capturar.
- Capturas del README → `docs/capturas/` (se versiona). Capturas de trabajo sin `filename` →
  `.playwright-mcp/` (ignorado).
- No borres `.playwright-mcp/` con shell.
- Usa contextos aislados para el login y no envíes formularios que no sean el login demo.
- No uses `browser_run_code_unsafe`.
- Playwright MCP **no es una frontera de seguridad**.

Reglas de Supabase MCP:

- No sustituye a la DAL: la app usa el SDK de `utils/supabase/`.
- `apply_migration({ name, query })` con el SQL completo del archivo.
- Si el MCP pide autenticación, inicia sesión desde `/mcps`, no por shell.

## Checklist antes de responder "listo"

- [ ] `npx tsc --noEmit` pasa.
- [ ] `npm run build` pasa (si el cambio lo amerita).
- [ ] `npm run lint` se reporta tal cual, sin atribuir la deuda preexistente al cambio.
- [ ] Probé la pantalla o el flujo con Playwright y comparé con la referencia.
- [ ] Los textos nuevos están en español.
- [ ] No toqué `.env.local` ni secretos.
- [ ] No hice commits ni cambié estados de spec sin pedido.
- [ ] Si verifiqué una spec, cada `[x]` tiene evidencia y agregué `## Verificación`.
- [ ] Actualicé la documentación si cambiaron comandos, rutas, MCP o flujo de specs.
- [ ] Si regeneré capturas del README, quedaron en `docs/capturas/` y sin datos de prueba.

## Errores comunes

| Síntoma | Solución |
| --- | --- |
| Login falla o no refresca la sesión | Completa las dos variables `NEXT_PUBLIC_SUPABASE_*` en `.env.local` y reinicia. |
| Usuario demo rechazado | Falta `seed_staff_user` o la fila en `users`; un usuario sin perfil falla cerrado. |
| Todos los niños con 0 padres | `parent_children` no tiene políticas RLS; se arregla con una migración. |
| Falta `next` | `npm install`. |
| Node viejo | Usa Node 20.9+ (probado con 22.23.4). |
| Estilos rotos | No agregues configuración de Tailwind v3; usa `@theme` en `app/globals.css`. |
| `middleware.ts` no corre | Renómbralo a `proxy.ts`. |
| Imports `@/lib/...` fallan | Usa `@/app/lib/...`. |
| Captura fuera del workspace | Usa `docs/capturas/...` o omite `filename`. |
| Origen LAN rechazado | Actualiza `allowedDevOrigins` en `next.config.ts`. |
| Spec bloqueada | Falta servidor, sesión o `.env.local`; repórtalo como bloqueo. |

## Enlaces

- README: [`README.md`](./README.md)
- AGENTS: [`AGENTS.md`](./AGENTS.md)
- Next.js: <https://nextjs.org/docs>
- Next.js `proxy.ts`: <https://nextjs.org/docs/app/api-reference/file-conventions/proxy>
- Tailwind v4: <https://tailwindcss.com/docs>
- Supabase Auth con Next.js: <https://supabase.com/docs/guides/auth/server-side/nextjs>
- Supabase RLS: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- OpenCode: <https://opencode.ai/docs/>
- OpenCode MCP: <https://opencode.ai/docs/mcp-servers/>
- OpenCode comandos: <https://opencode.ai/docs/commands/>
- OpenCode agentes: <https://opencode.ai/docs/agents/>
- OpenCode skills: <https://opencode.ai/docs/skills/>
- MCP: <https://modelcontextprotocol.io/>
- Context7: <https://context7.com>
- Playwright MCP: <https://github.com/microsoft/playwright-mcp>
- Skills de referencia: <https://github.com/klerith/fernando-skills>
