import { memo } from "react";
import type { ScadaLayoutPosition } from "../../types/scada-layouts";

interface Props {
  status?: "online" | "offline";
  localTime?: string | null;
  timezone?: string | null;
  position?: ScadaLayoutPosition | null;
}

function PlcStatusComponent({ status, localTime, timezone, position }: Props) {
  if (!position?.top || !position?.left) return null;

  const isOnline = status === "online";

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
      style={{
        top: position.top,
        left: position.left,
        width: "clamp(170px, 20vw, 250px)",
      }}
    >
      <div className="rounded-[14px] border border-slate-200 bg-white/96 px-4 py-3 shadow-[0_22px_48px_-26px_rgba(15,23,42,0.45)] sm:px-5 sm:py-4">
        <div className="flex items-center justify-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`} />
          <span className={`text-[clamp(10px,0.85vw,14px)] font-semibold uppercase tracking-[0.08em] ${isOnline ? "text-emerald-700" : "text-red-700"}`}>
            {isOnline ? "En linea" : "Desconectado"}
          </span>
        </div>
        <div className="mt-2 text-[clamp(15px,1.25vw,22px)] font-bold text-slate-900" style={{ fontVariantNumeric: "tabular-nums" }}>
          {localTime ?? "--:--:--"}
        </div>
        <div className="mt-1 text-[clamp(9px,0.7vw,11px)] font-medium text-slate-500">{timezone ?? ""}</div>
        <div className="mt-1 text-[clamp(9px,0.7vw,11px)] font-medium text-slate-500">Hora Local</div>
      </div>
    </div>
  );
}

export default memo(PlcStatusComponent);
