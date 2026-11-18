import type { ReactNode } from "react";
import { connection } from "next/server";

import { CrearPublicacionProvider } from "@/app/feed/crear-publicacion";
import { getNinos } from "@/app/lib/dal";

/**
 * Proveedor servidor del diálogo de nueva publicación.
 *
 * Calcula los destinatarios (los tres primeros niños de la base, vía DAL) y
 * envuelve el layout de las pantallas del staff para que el botón de la
 * sidebar abra el mismo `<dialog>` en todas ellas. Al ser componente
 * servidor, los niños completos no viajan al cliente: solo el resumen que
 * necesita el formulario. `connection()` marca el render como dinámico
 * antes de tocar datos: sin él, el prerender parcial choca con `Date.now()`
 * del cálculo de edad (patrón igual en `NinosContent` y `FeedContent`).
 */
export async function NuevaPublicacionProvider({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  const ninos = await getNinos();
  const destinatarios = ninos.slice(0, 3).map((nino) => ({
    id: nino.id,
    nombre: nino.nombre.split(" ")[0],
    inicial: nino.inicial,
    avatarTone: nino.avatarTone,
  }));

  return (
    <CrearPublicacionProvider destinatarios={destinatarios}>
      {children}
    </CrearPublicacionProvider>
  );
}
