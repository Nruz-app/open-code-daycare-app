# SPEC 09 — Autenticación real con Supabase Auth y protección de rutas

> **Estado:** Implementado
> **Depende de:** SPEC 07, SPEC 08
> **Fecha:** 2026-11-15
> **Objetivo:** Reemplazar el login mock por Supabase Auth con email y contraseña por persona, conectar `updateSession()` a `proxy.ts`, leer el perfil real de `users` con la RLS mínima y mostrar los datos reales del perfil en el chip de la barra lateral.

## Por qué existe esta spec

SPEC 08 dejó el scaffold `utils/supabase/` (client, server, middleware stub) y diferió explícitamente esta spec. Hoy la app tiene dos sistemas de sesión en tensión: la cookie HMAC propia (`app/lib/session.ts`, alimentada por el login mock `staff-demo`) y las cookies de Supabase que nadie produce todavía. Esta spec elimina el sistema propio y deja Supabase Auth como único mecanismo: cada persona entra con su email y contraseña (no existe el concepto de cuenta de familia), el rol sale de la tabla `users`, y la protección de rutas queda en dos capas — `proxy.ts` optimista con `updateSession()` y la DAL como frontera real.

El nombre del módulo auxiliar de sesión se corrige en esta spec: la guía vigente de Supabase para Next.js lo llama `proxy.ts` (junto al `proxy.ts` de la raíz), y en Next 16 `middleware.ts` es la convención deprecada. En `utils/supabase/` el nombre es libre (Next solo escanea la raíz), pero arrastrar "middleware" invita a confusión; se renombra a `utils/supabase/proxy.ts`.

## Alcance

**Dentro:**

- Migración `users_select_own`: primera política RLS de `users` (lectura de la fila propia).
- Reescritura del login (`app/login/actions.ts` + `app/login/login-form.tsx`): formulario email+password real, `signInWithPassword` desde Server Action, mensaje "Email o contraseña incorrectos." ante credenciales inválidas y pista con las credenciales demo.
- Eliminación de la sesión HMAC: borrar `app/lib/session.ts`, la acción `loginAsStaff`, `SESSION_COOKIE` y `SESSION_SECRET` de `.env.example`.
- Reescritura de la DAL (`getSession`, `verifySession`, `requireRole`) sobre `supabase.auth.getUser()` + perfil de `users`, con el mapeo de roles `staff → staff`, `parent → family` y `admin → staff` (la app sigue distinguiendo `staff | family`).
- Renombrado y conexión de `utils/supabase/middleware.ts` → `utils/supabase/proxy.ts` (`updateSession()` devuelve `{ response, claims }`), conectado desde el `proxy.ts` de la raíz (async, runtime nodejs) con rol optimista desde `claims.user_metadata.role`; la autorización real sigue siendo la DAL.
- Chip real de la sidebar: `AppSidebar` lee el perfil con la DAL y muestra nombre, rol y guardería reales; desaparecen "Caro Giménez", "Maestra · Soles" y la inicial "C" hardcodeadas. El saludo "Buenas, Caro" del feed usa el primer nombre del perfil.
- Validación de `?next=` por rol (anti open redirect, ahora con el rol real del perfil).
- Verificación punta a punta con Playwright: login con `staff@guarderia-demo.test / demo1234`, acceso a `/feed` y `/ninos`, redirect a `/login?next=` sin sesión, logout, credenciales inválidas.

**Fuera del alcance (para futuras specs):**

- Signup / alta de personas: el trigger `handle_new_user` ya existe, pero el flujo de invitaciones (SPEC 04) es quien creará usuarios reales.
- Portal de familias funcional: no se siembra usuario `parent` porque `HOME_BY_ROLE.family = /familia-feed` **no es una página**; el login de padre no es verificable end-to-end hasta que exista esa pantalla.
- Políticas RLS de escritura y de lectura por guardería.
- Reemplazar `mock-ninos.ts` y las `const posts` del feed.
- Arreglos de lint en `references/**` y `.agents/skills/**` (van en una spec aparte, según `AGENTS.md`).

## Modelo de datos

**1. `supabase/migrations/YYYYMMDDHHMMSS_users_select_own.sql`** (nueva):

```sql
-- Cada persona autenticada lee únicamente su propio perfil.
create policy "users_select_own"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);
```

Convenciones heredadas de SPECs 06–08: sin `if not exists`, sin `drop`, sin `begin`/`commit`; el slug del archivo coincide con el `name` de `apply_migration`.

