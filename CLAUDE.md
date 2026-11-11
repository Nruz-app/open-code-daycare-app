# CLAUDE.md — OpenDayCare

Punto de entrada para **Claude Code** (y para cualquier agente que lea `CLAUDE.md`). Resume las
reglas y el contexto del proyecto; el detalle completo está en [`AGENTS.md`](./AGENTS.md) y
[`README.md`](./README.md).

## Precedencia de la documentación

1. **`AGENTS.md`** — fuente de verdad operativa para agentes.
2. **`README.md`** — manual de producto, instalación y enlaces.
3. **`CLAUDE.md`** (este archivo) — resumen y adaptaciones para Claude Code.

Si encuentras una contradicción, gana `AGENTS.md` en lo operativo y `README.md` en lo funcional.
No dupliques decisiones nuevas en tres archivos: actualiza la fuente correspondiente y enlázala.

## Contexto del proyecto

- Portal de guardería en español con dos roles: `staff` y `family`.
- Next.js **16.4.5**, React **19.3.0**, TypeScript **5.9.3**, Tailwind CSS **4.3.5**.
- La UI se construye a partir de `references/pantallas/*.dc.html` y se compara con
  `references/screenshots/`.
- Hay autenticación de demostración con cookie HMAC-SHA256. **No hay base de datos ni persistencia.**
- El producto y los comentarios del código se escriben en **español**.

## Inicio rápido

```bash
npm install
Copy-Item .env.example .env.local   # PowerShell
# cp .env.example .env.local        # bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
# pega el resultado como SESSION_SECRET en .env.local
npm run dev
```

Abre <http://localhost:3000>. El botón **"Entrar al feed"** crea la sesión demo de `staff-demo`.

## Reglas no negociables

- Responde en **español**.
- **No inventes** resultados de comandos, Playwright, Context7 ni APIs.
- **No hagas commits** salvo que la persona lo pida explícitamente.
- **No cambies el estado** de una spec (`Draft`, `Approved`, `Implemented`, etc.); esa decisión es
  humana.
- **No edites código** para hacer pasar una verificación.
- **No leas ni imprimas** `.env.local` ni secretos.
- No borres trabajo sin revisar `git status` y el diff.
- No agregues un runner de tests: el proyecto no tiene uno. Verifica con lint, `tsc`, `build` y
  Playwright.

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

## Flujo de trabajo recomendado

### 1. Explorar antes de tocar

- Lee `AGENTS.md`, la spec correspondiente y los archivos que la spec menciona.
- Revisa `git status --short` y `git branch --show-current`.
- Si la tarea es grande, empieza por una spec.

### 2. Diseñar una spec

En OpenCode:

```text
/spec <descripción de una frase>
```

En Claude Code, si el comando no está disponible, pide:

```text
Lee .agents/skills/spec/SKILL.md y sigue su flujo para diseñar una spec de: <descripción>.
```

Reglas:

- La skill hace preguntas de aclaración antes de escribir. No las saltes.
- El archivo se guarda en `specs/NN-slug.md` en estado `Draft`.
- No se escribe código en esta fase.
- La persona revisa y cambia el estado a `Approved` cuando corresponde.

### 3. Implementar una spec aprobada

En OpenCode:

```text
/spec-impl 03-login-activar-cuenta
```

En Claude Code:

```text
Lee .agents/skills/spec-impl/SKILL.md y sigue sus fases para implementar specs/03-login-activar-cuenta.md.
```

Reglas:

- Solo si el estado significa **Aprobado**.
- Rama `spec-NN-slug` (controlado por `specs/.spec-config.yml`, `AutoCreateBranch: true`).
- Implementa paso a paso y pausa para revisar el diff.
- **Nunca hagas commit automático.**
- Si algo es ambiguo, detente y pregunta; no improvises.

### 4. Verificar

En OpenCode:

```text
/spec-verify 03
```

En Claude Code:

