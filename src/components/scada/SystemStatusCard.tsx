import type { CSSProperties } from "react";

interface Props {
  online: boolean;
  timezone?: string | null;
  localTime?: string | null;
  clockOffsetSeconds?: number | null;
  filterStatus?: string | null;
  compact?: boolean;
}

function normalizeStatusText(value?: string | null): string | null {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized.toUpperCase() : null;
}

function getFilterStatusColor(status: string): string {
  const normalized = status.toUpperCase();

  if (
    normalized.includes("NO CONNECTION") ||
    normalized.includes("NO CONEXION") ||
    normalized.includes("OFFLINE") ||
    normalized.includes("DISCONNECTED")
  ) {
    return "#64748b";
  }
  if (normalized.includes("MOVING") || normalized.includes("MOVIEND")) {
    return "#0000ff";
  }
  if (
    normalized.includes("FAILURE") ||
    normalized.includes("FAULT") ||
    normalized.includes("FALLA") ||
    normalized.includes("ALARM") ||
    normalized.includes("ERROR")
  ) {
    return "#ffff00";
  }
  if (normalized.includes("RUNNING") || normalized.includes("FUNCIONANDO")) {
    return "#00ff00";
  }
  if (normalized.includes("BACKWASH") || normalized.includes("RETROLAVADO")) {
    return "#d97706";
  }
  if (
    normalized.includes("STOP") ||
    normalized.includes("DISABLED") ||
    normalized.includes("UNKNOWN") ||
    normalized.includes("DETEN") ||
    normalized.includes("DESHABILITADO") ||
    normalized.includes("DESCONOCIDO")
  ) {
    return "#ff0000";
  }
  if (normalized.includes("NO DATA") || normalized.includes("SIN DATO")) {
    return "#64748b";
  }
  return "#059669";
}

function getFilterStatusTextColor(color: string | null): string {
  switch (color) {
    case "#0000ff":
    case "#ff0000":
    case "#64748b":
      return "#ffffff";
    default:
      return "#334155";
  }
}

function getFilterStatusBorderColor(color: string | null): string {
  switch (color) {
    case "#00ff00":
      return "#059669";
    case "#0000ff":
      return "#1d4ed8";
    case "#ffff00":
      return "#9a8100";
    case "#ff0000":
      return "#b91c1c";
    case "#d97706":
      return "#9a5b00";
    case "#64748b":
      return "#475569";
    default:
      return "#047857";
  }
}

function applyClockOffset(
  localTime: string | null | undefined,
  offsetSeconds: number | null | undefined,
): string {
  const normalizedTime = String(localTime ?? "").trim();
  const match = normalizedTime.match(/^(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return normalizedTime || "--:--:--";

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const offset = Number(offsetSeconds ?? 0);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    !Number.isFinite(offset)
  ) {
    return normalizedTime;
  }

  const secondsPerDay = 24 * 60 * 60;
  const totalSeconds = (
    hours * 60 * 60 +
    minutes * 60 +
    seconds +
    Math.trunc(offset)
  );
  const wrappedSeconds = ((totalSeconds % secondsPerDay) + secondsPerDay) % secondsPerDay;
  const adjustedHours = Math.floor(wrappedSeconds / 3600);
  const adjustedMinutes = Math.floor((wrappedSeconds % 3600) / 60);
  const adjustedSeconds = wrappedSeconds % 60;

  return [adjustedHours, adjustedMinutes, adjustedSeconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export default function SystemStatusCard({
  online,
  timezone,
  localTime,
  clockOffsetSeconds,
  filterStatus,
  compact = false,
}: Props) {
  const statusLabel = online ? "ONLINE" : "NO CONNECTION";
  const normalizedFilterStatus = normalizeStatusText(filterStatus);
  const filterColor = normalizedFilterStatus
    ? getFilterStatusColor(normalizedFilterStatus)
    : null;

  return (
    <div
      className={[
        "system-status-card",
        compact ? "system-status-card--compact" : "",
        normalizedFilterStatus ? "system-status-card--with-filter" : "",
      ].filter(Boolean).join(" ")}
      style={
        filterColor
          ? {
              "--system-filter-color": filterColor,
              "--system-filter-text-color": getFilterStatusTextColor(filterColor),
              "--system-filter-border-color": getFilterStatusBorderColor(filterColor),
            } as CSSProperties
          : undefined
      }
    >
      <div className="system-status-card__bar">
        <span className="system-status-card__status">
          <span
            className={[
              "system-status-card__dot",
              online ? "system-status-card__dot--online" : "system-status-card__dot--offline",
            ].join(" ")}
          />
          {statusLabel}
        </span>

        {normalizedFilterStatus ? (
          <>
            <span className="system-status-card__separator">|</span>
            <span className="system-status-card__filter">
              <strong>{normalizedFilterStatus}</strong>
            </span>
          </>
        ) : null}
      </div>

      <div className="system-status-card__body">
        <div className="system-status-card__time">
          {applyClockOffset(localTime, clockOffsetSeconds)}
        </div>
        <div className="system-status-card__timezone">
          {timezone ?? ""}
        </div>
        <div className="system-status-card__subtext">Local time</div>
      </div>
    </div>
  );
}
