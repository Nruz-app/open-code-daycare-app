"use client";

import { useActionState } from "react";

import { login, type LoginEstado } from "@/app/login/actions";

type LoginFormProps = {
  /** Valor crudo de `?next=`; la acción de servidor lo valida. */
  next?: string;
};

/**
 * Bloque derecho de /login (references/pantallas/login.dc.html).
 * Acceso real con Supabase Auth: una sola forma de entrar, por persona.
 */
export function LoginForm({ next }: LoginFormProps) {
  const [estado, action, pendiente] = useActionState<LoginEstado, FormData>(
    login,
    null,
  );

  return (
    <form action={action} className="w-full max-w-[392px]">
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
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4-1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </div>

        <h2 className="mb-1.5 font-display text-[30px] font-semibold text-ink">
          Iniciar sesión
        </h2>
        <p className="mb-7 text-[15px] text-ink-muted">
          Ingresá para ver el día de hoy.
        </p>

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
          autoComplete="email"
          required
          placeholder="tu@email.com"
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
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="mb-2.5 w-full rounded-chip border-[1.5px] border-field-line bg-white px-4 py-3.5 text-[15px] text-ink outline-none placeholder:text-field-hint"
        />

        {estado?.error ? (
          <p
            role="alert"
            className="mb-4 rounded-[12px] bg-coral-soft px-4 py-3 text-[13.5px] font-bold text-coral-deep"
          >
            {estado.error}
          </p>
        ) : null}

        <div className="mb-5 text-right">
          <span className="cursor-pointer text-[13.5px] font-bold text-coral-link">
            ¿Olvidaste tu contraseña?
          </span>
        </div>

        <button
          type="submit"
          disabled={pendiente}
          className={`w-full rounded-[15px] bg-linear-to-b from-[#f4977e] to-coral p-[15px] text-base font-extrabold text-white shadow-cta transition-opacity ${
            pendiente ? "cursor-wait opacity-70" : "hover:opacity-95"
          }`}
        >
          {pendiente ? "Ingresando…" : "Iniciar sesión"}
        </button>

        <p className="mt-3 text-center text-[12.5px] text-ink-muted">
          Demo:{" "}
          <span className="font-bold text-ink">
            staff@guarderia-demo.test / demo1234
          </span>
        </p>

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
