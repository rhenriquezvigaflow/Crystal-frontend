// LagoonLineChart.tsx
import Chart from "react-apexcharts";
import { Box, CircularProgress } from "@mui/material";
import { useMemo } from "react";

interface Props {
  data: any;
  loading: boolean;
  visibleStart: Date;
  visibleEnd: Date;
  onRangeChange: (start: Date, end: Date) => void;
  selectedTags?: string[];
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
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

function getViewByDays(days: number): "hourly" | "daily" | "weekly" {
  if (days <= 14) return "hourly";
  if (days <= 180) return "daily";
  return "weekly";
}

function normalizeDayToNoon(ts: string | Date) {
  const d = new Date(ts);
  d.setHours(12, 0, 0, 0);
  return d.getTime();
}

export default function LagoonLineChart({
  data,
  loading,
  visibleStart,
  visibleEnd,
  onRangeChange,
  selectedTags,
}: Props) {
  const sourceSeries = data?.series ?? [];

  const selectedTagSet = useMemo(() => {
    if (!selectedTags?.length) return null;
    return new Set(selectedTags);
  }, [selectedTags]);

  const view = useMemo(() => {
    const days = daysBetween(visibleStart, visibleEnd);
    return getViewByDays(days);
  }, [visibleStart, visibleEnd]);

  const dailyTimeline = useMemo(() => {
    if (view !== "daily") return null;

    const start = new Date(visibleStart);
    start.setHours(12, 0, 0, 0);

    const end = new Date(visibleEnd);
    end.setHours(12, 0, 0, 0);

    const days: number[] = [];
    const cur = new Date(start);

    while (cur <= end) {
      days.push(cur.getTime());
      cur.setDate(cur.getDate() + 1);
    }

    return days;
  }, [visibleStart, visibleEnd, view]);

  const series = useMemo(() => {
    return sourceSeries
      .filter((s: any) => {
        const tag = String(s.tag ?? s.tag_key ?? "");
        if (!isPlottableTag(tag)) return false;
        if (!selectedTagSet) return true;
        return selectedTagSet.has(tag);
      })
      .map((s: any) => {
        const tag = String(s.tag ?? s.tag_key ?? "");

        if (view === "daily" && dailyTimeline) {
          const map = new Map<number, number>();

          (s.points ?? []).forEach((p: any) => {
            map.set(normalizeDayToNoon(p.timestamp), p.value);
          });

          const points: [number, number | null][] = dailyTimeline.map((t) => [
            t,
            map.has(t) ? map.get(t)! : null,
          ]);

          return { name: tag, data: points };
        }

        const points: [number, number | null][] = (s.points ?? [])
          .map((p: any) => [
            new Date(p.timestamp).getTime(),
            typeof p.value === "number" ? p.value : null,
          ])
          .sort((a, b) => a[0] - b[0]);

        return { name: tag, data: points };
      });
  }, [sourceSeries, selectedTagSet, view, dailyTimeline]);

  const options: ApexCharts.ApexOptions = useMemo(
    () => ({
      chart: {
        type: "line",
        height: 380,
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
            return new Date(value).toLocaleDateString(undefined, {
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
        x: {
          formatter: (value: number) => {
            return new Date(value).toLocaleString(undefined, {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
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
    [visibleStart, visibleEnd, onRangeChange],
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
        Sin datos historicos
      </Box>
    );
  }

  if (!series.length) {
    return (
      <Box className="flex items-center justify-center h-full text-xs text-slate-400">
        Selecciona al menos un TAG para visualizar el grafico
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
      <Chart options={options} series={series} type="line" height={380} />
    </Box>
  );
}
