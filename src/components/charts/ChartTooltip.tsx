import { Box, Typography } from "@mui/material";

interface Props {
  axisValue?: number | string | Date;
  series?: any[];
}

export default function ChartTooltip({ axisValue, series }: Props) {
  if (!axisValue || !series?.length) return null;

  const date =
    axisValue instanceof Date
      ? axisValue
      : new Date(axisValue);

  if (isNaN(date.getTime())) return null;

  return (
    <Box
      sx={{
        px: 1,
        py: 0.5,
        backgroundColor: "rgba(255,255,255,0.96)",
        border: "1px solid #e5e7eb",
        borderRadius: 1,
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      }}
    >
      {/* FECHA + HORA */}
      <Typography
        sx={{
          fontSize: "10px",
          fontWeight: 600,
          mb: 0.5,
          color: "#334155",
          whiteSpace: "nowrap",
        }}
      >
        {date.toLocaleString("es-CL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </Typography>

      {series.map((s: any) => (
        <Box
          key={s.id}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            fontSize: "10px",
            lineHeight: 1.15,
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: s.color,
              flexShrink: 0,
            }}
          />
          <span>{s.label}:</span>
          <strong>
            {typeof s.value === "number" ? s.value.toFixed(2) : "--"}
          </strong>
        </Box>
      ))}
    </Box>
  );
}
