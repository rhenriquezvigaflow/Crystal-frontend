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
    <div className="absolute inset-0 pointer-events-none z-50">
      {layout.kpis.map((item: any) => {
        // ===============================
        // KPI NORMAL
        // ===============================
        if (item.type === "kpi") {
          const value = tags?.[item.backendTag];
          if (value === undefined || value === null) return null;

          const formatted =
            typeof value === "number"
              ? value.toFixed(2)
              : String(value);

          return (
            <div
              key={item.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                top: item.position?.top,
                left: item.position?.left,
              }}
            >
              <div className="flex items-baseline justify-center gap-1">
                <span
                  className="font-semibold text-[12px] md:text-[13px]"
                  style={{
                    fontVariantNumeric: "tabular-nums",
                    width: "60px",
                    display: "inline-block",
                    textAlign: "right",
                  }}
                >
                  {formatted}
                </span>

                {item.unit && (
                  <span className="text-[10px] md:text-[11px] italic text-slate-700">
                    {item.unit}
                  </span>
                )}
              </div>
            </div>
          );
        }

        // ===============================
        // PLC STATUS + RELOJ (RESTORED)
        // ===============================
        if (item.type === "plc_status") {
          const isOnline = plc_status === "online";

          return (
            <div
              key={item.id}
              className="
                absolute
                -translate-x-1/2
                -translate-y-1/2
                bg-white
                rounded-xl
                border
                border-slate-300
                shadow-md
                px-6
                py-4
                w-[16%]
                min-w-[200px]
                max-w-[280px]
                text-center
              "
              style={{
                top: item.position?.top,
                left: item.position?.left,
              }}
            >
              {/* STATUS */}
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isOnline ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />

                <span
                  className={`text-sm font-semibold ${
                    isOnline ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {isOnline ? "En línea" : "Desconectado"}
                </span>
              </div>

              {/* HORA */}
              <div
                className="mt-2 text-[16px] font-bold text-slate-800"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {local_time ?? "--:--:--"}
              </div>

              {/* TIMEZONE */}
              <div className="mt-1 text-[10px] text-slate-500">
                {timezone ?? ""}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}