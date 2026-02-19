/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";

import LagoonSVG from "./LagoonSVG";
import ScadaOverlay from "../containers/ScadaOverlay";
import PumpStatusKpi from "../components/lagoon/PumpStatusKpi";
import LagoonLineChart from "../components/charts/LagoonLineChart";
import DateRangePicker from "../components/filters/DateRangePicker";

import layout from "../layouts/crystal-lagoons.layout.json";
import { useScadaRealtime } from "../hooks/useScadaRealtime";
import { useHistory } from "../hooks/useHistory";
import { lagoons } from "../data/lagoons";

interface Props {
  lagoonId: string;
}

/* =========================
   Helpers
========================= */
function getViewByDays(days: number): "hourly" | "daily" | "weekly" {
  if (days <= 14) return "hourly";
  if (days <= 180) return "daily";
  return "weekly";
}

function daysBetween(a: Date, b: Date) {
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

const isPlottableTag = (tagKey?: string) => {
  if (!tagKey) return false;

  const k = String(tagKey).toUpperCase();


  if (k.includes("WM")) return false;

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

const ALL_TAGS_VALUE = "__all_tags__";

const MENU_PROPS = {
  PaperProps: {
    sx: {
      maxHeight: 36 * 7,
      width: 240,
      borderRadius: 2,
      fontFamily: "Inter, system-ui, sans-serif",
    },
  },
};

const quickRanges = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "185D", days: 185 },
  { label: "365D", days: 365 },
];

