"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";

const PARENTESCOS = ["Mamá", "Papá", "Tutor/a"] as const;

type Parentesco = (typeof PARENTESCOS)[number];

/** Mismo código que muestra /activar-cuenta. */
const CODIGO_INVITACION = "7K4P9";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errores = {
  nombre?: string;
  email?: string;
};

type VincularPadreProps = {
  /** Nombre completo del niño, tal como lo muestra el perfil. */
  ninoNombre: string;
};

const ETIQUETA_CLASS =
  "mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-ink-muted";

const CAMPO_CLASS =
  "w-full rounded-chip border-[1.5px] border-field-line bg-white px-4 py-[13px] text-[15px] text-ink outline-none transition-colors placeholder:text-field-hint focus:border-[#f2a78e]";

const CAMPO_ERROR_CLASS = "border-coral-deep focus:border-coral-deep";

/**
 * Fila "Vincular otro padre" del perfil + diálogo con el formulario de
 * references/pantallas/vincular-padre.dc.html.
 *
 * Es un `<dialog>` nativo, igual que `agregar-nino.tsx`: `showModal()` atrapa
 * el foco, deja el resto de la página inerte y cierra con Escape. Todavía no
 * hay persistencia, así que "Enviar invitación" valida y confirma en pantalla.
 */
