import type { HistorySeries } from "./HistoryChart/types";

export function getHistorySeriesTagKey(series: HistorySeries): string {
  const rawTag = series.tag_key ?? series.tag ?? series.name ?? "";
  return String(rawTag).trim();
}

export function getHistorySeriesLabel(series: HistorySeries): string {
  return String(series.name ?? getHistorySeriesTagKey(series)).trim();
}
