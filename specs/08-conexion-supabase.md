# SPEC 08 — Conexión Next.js ↔ Supabase: SDK oficial y primer dato real

> **Estado:** Implementado
> **Depende de:** SPEC 06, SPEC 07
> **Fecha:** 2026-11-13
> **Objetivo:** Conectar la app Next.js con Supabase usando el SDK oficial (`@supabase/supabase-js` + `@supabase/ssr`) con el scaffold `utils/supabase/` (client, server y middleware como stub) y verificar la conexión con el primer consumo real: las guarderías de la tabla `daycares` renderizadas en `/ninos`.

## Por qué existe esta spec

Las SPECs 06 y 07 dejaron `daycares` y `users` creadas, y en ambas quedó escrito que "conectar la app" era otra spec: sin SDK, sin variables de entorno y con la DAL mock. Esta spec hace esa conexión de punta a punta. La petición original hablaba de "crear el pool de conexión"; aclarado en la definición, el "pool" se resuelve con el SDK oficial: PostgREST va por HTTP y no abre conexiones TCP persistentes, así que no hay pool que crear. El pooler SQL directo (Supavisor) solo tendría sentido con queries SQL crudas u ORM, decidido fuera de alcance.

La verificación del primer dato real exige una decisión que quedó pendiente desde SPEC 06: `daycares` tiene RLS habilitado **sin políticas**, así que un cliente con anon key ve cero filas. Esta spec agrega la primera política del modelo: lectura pública de `daycares`.

## Ampliación 2026-11-15 — scaffold completo en `utils/supabase/`

La spec original creó deliberadamente solo `app/lib/supabase/server.ts`, con el cliente de navegador y el refresh de sesión diferidos a SPEC 09. La persona revisó la spec y decidió completar el scaffold oficial de la guía de Supabase para Next.js: `client.ts`, `server.ts` y `middleware.ts` dentro de `utils/supabase/`.

Context7 (`/supabase/ssr`) precisa qué es cada pieza: el trío de la guía **no es la configuración mínima, es el scaffold completo listo para autenticación**. La doc lo dice textual: "Using the middleware pattern is mandatory. Session refresh happens in the middleware" — obligatorio *para refrescar sesiones de auth*. Para leer datos con la clave publicable sin login (lo que hace esta spec), el mínimo real es solo el cliente de servidor con `getAll`. Decisiones de la ampliación: el factory de servidor se muda de `app/lib/supabase/` a `utils/supabase/` (estructura de la guía), `client.ts` se crea aunque hoy es código muerto sin login, y `middleware.ts` se crea **como stub** con `updateSession()` que compila pero no se conecta a `proxy.ts` (en este Next, `middleware.ts` está deprecado; el refresh llegará con SPEC 09 integrado ahí).

Los criterios 8–10 de la verificación de abajo describen la ruta `app/lib/supabase/server.ts` **previa** a la ampliación; son evidencia de esa ejecución y no se reescriben.

## Alcance

**Dentro:**

