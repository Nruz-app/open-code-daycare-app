<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# OpenDayCare — notas para agentes

Portal de guardería en español con dos roles (`staff`, `family`). El repositorio es un scaffold de
`create-next-app` con una capa de autenticación funcional; la UI del producto se construye a partir
de `references/pantallas/*.dc.html`.

Este archivo es la **fuente de verdad operativa** para agentes. El manual de producto e instalación
está en [`README.md`](./README.md). El punto de entrada específico para Claude Code está en
[`CLAUDE.md`](./CLAUDE.md).

## Idioma y estilo

- Responde en **español**.
- Los textos visibles, mensajes de error y comentarios del código van en español.
- No inventes resultados de comandos, de Playwright ni de Context7. Si no pudiste probar algo,
  dilo y explica qué falta.
- No hagas commits salvo que la persona lo pida explícitamente.
- No borres ni sobrescribas trabajo sin revisar antes el estado de Git.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en el puerto 3000 con Turbopack. |
| `npm run build` | Build de producción. |
| `npm run start` | Sirve el build de producción. |
| `npm run lint` | ESLint flat config desde la raíz. |
| `npx tsc --noEmit` | Typecheck. No hay script `typecheck`. |

- No hay runner de tests. **No agregues ni ejecutes `npm test`**.
- Verifica con lint, `tsc`, `build` y el Playwright MCP configurado en `opencode.json`.
- Node.js mínimo: 20.9. El entorno de referencia usa Node 22.

## Stack

| Tecnología | Versión |
| --- | --- |
| Next.js | 16.4.5 |
| React / React DOM | 19.3.0 |
| TypeScript | 5.9.3 (declarado `^5`) |
| Tailwind CSS | 4.3.5 (declarado `^4`) |
| `@tailwindcss/turbopack` | 4.3.5 |
| ESLint | 9.39.5 (declarado `^9`) |
| OpenCode | 2.2.5 en este entorno |

## Mapa rápido del repositorio

```text
app/
├── activar-cuenta/page.tsx      # maqueta de activación familiar
├── components/app-sidebar.tsx   # sidebar compartida del staff
├── feed/page.tsx                # home del staff, protegido
├── lib/dal.ts                   # autorización real
├── lib/routes.ts                # PUBLIC/STAFF/FAMILY/HOME_BY_ROLE
├── lib/session.ts               # cookie HMAC-SHA256
├── lib/mock-ninos.ts            # datos de ejemplo
├── login/                       # página, formulario y server action
├── ninos/                       # listado, perfil y modal de alta
├── globals.css                  # Tailwind v4 + tokens
└── layout.tsx                   # Fredoka/Nunito + metadata
proxy.ts                         # middleware de Next 16
specs/                           # specs NN-slug.md
.agents/skills/                  # spec, spec-impl, context7-mcp
.opencode/commands/              # /spec, /spec-impl, /spec-imp, /spec-verify
.opencode/agents/spec-verify.md  # verificador
.github/workflows/opencode.yml   # agente /oc y /opencode
references/                      # maquetas y capturas
```

## Autenticación y rutas (la parte no obvia)

- Esta versión de Next usa `proxy.ts` en la raíz; `middleware.ts` está deprecado. `proxy.ts` corre
  en runtime Node.js.
- `proxy.ts` solo hace una comprobación **optimista** de la cookie firmada. La frontera real de
  autorización es `app/lib/dal.ts`: llama a `getSession`, `verifySession` o `requireRole(role)`
  antes de tocar datos.
- Las sesiones son cookies stateless HMAC-SHA256 (`app/lib/session.ts`); los roles son
  `staff | family`.
- `SESSION_SECRET` es obligatorio (32+ caracteres) y vive en `.env.local` (parte de
  `.env.example`). Si falta, la verificación falla cerrada.
- El enrutamiento es **deny-by-default**. Las rutas protegidas nuevas no necesitan cambios en
  `proxy.ts`, pero las rutas públicas o restringidas por rol deben registrarse en `PUBLIC_ROUTES`,
  `STAFF_ONLY`, `FAMILY_ONLY` o `HOME_BY_ROLE` en `app/lib/routes.ts`.
- `/login` es un acceso de demostración que firma `staff-demo` sin contraseña. El selector Familia
  está deshabilitado. Cuando exista autenticación real, sustituye `loginAsStaff`.
- `?next=` se valida contra `STAFF_ONLY` para evitar open redirects.

## Convenciones y trampas

- `@/*` apunta a la raíz (`tsconfig.json`), así que los imports son `@/app/lib/...`, **no**
  `@/lib/...`.
- Tailwind es v4 y CSS-first: `@import "tailwindcss"` en `app/globals.css`, compilado por la regla
  `@tailwindcss/turbopack` de `next.config.ts`. No hay `tailwind.config.*` ni PostCSS; no agregues
  configuración de v3.
