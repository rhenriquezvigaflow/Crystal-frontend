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

  const userTimeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;

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
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
  <div className="text-sm font-semibold text-slate-700 mb-4">
    Estado Bombas
  </div>

  <div className="flex flex-col gap-4">
    {Object.entries(pumps).map(([id, pump]) => {
      const isActive = pump.active === true;

      return (
        <div
          key={id}
          className={`flex items-start justify-between rounded-xl px-3 py-2 transition
            ${isActive ? "bg-emerald-50" : "bg-transparent"}
          `}
        >
          {/* LEFT */}
          <div className="flex items-start gap-3">
            <span
              className={`mt-1 w-3 h-3 rounded-full
                ${isActive ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]"
                           : "bg-slate-300"}
              `}
            />

            <div>
              <div className="text-sm font-medium text-slate-800">
                {pump.label}
              </div>

              <div className="text-[11px] text-slate-500">
               ON: {formatPumpTime(pump.updated_at).replace(",", "  -  ")}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div
            className={`text-xs font-semibold tracking-wide
              ${isActive ? "text-emerald-600" : "text-slate-400"}
            `}
          >
            {isActive ? "ACTIVA" : "INACTIVA"}
          </div>
        </div>
      );
    })}
  </div>
</div>
  );
}
