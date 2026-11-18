# SPEC 11 — Invitación de padre persistente en Supabase

> **Estado:** Implementado
> **Depende de:** SPEC 02, SPEC 08, SPEC 09, SPEC 10
> **Fecha:** 2026-11-17
> **Objetivo:** Que "Vincular otro padre" del perfil genere y persista una invitación real en la tabla `invitations` de Supabase, con código único de 5 caracteres y vencimiento a 7 días, mostrando el código en la confirmación del diálogo.

## Por qué existe esta spec

La SPEC 04 dejó el modal `app/ninos/vincular-padre.tsx` como maqueta: código fijo `7K4P9`, confirmación en pantalla sin persistencia. La SPEC 10 creó las tablas `parent_children` e `invitations` y dejó explícito que la app no las consume. Esta spec cierra ese hueco: la invitación se persiste de verdad. El "envío de correo" es simulado (no hay proveedor de email en el repo): el texto informativo del diálogo queda narrativo y la confirmación real es la fila en la base más el código visible para el staff.

## Alcance

**Dentro:**

- Migración `invitations_staff_rls`: políticas `select`, `insert` y `update` para `authenticated` sobre `public.invitations`, acotadas por guardería con el patrón `exists` del repo (`invitations → children → rooms → users.daycare_id`, `(select auth.uid())` envuelto).
- DAL: `crearInvitacion()` en `app/lib/dal.ts` con generación de código, diccionario de parentesco UI→DB, cancelación de pendientes duplicadas e insert; tipos `NuevaInvitacion` y `ResultadoInvitacion`.
- Server Action `invitarPadre` en `app/ninos/actions.ts`: `requireRole("staff")`, revalidación servidor de nombre/email, llamada a la DAL.
- Modal conectado: prop nueva `ninoId` (uuid del perfil), submit llama a la acción, estados `pending` y de error del insert, estado de éxito dentro del diálogo con el código generado y botón "Copiar código"; constante `CODIGO_INVITACION` eliminada.
- Diccionario fijo: `Mamá → mother`, `Papá → father`, `Tutor/a → guardian` (convención del esquema: lo persistido va en inglés).
- Código generado en servidor: 5 caracteres del alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sin `I/O/0/1`), con reintento ante `23505`.

**Fuera del alcance (para futuras specs):**

- Envío real de correo (Resend, SMTP o `inviteUserByEmail` de Supabase Auth).
- Canje del código: pantalla `/activar-cuenta` real, alta del padre en `auth.users`, fila en `parent_children`.
- Mostrar invitaciones pendientes en el perfil; reenviar, revocar o editar desde la UI.
- Abrir el diálogo desde el chip "VINCULAR" de `/ninos` (queda solo el perfil, como definió SPEC 04).
- Tipos TypeScript generados (`supabase gen types`).

## Modelo de datos

No crea tablas. Consume `invitations` (migrada en SPEC 10: `child_id`, `invited_by`, `full_name`, `email`, `relationship`, `code` UNIQUE, `status`, `expires_at`, `accepted_at`) y agrega políticas RLS, no columnas.

```ts
// app/lib/dal.ts
type Parentesco = "Mamá" | "Papá" | "Tutor/a"; // ya existe en el modal

const PARENTESCO_A_DB = {
  "Mamá": "mother",
  "Papá": "father",
  "Tutor/a": "guardian",
} as const;

type NuevaInvitacion = {
  childId: string; // uuid del perfil
  fullName: string;
  email: string;
  parentesco: Parentesco;
};

type ResultadoInvitacion =
  | { ok: true; codigo: string }
  | { ok: false };
```

Fila insertada: `child_id` del perfil, `invited_by` = `perfil.userId` de `requireRole("staff")`, `relationship` mapeado, `code` generado, `status: "pending"` (default de la columna), `expires_at = now() + interval '7 days'`.

Duplicados: antes del insert, `update invitations set status = 'cancelled' where child_id = … and email = … and status = 'pending'`. Requiere la política `for update` de la migración.

## Plan de implementación

