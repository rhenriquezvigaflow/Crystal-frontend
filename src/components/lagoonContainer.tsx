import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getHistorySeriesTagKey } from "./charts/historySeries";

import { useScadaMapBundle } from "../hooks/useScadaMapBundle";
import { useScadaRealtime } from "../hooks/useScadaRealtime";
import { useHistory } from "../hooks/useHistory";
import { usePumpEventsLast3 } from "../hooks/usePumpEventsLast3";
import { useAuth } from "../auth/useAuth";
import type { LagoonAccess } from "../api/lagoonsApi";
import type { PumpEvent } from "../api/scadaPumpEvents";
import {
  sendSmallNumericControl,
  sendSmallPumpControl,
  type SmallPumpAction,
} from "../api/smallControl";
import { DAY_MS, SCADA_REALTIME_GRACE_MS } from "../config/timing";
import { useProduct } from "../modules/shared/product/useProduct";
import type { ProductType } from "../modules/shared/product/types";
import {
  buildRealtimeTagLookup,
  getRealtimeValue,
} from "../scada/layoutSceneResolver";
import { getScadaTankStateTagIds } from "../scada/layoutEquipmentState";
import { getPumpEventSortTime } from "../scada/pumpEventTime";
import type {
  RealtimeTagLookup,
  ResolvedScadaElement,
  ResolvedScadaMap,
  ResolvedScadaTextLabel,
  ScadaTagDefinition,
  ScadaTankStateTags,
} from "../types/scada-layouts";

interface Props {
  lagoon: LagoonAccess;
  onRealtimePtFitTagsChange?: (tags: string[]) => void;
}

function getViewByDays(days: number): "hourly" | "daily" | "weekly" {
  if (days <= 14) return "hourly";
  if (days <= 180) return "daily";
  return "weekly";
}

function daysBetween(a: Date, b: Date) {
  return Math.abs(b.getTime() - a.getTime()) / DAY_MS;
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

const isPtFitTag = (tagKey?: string) => {
  if (!tagKey) return false;
  const normalized = String(tagKey).trim().toUpperCase();
  return normalized.startsWith("PT") || normalized.startsWith("FIT");
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

const SCADA_MAP_STORAGE_KEY_PREFIX = "scada:map";
const LEGACY_CRYSTAL_SCADA_MAP_STORAGE_KEY_PREFIX = "crystal:scada:map";

function getScadaMapStorageKey(productType: ProductType | null | undefined, lagoonId: string): string {
  const normalizedProduct = productType ?? "crystal";
  return `${SCADA_MAP_STORAGE_KEY_PREFIX}:${normalizedProduct}:${String(lagoonId ?? "").trim().toLowerCase()}`;
}

function getLegacyCrystalScadaMapStorageKey(lagoonId: string): string {
  return `${LEGACY_CRYSTAL_SCADA_MAP_STORAGE_KEY_PREFIX}:${String(lagoonId ?? "").trim().toLowerCase()}`;
}

function readStoredMapId(productType: ProductType | null | undefined, lagoonId: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(getScadaMapStorageKey(productType, lagoonId));
    if (value?.trim()) return value.trim();
    if (productType === "crystal") {
      return window.localStorage.getItem(getLegacyCrystalScadaMapStorageKey(lagoonId))?.trim() || null;
    }
    return null;
  } catch {
    return null;
  }
}

function writeStoredMapId(
  productType: ProductType | null | undefined,
  lagoonId: string,
  mapId: string,
): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getScadaMapStorageKey(productType, lagoonId), mapId);
  } catch {
    // Best-effort persistence only.
  }
}

function resolveInitialMapIndex(
  maps: ResolvedScadaMap[],
  lagoonId: string,
  productType?: ProductType | null,
): number {
  if (!maps.length) return 0;

  const storedMapId = readStoredMapId(productType, lagoonId);
  if (storedMapId) {
    const storedIndex = maps.findIndex((map) => map.id === storedMapId);
    if (storedIndex >= 0) return storedIndex;
  }

  const defaultIndex = maps.findIndex((map) => map.default);
  return defaultIndex >= 0 ? defaultIndex : 0;
}

