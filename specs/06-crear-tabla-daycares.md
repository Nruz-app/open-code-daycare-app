# SPEC 06 — Primera migración: tabla `daycares`

> **Estado:** Implementado
> **Depende de:** Ninguna
> **Fecha:** 2026-11-12
> **Objetivo:** Crear la tabla `daycares` en Supabase con la primera migración SQL versionada del repositorio, sin conectar todavía la app.

## Por qué existe esta spec

`references/DB-Schema/opendaycare-database-schema.md` define trece tablas para PostgreSQL y marca `daycares` como la entidad raíz del modelo. El proyecto Supabase `btknjzobaqtekofvfsof` está vacío: la consulta del 2026-11-12 devolvió **0 tablas** en `public` y **0 migraciones**. El repositorio tampoco tiene carpeta `supabase/`, `config.toml` ni un patrón de migración escrito.

Esta spec crea la primera tabla y, sobre todo, fija el patrón que usarán las doce tablas restantes: dónde vive el SQL, cómo se nombra, cómo se aplica con la herramienta MCP `apply_migration` y cómo se verifica. La app sigue sin SDK ni persistencia; conectar pantallas es otra spec.

## Ampliación 2026-11-12 — seed de guarderías demo

La versión original excluía datos de ejemplo para no mezclar DDL y contenido demo. En uso real la tabla quedó vacía y no permite probar listados ni el futuro flujo de selección de guardería, así que esta ampliación agrega una migración de datos separada:

- `supabase/migrations/20261112212015_seed_daycares.sql` inserta tres guarderías: "Guardería Sala Soles", "Guardería Arcoíris" y "Guardería Los Pinos".
- La migración de esquema `create_daycares` no se toca: el seed va en un archivo nuevo, según la regla de inmutabilidad.
- Sigue fuera de alcance: seeds de otras tablas, `on conflict`, datos que dependan de `users` o `auth`, y que la app lea estas filas.
- Los criterios nuevos quedan `[ ]` hasta que `/spec-verify` los pruebe. El estado de la spec no cambia.

## Alcance

**Dentro:**

- Carpeta `supabase/migrations/` en la raíz de `open-daycare/`.
- Archivo `supabase/migrations/20261112181511_create_daycares.sql` con el DDL de `daycares`.
- Tabla `public.daycares` con las tres columnas del diccionario y RLS habilitado sin políticas.
- Aplicación de la migración al proyecto Supabase `btknjzobaqtekofvfsof` con `tools.supabase.apply_migration`.
- Verificación del esquema, de la migración registrada, de RLS y del estado inicial de la tabla.
- Migración de datos `seed_daycares.sql` con tres guarderías demo (ampliación 2026-11-12).
- Subsección breve "Migraciones (Supabase)" en `AGENTS.md` de la app para que las próximas specs no reinventen el patrón.

**Fuera del alcance (para futuras specs):**

- Cualquier cambio en `app/`: SDK `@supabase/supabase-js`, variables de entorno, tipos TypeScript, DAL o sustitución de `mock-ninos.ts`.
- Insertar datos de ejemplo en otras tablas o con dependencias de `users` y `auth`.
- Políticas RLS; llegan con `users` y el flujo de autenticación.
- Las otras doce tablas del diccionario (`users`, `rooms`, `children`, etc.).
- Instalar la CLI de Supabase, crear `config.toml` o levantar el stack local.
- Tests automatizados, rollbacks y migraciones de datos que no sean el seed de `daycares`.
- Cambiar `opencode.json` o la configuración del servidor MCP.

## Modelo de datos

La migración crea una sola tabla en el esquema `public`:

```sql
-- Primera tabla del modelo: la guardería como entidad raíz.
create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;
```

| Columna      | Tipo          | Restricción                          | Notas                                   |
| ------------ | ------------- | ------------------------------------ | --------------------------------------- |
| `id`         | `uuid`        | PK, default `gen_random_uuid()`      | Identificador de la guardería.          |
| `name`       | `text`        | `not null`                           | Ej. "Guardería Sala Soles".             |
| `created_at` | `timestamptz` | `not null`, default `now()`          | Fecha de alta.                          |

Convenciones:

