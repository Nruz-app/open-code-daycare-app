import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { AppSidebar } from "@/app/components/app-sidebar";
import { requireRole } from "@/app/lib/dal";
import { getNino, type AvatarTone } from "@/app/lib/mock-ninos";
import { VincularPadre } from "@/app/ninos/vincular-padre";

/**
 * Ruta bloqueante a propósito: con `cacheComponents` hay que optar por no
 * prerenderizar para poder leer `connection()` y llamar a `notFound()` antes
 * del streaming. En desarrollo eso devuelve un 404 real; en producción el
 * shell parcial deja el 200 y Next añade `noindex`.
 */
export const instant = false;

const avatarToneClass: Record<AvatarTone, string> = {
  sky: "bg-[#a9d9e8] text-[#1f7a93]",
  pink: "bg-[#f4b8cc] text-[#c44a7a]",
  mint: "bg-[#b9dec4] text-[#3e8b62]",
  sand: "bg-[#f4dc8e] text-[#9a7b1e]",
  lilac: "bg-[#c9b6e8] text-[#7b5fc0]",
};

/** Los avatares de los padres van en blanco sobre el tono pastel. */
const padreAvatarClass: Record<AvatarTone, string> = {
  sky: "bg-[#a9c7e8]",
  pink: "bg-[#f4b8cc]",
  mint: "bg-[#b9dec4]",
  sand: "bg-[#f4dc8e]",
  lilac: "bg-[#c9b6e8]",
};

export default async function PerfilNinoPage({
  params,
}: PageProps<"/ninos/[id]">) {
  await connection();
  const { id } = await params;

  await requireRole("staff");

  const nino = getNino(id);

  if (!nino) {
    notFound();
  }

  const datos = [
    { label: "Fecha de nacimiento", value: nino.nacimiento },
    { label: "Sala", value: nino.sala },
    { label: "Ingreso", value: nino.ingreso },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      <AppSidebar active="ninos" />
      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">
        <div className="mx-auto w-full max-w-[820px] px-5 pb-16 pt-6 md:px-10 md:pb-20 md:pt-[34px]">
          <Link
            href="/ninos"
            className="mb-5 flex items-center gap-[7px] text-[14px] font-bold text-ink-muted"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Volver a Niños
          </Link>

          <div className="flex flex-wrap items-start gap-[26px]">
            <div className="flex w-full flex-col gap-[18px] md:w-auto md:min-w-[300px] md:flex-1">
              <div className="flex items-center gap-[18px]">
                <div
                  className={`flex h-[84px] w-[84px] flex-none items-center justify-center rounded-full font-display text-[34px] font-semibold ${avatarToneClass[nino.avatarTone]}`}
                >
                  {nino.inicial}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-display text-[28px] font-semibold text-ink">
                    {nino.nombre}
                  </h1>
                  <p className="mt-[3px] text-[15px] text-ink-muted">
                    {nino.edad} · Sala {nino.sala}
                  </p>
                </div>
                <a
                  href="#"
                  className="flex-none rounded-xl border-[1.5px] border-line bg-surface px-4 py-[9px] text-[14px] font-bold text-[#6e6359]"
                >
                  Editar
                </a>
              </div>

              {nino.notas ? (
                <div className="flex gap-3.5 rounded-2xl bg-[#fbdad6] px-[18px] py-4">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#f4a8a0]">
                    <svg
                      aria-hidden="true"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                      <path d="M12 9v4M12 17h.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="mb-0.5 text-[15px] font-extrabold text-[#c5413a]">
                      {nino.notas.titulo}
                    </div>
                    <div className="text-[14.5px] leading-[1.5] text-[#b25249]">
                      {nino.notas.texto}
                    </div>
                  </div>
                </div>
              ) : null}

              <dl className="overflow-hidden rounded-2xl border border-line bg-surface">
                {datos.map((dato, indice) => (
                  <div
                    key={dato.label}
                    className={`flex justify-between px-[18px] py-[15px] text-[14.5px] ${
                      indice < datos.length - 1 ? "border-b border-line-soft" : ""
                    }`}
                  >
                    <dt className="text-ink-muted">{dato.label}</dt>
                    <dd className="font-extrabold text-ink">{dato.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex w-full flex-col gap-3.5 md:w-[300px] md:flex-none">
              <a
                href="#"
                className="flex w-full items-center justify-center gap-[9px] rounded-chip bg-ink px-[13px] py-[13px] text-[15px] font-extrabold text-white"
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
                Resumen del día
              </a>

              <div className="rounded-2xl border border-line bg-surface px-[18px] py-4">
                <div className="mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-ink-label">
                  PADRES VINCULADOS
                </div>

                <div className="flex flex-col gap-3.5">
                  {nino.padres.map((padre) => (
                    <div key={padre.id} className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-[16px] font-semibold text-white ${padreAvatarClass[padre.avatarTone]}`}
                      >
                        {padre.inicial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14.5px] font-extrabold text-ink">
                          {padre.nombre}
                        </div>
                        <div className="text-[12.5px] text-ink-soft">
                          {padre.vinculo} ·{" "}
                          {padre.estado === "activa"
                            ? "activa"
                            : "invitación enviada"}
                        </div>
                      </div>
                      <span
                        className={`flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold ${
                          padre.estado === "activa"
                            ? "bg-mint-soft text-mint"
                            : "bg-[#f7e7a6] text-[#9a7b1e]"
                        }`}
                      >
                        {padre.estado === "activa" ? "ACTIVA" : "PENDIENTE"}
                      </span>
                    </div>
                  ))}

                  <VincularPadre ninoNombre={nino.nombre} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
