import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh de sesión de Supabase para el `proxy.ts` de la raíz.
 *
 * El nombre del módulo iguala la guía vigente de Supabase para Next.js:
 * el archivo de convención de Next 16 es `proxy.ts` (`middleware.ts` está
 * deprecado). Aquí dentro el nombre es libre; importa que la raíz importe
 * `updateSession` desde este módulo.
 *
 * `getClaims()` debe correr temprano y sin código entre medio: inicializa
 * la sesión y permite que un refresh de tokens escriba sus cookies antes
 * de que la respuesta se envíe.
 */
export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  /** Claims del JWT de sesión, o `null` sin sesión. Solo para comprobación optimista. */
  claims: unknown;
}> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: no poner código entre createServerClient y getClaims.
  const { data } = await supabase.auth.getClaims();

  return { response: supabaseResponse, claims: data?.claims ?? null };
}