**2. `app/lib/routes.ts`** (ampliado) — el tipo `UserRole` se muda aquí desde `session.ts` y queda libre de dependencias de servidor:

```ts
export type UserRole = "staff" | "family";
```

**3. `app/lib/dal.ts`** (reescrito) — la sesión ahora viene de Supabase; `getDaycares()` no cambia:

```ts
export type Perfil = {
  userId: string;
  role: UserRole;
  fullName: string;
  guarderia: string | null;
};

function mapearRol(rolDb: string): UserRole {
  // parent → family; admin es personal del centro → staff.
  return rolDb === "parent" ? "family" : "staff";
}

export const getSession = cache(async (): Promise<Perfil | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // getUser() es el veredicto autoritativo: habla con el servidor de auth
  // (difiere de getClaims/getSession, que solo leen la cookie).
  const { data: perfil } = await supabase
    .from("users")
    .select("role, full_name, daycares(name)")
    .eq("id", user.id)
    .single();

  if (!perfil) return null; // sesión auth sin perfil: fallamos cerrado
  return {
    userId: user.id,
    role: mapearRol(perfil.role),
    fullName: perfil.full_name,
    guarderia: perfil.daycares?.name ?? null,
  };
});
```

`verifySession` y `requireRole(role)` conservan su contrato actual; solo cambia la fuente.

**4. `app/login/actions.ts`** (reescrito) — `login` con `signInWithPassword({ email, password })`; ante error devuelve `{ error: "Email o contraseña incorrectos." }` sin crear sesión; al éxito, `destinoSeguro(next, perfil.role)` y `redirect()`. `logout` llama `supabase.auth.signOut()` y redirige a `/login`. Desaparecen `loginAsStaff` y todo import de `session.ts`.

**5. `utils/supabase/proxy.ts`** (renombrado desde `middleware.ts` y adaptado) — `updateSession(request)` devuelve `{ response, claims }`; sin código entre `createServerClient` y `getClaims()` (exigencia de la doc de `@supabase/ssr` para que el refresh de tokens pueda escribir cookies).

**6. `proxy.ts`** (raíz, adaptado) — pasa a `async`, llama `updateSession` primero y usa `claims` como comprobación optimista; la tabla de rutas (`PUBLIC_ROUTES`, `STAFF_ONLY`, `FAMILY_ONLY`, `HOME_BY_ROLE`, `matches`) no cambia. Al redirigir copia las cookies de la respuesta de Supabase para no perder un refresh en curso.

**7. `app/components/app-sidebar.tsx`** (ampliado) — el chip llama `getSession()` de la DAL (componente servidor; las tres pantallas que lo usan ya son dinámicas dentro de `<Suspense>` o con `instant = false`). Mapa cosmético de etiquetas `staff → "Maestra"`, `family → "Familia"`.

**8. `.env.example`** — se elimina `SESSION_SECRET` (ya no lo lee nadie).

## Plan de implementación

1. Crear y aplicar `users_select_own` con `tools.supabase.apply_migration({ name: "users_select_own" })`; confirmar en `pg_policies` y `list_migrations()`. *Manual: la migración aparece y la política es `SELECT` para `authenticated` con `auth.uid() = id`.*
2. Mover `UserRole` a `app/lib/routes.ts`. *Manual: `npx tsc --noEmit` sin errores.*
3. **Cutover de sesión** (unidad mínima funcional; dividirlo garantiza estados rotos):
   a. Renombrar `utils/supabase/middleware.ts` → `utils/supabase/proxy.ts` y adaptarlo para devolver `{ response, claims }`.
   b. Reescribir `app/lib/dal.ts` (`getSession`/`verifySession`/`requireRole` sobre Supabase).
   c. Reescribir `app/login/actions.ts` y `app/login/login-form.tsx` (email+password real).
   d. Conectar el `proxy.ts` de la raíz (async) con `updateSession`.
   e. Borrar `app/lib/session.ts` y `SESSION_SECRET` de `.env.example`.
   *Manual: login demo funciona, `/feed` y `/ninos` visibles, logout OK.*
4. Chip real en `app-sidebar.tsx` y saludo del feed con datos del perfil. *Manual: la sidebar muestra el perfil autenticado.*
5. Verificación final: `npx tsc --noEmit` → `npm run lint` (sin hallazgos nuevos en archivos de la spec) → `npm run build` (sin errores nuevos) → `tools.supabase.get_advisors({ type: "security" })` (sin errores nuevos; `rls_enabled_no_policy` de `users` debe desaparecer).

