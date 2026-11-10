import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activar cuenta · OpenDayCare",
};

const INVITACION = {
  inicial: "M",
  nino: "Mateo",
  sala: "Soles",
  codigo: "7K4P9",
  email: "lucia.fernandez@gmail.com",
};

export default function ActivarCuentaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-7 md:p-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#f8c3a8,#f2937a)] shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </div>

        <h1 className="mb-2 font-display text-[32px] font-semibold leading-[1.15] text-ink">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-ink-muted">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
          activar la cuenta.
        </p>

        <div className="mb-[22px] flex items-center gap-3.5 rounded-[16px] border-[1.5px] border-field-line bg-white px-4 py-3.5">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-sky font-display text-[19px] font-semibold text-sky-ink">
            {INVITACION.inicial}
          </div>
          <div>
            <div className="text-[13px] text-ink-muted">
              Te invitaron a seguir a
            </div>
            <div className="font-display text-[17px] font-semibold text-ink">
              {INVITACION.nino} · Sala {INVITACION.sala}
            </div>
          </div>
        </div>

        <label
          htmlFor="invitacion-codigo"
          className="mb-2 block text-[12px] font-bold tracking-[0.7px] text-ink-muted"
        >
          CÓDIGO DE INVITACIÓN
        </label>
        <input
          id="invitacion-codigo"
          name="codigo"
          defaultValue={INVITACION.codigo}
          className="mb-[18px] w-full rounded-chip border-[1.5px] border-field-line bg-white px-4 py-3.5 font-display text-[18px] font-bold tracking-[3px] text-ink outline-none"
        />

        <label
          htmlFor="invitacion-email"
          className="mb-2 block text-[12px] font-bold tracking-[0.7px] text-ink-muted"
        >
          EMAIL
        </label>
        <input
          id="invitacion-email"
          name="email"
          type="email"
          defaultValue={INVITACION.email}
          className="mb-[18px] w-full rounded-chip border-[1.5px] border-field-line bg-white px-4 py-3.5 text-[15px] text-ink outline-none placeholder:text-field-hint"
        />

        <label
          htmlFor="invitacion-password"
          className="mb-2 block text-[12px] font-bold tracking-[0.7px] text-ink-muted"
        >
          CREAR CONTRASEÑA
        </label>
        <input
          id="invitacion-password"
          name="password"
          type="password"
          className="mb-[18px] w-full rounded-chip border-[1.5px] border-[#f2a78e] bg-white px-4 py-3.5 text-[15px] text-ink outline-none placeholder:text-field-hint"
        />

        <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#fbf1d6] px-4 py-3.5">
          <input
            type="checkbox"
            name="autorizacion"
            defaultChecked
            className="peer sr-only"
          />
          <span className="mt-px flex h-6 w-6 flex-none items-center justify-center rounded-[8px] border-[1.5px] border-[#5fb97e] bg-white transition-colors peer-checked:border-[#5fb97e] peer-checked:bg-[#5fb97e] peer-focus-visible:ring-2 peer-focus-visible:ring-[#5fb97e] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#fbf1d6]">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className="text-sm leading-[1.45] text-[#8a7234]">
            Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro
            de la app.
          </span>
        </label>

        <button
          type="button"
          className="w-full rounded-[15px] bg-linear-to-b from-[#f4977e] to-coral p-[15px] text-base font-extrabold text-white shadow-cta transition-opacity hover:opacity-95"
        >
          Activar mi cuenta
        </button>

        <p className="mt-[22px] text-center text-[14.5px] text-ink-muted">
          ¿Ya tenés cuenta?{" "}
          <a href="/login" className="font-extrabold text-coral-link">
            Iniciar sesión
          </a>
        </p>
      </div>
    </main>
  );
}
