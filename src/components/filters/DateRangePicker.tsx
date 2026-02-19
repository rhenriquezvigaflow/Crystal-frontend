import { Box } from "@mui/material";

interface Props {
  startISO: string;
  endISO: string;
  onChange: (start: string, end: string) => void;
}

function toDateOnly(iso: string) {
  if (!iso) return "";
  return iso.slice(0, 10); // YYYY-MM-DD
}

function toISODate(dateStr: string) {
  // Generamos ISO limpio en UTC a las 00:00
  return new Date(`${dateStr}T00:00:00`).toISOString();
}

export default function DateRangePicker({
  startISO,
  endISO,
  onChange,
}: Props) {
  const handleStartChange = (value: string) => {
    if (!value) return;
    onChange(toISODate(value), endISO);
  };

  const handleEndChange = (value: string) => {
    if (!value) return;
    onChange(startISO, toISODate(value));
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {/* DESDE */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#475569",
          }}
        >
          Desde
        </span>

        <input
          type="date"
          value={toDateOnly(startISO)}
          onChange={(e) => handleStartChange(e.target.value)}
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 14,
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #CBD5E1",
            outline: "none",
          }}
        />
      </Box>

      {/* HASTA */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#475569",
          }}
        >
          Hasta
        </span>

        <input
          type="date"
          value={toDateOnly(endISO)}
          onChange={(e) => handleEndChange(e.target.value)}
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 14,
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #CBD5E1",
            outline: "none",
          }}
        />
      </Box>
    </Box>
  );
}