- `next.config.ts` activa `cacheComponents`, `partialPrefetching` y
  `experimental.agentFeedback`. Revisa la documentación incluida en `node_modules/next/dist/docs/`
  antes de cambiar data fetching o caché.
- `app/layout.tsx` y `app/globals.css` implementan el sistema de diseño (Fredoka/Nunito, tokens
  cream/coral). El diseño objetivo está en `references/pantallas/` y `references/screenshots/`.
- `app/page.tsx` solo redirige. `proxy.ts` manda `/` al home del rol (`/feed` para staff) o a
  `/login`.
- `next.config.ts` fija `allowedDevOrigins` para la IP de la LAN; actualízala si cambia.
- En Next 16, cuando una página usa `connection()` y `notFound()` con `cacheComponents`, revisa
  `export const instant = false` (ver `app/ninos/[id]/page.tsx`).
- No leas ni imprimas `.env.local`; si necesitas comprobar que existe, usa `glob` con `.env*`.

## Diseño

- Tipografías: **Fredoka** para títulos (`font-display`) y **Nunito** para texto (`font-sans`),
  cargadas con `next/font/google`.
- Paleta cálida: `cream`, `surface`, `line`, `ink`, `coral`, `sky`, `mint`, `lilac`.
- Utilidades: `bg-cream`, `text-ink`, `rounded-card`, `shadow-card`, `font-display`.
- Compara con las maquetas `.dc.html` y con las capturas. No cuentes el overlay de Next Dev Tools
  como diferencia de diseño.
- Los textos de producto van en español.

## Datos

- No hay base de datos ni persistencia.
- `app/feed/page.tsx` define las publicaciones en el módulo.
- `app/lib/mock-ninos.ts` contiene ocho niños y `getNino(id)`.
- `app/ninos/agregar-nino.tsx` valida en cliente y confirma en pantalla, pero no guarda.
- `app/lib/fecha-nacimiento.ts` contiene la máscara y validación de `dd/mm/aaaa`.
- Toda lectura de datos real debe pasar por la DAL.

## Flujo de specs

- `/spec`, `/spec-impl` y `/spec-imp` están definidos en `.opencode/commands/` y respaldados por
  las skills de `.agents/skills/spec*`. Responden en español.
- `/spec-verify` está definido en `.opencode/commands/spec-verify.md` y respaldado por el agente
  `.opencode/agents/spec-verify.md`. Verifica criterios con evidencia, usa Context7 para Next.js y
  Playwright para pantallas, y nunca edita código.
- Las specs viven en `specs/NN-slug.md` (crea `specs/` si falta y empieza en `01-`).
- `/spec-impl` solo corre sobre una spec cuyo estado signifique **Aprobado**, crea la rama
  `spec-NN-slug` y **nunca hace commits**.
- `specs/.spec-config.yml` controla `AutoCreateBranch` (`true` por defecto).
- `/spec-verify` solo puede editar `specs/*.md`; no toca código, configuración ni `.env.local`.
- Specs actuales: `01-diseno-feed-home` (Implementado), `02-diseno-ninos-perfil` (Implementado),
  `03-login-activar-cuenta` (Implementado).

## Agentes, comandos y skills

| Archivo | Función |
| --- | --- |
| `opencode.json` | Comandos `spec`/`spec-impl` y servidor MCP `playwright`. |
| `.opencode/commands/spec.md` | Diseñar una spec. |
| `.opencode/commands/spec-impl.md` | Implementar una spec aprobada. |
| `.opencode/commands/spec-imp.md` | Alias de `/spec-impl`. |
| `.opencode/commands/spec-verify.md` | Verificar una spec. |
| `.opencode/agents/spec-verify.md` | Agente verificador restringido. |
| `.agents/skills/spec/SKILL.md` | Método de specs. |
| `.agents/skills/spec-impl/SKILL.md` | Método de implementación. |
| `.agents/skills/context7-mcp/SKILL.md` | Uso de Context7. |

El agente `spec-verify` usa el modelo `opencode/nemotron-3.5-super-vl-free`, modo `all`, permite
editar solo `specs/*.md`, permite un shell acotado y prohíbe subagentes y
`browser_run_code_unsafe`.

Instalación de OpenCode:

```bash
npm install -g @opencode/cli
opencode --version
```

Documentación: <https://opencode.ai/docs/> · Configuración:
<https://opencode.ai/docs/config/> · Comandos: <https://opencode.ai/docs/commands/> · Agentes:
<https://opencode.ai/docs/agents/> · Skills: <https://opencode.ai/docs/skills/>.

## MCP

### Servidores del proyecto

| Servidor | Tipo | Comando / URL | Dónde |
| --- | --- | --- | --- |
| `playwright` | Local (stdio) | `npx @playwright/mcp@latest` | `opencode.json` |
| `context7` | Remoto (HTTP) | `https://mcp.context7.com/mcp` | Configuración global del entorno; no está en `opencode.json` |

Comandos útiles:

