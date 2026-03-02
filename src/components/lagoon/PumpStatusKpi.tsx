import type { PumpEvent } from "../../api/scadaPumpEvents";

interface PumpInfo {
  label: string;
  state: number | null;
  events: PumpEvent[];
}

interface Props {
  pumps: Record<string, PumpInfo>;
  timezone?: string | null;
  eventsLoading?: boolean;
  eventsError?: string | null;
  eventsEmpty?: boolean;
}

/* =======================
   Helpers
======================= */

const EVENT_ROWS = 3;

function formatPumpTime(iso?: string | null, timezone?: string | null) {
  if (!iso) return "--";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--";

  const fallbackTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  try {
    return date
      .toLocaleString("es-CL", {
        timeZone: timezone || fallbackTz,
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", " -");
  } catch {
    return date
      .toLocaleString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", " -");
  }
}

function getTopEvents(events: PumpEvent[]) {
  return [...events]
    .filter((event) => !Number.isNaN(new Date(event.start_local).getTime()))
    .sort(
      (a, b) =>
        new Date(b.start_local).getTime() - new Date(a.start_local).getTime(),
    )
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
  return toTitleCaseFromTag(event.tag_id || "Bomba");
}

function getStateConfig(state: number | null) {
  switch (state) {
    case 0:
      return {
        label: "DETENIDA",
        dot: "bg-red-500",
        text: "text-red-600",
        bg: "bg-red-50/70",
        border: "border-red-100",
      };
    case 1:
      return {
        label: "FUNCIONANDO",
        dot: "bg-emerald-500",
        text: "text-emerald-600",
        bg: "bg-emerald-50/70",
        border: "border-emerald-100",
      };
    case 2:
      return {
        label: "MOVIENDOSE",
        dot: "bg-blue-500",
        text: "text-blue-600",
        bg: "bg-blue-50/70",
        border: "border-blue-100",
      };
    case 3:
      return {
        label: "FALLA",
        dot: "bg-yellow-500",
        text: "text-yellow-600",
        bg: "bg-yellow-50/70",
        border: "border-yellow-100",
      };
    default:
      return {
        label: "SIN DATO",
        dot: "bg-slate-400",
        text: "text-slate-600",
        bg: "bg-slate-50/70",
        border: "border-slate-200",
      };
  }
}

/* =======================
   Component
======================= */

export default function PumpStatusKpi({
  pumps,
  timezone,
  eventsLoading,
  eventsError,
  eventsEmpty,
}: Props) {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="text-sm font-semibold text-slate-700">Estado de Bombas</div>
        <div className="text-xs text-slate-500 mt-0.5">Ultimos 3 eventos por bomba</div>
      </div>

      <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {Object.entries(pumps).map(([id, pump]) => {
          const config = getStateConfig(pump.state);
          const events = getTopEvents(pump.events);

          return (
            <article
              key={id}
              className={`rounded-lg border ${config.border} ${config.bg} p-3 sm:p-4 min-h-[190px] sm:min-h-[210px] flex flex-col transition-colors`}
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
                  Eventos recientes
                </div>

                {eventsLoading && (
                  <div className="mt-2 text-xs text-slate-500">
                    Cargando eventos...
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
                          {formatPumpTime(event.start_local, timezone)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {!eventsLoading && !eventsError && events.length === 0 && (
                  <div className="mt-2 text-xs text-slate-500">
                    {eventsEmpty ? "Sin eventos recientes" : "Sin eventos para esta bomba"}
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
