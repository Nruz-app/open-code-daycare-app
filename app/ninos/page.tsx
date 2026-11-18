import { Suspense } from "react";
import { connection } from "next/server";

import { AppSidebar } from "@/app/components/app-sidebar";
import { getDaycares, getNinos, getSalas, requireRole } from "@/app/lib/dal";
import { GestionNinos } from "@/app/ninos/gestion-ninos";

async function NinosContent() {
  await connection();
  await requireRole("staff");
  const [guarderias, ninos, salas] = await Promise.all([
    getDaycares(),
    getNinos(),
    getSalas(),
  ]);

  return <GestionNinos ninos={ninos} guarderias={guarderias} salas={salas} />;
}

export default function NinosPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      {/* La sidebar lee el perfil (cookies): lleva su propio boundary. */}
      <Suspense fallback={null}>
        <AppSidebar active="ninos" nuevaPublicacion />
      </Suspense>
      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">
        <Suspense fallback={null}>
          <NinosContent />
        </Suspense>
      </main>
    </div>
  );
}