function formatRealtimeTimestamp(
  value: string | null,
  timezone?: string | null,
): string | null {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  try {
    return new Intl.DateTimeFormat("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      ...(timezone ? { timeZone: timezone } : {}),
    }).format(parsed);
  } catch {
    return parsed.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
}

type RealtimeHealthBannerProps = {
  connectionState:
    | "idle"
    | "connecting"
    | "connected"
    | "reconnecting"
    | "degraded"
    | "disconnected";
  lastDataAgeSec: number | null;
  lastTs: string | null;
  timezone?: string | null;
  error: string | null;
  graceExpired: boolean;
};

function RealtimeHealthBanner({
  connectionState,
  lastDataAgeSec,
  lastTs,
  timezone,
  error,
  graceExpired,
}: RealtimeHealthBannerProps) {
  const lastUpdateLabel = formatRealtimeTimestamp(lastTs, timezone);

  if (connectionState === "idle" || connectionState === "connected") {
    return null;
  }

  if (!graceExpired && (connectionState === "connecting" || connectionState === "reconnecting")) {
    return null;
  }

  if (connectionState === "connecting") {
    return (
      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
        Connecting real-time data...
      </div>
    );
  }

  if (connectionState === "reconnecting") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Reconnecting real-time data{lastUpdateLabel ? `, last data ${lastUpdateLabel}` : ""}.
      </div>
    );
  }

  if (connectionState === "degraded") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Frozen data{typeof lastDataAgeSec === "number" ? ` ${lastDataAgeSec}s ago` : ""}{lastUpdateLabel ? ` (last update ${lastUpdateLabel})` : ""}.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      Real-time data unavailable{lastUpdateLabel ? `, last data ${lastUpdateLabel}` : ""}.
      {error ? ` ${error}` : ""}
    </div>
  );
}

function extractEventTimestamp(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (!value || typeof value !== "object") return null;

  const obj = value as Record<string, unknown>;
  const candidates = [obj.timestamp, obj.ts, obj.updated_at, obj.last_on, obj.date, obj.datetime];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }

  return null;
}

function collectSceneTagIds(
  elements: ResolvedScadaElement[],
  options: { includeTankStateTags?: boolean } = {},
): string[] {
  const includeTankStateTags = options.includeTankStateTags ?? true;
  const tagIds = new Set<string>();

  elements.forEach((element) => {
    [element.tag, element.fallback_tag]
      .map((tagId) => String(tagId ?? "").trim())
      .filter(Boolean)
      .forEach((tagId) => tagIds.add(tagId));

    if (!includeTankStateTags || element.type !== "tank") return;

    getScadaTankStateTagIds((element.state_tags ?? {}) as ScadaTankStateTags)
      .forEach((tagId) => tagIds.add(tagId));
  });

  return Array.from(tagIds);
}

function collectSceneLabelTagIds(labels: ResolvedScadaTextLabel[]): string[] {
  const tagIds = new Set<string>();

  labels.forEach((label) => {
    [label.tag, label.fallback_tag]
      .map((tagId) => String(tagId ?? "").trim())
      .filter(Boolean)
      .forEach((tagId) => tagIds.add(tagId));
  });

  return Array.from(tagIds);
}

function filterTagsForScene(
  tags: Record<string, unknown>,
  allowedTagIds: string[],
): Record<string, unknown> {
  if (!allowedTagIds.length) return {};

  const allowed = new Set(
    allowedTagIds.map((tagId) => String(tagId).trim().toUpperCase()),
  );

  return Object.fromEntries(
    Object.entries(tags).filter(([tagId]) =>
      allowed.has(String(tagId).trim().toUpperCase()),
    ),
  );
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
    const arrayCandidates = [obj.events, obj.last_events, obj.history, obj.timestamps];

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
    .filter((ts) => getPumpEventSortTime(ts) !== null)
    .sort(
      (a, b) =>
        (getPumpEventSortTime(b) ?? Number.NEGATIVE_INFINITY) -
        (getPumpEventSortTime(a) ?? Number.NEGATIVE_INFINITY),
    )
    .slice(0, 3);
}

