// LagoonLineChart.tsx
import Chart from "react-apexcharts";
import { Box, CircularProgress } from "@mui/material";
import { useMemo } from "react";
import type { HistoryPoint, HistoryResponse, HistorySeries } from "./HistoryChart/types";
import { DAY_MS, HOUR_MS } from "../../config/timing";
import { getHistorySeriesTagKey } from "./historySeries";

type LagoonHistoryData = HistoryResponse & {
  timezone?: string | null;
  lagoon_timezone?: string | null;
  tz?: string | null;
};

interface Props {
  data: LagoonHistoryData | null;
  loading: boolean;
  visibleStart: Date;
  visibleEnd: Date;
  onRangeChange: (start: Date, end: Date) => void;
  selectedTags?: string[];
  timezone?: string | null;
}

const isPlottableTag = (tagKey?: string) => {
  if (!tagKey) return false;

  const k = String(tagKey).toUpperCase();

  if (k === "WM001_TOT_SCADA") return false;

  if (
    k.includes("_ST_") ||
    k.includes("_STATUS") ||
    k.includes("_BOOL") ||
    k.includes("RETRO")
  ) {
    return false;
  }

  return true;
};

function daysBetween(a: Date, b: Date) {
  return Math.abs(b.getTime() - a.getTime()) / DAY_MS;
}

function getViewByDays(days: number): "hourly" | "daily" | "weekly" {
  if (days <= 14) return "hourly";
  if (days <= 180) return "daily";
  return "weekly";
}

function normalizeDayUtc(ts: string | Date) {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12);
}

function normalizeWeekUtc(ts: string | Date) {
  const d = new Date(ts);
  const day = d.getUTCDay(); // 0=Sunday, 1=Monday...
  const diffToMonday = (day + 6) % 7;
  return Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() - diffToMonday,
    12,
  );
}

function normalizeByView(
  ts: string | Date,
  view: "hourly" | "daily" | "weekly",
) {
  if (view === "daily") return normalizeDayUtc(ts);
  if (view === "weekly") return normalizeWeekUtc(ts);

  const ms = new Date(ts).getTime();
  return Math.floor(ms / HOUR_MS) * HOUR_MS;
}

export default function LagoonLineChart({
  data,
  loading,
  visibleStart,
  visibleEnd,
  onRangeChange,
  selectedTags,
  timezone,
}: Props) {
  const sourceSeries: HistorySeries[] = useMemo(() => data?.series ?? [], [data?.series]);

  // Plant timezone (IANA). Recommended backend field: data.timezone
  const lagoonTz: string = useMemo(() => {
    return (
      timezone ||
      data?.timezone ||
      data?.lagoon_timezone ||
      data?.tz ||
      "UTC"
    );
  }, [timezone, data]);

  // Formatting helpers always resolved in the plant timezone
  const fmtDate = useMemo(() => {
    return (valueMs: number, options: Intl.DateTimeFormatOptions) => {
      try {
        return new Intl.DateTimeFormat(undefined, {
          timeZone: lagoonTz,
          ...options,
        }).format(new Date(valueMs));
      } catch {
        // Fallback in case the timezone value is invalid
        return new Intl.DateTimeFormat(undefined, options).format(
          new Date(valueMs),
        );
      }
    };
  }, [lagoonTz]);

  const selectedTagSet = useMemo(() => {
    if (!selectedTags?.length) return null;
    return new Set(selectedTags);
  }, [selectedTags]);

  const view = useMemo(() => {
    const days = daysBetween(visibleStart, visibleEnd);
    return getViewByDays(days);
  }, [visibleStart, visibleEnd]);

  const filteredSeries = useMemo(() => {
    return sourceSeries.filter((s) => {
      const tag = getHistorySeriesTagKey(s);
      if (!isPlottableTag(tag)) return false;
      if (!selectedTagSet) return true;
      return selectedTagSet.has(tag);
    });
  }, [sourceSeries, selectedTagSet]);

  const alignedTimeline = useMemo(() => {
    const set = new Set<number>();
    const min = visibleStart.getTime();
    const max = visibleEnd.getTime();

    filteredSeries.forEach((s) => {
      (s.points ?? []).forEach((p: HistoryPoint) => {
        const t = normalizeByView(p.timestamp, view);
        if (!Number.isNaN(t) && t >= min && t <= max) set.add(t);
      });
    });

    return Array.from(set).sort((a, b) => a - b);
  }, [view, filteredSeries, visibleStart, visibleEnd]);

  const series = useMemo(() => {
    return filteredSeries.map((s) => {
      const tag = getHistorySeriesTagKey(s);
      const map = new Map<number, number | null>();

      (s.points ?? []).forEach((p: HistoryPoint) => {
        const t = normalizeByView(p.timestamp, view);
        if (Number.isNaN(t)) return;

        const next =
          typeof p.value === "number" && Number.isFinite(p.value)
            ? p.value
            : null;
        const prev = map.get(t);

        // Prevent a late null from overwriting a numeric value already captured.
        if (next !== null || prev == null) {
          map.set(t, next);
        }
      });

      const points: [number, number | null][] = alignedTimeline.map((t) => [
        t,
        map.has(t) ? map.get(t)! : null,
      ]);

      return { name: tag, data: points };
    });
  }, [filteredSeries, view, alignedTimeline]);

  const options: ApexCharts.ApexOptions = useMemo(
    () => ({
      chart: {
        type: "line",
        height: "100%",
        animations: { enabled: false },
        toolbar: {
          show: true,
          tools: {
            download: false,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: false,
            reset: true,
          },
        },
        zoom: {
          enabled: true,
          type: "x",
          autoScaleYaxis: true,
        },
        pan: { enabled: false },
        events: {
          zoomed: (_ctx, { xaxis }) => {
            if (xaxis?.min != null && xaxis?.max != null) {
              onRangeChange(new Date(xaxis.min), new Date(xaxis.max));
            }
          },
        },
      },
      stroke: { width: 2, curve: "straight" },
      grid: { strokeDashArray: 3 },
      markers: { size: 0 },
      xaxis: {
        type: "datetime",
        min: visibleStart.getTime(),
        max: visibleEnd.getTime(),
        labels: {
          formatter: (value: number) => {
            return fmtDate(value, {
              day: "2-digit",
              month: "short",
            });
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (v: number) => v.toFixed(2),
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        hideEmptySeries: false,
        x: {
          formatter: (value: number) => {
            // Date + time in the plant timezone
            return fmtDate(value, {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            });
          },
        },
        y: {
          formatter: (v?: number) =>
            typeof v === "number" ? v.toFixed(3) : "--",
        },
      },
      legend: { show: true, position: "top" },
    }),
    [visibleStart, visibleEnd, onRangeChange, fmtDate],
  );

  if (loading) {
    return (
      <Box className="flex items-center justify-center h-full">
        <CircularProgress size={22} />
      </Box>
    );
  }

  if (!sourceSeries.length) {
    return (
      <Box className="flex items-center justify-center h-full text-xs text-slate-400">
        No historical data
      </Box>
    );
  }

  if (!series.length) {
    return (
      <Box className="flex items-center justify-center h-full text-xs text-slate-400">
        Select at least one TAG to display the chart
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        overflow: "hidden",
        overscrollBehavior: "contain",
        touchAction: "none",
      }}
      onWheel={(e) => e.stopPropagation()}
    >
      <Chart options={options} series={series} type="line" height="100%" />
    </Box>
  );
}
