"use client";

import {
  useImperativeHandle,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type Ref,
} from "react";

import {
  aplicarMascaraFecha,
  validarFechaNacimiento,
} from "@/app/lib/fecha-nacimiento";
import type { Sala } from "@/app/lib/dal";
import { altaNino } from "@/app/ninos/actions";

type Errores = {
  nombre?: string;
  fecha?: string;
  guardar?: string;
};

/** Lo que el componente expone a su padre: abrir el diálogo de alta. */
export type AgregarNinoHandle = {
  abrir: () => void;
};

type AgregarNinoProps = {
  /** Salas de la guardería (tabla `rooms`) para el select del formulario. */
  salas: Sala[];
  /** Handle para que otros disparadores (estado vacío) abran el diálogo. */
  ref?: Ref<AgregarNinoHandle>;
};

const ETIQUETA_CLASS =
  "mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-ink-muted";

const CAMPO_CLASS =
  "w-full rounded-chip border-[1.5px] border-field-line bg-white px-4 py-[13px] text-[15px] text-ink outline-none transition-colors placeholder:text-field-hint focus:border-[#f2a78e]";

const CAMPO_ERROR_CLASS = "border-coral-deep focus:border-coral-deep";

/**
 * Botón "Agregar niño" de /ninos + diálogo modal con el formulario de
 * references/pantallas/agregar-nino.dc.html.
 *
 * Es un `<dialog>` nativo: `showModal()` atrapa el foco, deja el resto de la
 * página inerte y cierra con Escape. Al validar y guardar llama la Server
 * Action `altaNino` (insert real en `children` vía DAL); si el insert falla,
 * el diálogo muestra el error y conserva lo escrito.
 */
