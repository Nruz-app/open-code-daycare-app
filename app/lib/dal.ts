import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  decodeSession,
  SESSION_COOKIE,
  type Session,
  type UserRole,
} from "@/app/lib/session";
import { HOME_BY_ROLE } from "@/app/lib/routes";

/**
 * Data Access Layer.
 *
 * Esta es la protección REAL: todo acceso a datos debe pasar por aquí.
 * `proxy.ts` solo hace la comprobación optimista de la cookie.
 */

/** Lee la sesión actual sin redirigir (puede devolver `null`). */
export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return decodeSession(token);
});

/** Exige sesión válida; redirige a /login si no la hay. */
export const verifySession = cache(async (): Promise<Session> => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
});

/** Exige sesión válida y un rol concreto. */
export async function requireRole(role: UserRole): Promise<Session> {
  const session = await verifySession();

  if (session.role !== role) {
    redirect(HOME_BY_ROLE[session.role]);
  }

  return session;
}
