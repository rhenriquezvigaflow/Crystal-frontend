import { useMemo, useState } from "react";
import { Box } from "@mui/material";

import {
  formatDateForInput,
  getZonedDayBounds,
} from "../../lib/datetime/zonedDateRange";

interface Props {
  start: Date;
  end: Date;
  timezone?: string | null;
  onChange: (start: Date, end: Date) => void;
}

interface DateRangePickerFieldsProps {
  startValue: string;
  endValue: string;
  timezone?: string | null;
  onChange: (start: Date, end: Date) => void;
}

function DateRangePickerFields({
  startValue,
  endValue,
  timezone,
  onChange,
}: DateRangePickerFieldsProps) {
  const [draftStart, setDraftStart] = useState(startValue);
  const [draftEnd, setDraftEnd] = useState(endValue);

  const draftStartBounds = useMemo(
    () => (draftStart ? getZonedDayBounds(draftStart, timezone) : null),
    [draftStart, timezone],
  );
  const draftEndBounds = useMemo(
    () => (draftEnd ? getZonedDayBounds(draftEnd, timezone) : null),
    [draftEnd, timezone],
  );
  const isRangeInverted =
    !!draftStartBounds &&
    !!draftEndBounds &&
    draftStartBounds.start > draftEndBounds.end;
  const hasPendingChanges = draftStart !== startValue || draftEnd !== endValue;
  const canApply =
    !!draftStartBounds &&
    !!draftEndBounds &&
    !isRangeInverted &&
    hasPendingChanges;

  const handleApply = () => {
    if (!canApply || !draftStartBounds || !draftEndBounds) return;
    onChange(draftStartBounds.start, draftEndBounds.end);
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
          From
        </span>

        <input
          type="date"
          value={draftStart}
          aria-invalid={isRangeInverted}
          onChange={(e) => setDraftStart(e.target.value)}
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 14,
            padding: "6px 10px",
            borderRadius: 8,
            border: `1px solid ${isRangeInverted ? "#FB7185" : "#CBD5E1"}`,
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
          To
        </span>

        <input
          type="date"
          value={draftEnd}
          aria-invalid={isRangeInverted}
          onChange={(e) => setDraftEnd(e.target.value)}
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 14,
            padding: "6px 10px",
            borderRadius: 8,
            border: `1px solid ${isRangeInverted ? "#FB7185" : "#CBD5E1"}`,
            outline: "none",
          }}
        />
      </Box>

      <button
        type="button"
        disabled={!canApply}
        onClick={handleApply}
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 13,
          fontWeight: 700,
          padding: "7px 12px",
          borderRadius: 8,
          border: canApply ? "1px solid #0EA5E9" : "1px solid #CBD5E1",
          color: canApply ? "#FFFFFF" : "#94A3B8",
          background: canApply ? "#0284C7" : "#F8FAFC",
          cursor: canApply ? "pointer" : "not-allowed",
          transition: "background 120ms ease, border-color 120ms ease",
        }}
      >
        Apply
      </button>
    </Box>
  );
}

export default function DateRangePicker({
  start,
  end,
  timezone,
  onChange,
}: Props) {
  const startValue = formatDateForInput(start, timezone);
  const endValue = formatDateForInput(end, timezone);

  return (
    <DateRangePickerFields
      key={`${startValue}:${endValue}:${timezone ?? ""}`}
      startValue={startValue}
      endValue={endValue}
      timezone={timezone}
      onChange={onChange}
    />
  );
}
