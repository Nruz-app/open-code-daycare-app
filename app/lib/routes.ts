import type { UserRole } from "@/app/lib/session";

/**
 * Configuración de rutas de la app.
 * Sin dependencias de servidor: se puede importar desde `proxy.ts` y desde la DAL.
 */

/** Rutas accesibles sin sesión. */
export const PUBLIC_ROUTES = [
  "/login",
  "/activar-cuenta",
  "/vincular-padre", // enlace de invitación para familias
];

/** Página de inicio de cada rol. */
export const HOME_BY_ROLE: Record<UserRole, string> = {
  staff: "/feed",
  family: "/familia-feed",
};

/** Rutas exclusivas del personal del centro. */
export const STAFF_ONLY = [
  "/feed",
  "/ninos",
  "/agregar-nino",
  "/resumen-dia",
  "/avisos",
  "/crear-publicacion",
];

/** Rutas exclusivas del portal de familias. */
export const FAMILY_ONLY = ["/familia-feed", "/familia-cuenta"];

/** Coincidencia exacta o por prefijo de segmento (`/ninos/123` sí, `/ninos-x` no). */
export function matches(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