function sortPumpEventsByDate(events: PumpEvent[]): PumpEvent[] {
  return [...events].sort(
    (a, b) =>
      (getPumpEventSortTime(b.start_local) ?? Number.NEGATIVE_INFINITY) -
      (getPumpEventSortTime(a.start_local) ?? Number.NEGATIVE_INFINITY),
  );
}

function normalizePumpState(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value ? 1 : 0;

  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["1", "true", "on", "running", "funcionando"].includes(v)) return 1;
    if (["0", "false", "off", "stopped", "detenida"].includes(v)) return 0;
    if (["2", "moving", "moviendose"].includes(v)) return 2;
    if (["3", "fault", "falla", "alarm", "alarma"].includes(v)) return 3;
  }

  return null;
}

const KIRAH_FILTER_STATUS_TAG = "FILTRACION.ST";
const KIRAH_FILTER_STATUS_FALLBACK_TAG = "FILTRACION_ST";

const FILTER_STATUS_LABELS: Record<number, string> = {
  0: "STOPPED",
  1: "STOPPED",
  2: "SWITCHING TO SERVICE",
  3: "STARTING FILTRATION",
  4: "STARTING FILTRATION PUMP",
  5: "FILTERING",
  6: "SWITCHING TO BACKWASH",
  7: "SWITCHING TO BACKWASH",
  8: "STARTING BACKWASH",
  9: "BACKWASHING",
  10: "BACKWASH COMPLETE",
  11: "STOPPING BACKWASH",
};

function normalizeFilterStatus(value: unknown): number | null {
  if (typeof value === "boolean") return value ? 1 : 0;

  if (typeof value === "number" && Number.isFinite(value)) {
    const rounded = Math.round(value);
    return rounded === value && rounded >= 0 && rounded <= 11 ? rounded : null;
  }

  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;

  const rounded = Math.round(parsed);
  return rounded === parsed && rounded >= 0 && rounded <= 11 ? rounded : null;
}

function getFilterStatusLabel(tagLookup: RealtimeTagLookup): string {
  const rawStatus = getRealtimeValue(tagLookup, KIRAH_FILTER_STATUS_TAG, KIRAH_FILTER_STATUS_FALLBACK_TAG);
  const state = normalizeFilterStatus(rawStatus);
  return state === null ? "NO DATA" : FILTER_STATUS_LABELS[state] ?? "UNKNOWN STATUS";
}

function getConfiguredScadaStatusLabel(
  statusElement: ResolvedScadaElement | undefined,
  labels: ResolvedScadaTextLabel[],
  tagDefinitions: ScadaTagDefinition[],
  tagLookup: RealtimeTagLookup,
): string | null {
  const tag = String(statusElement?.tag ?? "").trim();
  const fallbackTag = String(statusElement?.fallback_tag ?? "").trim();
  if (!tag && !fallbackTag) return null;

  const rawStatus = getRealtimeValue(tagLookup, tag, fallbackTag);
  if (rawStatus === undefined || rawStatus === null || String(rawStatus).trim() === "") {
    return "NO DATA";
  }

  const stateKey = typeof rawStatus === "boolean"
    ? (rawStatus ? "1" : "0")
    : String(rawStatus).trim();
  const statusTagIds = new Set(
    [tag, fallbackTag]
      .filter(Boolean)
      .map((tagId) => tagId.toUpperCase()),
  );
  const stateLabel = labels.find((label) =>
    [label.tag, label.fallback_tag]
      .map((tagId) => String(tagId ?? "").trim().toUpperCase())
      .some((tagId) => tagId && statusTagIds.has(tagId)),
  );
  const statusTagDefinition = tagDefinitions.find((definition) => {
    const definitionTag = String(definition.tag ?? "").trim().toUpperCase();
    return definitionTag && statusTagIds.has(definitionTag);
  });

  const labelStateText = stateLabel?.states?.[stateKey]?.text;
  if (labelStateText) return labelStateText;

  const configuredStates = statusTagDefinition?.states ?? stateLabel?.states;
  if (configuredStates) {
    return statusTagDefinition?.states?.[stateKey] ?? "NO DATA";
  }

  return stateKey;
}