- Nombres de tabla y columnas en inglés, como exige el diccionario.
- `gen_random_uuid()` está disponible en el PostgreSQL de Supabase; no hace falta crear la extensión `pgcrypto`.
- No hay `updated_at` porque el diccionario no lo lista para `daycares`. Si hace falta, se agrega con otra migración.
- RLS habilitado y **cero políticas**: solo `service_role` y el rol de la conexión administrativa pueden leer o escribir. Es deny-by-default deliberado.
- La migración `create_daycares` es solo DDL; la semilla va en una migración aparte (ver ampliación).

### Semilla demo (ampliación 2026-11-12)

```sql
-- Datos demo para probar la primera tabla del modelo.
insert into public.daycares (name) values
  ('Guardería Sala Soles'),
  ('Guardería Arcoíris'),
  ('Guardería Los Pinos');
```

Reglas del seed:

- El seed va en su propio archivo `supabase/migrations/20261112212015_seed_daycares.sql`; no se toca `create_daycares`.
- No usa `on conflict` ni `if not exists`: la migración se ejecuta una vez y debe fallar si se reejecuta.
- `id` y `created_at` se generan con sus defaults.
- Las filas no son visibles para `anon` ni `authenticated` hasta que existan políticas RLS; se leen con la conexión administrativa o `service_role`.

### Patrón de migración

Queda fijado así para todas las tablas siguientes:

1. **Ubicación:** `supabase/migrations/`.
2. **Nombre del archivo:** `YYYYMMDDHHMMSS_snake_case.sql`, con el timestamp UTC del momento de crearlo. El slug va en `snake_case` y describe un solo cambio lógico (`create_daycares`, `create_users`).
3. **Contenido:** DDL o DML plano, sin `if not exists`, sin `drop` y sin `begin`/`commit` manual. Una migración se ejecuta una vez; si se vuelve a ejecutar debe fallar para exponer el drift.
4. **Aplicación:** se lee el archivo y se llama `tools.supabase.apply_migration({ name, query })`, donde `name` es el slug sin timestamp (`create_daycares`) y `query` es el SQL completo del archivo.
5. **Registro:** `apply_migration` guarda la versión en `supabase_migrations.schema_migrations`; `tools.supabase.list_migrations` es la fuente para comprobar qué se aplicó.
6. **Inmutabilidad:** una migración aplicada no se edita. Cualquier corrección entra en un archivo nuevo.
7. **Fuente de verdad:** el archivo del repo es el historial legible en Git; la base de datos guarda el historial ejecutado. Los dos deben coincidir.

## Plan de implementación

1. Crear la carpeta `supabase/migrations/` y el archivo `20261112181511_create_daycares.sql` con el SQL de la sección anterior. Manual: el archivo existe y contiene exactamente el `create table` y el `alter table ... enable row level security`.
2. Aplicar la migración con `tools.supabase.apply_migration({ name: "create_daycares", query: <contenido del archivo> })`. Manual: la llamada responde sin error.
3. Confirmar el registro con `tools.supabase.list_migrations()`. Manual: aparece una migración llamada `create_daycares`.
4. Confirmar la tabla con `tools.supabase.list_tables({ schemas: ["public"], verbose: true })`. Manual: `daycares` aparece con `id`, `name` y `created_at`, PK en `id` y los defaults esperados.
5. Confirmar RLS con `tools.supabase.execute_sql` sobre `pg_class.relrowsecurity` y `pg_policies`. Manual: `relrowsecurity = true` y cero políticas para `daycares`.
6. Confirmar restricciones y defaults con `information_schema.columns` y `pg_constraint`. Manual: `name` y `created_at` son `NOT NULL`; `id` tiene `gen_random_uuid()`; `created_at` tiene `now()`; no existe `updated_at`.
7. Confirmar que `create_daycares` no inserta filas con `select count(*) from public.daycares`. Manual: devuelve `0` antes del seed.
8. Ejecutar `tools.supabase.get_advisors({ type: "security" })`. Manual: no hay hallazgos nuevos de nivel error; un aviso informativo `rls_enabled_no_policy` es esperado y se documenta.
9. Añadir a `AGENTS.md` la subsección "Migraciones (Supabase)" con las siete reglas del patrón, sin tocar los bloques `BEGIN/END:nextjs-agent-*`. Manual: el archivo conserva esos bloques y la sección nueva se lee completa.
10. Revisar `git status --short`. Manual: solo aparecen la spec, los archivos SQL y `AGENTS.md`; ningún archivo de `app/` ni `package.json`.
11. Crear `supabase/migrations/20261112212015_seed_daycares.sql` con el `insert` de las tres guarderías. Manual: el archivo contiene un solo `insert` con los tres nombres.
12. Aplicar el seed con `tools.supabase.apply_migration({ name: "seed_daycares", query: <contenido del archivo> })`. Manual: la llamada responde sin error.
13. Confirmar el seed con `tools.supabase.list_migrations()`, `select count(*)` y `select name ... order by name`. Manual: aparece `seed_daycares`, el conteo es `3` y los nombres son los tres acordados.