```text
Lee .opencode/agents/spec-verify.md y verifica specs/03-login-activar-cuenta.md con evidencia.
```

Reglas:

- Marca `[x]` solo lo que probaste en esta ejecución.
- Distingue **fallo** (la prueba salió mal) de **bloqueo** (no se pudo probar).
- Solo puedes editar `specs/*.md`; no toques código, configuración ni `.env.local`.
- Agrega la sección `## Verificación` con tabla, fallos, bloqueos y hallazgos de Context7.

## Arquitectura: autenticación y rutas

- `proxy.ts` sustituye a `middleware.ts` en Next 16 y corre en runtime Node.js.
- `proxy.ts` hace una comprobación **optimista** de la cookie; la autorización real está en
  `app/lib/dal.ts`.
- Antes de tocar datos, llama a:
  - `getSession()` → `Session | null`.
  - `verifySession()` → redirige a `/login`.
  - `requireRole("staff" | "family")` → exige rol.
- La sesión es una cookie `session` firmada con HMAC-SHA256 y `SESSION_SECRET` (32+ caracteres,
  en `.env.local`). Sin secreto, falla cerrada.
- El enrutamiento es **deny-by-default**. Registra rutas públicas o por rol en
  `PUBLIC_ROUTES`, `STAFF_ONLY`, `FAMILY_ONLY` o `HOME_BY_ROLE` de `app/lib/routes.ts`.
- `/login` firma `staff-demo` sin contraseña. El selector Familia está deshabilitado.
- `?next=` se valida contra `STAFF_ONLY` para evitar open redirects.

## Mapa de archivos clave

| Archivo | Qué hace |
| --- | --- |
| `proxy.ts` | Redirecciones y separación por rol (optimista). |
| `app/lib/dal.ts` | Autorización real. |
| `app/lib/session.ts` | Firma/verificación de la cookie. |
| `app/lib/routes.ts` | Rutas públicas y por rol. |
| `app/login/actions.ts` | Server Action `loginAsStaff`. |
| `app/login/login-form.tsx` | Formulario cliente con selector Personal/Familia. |
| `app/feed/page.tsx` | Home del staff con posts de ejemplo. |
| `app/ninos/page.tsx` | Listado de niños. |
| `app/ninos/[id]/page.tsx` | Perfil del niño. |
| `app/ninos/agregar-nino.tsx` | Modal de alta con validación. |
| `app/lib/mock-ninos.ts` | Datos de ejemplo. |
| `app/lib/fecha-nacimiento.ts` | Máscara y validación `dd/mm/aaaa`. |
| `app/globals.css` | Tailwind v4 y tokens de diseño. |
| `app/layout.tsx` | Fredoka/Nunito y metadata. |
| `specs/` | Specs `NN-slug.md`. |
| `.opencode/commands/` | Comandos `/spec`, `/spec-impl`, `/spec-imp`, `/spec-verify`. |
| `.opencode/agents/spec-verify.md` | Agente verificador. |
| `.agents/skills/` | Skills `spec`, `spec-impl`, `context7-mcp`. |
| `.github/workflows/opencode.yml` | Agente `/oc` y `/opencode`. |

## Convenciones y trampas

- `@/*` apunta a la raíz: usa `@/app/lib/...`, **no** `@/lib/...`.
- Tailwind v4 es CSS-first. No agregues `tailwind.config.*` ni PostCSS.
- `next.config.ts` activa `cacheComponents`, `partialPrefetching`,
  `experimental.agentFeedback` y el loader de `@tailwindcss/turbopack`.
- Revisa `node_modules/next/dist/docs/` antes de cambiar data fetching o caché.
- `app/page.tsx` solo redirige; el proxy decide el destino.
- En `app/ninos/[id]/page.tsx`, `export const instant = false` es intencional para que
  `notFound()` funcione con `cacheComponents`.
- `allowedDevOrigins` depende de la IP de la LAN; actualízalo si cambia.
- Los textos visibles y los comentarios van en español.

