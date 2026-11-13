# SPEC 07 — Segunda migración: tabla `users` con enums y trigger de perfil

> **Estado:** Aprobado
> **Depende de:** SPEC 06
> **Fecha:** 2026-11-13
> **Objetivo:** Crear la tabla `users` con sus enums `user_role` y `user_status`, la FK a `auth.users`, el trigger que crea el perfil en cada signup y un usuario staff demo vinculado a "Guardería Sala Soles".

## Por qué existe esta spec

El diccionario de `references/DB-Schema/opendaycare-database-schema.md` marca `users` como el segundo nodo del modelo: `children`, `posts`, `comments`, `reactions`, `invitations` y `devices` llevan FK a ella, así que no se puede crear ninguna de esas tablas sin `users`. Tras SPEC 06 existen `daycares` con tres filas demo, y el patrón de migración está fijado. Esta spec crea `users`, sus dos enums, el trigger oficial de Supabase que materializa el perfil en el signup y un usuario staff demo que permite probar el flujo completo de punta a punta (insert en `auth.users` → trigger → fila en `users`). La app sigue sin SDK ni persistencia: conectarla es otra spec.

## Alcance

**Dentro:**

- Enum `user_role` con valores `staff`, `parent`, `admin`.
- Enum `user_status` con valores `pending`, `active`.
- Tabla `public.users` con las diez columnas del diccionario, FK a `public.daycares` y FK a `auth.users` ON DELETE CASCADE, RLS habilitado sin políticas.
- Columna `updated_at` refrescada por un trigger `BEFORE UPDATE`.
- Función `public.handle_new_user()` (`SECURITY DEFINER`) y trigger `on_auth_user_created` sobre `auth.users`, que crean la fila de perfil leyendo `daycare_id`, `role` y `full_name` de `raw_user_meta_data`.
- Seed: usuario staff demo `staff@guarderia-demo.test` / `demo1234` insertado en `auth.users`, que dispara el trigger y queda vinculado a "Guardería Sala Soles".
- Tres migraciones SQL en `supabase/migrations/` aplicadas con `tools.supabase.apply_migration`.
- Verificación de esquema, trigger, seed, RLS y advisors.

**Fuera del alcance (para futuras specs):**

- Políticas RLS de `users`; llegan con la spec de autenticación.
- Los otros cuatro enums (`relationship_type`, `invitation_status`, `post_type`, `child_status`) y las tablas `rooms`, `children`, `parent_children`, `invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`, `devices`.
- SDK `@supabase/supabase-js`, variables de entorno, tipos TypeScript, DAL, cambios en `app/`.
- Que la app lea el usuario staff o haga login con él; el mock `staff-demo` no cambia.
- Flujos de invitación, vínculo padre↔niño y gestión de usuarios desde pantallas.

## Modelo de datos

Tres archivos, con el timestamp UTC real al crearlos:

**1. `YYYYMMDDHHMMSS_create_users.sql`** — enums, tabla y RLS:

```sql
create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  daycare_id uuid not null references public.daycares(id),
  role public.user_role not null,
  status public.user_status not null default 'active',
  full_name text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_daycare on public.users (daycare_id);

-- updated_at se refresca en cada UPDATE.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

alter table public.users enable row level security;
```

**2. `YYYYMMDDHHMMSS_create_user_profile_trigger.sql`** — función y trigger de signup (patrón Context7: `/websites/supabase_guides`, "managing user data"):