function isKirahMapOne(lagoonId: string, activeMap: ResolvedScadaMap | null): boolean {
  if (String(lagoonId).trim().toLowerCase() !== "kirah") return false;
  if (!activeMap) return false;

  const mapId = String(activeMap.id ?? "").trim().toLowerCase();
  const mapName = String(activeMap.name ?? "").trim().toLowerCase();
  const layoutId = String(activeMap.scene?.layout_id ?? "").trim().toLowerCase();
  const svgComponent = String(activeMap.scene?.svg_component ?? "").trim().toLowerCase();

  return (
    activeMap.default ||
    mapId === "layout4" ||
    mapName === "map 1" ||
    layoutId === "layout4" ||
    svgComponent === "layout4"
  );
}

interface PumpStatusSectionProps {
  lagoonId: string;
  pumpElements: ResolvedScadaElement[];
  tagLookup: RealtimeTagLookup;
  pumpLastOn: Record<string, unknown>;
  timezone?: string | null;
  productType: ProductType;
}

function PumpStatusSection({
  lagoonId,
  pumpElements,
  tagLookup,
  pumpLastOn,
  timezone,
  productType,
}: PumpStatusSectionProps) {
  const {
    events: latestPumpEvents,
    loading: pumpEventsLoading,
    error: pumpEventsError,
  } = usePumpEventsLast3(lagoonId, productType);

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

  const isPumpEventsEmpty = !pumpEventsLoading && !pumpEventsError && latestPumpEvents.length === 0;

  const resolvedPumps = useMemo(() => {
    if (!pumpElements.length) return null;

    return Object.fromEntries(
      pumpElements.map((pump) => {
        const effectiveTagId = String(pump.tag ?? pump.fallback_tag ?? "").trim();
        const realtimeValue = getRealtimeValue(tagLookup, pump.tag, pump.fallback_tag);

        const endpointEvents =
          pumpEventsByTag.get(effectiveTagId) ??
          pumpEventsByTag.get(String(pump.fallback_tag ?? "")) ??
          [];

        const fallbackEvents = normalizePumpEvents(
          pumpLastOn?.[effectiveTagId] ?? pumpLastOn?.[String(pump.fallback_tag ?? "")],
        ).map((startLocal) => ({
          lagoon_id: lagoonId,
          tag_id: effectiveTagId,
          tag_label: pump.label || effectiveTagId,
          start_local: startLocal,
        }));

        const events = (endpointEvents.length ? endpointEvents : pumpEventsError ? fallbackEvents : []).slice(0, 3);

        return [
          pump.id,
          {
            label: pump.label,
            state: normalizePumpState(realtimeValue),
            events,
          },
        ];
      }),
    );
  }, [lagoonId, pumpElements, pumpEventsByTag, pumpEventsError, pumpLastOn, tagLookup]);

  if (!resolvedPumps) return null;

  return (
    <PumpStatusKpi
      lagoonId={lagoonId}
      productType={productType}
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
  productType: ProductType;
}

function HistorySection({ lagoonId, timezone, productType }: HistorySectionProps) {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - DAY_MS);

  const [visibleStart, setVisibleStart] = useState<Date>(oneDayAgo);
  const [visibleEnd, setVisibleEnd] = useState<Date>(now);

  const commitVisibleRange = useCallback((start: Date, end: Date) => {
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

    if (start <= end) {
      setVisibleStart(new Date(start));
      setVisibleEnd(new Date(end));
      return;
    }

    setVisibleStart(new Date(end));
    setVisibleEnd(new Date(start));
  }, []);

  const daysVisible = useMemo(() => daysBetween(visibleStart, visibleEnd), [visibleStart, visibleEnd]);
  const view = getViewByDays(daysVisible);

  const { data, loading } = useHistory({
    lagoonId,
    startDate: visibleStart.toISOString(),
    endDate: visibleEnd.toISOString(),
    view,
    productType,
  });

  const availableTags = useMemo(() => {
    const series = data?.series ?? [];
    const tags = series
      .map(getHistorySeriesTagKey)
      .filter((tag: string) => isPlottableTag(tag));

    return Array.from(new Set(tags)).sort();
  }, [data]);

  const [selectedTags, setSelectedTags] = useState<string[] | null>([]);
  const ignoreNextTagChangeRef = useRef(false);
  const visibleSelectedTags = useMemo(() => {
    if (!availableTags.length) return [];
    if (selectedTags === null) return availableTags;

    const availableTagSet = new Set(availableTags);
    return selectedTags.filter((tag) => availableTagSet.has(tag));
  }, [availableTags, selectedTags]);

  const toggleAllTags = () => {
    ignoreNextTagChangeRef.current = true;
    setSelectedTags((currentTags) => {
      if (!availableTags.length) return currentTags;
      if (currentTags === null) return [];

      const availableTagSet = new Set(availableTags);
      const validSelectedCount = currentTags.filter((tag) => availableTagSet.has(tag)).length;
      return validSelectedCount === availableTags.length ? [] : null;
    });

    window.setTimeout(() => {
      ignoreNextTagChangeRef.current = false;
    }, 0);
  };

  const handleTagChange = (event: SelectChangeEvent<string[]>) => {
    if (ignoreNextTagChangeRef.current) {
      ignoreNextTagChangeRef.current = false;
      return;
    }

    const value = event.target.value;
    const nextValue = typeof value === "string" ? value.split(",") : value;

    if (nextValue.includes(ALL_TAGS_VALUE)) {
      toggleAllTags();
      return;
    }

    setSelectedTags(nextValue);
  };

  const allTagsSelected = availableTags.length > 0 && visibleSelectedTags.length === availableTags.length;
  const someTagsSelected = visibleSelectedTags.length > 0 && visibleSelectedTags.length < availableTags.length;
  const chartSelectedTags = selectedTags === null ? undefined : visibleSelectedTags;

  const quickRange = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * DAY_MS);

    commitVisibleRange(start, end);
  };

  return (
    <section className="lagoon-panel rounded-[16px] p-4 sm:p-5">
      <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, color: "#4f7fa2", mb: 2, display: "block" }}>
        HISTORICAL - VIEW {view.toUpperCase()}
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 260px) minmax(0, 1fr) auto" }, alignItems: "center", gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 240 }, maxWidth: { xs: "100%", md: 280 } }}>
          <InputLabel shrink>TAG</InputLabel>
          <Select
            multiple
            displayEmpty
            value={visibleSelectedTags}
            onChange={handleTagChange}
            input={<OutlinedInput label="TAG" />}
            renderValue={(selected) => {
              const list = selected as string[];
              if (!list.length) return "Select TAG";
              if (list.length === availableTags.length) return "All TAG";
              return list.join(", ");
            }}
            MenuProps={MENU_PROPS}
          >
            <MenuItem value={ALL_TAGS_VALUE} onClick={toggleAllTags}>
              <Checkbox size="small" checked={allTagsSelected} indeterminate={someTagsSelected} />
              <ListItemText primary={allTagsSelected ? "Deselect all" : "Select all"} />
            </MenuItem>

            {availableTags.map((tag) => (
              <MenuItem key={tag} value={tag}>
                <Checkbox size="small" checked={visibleSelectedTags.includes(tag)} />
                <ListItemText primary={tag} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "center" }, gap: 1, flexWrap: "wrap" }}>
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
            start={visibleStart}
            end={visibleEnd}
            timezone={timezone}
            onChange={commitVisibleRange}
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
            selectedTags={chartSelectedTags}
            timezone={timezone}
            onRangeChange={commitVisibleRange}
          />
        </div>
      </div>
    </section>
  );
}

