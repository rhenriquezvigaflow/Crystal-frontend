import { BarChart } from "@mui/x-charts";
import { Box, Typography } from "@mui/material";
import type { Direction } from "@mui/x-charts/models/legend"; // Add this import

interface Series {
  label: string;
  data: number[];
  color: string;
}

interface Props {
  labels: string[];
  series: Series[];
  loading?: boolean;
}

export default function LagoonBarChart({
  labels,
  series,
  loading,
}: Props) {
  if (loading) {
    return <Typography>Cargando histórico…</Typography>;
  }

  if (!series.length) {
    return <Typography>No hay datos históricos</Typography>;
  }

  return (
    <Box sx={{ width: "100%", height: 300 }}>
      <BarChart
        xAxis={[
          {
            data: labels,
            scaleType: "band",
          },
        ]}
        series={series.map((s) => ({
          label: s.label,
          data: s.data,
          color: s.color,
        }))}
        grid={{ horizontal: true }}
        slotProps={{
          legend: {
            direction: "row" as Direction,
            position: { vertical: "top", horizontal: "middle" },
          },
        }}
      />
    </Box>
  );
}
