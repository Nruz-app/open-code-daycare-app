"use client";

import { useRef, useState } from "react";

import type {
  AvatarTone,
  ChipNino,
  Guarderia,
  Nino,
  Sala,
} from "@/app/lib/dal";
import { AgregarNino, type AgregarNinoHandle } from "@/app/ninos/agregar-nino";

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

/**
 * Quita mayúsculas y acentos para comparar: "sofia" encuentra a "Sofía".
 * En español son la misma búsqueda para la maestra.
 */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Contador del encabezado de grupo con singular y plural. */
function contarNinos(cantidad: number): string {
  return cantidad === 1 ? "1 niño" : `${cantidad} niños`;
}

type GestionNinosProps = {
  /** Niños activos de la base, mapeados por la DAL. */
  ninos: Nino[];
  /** Guarderías reales de Supabase vía `getDaycares()`. */
  guarderias: Guarderia[];
  /** Salas de la guardería del staff (tabla `rooms`) para el alta. */
  salas: Sala[];
};

type GrupoSala = {
  sala: string;
  ninos: Nino[];
};

/**
 * Tarjeta del listado. Enlaza al perfil `/ninos/[id]`, que lee de la base
 * con el uuid del niño.
 */
function TarjetaNino({ nino }: { nino: Nino }) {
  const clases =
    "flex min-w-0 items-center gap-3.5 rounded-box border border-line bg-surface p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-[#f2a78e]";
  const contenido = (
    <>
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
    </>
  );

  return (
    <a href={`/ninos/${nino.id}`} className={clases}>
      {contenido}
    </a>
  );
}

type EstadoVacioAltaProps = {
  alAbrir: () => void;
};

/**
 * Estado "aún no hay niños": se ocultan la tarjeta de Guarderías y la
 * búsqueda (no hay nada que filtrar) y el CTA abre el mismo diálogo de alta.
 */
function EstadoVacioAlta({ alAbrir }: EstadoVacioAltaProps) {
  return (
    <div className="rounded-box border border-line bg-surface p-12 text-center">
      <p className="font-display text-[18px] font-semibold text-ink">
        Aún no hay niños
      </p>
      <p className="mt-1.5 text-[14px] text-ink-soft">
        Agregá al primero para arrancar la lista.
      </p>
      <button
        type="button"
        onClick={alAbrir}
        className="mx-auto mt-5 flex items-center justify-center gap-2 rounded-chip bg-linear-to-b from-[#f4977e] to-coral px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-cta transition-opacity hover:opacity-95"
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
      </button>
    </div>
  );
}

/**
 * Isla cliente de /ninos: encabezado con el alta, tarjeta de Guarderías,
 * búsqueda y listado. El servidor (`page.tsx`) descarga los datos y pasa
 * props serializables; el filtrado vive aquí y el alta persiste en la base
 * (Server Action `altaNino`), así que no hay estado de niños en la sesión.
 */
export function GestionNinos({ ninos, guarderias, salas }: GestionNinosProps) {
  const [consulta, setConsulta] = useState("");
  const agregarRef = useRef<AgregarNinoHandle | null>(null);

  // Un único derivado alimenta los grupos, los contadores y los estados vacíos.
  const consultaLimpia = consulta.trim();
  const textoBuscado = normalizar(consultaLimpia);
  const ninosFiltrados = textoBuscado
    ? ninos.filter((nino) => normalizar(nino.nombre).includes(textoBuscado))
    : ninos;

  // Un grupo por sala, en orden alfabético.
  const grupos: GrupoSala[] = [...new Set(ninosFiltrados.map((nino) => nino.sala))]
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((sala) => ({
      sala,
      ninos: ninosFiltrados.filter((nino) => nino.sala === sala),
    }));

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

        <AgregarNino ref={agregarRef} salas={salas} />
      </header>

      {ninos.length === 0 ? (
        // Sin niños en absoluto: el centro sigue existiendo, pero no hay
        // lista que mostrar ni que filtrar.
        <EstadoVacioAlta alAbrir={() => agregarRef.current?.abrir()} />
      ) : (
        <>
          {/* Tarjeta de guarderías: primer dato real de Supabase vía DAL. */}
          <div className="mb-[22px] rounded-box border border-line bg-surface p-4 shadow-soft">
            <div className="mb-2 font-display text-[16px] font-semibold text-ink">
              Guarderías
            </div>
            {/* Si la lectura falla o no hay filas, se avisa sin romper la pantalla. */}
            {guarderias.length === 0 ? (
              <p className="text-[13px] text-ink-soft">
                No se pudo cargar la lista de guarderías.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {guarderias.map((guarderia) => (
                  <li key={guarderia.id} className="text-[14px] text-ink-soft">
                    {guarderia.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

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
              value={consulta}
              onChange={(event) => setConsulta(event.target.value)}
              className="flex-1 border-none bg-transparent text-[15px] text-ink outline-none placeholder:text-[#b6a99b]"
            />
          </div>

          {ninosFiltrados.length === 0 ? (
            // Sin resultados: la tarjeta de Guarderías sigue arriba porque
            // habla del centro, no del filtro.
            <p className="rounded-box border border-line bg-surface p-10 text-center text-[14px] text-ink-soft">
              Sin resultados para{" "}
              <span className="font-bold text-ink">«{consultaLimpia}»</span>
            </p>
          ) : (
            <>
              {grupos.map((grupo) => (
                <section key={grupo.sala}>
                  <div className="mb-3.5 flex items-center gap-3">
                    <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink">
                      SALA {grupo.sala.toUpperCase()}
                    </span>
                    <span className="text-[13px] text-ink-soft">
                      {contarNinos(grupo.ninos.length)}
                    </span>
                    <span className="h-px flex-1 bg-[#e7dac8]" />
                  </div>

                  <div className="mb-[22px] grid grid-cols-1 gap-3.5 md:grid-cols-2">
                    {grupo.ninos.map((nino) => (
                      <TarjetaNino key={nino.id} nino={nino} />
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
