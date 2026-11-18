import { randomInt } from "node:crypto";

import { cache } from "react";
import { redirect } from "next/navigation";

import { calcularEdadTexto } from "@/app/lib/fecha-nacimiento";
import { HOME_BY_ROLE, type UserRole } from "@/app/lib/routes";
import { createClient } from "@/utils/supabase/server";

/**
 * Data Access Layer.
 *
 * Esta es la protección REAL: todo acceso a datos debe pasar por aquí.
 * `proxy.ts` solo hace la comprobación optimista de los claims.
 * La sesión vive en las cookies de Supabase (`sb-*`), no en una cookie propia.
 */

/** Perfil de la persona autenticada, leído de la tabla `users`. */
export type Perfil = {
  userId: string;
  role: UserRole;
  fullName: string;
  guarderia: string | null;
};

/** Mapea el enum `user_role` de la DB al rol de la app. */
export function mapearRol(rolDb: string): UserRole {
  // `parent` es la persona del portal de familias; `admin` es personal.
  return rolDb === "parent" ? "family" : "staff";
}

/** Lee el perfil autenticado sin redirigir (puede devolver `null`). */
export const getSession = cache(async (): Promise<Perfil | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // `getUser()` es el veredicto autoritativo: verifica el token con el
  // servidor de auth (a diferencia de `getClaims`/`getSession`, que solo
  // leen la cookie). Con la RLS `users_select_own`, cada persona lee su fila.
  const { data: fila } = await supabase
    .from("users")
    .select("role, full_name, daycares(name)")
    .eq("id", user.id)
    .single();

  if (!fila) {
    // Sesión de auth sin fila de perfil: fallamos cerrado.
    return null;
  }

  // Sin tipos generados de la DB, la fila llega mal tipada: la describimos aquí.
  const perfil = fila as unknown as {
    role: string;
    full_name: string;
    daycares: { name: string } | { name: string }[] | null;
  };

  // El embed llega como objeto en runtime (FK a uno) y como lista en tipos:
  // cubrimos ambas formas.
  const guarderia = Array.isArray(perfil.daycares)
    ? (perfil.daycares[0]?.name ?? null)
    : (perfil.daycares?.name ?? null);

  return {
    userId: user.id,
    role: mapearRol(perfil.role),
    fullName: perfil.full_name,
    guarderia,
  };
});

/** Exige sesión válida; redirige a /login si no la hay. */
export const verifySession = cache(async (): Promise<Perfil> => {
  const perfil = await getSession();

  if (!perfil) {
    redirect("/login");
  }

  return perfil;
});

/** Exige sesión válida y un rol concreto. */
export async function requireRole(role: UserRole): Promise<Perfil> {
  const perfil = await verifySession();

  if (perfil.role !== role) {
    redirect(HOME_BY_ROLE[perfil.role]);
  }

  return perfil;
}

/** Guardería de la tabla `daycares` (primer dato real de Supabase). */
export type Guarderia = { id: string; name: string; createdAt: string };

/** Lee las guarderías vía DAL, la única vía de datos reales. Devuelve [] si la consulta falla. */
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

/** Sala de la tabla `rooms` de la guardería del staff autenticado. */
export type Sala = { id: string; name: string };

/** Salas visibles para la sesión (la RLS `rooms_staff_select` filtra por guardería). */
export async function getSalas(): Promise<Sala[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("rooms").select("id, name").order("name");

  if (error) return [];
  return (data ?? []).map((row) => ({ id: row.id, name: row.name }));
}

/**
 * Niños: tipos de la UI para `/ninos` y `/ninos/[id]`.
 *
 * Vivían en `app/lib/mock-ninos.ts`; desde la persistencia real el listado y
 * el perfil se mapean desde `children` (+ `rooms` y el conteo de
 * `parent_children`), así que los tipos viven aquí junto a su mapeo.
 */
