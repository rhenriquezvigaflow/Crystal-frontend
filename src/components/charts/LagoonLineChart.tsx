import { LineChart } from "@mui/x-charts";
import { Box, CircularProgress } from "@mui/material";
import ChartTooltip from "./ChartTooltip";

interface Props {
  data: any;
  loading: boolean;
}

export default function LagoonLineChart({ data, loading }: Props) {
  if (loading) {
    return (
      <Box className="flex items-center justify-center h-full">
        <CircularProgress size={22} />
      </Box>
    );
  }

  if (!data?.series?.length) {
    return (
      <Box className="flex items-center justify-center h-full text-xs text-slate-400">
        Sin datos históricos
      </Box>
    );
  }

  /* ===== Timeline común ===== */
  const timeline: Date[] = Array.from(
    new Set(
      data.series.flatMap((s: any) =>
        s.points.map((p: any) => new Date(p.timestamp).getTime()),
      ),
    ),
  )
    .sort((a, b) => a - b)
    .map((t) => new Date(t));

  /* ===== Series ===== */
  const series = data.series.map((s: any) => {
    const map = new Map(
      s.points.map((p: any) => [new Date(p.timestamp).getTime(), p.value]),
    );

    return {
      id: s.tag_key,
      label: s.name,
      data: timeline.map((t) => map.get(t.getTime()) ?? null),
      curve: "linear",
      showMark: false, // ❌ sin pelotas
      emphasis: {
        focus: "series", // ✅ resalta línea al hover
      },
    };
  });

  return (
    <LineChart
      height={370}
      margin={{ top: 28, left: 8, right: 8, bottom: 48 }}
      grid={{ horizontal: true, vertical: false }}
      xAxis={[
        {
          data: timeline,
          scaleType: "time",
          valueFormatter: (v: Date) => {
            const h = v.getHours();
            const m = v.getMinutes();

            // Medianoche → mostrar fecha + hora
            if (h === 0 && m === 0) {
              return `${v.toLocaleDateString("es-CL", {
                day: "2-digit",
                month: "2-digit",
              })}\n00:00`;
            }

            return v.toLocaleTimeString("es-CL", {
              hour: "2-digit",
              minute: "2-digit",
            });
          },
        },
      ]}
      series={series}
      tooltip={{
        trigger: "axis",
        slotProps: {
          tooltip: {
            component: ChartTooltip,
          },
        },
      }}
      sx={{
        /* Ejes */
        "& .MuiChartsAxis-tickLabel": {
          fontSize: 12,
        },

        /* Leyenda */
        "& .MuiChartsLegend-root": {
          fontSize: 12,
        },

        /* Líneas más limpias */
        "& .MuiLineElement-root": {
          strokeWidth: 2,
        },
      }}
    />
  );
}
