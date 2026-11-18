# SPEC 10 — Búsqueda de niños y alta funcional con persistencia en Supabase

> **Estado:** Implementado
> **Depende de:** SPEC 02, SPEC 08, SPEC 09
> **Fecha:** 2026-11-15
> **Objetivo:** Que la búsqueda y el alta de `/ninos` funcionen contra Supabase: DDL completo del diccionario migrado, alta insertada por Server Action y listado y perfil leídos de `children` con RLS por guardería.

## Por qué existe esta spec

La primera versión de esta spec (2026-11-15, verificada 11/12 abajo) dejó el alta "en sesión": el niño agregado vivía en `useState` y moría al recargar, con la persistencia deliberadamente aplazada. La persona revisó el resultado y decidió enmendar la spec: el alta debe **persistir en Supabase**, tomando `references/DB-Schema/opendaycare-database-schema.md` como esquema objetivo y creando **todo su DDL**, no solo lo mínimo. Eso arrastra dos consecuencias que la versión original aplazaba: el listado deja de leer del mock (si no, el alta "desaparecería" al recargar) y el perfil `/ninos/[id]` pasa de ids kebab-case a uuid, así que también lee de la base.

## Alcance

**Dentro:**

- Migraciones con el DDL completo del diccionario: los 6 enums y las 11 tablas que faltan (`daycares` y `users` ya existen de SPECs 06/07), agrupadas en migraciones de un cambio lógico cada una.
- RLS habilitada en todas las tablas nuevas; políticas **por guardería** para `rooms` y `children`: `select` e `insert` para staff/admin de la guardería del usuario autenticado (patrón `exists` sobre `users.daycare_id` con `(select auth.uid())`).
- Seed: 3 rooms (Soles, Lunas, Estrellas) bajo la guardería del staff demo y los 8 niños del mock como filas de `children` (fechas ISO, `allergy_tags` en inglés, `medical_notes`).
- DAL: `getSalas()`, `getNinos()`, `getNinoPorId(id)` y la lógica de mapeo DB → UI (edad, chip, tono de avatar).
- Server Action `altaNino` en `app/ninos/actions.ts`: `requireRole("staff")`, mapeo de campos, insert y `revalidatePath("/ninos")`.
- Modal de alta conectado: select de salas alimentado desde `rooms`, estado de error del insert dentro del diálogo y estado `pending` mientras guarda.
- Listado `/ninos` y perfil `/ninos/[id]` leen de la base; `app/lib/mock-ninos.ts` deja de alimentar pantallas.
- Búsqueda en cliente, contador singular/plural, agrupación por sala y los dos estados vacíos: sin cambios respecto a la primera pasada.

**Fuera del alcance (para futuras specs):**

- Vincular padres: `parent_children` e `invitations` se crean pero la app no las consume; SPEC 04 (modal de invitación) no cambia.
- Feed persistente: `posts` y relacionadas se crean; las `const posts` siguen alimentando `/feed`.
- Edición, archivado y borrado de niños: solo existe el alta (`status` siempre `active`).
- Búsqueda en servidor con `searchParams`; búsqueda por sala, alergias u otros campos.
- Pantalla de familias y signup.
- Tipos TypeScript generados (`supabase gen types`).

## Modelo de datos

Migraciones nuevas (`supabase/migrations/`, timestamp UTC de creación, slug = `name` de `apply_migration`, sin `if not exists`/`drop`/`begin`/`commit`):