## Diseño

- **Fredoka** para títulos (`font-display`) y **Nunito** para texto (`font-sans`).
- Paleta cálida: `cream`, `surface`, `line`, `ink`, `coral`, `sky`, `mint`, `lilac`.
- Utilidades: `bg-cream`, `text-ink`, `rounded-card`, `shadow-card`.
- Compara con `references/pantallas/*.dc.html` y `references/screenshots/`.
- No cuentes el overlay de Next Dev Tools como diferencia de diseño.

## Datos

- Sin base de datos ni persistencia.
- Feed: publicaciones definidas en `app/feed/page.tsx`.
- Niños: `app/lib/mock-ninos.ts` y `getNino(id)`.
- "Agregar niño": valida y confirma en pantalla, no guarda.
- Fechas: `app/lib/fecha-nacimiento.ts`.
- Cualquier dato real futuro debe pasar por la DAL.

## Specs actuales

| Spec | Estado | Tema |
| --- | --- | --- |
| `specs/01-diseno-feed-home.md` | Implementado | Feed y base visual. |
| `specs/02-diseno-ninos-perfil.md` | Implementado | Niños y perfil. |
| `specs/03-login-activar-cuenta.md` | Implementado | Login y activación. |

## Skills y comandos

- En este repo las skills viven en `.agents/skills/`:
  - `spec/SKILL.md` (+ `template.md`).
  - `spec-impl/SKILL.md`.
  - `context7-mcp/SKILL.md`.
- `.claude/skills/` existe por compatibilidad; la fuente real está en `.agents/skills/`.
- Si Claude Code no descubre una skill, **léela directamente** con la herramienta de lectura y
  sigue sus instrucciones.
- `skills-lock.json` guarda la procedencia y el hash de las skills. Origen:
  <https://github.com/klerith/fernando-skills>.
- Los comandos `/spec`, `/spec-impl`, `/spec-imp` y `/spec-verify` son de OpenCode
  (`.opencode/commands/`). En Claude Code se invocan cargando el archivo correspondiente.

## MCP

### Si trabajas en Claude Code

Las herramientas MCP aparecen como herramientas directas (`mcp__context7__*`,
`mcp__playwright__*`). Úsalas directamente. Para instalarlas:

```bash
claude mcp list
claude mcp add playwright npx @playwright/mcp@latest
claude mcp add --scope user --header "Authorization: Bearer YOUR_API_KEY" --transport http context7 https://mcp.context7.com/mcp
```

- Playwright MCP: <https://github.com/microsoft/playwright-mcp>
- Context7: <https://context7.com>
- Instalación por cliente: <https://context7.com/docs/resources/all-clients>
- Documentación de Claude Code MCP: <https://code.claude.com/docs/en/mcp>

### Si trabajas en OpenCode (Code Mode)

Las herramientas MCP se llaman **dentro de `execute`**:

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

- Termina cada `execute` con `return`.
- Si las herramientas directas fallan con "No tool named…", usa `execute`.
- No uses `browser_run_code_unsafe`.
- `search` solo existe dentro de `execute` y no hace falta para MCP.

### Servidores del proyecto

| Servidor | Tipo | Comando / URL | Configuración |
| --- | --- | --- | --- |
| `playwright` | Local (stdio) | `npx @playwright/mcp@latest` | `opencode.json` |
| `context7` | Remoto (HTTP) | `https://mcp.context7.com/mcp` | Global del entorno |

Comandos de OpenCode:

```bash
opencode mcp list
opencode mcp add playwright -- npx @playwright/mcp@latest
opencode mcp add context7 --url https://mcp.context7.com/mcp
opencode mcp auth context7
opencode mcp logout context7
```

### Context7

| Herramienta | Parámetros | Uso |
| --- | --- | --- |
| `resolve-library-id` | `libraryName`, `query` | Resolver el ID de la librería. |
| `query-docs` | `libraryId`, `query`, `language?` | Consultar un concepto concreto. |