export function AgregarNino({ salas, ref }: AgregarNinoProps) {
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const fechaRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [salaElegida, setSalaElegida] = useState<string | null>(null);
  const [alergias, setAlergias] = useState("");
  const [notas, setNotas] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);

  // Por defecto, Soles si existe; si no, la primera de la lista.
  const salaInicial = salas.find((sala) => sala.name === "Soles")?.id ?? salas[0]?.id ?? "";
  const salaActual = salaElegida ?? salaInicial;

  const etiquetasAlergias = alergias
    .split(",")
    .map((etiqueta) => etiqueta.trim())
    .filter(Boolean);

  function abrir() {
    dialogoRef.current?.showModal();
    // `showModal()` recién deja el diálogo visible; el foco va después.
    window.requestAnimationFrame(() => nombreRef.current?.focus());
  }

  /** El `close` del diálogo limpia el formulario en todos los caminos. */
  function limpiar() {
    setNombre("");
    setFecha("");
    setSalaElegida(null);
    setAlergias("");
    setNotas("");
    setErrores({});
  }

  function cerrar() {
    dialogoRef.current?.close();
  }

  // El CTA del estado vacío comparte este diálogo: nadie duplica el <dialog>.
  useImperativeHandle(ref, () => ({ abrir }));

  function cambiarFecha(valor: string) {
    const conMascara = aplicarMascaraFecha(valor);
    setFecha(conMascara);

    // Mientras escribe, el error desaparece en cuanto la fecha vuelve a ser válida.
    if (errores.fecha) {
      setErrores((previos) => ({
        ...previos,
        fecha: validarFechaNacimiento(conMascara) ?? undefined,
      }));
    }
  }

  function validarFechaAlSalir() {
    if (fecha.length === 0) {
      return;
    }

    setErrores((previos) => ({
      ...previos,
      fecha: validarFechaNacimiento(fecha) ?? undefined,
    }));
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nombreLimpio = nombre.trim();
    const errorNombre =
      nombreLimpio.length === 0 ? "Ingresá el nombre completo." : undefined;
    const errorFecha = validarFechaNacimiento(fecha) ?? undefined;

    if (errorNombre || errorFecha) {
      setErrores({ nombre: errorNombre, fecha: errorFecha });

      if (errorNombre) {
        nombreRef.current?.focus();
      } else {
        fechaRef.current?.focus();
      }

      return;
    }

    setGuardando(true);
    setErrores((previos) => ({ ...previos, guardar: undefined }));

    // Alta real: Server Action con insert en `children` (vía DAL). Si algo
    // falla (red, RLS), el diálogo muestra el error y conserva lo escrito.
    const resultado = await altaNino({
      nombre: nombreLimpio,
      fecha,
      salaId: salaActual,
      alergias: etiquetasAlergias,
      notas: notas.trim() || undefined,
    }).catch(
      () =>
        ({
          ok: false,
          error: "No se pudo guardar el niño. Intentalo de nuevo.",
        }) as const,
    );

    setGuardando(false);

    if (!resultado.ok) {
      setErrores({
        guardar:
          resultado.error ?? "No se pudo guardar el niño. Intentalo de nuevo.",
      });

      return;
    }

    cerrar();
  }

  /** El backdrop es el propio `<dialog>`; el contenido siempre es un hijo. */
  function alClicFondo(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      cerrar();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="flex w-full items-center justify-center gap-2 rounded-chip bg-linear-to-b from-[#f4977e] to-coral px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-cta transition-opacity hover:opacity-95 md:w-auto"
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

      <dialog
        ref={dialogoRef}
        aria-labelledby="agregar-nino-titulo"
        onClose={limpiar}
        onClick={alClicFondo}
        className="m-auto max-h-[90vh] w-[calc(100%-32px)] max-w-[520px] overflow-y-auto overscroll-contain rounded-[24px] border border-line bg-paper p-0 text-ink shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] backdrop:bg-[rgba(63,54,46,0.45)]"
      >
        <form onSubmit={guardar} autoComplete="off" className="text-left">
          <div className="flex items-center justify-between gap-3 border-b border-line px-[26px] py-5">
            <button
              type="button"
              onClick={cerrar}
              disabled={guardando}
              className="text-[15px] font-bold text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              Cancelar
            </button>
            <h2
              id="agregar-nino-titulo"
              className="font-display text-[18px] font-semibold text-ink"
            >
              Agregar niño
            </h2>
            <button
              type="submit"
              disabled={guardando}
              className="text-[15px] font-extrabold text-coral-deep transition-colors hover:text-coral-heart disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>

          <div className="px-[26px] py-6">
            {errores.guardar ? (
              <p
                role="alert"
                className="mb-[18px] rounded-chip bg-[#fbd8cc] px-4 py-3 text-[13px] font-bold text-[#d9684a]"
              >
                {errores.guardar}
              </p>
            ) : null}

            <label htmlFor="agregar-nino-nombre" className={ETIQUETA_CLASS}>
              NOMBRE COMPLETO
            </label>
            <input
              ref={nombreRef}
              id="agregar-nino-nombre"
              value={nombre}
              onChange={(event) => {
                setNombre(event.target.value);

                if (errores.nombre && event.target.value.trim()) {
                  setErrores((previos) => ({ ...previos, nombre: undefined }));
                }
              }}
              placeholder="Ej. Martina López"
              aria-invalid={Boolean(errores.nombre)}
              aria-describedby={
                errores.nombre ? "agregar-nino-error-nombre" : undefined
              }
              className={`${CAMPO_CLASS} mb-[18px] ${
                errores.nombre ? CAMPO_ERROR_CLASS : ""
              }`}
            />
            {errores.nombre ? (
              <p
                id="agregar-nino-error-nombre"
                role="alert"
                className="-mt-3 mb-[18px] text-[12.5px] font-bold text-coral-deep"
              >
                {errores.nombre}
              </p>
            ) : null}

            <div className="mb-[18px] flex flex-col gap-3.5 sm:flex-row">
              <div className="min-w-0 flex-1">
                <label htmlFor="agregar-nino-fecha" className={ETIQUETA_CLASS}>
                  FECHA DE NACIMIENTO
                </label>
                <input
                  ref={fechaRef}
                  id="agregar-nino-fecha"
                  value={fecha}
                  onChange={(event) => cambiarFecha(event.target.value)}
                  onBlur={validarFechaAlSalir}
                  placeholder="dd/mm/aaaa"
                  inputMode="numeric"
                  autoComplete="bday"
                  maxLength={10}
                  aria-invalid={Boolean(errores.fecha)}
                  aria-describedby={
                    errores.fecha ? "agregar-nino-error-fecha" : undefined
                  }
                  className={`${CAMPO_CLASS} ${
                    errores.fecha ? CAMPO_ERROR_CLASS : ""
                  }`}
                />
                {errores.fecha ? (
                  <p
                    id="agregar-nino-error-fecha"
                    role="alert"
                    className="mt-2 text-[12.5px] font-bold text-coral-deep"
                  >
                    {errores.fecha}
                  </p>
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <label htmlFor="agregar-nino-sala" className={ETIQUETA_CLASS}>
                  SALA
                </label>
                <div className="relative">
                  <select
                    id="agregar-nino-sala"
                    value={salaActual}
                    onChange={(event) => setSalaElegida(event.target.value)}
                    className={`${CAMPO_CLASS} appearance-none pr-10 font-bold`}
                  >
                    {salas.length === 0 ? (
                      <option value="">No hay salas cargadas</option>
                    ) : (
                      salas.map((sala) => (
                        <option key={sala.id} value={sala.id}>
                          {sala.name}
                        </option>
                      ))
                    )}
                  </select>
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#B0A290"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            <label htmlFor="agregar-nino-alergias" className={ETIQUETA_CLASS}>
              ALERGIAS (ETIQUETAS)
            </label>
            <input
              id="agregar-nino-alergias"
              value={alergias}
              onChange={(event) => setAlergias(event.target.value)}
              placeholder="Ej. Maní, Lactosa"
              aria-describedby={
                etiquetasAlergias.length > 0
                  ? "agregar-nino-etiquetas-alergias"
                  : undefined
              }
              className={`${CAMPO_CLASS} ${
                etiquetasAlergias.length > 0 ? "" : "mb-[18px]"
              }`}
            />
            {etiquetasAlergias.length > 0 ? (
              <ul
                id="agregar-nino-etiquetas-alergias"
                aria-label="Alergias agregadas"
                className="mb-[18px] mt-2.5 flex flex-wrap gap-2"
              >
                {etiquetasAlergias.map((etiqueta) => (
                  <li
                    key={etiqueta}
                    className="rounded-full bg-[#fbd8cc] px-[9px] py-[5px] text-[11px] font-extrabold text-[#d9684a]"
                  >
                    {etiqueta.toUpperCase()}
                  </li>
                ))}
              </ul>
            ) : null}

            <label htmlFor="agregar-nino-notas" className={ETIQUETA_CLASS}>
              NOTAS MÉDICAS
            </label>
            <textarea
              id="agregar-nino-notas"
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              placeholder="Indicaciones, medicación, contactos…"
              className={`${CAMPO_CLASS} min-h-[90px] resize-y leading-[1.5]`}
            />
          </div>
        </form>
      </dialog>
    </>
  );
}