| Migración (name) | Contenido |
| --- | --- |
| `create_enums` | Los 4 enums que faltan del diccionario (`user_role` y `user_status` ya existen desde SPEC 07, los usa la tabla `users`). |
| `create_rooms_children` | Tablas `rooms` y `children` (el par que la app consume ya). |
| `create_parent_children_invitations` | `parent_children` e `invitations`. |
| `create_posts_tables` | `posts`, `post_children`, `post_photos`. |
| `create_interactions` | `reactions`, `comments`. |
| `create_daily_summaries_devices` | `daily_summaries`, `devices`. |
| `enable_rls_all` | `alter table … enable row level security` en las 11 tablas nuevas (sin políticas, aviso INFO esperado). |
| `rooms_children_staff_rls` | Políticas por guardería para `rooms` y `children`. |
| `seed_rooms` | 3 rooms bajo la guardería "Guardería Sala Soles" (la del staff demo de SPEC 07). |
| `seed_children` | Los 8 niños del mock: `birth_date` ISO (p. ej. "12 mar 2022" → `2022-03-12`), `enrolled_at` de su `ingreso` (día 1 del mes), `allergy_tags` de su chip, `medical_notes` de sus notas, `status: active`. |

Política tipo (el mismo `exists` para `insert … with check`; `children` une vía su `room_id`):

```sql
create policy "rooms_staff_own_daycare"
  on public.rooms
  for select
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.daycare_id = rooms.daycare_id
        and u.role in ('staff', 'admin')
    )
  );
```

Traducción de alergias UI ↔ DB (`allergy_tags` exige inglés): diccionario fijo `maní→peanut`, `lactosa→lactose`, `gluten→gluten`, `huevo→egg`, `frutos secos→tree nuts`; etiqueta desconocida se guarda como slug minúsculas sin acentos. Al leer, `peanut` → "MANÍ" y lo no traducido vuelve tal cual.

Tipos y mapeo en `app/lib/dal.ts` (el tipo `Nino` se muda aquí desde el mock; misma forma para la UI, pero `id` es uuid, `nacimiento`/`ingreso` se formatean desde `birth_date`/`enrolled_at`, `edad` se calcula con `calcularEdadTexto` y `avatarTone` se deriva por hash del nombre, lógica migrada de `tonoDeAvatar`):

```ts
export type Nino = { id: string; nombre: string; sala: string; /* …igual que hoy… */ };
export type Sala = { id: string; name: string };

export async function getSalas(): Promise<Sala[]>;
export async function getNinos(): Promise<Nino[]>;       // children activos + rooms + conteo de parent_children
export async function getNinoPorId(id: string): Promise<Nino | null>;
```

## Plan de implementación

1. Crear y aplicar `create_enums` y las cuatro migraciones de tablas. *Manual: `list_migrations()` las lista y `information_schema` muestra enums y tablas con sus FKs.*
2. Aplicar `enable_rls_all` y `rooms_children_staff_rls`. *Manual: `pg_policies` muestra las políticas y `get_advisors({ type: "security" })` no reporta errores nuevos.*
3. Aplicar `seed_rooms` y `seed_children`. *Manual: `select count(*)` devuelve 3 rooms y 8 children activos.*
4. Agregar a la DAL `getSalas()`, `getNinos()` y `getNinoPorId()` con el mapeo DB → UI, y mudar el tipo `Nino` desde el mock. *Manual: con el mock aún en su sitio, `/ninos` muestra los mismos 8 niños pero leídos de la base (ids uuid).*
5. Crear `app/ninos/actions.ts` con `altaNino` (Server Action) y reconectar el modal: `onAgregar` pasa a llamar la acción, el select de salas recibe `getSalas()`, el diálogo muestra el error del insert y conserva lo escrito, y el listado pierde `ninosAgregados`/`onAgregar` (el refresco lo da `revalidatePath`). *Manual: dar de alta "Martina López" (Lunas, Maní) y recargar: sigue apareciendo.*
6. Reconectar el perfil `/ninos/[id]` a `getNinoPorId` (uuid, fecha ISO → `dd/mm/aaaa` para la edad). *Manual: la tarjeta de Martina lleva a su perfil con edad, chip MANÍ y "sin padres vinculados".*
7. Retirar el mock: borrar el contenido de datos de `app/lib/mock-ninos.ts` (`ninos`, `getNino`, `ninoDesdeFormulario`), dejando los tipos en `dal.ts`. *Manual: `grep -r "mock-ninos" app/` sin coincidencias y `npx tsc --noEmit` sin errores.*
8. Verificación final: `npx tsc --noEmit` → `npm run lint` (sin hallazgos nuevos) → `npm run build` (sin errores nuevos) → advisors de seguridad → punta a punta con Playwright.

