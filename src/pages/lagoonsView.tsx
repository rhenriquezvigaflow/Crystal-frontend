import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import LagoonContainer from "../components/lagoonContainer";

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LagoonsView() {
  const { lagoonId } = useParams<{ lagoonId: string }>();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [lagoonId]);

  useEffect(() => {
    if (!isMobileNavOpen) return;

    const originalOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileNavOpen]);

  return (
    <div className="min-h-screen">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[260px_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]">
        <div className="hidden lg:row-span-2 lg:block">
          <Sidebar />
        </div>

        <TopBar
          onMenuToggle={() => setIsMobileNavOpen((open) => !open)}
          isMenuOpen={isMobileNavOpen}
        />

        <div className="px-3 pb-4 pt-2 sm:px-4 lg:px-4 lg:pb-4 lg:pt-1">
          <LagoonContainer lagoonId={lagoonId ?? "--"} />
        </div>
      </div>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menu lateral"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            onClick={() => setIsMobileNavOpen(false)}
          />

          <div className="relative h-full w-[280px] max-w-[86vw]">
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Cerrar menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/70 bg-white/90 text-slate-700 shadow-sm"
              >
                <CloseIcon />
              </button>
            </div>

            <Sidebar
              onNavigate={() => setIsMobileNavOpen(false)}
              className="shadow-[0_22px_48px_-24px_rgba(15,23,42,0.55)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
