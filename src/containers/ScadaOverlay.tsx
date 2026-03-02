/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  layout: any;
  tags: Record<string, any>;
  plc_status?: "online" | "offline";
  local_time?: string | null;
  timezone?: string | null;
}

export default function ScadaOverlay({
  layout,
  tags,
  plc_status,
  local_time,
  timezone,
}: Props) {
  if (!layout?.kpis) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {layout.kpis.map((item: any) => {
        if (item.type === "kpi") {
          const value = tags?.[item.backendTag];
          if (value === undefined || value === null) return null;

          const formatted =
            typeof value === "number" ? value.toFixed(2) : String(value);

          return (
            <div
              key={item.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
              style={{
                top: item.position?.top,
                left: item.position?.left,
                textShadow: "0 1px 2px rgba(255,255,255,0.92)",
              }}
            >
              <div className="flex items-baseline justify-center gap-1">
                <span
                  className="text-[clamp(11px,0.95vw,16px)] font-semibold leading-none text-slate-900"
                  style={{
                    fontVariantNumeric: "tabular-nums",
                    textAlign: "right",
                  }}
                >
                  {formatted}
                </span>

                {item.unit && (
                  <span className="text-[clamp(9px,0.72vw,12px)] text-slate-700">
                    {item.unit}
                  </span>
                )}
              </div>
            </div>
          );
        }

        if (item.type === "plc_status") {
          const isOnline = plc_status === "online";

          return (
            <div
              key={item.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
              style={{
                top: item.position?.top,
                left: item.position?.left,
                width: "clamp(170px, 20vw, 250px)",
              }}
            >
              <div className="rounded-[14px] border border-slate-200 bg-white/96 px-4 py-3 shadow-[0_22px_48px_-26px_rgba(15,23,42,0.45)] sm:px-5 sm:py-4">
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isOnline ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />

                  <span
                    className={`text-[clamp(10px,0.85vw,14px)] font-semibold tracking-[0.08em] uppercase ${
                      isOnline ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {isOnline ? "En linea" : "Desconectado"}
                  </span>
                </div>

                <div
                  className="mt-2 text-[clamp(15px,1.25vw,22px)] font-bold text-slate-900"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {local_time ?? "--:--:--"}
                </div>

                <div className="mt-1 text-[clamp(9px,0.7vw,11px)] font-medium text-slate-500">
                  {timezone ?? ""}
                </div>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
