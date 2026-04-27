import { memo } from "react";

import {
  buildScadaOverlayStyle,
  type ScadaOverlayPlacement,
} from "../../scada/scadaLayoutPosition";
import type { ScadaLayoutPosition } from "../../types/scada-layouts";

interface Props {
  status?: "online" | "offline";
  localTime?: string | null;
  timezone?: string | null;
  position?: ScadaLayoutPosition | null;
  scale?: number;
  placement?: ScadaOverlayPlacement | null;
}

function PlcStatusComponent({ status, localTime, timezone, position, scale = 1, placement }: Props) {
  const effectiveScale = placement?.scale ?? scale;
  const overlayStyle = placement?.style ?? (
    position?.left && position.top
      ? buildScadaOverlayStyle(position, effectiveScale)
      : null
  );

  if (!overlayStyle) return null;

  const isOnline = status === "online";
  const statusLabel = isOnline ? "En linea" : "Desconectado";

  if (effectiveScale < 0.75) {
    return (
      <div
        className="absolute text-center"
        title={`${statusLabel}${timezone ? ` - ${timezone}` : ""}`}
        style={{
          ...overlayStyle,
          width: "92px",
        }}
      >
        <div className="rounded-[5px] border border-slate-200 bg-white/95 px-1.5 py-1 shadow-sm">
          <div className="flex items-center justify-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className={`text-[8px] font-semibold uppercase tracking-[0.04em] ${isOnline ? "text-emerald-700" : "text-red-700"}`}>
              {statusLabel}
            </span>
          </div>
          <div className="mt-0.5 text-[12px] font-bold leading-none text-slate-900" style={{ fontVariantNumeric: "tabular-nums" }}>
            {localTime ?? "--:--:--"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute text-center"
      style={{
        ...overlayStyle,
        width: "clamp(170px, 20vw, 250px)",
      }}
    >
      <div className="rounded-[14px] border border-slate-200 bg-white/96 px-4 py-3 shadow-[0_22px_48px_-26px_rgba(15,23,42,0.45)] sm:px-5 sm:py-4">
        <div className="flex items-center justify-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`} />
          <span className={`text-[clamp(10px,0.85vw,14px)] font-semibold uppercase tracking-[0.08em] ${isOnline ? "text-emerald-700" : "text-red-700"}`}>
            {statusLabel}
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