## Criterios de aceptación

- [x] `tools.supabase.list_migrations()` incluye `users_select_own`.
- [x] `pg_policies` tiene una política `users_select_own` sobre `public.users`, `cmd = SELECT`, rol `authenticated`, `using = (auth.uid() = id)`.
- [x] `app/lib/session.ts` no existe y ningún archivo del repo importa `@/app/lib/session`.
- [x] `.env.example` ya no menciona `SESSION_SECRET`.
- [x] El selector "Personal / Familia" del login no existe; el formulario pide email y contraseña.
- [x] Con `staff@guarderia-demo.test / demo1234`, `/login` redirige a `/feed` (o al `?next=` válido) y las cookies de sesión son las de Supabase (`sb-*`), no `session`.
- [x] Con credenciales inválidas se muestra "Email o contraseña incorrectos." y no hay cookies de sesión.
- [x] Sin sesión, `/ninos` redirige a `/login?next=%2Fninos`.
- [x] Con sesión de staff, `/feed`, `/ninos` y `/ninos/[id]` renderizan; entrando a `/login` con sesión, el proxy redirige a `/feed`.
- [x] El chip de la sidebar muestra el nombre, rol y guardería del perfil real (no hay texto hardcodeado de persona).
- [x] `logout` borra las cookies `sb-*` y deja a la persona en `/login`.
- [x] `proxy.ts` es `async`, importa `updateSession` de `@/utils/supabase/proxy` y `utils/supabase/middleware.ts` no existe en el repo.
- [x] `get_advisors({ type: "security" })` no reporta errores nuevos y `rls_enabled_no_policy` ya no lista `users`.
- [x] `npx tsc --noEmit` sin errores; `npm run lint` sin hallazgos nuevos; `npm run build` sin errores nuevos respecto al estado actual.

## Decisiones

- **Sí:** email+password para cualquier persona; el rol sale de `users.role`. Es lo que aclaró la persona: no hay cuenta de familia, solo personas.
- **Sí:** eliminar la sesión HMAC por completo. Dos sistemas de sesión conviviendo dejan código muerto y una superficie de auth duplicada; `SESSION_SECRET` deja de ser necesario.
- **Sí:** `getUser()` en la DAL y `getClaims()` solo en el proxy. La DAL es la frontera de seguridad real y debe verificar con el servidor de auth; el proxy es optimista y basta con la sesión local, que además dispara el refresh de tokens (doc de `@supabase/ssr`: `getClaims()` debe correr temprano en el proxy).
- **Sí:** conectar el helper desde `proxy.ts` y no desde `middleware.ts`: en Next 16 `middleware.ts` está deprecado y `proxy.ts` corre en nodejs (doc oficial, upgrade guide v16). El helper en `utils/supabase/proxy.ts` iguala el nombre de la guía vigente de Supabase.
- **Sí:** mapeo `parent → family` y `admin → staff` centralizado en la DAL. La app no cambia sus conceptos de ruta (la persona no eligió renombrar) y `admin` es personal del centro.
- **Sí:** `?next=` validado contra las rutas del rol real del perfil (anti open redirect heredado, ahora por rol).
- **Sí:** RLS mínima (fila propia). Es lo único que `requireRole` necesita; la lectura por guardería llega con las pantallas de gestión.
- **Sí:** pista de credenciales demo visible en el formulario. Es una maqueta de práctica; el usuario es `.test`.
- **Sí:** el saludo del feed usa el primer nombre del perfil. Dejar "Buenas, Caro" fijo contradiría el chip real con el usuario sembrado "Ana Demo".
- **No:** signup, usuario `parent` sembrado, ni pantalla de familias. El destino de un login de padre (`/familia-feed`) no existe como página y la verificación sería imposible; llega con el portal de familias.
- **No:** tocar `mock-ninos.ts`, las `const posts`, ni las listas de rutas de `routes.ts` (deny-by-default ya cubre las rutas nuevas).
- **No:** commitear ni cerrar la spec como Implementado sin pedido explícito de la persona.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El login con el usuario sembrado por SQL directo falla (el seed de SPEC 07 tocó `auth.users` a mano). | Verificación punta a punta en el paso 3; si falla, registrar el bloqueo y corregir con una **migración nueva** (nunca editar las aplicadas). |
| Un perfil sin fila en `users` (auth sin perfil) deja a la persona en bucle de login. | `getSession` devuelve `null` y la DAL manda a `/login`; el trigger `on_auth_user_created` impide ese estado en signups normales. |
| El rol optimista del proxy (`user_metadata.role`) no coincide con el de la DB. | Es solo optimista: la DAL corrige con el rol real; el redirect equivocado aterriza en una ruta que `requireRole` re-dirige. |
| `cacheComponents`: leer cookies de Supabase en páginas sin `<Suspense>` rompe el build. | `/feed`, `/ninos` y `/ninos/[id]` ya cumplen el patrón dinámico (`XContent` + `<Suspense>` o `instant = false`); verificación con `npm run build` al cierre. |
| El refresh de tokens se pierde si `getClaims()` no corre temprano en el proxy. | La doc lo exige textual y el stub de SPEC 08 ya lo respeta; las verificaciones de login/logout lo ejercitan. |
| `npm run build` falla y se lee como regresión. | El criterio de build está acotado a "sin errores nuevos"; el fallo histórico está documentado en `AGENTS.md`. |

