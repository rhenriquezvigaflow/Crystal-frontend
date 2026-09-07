import { BiCalendar } from "react-icons/bi";

import { getLagoonMetricItems } from "../../../components/scada/lagoonMetricItems";
import type { LagoonMetricsProps } from "../../../components/scada/LagoonMetricsOverlay";
import {
  EQUIPMENT_STATUS_LABELS,
  getEquipmentStatusColor,
} from "./equipmentStatus";
import { SMALL_PUMPS } from "../mocks/smallScada.mock";
import type {
  OperationMode,
  PumpId,
  PumpMockState,
  SmallPumpSvgId,
} from "../types/smallScada.types";

interface Props {
  pumps: Record<PumpId, PumpMockState>;
  canOperate: boolean;
  canViewSchedule: boolean;
  lagoonMetrics: LagoonMetricsProps | null;
  onModeChange: (pumpId: PumpId, mode: OperationMode) => void;
  onProgrammingClick: (pumpId: PumpId) => void;
  onEquipmentClick: (svgId: SmallPumpSvgId, color: string) => void;
}

function MobileModeSwitch({
  mode,
  disabled,
  onChange,
}: {
  mode: OperationMode;
  disabled: boolean;
  onChange: (mode: OperationMode) => void;
}) {
  const isAutomatic = mode === "automatic";

  return (
    <div className="flex min-h-10 items-center gap-2 text-xs font-bold text-slate-600">
      <span className={isAutomatic ? "" : "text-blue-700"}>M</span>
      <button
        type="button"
        role="switch"
        aria-checked={isAutomatic}
        aria-label={`Operation mode: ${isAutomatic ? "Automatic" : "Manual"}`}
        disabled={disabled}
        title={disabled ? "Read-only access" : undefined}
        className={[
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600",
          isAutomatic
            ? "border-cyan-700 bg-cyan-600"
            : "border-blue-700 bg-blue-600",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
        onClick={() => onChange(isAutomatic ? "manual" : "automatic")}
      >
        <span
          aria-hidden="true"
          className={[
            "h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            isAutomatic ? "translate-x-[25px]" : "translate-x-[3px]",
          ].join(" ")}
        />
      </button>
      <span className={isAutomatic ? "text-cyan-700" : ""}>A</span>
    </div>
  );
}

function LagoonSummaryCard({ metrics }: { metrics: LagoonMetricsProps }) {
  const items = getLagoonMetricItems(metrics);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-slate-800">
        {metrics.title?.trim() || "Lagoon summary"}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {item.label}
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums text-slate-900">
              {item.value}
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-500">
              {item.unit}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SmallMobilePanel({
  pumps,
  canOperate,
  canViewSchedule,
  lagoonMetrics,
  onModeChange,
  onProgrammingClick,
  onEquipmentClick,
}: Props) {
  return (
    <div className="space-y-4 p-3 md:p-4 xl:hidden">
      {lagoonMetrics ? <LagoonSummaryCard metrics={lagoonMetrics} /> : null}

      <section aria-labelledby="small-mobile-pumps-title">
        <h3 id="small-mobile-pumps-title" className="mb-3 text-sm font-bold text-slate-800">
          Pumps
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {SMALL_PUMPS.map((pump) => {
            const state = pumps[pump.id];
            const statusColor = getEquipmentStatusColor(state.status);

            return (
              <article
                key={pump.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="flex min-h-10 items-center justify-between gap-3">
                  <button
                    type="button"
                    className="min-h-10 min-w-0 text-left text-sm font-bold text-slate-800"
                    onClick={() => onEquipmentClick(pump.svgId, statusColor)}
                  >
                    {pump.label} <span className="font-semibold text-slate-500">Pump</span>
                  </button>
                  <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-slate-400/40"
                      style={{ backgroundColor: statusColor }}
                      aria-hidden="true"
                    />
                    {EQUIPMENT_STATUS_LABELS[state.status]}
                  </span>
                </div>

                {canOperate ? (
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <MobileModeSwitch
                      mode={state.mode}
                      disabled={false}
                      onChange={(mode) => onModeChange(pump.id, mode)}
                    />
                    {canOperate && canViewSchedule && state.mode === "automatic" ? <button
                      type="button"
                      title="Pump programming"
                      aria-label="Pump programming"
                      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-2xl text-cyan-700 transition-colors hover:border-cyan-600 hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                      onClick={() => onProgrammingClick(pump.id)}
                    >
                      <BiCalendar aria-hidden="true" focusable="false" />
                    </button> : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
