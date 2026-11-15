import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  FAMILY_ONLY,
  HOME_BY_ROLE,
  PUBLIC_ROUTES,
  STAFF_ONLY,
  matches,
  type UserRole,
} from "@/app/lib/routes";
import { updateSession } from "@/utils/supabase/proxy";

/**
 * En Next.js 16 `middleware.ts` está deprecado: el archivo se llama `proxy.ts`.
 * Corre en runtime Node.js por defecto.
 *
 * Modelo "deny by default": todo lo que no esté en PUBLIC_ROUTES requiere sesión.
 * Aquí solo se hacen comprobaciones optimistas (claims del JWT de sesión).
 * La autorización real vive en `app/lib/dal.ts`.
 */

/** Rol optimista leído de los claims; la DAL es quien decide con el perfil real. */
function rolOptimista(claims: unknown): UserRole | null {
  const role =
    (
      claims as { user_metadata?: { role?: string } } | null
    )?.user_metadata?.role?.toLowerCase();

  if (role === "parent") {
    return "family";
  }

  if (role === "staff" || role === "admin") {
    return "staff";
  }

  return null;
}

/**
 * Redirige conservando las cookies que el refresh de sesión de Supabase
 * escribió en la respuesta original.
 */
function redirigir(destino: URL, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(destino);

  for (const cookie of response.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }

  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { response, claims } = await updateSession(request);
  const rol = rolOptimista(claims);
  const isPublicRoute = matches(pathname, PUBLIC_ROUTES);

  // 0. La raíz no tiene pantalla propia: lleva al home del rol o al acceso.
  if (pathname === "/") {
    return redirigir(
      new URL(rol ? HOME_BY_ROLE[rol] : "/login", request.nextUrl),
      response,
    );
  }

  // 1. Sin sesión en ruta protegida -> /login recordando el destino
  if (!rol && !isPublicRoute) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("next", `${pathname}${search}`);

    return redirigir(loginUrl, response);
  }

  // 2. Con sesión en pantalla de acceso -> a su home según rol
  if (rol && isPublicRoute && pathname !== "/") {
    return redirigir(new URL(HOME_BY_ROLE[rol], request.nextUrl), response);
  }

  // 3. Separación de áreas por rol (optimista; la DAL repite la comprobación)
  if (rol) {
    if (matches(pathname, STAFF_ONLY) && rol !== "staff") {
      return redirigir(new URL(HOME_BY_ROLE.family, request.nextUrl), response);
    }

    if (matches(pathname, FAMILY_ONLY) && rol !== "family") {
      return redirigir(new URL(HOME_BY_ROLE.staff, request.nextUrl), response);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Excluye API, assets de Next, favicon y archivos estáticos
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff|woff2|ttf|otf)$).*)",
  ],
};