export type AvatarTone = "sky" | "pink" | "mint" | "sand" | "lilac";

export type ChipNino = {
  /** "MANÍ" | "LACTOSA" | "VINCULAR" */
  label: string;
  tone: "alergia" | "pendiente";
};

export type Padre = {
  id: string;
  nombre: string;
  inicial: string;
  /** "Mamá" | "Papá" | "Tutor" */
  vinculo: string;
  estado: "activa" | "pendiente";
  avatarTone: AvatarTone;
};

export type Nino = {
  /** uuid de `children` */
  id: string;
  nombre: string;
  inicial: string;
  /** "3 años": calculado de `birth_date` al mapear. */
  edad: string;
  sala: string;
  padresVinculados: number;
  avatarTone: AvatarTone;
  chip?: ChipNino;
  nacimiento: string;
  ingreso: string;
  notas?: { titulo: string; texto: string };
  padres: Padre[];
};

/** Abreviaturas de mes para los campos `nacimiento` e `ingreso`. */
const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

/**
 * Alergias de la UI al DB: `allergy_tags` guarda inglés (convención del
 * diccionario); el formulario recibe texto libre en español. La clave va sin
 * acentos para que "maní" y "mani" mapeen igual; lo desconocido se guarda
 * como slug minúsculas sin acentos.
 */
const ALERGIAS_UI_DB: Record<string, string> = {
  mani: "peanut",
  lactosa: "lactose",
  gluten: "gluten",
  huevo: "egg",
  "frutos secos": "tree nuts",
};

/** Alergias del DB a la UI: los códigos del diccionario se traducen a español. */
const ALERGIAS_DB_UI: Record<string, string> = {
  peanut: "MANÍ",
  lactose: "LACTOSA",
  gluten: "GLUTEN",
  egg: "HUEVO",
  "tree nuts": "FRUTOS SECOS",
};

/** "Maní" → "peanut"; desconocida → slug minúsculas sin acentos. */
export function alergiaAdB(etiqueta: string): string {
  const clave = etiqueta
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return ALERGIAS_UI_DB[clave] ?? clave;
}

/** "peanut" → "MANÍ"; etiqueta sin traducción → tal cual en mayúsculas. */
function alergiaAui(tag: string): string {
  return ALERGIAS_DB_UI[tag] ?? tag.toUpperCase();
}

/**
 * Tonos del avatar en orden; el índice sale de un hash del nombre, así que la
 * asignación es determinista y estable sin guardar estado en la DB.
 */
function tonoDeAvatar(nombre: string): AvatarTone {
  const tonos: AvatarTone[] = ["sky", "pink", "mint", "sand", "lilac"];

  let hash = 0;

  for (const letra of nombre) {
    hash = (hash * 31 + letra.codePointAt(0)!) % 997;
  }

  return tonos[hash % tonos.length]!;
}

/** "2022-03-12" → "12/03/2022", para reutilizar `calcularEdadTexto`. */
function fechaIsoAformulario(iso: string): string {
  const [anio, mes, dia] = iso.split("-");

  return `${dia}/${mes}/${anio}`;
}

/** "2022-03-12" → "12 mar 2022", el formato visible de `nacimiento`. */
function fechaIsoLegible(iso: string): string {
  const [anio, mes, dia] = iso.split("-");

  return `${dia} ${MESES[Number(mes) - 1]} ${anio}`;
}

/** "2025-02-01" → "feb 2025", el formato visible de `ingreso`. */
function mesAnioLegible(iso: string): string {
  const [anio, mes] = iso.split("-");

  return `${MESES[Number(mes) - 1]} ${anio}`;
}

/** Fila cruda de la consulta de niños, mal tipada sin tipos generados. */
type FilaNino = {
  id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  medical_notes: string | null;
  allergy_tags: string[] | null;
  rooms: { name: string } | { name: string }[] | null;
  parent_children:
    | { count: number }[]
    | { users: { full_name: string } | null; relationship: string }[]
    | null;
};

