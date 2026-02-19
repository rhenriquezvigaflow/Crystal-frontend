interface PumpInfo {
  label: string;
  state: number | null;   
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

function getStateConfig(state: number | null) {
  switch (state) {
    case 0:
      return {
        label: "DETENIDA",
        dot: "bg-red-500",
        text: "text-red-600",
        bg: "bg-red-50/60",
      };
    case 1:
      return {
        label: "FUNCIONANDO",
        dot: "bg-emerald-500",
        text: "text-emerald-600",
        bg: "bg-emerald-50/60",
      };
    case 2:
      return {
        label: "MOVIÉNDOSE",
        dot: "bg-blue-500",
        text: "text-blue-600",
        bg: "bg-blue-50/60",
      };
    case 3:
      return {
        label: "FALLA",
        dot: "bg-yellow-500",
        text: "text-yellow-600",
        bg: "bg-yellow-50/60",
      };
    default:
      return {
        label: "DETENIDA",
        dot: "bg-red-500",
        text: "text-red-600",
        bg: "bg-red-50/60",
      };
  }
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

      {/* GRID */}
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
          const config = getStateConfig(pump.state);

          return (
            <div
              key={id}
              className={`px-4 py-3 flex flex-col gap-1 transition-colors ${config.bg}`}
            >
              {/* TOP ROW */}
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-3 h-3 rounded-full shrink-0 ${config.dot}`}
                />

                <span className="text-sm font-medium text-slate-800 truncate">
                  {pump.label}
                </span>
              </div>

              {/* BOTTOM ROW */}
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-semibold tracking-wide ${config.text}`}
                >
                  {config.label}
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
