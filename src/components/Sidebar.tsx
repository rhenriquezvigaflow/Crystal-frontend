import { useNavigate, useLocation } from "react-router-dom";
import { lagoons } from "../data/lagoons";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="relative h-full px-4 pt-4 bg-linear-to-b from-sky-100 via-sky-50 to-white">
      <div className="pointer-events-none absolute top-0 right-0 h-full w-2 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.15)]" />

      <div className="mb-4 text-xl font-semibold text-slate-700">
        Crystal Lagoons
      </div>

      <nav className="space-y-1">
        {lagoons.map((lagoon) => {
          const active = location.pathname === `/lagoon/${lagoon.id}`;

          return (
            <button
              key={lagoon.id}
              onClick={() => navigate(`/lagoon/${lagoon.id}`)}
              className={[
                "w-full rounded-xl px-3 py-2 text-left text-sm transition",
                active
                  ? "bg-white/90 text-slate-900 font-semibold"
                  : "text-slate-700 hover:bg-white/80",
              ].join(" ")}
            >
              {lagoon.name}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
