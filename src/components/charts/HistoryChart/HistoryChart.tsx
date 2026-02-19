import { LineChart } from "@mui/x-charts";
import { Box, Typography } from "@mui/material";
import type { HistoryResponse } from "./types";
import { getColorByIndex } from "./chartConfig";

/* ======================================================
   Props
====================================================== */
interface Props {
  data: HistoryResponse;
  visibleStart: Date;
  visibleEnd: Date;
  selectedTags?: string[]; // opcional (selector múltiple)
}

/* ======================================================
   Helpers
====================================================== */
function getViewByDays(days: number) {
  if (days <= 14) return "hourly";
  if (days <= 180) return "daily";
  return "weekly";
}

function getWeekNumber(date: Date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/* ======================================================
   Component
====================================================== */
const HistoryChart = ({
  data,
  visibleStart,
  visibleEnd,
  selectedTags,
}: Props) => {
  if (!data?.series?.length) return null;

  /* ---------------------------
     Vista automática
  ---------------------------- */
  const daysVisible =
    (visibleEnd.getTime() - visibleStart.getTime()) /
    (1000 * 60 * 60 * 24);

  const view = getViewByDays(daysVisible);

  const titleMap: Record<string, string> = {
    hourly: "Histórico horario",
    daily: "Histórico diario",
    weekly: "Histórico semanal",
  };

  const formatXAxis = (v: Date) => {
    switch (view) {
      case "hourly":
        return v.toLocaleTimeString("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "daily":
        return v.toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "short",
        });
      case "weekly":
        return `Sem ${getWeekNumber(v)}`;
      default:
        return v.toISOString();
    }
  };

  /* =====================================================
     FILTRADO DE TAGS
     - Si hay selección → respetarla
     - Si NO hay selección → excluir WM001 por defecto
  ====================================================== */
  const filteredSeries =
    selectedTags && selectedTags.length > 0
      ? data.series.filter((s) => selectedTags.includes(s.tag_key))
      : data.series.filter((s) => s.tag_key !== "WM001_TOT_SCADA");

  if (!filteredSeries.length) return null;

  /* ---------------------------
     Timeline global
  ---------------------------- */
  const timeline = Array.from(
    new Set(
      filteredSeries.flatMap((s) =>
        s.points.map((p) => new Date(p.timestamp).getTime())
      )
    )
  )
    .sort((a, b) => a - b)
    .map((t) => new Date(t));

  /* ---------------------------
     Series alineadas
  ---------------------------- */
  const series = filteredSeries.map((serie, index) => {
    const map = new Map(
      serie.points.map((p) => [
        new Date(p.timestamp).getTime(),
        p.value,
      ])
    );

    return {
      id: serie.tag_key,
      label: serie.name,
      data: timeline.map((t) => map.get(t.getTime()) ?? null),
      color: getColorByIndex(index),
      showMark: false,
    };
  });

  /* ---------------------------
     Render
  ---------------------------- */
  return (
    <Box>
      <Typography variant="h6" mb={1}>
        {titleMap[view]}
      </Typography>

      <LineChart
        height={320}
        xAxis={[
          {
            data: timeline,
            scaleType: "time",
            valueFormatter: formatXAxis,
            min: visibleStart,
            max: visibleEnd,
          },
        ]}
        series={series}
        grid={{ vertical: true, horizontal: true }}
      />
    </Box>
  );
};

export default HistoryChart;
