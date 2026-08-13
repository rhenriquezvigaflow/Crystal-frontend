import type { CSSProperties } from "react";

export type LagoonMetricKey = "temperature" | "orp" | "dosage";

export interface LagoonMetricsProps {
  temperature: number;
  orp: number;
  dosage: number;
  activeKeys?: LagoonMetricKey[];
  title?: string | null;
  className?: string;
  style?: CSSProperties;
  labels?: Partial<Record<LagoonMetricKey, string>>;
  units?: Partial<Record<LagoonMetricKey, string>>;
}

interface MetricItem {
  key: LagoonMetricKey;
  label: string;
  value: string;
  unit: string;
}

function formatTemperature(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "--";
}

function formatInteger(value: number): string {
  return Number.isFinite(value) ? value.toFixed(0) : "--";
}

function formatDosage(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "--";
}

export default function LagoonMetricsOverlay({
  temperature,
  orp,
  dosage,
  activeKeys,
  title,
  className,
  style,
  labels,
  units,
}: LagoonMetricsProps) {
  const placementClass = className?.trim() || (
    style ? "" : "left-1/2 top-1/2 z-[2] w-[clamp(12rem,32%,24rem)]"
  );
  const metrics: MetricItem[] = [
    {
      key: "temperature",
      label: labels?.temperature ?? "TEMP",
      value: formatTemperature(temperature),
      unit: units?.temperature ?? "C",
    },
    {
      key: "orp",
      label: labels?.orp ?? "ORP",
      value: formatInteger(orp),
      unit: units?.orp ?? "mV",
    },
    {
      key: "dosage",
      label: labels?.dosage ?? "Dosif",
      value: formatDosage(dosage),
      unit: units?.dosage ?? "ppm",
    },
  ].filter((metric) => !activeKeys || activeKeys.includes(metric.key));
  const normalizedTitle = title?.trim();

  if (!metrics.length) return null;

  return (
    <div
      className={[
        "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 overflow-hidden",
        "rounded-[clamp(0.55rem,1vw,0.8rem)] border border-white/45 bg-white/65",
        "backdrop-blur-md shadow-[0_1px_2px_rgba(15,23,42,0.06)]",
        "max-w-[calc(100%-1rem)] text-[#263238]",
        placementClass,
      ].filter(Boolean).join(" ")}
      style={style}
      aria-hidden="true"
    >
      {normalizedTitle ? (
        <div className="px-[clamp(0.45rem,1.1vw,0.8rem)] pt-[clamp(0.38rem,0.75vw,0.58rem)] text-center text-[clamp(0.52rem,0.78vw,0.74rem)] font-semibold leading-none text-slate-700/80">
          {normalizedTitle}
        </div>
      ) : null}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))`,
        }}
      >
        {metrics.map((metric, index) => (
          <div
            key={metric.key}
            className={[
              "flex min-w-0 flex-col items-center justify-center",
              "px-[clamp(0.45rem,1.1vw,0.8rem)] py-[clamp(0.45rem,0.9vw,0.7rem)]",
              index > 0 ? "border-l border-slate-500/15" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="max-w-full truncate text-[clamp(0.48rem,0.72vw,0.68rem)] font-semibold uppercase leading-none text-slate-700/80">
              {metric.label}
            </div>
            <div className="mt-[clamp(0.28rem,0.55vw,0.42rem)] text-[clamp(1rem,1.65vw,1.45rem)] font-semibold leading-none text-slate-900 [font-variant-numeric:tabular-nums]">
              {metric.value}
            </div>
            <div className="mt-[clamp(0.22rem,0.45vw,0.32rem)] text-[clamp(0.5rem,0.72vw,0.66rem)] font-semibold leading-none text-slate-700">
              {metric.unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
