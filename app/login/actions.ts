"use server";

import { redirect } from "next/navigation";

import {
  FAMILY_ONLY,
  HOME_BY_ROLE,
  STAFF_ONLY,
  matches,
  type UserRole,
} from "@/app/lib/routes";
import { mapearRol } from "@/app/lib/dal";
import { createClient } from "@/utils/supabase/server";

/** Estado del formulario de login para `useActionState`. */
export type LoginEstado = { error: string } | null;

/**
 * Devuelve el `next` recibido solo si es una ruta interna del rol de la
 * persona autenticada. Cualquier otro valor (externo, protocol-relative o
 * ajeno a las rutas del rol) cae al home del rol para evitar un open redirect.
 */
function destinoSeguro(
  raw: FormDataEntryValue | null,
  rol: UserRole,
): string {
  if (
    typeof raw !== "string" ||
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.includes("\\")
  ) {
    return HOME_BY_ROLE[rol];
  }

  const url = new URL(raw, "http://interno.invalid");
  const rutasDelRol = rol === "family" ? FAMILY_ONLY : STAFF_ONLY;

  return matches(url.pathname, rutasDelRol)
    ? `${url.pathname}${url.search}`
    : HOME_BY_ROLE[rol];
}

/**
 * Acceso real con Supabase Auth: email y contraseña por persona.
 * El rol viene del perfil en `users` (RLS `users_select_own`).
 */
export async function login(
  _estadoAnterior: LoginEstado,
  formData: FormData,
): Promise<LoginEstado> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresá tu email y tu contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Email o contraseña incorrectos." };
  }

  // Perfil real; sin fila de perfil tratamos el acceso como inválido.
  const { data: perfil } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!perfil) {
    return { error: "Email o contraseña incorrectos." };
  }

  redirect(destinoSeguro(formData.get("next"), mapearRol(perfil.role)));
}

/**
 * Cierra la sesión: revoca el access token y borra las cookies `sb-*`.
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/login");
}
