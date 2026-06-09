import type { CSSProperties } from "react";

interface Props {
  online: boolean;
  timezone?: string | null;
  localTime?: string | null;
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

export default function SystemStatusCard({
  online,
  timezone,
  localTime,
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
          {localTime ?? "--:--:--"}
        </div>
        <div className="system-status-card__timezone">
          {timezone ?? ""}
        </div>
        <div className="system-status-card__subtext">Local time</div>
      </div>
    </div>
  );
}