export default function LagoonContainer({ lagoonId }: Props) {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [startISO, setStartISO] = useState(oneDayAgo.toISOString());
  const [endISO, setEndISO] = useState(now.toISOString());

  const [visibleStart, setVisibleStart] = useState<Date>(oneDayAgo);
  const [visibleEnd, setVisibleEnd] = useState<Date>(now);

  const daysVisible = useMemo(
    () => daysBetween(visibleStart, visibleEnd),
    [visibleStart, visibleEnd],
  );

  const view = getViewByDays(daysVisible);

  const { tags, pumpLastOn, ts } = useScadaRealtime(lagoonId);

  const pumpsKpi = layout.kpis.find((kpi) => kpi.type === "pumps") as any;

  const resolvedPumps = pumpsKpi?.pumps
    ? Object.fromEntries(
        pumpsKpi.pumps.map((pump: any) => [
          pump.id,
          {
            label: pump.label,
            state:
              typeof tags[pump.backendTag] === "number"
                ? tags[pump.backendTag]
                : null,
            updated_at: pumpLastOn?.[pump.backendTag] ?? null,
          },
        ]),
      )
    : null;

  const { data, loading } = useHistory({
    lagoonId,
    startDate: visibleStart.toISOString(),
    endDate: visibleEnd.toISOString(),
    view,
  });

  /* =========================
     TAGS
  ========================== */
  const availableTags = useMemo(() => {
    const series = data?.series ?? [];
    const tags = series
      .map((s: any) => String(s.tag ?? s.tag_key ?? ""))
      .filter((tag: string) => isPlottableTag(tag));

    return Array.from(new Set(tags)).sort();
  }, [data]);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);


  useEffect(() => {
    if (!availableTags.length) return;

    setSelectedTags((prev) => {
      if (!prev.length) return availableTags;

      const valid = prev.filter((t) => availableTags.includes(t));
      return valid.length ? valid : availableTags;
    });
  }, [availableTags]);

  const handleTagChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const nextValue =
      typeof value === "string" ? value.split(",") : value;

    if (nextValue.includes(ALL_TAGS_VALUE)) {
      setSelectedTags((prev) =>
        prev.length === availableTags.length
          ? []
          : availableTags,
      );
      return;
    }

    setSelectedTags(nextValue);
  };

  const allTagsSelected =
    availableTags.length > 0 &&
    selectedTags.length === availableTags.length;

  const someTagsSelected =
    selectedTags.length > 0 &&
    selectedTags.length < availableTags.length;

  const onDateRangeChange = (s: string, e: string) => {
    const start = new Date(s);
    const end = new Date(e);

    if (start > end) return;
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    setStartISO(start.toISOString());
    setEndISO(end.toISOString());

    setVisibleStart(start);
    setVisibleEnd(end);
  };

  const quickRange = (days: number) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);

    setStartISO(start.toISOString());
    setEndISO(end.toISOString());
    setVisibleStart(start);
    setVisibleEnd(end);
  };

  const lagoonName =
    lagoons.find((l) => l.id === lagoonId)?.name ?? lagoonId;

  return (
    <main className="h-full overflow-y-auto">
      <div className="min-h-175 p-4 rounded-2xl border border-slate-200 bg-gradient-to-b from-sky-50 to-white">

        <div className="mb-4 text-sm font-semibold text-slate-700">
          Laguna: {lagoonName}
        </div>

        <div className="relative w-full h-225 overflow-hidden">
          <LagoonSVG />
          <ScadaOverlay tags={tags} />
        </div>

        {resolvedPumps && (
          <div className="mt-6 w-full">
            <PumpStatusKpi pumps={resolvedPumps} />
          </div>
        )}

        <section className="mt-36">

          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              letterSpacing: 1,
              color: "#64748b",
              mb: 2,
              display: "block",
              fontFamily:
                "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
            }}
          >
            HISTÓRICO · VISTA {view.toUpperCase()}
          </Typography>

          {/* CONTROLES RESPONSIVOS */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr",
                md: "1fr 1fr 1fr",
              },
              alignItems: "center",
              gap: 2,
              mb: 3,
            }}
          >
            {/* LEFT - TAG SELECT */}
            <FormControl
              size="small"
              sx={{
                minWidth: 200,
                maxWidth: 240,
                width: "100%",
                fontFamily:
                  "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
                "& .MuiInputLabel-root": {
                  fontSize: "0.7rem",
                  fontWeight: 600,
                },
                "& .MuiSelect-select": {
                  fontSize: "0.75rem",
                  py: 0.6,
                },
              }}
            >
              <InputLabel>TAG</InputLabel>
              <Select
                multiple
                value={selectedTags}
                onChange={handleTagChange}
                input={<OutlinedInput label="TAG" />}
                renderValue={(selected) => {
                  const list = selected as string[];
                  if (!list.length) return "Seleccionar TAG";
                  if (list.length === availableTags.length)
                    return "Todos los TAG";
                  return list.join(", ");
                }}
                MenuProps={MENU_PROPS}
              >
                <MenuItem value={ALL_TAGS_VALUE}>
                  <Checkbox
                    size="small"
                    checked={allTagsSelected}
                    indeterminate={someTagsSelected}
                  />
                  <ListItemText
                    primary={
                      <Typography fontSize={12} fontWeight={600}>
                        Seleccionar todo
                      </Typography>
                    }
                  />
                </MenuItem>

                {availableTags.map((tag) => (
                  <MenuItem key={tag} value={tag}>
                    <Checkbox
                      size="small"
                      checked={selectedTags.includes(tag)}
                    />
                    <ListItemText
                      primary={
                        <Typography fontSize={12}>
                          {tag}
                        </Typography>
                      }
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* CENTER - QUICK RANGES */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              {quickRanges.map((r) => (
                <button
                  key={r.label}
                  className="px-3 py-1 text-xs rounded-md border border-slate-300 bg-white hover:bg-slate-100 transition"
                  onClick={() => quickRange(r.days)}
                >
                  {r.label}
                </button>
              ))}
            </Box>

            {/* RIGHT - DATE RANGE */}
            <Box
              sx={{
                display: "flex",
                justifyContent: {
                  xs: "stretch",
                  md: "flex-end",
                },
              }}
            >
              <DateRangePicker
                startISO={startISO}
                endISO={endISO}
                onChange={onDateRangeChange}
              />
            </Box>
          </Box>

          {/* CHART */}
          <div className="relative w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="h-95 overflow-hidden">
              <LagoonLineChart
                data={data}
                loading={loading}
                visibleStart={visibleStart}
                visibleEnd={visibleEnd}
                selectedTags={selectedTags}
                onRangeChange={(s, e) => {
                  setVisibleStart(s);
                  setVisibleEnd(e);
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
