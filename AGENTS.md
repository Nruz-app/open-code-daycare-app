<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# OpenDayCare — notas para agentes

Maqueta funcional de un portal de guardería en español, con roles `staff` | `family` y login de
demostración. **La app no persiste nada**: no hay SDK de Supabase ni ORM; los datos viven en módulos
(`app/lib/mock-ninos.ts`, `const posts` del feed). Manual de producto en [`README.md`](./README.md).
`CLAUDE.md` remite a este archivo como fuente operativa, pero su tabla de specs solo cubre las
01–03: no lo uses para saber qué specs existen.

## Comandos y verificación

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Dev server en el puerto 3000 con Turbopack. |
| `npm run build` | Build de producción. |
| `npm run start` | Sirve el build. |
| `npm run lint` | ESLint flat config desde la raíz. |
| `npx tsc --noEmit` | Typecheck. No hay script `typecheck`. |

- Orden antes de cerrar un cambio: `npm run lint` → `npx tsc --noEmit` → `npm run build`.
- No hay tests ni runner. **No agregues ni ejecutes `npm test`.**
- Node.js 20.9+ (probado con 22.23.4).

Estado re-verificado el 2026-11-13:

| Comprobación | Resultado | Detalle |
| --- | --- | --- |
| `npx tsc --noEmit` | ✅ | Sin errores. |
| `npm run lint` | ❌ preexistente | 8 errores y 23 avisos: `references/pantallas/support.js` (bundle de las maquetas) y `.agents/skills/brainstorming/scripts/` (skill instalada, no es código de la app). |
| `npm run build` | ❌ preexistente | Muere prerenderizando `/login` (`searchParams` fuera de `<Suspense>` con `cacheComponents`). El build se corta ahí: no hay evidencia de las rutas siguientes. |

No atribuyas estos fallos a tu cambio, no los maquilles y no edites los bundles para "arreglar" lint.
Arreglos reales: ignorar `references/**` y los scripts de `.agents/skills/**` en `globalIgnores` de
`eslint.config.mjs` (hoy solo ignora `.next`, `out`, `build` y `next-env.d.ts`) y
`export const instant = false` o `<Suspense>` en `/login`. Van en una spec aparte.
Las tablas de verificación de `README.md` y `CLAUDE.md` (2026-11-10) están desactualizadas
(cuentan 2 errores de lint); gana la de este archivo.

## Setup

- `SESSION_SECRET` es obligatorio (32+ caracteres) en `.env.local` (plantilla en `.env.example`). Sin
  él `decodeSession` devuelve `null` y `encodeSession` lanza: no hay sesión y el login no puede
  completarse. No leas ni imprimas `.env.local`.
- `next dev` escribe y restaura los bloques `nextjs-agent-rules` / `nextjs-agent-feedback` de este
  archivo: no los borres.

## Autenticación y rutas (lo no obvio)

- Esta versión de Next usa `proxy.ts` en la raíz; `middleware.ts` está deprecado. `proxy.ts` corre en
  runtime Node.js.
- `proxy.ts` solo hace una comprobación **optimista** de la cookie firmada. La autorización real es
  `app/lib/dal.ts`: `getSession`, `verifySession` o `requireRole(role)` antes de tocar datos. Hoy las
  tres páginas con datos (`/feed`, `/ninos`, `/ninos/[id]`) usan `requireRole("staff")`.
- La sesión es una cookie stateless HMAC-SHA256 (`app/lib/session.ts`); roles `staff | family`.
- Enrutamiento **deny-by-default**: las rutas nuevas protegidas no requieren cambios en `proxy.ts`,
  pero las públicas o por rol deben registrarse en `PUBLIC_ROUTES`, `STAFF_ONLY`, `FAMILY_ONLY` o
  `HOME_BY_ROLE` de `app/lib/routes.ts`. El matching (`matches()`) es exacto o por prefijo de
  segmento: `/ninos/123` sí coincide, `/ninos-x` no.
- `app/lib/routes.ts` registra rutas que **no son páginas**: `/familia-feed` (además es
  `HOME_BY_ROLE.family`), `/familia-cuenta`, `/avisos`, `/resumen-dia`, `/crear-publicacion` y
  `/agregar-nino`. Las dos últimas se resuelven con diálogos (`app/feed/crear-publicacion.tsx` y
  `app/ninos/agregar-nino.tsx`); `/vincular-padre` también es un modal, aunque esté en
  `PUBLIC_ROUTES`. No asumas que una entrada de esas listas tiene pantalla.
- `proxy.ts` manda al home del rol a cualquier sesión que entre en una ruta pública, `/activar-cuenta`
  incluida: esas pantallas solo se ven sin sesión.
