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

  if (normalized.includes("BACKWASH")) return "#d97706";
  if (
    normalized.includes("STOP") ||
    normalized.includes("DISABLED") ||
    normalized.includes("UNKNOWN")
  ) {
    return "#d83a3a";
  }
  if (normalized.includes("NO DATA")) return "#64748b";
  return "#059669";
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
  const statusLabel = online ? "ONLINE" : "OFFLINE";
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
          ? { "--system-filter-color": filterColor } as CSSProperties
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