1. Crear y aplicar `invitations_staff_rls` (select + insert with check + update using, mismo patrón `exists` que `rooms_children_staff_rls`). *Manual: `pg_policies` muestra las políticas y `get_advisors({ type: "security" })` no reporta errores nuevos.*
2. Agregar a la DAL `crearInvitacion()` con diccionario de parentesco, generación de código (node:crypto, reintento ×3 ante `23505`), cancelación de pendientes e insert. *Manual: `npx tsc --noEmit` sin errores; nadie la llama.*
3. Crear `invitarPadre` en `app/ninos/actions.ts` (requireRole, validación servidor espejo del cliente, llamada a la DAL). *Manual: tsc sin errores.*
4. Conectar el modal: prop `ninoId`, submit a la acción, estados pending/error/éxito con código y "Copiar código", eliminar `CODIGO_INVITACION`, pasar `ninoId={nino.id}` desde `app/ninos/[id]/page.tsx`. *Manual con Playwright: invitar a "Lucía Fernández" en el perfil de Mateo → el diálogo muestra el código; la fila existe en `invitations` con `status='pending'` y `expires_at` a 7 días.*
5. Verificación final: `npx tsc --noEmit` → `npm run lint` (sin hallazgos nuevos) → `npm run build` (sin errores nuevos) → advisors de seguridad → punta a punta con Playwright del reenvío (la anterior pasa a `cancelled`).

## Criterios de aceptación

- [ ] `list_migrations()` incluye `invitations_staff_rls` y `pg_policies` muestra políticas `select`, `insert` y `update` sobre `public.invitations` para `authenticated`.
- [ ] Con sesión staff, "Enviar invitación" inserta una fila con `status='pending'`, `relationship` en inglés, `code` de 5 caracteres sin `I/O/0/1`, `expires_at ≈ created_at + 7 días` e `invited_by` = el staff autenticado.
- [ ] Tras enviar, el diálogo muestra un estado de éxito con el código generado y "Copiar código" pone el código en el portapapeles con confirmación visible.
- [ ] El botón muestra estado pendiente mientras guarda; si el insert falla, el diálogo muestra "No se pudo enviar la invitación. Intentalo de nuevo.", no se cierra y conserva los datos.
- [ ] Reenviar al mismo email y niño deja la invitación anterior con `status='cancelled'` y solo la nueva en `pending`.
- [ ] La validación local de nombre y email sigue igual que hoy y no llama a la acción con datos inválidos.
- [ ] Sin sesión o con rol familia, `invitarPadre` no inserta (falla cerrada por `requireRole`).
- [ ] La constante `CODIGO_INVITACION = "7K4P9"` ya no existe en el código.
- [ ] El perfil no cambia visualmente: "PADRES VINCULADOS" sigue mostrando solo padres canjeados.
- [ ] `npx tsc --noEmit` sin errores; `npm run lint` sin hallazgos en archivos de esta spec; `npm run build` sin errores nuevos respecto a `AGENTS.md`.

## Decisiones

- **Sí:** solo persistir, correo simulado. No hay proveedor de email ni secrets en el repo; la DAL es la única vía de datos. Decisión de la persona.
- **Sí:** canje del código en spec aparte. El flujo de familias (activar-cuenta + auth + `parent_children`) es suficientemente grande.
- **Sí:** cancelar y crear nueva ante duplicado. Elección de la persona; obligó a incluir la política `update` en la migración (detectado en diseño).
- **Sí:** código de 5 caracteres, alfabeto sin ambiguos, generado en el servidor. La UI no puede garantizar unicidad; `code` ya es UNIQUE; Context7 confirma que `PostgrestError.code` es estable y `23505` identifica la violación de UNIQUE (guía oficial de errores de supabase-js), base del reintento.
- **Sí:** éxito con código dentro del diálogo y botón de copia. El staff necesita compartir el código sin correo real. Decisión de la persona.
- **Sí:** políticas por guardería con `exists` y `(select auth.uid())` envuelto. Patrón del repo y recomendación de la doc de Supabase (initPlan), validada con Context7.
- **Sí:** `invited_by` desde el perfil de `requireRole`, nunca del formulario.
- **Sí:** insert sin `.select()` (RETURNING): la acción ya conoce el código que generó y se evita depender del returning bajo RLS.
- **No:** correo real, canje, pendientes visibles, chip del listado, revocar/reenviar desde UI, tipos generados.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El `update` de cancelación queda bloqueado por RLS si falta la política | La migración incluye `for update using`; el criterio del reenvío lo verifica punta a punta |
| Colisión de código (`23505`) | Reintento ×3 con código nuevo; 32⁵ ≈ 33,5M combinaciones lo hace improbable |
| MCP de Supabase sin autenticar impide aplicar la migración | Iniciar sesión desde `/mcps`; si persiste, registrar bloqueo sin inventar resultados |
| `relationship` con valor fuera del enum | Diccionario fijo en la DAL; el enum de Postgres rechazaría cualquier otro valor |

## Lo que **no** entra en esta spec

Envío real de correo, canje del código, activación de cuentas de familia, filas en `parent_children`, invitaciones pendientes visibles en el perfil, revocar/reenviar desde la UI, abrir el diálogo desde `/ninos`.

Cada uno de esos puntos, si llega, va en su propia spec.
