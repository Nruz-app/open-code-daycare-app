"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

import type { AvatarTone } from "@/app/lib/mock-ninos";

/** Opción exclusiva de "Toda la sala"; no es un id de niño. */
const TODA_LA_SALA = "toda-la-sala";

type Destinatario = {
  id: string; // "mateo-fernandez"
  nombre: string; // "Mateo", solo el primer nombre
  inicial: string; // "M"
  avatarTone: AvatarTone;
};

type CrearPublicacionProviderProps = {
  /** Los tres primeros niños de app/lib/mock-ninos.ts. */
  destinatarios: Destinatario[];
  children: ReactNode;
};

type Errores = {
  descripcion?: string;
};

type TipoPublicacion =
  | "Comida"
  | "Siesta"
  | "Actividad"
  | "Logro"
  | "Ánimo"
  | "Foto"
  | "Anuncio";

const TIPOS: TipoPublicacion[] = [
  "Comida",
  "Siesta",
  "Actividad",
  "Logro",
  "Ánimo",
  "Foto",
  "Anuncio",
];

/** Suave = inactivo, sólido = activo, según la maqueta. */
const TIPO_CLASS: Record<
  TipoPublicacion,
  { activo: string; inactivo: string }
> = {
  Comida: {
    inactivo: "bg-[#f4dc8e] text-[#9a7b1e]",
    activo: "bg-[#9a7b1e] text-white",
  },
  Siesta: {
    inactivo: "bg-[#e7dcf6] text-[#7b5fc0]",
    activo: "bg-[#7b5fc0] text-white",
  },
  Actividad: {
    inactivo: "bg-sky-soft text-sky-deep",
    activo: "bg-sky-deep text-white",
  },
  Logro: {
    inactivo: "bg-mint-soft text-mint",
    activo: "bg-mint text-white",
  },
  Ánimo: {
    inactivo: "bg-[#f9d2de] text-[#c56486]",
    activo: "bg-[#c56486] text-white",
  },
  Foto: {
    inactivo: "bg-[#fbd8cc] text-[#d9684a]",
    activo: "bg-[#d9684a] text-white",
  },
  Anuncio: {
    inactivo: "bg-lilac-soft text-lilac",
    activo: "bg-lilac text-white",
  },
};

/** Tonos de avatar de app/ninos/page.tsx. */
const avatarToneClass: Record<AvatarTone, string> = {
  sky: "bg-[#a9d9e8] text-[#1f7a93]",
  pink: "bg-[#f4b8cc] text-[#c44a7a]",
  mint: "bg-[#b9dec4] text-[#3e8b62]",
  sand: "bg-[#f4dc8e] text-[#9a7b1e]",
  lilac: "bg-[#c9b6e8] text-[#7b5fc0]",
};

const ETIQUETA_CLASS =
  "mb-2.5 block text-[12px] font-extrabold tracking-[0.7px] text-ink-muted";

const CHIP_CLASS =
  "flex items-center gap-2 rounded-full border-[1.5px] text-[14px] font-bold transition-colors";

const CHIP_ACTIVO_CLASS = "border-ink bg-ink text-white";

const CHIP_INACTIVO_CLASS = "border-line bg-surface text-[#6e6359]";

/** Mismas clases del botón "Nueva publicación" de la sidebar. */
const BOTON_SIDEBAR_CLASS =
  "mb-[18px] flex w-full items-center justify-center gap-2 rounded-chip bg-linear-to-b from-[#f4977e] to-coral px-3 py-3 text-[14.5px] font-extrabold text-white shadow-cta";