## Criterios de aceptación

- [ ] `list_migrations()` incluye las 10 migraciones nuevas y ninguna aplicada fue editada.
- [ ] `information_schema` muestra los 6 enums y las 11 tablas del diccionario con sus FKs y PKs uuid.
- [ ] RLS está habilitada en las 11 tablas nuevas y `pg_policies` tiene políticas de `select` e `insert` por guardería sobre `rooms` y `children`.
- [ ] Con sesión staff, `/ninos` muestra los 8 niños sembrados, agrupados en "SALA SOLES", con contador "8 niños" y la tarjeta de Guarderías con las 3 guarderías reales.
- [ ] La búsqueda se comporta como hoy: "sof" → solo Sofía con "1 niño"; "SOFIA" sin tilde también la encuentra; limpiar restaura los 8; "zzz" muestra "Sin resultados para «zzz»" con Guarderías visible.
- [ ] Dar de alta "Martina López" (sala Lunas, alergia Maní, fecha del formulario) crea la fila en `children` con `birth_date` ISO, `allergy_tags = {peanut}`, `room_id` de Lunas, `status: active`, y aparece en "SALA LUNAS" con inicial "M", edad calculada y chip "MANÍ".
- [ ] Tras recargar `/ninos`, Martina sigue en el listado (persistencia real; el criterio de "desaparece al recargar" de la primera pasada queda derogado).
- [ ] La tarjeta de Martina enlaza a `/ninos/<uuid>` y el perfil renderiza con los datos de la base.
- [ ] Si el insert falla, el diálogo muestra "No se pudo guardar el niño. Intentalo de nuevo.", no se cierra y conserva los datos. *(Verificable por inspección de la acción; forzar el fallo en runtime no se garantiza.)*
- [ ] El select de sala del modal lista las rooms de la guardería del staff y no opciones hardcodeadas.
- [ ] `app/lib/mock-ninos.ts` no alimenta ninguna pantalla y ningún archivo importa sus datos; los tipos viven en `dal.ts`.
- [ ] Sin sesión, `/ninos` sigue redirigiendo a `/login?next=%2Fninos`; `proxy.ts` y `routes.ts` sin cambios.
- [ ] `get_advisors({ type: "security" })` sin errores nuevos (los avisos INFO `rls_enabled_no_policy` de tablas aún sin políticas son esperados).
- [ ] `npx tsc --noEmit` sin errores; `npm run lint` sin hallazgos en archivos de esta spec; `npm run build` sin errores nuevos respecto al estado documentado en `AGENTS.md`.

## Decisiones

