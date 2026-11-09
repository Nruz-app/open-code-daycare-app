"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { HOME_BY_ROLE } from "@/app/lib/routes";
import {
  createSession,
  encodeSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/app/lib/session";

/**
 * Acceso de demostración: crea la sesión de Caro (staff) sin contraseña.
 * Cuando exista autenticación real, esta acción se sustituye por la del login.
 */
export async function loginAsStaff() {
  const session = createSession("staff-demo", "staff");

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(session), sessionCookieOptions());

  redirect(HOME_BY_ROLE.staff);
}
