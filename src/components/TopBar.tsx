interface Props {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 8.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m19.2 15.15.35 1.52-1.51 2.62-1.58.15-1.06 1.2-2.88.05-1.12-1.13-1.56-.12-2.57-1.54-.12-1.56-1.18-1.08-.05-2.94 1.12-1.12.12-1.55 1.5-2.58 1.57-.15 1.08-1.2 2.92-.05 1.1 1.13 1.57.12 2.57 1.54.15 1.57 1.18 1.08.05 2.9-1.13 1.16Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TopBar({ onMenuToggle, isMenuOpen }: Props) {
  return (
    <header className="lagoon-topbar sticky top-0 z-30 mx-4 mt-3 rounded-[18px] px-3 py-3 sm:mx-6">
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label={isMenuOpen ? "Cerrar menu lateral" : "Abrir menu lateral"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-sky-100 bg-white/85 text-sky-800 shadow-[0_12px_24px_-18px_rgba(29,92,128,0.55)] transition hover:border-sky-200 hover:bg-sky-50 lg:hidden"
          >
            <HamburgerIcon />
          </button>

          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-sky-700/70">
              Monitoreo en vivo
            </div>
            <span className="block truncate text-sm font-semibold uppercase tracking-[0.24em] text-slate-900 sm:text-base">
              CRYSTAL LAGOONS
            </span>
          </div>
        </div>

        <div className="hidden flex-1 justify-center px-2 md:flex">
          <input
            type="text"
            placeholder="Buscar en el panel..."
            className="h-10 w-full max-w-md rounded-xl border border-sky-100 bg-white/88 px-4 text-sm text-slate-700 placeholder-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="hidden xl:inline text-sky-800/75">Administrador</span>
          <button
            type="button"
            aria-label="Configuracion"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-sky-100 bg-white/88 text-sky-800 shadow-[0_12px_24px_-18px_rgba(29,92,128,0.55)] transition hover:border-sky-200 hover:bg-sky-50"
          >
            <GearIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