- Dependencias `@supabase/supabase-js` y `@supabase/ssr` en `package.json`.
- Migración `supabase/migrations/YYYYMMDDHHMMSS_daycares_public_read.sql`: política de `select` para `anon` y `authenticated` sobre `public.daycares`, aplicada con `tools.supabase.apply_migration({ name: "daycares_public_read" })`.
- Placeholders en `.env.example` para `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Paso **manual de la persona**: agregar las dos variables reales a `.env.local`. El agente no lee ni escribe `.env.local` (regla del repo).
- Factory de cliente de servidor `app/lib/supabase/server.ts` con `createServerClient` de `@supabase/ssr` y el adaptador de cookies `getAll`/`setAll` (patrón oficial para App Router, validado con Context7).
- Función `getDaycares()` en `app/lib/dal.ts` (la DAL es la única vía de datos reales, como exige `AGENTS.md`).
- Tarjeta de guarderías en `/ninos`, dentro de `NinosContent`, leyendo de la DAL.
- Manejo de error de la lectura: si la consulta falla o devuelve cero filas, la tarjeta muestra un texto de contingencia en lugar de romper la pantalla.
- Verificación: dev server con la tarjeta mostrando las tres guarderías del seed, `npx tsc --noEmit`, `npm run lint` sin hallazgos nuevos y advisors de Supabase sin errores nuevos.
- Ampliación 2026-11-15: scaffold oficial en `utils/supabase/` — mover `app/lib/supabase/server.ts` a `utils/supabase/server.ts` (verbatim), crear `utils/supabase/client.ts` con `createBrowserClient` y crear `utils/supabase/middleware.ts` como stub de `updateSession()` sin conectar; actualizar el import de `app/lib/dal.ts` y eliminar `app/lib/supabase/`.

**Fuera del alcance (para futuras specs):**

- SPEC 09 — autenticación real: reemplazar el login mock por Supabase Auth, sesiones con cookies, `requireRole` leyendo de `users` y el resto de políticas RLS (`users`, escrituras).
- Conectar el refresh de sesión de Supabase (`updateSession()` de `utils/supabase/middleware.ts`) a `proxy.ts`: la ampliación 2026-11-15 crea el stub, la conexión llega con SPEC 09.
- Cliente de navegador (`@supabase/ssr` browser client): no sirve hasta que exista login real. La ampliación 2026-11-15 crea `utils/supabase/client.ts` como parte del scaffold, pero consumirlo en la app llega con SPEC 09.
- Las tablas `rooms`, `children`, `parent_children`, `invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`, `devices` y sus seeds.
- Reemplazar `app/lib/mock-ninos.ts` por datos reales: los ocho niños del mock siguen alimentando `/ninos`.
- Tipos TypeScript generados (`supabase gen types`): con una sola tabla consumida, aún no pagan su costo; llegan cuando el consumo crece.
- Pooler SQL directo (Supavisor, puerto 6543), `postgres.js`/`pg` u ORM (Prisma/Drizzle).
- Cambios en `proxy.ts`, `app/lib/routes.ts` ni el login demo (`staff-demo`).
- Cambios en `opencode.json` o la configuración del MCP.

## Modelo de datos

La app no introduce estructuras nuevas: lee las tres columnas de `daycares`, que ya existen desde SPEC 06.

**1. `supabase/migrations/YYYYMMDDHHMMSS_daycares_public_read.sql`** — primera política RLS del modelo (patrón Context7 `/websites/supabase_guides`, "row level security"):

```sql
-- Los nombres de guarderías son datos públicos de la app.
create policy "daycares_public_read"
  on public.daycares
  for select
  to anon, authenticated
  using (true);
```

Convenciones heredadas: sin `if not exists`, sin `drop`, sin `begin`/`commit`; el slug del archivo coincide con el `name` de `apply_migration`.

**2. `app/lib/supabase/server.ts`** (nuevo en la implementación original; la ampliación 2026-11-15 lo mueve verbatim a `utils/supabase/server.ts`) — factory del cliente de servidor:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll desde un Server Component: se ignora si hay
            // middleware refrescando sesiones (hoy, proxy.ts).
          }
        },
      },
    },
  );
}
```

El cliente se instancia dentro de la función, nunca a nivel de módulo, para que la ausencia de variables de entorno no reviente el import.

**3. `app/lib/dal.ts`** (ampliado) — única vía de datos reales:

```ts
export type Guarderia = { id: string; name: string; createdAt: string };

export async function getDaycares(): Promise<Guarderia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daycares")
    .select("id, name, created_at")
    .order("name");

  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  }));
}
```

**4. `.env.example`** (ampliado, solo placeholders):

```bash
# Proyecto Supabase (btknjzobaqtekofvfsof). Los valores reales van en .env.local.
NEXT_PUBLIC_SUPABASE_URL=reemplaza-esto-por-la-url-del-proyecto
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=reemplaza-esto-por-la-publishable-key
```