const ICONO_MAS = (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

type CrearPublicacionContexto = {
  abrir: () => void;
};

const CrearPublicacionContext =
  createContext<CrearPublicacionContexto | null>(null);

function useCrearPublicacion(): CrearPublicacionContexto {
  const contexto = useContext(CrearPublicacionContext);

  if (!contexto) {
    throw new Error(
      "CrearPublicacion debe usarse dentro de CrearPublicacionProvider",
    );
  }

  return contexto;
}

/**
 * Dueño del diálogo de nueva publicación.
 *
 * Envuelve el layout del feed para que la sidebar y la caja "Compartí un
 * momento…" abran el mismo `<dialog>`. Los tres disparadores consumen el
 * contexto; el diálogo y el aviso se renderizan una sola vez aquí.
 */
export function CrearPublicacionProvider({
  destinatarios,
  children,
}: CrearPublicacionProviderProps) {
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const textoRef = useRef<HTMLTextAreaElement>(null);

  const [destinatario, setDestinatario] = useState(
    destinatarios[0]?.id ?? TODA_LA_SALA,
  );
  const [tipos, setTipos] = useState<TipoPublicacion[]>(["Comida"]);
  const [descripcion, setDescripcion] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [aviso, setAviso] = useState<string | null>(null);

  // El aviso de publicación se apaga solo.
  useEffect(() => {
    if (!aviso) {
      return;
    }

    const temporizador = window.setTimeout(() => setAviso(null), 4000);

    return () => window.clearTimeout(temporizador);
  }, [aviso]);

  function abrir() {
    dialogoRef.current?.showModal();
    // `showModal()` recién deja el diálogo visible; el foco va después.
    window.requestAnimationFrame(() => textoRef.current?.focus());
  }

  function cerrar() {
    dialogoRef.current?.close();
  }

  /** El backdrop es el propio `<dialog>`; el contenido siempre es un hijo. */
  function alClicFondo(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      cerrar();
    }
  }

  /** El `close` del diálogo limpia el formulario en todos los caminos. */
  function limpiar() {
    setDestinatario(destinatarios[0]?.id ?? TODA_LA_SALA);
    setTipos(["Comida"]);
    setDescripcion("");
    setErrores({});
  }

  /**
   * TIPO es multiselección: cada pastilla se activa y desactiva sin tocar las
   * demás. Se puede dejar vacío; no es obligatorio elegir un tipo.
   */
  function alternarTipo(opcion: TipoPublicacion) {
    setTipos((actuales) =>
      actuales.includes(opcion)
        ? actuales.filter((tipoActual) => tipoActual !== opcion)
        : [...actuales, opcion],
    );
  }

  function publicar() {
    const descripcionLimpia = descripcion.trim();

    if (descripcionLimpia.length === 0) {
      setErrores({ descripcion: "Escribí una descripción para publicar." });
      textoRef.current?.focus();

      return;
    }

    const nombreDestinatario =
      destinatarios.find((nino) => nino.id === destinatario)?.nombre ??
      "toda la sala";

    setAviso(`Publicación lista para ${nombreDestinatario}.`);
    cerrar();
  }

  return (
    <CrearPublicacionContext.Provider value={{ abrir }}>
      {children}

      <dialog
        ref={dialogoRef}
        aria-labelledby="crear-publicacion-titulo"
        onClose={limpiar}
        onClick={alClicFondo}
        className="m-auto max-h-[90vh] w-[calc(100%-32px)] max-w-[580px] overflow-y-auto overscroll-contain rounded-[24px] border border-line bg-paper p-0 text-ink shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] backdrop:bg-[rgba(63,54,46,0.45)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-[18px] py-[18px] sm:px-[26px] sm:py-5">
          <button
            type="button"
            onClick={cerrar}
            className="text-[15px] font-bold text-ink-muted transition-colors hover:text-ink"
          >
            Cancelar
          </button>
          <h2
            id="crear-publicacion-titulo"
            className="font-display text-[18px] font-semibold text-ink"
          >
            Nueva publicación
          </h2>
          <button
            type="button"
            onClick={publicar}
            className="text-[15px] font-extrabold text-coral-deep transition-colors hover:text-coral-heart"
          >
            Publicar
          </button>
        </div>

        {/* Cuerpo del formulario, en el orden de la maqueta. */}
        <div className="px-[18px] py-[18px] sm:px-[26px] sm:py-6">
          <p id="crear-publicacion-para" className={ETIQUETA_CLASS}>
            PARA
          </p>
          <div
            role="group"
            aria-labelledby="crear-publicacion-para"
            className="mb-[22px] flex flex-wrap gap-[9px]"
          >
            {destinatarios.map((destinatarioNino) => {
              const activo = destinatario === destinatarioNino.id;

              return (
                <button
                  key={destinatarioNino.id}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => setDestinatario(destinatarioNino.id)}
                  className={`${CHIP_CLASS} py-1.5 pl-1.5 pr-3.5 ${
                    activo ? CHIP_ACTIVO_CLASS : CHIP_INACTIVO_CLASS
                  }`}
                >
                  <span
                    className={`flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full font-display text-[13px] font-semibold ${
                      avatarToneClass[destinatarioNino.avatarTone]
                    }`}
                  >
                    {destinatarioNino.inicial}
                  </span>
                  {destinatarioNino.nombre}
                </button>
              );
            })}

            <button
              type="button"
              aria-pressed={destinatario === TODA_LA_SALA}
              onClick={() => setDestinatario(TODA_LA_SALA)}
              className={`${CHIP_CLASS} px-4 py-1.5 ${
                destinatario === TODA_LA_SALA
                  ? CHIP_ACTIVO_CLASS
                  : CHIP_INACTIVO_CLASS
              }`}
            >
              Toda la sala
            </button>
          </div>

          <p id="crear-publicacion-tipo" className={ETIQUETA_CLASS}>
            TIPO
          </p>
          <div
            role="group"
            aria-labelledby="crear-publicacion-tipo"
            className="mb-[22px] flex flex-wrap gap-[9px]"
          >
            {TIPOS.map((opcion) => {
              const activo = tipos.includes(opcion);

              return (
                <button
                  key={opcion}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => alternarTipo(opcion)}
                  className={`rounded-full px-4 py-2 text-[13.5px] font-extrabold transition-colors ${
                    activo
                      ? TIPO_CLASS[opcion].activo
                      : TIPO_CLASS[opcion].inactivo
                  }`}
                >
                  {opcion}
                </button>
              );
            })}
          </div>

          <label
            htmlFor="crear-publicacion-descripcion"
            className={ETIQUETA_CLASS}
          >
            DESCRIPCIÓN
          </label>
          <textarea
            ref={textoRef}
            id="crear-publicacion-descripcion"
            value={descripcion}
            onChange={(event) => {
              const valor = event.target.value;
              setDescripcion(valor);

              if (errores.descripcion && valor.trim()) {
                setErrores({});
              }
            }}
            placeholder="Contá cómo le fue hoy…"
            aria-invalid={Boolean(errores.descripcion)}
            aria-describedby={
              errores.descripcion
                ? "crear-publicacion-error-descripcion"
                : undefined
            }
            className={`min-h-[120px] w-full resize-y rounded-chip border-[1.5px] bg-white px-4 py-[14px] text-[15px] leading-[1.5] text-ink outline-none transition-colors placeholder:text-field-hint ${
              errores.descripcion
                ? "border-coral-deep focus:border-coral-deep"
                : "mb-[22px] border-field-line focus:border-[#f2a78e]"
            }`}
          />
          {errores.descripcion ? (
            <p
              id="crear-publicacion-error-descripcion"
              role="alert"
              className="mb-[22px] mt-2 text-[12.5px] font-bold text-coral-deep"
            >
              {errores.descripcion}
            </p>
          ) : null}

          {/* Decorativo: todavía no hay subida de fotos. */}
          <div aria-hidden="true">
            <p className={ETIQUETA_CLASS}>FOTOS</p>
            <div className="flex gap-3">
              <div className="flex h-24 w-24 items-center justify-center rounded-[14px] border border-line bg-[#f4ece1] text-[#cbb89f]">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
                </svg>
              </div>
              <div className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-placeholder-line bg-[#f4ece1] text-[#b0a290]">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#c5503a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-[12px]">Agregar</span>
              </div>
            </div>
          </div>
        </div>
      </dialog>

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-6 z-50 flex justify-center"
      >
        {aviso ? (
          <p className="rounded-full bg-ink px-5 py-3 text-[14px] font-extrabold text-white shadow-card">
            {aviso}
          </p>
        ) : null}
      </div>
    </CrearPublicacionContext.Provider>
  );
}

