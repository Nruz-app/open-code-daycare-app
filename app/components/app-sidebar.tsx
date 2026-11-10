import type { ReactNode } from "react";

type NavKey = "feed" | "ninos" | "avisos" | "cuenta";

type NavItem = {
  key: NavKey;
  label: string;
  href: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  {
    key: "feed",
    label: "Feed",
    href: "/feed",
    icon: (
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    key: "ninos",
    label: "Niños",
    href: "/ninos",
    icon: (
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="7" r="3" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" />
      </svg>
    ),
  },
  {
    key: "avisos",
    label: "Avisos",
    href: "#",
    icon: (
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    ),
  },
  {
    key: "cuenta",
    label: "Mi cuenta",
    href: "#",
    icon: (
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

type AppSidebarProps = {
  /** Ítem de navegación que se muestra como activo. */
  active?: NavKey;
};

export function AppSidebar({ active = "feed" }: AppSidebarProps) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-surface px-4 pt-2.5 md:hidden">
        <div className="flex items-center gap-2.5">
          <a href="#" className="flex items-center gap-2">
            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-linear-to-br from-[#f8c3a8] to-[#f2937a]">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            </div>
            <span className="font-display text-[15px] font-semibold text-ink">
              OpenDayCare
            </span>
          </a>
          <span className="flex-1" />
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#f2937a] font-display text-sm font-semibold text-white">
            C
          </div>
        </div>

        <nav
          aria-label="Navegación principal"
          className="mt-2 flex items-center gap-0.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              aria-current={item.key === active ? "page" : undefined}
              className={
                item.key === active
                  ? "flex shrink-0 items-center gap-1.5 rounded-xl bg-coral-soft px-2 py-2 text-[12.5px] font-extrabold text-coral-deep"
                  : "flex shrink-0 items-center gap-1.5 rounded-xl px-2 py-2 text-[12.5px] font-semibold text-[#6e6359]"
              }
            >
              {item.icon}
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <aside className="hidden md:flex w-[248px] flex-none flex-col bg-surface border-r border-line px-4 py-6 sticky top-0 h-screen">
      <a
        href="#"
        className="flex items-center gap-[11px] px-2 pb-[22px] pt-1"
      >
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-linear-to-br from-[#f8c3a8] to-[#f2937a]">
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </div>
        <div>
          <div className="font-display text-[17px] font-semibold leading-none text-ink">
            OpenDayCare
          </div>
          <div className="mt-0.5 text-[11.5px] text-ink-soft">Sala Soles</div>
        </div>
      </a>

      <a
        href="#"
        className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-chip bg-linear-to-b from-[#f4977e] to-coral px-3 py-3 text-[14.5px] font-extrabold text-white shadow-cta"
      >
        <svg
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
        Nueva publicación
      </a>

      <nav
        aria-label="Navegación principal"
        className="flex flex-1 flex-col gap-1"
      >
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            aria-current={item.key === active ? "page" : undefined}
            className={
              item.key === active
                ? "flex items-center gap-3 rounded-xl bg-coral-soft px-3 py-[11px] text-[14.5px] font-extrabold text-coral-deep"
                : "flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] font-semibold text-[#6e6359]"
            }
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mt-2.5 border-t border-line pt-3.5">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-[#f2937a] font-display text-base font-semibold text-white">
            C
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-ink">Caro Giménez</div>
            <div className="text-xs text-ink-soft">Maestra · Soles</div>
          </div>
          <a
            href="#"
            title="Cerrar sesión"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-cream text-ink-muted"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </a>
        </div>
      </div>
    </aside>
    </>
  );
}