## Criterios de aceptación

- [x] Existe `supabase/migrations/20261112181511_create_daycares.sql` con el DDL acordado.
- [x] `tools.supabase.list_migrations()` devuelve una migración llamada `create_daycares`.
- [x] `tools.supabase.list_tables({ schemas: ["public"], verbose: true })` incluye la tabla `daycares`.
- [x] `daycares` tiene exactamente tres columnas: `id`, `name` y `created_at`.
- [x] `id` es `uuid`, clave primaria, con default `gen_random_uuid()`.
- [x] `name` es `text` y `NOT NULL`.
- [x] `created_at` es `timestamptz`, `NOT NULL`, con default `now()`.
- [x] No existe la columna `updated_at`.
- [x] `pg_class.relrowsecurity` para `public.daycares` es `true`.
- [x] `pg_policies` no tiene ninguna fila para `public.daycares`.
- [x] `create_daycares` no inserta filas: el conteo era `0` inmediatamente después de aplicarla, antes del seed.
- [x] `tools.supabase.get_advisors({ type: "security" })` no reporta errores nuevos; el aviso `rls_enabled_no_policy` se acepta como informativo.
- [x] El archivo SQL no contiene `if not exists`, `drop`, `begin` ni `commit`.
- [x] `AGENTS.md` conserva los bloques `BEGIN/END:nextjs-agent-*` y documenta el patrón.
- [ ] `git status --short` no muestra cambios en `app/` ni en `package.json`.
- [x] `npx tsc --noEmit` sigue terminando sin errores.
- [x] Existe `supabase/migrations/20261112212015_seed_daycares.sql` con el `insert` de las tres guarderías.
- [x] `tools.supabase.list_migrations()` incluye una migración llamada `seed_daycares`.
- [x] `select count(*) from public.daycares` devuelve `3`.
- [x] `select name from public.daycares order by name` devuelve exactamente "Guardería Arcoíris", "Guardería Los Pinos" y "Guardería Sala Soles".
- [x] La migración `create_daycares` no se modificó.

## Decisiones