- `/login` es acceso demo: firma `staff-demo` sin contraseña y el selector Familia está deshabilitado.
  `?next=` se valida contra `STAFF_ONLY` en `app/login/actions.ts` (anti open redirect).
- También hay `logout` en `app/login/actions.ts`: borra la cookie y redirige a `/login`. Lo usa
  `app/components/logout-button.tsx` (Server Action como formulario), en la sidebar de escritorio
  y la cabecera móvil.

## Convenciones y trampas

- `@/*` apunta a la raíz (`tsconfig.json`): los imports son `@/app/lib/...`, **no** `@/lib/...`.
- Tailwind v4 es CSS-first: tokens con `@theme inline` en `app/globals.css` y loader
  `@tailwindcss/turbopack` en `next.config.ts`. No hay `tailwind.config.*` ni PostCSS; no agregues
  configuración de v3.
- `next.config.ts` activa `cacheComponents`, `partialPrefetching`, `experimental.agentFeedback` y
  fija `allowedDevOrigins` a una IP de LAN (`172.22.240.1`); actualízala si cambia.
- Con `cacheComponents`, cualquier lectura de `connection()`, `cookies()` o `searchParams` en una
  página debe ir dentro de `<Suspense>`. `/feed` y `/ninos` usan el patrón `XContent` + `<Suspense>`;
  `/login` no lo hace y es el fallo de build conocido.
- `app/ninos/[id]/page.tsx` necesita `export const instant = false` para combinar `connection()` y
  `notFound()`. Es intencional.
- Revisa `node_modules/next/dist/docs/` antes de cambiar data fetching o caché.
- `app/page.tsx` solo redirige; el proxy decide el destino según rol.
- El botón "Nueva publicación" de la sidebar solo abre el diálogo si la pantalla renderiza
  `<AppSidebar nuevaPublicacion />` dentro de `NuevaPublicacionProvider`: `/feed` envuelve su
  contenido y `app/ninos/layout.tsx` envuelve las pantallas de niños. Una pantalla nueva del staff
  necesita ese provider o el botón queda muerto. El provider es componente servidor y solo pasa al
  cliente un resumen de tres niños.

## Mapa rápido

```text
app/
├── page.tsx                     # redirige; el proxy decide el destino
├── feed/page.tsx                # home staff: posts en módulo, Suspense + requireRole
├── feed/crear-publicacion.tsx   # cliente: <dialog>, triggers y botón de la sidebar
├── components/app-sidebar.tsx   # servidor; prop nuevaPublicacion
├── components/logout-button.tsx # Server Action logout; sidebar y cabecera móvil
├── components/nueva-publicacion-provider.tsx  # servidor; destinatarios + provider
├── ninos/layout.tsx             # envuelve niños con el provider de publicación
├── ninos/page.tsx               # listado + modal de alta
├── ninos/[id]/page.tsx          # perfil; instant = false
├── ninos/agregar-nino.tsx       # modal de alta (no persiste)
├── ninos/vincular-padre.tsx     # modal de invitación (no persiste)
├── login/                       # page, formulario y server action
├── activar-cuenta/page.tsx      # maqueta pública
└── lib/{dal,session,routes,mock-ninos,fecha-nacimiento}.ts
proxy.ts                         # sustituye a middleware.ts
supabase/migrations/             # migraciones aplicadas por MCP
specs/NN-slug.md                 # specs 01–06, todas Implementado
.opencode/commands|agents/       # /spec, /spec-impl, /spec-imp, /spec-verify
.agents/skills/                  # spec, spec-impl, context7-mcp + skills instaladas (skills-lock.json)
references/pantallas/*.dc.html   # maquetas objetivo (+ references/screenshots/)
```

## Diseño

- **Fredoka** para títulos (`font-display`) y **Nunito** para texto (`font-sans`), vía
  `next/font/google`.
- Tokens en `app/globals.css`: `cream`, `paper`, `surface`, `line*`, `ink*`, `coral*`, `sky*`, `mint*`,
  `lilac*`. Utilidades: `bg-cream`, `text-ink`, `rounded-card`, `shadow-card`.
- Compara con `references/pantallas/*.dc.html` y `references/screenshots/`. El overlay de Next Dev
  Tools no cuenta como diferencia.
- Textos visibles, mensajes de error y comentarios del código en español.

## Datos

- Feed: `const posts` dentro de `app/feed/page.tsx`.
- Niños: ocho en `app/lib/mock-ninos.ts` (`ninos`, `getNino(id)`), con padres y notas.
- `agregar-nino`, `crear-publicacion` y `vincular-padre` validan en cliente y confirman en pantalla,
  pero no guardan nada.
