import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { decodeSession, SESSION_COOKIE } from "@/app/lib/session";
import {
  FAMILY_ONLY,
  HOME_BY_ROLE,
  PUBLIC_ROUTES,
  STAFF_ONLY,
  matches,
} from "@/app/lib/routes";

/**
 * En Next.js 16 `middleware.ts` está deprecado: el archivo se llama `proxy.ts`.
 * Corre en runtime Node.js por defecto.
 *
 * Modelo "deny by default": todo lo que no esté en PUBLIC_ROUTES requiere sesión.
 * Aquí solo se hacen comprobaciones optimistas (leer la cookie firmada).
 * La autorización real vive en `app/lib/dal.ts`.
 */

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublicRoute = matches(pathname, PUBLIC_ROUTES);

  // 0. La raíz no tiene pantalla propia: lleva al home del rol o al acceso.
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(session ? HOME_BY_ROLE[session.role] : "/login", request.nextUrl),
    );
  }

  // 1. Sin sesión en ruta protegida -> /login recordando el destino
  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("next", `${pathname}${search}`);

    return NextResponse.redirect(loginUrl);
  }

  // 2. Con sesión en pantalla de acceso -> a su home según rol
  if (session && isPublicRoute && pathname !== "/") {
    return NextResponse.redirect(
      new URL(HOME_BY_ROLE[session.role], request.nextUrl),
    );
  }

  // 3. Separación de áreas por rol
  if (session) {
    if (matches(pathname, STAFF_ONLY) && session.role !== "staff") {
      return NextResponse.redirect(
        new URL(HOME_BY_ROLE.family, request.nextUrl),
      );
    }

    if (matches(pathname, FAMILY_ONLY) && session.role !== "family") {
      return NextResponse.redirect(
        new URL(HOME_BY_ROLE.staff, request.nextUrl),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Excluye API, assets de Next, favicon y archivos estáticos
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff|woff2|ttf|otf)$).*)",
  ],
};