- Una consulta por concepto.
- Cita `libraryId`, concepto y conclusión.
- Si Context7 no responde, usa `node_modules/next/dist/docs/` y dilo.

### Playwright

Herramientas habituales:

| Herramienta | Uso |
| --- | --- |
| `browser_navigate` | Abrir URL. |
| `browser_snapshot` | Leer accesibilidad y obtener `ref`. |
| `browser_click` / `browser_type` | Interactuar. |
| `browser_evaluate` | Leer estilos y medidas. |
| `browser_resize` | Breakpoints. |
| `browser_take_screenshot` | Capturas. |
| `browser_console_messages` | Errores de consola. |
| `browser_network_requests` | Red. |
| `browser_tabs` | Sesiones aisladas. |

Reglas:

- Verifica la URL activa antes de capturar.
- Capturas sin `filename` van a `.playwright-mcp/` (ignorado por Git).
- No borres `.playwright-mcp/` con shell.
- Usa contextos aislados para el login.
- No envíes formularios que no sean el login demo.
- Playwright MCP **no es una frontera de seguridad**.

## Checklist antes de responder "listo"

- [ ] `npm run lint` pasa.
- [ ] `npx tsc --noEmit` pasa.
- [ ] `npm run build` pasa (si el cambio lo amerita).
- [ ] Probé la pantalla o el flujo con Playwright y comparé con la referencia.
- [ ] Los textos nuevos están en español.
- [ ] No toqué `.env.local` ni secretos.
- [ ] No hice commits sin pedido.
- [ ] Si verifiqué una spec, cada `[x]` tiene evidencia y agregué `## Verificación`.
- [ ] Actualicé la documentación si cambiaron comandos, rutas, MCP o flujo de specs.

> **Estado conocido (2026-11-10):** `tsc` pasa; `lint` y `build` tienen fallos **preexistentes**
> (`references/pantallas/support.js` y `/login` con `searchParams` fuera de `Suspense`). No los
> atribuyas a tu cambio ni los maquilles. Si tu tarea los toca, propón una spec aparte.

## Errores comunes

| Síntoma | Solución |
| --- | --- |
| Login en bucle | Define `SESSION_SECRET` (32+ caracteres) en `.env.local` y reinicia. |
| Falta `next` | `npm install`. |
| Node viejo | Usa Node 20.9+ (probado con 22.23.4). |
| Estilos roto | No agregues configuración de Tailwind v3; usa `@theme` en `app/globals.css`. |
| `middleware.ts` no corre | Renómbralo a `proxy.ts`. |
| Imports `@/lib/...` fallan | Usa `@/app/lib/...`. |
| Captura fuera del workspace | Omite `filename`; se guarda en `.playwright-mcp/`. |
| Origen LAN rechazado | Actualiza `allowedDevOrigins` en `next.config.ts`. |
| Spec bloqueada | Falta servidor, sesión o `.env.local`; repórtalo como bloqueo. |

## Enlaces

- README: [`README.md`](./README.md)
- AGENTS: [`AGENTS.md`](./AGENTS.md)
- Next.js: <https://nextjs.org/docs>
- Next.js `proxy.ts`: <https://nextjs.org/docs/app/api-reference/file-conventions/proxy>
- Tailwind v4: <https://tailwindcss.com/docs>
- OpenCode: <https://opencode.ai/docs/>
- OpenCode MCP: <https://opencode.ai/docs/mcp-servers/>
- OpenCode comandos: <https://opencode.ai/docs/commands/>
- OpenCode agentes: <https://opencode.ai/docs/agents/>
- OpenCode skills: <https://opencode.ai/docs/skills/>
- MCP: <https://modelcontextprotocol.io/>
- Context7: <https://context7.com>
- Playwright MCP: <https://github.com/microsoft/playwright-mcp>
- Skills de referencia: <https://github.com/klerith/fernando-skills>