```sql
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, daycare_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data->>'daycare_id')::uuid,
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**3. `YYYYMMDDHHMMSS_seed_staff_user.sql`** — usuario staff demo; el `id` lo genera `gen_random_uuid()` y el trigger crea el perfil:

```sql
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'staff@guarderia-demo.test',
  crypt('demo1234', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'daycare_id', (select id from public.daycares where name = 'Guardería Sala Soles'),
    'role', 'staff',
    'full_name', 'Ana Demo'
  ),
  now(), now(),
  '', '', '', ''
);
```

Convenciones: todo en inglés (enums, valores), heredado de SPEC 06; sin `if not exists`, sin `drop`, sin `begin`/`commit`; el perfil no duplica `email` ni hash de contraseña — viven en `auth.users`.

## Plan de implementación

1. Crear `supabase/migrations/<ts>_create_users.sql` con el SQL de la sección anterior. Manual: el archivo existe con enums, tabla, índice, trigger de `updated_at` y `alter table ... enable row level security`.
2. Aplicar con `tools.supabase.apply_migration({ name: "create_users", query: <archivo> })`. Manual: responde sin error.
3. Confirmar registro con `tools.supabase.list_migrations()`. Manual: aparece `create_users`.
4. Confirmar esquema con `list_tables({ schemas: ["public"], verbose: true })` y consultas a `information_schema.columns`, `pg_type`/`pg_enum`. Manual: `users` tiene exactamente las diez columnas; `user_role` tiene los tres valores y `user_status` los dos.
5. Confirmar FKs y RLS con `pg_constraint`, `pg_class.relrowsecurity` y `pg_policies`. Manual: FK a `auth.users` con `ON DELETE CASCADE`, FK a `daycares`, RLS `true` y cero políticas.
6. Crear y aplicar `<ts>_create_user_profile_trigger.sql` (`create_user_profile_trigger`). Manual: sin error, aparece en `list_migrations`.
7. Confirmar función y trigger: `pg_proc` (SECURITY DEFINER, `search_path` vacío) y `pg_trigger` sobre `auth.users`. Manual: `on_auth_user_created` activo.
8. Crear y aplicar `<ts>_seed_staff_user.sql` (`seed_staff_user`). Manual: sin error.
9. Confirmar el seed: `select email from auth.users where email = 'staff@guarderia-demo.test'` y `select ... from public.users` unido a `daycares`. Manual: una fila de perfil con `role = 'staff'`, `status = 'active'`, `full_name = 'Ana Demo'`, guardería "Guardería Sala Soles", `notify_on_post` y `daily_summary_enabled` en `true`, y el hash de contraseña empieza por `$2`.
10. Confirmar que el perfil tiene `id` igual al del usuario de auth y timestamps llenos. Manual: ids coinciden, `created_at`/`updated_at` no nulos.
11. Ejecutar `tools.supabase.get_advisors({ type: "security" })`. Manual: solo `rls_enabled_no_policy` para `users` y `daycares`, nivel informativo y esperado.
12. Ejecutar `npx tsc --noEmit` y revisar `git status --short`. Manual: typecheck sin errores; solo archivos de esta spec, sin cambios en `app/` ni `package.json`.

## Criterios de aceptación

- [ ] Existen los tres archivos SQL en `supabase/migrations/` con el contenido de la sección Modelo de datos.
- [ ] `tools.supabase.list_migrations()` incluye `create_users`, `create_user_profile_trigger` y `seed_staff_user`.
- [ ] `public.users` tiene exactamente diez columnas: `id`, `daycare_id`, `role`, `status`, `full_name`, `avatar_url`, `notify_on_post`, `daily_summary_enabled`, `created_at`, `updated_at`.
- [ ] `user_role` tiene exactamente `staff`, `parent`, `admin`; `user_status` tiene exactamente `pending`, `active`.
- [ ] `id` es PK con FK a `auth.users(id)` y `on delete cascade`.
- [ ] `daycare_id` es `uuid not null` con FK a `public.daycares(id)`.
- [ ] `role` y `full_name` son `not null`; `status` es `not null` con default `active`; `notify_on_post` y `daily_summary_enabled` tienen default `true`; `avatar_url` es nullable.
- [ ] Existe el índice `idx_users_daycare` sobre `daycare_id`.
- [ ] `pg_class.relrowsecurity` de `public.users` es `true` y `pg_policies` no tiene filas para ella.
- [ ] `on_auth_user_created` está activo sobre `auth.users` y su función es `security definer` con `search_path` vacío.
- [ ] Un `update` de prueba sobre la fila demo refresca `updated_at`.
- [ ] `select count(*) from public.users` devuelve `1`.
- [ ] La fila de perfil tiene `role = 'staff'`, `status = 'active'`, `full_name = 'Ana Demo'` y su `daycare_id` corresponde a "Guardería Sala Soles".
- [ ] `staff@guarderia-demo.test` existe en `auth.users` con `email_confirmed_at` no nulo y `encrypted_password` empezando por `$2`.
- [ ] El `id` de la fila de perfil es igual al `id` del usuario en `auth.users`.
- [ ] El SQL no contiene `if not exists`, `drop`, `begin` ni `commit`.
- [ ] `get_advisors({ type: "security" })` no reporta errores nuevos; `rls_enabled_no_policy` se acepta como informativo.
- [ ] `npx tsc --noEmit` termina sin errores.
- [ ] `git status --short` no muestra cambios en `app/` ni en `package.json`.
- [ ] Las migraciones de SPEC 06 (`create_daycares`, `seed_daycares`) no se modificaron.

## Decisiones

- **Sí:** FK a `auth.users` desde el día uno. Alterar la tabla después para agregarla sería una migración evitable y dejaría la tabla temporalmente infiel al diccionario.
- **Sí:** trigger `on_auth_user_created` ahora. El diccionario lo define como la implementación de Supabase y el seed lo necesita para probar el camino real.
- **Sí:** `SECURITY DEFINER` con `set search_path = ''`. Context7 documenta que el rol de auth no puede escribir fuera de `auth` sin definer; el `search_path` vacío evita el clásico exploit de esquema.
- **Sí:** fail-fast en el trigger: `daycare_id`, `role` y `full_name` son obligatorios en `raw_user_meta_data` y su ausencia aborta el signup con error claro. Prefiero exponer el problema a crear perfiles incompletos.
- **Sí:** insert SQL directo en `auth.users` para el seed. Es un proyecto demo; la doc de Supabase documenta la mecánica de `encrypted_password` con bcrypt.
- **No:** crear el usuario vía Auth API (`createUser`). Requiere SDK o service key desde fuera del SQL; el patrón del repo es migraciones SQL por MCP.
- **No:** políticas RLS ahora. Mismo criterio que SPEC 06: necesitan `auth.uid()` y las decisiones de autenticación.
- **Sí:** solo los enums `user_role` y `user_status`. Los otros cuatro pertenecen a tablas que no existen aún.
- **Sí:** `updated_at` con trigger `BEFORE UPDATE`. El diccionario sí lo lista (a diferencia de `daycares`) y sin trigger queda desactualizado.
- **Sí:** índice `idx_users_daycare`. Postgres no indexa FKs automáticamente y toda consulta futura filtrará por guardería; es barato.
- **Sí:** tres migraciones separadas. Un cambio lógico por archivo: esquema, hook de auth y datos, con el seed reversible sin tocar DDL.
- **Sí:** credenciales demo `staff@guarderia-demo.test` / `demo1234`, email confirmado. Débil a propósito: es guardería de práctica, y el hash nunca queda en el repo.
- **Pendiente de confirmar:** `full_name = 'Ana Demo'` para el usuario demo; es el único dato que quedó a criterio del asistente.
- **No:** tocar el mock `staff-demo` de `/login`. La app no lee Supabase; conectarla es otra spec.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El insert directo en `auth.users` deja columnas de tokens con `NULL` que el servicio de Auth no espera (doc oficial de troubleshooting). | El seed completa `confirmation_token`, `recovery_token`, `email_change_token_new` y `email_change` con `''`; la verificación consulta la fila completa. |
| Si el trigger falla, bloquea los signups (advertencia de la doc de "managing user data"). | Fail-fast con metadata obligatoria y verificación del camino feliz con el seed; el error de un cast fallido es descriptivo. |
| `pgcrypto` (`crypt`/`gen_salt`) no disponible. | Verificar con `select crypt('x', gen_salt('bf'))` antes de aplicar; en Supabase es nativo. |
| El MCP de Supabase no está autenticado y `apply_migration` falla. | Iniciar sesión desde `/mcps`; si sigue bloqueado, registrar bloqueo sin inventar resultados. |
| Alguien hace signup real con el email demo. | El email es único en `auth.users`: el signup con ese email fallará; es un correo `.test` reservado. |
| Borrar el usuario demo en el futuro borra su perfil en cascada. | `ON DELETE CASCADE` es el comportamiento del diccionario; hoy no hay FKs hacia `users` que dejen huérfanos. |
| El advisor marca `rls_enabled_no_policy` y se lee como fallo. | Documentado como informativo esperado, igual que en SPEC 06 y `AGENTS.md`. |
| El timestamp del archivo colisiona con otra migración. | Regla ya fijada en SPEC 06: un archivo por cambio lógico y, ante colisión, esperar y renombrar solo el nuevo. |

## Lo que **no** entra en esta spec

- Políticas RLS y autenticación en la app.
- Los enums `relationship_type`, `invitation_status`, `post_type` y `child_status`.
- Las tablas `rooms`, `children`, `parent_children`, `invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries` y `devices`.
- SDK, DAL, tipos TypeScript o cualquier cambio en `app/`.
- Login o gestión de usuarios desde las pantallas.

Cada uno de esos puntos, si llega, va en su propia spec.