## Lo que **no** entra en esta spec

- Signup y alta de personas; portal de familias funcional; políticas RLS de escritura; lectura de `users` por guardería; reemplazo de los mocks de niños y feed; arreglos de lint de `references/**` y `.agents/skills/**`.

Cada uno de esos puntos, si llega, va en su propia spec.

## Verificación

- **Fecha:** 2026-11-15
- **Modelo:** opencode/nemotron-3.5-super-vl-free
- **Entorno:** Next.js 16.4.5, `npm run dev` en http://localhost:3000 (servidor ya levantado, no se reinició), Supabase `btknjzobaqtekofvfsof` (PostgreSQL gestionado); verificación de esquema/datos vía MCP y de la app vía Playwright en contexto aislado `spec-09-anon`.
- **Resultado:** 14/14 criterios verificados ✅ · 0 fallos · 0 bloqueos

| # | Criterio | Resultado | Evidencia |
| --- | --- | --- | --- |
| 1 | `list_migrations()` incluye `users_select_own` | ✅ | `tools.supabase.list_migrations()` → 9 migraciones; `users_select_own` presente (versión `20261115155533`) |
| 2 | `pg_policies`: `users_select_own` sobre `public.users`, `cmd=SELECT`, `roles={authenticated}`, `using=(auth.uid() = id)` | ✅ | `execute_sql("select ... from pg_policies where tablename='users'")` → una fila: `public.users`, `users_select_own`, `SELECT`, `{authenticated}`, `(auth.uid() = id)`, `with_check=null` |
| 3 | `app/lib/session.ts` no existe; ningún archivo importa `@/app/lib/session` | ✅ | `glob app/lib/session.ts`: sin archivos; `grep @/app/lib/session`: solo la propia línea de criterio en `specs/09-authenticacion-supabase.md` (documentación, no código) |
| 4 | `.env.example` ya no menciona `SESSION_SECRET` | ✅ | `grep SESSION_SECRET .env.example`: sin coincidencias |
| 5 | Sin selector "Personal/Familia"; formulario email + contraseña | ✅ | Snapshot de `/login` (`.playwright-mcp/page-2026-11-15T16-22-30-191Z.yml`): textbox "EMAIL", textbox "CONTRASEÑA", botón "Iniciar sesión", pista "Demo: staff@guarderia-demo.test / demo1234"; sin selector de roles |
| 6 | Login `staff@guarderia-demo.test / demo1234` → `/feed` o `?next=` válido; cookies `sb-*`, sin cookie `session` | ✅ | Navegó a `http://localhost:3000/ninos` (next válido para staff); `document.cookie`: `sb-btknjzobaqtekofvfsof-auth-token=...`; `sessionCookie: []` |
| 7 | Credenciales inválidas → "Email o contraseña incorrectos." y sin cookies de sesión | ✅ | Snapshot tras clic (`.playwright-mcp/page-2026-11-15T16-25-01-332Z.yml`): alert `Email o contraseña incorrectos.`; `document.cookie` vacía |
| 8 | Sin sesión, `/ninos` → `/login?next=%2Fninos` | ✅ | Page URL tras navegar a `/ninos`: `http://localhost:3000/login?next=%2Fninos` |
| 9 | Con sesión staff: `/feed`, `/ninos`, `/ninos/[id]` renderizan; `/login` con sesión → `/feed` | ✅ | `/feed` (200, título OpenDayCare), `/ninos` (200), `/ninos/mateo-fernandez` (200); navegar a `/login` con sesión terminó en `http://localhost:3000/feed` |
| 10 | Chip de sidebar con nombre, rol y guardería del perfil real | ✅ | `/feed`, `/ninos` y `/ninos/mateo-fernandez`: chip "Ana Demo" / "Maestra · Guardería Sala Soles"; saludo del feed: heading "Buenas, Ana" |
| 11 | `logout` borra cookies `sb-*` y deja en `/login` | ✅ | Tras clic en "Cerrar sesión": URL `http://localhost:3000/login`; `document.cookie` vacío, `sbCount: 0`, `sessionCount: 0` |
| 12 | `proxy.ts` es `async`, importa `updateSession` de `@/utils/supabase/proxy`; `utils/supabase/middleware.ts` no existe | ✅ | `proxy.ts` línea 55: `export async function proxy(request: NextRequest)`; línea 12: `import { updateSession } from "@/utils/supabase/proxy"`; `glob utils/supabase/*`: solo `client.ts`, `proxy.ts`, `server.ts` |
| 13 | `get_advisors({ type: "security" })` sin errores nuevos; `rls_enabled_no_policy` no lista `users` | ✅ | `get_advisors({ type: "security" })`: solo `auth_leaked_password_protection` (WARN, preexistente del proyecto); `rls_enabled_no_policy` ausente (`users` ahora tiene política) |
| 14 | `tsc` sin errores; `lint` sin hallazgos nuevos; `build` sin errores nuevos | ✅ | `npx tsc --noEmit`: salida vacía, salida 0; `npm run lint`: 8 errores y 23 avisos, todos en `references/**` y `.agents/skills/**`, cero en archivos de esta spec; `npm run build`: 9/9 rutas OK, `/login` como Partial Prerender, sin errores |