**5. `app/ninos/page.tsx`** (ampliado) — `NinosContent` llama `getDaycares()` y renderiza una tarjeta con la lista encima del bloque de búsqueda, con el estilo existente (`rounded-box`, `border-line`, `bg-surface`, tipografía Fredoka para el título). Si la lista viene vacía, la tarjeta muestra "No se pudo cargar la lista de guarderías.".

Ampliación 2026-11-15 — el scaffold oficial vive en `utils/supabase/`:

**6. `utils/supabase/server.ts`** (mudanza) — mismo contenido que tenía `app/lib/supabase/server.ts` (bloque 2, `createServerClient` con `getAll`/`setAll` y el `try`/`catch`), sin cambios de código. `app/lib/supabase/` desaparece.

**7. `utils/supabase/client.ts`** (nuevo) — cliente de navegador, patrón oficial de la guía:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

**8. `utils/supabase/middleware.ts`** (nuevo, stub sin conectar) — `updateSession()` de la guía; SPEC 09 lo conecta desde `proxy.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: no poner código entre createServerClient y getClaims.
  await supabase.auth.getClaims();

  // SPEC 09: aquí va la protección de rutas y la conexión desde proxy.ts.
  return supabaseResponse;
}
```

**9. `app/lib/dal.ts`** (una línea cambia) — import del factory en su nueva ubicación:

```ts
import { createClient } from "@/utils/supabase/server";
```

## Plan de implementación

1. Crear `supabase/migrations/<ts>_daycares_public_read.sql` con el SQL de la sección anterior. Manual: el archivo existe y contiene solo la `create policy`.
2. Aplicar con `tools.supabase.apply_migration({ name: "daycares_public_read", query: <archivo> })`. Manual: responde sin error.
3. Confirmar con `tools.supabase.list_migrations()` (aparece `daycares_public_read`) y `pg_policies` (una fila para `public.daycares`, `cmd = SELECT`, roles `anon` y `authenticated`). Manual: ambos correctos.
4. Instalar dependencias: `npm install @supabase/supabase-js @supabase/ssr`. Manual: `npm install` termina sin error y `package.json` lista ambas.
5. Ampliar `.env.example` con los dos placeholders. Manual: el archivo no contiene valores reales.
6. **Paso manual de la persona:** agregar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con los valores reales del proyecto a `.env.local`. El agente no toca ni lee ese archivo; se confirma con la persona o se valida indirectamente en el paso 9.
7. Crear `app/lib/supabase/server.ts` con el factory de la sección anterior. Manual: `npx tsc --noEmit` sigue sin errores.
8. Agregar `getDaycares()` a `app/lib/dal.ts` y la tarjeta a `NinosContent` en `app/ninos/page.tsx`. Manual: `npm run dev` levanta y `/ninos` muestra la tarjeta.
9. Verificación de la conexión con la persona logueada como `staff-demo`: la tarjeta muestra exactamente "Guardería Arcoíris", "Guardería Los Pinos" y "Guardería Sala Soles". Manual: dato real de Supabase visible en pantalla; si falta `.env.local`, la tarjeta muestra la contingencia y se vuelve al paso 6.
10. Ejecutar `tools.supabase.get_advisors({ type: "security" })`. Manual: no hay errores nuevos; los avisos informativos esperados (`rls_enabled_no_policy`, `auth_leaked_password_protection`) no cuentan como fallo.
11. Verificación final del repo: `npx tsc --noEmit` sin errores; `npm run lint` sin hallazgos en archivos de esta spec; `git status --short` solo muestra `package.json`, `package-lock.json`, `.env.example`, `app/lib/supabase/server.ts`, `app/lib/dal.ts`, `app/ninos/page.tsx`, la migración y la spec.

Ampliación 2026-11-15:

12. Mover `app/lib/supabase/server.ts` a `utils/supabase/server.ts` sin cambiar su contenido, actualizar la línea 12 de `app/lib/dal.ts` a `@/utils/supabase/server` y eliminar `app/lib/supabase/`. Manual: `npx tsc --noEmit` sin errores y `/ninos` sigue mostrando las tres guarderías.
13. Crear `utils/supabase/client.ts` con `createBrowserClient`. Manual: typecheck sin errores; nadie lo importa todavía.
14. Crear `utils/supabase/middleware.ts` con `updateSession()`. Manual: typecheck sin errores; `proxy.ts` sin cambios (`git status` no lo lista).
15. Verificación final de la ampliación: grep `@supabase/` en `app/` — solo `utils/supabase/**`; `npm run lint` sin hallazgos nuevos; dev server con sesión `staff-demo` mostrando las tres guarderías y los ocho niños del mock.

## Criterios de aceptación

- [x] Existe `supabase/migrations/<ts>_daycares_public_read.sql` con solo la `create policy` del modelo de datos.
- [x] El SQL no contiene `if not exists`, `drop`, `begin` ni `commit`.
- [x] `tools.supabase.list_migrations()` incluye `daycares_public_read`.
- [x] `pg_policies` tiene una política sobre `public.daycares` con `cmd = 'SELECT'`, roles `anon` y `authenticated` y `using = true`.
- [x] `package.json` incluye `@supabase/supabase-js` y `@supabase/ssr`, y `npm install` termina sin error.
- [x] `.env.example` lista `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con placeholders y ningún valor real.
- [x] El agente no leyó ni escribió `.env.local` durante la implementación.
- [x] Existe `app/lib/supabase/server.ts` que exporta `createClient()` con el patrón `getAll`/`setAll`.
- [x] `createServerClient` se llama dentro de `createClient()`, no a nivel de módulo.
- [x] `getDaycares()` vive en `app/lib/dal.ts` y ningún componente importa `@supabase/*` directamente.
- [x] Con sesión `staff-demo`, `/ninos` muestra la tarjeta con las tres guarderías del seed: "Guardería Arcoíris", "Guardería Los Pinos" y "Guardería Sala Soles".
- [ ] Si la consulta falla o devuelve cero filas, la tarjeta muestra "No se pudo cargar la lista de guarderías." y la pantalla no se rompe.
- [x] `app/lib/mock-ninos.ts` no se modificó y los ocho niños del mock siguen listándose en `/ninos`.
- [ ] El login demo `staff-demo` y el flujo `/login` no cambiaron.
- [x] `npx tsc --noEmit` termina sin errores.
- [x] `npm run lint` no introduce hallazgos nuevos en archivos de esta spec (los 8 errores y 23 avisos preexistentes de `references/**` y `.agents/skills/**` no cuentan).
- [x] `tools.supabase.get_advisors({ type: "security" })` no reporta errores nuevos.
- [ ] `npm run build`, si se ejecuta, no introduce errores nuevos respecto al fallo preexistente de `/login` (documentado en `AGENTS.md`).
- [ ] `git status --short` no muestra cambios en `proxy.ts`, `app/lib/routes.ts`, `app/login/**` ni `app/lib/mock-ninos.ts`.
- [x] Las migraciones de SPEC 06 y SPEC 07 no se editaron (regla de inmutabilidad).

Ampliación 2026-11-15 (criterios `[ ]` hasta que `/spec-verify` los pruebe con evidencia):

- [ ] Existe `utils/supabase/server.ts` con el mismo contenido que tenía `app/lib/supabase/server.ts` (`getAll`/`setAll`, `createServerClient` dentro de `createClient()`).
- [ ] Existe `utils/supabase/client.ts` que exporta `createClient()` con `createBrowserClient` y las dos variables `NEXT_PUBLIC_*`.
- [ ] Existe `utils/supabase/middleware.ts` que exporta `updateSession()`, compila, y `proxy.ts` no lo importa ni lo registra.
- [ ] `app/lib/supabase/` no existe en el repo.
- [ ] `app/lib/dal.ts` importa `createClient` desde `@/utils/supabase/server`.
- [ ] Ningún archivo fuera de `utils/supabase/**` importa `@supabase/*`.
- [ ] `git status --short` no muestra cambios en `proxy.ts`, `app/lib/routes.ts`, `app/login/**` ni `app/lib/mock-ninos.ts`.
- [ ] `npx tsc --noEmit` termina sin errores y `npm run lint` no introduce hallazgos nuevos en archivos de esta spec.
- [ ] Con sesión `staff-demo`, `/ninos` sigue mostrando las tres guarderías del seed y los ocho niños del mock.

## Decisiones

- **Sí:** SDK oficial (`@supabase/supabase-js` + `@supabase/ssr`). La petición decía "pool de conexión"; aclarado en la definición, el SDK va por HTTP/PostgREST y no necesita pool. El pooler SQL directo queda descartado salvo que aparezcan queries crudas.
- **Sí:** `@supabase/ssr` además del SDK pelado. Sus adaptadores de cookies son requisito de la futura SPEC 09 (sesiones reales) y cuestan lo mismo instalarlos hoy.
- **Sí:** nomenclatura `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Context7 muestra que la doc oficial actual renombró la "anon key" a "publishable key" (mismo valor); se usa el nombre nuevo para no arrastrar el deprecado a la SPEC 09.
- **Sí:** solo cliente de servidor. El browser client es código muerto sin login real; llega con SPEC 09. (La ampliación 2026-11-15 crea `utils/supabase/client.ts` como archivo del scaffold por decisión de la persona, pero sigue sin consumirse en la app.)
- **Sí:** política pública de lectura de `daycares` como primera política RLS del modelo. Sin ella, el cliente anon ve cero filas y el "primer dato real" no existe; los nombres de guarderías no son datos sensibles. El resto de políticas (escrituras, `users`) va a SPEC 09.
- **Sí:** variables reales agregadas por la persona a `.env.local`. El repo prohíbe tocar ese archivo; el agente solo mantiene la plantilla `.env.example`.
- **No:** service_role en el servidor. Saltaría RLS y obligaría a replicar autorización en código; además contradice la elección de clave publicable.
- **No:** tipos TypeScript generados. Una tabla y tres columnas no justifican la herramienta; se reconsidera cuando el consumo crezca.
- **No:** reemplazar el mock de niños. `children` ni siquiera existe como tabla; hacerlo obligaría a migrar `rooms` + `children` + seed y duplicaría el alcance.
- **Sí:** `getDaycares()` en `app/lib/dal.ts`. `AGENTS.md` fija que toda lectura real pasa por la DAL; separar el acceso en otro archivo fragmentaría la capa de datos.
- **Sí:** tarjeta dentro de `NinosContent` y no como componente con su propio `<Suspense>`. El bloque ya corre dentro de `<Suspense>` con `connection()` (patrón exigido por `cacheComponents`), y un solo consumo no amerita otro boundary.
- **Sí:** contingencia de error con lista vacía → texto "No se pudo cargar la lista de guarderías.". Fallar en silencio escondería un problema de conexión; lanzar un error rompería una pantalla que hoy siempre funciona. Un único texto cubre ambos casos sin inventar estados extra.
- **No:** tocar `proxy.ts` ni `routes.ts`. `/ninos` ya está protegida por rol y el enrutamiento es deny-by-default.
- **Sí:** no se toca `opencode.json`. El MCP ya está configurado y la app usa su propio SDK, no el MCP.
- **Sí (ampliación 2026-11-15):** completar el scaffold oficial en `utils/supabase/`. La persona decidió igualar la estructura de la guía; Context7 aclara que el trío es el scaffold de auth completo, no el mínimo, y la spec lo documenta para que nadie lo confunda de nuevo.
- **Sí (ampliación 2026-11-15):** `middleware.ts` como stub sin conectar. Crearlo da la estructura completa y el punto de anclaje de SPEC 09; conectarlo hoy a `proxy.ts` es trabajo de sesión que no existe todavía. En este Next, `middleware.ts` está deprecado: la conexión se hará desde `proxy.ts`.
- **Sí (ampliación 2026-11-15):** `client.ts` aunque sea código muerto sin login. Es la decisión explícita de la persona al ampliar el alcance; el riesgo de copia sin uso queda registrado.
- **Sí (ampliación 2026-11-15):** mover el factory fuera de `app/lib/supabase/` y eliminar la carpeta. Un solo lugar para el SDK evita dos factory divergentes; la DAL actualiza su import y nada más.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La persona no agrega las variables a `.env.local` y `getDaycares` falla. | Paso 6 es manual y explícito; el paso 9 lo detecta: la tarjeta muestra la contingencia y se vuelve al paso 6. El factory no lanza en el import. |
| La política RLS no se aplica y el cliente anon sigue viendo cero filas. | El paso 3 confirma la fila en `pg_policies`; el paso 9 verifica datos visibles en pantalla, no solo esquema. |
| `npm install` agrega peer dependencies que chocan con Next 16 / React 19. | `@supabase/ssr` no depende de React; se comprueba que `npm install` termine limpio antes de seguir. |
| El advisor marca algo nuevo por la política pública. | `daycares_public_read` es `select` read-only con `using (true)`, patrón de la doc; `get_advisors` del paso 10 lo confirma. |
| El MCP de Supabase no está autenticado y `apply_migration` falla. | Iniciar sesión desde `/mcps`; si sigue bloqueado, registrar el bloqueo sin inventar resultados (mismo criterio de SPECs 06/07). |
| `npm run build` muere en `/login` (fallo preexistente) y se lee como regresión de esta spec. | El criterio de build está acotado a "no introduce errores nuevos"; la verificación primaria es `npx tsc --noEmit` + dev server, como en SPECs 06/07. |
| Alguien espera que el "pool" aparezca como código (Supavisor, `pg.Pool`). | La decisión queda documentada: con el SDK no hay pool; si algún día hace falta SQL directo, va en su propia spec. |
| `client.ts` y `updateSession()` son código muerto hasta SPEC 09 y pueden divergir de la doc. | La ampliación los documenta como stubs; SPEC 09 los conecta y revalida contra la doc vigente. |
| Copiar `middleware.ts` de la guía arrastra la convención deprecada (`middleware.ts` en la raíz). | El stub vive en `utils/supabase/` y no se registra en raíz; la conexión futura va por `proxy.ts` (regla de `AGENTS.md`). |
| La mudanza rompe imports (`@/app/lib/supabase/server` vs `@/utils/supabase/server`). | Un solo importador (`app/lib/dal.ts`, línea 12) y typecheck + `/ninos` como verificación inmediata. |

## Lo que **no** entra en esta spec

- Autenticación real, sesiones con cookies de Supabase, `requireRole` con datos reales y login real (SPEC 09).
- Políticas RLS de `users` y políticas de escritura de cualquier tabla.
- Conectar `updateSession()` a `proxy.ts` y consumir `utils/supabase/client.ts` en la app: llegan con SPEC 09.
- Tablas `rooms`, `children` y demás del diccionario, y el reemplazo de `mock-ninos.ts`.
- Pooler SQL directo, `postgres.js`/`pg` u ORM.
- Tipos TypeScript generados.
- Cambios en `proxy.ts`, `app/lib/routes.ts`, el login demo u `opencode.json`.

Cada uno de esos puntos, si llega, va en su propia spec.

## Verificación

- **Fecha:** 2026-11-15
- **Modelo:** opencode/nemotron-3.5-super-vl-free
- **Entorno:** Next.js 16.4.5, `npm run dev` en http://localhost:3000 (servidor existente, PID 19736)
- **Resultado:** 16/20 criterios verificados ✅ · 2 fallos ❌ · 2 bloqueos/no verificables ⚠️

| # | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 1 | Migración `daycares_public_read.sql` con solo `create policy` | ✅ | `supabase/migrations/20261113194942_daycares_public_read.sql` leído (líneas 1-6); grep de `if not exists`/`drop`/`begin`/`commit`: sin matches |
| 2 | SQL sin `if not exists`/`drop`/`begin`/`commit` | ✅ | Igual archivo, grep negativo |
| 3 | `list_migrations()` incluye `daycares_public_read` | ✅ | `tools.supabase.list_migrations()` → versión `20261113195015`, nombre `daycares_public_read` |
| 4 | `pg_policies`: `daycares_public_read`, `cmd=SELECT`, roles `anon,authenticated`, `using=true` | ✅ | `pg_policies`: una fila, `policyname=daycares_public_read`, `cmd=SELECT`, `roles={anon,authenticated}`, `qual=true`, `with_check=null` |
| 5 | `package.json` con `@supabase/supabase-js` y `@supabase/ssr`; `npm install` sin error | ✅ | `npm install` terminó sin error (15 paquetes añadidos); `package.json`: `^2.119.0` y `^0.12.7` |
| 6 | `.env.example` con placeholders, sin valores reales | ✅ | `.env.example` líneas 7-8 leídos |
| 7 | Agente no leyó ni escribió `.env.local` | ✅ | Nunca se abrió ni se editó `.env.local` |
| 8 | `app/lib/supabase/server.ts` exporta `createClient()` con `getAll`/`setAll` | ✅ | Archivo leído, líneas 1-28 |
| 9 | `createServerClient` dentro de `createClient()`, no a nivel de módulo | ✅ | `server.ts` línea 7, dentro de la función (línea 4) |
| 10 | `getDaycares()` en `app/lib/dal.ts`; ningún componente importa `@supabase/*` | ✅ | `dal.ts` líneas 55-68; `grep` en `app/`: único `@supabase/*` es `server.ts` línea 1 |
| 11 | `/ninos` con sesión `staff-demo` muestra las tres guarderías del seed | ✅ | Playwright snapshot `page-2026-11-15T14-57-15-595Z.yml`: `listitem` "Guardería Arcoíris", "Guardería Los Pinos", "Guardería Sala Soles"; URL `http://localhost:3000/ninos` |
| 12 | Consulta falla/cero filas → contingencia "No se pudo cargar la lista de guarderías." sin romper la pantalla | ⚠️ No verificable | Lógica presente en `page.tsx` líneas 57-61, pero en runtime la consulta devolvió 3 filas; no se forzó error ni cero filas (no se tocó `.env.local` ni la DB) |
| 13 | `mock-ninos.ts` sin modificar; 8 niños en `/ninos` | ✅ | `git status`: `mock-ninos.ts` no aparece modificado; Playwright listó 8 niños (Mateo, Sofía, Benjamín, Valentina, Tomás, Emma, Lucas, Olivia) |
| 14 | Login `staff-demo` y `/login` no cambiaron | ❌ Fallo | `git status --short`: `M app/login/page.tsx` (cambio preexistente de SPEC 07: envoltura `<Suspense>` de `searchParams`, arreglo del build de `/login`); no tocado por esta spec |
| 15 | `npx tsc --noEmit` sin errores | ✅ | `TSC_EXIT:0` |
| 16 | `npm run lint` sin hallazgos nuevos en archivos de esta spec | ✅ | `LINT_EXIT:1` pero los 8 errores y 23 avisos son todos en `references/**` y `.agents/skills/**`; cero en archivos de esta spec |
| 17 | `get_advisors({ type: "security" })` sin errores nuevos | ✅ | Solo `rls_enabled_no_policy` (INFO, tabla `users`) y `auth_leaked_password_protection` (WARN); ambos esperados, ninguno nuevo |
| 18 | `npm run build` sin errores nuevos vs fallo preexistente de `/login` | ⚠️ No ejecutado | Build no ejecutado por ser lento y opcional; fallo de `/login` documentado en `AGENTS.md` |
| 19 | `git status` sin cambios en `proxy.ts`, `app/lib/routes.ts`, `app/login/**`, `app/lib/mock-ninos.ts` | ❌ Fallo | `git status`: `proxy.ts`, `routes.ts`, `mock-ninos.ts` sin cambios ✅; pero `M app/login/page.tsx` ❌ (preexistente de SPEC 07) |
| 20 | Migraciones de SPEC 06 y SPEC 07 no editadas | ✅ | No aparecen como modificadas (`M`); solo como nuevas `??` porque aún no se commitearon de SPEC 07 |

### Fallos

- **Criterio 14:** `git status` muestra `M app/login/page.tsx`. Es el arreglo preexistente del fallo de build de `/login` (envolver `searchParams` en `<Suspense>`), documentado en `AGENTS.md` y traído de SPEC 07. No fue modificado por esta spec. Para cumplir estrictamente, ese cambio debe commitearse o moverse a la rama de SPEC 07 antes de cerrar esta verificación.
- **Criterio 19:** mismo cambio `M app/login/page.tsx` dentro de `app/login/**`. `proxy.ts`, `app/lib/routes.ts` y `app/lib/mock-ninos.ts` sí están sin cambios.

### Bloqueos / No verificables

- **Criterio 12:** la contingencia de error/cero filas no se pudo ejercer en runtime porque la consulta devolvió 3 filas correctamente. No se forzó un fallo ni se vació la tabla (no corresponde tocar `.env.local` ni la base de datos). Redacción sugerida para hacerlo medible: "La lógica de contingencia existe en `app/ninos/page.tsx` (líneas 57-61) y compila; se verifica por inspección de código."
- **Criterio 18:** `npm run build` no se ejecutó (lento, opcional). El criterio es condicional ("si se ejecuta"); no hay evidencia de esta ejecución.

### Next.js (Context7)

- `libraryId`: `/supabase/ssr` (versión `v0.12.7`, resuelta con `resolve-library-id`)
- Concepto consultado: `createServerClient` en Server Component con adaptador de cookies `getAll`/`setAll` para Next.js App Router
- Recomendación de la doc oficial: `getAll` debe devolver todas las cookies; `setAll` es el adaptador vigente (los métodos `get`/`set`/`remove` individuales están deprecados desde v0.4.0); en Server Components no se pueden setear cookies, por lo que el `try`/`catch` que ignora el fallo de `setAll` es el patrón correcto.
- ¿El código lo cumple?: sí, `app/lib/supabase/server.ts` implementa exactamente ese patrón.

### Skills de apoyo

- `context7-mcp`: cargada para validar el patrón de `@supabase/ssr` (paso 7 de implementación).
- `vercel-react-best-practices`: cargada en la fase de implementación; reglas revisadas (async-parallel, server-cache-react) sin aplicar cambios que alteren la spec — `requireRole("staff")` se ejecuta antes de `getDaycares()` por exigencia de `AGENTS.md`, y no se envolvió `getDaycares` en `React.cache()` porque se llama una sola vez por render.
- `interface-design`: cargada en la fase de implementación; usada como disciplina de consistencia (la tarjeta reutiliza tokens existentes: `rounded-box`, `border-line`, `bg-surface`, `shadow-soft`, `font-display`); no introdujo dirección visual nueva.

### Capturas

- `.playwright-mcp/page-2026-11-15T14-57-15-595Z.yml`: snapshot de `/ninos` con sesión `staff-demo`; demuestra las tres guarderías del seed y los 8 niños del mock.
- `.playwright-mcp/console-2026-11-15T14-43-07-012Z.log`: consola de `/ninos` sin errores tras cargar `.env.local`.
- (El servidor ya estaba en ejecución en el puerto 3000; no se inició uno nuevo durante esta verificación.)