- **Sí:** enmendar esta spec en lugar de crear una 11. Decisión explícita de la persona; la verificación de la primera pasada queda abajo como registro histórico y sus criterios de alta en sesión quedan derogados por los nuevos.
- **Sí:** DDL completo de una vez (6 enums + 11 tablas). El diccionario es el objetivo del repo y crear de a tabla obligaría a una cadena de migraciones de dependencia por cada dominio futuro.
- **Sí:** RLS habilitada en todo y políticas solo en `rooms`/`children`. Dejar RLS desactivada sería crear tablas abiertas; el aviso INFO de tablas sin políticas es el estado esperado hasta que cada dominio tenga su spec (igual que `daycares` desde SPEC 06).
- **Sí:** Server Action para el alta. `AGENTS.md` fija la DAL como única vía de datos reales; Context7 confirma que Server Actions pueden escribir cookies y que el scaffold `getAll`/`setAll` cubre ese caso.
- **Sí:** políticas por guardería con `exists` sobre `users.daycare_id` y `(select auth.uid())` envuelto: el patrón multi-tenant del diccionario y la optimización que la doc oficial recomienda (initPlan por statement).
- **Sí:** diccionario de alergias UI↔DB. La convención del esquema exige inglés en DB y español en UI; sin diccionario, "Maní" del formulario ensuciaría `allergy_tags`.
- **Sí:** select de salas desde `rooms`. Con la sala persistida como FK, un `<option>` hardcodeado que no exista en la base rompería el alta en runtime.
- **Sí:** perfil leído de la base. Los ids pasan a uuid; dejar `getNino` con ids kebab dejaría las tarjetas del listado apuntando a 404.
- **Sí:** seed con salas y niños del mock. Mantiene la maqueta demostrable y el perfil de Mateo con sus notas reales.
- **Sí:** el estado vacío "Aún no hay niños" sigue siendo código teóricamente muerto con el seed (igual que en la primera pasada); con la base como fuente ahora es alcanzable si la tabla se vacía.
- **No:** búsqueda en servidor, vincular padres, feed persistente, edición/archivado, pantalla de familias ni tipos generados. Cada uno va en su propia spec.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El seed mapea mal fechas ("feb 2025" → ¿qué día?) o alergias. | Reglas explícitas: día 1 del mes para `enrolled_at`, fechas de nacimiento literales del mock; verificación en pantalla del paso 4 contra la apariencia actual. |
| Una política con `exists` contra `users` filtra todo si el perfil del staff demo no tiene `daycare_id`. | El seed de SPEC 07 ya lo vincula a "Guardería Sala Soles"; el paso 2 verifica con `pg_policies` y el paso 4 con datos en pantalla. |
| `auth.uid()` evaluado por fila en la política. | Envuelto en `(select auth.uid())`, patrón de initPlan de la doc. |
| `/ninos/[id]` recibe un string que no es uuid y la consulta a PostgREST falla feo. | `getNinoPorId` devuelve `null` ante error y el perfil hace `notFound()`, igual que hoy. |
| Nombre duplicado: la lógica de slug con sufijo muere con el mock y la DB no tiene UNIQUE en `full_name`. | Permitido por diseño: ids uuid eliminan la colisión; los duplicados se listan tal cual. |
| `npm run build` falla y se lee como regresión. | Criterio acotado a "sin errores nuevos"; el fallo de `/login` está documentado en `AGENTS.md`. |
| El MCP de Supabase no está autenticado y `apply_migration` falla. | Iniciar sesión desde `/mcps`; si sigue bloqueado, registrar el bloqueo sin inventar resultados. |

## Lo que **no** entra en esta spec

- Vincular padres al niño (`parent_children`, `invitations`), feed persistente, edición/archivado/borrado de niños, búsqueda en servidor, pantalla de familias, tipos TS generados.

Cada uno de esos puntos, si llega, va en su propia spec.

## Verificación

### Primera pasada (2026-11-15 — alcance original, alta en sesión)

- **Fecha:** 2026-11-15
- **Modelo:** opencode/nemotron-3.5-super-vl-free
- **Entorno:** Next.js 16.4.5, `npm run dev` en http://localhost:3000 (servidor ya levantado, no se reinició), verificación de la app vía Playwright en contexto aislado `spec-10-verify-anon`
- **Resultado:** 11/12 criterios verificados ✅ · 0 fallos · 1 bloqueo/no verificable en runtime ⚠️
- **Nota:** esta verificación describe el alcance anterior (alta en sesión, sin persistencia). Sus criterios quedan como evidencia de esa ejecución y no se re-ejecutan; los criterios vigentes son los de arriba.

