import type {
  LagoonMetricItem,
  LagoonMetricsProps,
} from "./LagoonMetricsOverlay";

function formatTemperature(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "--";
}

function formatInteger(value: number): string {
  return Number.isFinite(value) ? value.toFixed(0) : "--";
}

function formatDosage(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "--";
}

export function getLagoonMetricItems({
  temperature,
  orp,
  dosage,
  activeKeys,
  labels,
  units,
}: Pick<
  LagoonMetricsProps,
  "temperature" | "orp" | "dosage" | "activeKeys" | "labels" | "units"
>): LagoonMetricItem[] {
  const metrics: LagoonMetricItem[] = [
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
  ];

  return metrics.filter((metric) => !activeKeys || activeKeys.includes(metric.key));
}