const SELECT_NINOS =
  "id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, status, rooms(name), parent_children(relationship, users(full_name))";

/** Traduce `relationship` de la DB al vínculo visible. */
function vinculoLegible(relationship: string): string {
  return relationship === "father"
    ? "Papá"
    : relationship === "mother"
      ? "Mamá"
      : "Tutor";
}

/** Mapea una fila de `children` al `Nino` de la UI. */
function mapearNino(fila: FilaNino): Nino {
  const sala = Array.isArray(fila.rooms)
    ? (fila.rooms[0]?.name ?? "")
    : (fila.rooms?.name ?? "");

  const etiquetas = fila.parent_children ?? [];
  const padres: Padre[] = (
    etiquetas as { users: { full_name: string } | null; relationship: string }[]
  ).map((vinculo) => {
    const nombre = vinculo.users?.full_name ?? "Padre";

    return {
      id: nombre.toLowerCase().replace(/\s+/g, "-"),
      nombre,
      inicial: nombre.charAt(0).toUpperCase(),
      vinculo: vinculoLegible(vinculo.relationship),
      estado: "activa" as const,
      avatarTone: tonoDeAvatar(nombre),
    };
  });

  // Mismo criterio que las tarjetas del mock: la primera alergia es chip;
  // sin alergias, el chip invita a vincular padres (Valentina Soto).
  const primeraAlergia = (fila.allergy_tags ?? [])[0];
  const chip: ChipNino | undefined = primeraAlergia
    ? { label: alergiaAui(primeraAlergia), tone: "alergia" }
    : { label: "VINCULAR", tone: "pendiente" };

  const textoNotas = fila.medical_notes?.trim();

  return {
    id: fila.id,
    nombre: fila.full_name,
    inicial: fila.full_name.charAt(0).toUpperCase(),
    edad: calcularEdadTexto(fechaIsoAformulario(fila.birth_date)),
    sala,
    padresVinculados: padres.length,
    avatarTone: tonoDeAvatar(fila.full_name),
    chip,
    nacimiento: fechaIsoLegible(fila.birth_date),
    ingreso: mesAnioLegible(fila.enrolled_at),
    ...(textoNotas
      ? {
          notas: {
            titulo: primeraAlergia ? "Alergias y notas" : "Notas médicas",
            texto: textoNotas,
          },
        }
      : {}),
    padres,
  };
}

/**
 * Niños activos de la guardería del staff autenticado (la RLS
 * `children_staff_select` filtra por guardería). Devuelve [] si la consulta
 * falla, igual que `getDaycares`.
 */
export async function getNinos(): Promise<Nino[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .select(SELECT_NINOS)
    .eq("status", "active")
    .order("full_name");

  if (error) return [];
  return (data ?? []).map((row) => mapearNino(row as unknown as FilaNino));
}

/** El niño con ese uuid, o `null` si no existe o la consulta falla. */
export async function getNinoPorId(id: string): Promise<Nino | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .select(SELECT_NINOS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapearNino(data as unknown as FilaNino);
}

/** Datos del formulario de alta, ya validados en `app/ninos/actions.ts`. */
export type DatosAlta = {
  nombre: string;
  fecha: string; // dd/mm/aaaa ya validada
  salaId: string;
  alergias: string[];
  notas?: string;
};

export type ResultadoAlta = { ok: true } | { ok: false };

/** Inserta el niño en `children`. Falla cerrado: la acción le dice al usuario. */
export async function crearNino(datos: DatosAlta): Promise<ResultadoAlta> {
  const supabase = await createClient();

  // dd/mm/aaaa → ISO para la columna `date`.
  const [dia, mes, anio] = datos.fecha.split("/");
  const hoy = new Date();
  const hoyIso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

  const { error } = await supabase.from("children").insert({
    room_id: datos.salaId,
    full_name: datos.nombre.trim(),
    birth_date: `${anio}-${mes}-${dia}`,
    enrolled_at: hoyIso,
    medical_notes: datos.notas?.trim() || null,
    allergy_tags: datos.alergias.map(alergiaAdB),
    status: "active",
  });

  if (error) {
    return { ok: false };
  }

  return { ok: true };
}

