import type { ReactNode } from "react";

import { CrearPublicacionProvider } from "@/app/feed/crear-publicacion";
import { ninos } from "@/app/lib/mock-ninos";

/**
 * Proveedor servidor del diálogo de nueva publicación.
 *
 * Calcula los destinatarios (los tres primeros niños) y envuelve el layout de
 * las pantallas del staff para que el botón de la sidebar abra el mismo
 * `<dialog>` en todas ellas. Al ser componente servidor, los niños completos no
 * viajan al cliente: solo el resumen que necesita el formulario.
 */
export function NuevaPublicacionProvider({
  children,
}: {
  children: ReactNode;
}) {
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
