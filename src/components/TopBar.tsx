import type { LagoonAccess } from "../api/lagoonsApi";
import HeaderActions from "./header/HeaderActions";
import HeaderBrand from "./header/HeaderBrand";
import LagoonSelector from "./header/LagoonSelector";

interface Props {
  lagoons: LagoonAccess[];
  selectedLagoonId: string | null;
  onLagoonChange?: (lagoonId: string) => void;
  canEdit?: boolean;
  onOpenAlarms?: () => void;
  onLogout?: () => void;
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

export default function TopBar({
  lagoons,
  selectedLagoonId,
  onLagoonChange,
  canEdit = false,
  onOpenAlarms,
  onLogout,
  onMenuToggle,
  isMenuOpen,
}: Props) {
  return (
    <header className="lagoon-topbar sticky top-0 z-30 mx-2 mt-2 rounded-[18px] px-2.5 py-2.5 sm:mx-4 sm:mt-3 sm:px-4 sm:py-3 lg:mx-6">
      <div className="relative flex flex-col gap-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label={isMenuOpen ? "Cerrar menu lateral" : "Abrir menu lateral"}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-white/85 text-sky-800 shadow-[0_12px_24px_-18px_rgba(29,92,128,0.55)] transition hover:border-sky-200 hover:bg-sky-50 lg:hidden"
          >
            <HamburgerIcon />
          </button>

          <HeaderBrand compact />
          <HeaderActions
            compact
            canEdit={canEdit}
            onOpenAlarms={onOpenAlarms}
            onLogout={onLogout}
          />
        </div>

        <div className="hidden min-w-0 items-center gap-4 md:flex">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={onMenuToggle}
              aria-label={isMenuOpen ? "Cerrar menu lateral" : "Abrir menu lateral"}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-white/85 text-sky-800 shadow-[0_12px_24px_-18px_rgba(29,92,128,0.55)] transition hover:border-sky-200 hover:bg-sky-50 lg:hidden"
            >
              <HamburgerIcon />
            </button>
            <HeaderBrand />
          </div>

          <LagoonSelector
            lagoons={lagoons}
            selectedLagoonId={selectedLagoonId}
            onLagoonChange={onLagoonChange}
            className="w-full flex-1 md:max-w-md"
          />

          <HeaderActions
            canEdit={canEdit}
            onOpenAlarms={onOpenAlarms}
            onLogout={onLogout}
          />
        </div>

        <LagoonSelector
          lagoons={lagoons}
          selectedLagoonId={selectedLagoonId}
          onLagoonChange={onLagoonChange}
          className="md:hidden"
        />
      </div>
    </header>
  );
}
