import { useState } from "react";

import {
  downloadPumpEventsReport,
  type PumpEvent,
} from "../../api/scadaPumpEvents";
import { ApiError } from "../../auth/authApi";
import {
  formatPumpEventTime,
  getPumpEventSortTime,
} from "../../scada/pumpEventTime";
import { DOWNLOAD_URL_REVOKE_DELAY_MS } from "../../config/timing";
import type { ProductType } from "../../modules/shared/product/types";

interface PumpInfo {
  label: string;
  state: number | null;
  events: PumpEvent[];
}

interface Props {
  lagoonId: string;
  productType?: ProductType | null;
  pumps: Record<string, PumpInfo>;
  timezone?: string | null;
  eventsLoading?: boolean;
  eventsError?: string | null;
  eventsEmpty?: boolean;
}

const EVENT_ROWS = 3;

function getEventSortTime(event: PumpEvent): number {
  return getPumpEventSortTime(event.start_local) ?? Number.NEGATIVE_INFINITY;
}

function getTopEvents(events: PumpEvent[]) {
  return [...events]
    .filter((event) => getPumpEventSortTime(event.start_local) !== null)
    .sort((a, b) => getEventSortTime(b) - getEventSortTime(a))
    .slice(0, EVENT_ROWS);
}

function toTitleCaseFromTag(raw: string) {
  return raw
    .replace(/_SCADA$/i, "")
    .replace(/_STS$/i, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function getDisplayPumpName(pumpLabel: string, event: PumpEvent) {
  if (pumpLabel?.trim()) return pumpLabel;
  if (event.tag_label?.trim()) return event.tag_label;
  return toTitleCaseFromTag(event.tag_id || "Pump");
}

function getStateConfig(state: number | null) {
  switch (state) {
    case 0:
      return {
        label: "STOPPED",
        dot: "bg-red-500",
        text: "text-red-600",
        bg: "bg-red-50/70",
        border: "border-red-100",
      };
    case 1:
      return {
        label: "WORKING",
        dot: "bg-emerald-500",
        text: "text-emerald-600",
        bg: "bg-emerald-50/70",
        border: "border-emerald-100",
      };
    case 2:
      return {
        label: "MOVING",
        dot: "bg-blue-500",
        text: "text-blue-600",
        bg: "bg-blue-50/70",
        border: "border-blue-100",
      };
    case 3:
      return {
        label: "FAULT",
        dot: "bg-yellow-500",
        text: "text-yellow-600",
        bg: "bg-yellow-50/70",
        border: "border-yellow-100",
      };
    default:
      return {
        label: "NO DATA",
        dot: "bg-slate-400",
        text: "text-slate-600",
        bg: "bg-slate-50/70",
        border: "border-slate-200",
      };
  }
}

function saveBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(
    () => window.URL.revokeObjectURL(url),
    DOWNLOAD_URL_REVOKE_DELAY_MS,
  );
}

/* =======================
   Component
======================= */

export default function PumpStatusKpi({
  lagoonId,
  productType = null,
  pumps,
  timezone,
  eventsLoading,
  eventsError,
  eventsEmpty,
}: Props) {
  const [reportDownloading, setReportDownloading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleDownloadReport = async () => {
    if (!lagoonId || reportDownloading) return;

    setReportDownloading(true);
    setReportError(null);

    try {
      const report = await downloadPumpEventsReport(lagoonId, productType);
      saveBlob(report.blob, report.filename);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 403) {
        setReportError("Access not permitted to download the report");
      } else {
        setReportError("The report could not be downloaded.");
      }
    } finally {
      setReportDownloading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-700">Pump Status</div>
            <div className="text-xs text-slate-500 mt-0.5">Last 3 events per pump</div>
          </div>

          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={!lagoonId || reportDownloading}
            title="Download report"
            aria-label="Download report"
            className="inline-flex h-9 min-w-27 shrink-0 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="currentColor"
            >
              <path d="M10 2a1 1 0 0 1 1 1v7.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42L9 10.59V3a1 1 0 0 1 1-1Z" />
              <path d="M4 14a1 1 0 0 1 1 1v1h10v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
            </svg>
            <span>{reportDownloading ? "Generating" : "Report"}</span>
          </button>
        </div>

        {reportError ? (
          <div className="mt-2 text-xs text-rose-600">{reportError}</div>
        ) : null}
      </div>

      <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {Object.entries(pumps).map(([id, pump]) => {
          const config = getStateConfig(pump.state);
          const events = getTopEvents(pump.events);

          return (
            <article
              key={id}
              className={`rounded-lg border ${config.border} ${config.bg} p-3 sm:p-4 min-h-47.5 sm:min-h-52.5 flex flex-col transition-colors`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{pump.label}</div>
                  <div className={`mt-1 inline-flex items-center gap-2 text-[11px] font-semibold tracking-wide ${config.text}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                    {config.label}
                  </div>
                </div>

                <span className="rounded-sm bg-white/70 border border-white px-2 py-0.5 text-[10px] text-slate-500 shrink-0">
                  {id}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/80 flex-1 flex flex-col">
                <div className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  Recent events
                </div>

                {eventsLoading && (
                  <div className="mt-2 text-xs text-slate-500">
                    Loading events...
                  </div>
                )}

                {!eventsLoading && eventsError && (
                  <div className="mt-2 text-xs text-rose-600">
                    {eventsError}
                  </div>
                )}

                {!eventsLoading && !eventsError && events.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {events.map((event, index) => (
                      <div
                        key={`${id}-${event.tag_id}-${event.start_local}-${index}`}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="text-slate-500 font-medium truncate">
                          {getDisplayPumpName(pump.label, event)}
                        </span>
                        <span className="text-slate-700 font-medium tabular-nums shrink-0">
                          {formatPumpEventTime(event.start_local, timezone)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {!eventsLoading && !eventsError && events.length === 0 && (
                  <div className="mt-2 text-xs text-slate-500">
                    {eventsEmpty ? "Sin eventos recientes" : "No events for this pump"}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
