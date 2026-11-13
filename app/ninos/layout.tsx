import type { ReactNode } from "react";

import { NuevaPublicacionProvider } from "@/app/components/nueva-publicacion-provider";

/**
 * Las pantallas de niños comparten el diálogo de nueva publicación con el feed,
 * de modo que el botón de la sidebar abre el modal en lugar de ser un enlace
 * muerto.
 */
export default function NinosLayout({ children }: { children: ReactNode }) {
  return <NuevaPublicacionProvider>{children}</NuevaPublicacionProvider>;
}
