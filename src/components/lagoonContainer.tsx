/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

import LagoonSVG from "./LagoonSVG";
import FloatingKPI from "../components/lagoon/FloatingKPI";
import PumpStatusKpi from "../components/lagoon/PumpStatusKpi";
import LagoonLineChart from "../components/charts/LagoonLineChart";
import DateRangePicker from "../components/filters/DateRangePicker";

import layout from "../layouts/crystal-lagoons.layout.json";
import { useScadaRealtime } from "../hooks/useScadaRealtime";
import { useHistoryHourly } from "../hooks/useHistoryHourly";

export default function LagoonContainer() {
  const lagoonId = "costa_del_lago";

  /* =========================
     RANGO DE FECHAS (HISTÓRICO)
  ========================== */
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [startDate, setStartDate] = useState(oneDayAgo.toISOString());
  const [endDate, setEndDate] = useState(now.toISOString());

  /* =========================
     REALTIME
  ========================== */
  const { tags, pumpLastOn, ts } = useScadaRealtime(lagoonId);

  const pumpsKpi = layout.kpis.find((kpi) => kpi.type === "pumps") as any;

  const resolveValue = (kpi: any) => {
    if (!kpi?.backendTag) return "--";
    const v = tags[kpi.backendTag];
    if (typeof v === "number") return v.toFixed(3);
    if (typeof v === "boolean") return v ? "On" : "Off";
    return v ?? "--";
  };

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
        ])
      )
    : null;

  /* =========================
     HISTÓRICO
  ========================== */
  const { data, loading } = useHistoryHourly({
    lagoonId,
    startDate,
    endDate,
  });

  return (
    <main className="h-full overflow-y-auto">
      <div className="min-h-[500px] p-4 rounded-2xl border border-slate-200 bg-linear-to-b from-sky-50 to-white">
        {/* ===== HEADER ===== */}
        <div className="mb-4 text-sm font-semibold text-slate-700">
          Laguna (zona central)
        </div>

        {/* ===== ZONA LAGUNA ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[80%_20%] gap-6">
          <div className="relative flex items-center justify-center h-[420px] w-full">
            <LagoonSVG />

            {layout.kpis
              .filter((kpi) => kpi.type === "kpi")
              .map((kpi) => (
                <FloatingKPI
                  key={kpi.id}
                  label={kpi.backendTag ?? kpi.label}
                  value={resolveValue(kpi)}
                  unit={kpi.unit}
                  iconType={kpi.iconType}
                  position={kpi.position}
                />
              ))}
          </div>

          <div className="flex flex-col">
            {resolvedPumps && <PumpStatusKpi pumps={resolvedPumps} />}
          </div>
        </div>

        {/* ===== SEPARACIÓN VISUAL ===== */}
        <div className="mt-20" />

        {/* ===== HISTÓRICO ===== */}
        <section>
          {/* HEADER HISTÓRICO */}
          <div className="mb-8 mt-8 flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Histórico horario
            </div>

            {/* RANGO DE FECHAS (DISCRETO) */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Rango</span>
              <DateRangePicker
                startISO={startDate}
                endISO={endDate}
                onChange={(s, e) => {
                  if (new Date(s) > new Date(e)) return;
                  setStartDate(s);
                  setEndDate(e);
                }}
              />
            </div>
          </div>

          {/* CARD HISTÓRICO */}
          <div className="relative w-full rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="h-[360px] overflow-hidden">
              <div className="w-full h-full overflow-x-auto overflow-y-hidden">
                <div className="min-w-full max-w-full h-full px-4">
                  <LagoonLineChart data={data} loading={loading} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
