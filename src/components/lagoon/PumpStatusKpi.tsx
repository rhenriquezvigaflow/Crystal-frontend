interface PumpInfo {
  label: string;
  active: boolean | null;
  updated_at: string | null;
}

interface Props {
  pumps: Record<string, PumpInfo>;
}

/* =======================
   Helpers
======================= */
function formatPumpTime(iso?: string | null) {
  if (!iso) return "—";

  const date = new Date(iso);
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return date
    .toLocaleString("es-CL", {
      timeZone: userTimeZone,
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", " -");
}

/* =======================
   Component
======================= */

export default function PumpStatusKpi({ pumps }: Props) {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm">
      {/* HEADER */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="text-sm font-semibold text-slate-700">
          Estado Bombas
        </div>
      </div>

      {/* HORIZONTAL STATUS BAR */}
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-4
          divide-y sm:divide-y-0
          sm:divide-x
          divide-slate-200
        "
      >
        {Object.entries(pumps).map(([id, pump]) => {
          const isActive = pump.active === true;

          return (
            <div
              key={id}
              className={`px-4 py-3 flex flex-col gap-1
                ${isActive ? "bg-emerald-50/50" : ""}
              `}
            >
              {/* TOP ROW */}
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-3 h-3 rounded-full shrink-0
                    ${
                      isActive
                        ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]"
                        : "bg-slate-300"
                    }
                  `}
                />

                <span className="text-sm font-medium text-slate-800 truncate">
                  {pump.label}
                </span>
              </div>

              {/* BOTTOM ROW */}
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-semibold tracking-wide
                    ${isActive ? "text-emerald-600" : "text-slate-400"}
                  `}
                >
                  {isActive ? "ACTIVA" : "INACTIVA"}
                </span>

                <span className="text-slate-500">
                  {formatPumpTime(pump.updated_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
