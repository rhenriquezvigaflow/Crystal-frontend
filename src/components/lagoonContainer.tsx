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

import LagoonLineChart from "./charts/LagoonLineChart";
import DateRangePicker from "./filters/DateRangePicker";
import PumpStatusKpi from "./lagoon/PumpStatusKpi";
import ScadaMapPanel from "./lagoon/ScadaMapPanel";

import { useScadaRealtime } from "../hooks/useScadaRealtime";
import { useHistory } from "../hooks/useHistory";
import { usePumpEventsLast3 } from "../hooks/usePumpEventsLast3";
import type { PumpEvent } from "../api/scadaPumpEvents";
import { lagoons } from "../data/lagoons";
import { svgRegistry } from "../scada/svgRegistry";

interface Props {
  lagoonId: string;
}

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

function extractEventTimestamp(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (!value || typeof value !== "object") return null;

  const obj = value as Record<string, unknown>;
  const candidates = [
    obj.timestamp,
    obj.ts,
    obj.updated_at,
    obj.last_on,
    obj.date,
    obj.datetime,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }

  return null;
}

function normalizePumpEvents(value: unknown): string[] {
  if (!value) return [];

  const list: string[] = [];

  if (Array.isArray(value)) {
    value.forEach((item) => {
      const ts = extractEventTimestamp(item);
      if (ts) list.push(ts);
    });
  } else if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const arrayCandidates = [
      obj.events,
      obj.last_events,
      obj.history,
      obj.timestamps,
    ];

    for (const candidate of arrayCandidates) {
      if (Array.isArray(candidate)) {
        candidate.forEach((item) => {
          const ts = extractEventTimestamp(item);
          if (ts) list.push(ts);
        });
      }
    }

    const single = extractEventTimestamp(obj);
    if (single) list.push(single);
  } else if (typeof value === "string") {
    list.push(value);
  }

  return Array.from(new Set(list))
    .filter((ts) => !Number.isNaN(new Date(ts).getTime()))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, 3);
}

function sortPumpEventsByDate(events: PumpEvent[]): PumpEvent[] {
  return [...events].sort(
    (a, b) =>
      new Date(b.start_local).getTime() - new Date(a.start_local).getTime(),
  );
}

function normalizePumpState(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (typeof value === "string") {
    const v = value.trim().toLowerCase();

    if (["1", "true", "on", "running", "funcionando"].includes(v)) return 1;
    if (["0", "false", "off", "stopped", "detenida"].includes(v)) return 0;
  }

  return null;
}

interface PumpStatusSectionProps {
  lagoonId: string;
  layout: any;
  tags: Record<string, any>;
  pumpLastOn: Record<string, any>;
  timezone?: string | null;
}

function PumpStatusSection({
  lagoonId,
  layout,
  tags,
  pumpLastOn,
  timezone,
}: PumpStatusSectionProps) {
  const {
    events: latestPumpEvents,
    loading: pumpEventsLoading,
    error: pumpEventsError,
  } = usePumpEventsLast3(lagoonId);

  const pumpsKpi = layout?.kpis?.find((kpi: any) => kpi.type === "pumps") as
    | any
    | undefined;

  const pumpEventsByTag = useMemo(() => {
    const map = new Map<string, PumpEvent[]>();

    latestPumpEvents.forEach((event) => {
      if (!event?.tag_id) return;
      const key = String(event.tag_id);
      const current = map.get(key) ?? [];
      current.push(event);
      map.set(key, current);
    });

    map.forEach((events, key) => {
      map.set(key, sortPumpEventsByDate(events).slice(0, 3));
    });

    return map;
  }, [latestPumpEvents]);

  const isPumpEventsEmpty =
    !pumpEventsLoading &&
    !pumpEventsError &&
    latestPumpEvents.length === 0;

  const resolvedPumps = useMemo(() => {
    if (!pumpsKpi?.pumps) return null;

    return Object.fromEntries(
      pumpsKpi.pumps.map((pump: any) => [
        pump.id,
        (() => {
          const endpointEvents = pumpEventsByTag.get(pump.backendTag) ?? [];
          const fallbackEvents = normalizePumpEvents(
            pumpLastOn?.[pump.backendTag],
          ).map((startLocal) => ({
            lagoon_id: lagoonId,
            tag_id: pump.backendTag,
            tag_label: pump.label || pump.backendTag,
            start_local: startLocal,
          }));

          const events = (endpointEvents.length
            ? endpointEvents
            : pumpEventsError
              ? fallbackEvents
              : []
          ).slice(0, 3);

          return {
            label: pump.label,
            state: normalizePumpState(tags[pump.backendTag]),
            events,
          };
        })(),
      ]),
    );
  }, [lagoonId, pumpEventsByTag, pumpEventsError, pumpLastOn, pumpsKpi, tags]);

  if (!resolvedPumps) return null;

  return (
    <PumpStatusKpi
      pumps={resolvedPumps}
      timezone={timezone}
      eventsLoading={pumpEventsLoading}
      eventsError={pumpEventsError}
      eventsEmpty={isPumpEventsEmpty}
    />
  );
}

