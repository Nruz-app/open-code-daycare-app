import { logout } from "@/app/login/actions";

function IconoLogout() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

type LogoutButtonProps = {
  /** Botón ancho con el texto "Cerrar sesión", para la sidebar de escritorio. */
  conTexto?: boolean;
};

/**
 * Cierre de sesión como formulario con Server Action: funciona sin JavaScript
 * de cliente. Se usa en la sidebar de escritorio y en la cabecera móvil.
 */
export function LogoutButton({ conTexto = false }: LogoutButtonProps) {
  if (conTexto) {
    return (
      <form action={logout}>
        <button
          type="submit"
          className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-line bg-cream px-3 py-2.5 text-[13.5px] font-extrabold text-ink-muted transition-colors hover:border-coral hover:bg-coral-soft hover:text-coral-deep"
        >
          <IconoLogout />
          Cerrar sesión
        </button>
      </form>
    );
  }

  return (
    <form action={logout} className="flex-none">
      <button
        type="submit"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[10px] bg-cream text-ink-muted"
      >
        <IconoLogout />
      </button>
    </form>
  );
}