/**
 * Parentescos del formulario de invitación y su traducción al enum
 * `relationship_type` de la DB: convención del diccionario, lo persistido va
 * en inglés. El modal importa este tipo para no duplicar la lista.
 */
export type Parentesco = "Mamá" | "Papá" | "Tutor/a";

const PARENTESCOS_UI_DB: Record<Parentesco, string> = {
  "Mamá": "mother",
  "Papá": "father",
  "Tutor/a": "guardian",
};

/** Datos del formulario de invitación, ya validados en `app/ninos/actions.ts`. */
export type NuevaInvitacion = {
  /** uuid del niño, del perfil `/ninos/[id]`. */
  childId: string;
  fullName: string;
  email: string;
  parentesco: Parentesco;
};

export type ResultadoInvitacion =
  | { ok: true; codigo: string }
  | { ok: false };

/** 32 caracteres sin I/O/0/1: el código se lee y dicta sin ambigüedad. */
const CODIGO_ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Código de 5 caracteres con azar criptográfico, ej. "K4P9A". */
function generarCodigoInvitacion(): string {
  let codigo = "";

  for (let i = 0; i < 5; i++) {
    codigo += CODIGO_ALFABETO[randomInt(CODIGO_ALFABETO.length)];
  }

  return codigo;
}

const VENCIMIENTO_INVITACION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Persiste la invitación en `invitations` (SPEC 11). El "envío de correo" es
 * simulado: la confirmación real es esta fila y el código que devuelve la
 * acción al modal.
 *
 * Cancela antes las invitaciones pendientes del mismo email y niño (decisión
 * "cancelar y crear nueva"; la política `invitations_staff_update` habilita
 * el update). El email se guarda en minúsculas para que el match de
 * duplicados no dependa de cómo lo escribió el staff. El código es UNIQUE:
 * ante una colisión (`23505`) reintenta con uno nuevo, hasta 3 veces.
 */
export async function crearInvitacion(
  datos: NuevaInvitacion,
): Promise<ResultadoInvitacion> {
  const supabase = await createClient();

  // `invited_by` sale del perfil autenticado, nunca del formulario. La acción
  // ya pasó por requireRole y getSession está cacheado por request.
  const perfil = await getSession();

  if (!perfil) {
    return { ok: false };
  }

  const email = datos.email.trim().toLowerCase();

  // Cancelar pendientes del mismo email y niño. Si la guardería del niño no
  // es la del staff, RLS bloquea y fallamos cerrado.
  const { error: errorCancelacion } = await supabase
    .from("invitations")
    .update({ status: "cancelled" })
    .eq("child_id", datos.childId)
    .eq("email", email)
    .eq("status", "pending");

  if (errorCancelacion) {
    return { ok: false };
  }

  const vence = new Date(
    Date.now() + VENCIMIENTO_INVITACION_MS,
  ).toISOString();

  for (let intento = 0; intento < 3; intento++) {
    const codigo = generarCodigoInvitacion();

    const { error } = await supabase.from("invitations").insert({
      child_id: datos.childId,
      invited_by: perfil.userId,
      full_name: datos.fullName.trim(),
      email,
      relationship: PARENTESCOS_UI_DB[datos.parentesco],
      code: codigo,
      status: "pending",
      expires_at: vence,
    });

    if (!error) {
      return { ok: true, codigo };
    }

    // Solo la colisión de código se reintenta; cualquier otro error (RLS,
    // FK inexistente) falla cerrado y la acción le avisa al usuario.
    if (error.code !== "23505") {
      return { ok: false };
    }
  }

  return { ok: false };
}