- Fechas: `app/lib/fecha-nacimiento.ts` (máscara y validación `dd/mm/aaaa`).
- En Supabase existen la tabla `daycares` y tres guarderías demo, pero la app no las lee.
- Cualquier lectura de datos real futura debe pasar por la DAL.

## Migraciones (Supabase)

- Proyecto: `btknjzobaqtekofvfsof`. Diccionario de tablas en
  `references/DB-Schema/opendaycare-database-schema.md`: es el objetivo, no el estado. Solo existe
  `daycares`; las otras doce tablas son referencia.
- Los cambios de esquema viven en `supabase/migrations/` como `YYYYMMDDHHMMSS_snake_case.sql`, con el
  timestamp UTC de creación y un solo cambio lógico por archivo.
- Contenido: DDL o DML plano, sin `if not exists`, sin `drop` y sin `begin`/`commit` manual.
- Se aplican con `tools.supabase.apply_migration({ name, query })`; `name` es el slug sin timestamp
  (`create_daycares`) y `query` es el SQL completo del archivo. `apply_migration` asigna su propio
  `version`: no coincide con el prefijo del archivo, empareja por `name`.
- `tools.supabase.list_migrations()` es la fuente para saber qué se aplicó (hoy `create_daycares` y
  `seed_daycares`). Una migración aplicada no se edita: cualquier corrección va en un archivo nuevo.
- El archivo del repositorio y el historial de Supabase deben coincidir en contenido y cantidad.
- `daycares` tiene RLS habilitado sin políticas; el aviso `rls_enabled_no_policy` es informativo y
  esperado hasta la spec de `users` y autenticación.

## Flujo de specs

- Specs en `specs/NN-slug.md`. `/spec`, `/spec-impl` y `/spec-imp` están en `.opencode/commands/` y se
  apoyan en `.agents/skills/spec*`.
- `/spec-impl` solo corre con estado **Aprobado**, crea la rama `spec-NN-slug`
  (`specs/.spec-config.yml` → `AutoCreateBranch: true`) y **no hace commits**.
- La skill `spec-impl` sugiere marcar la spec como Implementado y commitear al final. En este repo
  **no**: commits y cambios de estado solo si la persona lo pide explícitamente.
- `/spec-verify` usa el agente `.opencode/agents/spec-verify.md` (modelo
  `opencode/nemotron-3.5-super-vl-free`), solo edita `specs/*.md`, marca `[x]` únicamente con
  evidencia de esa ejecución y distingue fallo (la prueba salió mal) de bloqueo (no se pudo probar).
- Las tres piezas del flujo descubren y cargan **condicionalmente** skills de apoyo de
  `.agents/skills/` (escaneo del inventario en cada ejecución) y el MCP de Supabase cuando el tema
  aplica. Las de apoyo deciden el "cómo", nunca el "qué" de la spec: los detalles están en sus
  secciones "Supporting skills" / "Skills de apoyo".

## MCP

- `playwright` está en `opencode.json` (local, `npx @playwright/mcp@latest`). `context7` es
  configuración global del entorno, no está en `opencode.json`.
- `supabase` está en `opencode.json` como servidor remoto, apuntando al proyecto
  `btknjzobaqtekofvfsof`. Es para consultar docs/esquema, migrar y depurar; la app todavía **no** tiene
  SDK ni persistencia. Si `opencode mcp list` lo marca como `needs authentication`, inicia sesión
  desde `/mcps` (no ejecutes `opencode mcp auth` por shell). En Code Mode sus herramientas son
  `tools.supabase.<tool>`.
- En Code Mode las herramientas MCP se llaman **dentro de `execute`** y cada llamada termina con
  `return`:

```js
const out = await tools.supabase.list_migrations();
return out;
```

- No uses `browser_run_code_unsafe`. Verifica la URL de la pestaña activa antes de capturar; las
  capturas sin `filename` van a `.playwright-mcp/` (ignorado por Git), no la borres con shell.
- Usa contextos aislados para el login y no envíes otros formularios. Playwright MCP no es una
  frontera de seguridad.

## Agente de OpenCode en GitHub

`.github/workflows/opencode.yml` responde a comentarios que empiezan por `/oc` o `/opencode`. Requiere
la app <https://github.com/apps/opencode-agent> y el secreto `OPENCODE_API_KEY`. Modelo:
`opencode/deepseek-v4.1-flash-free`.

## Reglas duras

- Responde en español y no inventes comandos, resultados, APIs ni pruebas.
- No edites código para "hacer pasar" una verificación.
- No hagas commits ni cambies el estado de una spec sin pedido explícito.
- No toques `.env.local`, secretos ni archivos fuera del alcance.

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