### Fallos

Ninguno.

### Bloqueos

Ninguno.

### Next.js (Context7)

- `libraryId` consultado: `/vercel/next.js` (versión instalada 16.4.5 en `package.json`)
- Concepto consultado: migración de `middleware.ts` a `proxy.ts` en Next.js 16 (runtime nodejs, función `async`, matcher)
- Recomendación de la doc oficial: el nombre `middleware` está deprecado y pasó a llamarse `proxy`; `proxy.ts` se compila siempre para runtime Node.js; la función puede marcarse `async` si usa `await`; el archivo va en la raíz del proyecto.
- ¿El código lo cumple?: sí — `proxy.ts` (línea 55) declara `export async function proxy(request: NextRequest)`, importa `updateSession` desde `@/utils/supabase/proxy`, y `utils/supabase/middleware.ts` no existe en el repo.

### Skills de apoyo

Ninguna cargada (no aplica: la verificación es de esquema Supabase, archivos estáticos del repo y runtime de la app; no hizo falta ninguna skill de apoyo de `.agents/skills/`).

### Capturas

- `.playwright-mcp/page-2026-11-15T16-22-30-191Z.yml`: `/ninos` sin sesión → `http://localhost:3000/login?next=%2Fninos`
- `.playwright-mcp/page-2026-11-15T16-22-30-191Z.yml`: formulario de `/login` (EMAIL/CONTRASEÑA, sin selector Personal/Familia, pista de credenciales demo)
- `.playwright-mcp/page-2026-11-15T16-25-01-332Z.yml`: credenciales inválidas → alert "Email o contraseña incorrectos."
- `.playwright-mcp/page-2026-11-15T16-26-36-067Z.yml`: login correcto → `http://localhost:3000/ninos`
- `.playwright-mcp/page-2026-11-15T16-26-58-681Z.yml`: `/feed` con chip "Ana Demo · Maestra · Guardería Sala Soles" y saludo "Buenas, Ana"
- `.playwright-mcp/page-2026-11-15T16-27-24-395Z.yml`: `/ninos/mateo-fernandez` con chip real del perfil
- `.playwright-mcp/page-2026-11-15T16-28-23-480Z.yml`: logout → `http://localhost:3000/login`, cookies vacías
- (El servidor ya estaba en ejecución en el puerto 3000; no se inició uno nuevo durante esta verificación.)
