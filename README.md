# OpenDayCare

Portal web en español para una guardería. Tiene dos roles (`staff` y `family`) y una capa de
autenticación propia basada en una cookie de sesión firmada con HMAC-SHA256. La UI del producto se
construye a partir de las maquetas de `references/pantallas/*.dc.html`.

- **Repositorio:** <https://github.com/Nruz-app/open-code-daycare-app>
- **Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4
- **Idioma del producto:** español (textos, mensajes de error y comentarios del código)
- **Estado:** maqueta funcional con autenticación de demostración. No hay base de datos ni
  persistencia real todavía.

> Este README es el manual completo. Para las reglas operativas de los agentes de IA, consulta
> [`AGENTS.md`](./AGENTS.md) y [`CLAUDE.md`](./CLAUDE.md).

---

## Índice

1. [Qué incluye](#qué-incluye)
2. [Stack y versiones](#stack-y-versiones)
3. [Requisitos](#requisitos)
4. [Instalación rápida](#instalación-rápida)
5. [Variables de entorno](#variables-de-entorno)
6. [Scripts](#scripts)
7. [Estructura del proyecto](#estructura-del-proyecto)
8. [Rutas y roles](#rutas-y-roles)
9. [Autenticación y sesión](#autenticación-y-sesión)
10. [Diseño y sistema visual](#diseño-y-sistema-visual)
11. [Datos de ejemplo](#datos-de-ejemplo)
12. [Flujo de specs](#flujo-de-specs)
13. [Agentes, comandos y skills](#agentes-comandos-y-skills)
14. [MCP: Context7 y Playwright](#mcp-context7-y-playwright)
15. [Agente de OpenCode en GitHub](#agente-de-opencode-en-github)
16. [Verificación y calidad](#verificación-y-calidad)
17. [Solución de problemas](#solución-de-problemas)
18. [Pendientes y siguiente alcance](#pendientes-y-siguiente-alcance)
19. [Enlaces oficiales](#enlaces-oficiales)
20. [Licencia](#licencia)

---

## Qué incluye

Implementado y navegable:

- `/login` — pantalla de acceso con selector Personal/Familia. Solo el acceso de Personal crea
  sesión; Familia muestra el aviso "El portal de familias llega pronto.".
- `/activar-cuenta` — maqueta del flujo de invitación para familias (código, email y contraseña).
- `/feed` — home del personal con sidebar, composer decorativo y tres publicaciones de ejemplo
  (logro, actividad con foto y anuncio general).
- `/ninos` — listado de ocho niños de la sala Soles, buscador decorativo y botón "Agregar niño"
  con un `<dialog>` nativo que valida el formulario en cliente.
- `/ninos/[id]` — perfil de cada niño con datos, notas, alergias y padres vinculados.
- Redirección de `/` al home del rol (`/feed` para `staff`, `/familia-feed` para `family`).

Maquetas de referencia disponibles pero todavía **sin ruta implementada**:

- `/familia-feed`, `/familia-cuenta`, `/avisos`, `/crear-publicacion`, `/resumen-dia`,
  `/vincular-padre` y `/agregar-nino` (esta última se resuelve con el modal de `/ninos`).

Todavía **no** existe:

- Base de datos, ORM, API de datos o persistencia.
- Autenticación real con contraseña. `/login` firma una sesión fija de `staff-demo`.
- Portal funcional de familias.
- Tests automatizados. La verificación se hace con lint, `tsc`, `build` y Playwright MCP.

---

## Stack y versiones

| Tecnología | Versión declarada | Versión instalada | Documentación |
| --- | --- | --- | --- |
| Next.js | `16.4.5` | `16.4.5` | <https://nextjs.org/docs> |
| React / React DOM | `19.3.0` | `19.3.0` | <https://react.dev/> |
| TypeScript | `^5` | `5.9.3` | <https://www.typescriptlang.org/docs/> |
| Tailwind CSS | `^4` | `4.3.5` | <https://tailwindcss.com/docs> |
| `@tailwindcss/turbopack` | `^4` | `4.3.5` | <https://tailwindcss.com/docs/installation/framework-guides/nextjs> |
| ESLint | `^9` | `9.39.5` | <https://eslint.org/docs/latest/> |
| Node.js | `>=20.9.0` (requisito de Next) | probado con `22.23.4` | <https://nodejs.org/en/download> |
| OpenCode (agente) | — | `2.2.5` en este entorno | <https://opencode.ai/docs/> |

Notas de versión:

- El proyecto usa convenciones de **Next.js 16**. En esta versión `middleware.ts` está deprecado y
  el archivo de intercepción se llama `proxy.ts`.
- Tailwind es **v4 CSS-first**: no hay `tailwind.config.*` ni configuración de PostCSS. Los tokens
  viven en `app/globals.css` con `@theme inline`.
- `next.config.ts` activa `cacheComponents`, `partialPrefetching`,
  `experimental.agentFeedback` y el loader de `@tailwindcss/turbopack`.

---

## Requisitos

- **Node.js 20.9 o superior** y npm. El proyecto usa `package-lock.json`, así que el gestor de
  paquetes previsto es **npm**.
- Git.
- Opcional para trabajar con agentes:
  - **OpenCode** (CLI, escritorio o web): <https://opencode.ai/docs/>
  - **Context7 MCP** para documentación actualizada de librerías:
    <https://context7.com>
  - **Playwright MCP** para navegar y verificar pantallas:
    <https://github.com/microsoft/playwright-mcp>

---

## Instalación rápida

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/Nruz-app/open-code-daycare-app.git
cd open-code-daycare-app
npm install
```

También puedes partir de cero con el CLI oficial de Next.js:

```bash
npx create-next-app@latest
```

Documentación: <https://nextjs.org/docs/app/api-reference/cli/create-next-app>

### 2. Crear el archivo de entorno

**PowerShell (Windows):**

```powershell
Copy-Item .env.example .env.local
```

**Bash (Linux/macOS):**

```bash
cp .env.example .env.local
```

Genera un secreto de 32+ caracteres:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Pega el resultado en `.env.local`:

```dotenv
SESSION_SECRET=el-valor-generado
```

`.env.local` está ignorado por Git. **No lo subas al repositorio.**

### 3. Arrancar el servidor de desarrollo

```bash
npm run dev
```

Abre <http://localhost:3000>. El proxy redirige a `/login` si no hay sesión. En el login, el botón
**"Entrar al feed"** crea la sesión de demostración de Caro (`staff-demo`) y lleva a `/feed`.

### 4. Verificar la instalación

```bash
npm run lint
npx tsc --noEmit
npm run build
```

---

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `SESSION_SECRET` | Sí | Clave HMAC-SHA256 para firmar y verificar la cookie de sesión. Mínimo 32 caracteres. Si falta, la verificación falla cerrada y no se puede iniciar sesión. |

Plantilla en [`.env.example`](./.env.example). En producción, `secure` se activa automáticamente
porque la cookie se marca `secure: process.env.NODE_ENV === "production"`.

---

## Scripts

| Comando | Qué hace | Equivalente manual |
| --- | --- | --- |
| `npm run dev` | Servidor de desarrollo en el puerto 3000 con Turbopack. | `next dev` |
| `npm run build` | Build de producción. | `next build` |
| `npm run start` | Sirve el build de producción. | `next start` |
| `npm run lint` | ESLint con flat config desde la raíz. | `eslint` |
| `npx tsc --noEmit` | Typecheck sin emitir archivos. No hay script `typecheck`. | `tsc --noEmit` |

No hay runner de tests configurado. **No ejecutes `npm test`**: no existe. La verificación funcional
se hace con Playwright MCP.

---

## Estructura del proyecto

```text
open-daycare/
├── app/
│   ├── activar-cuenta/page.tsx      # Maqueta de activación de cuenta familiar
│   ├── components/app-sidebar.tsx   # Sidebar compartida del personal
│   ├── feed/page.tsx                # Home del staff (protegido)
│   ├── lib/
│   │   ├── dal.ts                   # Data Access Layer: getSession, verifySession, requireRole
│   │   ├── fecha-nacimiento.ts      # Máscara y validación de dd/mm/aaaa
│   │   ├── mock-ninos.ts            # Datos de ejemplo de niños y padres
│   │   ├── routes.ts                # PUBLIC_ROUTES, STAFF_ONLY, FAMILY_ONLY, HOME_BY_ROLE
│   │   └── session.ts               # Firma, codificación y decodificación de la sesión
│   ├── login/
│   │   ├── actions.ts               # Server Action loginAsStaff
│   │   ├── login-form.tsx           # Formulario cliente con selector de rol
│   │   └── page.tsx                 # Pantalla de login
│   ├── ninos/
│   │   ├── [id]/page.tsx            # Perfil del niño (protegido, 404 si no existe)
│   │   ├── agregar-nino.tsx         # Modal cliente con validación
│   │   └── page.tsx                 # Listado de niños (protegido)
│   ├── globals.css                  # Tailwind v4 + tokens de diseño
│   ├── layout.tsx                   # Fuentes Fredoka/Nunito y metadata
│   └── page.tsx                     # Redirect de respaldo a /feed
├── references/
│   ├── pantallas/*.dc.html          # Maquetas HTML de referencia
│   └── screenshots/*.png            # Capturas de referencia
├── specs/                           # Specs del flujo spec-driven
│   ├── .spec-config.yml             # AutoCreateBranch
│   ├── 01-diseno-feed-home.md
│   ├── 02-diseno-ninos-perfil.md
│   └── 03-login-activar-cuenta.md
├── .agents/skills/                  # Skills del proyecto (spec, spec-impl, context7-mcp)
├── .claude/skills/                  # Compatibilidad con Claude Code
├── .opencode/
│   ├── agents/spec-verify.md        # Agente verificador
│   └── commands/*.md                # /spec, /spec-impl, /spec-imp, /spec-verify
├── .github/workflows/opencode.yml   # Agente de OpenCode en GitHub
├── .playwright-mcp/                 # Capturas y artefactos de Playwright (ignorado)
├── proxy.ts                         # "Middleware" de Next 16 (runtime Node.js)
├── next.config.ts                   # cacheComponents, partialPrefetching, Turbopack
├── skills-lock.json                 # Procedencia y hash de las skills
├── AGENTS.md                        # Notas operativas para agentes
├── CLAUDE.md                        # Punto de entrada para Claude Code
└── README.md
```

Alias de importación: `@/*` apunta a la raíz del repositorio (`tsconfig.json`). Por eso los imports
son `@/app/lib/...`, **no** `@/lib/...`.

---

## Rutas y roles

La configuración vive en [`app/lib/routes.ts`](./app/lib/routes.ts). El enrutamiento es
**deny-by-default**: todo lo que no esté en `PUBLIC_ROUTES` exige sesión.

### Rutas públicas

| Ruta | Estado | Descripción |
| --- | --- | --- |
| `/login` | Implementada | Acceso de demostración. |
| `/activar-cuenta` | Implementada | Activación de invitación familiar. |
| `/vincular-padre` | Registrada, sin página | Enlace de invitación para familias. |

### Rutas del personal (`staff`)

| Ruta | Estado | Descripción |
| --- | --- | --- |
| `/feed` | Implementada | Home del personal. |
| `/ninos` | Implementada | Listado de niños. |
| `/agregar-nino` | Registrada; se usa el modal de `/ninos` | Alta de niño. |
| `/resumen-dia` | Registrada, sin página | Resumen diario. |
| `/avisos` | Registrada, sin página | Avisos. |
| `/crear-publicacion` | Registrada, sin página | Crear publicación. |

### Rutas de familias (`family`)

| Ruta | Estado | Descripción |
| --- | --- | --- |
| `/familia-feed` | Registrada, sin página | Feed de la familia. |
| `/familia-cuenta` | Registrada, sin página | Cuenta de la familia. |

### Homes por rol

| Rol | Home |
| --- | --- |
| `staff` | `/feed` |
| `family` | `/familia-feed` |

**Importante:** si agregas una ruta pública o restringida, regístrala en `PUBLIC_ROUTES`,
`STAFF_ONLY`, `FAMILY_ONLY` o `HOME_BY_ROLE`. Las rutas protegidas nuevas no necesitan cambios en
`proxy.ts`.

---

## Autenticación y sesión

Hay dos capas, y solo una es la frontera real de autorización:

1. **`proxy.ts` (optimista).** Lee la cookie, verifica la firma y aplica redirecciones:
   - `/` → home del rol o `/login`.
   - Ruta protegida sin sesión → `/login?next=<ruta>`.
   - Sesión válida en `/login` o `/activar-cuenta` → home del rol.
   - `staff` en ruta `FAMILY_ONLY` → `/feed`.
   - `family` en ruta `STAFF_ONLY` → `/familia-feed`.

2. **`app/lib/dal.ts` (autorización real).** Toda página o acción que toque datos debe llamar a:
   - `getSession()` — devuelve `Session | null` sin redirigir.
   - `verifySession()` — exige sesión y redirige a `/login`.
   - `requireRole("staff" | "family")` — exige sesión y rol; redirige al home del rol si no coincide.

### Cookie de sesión

- Nombre: `session`.
- Formato: `payload.signature` en base64url.
- Firma: HMAC-SHA256 con `SESSION_SECRET`.
- Expiración: 7 días.
- Atributos: `httpOnly`, `sameSite: "lax"`, `path: "/"`, `secure` en producción.

### Login de demostración

`app/login/actions.ts` crea una sesión fija:

```ts
createSession("staff-demo", "staff");
```

Acepta un `next` opcional y lo valida contra `STAFF_ONLY` para evitar open redirects. Cuando exista
autenticación real, esta acción debe sustituirse por la del login verdadero.

---

## Diseño y sistema visual

La referencia visual es `references/pantallas/`. Las capturas de `references/screenshots/` sirven
para comparar resultados.

### Tipografías

- **Fredoka** para títulos (`font-display`).
- **Nunito** para texto (`font-sans`).
- Ambas se cargan con `next/font/google` en `app/layout.tsx` y se exponen como variables CSS.

### Tokens principales (`app/globals.css`)

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-cream` | `#f6ecdf` | Fondo general |
| `--color-surface` | `#fffdf9` | Tarjetas |
| `--color-line` | `#ece0d0` | Bordes |
| `--color-ink` | `#3f362e` | Texto principal |
| `--color-ink-muted` | `#94887b` | Texto secundario |
| `--color-coral` | `#ee8164` | Acento principal |
| `--color-coral-deep` | `#d9583c` | Acento fuerte |
| `--color-sky` | `#a9d9e8` | Actividad |
| `--color-mint` | `#3e9b6c` | Logro |
| `--color-lilac` | `#4e72c8` | Anuncio |
| `--radius-card` | `20px` | Tarjetas |
| `--shadow-card` | `0 4px 16px -12px rgba(120, 90, 60, 0.5)` | Sombra de tarjeta |

Los tokens se usan como utilidades de Tailwind: `bg-cream`, `text-ink`, `font-display`,
`rounded-card`, `shadow-card`, etc.

### Reglas de diseño

- No agregues `tailwind.config.*` ni PostCSS: Tailwind v4 es CSS-first.
- Mantén la paleta cálida y los radios/sombras existentes.
- Compara cada pantalla con su `.dc.html` y con las capturas de referencia.
- Los textos visibles van en español.

---

## Datos de ejemplo

- `app/feed/page.tsx` define las publicaciones directamente en el módulo.
- `app/lib/mock-ninos.ts` contiene ocho niños con padres, alergias y notas. `getNino(id)` devuelve
  `undefined` si el id no existe.
- `app/ninos/agregar-nino.tsx` valida nombre y fecha, y confirma en pantalla, pero **no guarda**
  nada.
- `app/lib/fecha-nacimiento.ts` contiene la máscara `dd/mm/aaaa` y la validación de fechas reales,
  no futuras y con año entre 2000 y el actual.

No hay capa de datos ni estado compartido entre pantallas. Si agregas persistencia, respeta la DAL
y no leas datos directamente desde componentes sin autorización.

---

## Flujo de specs

El proyecto usa el método **spec-driven**: primero se escribe una spec verificable, luego se aprueba
y solo entonces se implementa.

### Specs existentes

| Spec | Estado | Fecha | Tema |
| --- | --- | --- | --- |
| [`01-diseno-feed-home.md`](./specs/01-diseno-feed-home.md) | Implementado | 2026-11-09 | Feed y base visual |
| [`02-diseno-ninos-perfil.md`](./specs/02-diseno-ninos-perfil.md) | Implementado | 2026-11-10 | Niños y perfil |
| [`03-login-activar-cuenta.md`](./specs/03-login-activar-cuenta.md) | Implementado | 2026-11-10 | Login y activación |

### Comandos

| Comando | Qué hace | Archivo |
| --- | --- | --- |
| `/spec <descripción>` | Diseña una spec con preguntas de aclaración y la guarda en `specs/NN-slug.md` en estado `Draft`. Nunca escribe código. | `.opencode/commands/spec.md` |
| `/spec-impl <NN-slug>` | Implementa una spec **aprobada** en la rama `spec-NN-slug`, paso a paso y sin commits automáticos. | `.opencode/commands/spec-impl.md` |
| `/spec-imp <NN-slug>` | Alias exacto de `/spec-impl`. | `.opencode/commands/spec-imp.md` |
| `/spec-verify <NN-slug>` | Verifica los criterios con evidencia, marca `[x]` solo lo comprobado y reporta fallos. No edita código. | `.opencode/commands/spec-verify.md` |

### Reglas del flujo

- `/spec-impl` solo continúa si el estado significa **Aprobado** (`Approved`, `Aprobado`, etc.).
- La rama se llama `spec-NN-slug` (por ejemplo `spec-03-login-activar-cuenta`).
- `specs/.spec-config.yml` controla la creación automática de rama:
  - `AutoCreateBranch: true` (por defecto) → crea y cambia de rama sin preguntar.
  - `AutoCreateBranch: false` → pregunta `[y/N]`.
- `/spec-impl` **nunca hace commits**. Los commits los decide la persona.
- `/spec-verify` solo puede editar `specs/*.md`; no toca código, configuración ni `.env.local`.
- Las specs se numeran `NN-slug.md`; si `specs/` no existe, se empieza en `01-`.

### Skills que respaldan el flujo

| Skill | Archivo | Origen |
| --- | --- | --- |
| `spec` | `.agents/skills/spec/SKILL.md` (+ `template.md`) | `klerith/fernando-skills` |
| `spec-impl` | `.agents/skills/spec-impl/SKILL.md` | `klerith/fernando-skills` |
| `context7-mcp` | `.agents/skills/context7-mcp/SKILL.md` | Documentación de Context7 |

`skills-lock.json` guarda la procedencia y el hash de cada skill para detectar cambios. Repositorio
fuente: <https://github.com/klerith/fernando-skills>.

---

## Agentes, comandos y skills

OpenCode descubre comandos, agentes y skills desde el proyecto y desde la configuración global.

### Archivos del proyecto

| Archivo | Tipo | Función |
| --- | --- | --- |
| `opencode.json` | Configuración | Declara los comandos `spec` y `spec-impl` y el servidor MCP `playwright`. |
| `.opencode/commands/spec.md` | Comando | Diseñar una spec. |
| `.opencode/commands/spec-impl.md` | Comando | Implementar una spec aprobada. |
| `.opencode/commands/spec-imp.md` | Comando | Alias de implementación. |
| `.opencode/commands/spec-verify.md` | Comando | Verificar una spec con el agente `spec-verify`. |
| `.opencode/agents/spec-verify.md` | Agente | Verificador con permisos restringidos. |
| `.agents/skills/spec/SKILL.md` | Skill | Método para escribir specs. |
| `.agents/skills/spec-impl/SKILL.md` | Skill | Método para implementar specs. |
| `.agents/skills/context7-mcp/SKILL.md` | Skill | Cómo consultar Context7. |
| `.claude/skills/` | Compatibilidad | Directorio que OpenCode/Claude también exploran. La fuente real está en `.agents/skills/`. |

### Agente `spec-verify`

- Modelo configurado: `opencode/nemotron-3.5-super-vl-free`.
- Modo: `all`.
- Permisos:
  - Editar solo `specs/*.md`.
  - Shell limitado a `npm run lint`, `npx tsc --noEmit`, `npm run dev`, `npm run build`,
    `git status`, `git diff`, `curl`, `Get-Date`, `echo`, `Test-Path`, `Start-Sleep`.
  - Sin subagentes.
  - Sin `browser_run_code_unsafe`.
- Obligaciones: usar Context7 para validar convenciones de Next.js, usar Playwright para pantallas,
  marcar solo con evidencia y no cambiar el estado de la spec.

### Instalar OpenCode

```bash
npm install -g @opencode/cli
opencode --version
```

Métodos alternativos (Homebrew, curl, Bun, pnpm, binarios):

- Documentación: <https://opencode.ai/docs/>
- Configuración: <https://opencode.ai/docs/config/>
- Comandos: <https://opencode.ai/docs/commands/>
- Agentes: <https://opencode.ai/docs/agents/>
- Skills: <https://opencode.ai/docs/skills/>

---

## MCP: Context7 y Playwright

**MCP** (Model Context Protocol) es el protocolo abierto con el que un agente se conecta a
servidores que exponen herramientas, recursos y prompts. Especificación:
<https://modelcontextprotocol.io/>.

Este proyecto usa dos servidores MCP:

| Servidor | Tipo | Comando / URL | Configurado en |
| --- | --- | --- | --- |
| `playwright` | Local (stdio) | `npx @playwright/mcp@latest` | `opencode.json` del repo |
| `context7` | Remoto (HTTP) | `https://mcp.context7.com/mcp` | Configuración global de OpenCode de este entorno; no está declarado en `opencode.json` |

### Playwright MCP

- Página oficial: <https://github.com/microsoft/playwright-mcp>
- Paquete npm: <https://www.npmjs.com/package/@playwright/mcp>
- Documentación de Playwright: <https://playwright.dev/docs/intro>

Configuración actual del repo (`opencode.json`):

```json
{
  "mcp": {
    "servers": {
      "playwright": {
        "type": "local",
        "command": ["npx", "@playwright/mcp@latest"]
      }
    }
  }
}
```

Comando equivalente para agregarlo desde el CLI de OpenCode:

```bash
opencode mcp add playwright -- npx @playwright/mcp@latest
```

Verificar la conexión:

```bash
opencode mcp list
```

En la TUI también puedes usar `/mcps` para ver, conectar o autenticar servidores.

#### Herramientas de Playwright usadas

| Herramienta | Para qué |
| --- | --- |
| `browser_navigate` | Abrir una URL. |
| `browser_snapshot` | Leer la página como árbol de accesibilidad y obtener `ref` de elementos. |
| `browser_click` | Hacer clic en un elemento por `ref`. |
| `browser_type` / `browser_fill_form` | Escribir en campos y formularios. |
| `browser_evaluate` | Leer valores objetivos (`getComputedStyle`, medidas, `location.href`). |
| `browser_resize` | Probar breakpoints, por ejemplo `1440×900` y `375×812`. |
| `browser_take_screenshot` | Capturar la pantalla para comparar con las referencias. |
| `browser_console_messages` | Revisar errores de consola. |
| `browser_network_requests` | Revisar peticiones y recursos. |
| `browser_tabs` | Abrir pestañas aisladas para probar sesiones. |
| `browser_press_key` | Enviar teclas (Escape, Enter, etc.). |
| `browser_wait_for` | Esperar texto o un tiempo. |

Reglas de uso en este repo:

- No uses `browser_run_code_unsafe`.
- Antes de capturar, comprueba la URL de la pestaña activa con `browser_evaluate`.
- Las capturas sin `filename` se guardan en `.playwright-mcp/`, que está en `.gitignore`.
- No borres `.playwright-mcp/` con shell.
- Usa contextos aislados para probar el login sin arrastrar cookies.
- No modifiques datos ni envíes formularios que no sean el login de demostración.

### Context7

- Web: <https://context7.com>
- Repositorio: <https://github.com/upstash/context7>
- Instalación manual para todos los clientes: <https://context7.com/docs/resources/all-clients>
- Dashboard / API key: <https://context7.com/dashboard>
- Paquete npm del servidor: <https://www.npmjs.com/package/@upstash/context7-mcp>
- CLI `ctx7`: <https://www.npmjs.com/package/ctx7>

Configuración remota recomendada para OpenCode:

```bash
opencode mcp add context7 --url https://mcp.context7.com/mcp
```

Con API key (opcional, mejora los límites de uso):

```bash
opencode mcp add context7 \
  --url https://mcp.context7.com/mcp \
  --header 'Authorization=Bearer {env:CONTEXT7_API_KEY}'
```

Equivalente en `opencode.json`:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "type": "remote",
        "url": "https://mcp.context7.com/mcp"
      }
    }
  }
}
```

Con API key:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "type": "remote",
        "url": "https://mcp.context7.com/mcp",
        "oauth": false,
        "headers": {
          "Authorization": "Bearer {env:CONTEXT7_API_KEY}"
        }
      }
    }
  }
}
```

Instalación automática opcional (requiere Node.js 22.13+):

```bash
npx ctx7 setup --opencode
```

Para Claude Code:

```bash
claude mcp add --scope user --header "Authorization: Bearer YOUR_API_KEY" --transport http context7 https://mcp.context7.com/mcp
```

#### Herramientas de Context7

| Herramienta | Parámetros | Qué hace |
| --- | --- | --- |
| `resolve-library-id` | `libraryName` (requerido), `query` (requerido) | Convierte un nombre de librería en un ID compatible con Context7. |
| `query-docs` | `libraryId` (requerido), `query` (requerido), `language` (opcional) | Devuelve documentación y ejemplos actualizados para un concepto concreto. |

Flujo recomendado:

1. Resolver el ID con `resolve-library-id`.
2. Consultar un solo concepto por llamada con `query-docs`.
3. Contrastar la recomendación con el código real.
4. Citar el `libraryId`, el concepto y la conclusión.

### Code Mode: cómo se llaman las herramientas MCP

En esta instalación, las herramientas MCP se agrupan dentro de la herramienta `execute` de Code
Mode, no se llaman como herramientas de primer nivel. Patrón:

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

- Cada llamada a `execute` debe terminar con `return` para ver el resultado.
- Si las herramientas `playwright_*` o `context7_*` aparecen como herramientas directas en tu
  sesión, puedes usarlas; si fallan con "No tool named…", cambia a `execute`.
- No uses `browser_run_code_unsafe`.
- No uses `search` para estas herramientas: ya están en el catálogo de `execute`.

### Seguridad de MCP

- Playwright MCP **no es una frontera de seguridad**. No lo uses para proteger datos.
- No expongas secretos en prompts, capturas ni configuración versionada.
- Guarda claves en variables de entorno, no en `opencode.json`.
- Revisa la documentación de seguridad de MCP:
  <https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices>

---

## Agente de OpenCode en GitHub

El workflow [`.github/workflows/opencode.yml`](./.github/workflows/opencode.yml) responde a
comentarios que empiezan por `/oc` o `/opencode` en issues, pull requests y revisiones.

### Activación

1. Instala la app en el repositorio: <https://github.com/apps/opencode-agent>
2. Crea una API key gratuita en <https://opencode.ai/console> (workspace Personal).
3. Guarda la clave como secreto `OPENCODE_API_KEY` en
   **Settings → Secrets and variables → Actions**.
4. Haz commit y push del workflow.

### Detalles

- Acción: `anomalyco/opencode/github@latest`
- Modelo: `opencode/deepseek-v4.1-flash-free` (capa gratuita de OpenCode Console)
- Permisos: `id-token: write` y `contents: read`
- Documentación: <https://opencode.ai/docs/github/>

Uso:

```text
/oc revisa este PR y sugiere mejoras
/opencode explica el fallo de este issue
```

---

## Verificación y calidad

### Checklist mínimo antes de cerrar un cambio

```bash
npm run lint
npx tsc --noEmit
npm run build
```

### Estado de verificación conocido (2026-11-10)

| Comprobación | Resultado | Detalle |
| --- | --- | --- |
| `npx tsc --noEmit` | ✅ Pasa | Sin errores. |
| `npm run lint` | ❌ Deuda preexistente | 2 errores y 8 avisos en `references/pantallas/support.js`, un bundle de la maqueta que no forma parte de la app. |
| `npm run build` | ❌ Deuda preexistente | `/login` lee `searchParams` fuera de `<Suspense>` con `cacheComponents` activo. Next pide `Suspense` o `export const instant = false`. |

Estos dos fallos **no los introduce la documentación** ni un cambio de UI normal: ya existen en el
estado actual del repositorio. Si tu tarea toca `app/login/page.tsx` o el lint, corrígelos en una
spec aparte; no los maquilles para que la verificación pase.

### Verificación visual con Playwright MCP

1. Arranca el servidor:

   ```bash
   npm run dev
   ```

2. Navega a la pantalla y comprueba la URL activa.
3. Toma un snapshot para localizar elementos.
4. Prueba los breakpoints de la spec (`1440×900` y `375×812`, o los que pida).
5. Captura con `browser_take_screenshot` y compara con `references/screenshots/`.
6. Revisa consola y red si el criterio lo pide.

### Verificación de specs

```text
/spec-verify 03
```

El agente `spec-verify`:

- Lee `AGENTS.md` y la spec.
- Extrae los criterios de aceptación.
- Ejecuta `npx tsc --noEmit` y `npm run lint`.
- Consulta Context7 para las convenciones de Next.js.
- Usa Playwright para pantallas, responsive y estilos calculados.
- Marca `[x]` solo lo que pudo probar y agrega una sección `## Verificación`.

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| El login no crea sesión o redirige en bucle | Falta `SESSION_SECRET` o tiene menos de 32 caracteres | Créalo en `.env.local` con el comando de generación y reinicia `npm run dev`. |
| `next: command not found` | Dependencias no instaladas | `npm install`. |
| Error de versión de Node | Node menor a 20.9 | Actualiza Node a 20.9+ (probado con 22.23.4). |
| El puerto 3000 está ocupado | Otro proceso lo usa | Detén ese proceso o arranca con `npm run dev -- -p 3001`. No mates procesos que no iniciaste. |
| Los estilos no se aplican | Se agregó configuración de Tailwind v3 | Elimina `tailwind.config.*` y PostCSS; usa `@import "tailwindcss"` y `@theme` en `app/globals.css`. |
| `middleware.ts` no se ejecuta | Next 16 usa `proxy.ts` | Renombra el archivo a `proxy.ts`. |
| Los imports `@/lib/...` fallan | El alias apunta a la raíz | Usa `@/app/lib/...`. |
| Playwright no puede escribir la captura | Ruta fuera del workspace | Omite `filename`; se guarda en `.playwright-mcp/`. |
| El servidor no acepta el origen de la LAN | `allowedDevOrigins` desactualizado | Actualiza la IP en `next.config.ts`. |
| Un criterio de spec queda bloqueado | Falta servidor, sesión o `.env.local` | Resuélvelo y vuelve a ejecutar `/spec-verify`. |
| `npm run lint` falla en `references/pantallas/support.js` | Es un bundle de la maqueta con `ReactDOM.render` y reasignación de `module` | Es deuda preexistente. No lo arregles dentro de una spec de producto; excluye `references/**` en `eslint.config.mjs` o corrige el bundle en una tarea aparte. |
| `npm run build` falla en `/login` | `searchParams` dinámico fuera de `<Suspense>` con `cacheComponents` | Agrega `export const instant = false` en `app/login/page.tsx` o envuelve la lectura en `<Suspense>`, en una spec aparte. |

---

## Pendientes y siguiente alcance

- Autenticación real con contraseña y usuarios persistentes.
- Base de datos y DAL con consultas reales.
- Portal de familias (`/familia-feed`, `/familia-cuenta`, `/vincular-padre`).
- Pantallas registradas sin implementar: `/avisos`, `/crear-publicacion`, `/resumen-dia`.
- Persistencia real para "Agregar niño" y para las publicaciones.
- Tests automatizados cuando se elija un runner.
- Reemplazar el acceso de demostración por el login definitivo.
- Corregir el build de `/login` (`searchParams` fuera de `<Suspense>` con `cacheComponents`).
- Excluir `references/**` del lint o corregir `references/pantallas/support.js`.

Cada bloque nuevo debería entrar por una spec propia en `specs/`.

---

## Enlaces oficiales

### Proyecto y herramientas

| Recurso | Enlace |
| --- | --- |
| Repositorio | <https://github.com/Nruz-app/open-code-daycare-app> |
| Next.js | <https://nextjs.org/docs> |
| Next.js 16: crear app | <https://nextjs.org/docs/app/api-reference/cli/create-next-app> |
| Next.js 16: `proxy.ts` | <https://nextjs.org/docs/app/api-reference/file-conventions/proxy> |
| Next.js: `next/font` | <https://nextjs.org/docs/app/api-reference/components/font> |
| Next.js: configuración | <https://nextjs.org/docs/app/api-reference/config/next-config-js> |
| React | <https://react.dev/> |
| TypeScript | <https://www.typescriptlang.org/docs/> |
| Tailwind CSS v4 | <https://tailwindcss.com/docs> |
| Tailwind + Next.js | <https://tailwindcss.com/docs/installation/framework-guides/nextjs> |
| Tailwind: tema | <https://tailwindcss.com/docs/theme> |
| ESLint | <https://eslint.org/docs/latest/> |
| Node.js | <https://nodejs.org/en/download> |
| npm | <https://docs.npmjs.com/downloading-and-installing-node-js-and-npm> |

### Agentes y MCP

| Recurso | Enlace |
| --- | --- |
| OpenCode: intro e instalación | <https://opencode.ai/docs/> |
| OpenCode: configuración | <https://opencode.ai/docs/config/> |
| OpenCode: servidores MCP | <https://opencode.ai/docs/mcp-servers/> |
| OpenCode: comandos | <https://opencode.ai/docs/commands/> |
| OpenCode: agentes | <https://opencode.ai/docs/agents/> |
| OpenCode: skills | <https://opencode.ai/docs/skills/> |
| OpenCode: GitHub | <https://opencode.ai/docs/github/> |
| OpenCode Console | <https://opencode.ai/console> |
| App de OpenCode para GitHub | <https://github.com/apps/opencode-agent> |
| Especificación MCP | <https://modelcontextprotocol.io/> |
| Seguridad MCP | <https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices> |
| Context7 | <https://context7.com> |
| Context7: instalación por cliente | <https://context7.com/docs/resources/all-clients> |
| Context7: dashboard | <https://context7.com/dashboard> |
| Context7: repositorio | <https://github.com/upstash/context7> |
| Context7: servidor npm | <https://www.npmjs.com/package/@upstash/context7-mcp> |
| Playwright MCP | <https://github.com/microsoft/playwright-mcp> |
| Playwright MCP: npm | <https://www.npmjs.com/package/@playwright/mcp> |
| Playwright | <https://playwright.dev/docs/intro> |
| Playwright CLI | <https://github.com/microsoft/playwright-cli> |
| Skills de referencia | <https://github.com/klerith/fernando-skills> |

---

## Licencia

No hay un archivo `LICENSE` en el repositorio. El código se distribuye tal cual, sin licencia
explícita. Si el proyecto se publica, agrega una licencia antes de aceptar contribuciones externas.
