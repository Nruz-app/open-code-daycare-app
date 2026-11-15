import { cache } from "react";
import { redirect } from "next/navigation";

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
