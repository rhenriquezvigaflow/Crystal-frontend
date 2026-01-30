import { LineChart } from "@mui/x-charts";
import { Box, Typography } from "@mui/material";
import type { HistoryResponse } from "./types";
import { getColorByIndex } from "./chartConfig";

interface Props {
  data: HistoryResponse;
}

const HistoryChart = ({ data }: Props) => {
  if (!data?.series?.length) return null;

  // ✅ 1. Timeline GLOBAL (todas las series)
  const timeline = Array.from(
    new Set(
      data.series.flatMap((s) =>
        s.points.map((p) => new Date(p.timestamp).getTime())
      )
    )
  )
    .sort((a, b) => a - b)
    .map((t) => new Date(t));

  // ✅ 2. Series alineadas EXACTAMENTE a la timeline
  const series = data.series.map((serie, index) => {
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

  return (
    <Box>
      <Typography variant="h6" mb={1}>
        Histórico horario
      </Typography>

      <LineChart
        height={320}
        xAxis={[
          {
            data: timeline,
            scaleType: "time",
            valueFormatter: (v) =>
              v.toLocaleTimeString("es-CL", { hour: "2-digit" }),
          },
        ]}
        series={series}
        grid={{ vertical: true, horizontal: true }}
      />
    </Box>
  );
};

export default HistoryChart;
