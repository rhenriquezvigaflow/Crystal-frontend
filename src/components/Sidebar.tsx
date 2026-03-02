import { useLocation, useNavigate } from "react-router-dom";
import { lagoons } from "../data/lagoons";

interface Props {
  onNavigate?: () => void;
  className?: string;
}

export default function Sidebar({ onNavigate, className }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={["lagoon-sidebar relative h-full w-full px-4 pb-6 pt-4", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-full w-2 shadow-[4px_0_18px_-6px_rgba(33,103,150,0.18)]" />

      <div className="relative mb-6 rounded-[16px] border border-white/60 bg-white/68 px-4 py-4 shadow-[0_18px_34px_-24px_rgba(29,92,128,0.4)] backdrop-blur">
        <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-700/70">
          Crystal
        </div>
        <div className="mt-1 text-xl font-semibold tracking-[0.08em] text-slate-800">
          Lagoons
        </div>
        <div className="mt-2 text-xs text-sky-900/70">
          Monitoreo visual de lagunas y estaciones SCADA.
        </div>
      </div>

      <nav className="relative space-y-2">
        {lagoons.map((lagoon) => {
          const active = location.pathname === `/lagoon/${lagoon.id}`;

          return (
            <button
              key={lagoon.id}
              onClick={() => {
                navigate(`/lagoon/${lagoon.id}`);
                onNavigate?.();
              }}
              className={[
                "w-full rounded-[14px] px-4 py-3 text-left text-sm transition",
                active
                  ? "border border-sky-100 bg-white/92 font-semibold text-slate-900 shadow-[0_18px_34px_-24px_rgba(29,92,128,0.45)]"
                  : "text-slate-700 hover:bg-white/72 hover:text-slate-900",
              ].join(" ")}
            >
              <div className="truncate">{lagoon.name}</div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
