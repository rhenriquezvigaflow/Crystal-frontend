import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import LagoonContainer from "../components/lagoonContainer";
import { useAuth } from "../auth/AuthContext";
import { useLagoons } from "../lagoons/LagoonsContext";

const AlarmManagerModal = lazy(() => import("../components/AlarmManagerModal"));

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

type FullscreenMessageProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

function FullscreenMessage({ message, actionLabel, onAction }: FullscreenMessageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-700 shadow-sm">
        <p>{message}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function LagoonsView() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { lagoonId: rawLagoonId } = useParams<{ lagoonId: string }>();
  const lagoonId = useMemo(
    () => (rawLagoonId ? safeDecode(rawLagoonId) : null),
    [rawLagoonId],
  );
  const { lagoons, loading, error, errorStatus, getLagoonById } = useLagoons();

  const selectedLagoon = useMemo(
    () => (lagoonId ? getLagoonById(lagoonId) : null),
    [getLagoonById, lagoonId],
  );
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [realtimePtFitTags, setRealtimePtFitTags] = useState<string[]>([]);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [lagoonId]);

  useEffect(() => {
    setIsAlarmModalOpen(false);
    setRealtimePtFitTags([]);
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

  const handleRealtimePtFitTagsChange = useCallback((nextTags: string[]) => {
    setRealtimePtFitTags((previous) => {
      if (previous.length === nextTags.length) {
        const unchanged = previous.every((value, index) => value === nextTags[index]);
        if (unchanged) return previous;
      }
      return nextTags;
    });
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (loading && !lagoons.length) {
    return <FullscreenMessage message="Cargando lagunas..." />;
  }

  if (errorStatus === 403) {
    return <FullscreenMessage message="Acceso no permitido" />;
  }

  if (error) {
    return <FullscreenMessage message={error} />;
  }

  if (!lagoons.length) {
    return (
      <FullscreenMessage
        message="No hay lagunas disponibles para tu usuario."
        actionLabel="Cerrar sesion"
        onAction={handleLogout}
      />
    );
  }

  if (!selectedLagoon) {
    return <FullscreenMessage message="Acceso no permitido" />;
  }

  const handleLagoonChange = (nextLagoonId: string) => {
    if (!nextLagoonId) return;

    if (nextLagoonId === selectedLagoon.lagoon_id) {
      setIsMobileNavOpen(false);
      return;
    }

    navigate(`/lagoon/${encodeURIComponent(nextLagoonId)}`);
    setIsMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[260px_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]">
        <div className="hidden lg:row-span-2 lg:block">
          <Sidebar lagoons={lagoons} selectedLagoonId={selectedLagoon.lagoon_id} />
        </div>

        <TopBar
          lagoons={lagoons}
          selectedLagoonId={selectedLagoon.lagoon_id}
          onLagoonChange={handleLagoonChange}
          canEdit={selectedLagoon.can_edit}
          onOpenAlarms={() => setIsAlarmModalOpen(true)}
          onLogout={handleLogout}
          onMenuToggle={() => setIsMobileNavOpen((open) => !open)}
          isMenuOpen={isMobileNavOpen}
        />

        <div className="px-2 pb-4 pt-2 sm:px-3 lg:px-3 lg:pb-4 lg:pt-1">
          <LagoonContainer
            lagoon={selectedLagoon}
            onRealtimePtFitTagsChange={handleRealtimePtFitTagsChange}
          />
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
              lagoons={lagoons}
              selectedLagoonId={selectedLagoon.lagoon_id}
              onNavigate={() => setIsMobileNavOpen(false)}
              className="shadow-[0_22px_48px_-24px_rgba(15,23,42,0.55)]"
            />
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        {isAlarmModalOpen ? (
          <AlarmManagerModal
            open={isAlarmModalOpen}
            lagoonId={selectedLagoon.lagoon_id}
            wsTagIds={realtimePtFitTags}
            canEdit={selectedLagoon.can_edit}
            onClose={() => setIsAlarmModalOpen(false)}
          />
        ) : null}
      </Suspense>
    </div>
  );
}