/**
 * Disparadores del feed: el CTA móvil y la caja "Compartí un momento…".
 * Ambos abren el diálogo del provider.
 */
export function CrearPublicacion() {
  const { abrir } = useCrearPublicacion();

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-chip bg-linear-to-b from-[#f4977e] to-coral px-3 py-3 text-[14.5px] font-extrabold text-white shadow-cta md:hidden"
      >
        {ICONO_MAS}
        Nueva publicación
      </button>

      <button
        type="button"
        onClick={abrir}
        className="mb-6 flex w-full items-center gap-3.5 rounded-box border border-line bg-surface px-[18px] py-3.5 text-left shadow-soft"
      >
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#f2937a] font-display text-base font-semibold text-white">
          C
        </div>
        <span className="flex-1 text-[15px] text-ink-soft">
          Compartí un momento…
        </span>
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-coral-soft text-coral-heart">
          <svg
            aria-hidden="true"
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
      </button>
    </>
  );
}

type BotonNuevaPublicacionProps = {
  /**
   * En `/feed` abre el diálogo del provider; en `/ninos` se queda como el
   * enlace decorativo que ya existía.
   */
  activo?: boolean;
};

/**
 * Botón "Nueva publicación" de la sidebar.
 *
 * La sidebar es un componente servidor compartido por `/feed` y `/ninos`. La
 * prop `activo` la decide el servidor, de modo que el HTML inicial coincide con
 * el cliente; en `/feed` el `onClick` sale del contexto.
 */
export function BotonNuevaPublicacion({
  activo = false,
}: BotonNuevaPublicacionProps) {
  const contexto = useContext(CrearPublicacionContext);

  if (!activo) {
    return (
      <a href="#" className={BOTON_SIDEBAR_CLASS}>
        {ICONO_MAS}
        Nueva publicación
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={contexto?.abrir}
      className={BOTON_SIDEBAR_CLASS}
    >
      {ICONO_MAS}
      Nueva publicación
    </button>
  );
}
