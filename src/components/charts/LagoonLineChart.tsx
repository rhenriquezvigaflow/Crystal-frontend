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
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
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
  const day = d.getUTCDay(); // 0=domingo, 1=lunes...
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
  return Math.floor(ms / (1000 * 60 * 60)) * (1000 * 60 * 60);
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
  const sourceSeries = data?.series ?? [];

  // Timezone planta (IANA). Backend recomendado: data.timezone
  const lagoonTz: string = useMemo(() => {
    return (
      timezone ||
      data?.timezone ||
      data?.lagoon_timezone ||
      data?.tz ||
      "UTC"
    );
  }, [timezone, data]);

  // Helpers de formato SIEMPRE en timezone de planta
  const fmtDate = useMemo(() => {
    return (valueMs: number, options: Intl.DateTimeFormatOptions) => {
      try {
        return new Intl.DateTimeFormat(undefined, {
          timeZone: lagoonTz,
          ...options,
        }).format(new Date(valueMs));
      } catch {
        // Fallback si viene un timezone inválido
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
    return sourceSeries.filter((s: any) => {
      const tag = String(s.tag ?? s.tag_key ?? "");
      if (!isPlottableTag(tag)) return false;
      if (!selectedTagSet) return true;
      return selectedTagSet.has(tag);
    });
  }, [sourceSeries, selectedTagSet]);

  const alignedTimeline = useMemo(() => {
    const set = new Set<number>();
    const min = visibleStart.getTime();
    const max = visibleEnd.getTime();

    filteredSeries.forEach((s: any) => {
      (s.points ?? []).forEach((p: any) => {
        const t = normalizeByView(p.timestamp, view);
        if (!Number.isNaN(t) && t >= min && t <= max) set.add(t);
      });
    });

    return Array.from(set).sort((a, b) => a - b);
  }, [view, filteredSeries, visibleStart, visibleEnd]);

  const series = useMemo(() => {
    return filteredSeries.map((s: any) => {
      const tag = String(s.tag ?? s.tag_key ?? "");
      const map = new Map<number, number | null>();

      (s.points ?? []).forEach((p: any) => {
        const t = normalizeByView(p.timestamp, view);
        if (Number.isNaN(t)) return;

        const next =
          typeof p.value === "number" && Number.isFinite(p.value)
            ? p.value
            : null;
        const prev = map.get(t);

        // Evita que un null tardío borre un valor numérico ya capturado.
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
            // Fecha+hora en TZ planta
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
      <Chart options={options} series={series} type="line" height="100%" />
    </Box>
  );
}