```bash
opencode mcp list
opencode mcp add playwright -- npx @playwright/mcp@latest
opencode mcp add context7 --url https://mcp.context7.com/mcp
opencode mcp auth context7
opencode mcp logout context7
```

En la TUI: `/mcps`.

### Code Mode

En esta instalación, las herramientas MCP se llaman **dentro de `execute`**, no como herramientas
de primer nivel. Patrón:

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

Reglas:

- Cada llamada a `execute` debe terminar con `return`.
- Si `playwright_*` o `context7_*` aparecen como herramientas directas, puedes usarlas; si fallan
  con "No tool named…", cambia a `execute`.
- No uses `browser_run_code_unsafe`.
- `search` solo existe dentro de `execute` y no hace falta para estas herramientas.

### Context7

- Web: <https://context7.com>
- Repositorio: <https://github.com/upstash/context7>
- Instalación por cliente: <https://context7.com/docs/resources/all-clients>
- Dashboard/API key: <https://context7.com/dashboard>
- Skill del proyecto: `.agents/skills/context7-mcp/SKILL.md`

Herramientas:

| Herramienta | Parámetros | Uso |
| --- | --- | --- |
| `resolve-library-id` | `libraryName`, `query` | Obtener el ID de la librería. |
| `query-docs` | `libraryId`, `query`, `language?` | Consultar un concepto concreto. |

Una consulta por concepto. Cita el `libraryId` y contrasta con el código real.

### Playwright

- Repositorio: <https://github.com/microsoft/playwright-mcp>
- npm: <https://www.npmjs.com/package/@playwright/mcp>
- Playwright: <https://playwright.dev/docs/intro>

Herramientas habituales: `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`,
`browser_fill_form`, `browser_evaluate`, `browser_resize`, `browser_take_screenshot`,
`browser_console_messages`, `browser_network_requests`, `browser_tabs`, `browser_press_key`,
`browser_wait_for`.

Reglas:

- Comprueba la URL de la pestaña activa antes de capturar.
- Capturas sin `filename` van a `.playwright-mcp/` (ignorado por Git).
- Usa contextos aislados para probar el login.
- No modifiques datos ni envíes formularios que no sean el login demo.
- No borres `.playwright-mcp/` con shell.
- Playwright MCP **no es una frontera de seguridad**.

Documentación de seguridad MCP:
<https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices>.

## Verificación

Antes de cerrar un cambio:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Estado conocido (2026-11-10):

| Comprobación | Resultado | Detalle |
| --- | --- | --- |
| `npx tsc --noEmit` | ✅ | Sin errores. |
| `npm run lint` | ❌ preexistente | 2 errores y 8 avisos en `references/pantallas/support.js` (bundle de la maqueta). |
| `npm run build` | ❌ preexistente | `/login` lee `searchParams` fuera de `<Suspense>` con `cacheComponents`. |

No atribuyas estos fallos a tu cambio ni los maquilles para que pasen. Si tu tarea los toca,
propón una spec aparte.

Para pantallas:

1. `npm run dev`.
2. Navega con Playwright y verifica la URL.
3. Prueba `1440×900` y `375×812` (o lo que pida la spec).
4. Captura y compara con `references/screenshots/`.
5. Revisa consola y red si aplica.

Para specs:

```text
/spec-verify NN
```

No marques criterios sin evidencia de esta ejecución. Distingue fallo (la prueba salió mal) de
bloqueo (no se pudo probar).

## Agente de OpenCode en GitHub

- Workflow: `.github/workflows/opencode.yml`.
- Responde a comentarios que empiezan por `/oc` o `/opencode`.
- Requiere la app <https://github.com/apps/opencode-agent> y el secreto `OPENCODE_API_KEY` creado
  en <https://opencode.ai/console>.
- Modelo: `opencode/deepseek-v4.1-flash-free`.
- Documentación: <https://opencode.ai/docs/github/>.

## Enlaces de referencia

- README completo: [`README.md`](./README.md)
- Next.js: <https://nextjs.org/docs>
- Next.js 16 `proxy.ts`: <https://nextjs.org/docs/app/api-reference/file-conventions/proxy>
- Tailwind v4: <https://tailwindcss.com/docs>
- OpenCode: <https://opencode.ai/docs/>
- MCP: <https://modelcontextprotocol.io/>
- Context7: <https://context7.com>
- Playwright MCP: <https://github.com/microsoft/playwright-mcp>
- Specs de referencia: <https://github.com/klerith/fernando-skills>

## Reglas duras

- No inventes comandos, resultados ni APIs.
- No edites código para "hacer pasar" una verificación.
- No cambies el estado de una spec; esa decisión es humana.
- No hagas commits sin pedido explícito.
- No toques `.env.local`, secretos ni archivos fuera del alcance.
- Mantén el bloque `nextjs-agent-rules` y el bloque `nextjs-agent-feedback` de este archivo: los
  escribe `next dev` y se restauran solos.

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
