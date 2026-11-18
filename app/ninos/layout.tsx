import type { ReactNode } from "react";
import { Suspense } from "react";

import { NuevaPublicacionProvider } from "@/app/components/nueva-publicacion-provider";

/**
 * Las pantallas de niños comparten el diálogo de nueva publicación con el feed,
 * de modo que el botón de la sidebar abre el modal en lugar de ser un enlace
 * muerto.
 *
 * El provider lee los destinatarios de la base (cookies), y con
 * `cacheComponents` esa lectura debe ir dentro de `<Suspense>`: mientras
 * cargan, el fondo crema evita el flash en blanco.
 */
export default function NinosLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <NuevaPublicacionProvider>{children}</NuevaPublicacionProvider>
    </Suspense>
  );
}