export function VincularPadre({ ninoNombre }: VincularPadreProps) {
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [parentesco, setParentesco] = useState<Parentesco>("Mamá");
  const [errores, setErrores] = useState<Errores>({});
  const [aviso, setAviso] = useState<string | null>(null);

  const primerNombre = ninoNombre.split(" ")[0];

  // El aviso de envío se apaga solo.
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
    window.requestAnimationFrame(() => nombreRef.current?.focus());
  }

  /** El `close` del diálogo limpia el formulario en todos los caminos. */
  function limpiar() {
    setNombre("");
    setEmail("");
    setParentesco("Mamá");
    setErrores({});
  }

  function cerrar() {
    dialogoRef.current?.close();
  }

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim();
    const errorNombre =
      nombreLimpio.length === 0
        ? "Ingresá el nombre del padre/madre."
        : undefined;
    const errorEmail = EMAIL_PATTERN.test(emailLimpio)
      ? undefined
      : "Ingresá un correo válido.";

    if (errorNombre || errorEmail) {
      setErrores({ nombre: errorNombre, email: errorEmail });

      if (errorNombre) {
        nombreRef.current?.focus();
      } else {
        emailRef.current?.focus();
      }

      return;
    }

    setAviso(`Invitación enviada a ${emailLimpio}.`);
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
        className="flex w-full items-center gap-3 pt-2 text-left"
      >
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#d8cbba] text-[#b0a290]">
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
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className="text-[14.5px] font-extrabold text-coral-link">
          Vincular otro padre
        </span>
      </button>

      <dialog
        ref={dialogoRef}
        aria-labelledby="vincular-padre-titulo"
        aria-describedby="vincular-padre-descripcion"
        onClose={limpiar}
        onClick={alClicFondo}
        className="m-auto max-h-[90vh] w-[calc(100%-32px)] max-w-[480px] overflow-y-auto overscroll-contain rounded-[24px] border border-line bg-paper p-0 text-ink shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] backdrop:bg-[rgba(63,54,46,0.45)]"
      >
        <form onSubmit={enviar} autoComplete="off" className="text-left">
          <div className="flex items-center justify-between gap-3 border-b border-line px-[26px] py-5">
            <div className="min-w-0">
              <h2
                id="vincular-padre-titulo"
                className="font-display text-[18px] font-semibold text-ink"
              >
                Vincular padre
              </h2>
              <p
                id="vincular-padre-descripcion"
                className="mt-0.5 break-words text-[13px] leading-[1.35] text-ink-soft"
              >
                a {ninoNombre}
              </p>
            </div>
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar"
              className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-[#f0e6d8] text-ink-muted transition-colors hover:text-ink"
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
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-[26px] py-[22px]">
            <div className="mb-5 flex gap-[11px] rounded-[14px] bg-[#e3ecfb] px-4 py-[13px]">
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4e72c8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-px flex-none"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <span className="text-[13.5px] leading-[1.45] text-[#3f5694]">
                Le enviaremos un correo con un código para que active su cuenta.
                Solo verá el feed de {primerNombre}.
              </span>
            </div>

            <label htmlFor="vincular-padre-nombre" className={ETIQUETA_CLASS}>
              NOMBRE DEL PADRE/MADRE
            </label>
            <input
              ref={nombreRef}
              id="vincular-padre-nombre"
              value={nombre}
              onChange={(event) => {
                setNombre(event.target.value);

                if (errores.nombre && event.target.value.trim()) {
                  setErrores((previos) => ({ ...previos, nombre: undefined }));
                }
              }}
              placeholder="Ej. Diego Fernández"
              aria-invalid={Boolean(errores.nombre)}
              aria-describedby={
                errores.nombre ? "vincular-padre-error-nombre" : undefined
              }
              className={`${CAMPO_CLASS} mb-[18px] ${
                errores.nombre ? CAMPO_ERROR_CLASS : ""
              }`}
            />
            {errores.nombre ? (
              <p
                id="vincular-padre-error-nombre"
                role="alert"
                className="-mt-3 mb-[18px] text-[12.5px] font-bold text-coral-deep"
              >
                {errores.nombre}
              </p>
            ) : null}

            <label htmlFor="vincular-padre-email" className={ETIQUETA_CLASS}>
              EMAIL
            </label>
            <input
              ref={emailRef}
              id="vincular-padre-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);

                if (
                  errores.email &&
                  EMAIL_PATTERN.test(event.target.value.trim())
                ) {
                  setErrores((previos) => ({ ...previos, email: undefined }));
                }
              }}
              placeholder="correo@ejemplo.com"
              aria-invalid={Boolean(errores.email)}
              aria-describedby={
                errores.email ? "vincular-padre-error-email" : undefined
              }
              className={`${CAMPO_CLASS} mb-[18px] ${
                errores.email ? CAMPO_ERROR_CLASS : ""
              }`}
            />
            {errores.email ? (
              <p
                id="vincular-padre-error-email"
                role="alert"
                className="-mt-3 mb-[18px] text-[12.5px] font-bold text-coral-deep"
              >
                {errores.email}
              </p>
            ) : null}

            <div className="mb-5">
              <div
                id="vincular-padre-parentesco"
                className="mb-2.5 text-[12px] font-extrabold tracking-[0.7px] text-ink-muted"
              >
                PARENTESCO
              </div>
              <div
                role="group"
                aria-labelledby="vincular-padre-parentesco"
                className="flex gap-[9px]"
              >
                {PARENTESCOS.map((opcion) => {
                  const activa = parentesco === opcion;

                  return (
                    <button
                      key={opcion}
                      type="button"
                      aria-pressed={activa}
                      onClick={() => setParentesco(opcion)}
                      className={`flex-1 rounded-full border-[1.5px] p-[11px] text-[14px] font-extrabold transition-colors ${
                        activa
                          ? "border-[#9fb8ec] bg-[#ccd8f4] text-[#4e72c8]"
                          : "border-line bg-surface text-[#6e6359] hover:border-[#d8cbba]"
                      }`}
                    >
                      {opcion}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-[#e6d08a] bg-[#fbf1d6] p-[18px] text-center">
              <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-[#a88526]">
                CÓDIGO DE INVITACIÓN
              </div>
              <div className="font-display text-[34px] font-semibold tracking-[7px] text-[#8a7234]">
                {CODIGO_INVITACION}
              </div>
              <div className="mt-[6px] text-[13px] text-[#a88526]">
                Vence en 7 días
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-[9px] rounded-chip bg-linear-to-b from-[#f4977e] to-coral p-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] transition-opacity hover:opacity-95"
            >
              <svg
                aria-hidden="true"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4z" />
                <path d="M22 2 11 13" />
              </svg>
              Enviar invitación
            </button>
          </div>
        </form>
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
    </>
  );
}
