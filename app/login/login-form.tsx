"use client";

import { useState } from "react";

import { loginAsStaff } from "@/app/login/actions";

type RolDemo = "staff" | "family";

const EMAIL_BY_ROL: Record<RolDemo, string> = {
  staff: "caro@opendaycare.com",
  family: "lucia.fernandez@gmail.com",
};

type LoginFormProps = {
  /** Valor crudo de `?next=`; la acción de servidor lo valida. */
  next?: string;
};

/**
 * Bloque derecho de /login (references/pantallas/login.dc.html).
 * El selector cambia el email de demostración; solo Personal autentica.
 */
export function LoginForm({ next }: LoginFormProps) {
  const [rol, setRol] = useState<RolDemo>("staff");
  const [email, setEmail] = useState(EMAIL_BY_ROL.staff);

  function elegirRol(nuevo: RolDemo) {
    setRol(nuevo);
    setEmail(EMAIL_BY_ROL[nuevo]);
  }

  const baseSelector =
    "flex flex-1 items-center gap-[9px] rounded-chip border-[1.5px] px-3.5 py-[13px] text-sm font-bold transition-colors";
  const selectorClass = (activo: boolean) =>
    `${baseSelector} ${
      activo
        ? "border-[#f2937a] bg-coral-soft text-coral-deep"
        : "border-field-line bg-white text-[#6e6359]"
    }`;
  const soloPersonal = rol === "family";

  return (
    <form action={loginAsStaff} className="w-full max-w-[392px]">
      <input type="hidden" name="next" value={next ?? ""} />

      <div className="w-full">
        <div className="mb-[22px] flex h-10 w-10 items-center justify-center rounded-[12px] bg-[linear-gradient(155deg,#f8c3a8,#f2937a)] shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)] md:hidden">
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

        <h2 className="mb-1.5 font-display text-[30px] font-semibold text-ink">
          Iniciar sesión
        </h2>
        <p className="mb-7 text-[15px] text-ink-muted">
          Ingresá para ver el día de hoy.
        </p>

        <div className="mb-[9px] text-[12px] font-bold tracking-[0.7px] text-ink-muted">
          INGRESO COMO
        </div>
        <div className="mb-[22px] flex gap-2.5">
          <button
            type="button"
            onClick={() => elegirRol("staff")}
            aria-pressed={rol === "staff"}
            className={selectorClass(rol === "staff")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Personal
          </button>
          <button
            type="button"
            onClick={() => elegirRol("family")}
            aria-pressed={rol === "family"}
            className={selectorClass(rol === "family")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Familia
          </button>
        </div>

        <label
          htmlFor="login-email"
          className="mb-2 block text-[12px] font-bold tracking-[0.7px] text-ink-muted"
        >
          EMAIL
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mb-[18px] w-full rounded-chip border-[1.5px] border-field-line bg-white px-4 py-3.5 text-[15px] text-ink outline-none placeholder:text-field-hint"
        />

        <label
          htmlFor="login-password"
          className="mb-2 block text-[12px] font-bold tracking-[0.7px] text-ink-muted"
        >
          CONTRASEÑA
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          placeholder="••••••••"
          className="mb-2.5 w-full rounded-chip border-[1.5px] border-field-line bg-white px-4 py-3.5 text-[15px] text-ink outline-none placeholder:text-field-hint"
        />

        <div className="mb-5 text-right">
          <span className="cursor-pointer text-[13.5px] font-bold text-coral-link">
            ¿Olvidaste tu contraseña?
          </span>
        </div>

        <button
          type="submit"
          disabled={soloPersonal}
          aria-describedby={soloPersonal ? "login-aviso-familia" : undefined}
          className={`w-full rounded-[15px] bg-linear-to-b from-[#f4977e] to-coral p-[15px] text-base font-extrabold text-white shadow-cta transition-opacity ${
            soloPersonal
              ? "cursor-not-allowed opacity-60"
              : "hover:opacity-95"
          }`}
        >
          Iniciar sesión
        </button>

        {soloPersonal ? (
          <p
            id="login-aviso-familia"
            className="mt-3 text-center text-[13.5px] text-ink-muted"
          >
            El portal de familias llega pronto.
          </p>
        ) : null}

        <p className="mt-6 text-center text-[14.5px] text-ink-muted">
          ¿Te invitó la guardería?{" "}
          <a href="/activar-cuenta" className="font-extrabold text-coral-link">
            Activá tu cuenta
          </a>
        </p>
      </div>
    </form>
  );
}
