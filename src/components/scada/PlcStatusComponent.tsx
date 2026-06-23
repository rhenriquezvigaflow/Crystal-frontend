import { memo } from "react";

import {
  buildScadaOverlayStyle,
  type ScadaOverlayPlacement,
} from "../../scada/scadaLayoutPosition";
import type { ScadaLayoutPosition } from "../../types/scada-layouts";
import SystemStatusCard from "./SystemStatusCard";

interface Props {
  status?: "online" | "offline";
  localTime?: string | null;
  timezone?: string | null;
  clockOffsetSeconds?: number | null;
  filterStatus?: string | null;
  position?: ScadaLayoutPosition | null;
  scale?: number;
  placement?: ScadaOverlayPlacement | null;
}

function PlcStatusComponent({
  status,
  localTime,
  timezone,
  clockOffsetSeconds,
  filterStatus,
  position,
  scale = 1,
  placement,
}: Props) {
  const effectiveScale = placement?.scale ?? scale;
  const overlayStyle = placement?.style ?? (
    position?.left && position.top
      ? buildScadaOverlayStyle(position, effectiveScale)
      : null
  );

  if (!overlayStyle) return null;

  const isOnline = status === "online";
  const hasFilterStatus = Boolean(String(filterStatus ?? "").trim());

  if (effectiveScale < 0.75) {
    return (
      <div
        className="absolute text-center"
        title={`${isOnline ? "Online" : "Offline"}${timezone ? ` - ${timezone}` : ""}`}
        style={{
          ...overlayStyle,
          width: hasFilterStatus ? "136px" : "92px",
        }}
      >
        <SystemStatusCard
          online={isOnline}
          localTime={localTime}
          timezone={timezone}
          clockOffsetSeconds={clockOffsetSeconds}
          filterStatus={filterStatus}
          compact
        />
      </div>
    );
  }

  return (
    <div
      className="absolute text-center"
      style={{
        ...overlayStyle,
        width: hasFilterStatus
          ? "clamp(260px, 22vw, 290px)"
          : "clamp(170px, 18vw, 230px)",
      }}
    >
      <SystemStatusCard
        online={isOnline}
        localTime={localTime}
        timezone={timezone}
        clockOffsetSeconds={clockOffsetSeconds}
        filterStatus={filterStatus}
      />
    </div>
  );
}

export default memo(PlcStatusComponent);
