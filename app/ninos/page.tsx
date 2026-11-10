import { Suspense } from "react";
import { connection } from "next/server";

import { AppSidebar } from "@/app/components/app-sidebar";
import { requireRole } from "@/app/lib/dal";
import { ninos, type AvatarTone, type ChipNino } from "@/app/lib/mock-ninos";

const avatarToneClass: Record<AvatarTone, string> = {
  sky: "bg-[#a9d9e8] text-[#1f7a93]",
  pink: "bg-[#f4b8cc] text-[#c44a7a]",
  mint: "bg-[#b9dec4] text-[#3e8b62]",
  sand: "bg-[#f4dc8e] text-[#9a7b1e]",
  lilac: "bg-[#c9b6e8] text-[#7b5fc0]",
};

const chipToneClass: Record<ChipNino["tone"], string> = {
  alergia: "bg-[#fbd8cc] text-[#d9684a]",
  pendiente: "bg-[#f9d2de] text-[#c56486]",
};

/** "sin padres vinculados", "1 padre vinculado", "2 padres vinculados". */
function metaPadres(cantidad: number): string {
  if (cantidad === 0) {
    return "sin padres vinculados";
  }

  return cantidad === 1 ? "1 padre vinculado" : `${cantidad} padres vinculados`;
}

async function NinosContent() {
  await connection();
  await requireRole("staff");

  return (
    <div className="mx-auto w-full max-w-[880px] px-5 pb-16 pt-6 md:px-10 md:pb-20 md:pt-[34px]">
      <header className="mb-[22px] flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-coral-deep">
            GESTIÓN
          </div>
          <h1 className="font-display text-[30px] font-semibold text-ink">
            Niños
          </h1>
        </div>

        <a
          href="#"
          className="flex w-full items-center justify-center gap-2 rounded-chip bg-linear-to-b from-[#f4977e] to-coral px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-cta md:w-auto"
        >
          <svg
            aria-hidden="true"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Agregar niño
        </a>
      </header>

      <div className="mb-[22px] flex items-center gap-[11px] rounded-chip border border-line bg-surface px-4 py-3">
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#B0A290"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          aria-label="Buscar niño"
          placeholder="Buscar niño…"
          className="flex-1 border-none bg-transparent text-[15px] text-ink outline-none placeholder:text-[#b6a99b]"
        />
      </div>

      <div className="mb-3.5 flex items-center gap-3">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink">
          SALA SOLES
        </span>
        <span className="text-[13px] text-ink-soft">{ninos.length} niños</span>
        <span className="h-px flex-1 bg-[#e7dac8]" />
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {ninos.map((nino) => (
          <a
            key={nino.id}
            href={`/ninos/${nino.id}`}
            className="flex min-w-0 items-center gap-3.5 rounded-box border border-line bg-surface p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-[#f2a78e]"
          >
            <div
              className={`flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold ${avatarToneClass[nino.avatarTone]}`}
            >
              {nino.inicial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[16px] font-semibold text-ink">
                {nino.nombre}
              </div>
              <div className="text-[13px] text-ink-soft">
                {nino.edad} · {metaPadres(nino.padresVinculados)}
              </div>
            </div>
            {nino.chip ? (
              <span
                className={`flex-none rounded-full px-[9px] py-[5px] text-[11px] font-extrabold ${chipToneClass[nino.chip.tone]}`}
              >
                {nino.chip.label}
              </span>
            ) : (
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#CBB89F"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-none"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function NinosPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      <AppSidebar active="ninos" />
      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">
        <Suspense fallback={null}>
          <NinosContent />
        </Suspense>
      </main>
    </div>
  );
}