- **Sí:** solo base de datos. La app no tiene SDK ni persistencia; instalar el cliente y tocar la DAL merece su propia spec y multiplicaría el alcance sin aportar a la primera tabla.
- **Sí:** archivo SQL local más `apply_migration` por MCP. Deja historial en Git y en Supabase, y usa la herramienta que el proyecto ya tiene configurada.
- **No:** solo `apply_migration` sin archivo. La base de datos tendría el historial, pero el repositorio no; cualquier revisión o despliegue futuro quedaría a ciegas.
- **No:** CLI de Supabase. Añade instalación, `config.toml` y un stack local que nadie pidió; el MCP ya aplica y registra la migración.
- **Sí:** columnas exactas al diccionario, incluida `id uuid` con `gen_random_uuid()`. La guía de Supabase recomienda UUIDv7 para tablas grandes por fragmentación de índice, pero el contrato del proyecto fija UUIDv4 y `daycares` es una tabla mínima.
- **Sí:** RLS habilitado sin políticas. Es deny-by-default y evita que la tabla quede abierta; las políticas necesitan el contexto de `users` y `auth.uid()`.
- **Sí:** sin seed dentro de `create_daycares`. Mezclar DDL y datos hace que el esquema dependa del contenido demo; la semilla va en una migración aparte.
- **Sí (ampliación 2026-11-12):** migración `seed_daycares` separada con tres guarderías. Permite probar la tabla sin tocar el DDL y se puede revertir con otra migración.
- **No (ampliación 2026-11-12):** `on conflict` o `if not exists` en el seed. La migración corre una vez; una reejecución debe fallar para exponer el drift.
- **Sí:** `name text not null`. Una guardería sin nombre no tiene sentido y el diccionario no prohíbe la restricción.
- **No:** `updated_at`. No está en el diccionario; se agrega con una migración futura si el caso aparece.
- **Sí:** DDL o DML plano sin `if not exists`. Una migración que se puede reejecutar en silencio esconde el drift; si ya se aplicó, debe fallar.
- **Sí:** documentar el patrón en `AGENTS.md`. Es documentación operativa, no código de app, y evita que las próximas doce tablas inventen nombres y flujos distintos.
- **No:** tipos TypeScript generados. Sin cliente Supabase no hay quién los consuma; llegan con la spec de conexión.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El MCP de Supabase no está autenticado y `apply_migration` falla. | Iniciar sesión desde `/mcps`; si sigue bloqueado, registrar el bloqueo y no inventar la aplicación. |
| `gen_random_uuid()` no está disponible en el proyecto. | Verificar con `select gen_random_uuid()` antes de aplicar; en Supabase es nativo desde PostgreSQL 13. |
| RLS sin políticas bloquea lecturas futuras de `anon` o `authenticated`. | Es el comportamiento buscado; las políticas se definen en la spec de `users` y autenticación. |
| El advisor de seguridad marca `rls_enabled_no_policy` y se interpreta como fallo. | Documentado como aviso informativo esperado en esta spec y en `AGENTS.md`. |
| Aplicar directo al proyecto de producción sin rama. | El proyecto está vacío y es la primera migración; no hay datos que perder. Para cambios posteriores se evalúa una rama de desarrollo. |
| El nombre de la migración no coincide con el archivo. | Usar el mismo slug `create_daycares` en el archivo y en `apply_migration`. |
| Editar el archivo después de aplicarlo. | Regla de inmutabilidad: cualquier corrección va en una migración nueva. |
| El timestamp del archivo se repite con otra migración futura. | Un archivo por cambio lógico y timestamp UTC del momento de creación; ante colisión, se espera un segundo y se renombra solo el archivo nuevo. |
| El seed se reejecuta y duplica filas. | Es una migración registrada: `apply_migration` no la vuelve a correr. Si se resetea la base, se reaplica una sola vez. |
| Las filas demo no se ven desde la app por RLS. | Esperado: no hay políticas ni cliente Supabase todavía. Se leen con la conexión administrativa. |

## Lo que **no** entra en esta spec

- Cliente Supabase, variables de entorno, tipos TypeScript o DAL.
- Seeds de otras tablas o seeds con dependencias de `users` y `auth`.
- Políticas RLS.
- Las tablas `users`, `rooms`, `children`, `parent_children`, `invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries` y `devices`.
- CLI de Supabase, `config.toml` o stack local.
- Tests automatizados y migraciones de rollback.

Cada uno de esos puntos, si llega, va en su propia spec.

## Verificación

- **Fecha:** 2026-11-12
- **Modelo:** `opencode/deepseek-v4.1-flash-free` (ejecución; agente configurado con `opencode/nemotron-3.5-super-vl-free`)
- **Entorno:** Supabase `btknjzobaqtekofvfsof` (PostgreSQL gestionado) y Next.js 16.4.5 sin cambios de app
- **Resultado:** 20/21 criterios verificados · 1 fallo · 0 bloqueos