| # | Criterio (alcance original) | Resultado | Evidencia |
| --- | --- | --- | --- |
| 1 | `/ninos` con sesión staff, misma apariencia de hoy | ✅ | Playwright: URL `/ninos`, tarjeta Guarderías con 3 guarderías, 8 tarjetas, contador "8 niños", botón "Agregar niño" |
| 2 | Buscar "sof" → solo Sofía Méndez, "1 niño" | ✅ | Playwright evaluate: 1 tarjeta, nombre "Sofía Méndez" |
| 3 | "SOFIA" sin tilde/mayúsculas → Sofía; limpiar → 8 niños | ✅ | Playwright: `valor: "SOFIA"` → 1 tarjeta "Sofía Méndez"; limpiar → valor `""`, 8 tarjetas |
| 4 | "zzz" → "Sin resultados para «zzz»", Guarderías visible | ✅ | Playwright evaluate: `sinResultados: true`, `guarderias: true`, `tarjetas: 0` |
| 5 | Contador singular/plural ("1 niño", "8 niños") | ✅ | Playwright: "1 niño" con filtro, "8 niños" limpio |
| 6 | Alta Martina López (Lunas, Maní, 05/02/2024) en SALA LUNAS | ✅ | Playwright: grupos ["SALA LUNAS", "SALA SOLES"], edad "2 años", chip "MANÍ", "sin padres vinculados" |
| 7 | Tarjeta agregada no es enlace | ✅ | Playwright: `tarjetaMartinaEsLink: false` |
| 8 | Recargar → Martina desaparece, búsqueda vacía | ✅ | Playwright: `martina: false`, `busqueda: ""`, grupos ["SALA SOLES"] |
| 9 | Cero niños: ocultar Guarderías, mensaje + CTA | ⚠️ No verificable en runtime | Mock siempre tiene 8 niños; lógica confirmada por inspección de la isla cliente |
| 10 | `mock-ninos.ts` conserva `ninos` y `getNino` | ✅ | Inspección de código: lista y función intactas, solo se agregaron helpers al final |
| 11 | Sin cambios en `proxy.ts`, `routes.ts`, Supabase | ✅ | `git status --short`: solo `app/lib/fecha-nacimiento.ts`, `app/lib/mock-ninos.ts`, `app/ninos/agregar-nino.tsx`, `app/ninos/page.tsx` modificados; la isla cliente nueva |
| 12 | `tsc` / `lint` / `build` sin errores nuevos | ✅ | `npx tsc --noEmit`: TSC_EXIT:0; `npm run lint`: 8 errores y 23 avisos, todos preexistentes en `references/**` y `.agents/skills/**`, cero en archivos de esta spec; `npm run build`: 9/9 rutas, exit 0 |

### Fallos

Ninguno.

### Bloqueos / No verificables

- **Criterio 9** (cero niños): no es alcanzable en runtime porque el mock siempre trae 8 niños. La lógica estaba implementada en la isla cliente y se verifica por inspección de código; con la base como fuente es alcanzable si la tabla se vacía.

### Next.js (Context7, primera pasada)

- `libraryId` consultado: `/vercel/next.js` (versión instalada 16.4.5 en `node_modules/next/package.json`)
- Concepto consultado: `cacheComponents` + `partialPrefetching` — lecturas de `cookies()`/`searchParams` dentro de `<Suspense>`
  - Recomendación de la doc oficial: con Cache Components, acceder a `cookies()`/`headers()`/`searchParams` fuera de `<Suspense>` surfaces el insight `blocking-prerender-runtime`; debe moverse a un componente envuelto en `<Suspense>`
  - ¿El código lo cumplía?: sí — `app/ninos/page.tsx` envuelve `NinosContent` (que llama `connection()` y `requireRole()`) en `<Suspense>`
- Concepto consultado: Server → Client Component boundary, props serializables
  - ¿El código lo cumplía?: sí — `page.tsx` pasa `{ ninos, guarderias }` (arrays de objetos planos) a la isla; `onAgregar` se define dentro del cliente

### Skills de apoyo (primera pasada)

Ninguna cargada (la verificación se resolvió con Context7, Playwright y comandos estáticos del repo).

### Capturas (primera pasada)

- `.playwright-mcp/spec-10-verify-inicial.png`: `/ninos` con sesión staff, estado inicial (8 niños, tarjeta Guarderías, búsqueda vacía)
- `.playwright-mcp/page-2026-11-15T18-17-20-251Z.yml`: snapshot de `/login?next=%2Fninos` sin sesión (proxy redirige correctamente)

### Segunda pasada (persistencia en Supabase)

Pendiente de `/spec-verify`; los criterios `[ ]` de arriba se marcan solo con evidencia de esa ejecución.
