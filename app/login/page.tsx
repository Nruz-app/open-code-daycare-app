import type { Metadata } from "next";

import { loginAsStaff } from "@/app/login/actions";

export const metadata: Metadata = {
  title: "Entrar · OpenDayCare",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="w-full max-w-[420px] rounded-card border border-line bg-surface px-7 py-8 shadow-card">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-linear-to-br from-[#f8c3a8] to-[#f2937a]">
            <svg
              width="22"
              height="22"
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
          <span className="font-display text-lg font-semibold text-ink">
            OpenDayCare
          </span>
        </div>

        <h1 className="mt-6 font-display text-[26px] font-semibold leading-tight text-ink">
          Hola de nuevo
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
          Entra al portal del personal para ver el feed de la guardería.
        </p>

        <div className="mt-6 rounded-box border border-line-soft bg-cream p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-[#f2937a] font-display text-base font-semibold text-white">
              C
            </div>
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-ink">
                Caro Giménez
              </div>
              <div className="text-xs text-ink-soft">Sala Soles · Personal</div>
            </div>
          </div>

          <form action={loginAsStaff}>
            <button
              type="submit"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-chip bg-linear-to-b from-[#f4977e] to-coral px-3 py-3 text-[14.5px] font-extrabold text-white shadow-cta transition-opacity hover:opacity-95"
            >
              Entrar al feed
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
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-ink-soft">
          Acceso de demostración: todavía no hay contraseñas ni base de datos.
          El portal de familias estará disponible más adelante.
        </p>
      </div>
    </main>
  );
}