| # | Criterio | Resultado | Evidencia |
| --- | --- | --- | --- |
| 1 | Existe el archivo `create_daycares.sql` con el DDL | ✅ | `supabase/migrations/20261112181511_create_daycares.sql:1-8`: `create table public.daycares` y `alter table ... enable row level security` |
| 2 | `list_migrations` devuelve `create_daycares` | ✅ | `list_migrations` → `{ version: "20261112211750", name: "create_daycares" }` |
| 3 | `list_tables` incluye `daycares` | ✅ | `list_tables({ schemas: ["public"], verbose: true })` → `public.daycares` |
| 4 | Tres columnas exactas | ✅ | `information_schema.columns`: `id`, `name`, `created_at`; sin `updated_at` |
| 5 | `id` uuid PK default `gen_random_uuid()` | ✅ | columns: `uuid`, `is_nullable = NO`, default `gen_random_uuid()`; `pg_constraint`: `daycares_pkey PRIMARY KEY (id)` |
| 6 | `name` text NOT NULL | ✅ | columns: `text`, `is_nullable = NO` |
| 7 | `created_at` timestamptz NOT NULL default `now()` | ✅ | columns: `timestamp with time zone`, `is_nullable = NO`, default `now()` |
| 8 | No existe `updated_at` | ✅ | columns devuelve solo las tres columnas esperadas |
| 9 | `relrowsecurity = true` | ✅ | `select c.relrowsecurity ...` → `{ rls_enabled: true }` |
| 10 | Cero políticas para `daycares` | ✅ | misma consulta → `{ policies: 0 }` |
| 11 | `create_daycares` no inserta filas | ✅ | `supabase_migrations.schema_migrations.statements` de `create_daycares` contiene solo `create table` y `alter table`; no hay `insert` |
| 12 | Advisors sin errores nuevos | ✅ | `get_advisors({ type: "security" })` → solo `rls_enabled_no_policy`, nivel `INFO` |
| 13 | SQL sin `if not exists`, `drop`, `begin` ni `commit` | ✅ | búsqueda global en `supabase/migrations/*.sql`: 0 coincidencias |
| 14 | `AGENTS.md` conserva bloques y documenta el patrón | ✅ | `AGENTS.md:1,9,189,208` conserva los cuatro marcadores; `AGENTS.md:125-139` documenta "Migraciones (Supabase)" |
| 15 | `git status --short` sin cambios en `app/` ni `package.json` | ❌ | `git status --short` muestra `M app/components/app-sidebar.tsx`, `M app/feed/*`, `M app/ninos/*` y archivos nuevos en `app/`; `package.json` no aparece. Son cambios de la SPEC 05 arrastrados a esta rama |
| 16 | `npx tsc --noEmit` sin errores | ✅ | salida vacía, código de salida 0 |
| 17 | Existe el seed con el `insert` de tres guarderías | ✅ | `supabase/migrations/20261112212015_seed_daycares.sql:1-5` |
| 18 | `list_migrations` incluye `seed_daycares` | ✅ | `list_migrations` → `{ version: "20261112212100", name: "seed_daycares" }` |
| 19 | `count(*)` devuelve 3 | ✅ | `select count(*)::int from public.daycares` → `{ total: 3 }` |
| 20 | Nombres exactos | ✅ | `select name ... order by name` → `Guardería Arcoíris`, `Guardería Los Pinos`, `Guardería Sala Soles` |
| 21 | `create_daycares` no se modificó | ✅ | `statements` aplicados en Supabase coinciden con `20261112181511_create_daycares.sql:1-8` |

### Fallos

- **Criterio 15:** `git status --short` sí muestra cambios en `app/` (`app/components/app-sidebar.tsx`, `app/feed/crear-publicacion.tsx`, `app/feed/page.tsx`, `app/ninos/[id]/page.tsx`, `app/ninos/page.tsx`) y archivos nuevos (`app/components/nueva-publicacion-provider.tsx`, `app/ninos/layout.tsx`). No los produjo esta spec: son el trabajo sin commitear de la SPEC 05 que viajó a la rama `spec-06-crear-tabla-daycares`. Para cumplir el criterio hace falta commitear o stashear la SPEC 05 y repetir la verificación con el árbol limpio. `package.json` no aparece en `git status`.

### Bloqueos

- Ninguno.

### Next.js (Context7)

- `libraryId` consultado: `/websites/supabase_guides`.
- Concepto: creación de tablas con migración SQL versionada y RLS.
- Recomendación: `create table public.<tabla>` con `id uuid primary key default gen_random_uuid()` y `alter table ... enable row level security;`; las políticas se agregan después con `auth.uid()`. El código cumple: la tabla usa esos defaults y RLS está habilitado. La spec difiere las políticas a la spec de `users`, decisión documentada.
- No hubo consulta a Next.js porque la spec no toca rutas, componentes, data fetching ni caché; los cambios de `app/` en la rama son trabajo previo de la SPEC 05.

### Capturas

- No aplica: la verificación es de base de datos y archivos; no se tomaron capturas de pantalla.

### Notas

- `npm run lint` termina con 2 errores y 8 avisos, todos en `references/pantallas/support.js` (bundle de maquetas). No hay hallazgos en archivos de esta spec.
