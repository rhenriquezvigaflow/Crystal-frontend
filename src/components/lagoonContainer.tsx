/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";

import LagoonSVG from "./LagoonSVG";
import ScadaOverlay from "../containers/ScadaOverlay";
import PumpStatusKpi from "../components/lagoon/PumpStatusKpi";
import LagoonLineChart from "../components/charts/LagoonLineChart";
import DateRangePicker from "../components/filters/DateRangePicker";

import layout from "../layouts/crystal-lagoons.layout.json";
import { useScadaRealtime } from "../hooks/useScadaRealtime";
import { useHistory } from "../hooks/useHistory";

import { lagoons } from "../data/lagoons";
/* =========================
   Types
========================= */
interface Props {
  lagoonId: string;
}

/* =========================
   Helpers
========================= */
function getViewByDays(days: number): "hourly" | "daily" | "weekly" {
  if (days <= 14) return "hourly";
  if (days <= 180) return "daily";
  return "weekly";
}

function daysBetween(a: Date, b: Date) {
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

const quickRanges = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "185D", days: 185 },
  { label: "365D", days: 365 },
];

/* =========================
   Component
========================= */
export default function LagoonContainer({ lagoonId }: Props) {
  /* =========================
     RANGO BASE
  ========================== */
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [startISO, setStartISO] = useState(oneDayAgo.toISOString());
  const [endISO, setEndISO] = useState(now.toISOString());

  const [visibleStart, setVisibleStart] = useState<Date>(oneDayAgo);
  const [visibleEnd, setVisibleEnd] = useState<Date>(now);

  const daysVisible = useMemo(
    () => daysBetween(visibleStart, visibleEnd),
    [visibleStart, visibleEnd],
  );

  const view = getViewByDays(daysVisible);

  /* =========================
     REALTIME
  ========================== */
  const { tags, pumpLastOn, ts } = useScadaRealtime(lagoonId);

  const pumpsKpi = layout.kpis.find((kpi) => kpi.type === "pumps") as any;

  const resolvedPumps = pumpsKpi?.pumps
    ? Object.fromEntries(
        pumpsKpi.pumps.map((pump: any) => [
          pump.id,
          {
            label: pump.label,
            active:
              typeof tags[pump.backendTag] === "boolean"
                ? tags[pump.backendTag]
                : null,
            updated_at: pumpLastOn?.[pump.backendTag] ?? ts ?? null,
          },
        ]),
      )
    : null;

  /* =========================
     HISTÓRICO
  ========================== */
  const { data, loading } = useHistory({
    lagoonId,
    startDate: visibleStart.toISOString(),
    endDate: visibleEnd.toISOString(),
    view,
  });

  /* =========================
     DatePicker
  ========================== */
  const onDateRangeChange = (s: string, e: string) => {
    if (new Date(s) > new Date(e)) return;
    setStartISO(s);
    setEndISO(e);
    setVisibleStart(new Date(s));
    setVisibleEnd(new Date(e));
  };

  const quickRange = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    setStartISO(start.toISOString());
    setEndISO(end.toISOString());
    setVisibleStart(start);
    setVisibleEnd(end);
  };

  const lagoonName = lagoons.find((l) => l.id === lagoonId)?.name ?? lagoonId;
  /* =========================
     Render
  ========================== */
  return (
    <main className="h-full overflow-y-auto">
      <div className="min-h-175 p-4 rounded-2xl border border-slate-200 bg-linear-to-b from-sky-50 to-white">
        {/* HEADER */}
        <div className="mb-4 text-sm font-semibold text-slate-700">
          <span>Laguna: </span>
          {lagoonName}
        </div>

        {/* SCADA + OVERLAY */}
        <div className="relative w-full h-225 overflow-hidden">
          <LagoonSVG />
          <ScadaOverlay tags={tags} />
        </div>

        {/* ESTADO BOMBAS */}
        {resolvedPumps && (
          <div className="mt-6 w-full">
            <PumpStatusKpi pumps={resolvedPumps} />
          </div>
        )}

        {/* HISTÓRICO */}
        <section className="mt-36">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Histórico · vista {view}
            </div>

            <div className="flex gap-1">
              {quickRanges.map((r) => (
                <button
                  key={r.label}
                  className="px-2 py-1 text-xs rounded border border-slate-300 hover:bg-slate-100"
                  onClick={() => quickRange(r.days)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <DateRangePicker
              startISO={startISO}
              endISO={endISO}
              onChange={onDateRangeChange}
            />
          </div>

          <div className="relative w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="h-95 overflow-hidden">
              <LagoonLineChart
                data={data}
                loading={loading}
                visibleStart={visibleStart}
                visibleEnd={visibleEnd}
                onRangeChange={(s, e) => {
                  setVisibleStart(s);
                  setVisibleEnd(e);
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