interface HistorySectionProps {
  lagoonId: string;
  timezone?: string | null;
}

function HistorySection({ lagoonId, timezone }: HistorySectionProps) {
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

  const { data, loading } = useHistory({
    lagoonId,
    startDate: visibleStart.toISOString(),
    endDate: visibleEnd.toISOString(),
    view,
  });

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
    const nextValue = typeof value === "string" ? value.split(",") : value;

    if (nextValue.includes(ALL_TAGS_VALUE)) {
      setSelectedTags((prev) =>
        prev.length === availableTags.length ? [] : availableTags,
      );
      return;
    }

    setSelectedTags(nextValue);
  };

  const allTagsSelected =
    availableTags.length > 0 && selectedTags.length === availableTags.length;

  const someTagsSelected =
    selectedTags.length > 0 && selectedTags.length < availableTags.length;

  const onDateRangeChange = (startValue: string, endValue: string) => {
    const start = new Date(startValue);
    const end = new Date(endValue);

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

  return (
    <section className="lagoon-panel rounded-[16px] p-4 sm:p-5">
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          letterSpacing: 1,
          color: "#4f7fa2",
          mb: 2,
          display: "block",
        }}
      >
        HISTORICO - VISTA {view.toUpperCase()}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 260px) minmax(0, 1fr) auto",
          },
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        <FormControl
          size="small"
          sx={{
            minWidth: { xs: "100%", md: 240 },
            maxWidth: { xs: "100%", md: 280 },
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
              if (list.length === availableTags.length) return "Todos los TAG";
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
              <ListItemText primary="Seleccionar todo" />
            </MenuItem>

            {availableTags.map((tag) => (
              <MenuItem key={tag} value={tag}>
                <Checkbox size="small" checked={selectedTags.includes(tag)} />
                <ListItemText primary={tag} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box
          sx={{
            display: "flex",
            justifyContent: { xs: "flex-start", md: "center" },
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {quickRanges.map((range) => (
            <button
              key={range.label}
              className="rounded-md border border-sky-100 bg-white/88 px-3 py-1.5 text-xs font-medium text-sky-900 shadow-[0_12px_24px_-20px_rgba(29,92,128,0.45)] transition hover:border-sky-200 hover:bg-sky-50"
              onClick={() => quickRange(range.days)}
            >
              {range.label}
            </button>
          ))}
        </Box>

        <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
          <DateRangePicker
            startISO={startISO}
            endISO={endISO}
            onChange={onDateRangeChange}
          />
        </Box>
      </Box>

      <div className="relative w-full overflow-hidden rounded-xl border border-sky-100 bg-white/92 shadow-[0_18px_34px_-24px_rgba(29,92,128,0.28)]">
        <div className="h-[19rem] sm:h-[22rem] lg:h-[24rem]">
          <LagoonLineChart
            data={data}
            loading={loading}
            visibleStart={visibleStart}
            visibleEnd={visibleEnd}
            selectedTags={selectedTags}
            timezone={timezone}
            onRangeChange={(start, end) => {
              setVisibleStart(start);
              setVisibleEnd(end);
            }}
          />
        </div>
      </div>
    </section>
  );
}

export default function LagoonContainer({
  lagoonId,
}: Props) {
  const lagoonConfig = lagoons.find((lagoon) => lagoon.id === lagoonId);
  const lagoonName = lagoonConfig?.name ?? lagoonId;
  const lagoonCountry = lagoonConfig?.country ?? "Laguna";
  const [layout, setLayout] = useState<any>(null);

  useEffect(() => {
    if (!lagoonConfig?.layout) {
      setLayout(null);
      return;
    }

    import(`../layouts/crystal-${lagoonConfig.layout}.layout.json`)
      .then((module) => setLayout(module.default))
      .catch(() => setLayout(null));
  }, [lagoonConfig]);

  const svgEntry =
    lagoonConfig?.layout && svgRegistry[lagoonConfig.layout]
      ? svgRegistry[lagoonConfig.layout]
      : null;

  const SvgComponent = svgEntry?.component ?? null;
  const aspectRatio = svgEntry?.aspectRatio ?? "1429.5 / 960";

  const { tags, pumpLastOn, plc_status, local_time, timezone } =
    useScadaRealtime(lagoonId);

  const mapPanel = (
    <ScadaMapPanel
      heading={lagoonCountry}
      title={lagoonName}
      layout={layout}
      tags={tags}
      plcStatus={plc_status}
      localTime={local_time}
      timezone={timezone}
      SvgComponent={SvgComponent}
      aspectRatio={aspectRatio}
    />
  );

  return (
    <main className="h-full">
      <div className="space-y-6 p-1 sm:p-2">
        {mapPanel}

        <div className="mt-6 space-y-6">
          {layout && (
            <PumpStatusSection
              lagoonId={lagoonId}
              layout={layout}
              tags={tags}
              pumpLastOn={pumpLastOn}
              timezone={timezone}
            />
          )}

          <HistorySection lagoonId={lagoonId} timezone={timezone} />
        </div>
      </div>
    </main>
  );
}
