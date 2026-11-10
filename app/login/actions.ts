"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { HOME_BY_ROLE, STAFF_ONLY, matches } from "@/app/lib/routes";
import {
  createSession,
  encodeSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/app/lib/session";

/**
 * Devuelve el `next` recibido solo si es una ruta interna del personal.
 * Cualquier otro valor (externo, protocol-relative o ajeno a STAFF_ONLY)
 * cae al home del rol para evitar un open redirect.
 */
function destinoSeguro(raw: FormDataEntryValue | null): string {
  if (
    typeof raw !== "string" ||
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.includes("\\")
  ) {
    return HOME_BY_ROLE.staff;
  }

  const url = new URL(raw, "http://interno.invalid");

  return matches(url.pathname, STAFF_ONLY)
    ? `${url.pathname}${url.search}`
    : HOME_BY_ROLE.staff;
}

/**
 * Acceso de demostración: crea la sesión de Caro (staff) sin contraseña.
 * Cuando exista autenticación real, esta acción se sustituye por la del login.
 */
export async function loginAsStaff(formData: FormData) {
  const session = createSession("staff-demo", "staff");

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(session), sessionCookieOptions());

  redirect(destinoSeguro(formData.get("next")));
}