export default function LagoonContainer({ lagoon, onRealtimePtFitTagsChange }: Props) {
  const { accessToken } = useAuth();
  const product = useProduct();
  const productType = lagoon.product_type ?? product.id;
  const { bundle, loading: mapsLoading, error: mapsError } = useScadaMapBundle(
    lagoon.lagoon_id,
  );

  const lagoonId = lagoon.lagoon_id;
  const lagoonName = lagoon.lagoon_name;
  const maps = useMemo(() => bundle?.maps ?? [], [bundle]);
  const [activeMapIndex, setActiveMapIndex] = useState(0);
  const resolvedActiveMapIndex = useMemo(() => {
    if (!maps.length) return 0;
    if (maps[activeMapIndex]) return activeMapIndex;
    return resolveInitialMapIndex(maps, lagoonId, productType);
  }, [activeMapIndex, lagoonId, maps, productType]);

  const activeMap = maps[resolvedActiveMapIndex] ?? null;
  const scene = activeMap?.scene ?? null;
  const resolvedElements = useMemo(() => scene?.elements ?? [], [scene]);
  const resolvedLabels = useMemo(() => scene?.labels ?? [], [scene]);

  useEffect(() => {
    if (!activeMap) return;
    writeStoredMapId(productType, lagoonId, activeMap.id);
  }, [activeMap, lagoonId, productType]);

  const pumpElements = useMemo(
    () => resolvedElements.filter((element) => element.type === "pump" && element.panel === "pump-status"),
    [resolvedElements],
  );
  const overlayElements = useMemo(
    () => resolvedElements.filter((element) => element.type === "kpi" || element.type === "plc_status"),
    [resolvedElements],
  );
  const equipmentElements = useMemo(
    () =>
      resolvedElements.filter(
        (element) =>
          element.type === "pump" ||
          element.type === "valve" ||
          element.type === "tank" ||
          element.type === "chemical",
      ),
    [resolvedElements],
  );

  const {
    tags,
    pumpLastOn,
    ts,
    realtime_ready,
    connection_state,
    connection_error,
    last_data_age_sec,
    plc_status,
    local_time,
    timezone,
  } = useScadaRealtime(lagoonId, accessToken, productType);
  const lagoonHeading = lagoon.timezone ?? "SCADA";
  const historyTimezone = timezone ?? lagoon.timezone;
  const overlayTagIds = useMemo(
    () =>
      Array.from(new Set([
        ...collectSceneTagIds(overlayElements, { includeTankStateTags: false }),
        ...collectSceneLabelTagIds(resolvedLabels),
      ])),
    [overlayElements, resolvedLabels],
  );
  const equipmentTagIds = useMemo(
    () =>
      Array.from(new Set([
        ...collectSceneTagIds(equipmentElements, { includeTankStateTags: true }),
        ...(scene?.numeric_controls ?? []).map((control) => control.tag),
      ])),
    [equipmentElements, scene?.numeric_controls],
  );
  const overlayTags = useMemo(
    () => filterTagsForScene(tags, overlayTagIds),
    [overlayTagIds, tags],
  );
  const equipmentTags = useMemo(
    () => filterTagsForScene(tags, equipmentTagIds),
    [equipmentTagIds, tags],
  );
  const realtimeTagLookup = useMemo(
    () => buildRealtimeTagLookup(tags),
    [tags],
  );
  const overlayTagLookup = useMemo(
    () => buildRealtimeTagLookup(overlayTags),
    [overlayTags],
  );
  const equipmentTagLookup = useMemo(
    () => buildRealtimeTagLookup(equipmentTags),
    [equipmentTags],
  );
  const hasScadaCards = resolvedElements.length > 0;
  const hasRenderableMap = Boolean(activeMap);
  const [realtimeGraceExpired, setRealtimeGraceExpired] = useState<string | null>(null);
  const shouldWaitForRealtime =
    hasRenderableMap &&
    !mapsError &&
    !mapsLoading &&
    Boolean(scene) &&
    hasScadaCards &&
    !realtime_ready;
  const realtimeGraceKey = shouldWaitForRealtime
    ? `${lagoonId}:${activeMap?.id ?? "default"}`
    : null;
  const isRealtimeGraceExpired =
    realtimeGraceKey !== null && realtimeGraceExpired === realtimeGraceKey;

  useEffect(() => {
    if (!realtimeGraceKey) return;

    const timer = window.setTimeout(() => {
      setRealtimeGraceExpired(realtimeGraceKey);
    }, SCADA_REALTIME_GRACE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [realtimeGraceKey]);

  const scadaMapLoading = !mapsError && (
      mapsLoading ||
      (hasRenderableMap && (
        !scene ||
      (hasScadaCards && !realtime_ready && !isRealtimeGraceExpired)
    ))
  );

  const realtimePtFitTags = useMemo(
    () => Object.keys(overlayTags).filter(isPtFitTag).sort((left, right) => left.localeCompare(right)),
    [overlayTags],
  );
  const filterStatus = useMemo(
    () => {
      const configuredStatus = getConfiguredScadaStatusLabel(
        overlayElements.find((element) => element.type === "plc_status"),
        resolvedLabels,
        scene?.tags ?? [],
        realtimeTagLookup,
      );
      if (configuredStatus) return configuredStatus;

      return isKirahMapOne(lagoonId, activeMap)
        ? getFilterStatusLabel(realtimeTagLookup)
        : null;
    },
    [activeMap, lagoonId, overlayElements, realtimeTagLookup, resolvedLabels, scene?.tags],
  );
  const sendPumpAction = useCallback(
    async (action: SmallPumpAction, moduleId: string) => {
      if (productType !== "small") {
        throw new Error("Pump control is only available for Small Lagoons.");
      }
      await sendSmallPumpControl(lagoonId, action, moduleId);
    },
    [lagoonId, productType],
  );
  const handleStartPump = useCallback(
    async (moduleId: string) => sendPumpAction("partir", moduleId),
    [sendPumpAction],
  );
  const handleStopPump = useCallback(
    async (moduleId: string) => sendPumpAction("parar", moduleId),
    [sendPumpAction],
  );
  const handleWriteNumericControl = useCallback(
    async (moduleId: string, commandId: string, value: number) => {
      if (productType !== "small") {
        throw new Error("Numeric control is only available for Small Lagoons.");
      }
      await sendSmallNumericControl(
        lagoonId,
        moduleId,
        commandId,
        value,
      );
    },
    [lagoonId, productType],
  );

  useEffect(() => {
    onRealtimePtFitTagsChange?.(realtimePtFitTags);
  }, [onRealtimePtFitTagsChange, realtimePtFitTags]);

  return (
    <main className="h-full">
      <div className="space-y-6 px-0 py-1 sm:py-1.5">
        {mapsError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {mapsError}
          </div>
        ) : null}

        {bundle?.warnings?.length ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {bundle.warnings.join(" | ")}
          </div>
        ) : null}

        {mapsLoading && !scene && !scadaMapLoading ? (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            Loading SCADA layout...
          </div>
        ) : null}

        <RealtimeHealthBanner
          connectionState={connection_state}
          lastDataAgeSec={last_data_age_sec}
          lastTs={ts}
          timezone={timezone}
          error={connection_error}
          graceExpired={isRealtimeGraceExpired}
        />

        <ScadaMapPanel
          heading={lagoonHeading}
          title={lagoonName}
          maps={maps}
          activeMapIndex={resolvedActiveMapIndex}
          onActiveMapIndexChange={setActiveMapIndex}
          tagLookup={overlayTagLookup}
          equipmentTagLookup={equipmentTagLookup}
          loading={scadaMapLoading}
          plcStatus={plc_status}
          localTime={local_time}
          timezone={timezone}
          filterStatus={filterStatus}
          canControl={lagoon.can_control}
          onStartPump={handleStartPump}
          onStopPump={handleStopPump}
          onWriteNumericControl={handleWriteNumericControl}
        />

        {!lagoon.can_control ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Pump controls hidden by RBAC permissions.
          </div>
        ) : null}

        <div className="mt-6 space-y-6">
          {pumpElements.length ? (
            <PumpStatusSection
              lagoonId={lagoonId}
              pumpElements={pumpElements}
              tagLookup={equipmentTagLookup}
              pumpLastOn={pumpLastOn}
              timezone={timezone}
              productType={productType}
            />
          ) : null}

          <HistorySection
            lagoonId={lagoonId}
            timezone={historyTimezone}
            productType={productType}
          />
        </div>
      </div>
    </main>
  );
}
