# Timezone Implementation Guide

## Objective

Implement a consistent timezone strategy in this frontend so all dates:

1. Are stored and exchanged in UTC.
2. Are associated with an IANA timezone such as `America/Santiago`.
3. Are converted only when displayed or when the user selects local calendar dates.
4. Behave correctly for DST changes.

This document is intended for an implementation agent.

## Core Rules

1. Persist timestamps in UTC ISO format.
   Example: `2026-05-05T18:30:00.000Z`
2. Never persist formatted local time strings.
   Avoid values like `05/05/2026 15:30`
3. Use IANA timezone identifiers.
   Good: `America/Santiago`
   Bad: `-04:00`
4. Convert on render, not before saving.
5. For date inputs like `YYYY-MM-DD`, interpret that date in the assigned business timezone, not in the browser timezone.

## Current Project Context

This repo already receives timezone values from the backend and realtime payloads.

Relevant files:

- `src/api/lagoonsApi.ts`
- `src/hooks/useScadaRealtime.ts`
- `src/components/filters/DateRangePicker.tsx`
- `src/components/charts/LagoonLineChart.tsx`
- `src/components/lagoonContainer.tsx`
- `src/scada/pumpEventTime.ts`

## Target Architecture

Create a shared module:

```text
src/
  lib/
    datetime/
      index.ts
      types.ts
      timezone.ts
      countryTimezones.ts
```

### Suggested responsibilities

- `types.ts`
  - shared date and timezone types
- `countryTimezones.ts`
  - optional map `countryCode -> IANA timezone`
- `timezone.ts`
  - parse and validate timezone
  - resolve effective timezone from multiple candidates
  - format UTC timestamps in a timezone
  - convert `YYYY-MM-DD` local date input into UTC ISO boundaries
- `index.ts`
  - barrel exports

## Minimum Utility API

Implement at least these helpers:

```ts
export type DateLike = Date | string | number | null | undefined;
export type TimeZoneLike = string | null | undefined;

export function parseDateValue(value: DateLike): Date | null;
export function isValidTimeZone(value: string): boolean;
export function normalizeTimeZone(value: TimeZoneLike): string | null;
export function resolveTimeZone(...candidates: TimeZoneLike[]): string;

export function formatInTimeZone(
  value: DateLike,
  options: Intl.DateTimeFormatOptions,
  config?: {
    locale?: string;
    timeZone?: TimeZoneLike;
    stripComma?: boolean;
  },
): string | null;

export function toDateInputValue(
  value: DateLike,
  timeZone?: TimeZoneLike,
): string;

export function localDateToUtcISOString(
  value: string,
  timeZone?: TimeZoneLike,
  boundary?: "start" | "end",
): string | null;

export function getUtcRangeForPastDays(
  days: number,
  timeZone?: TimeZoneLike,
  referenceDate?: Date,
): {
  startDateInput: string;
  endDateInput: string;
  startISO: string;
  endISO: string;
};
```

## Country Mapping

Only if needed by the product:

```ts
const COUNTRY_TIMEZONES: Record<string, string> = {
  CL: "America/Santiago",
  MX: "America/Mexico_City",
  ES: "Europe/Madrid",
  PE: "America/Lima",
};
```

Use this only as a fallback when the backend does not already provide the exact timezone.

## Implementation Plan

### 1. Normalize timezone from API and realtime

Update:

- `src/api/lagoonsApi.ts`
- `src/hooks/useScadaRealtime.ts`

Behavior:

- trim timezone strings
- validate them with `Intl.DateTimeFormat`
- if invalid, store `null`

Example:

```ts
timezone: normalizeTimeZone(raw.timezone)
```

and:

```ts
setTimezone(normalizeTimeZone(msg.timezone))
```

### 2. Centralize display formatting

Update:

- `src/scada/pumpEventTime.ts`
- `src/components/lagoonContainer.tsx`
- `src/components/charts/LagoonLineChart.tsx`

Replace inline `Intl.DateTimeFormat` duplication with `formatInTimeZone(...)`.

Examples:

```ts
formatInTimeZone(timestamp, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
}, { locale: "es-CL", timeZone })
```

```ts
formatInTimeZone(timestamp, {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
}, { locale: "es-CL", timeZone, stripComma: true })
```

### 3. Fix date-range inputs so they use lagoon timezone

Update:

- `src/components/filters/DateRangePicker.tsx`
- `src/components/lagoonContainer.tsx`

Current problem:

- date inputs are currently converted using browser-local `new Date("YYYY-MM-DDT00:00:00")`
- this causes wrong UTC values when the lagoon timezone differs from the browser timezone

Required behavior:

- when the user picks `2026-05-05`
- interpret that as:
  - `2026-05-05 00:00:00` in lagoon timezone for start
  - `2026-05-05 23:59:59.999` in lagoon timezone for end
- then convert that local zoned datetime to UTC ISO

Example:

```ts
localDateToUtcISOString("2026-05-05", "America/Santiago", "start")
localDateToUtcISOString("2026-05-05", "America/Santiago", "end")
```

Also:

- display the `input[type="date"]` value using `toDateInputValue(startISO, timezone)`
- not `iso.slice(0, 10)`

### 4. Use an effective timezone everywhere

In container-level code, resolve timezone once:

```ts
const effectiveTimeZone = resolveTimeZone(
  realtimeTimezone,
  lagoon.timezone,
);
```

Then pass `effectiveTimeZone` to:

- realtime banners
- charts
- pump event formatting
- date-range picker
- SCADA panels if relevant

## Chart Resolution Logic

The agent must preserve the current chart behavior for `hourly`, `daily`, and `weekly`.

In this project, `view` is not just a label. It affects:

1. The `resolution` sent to the history API.
2. The range label shown in the UI.
3. The way timestamps are normalized and aligned in the chart.

### Current selection rule

The current rule is based on the number of visible days in the selected range:

```ts
function getViewByDays(days: number): "hourly" | "daily" | "weekly" {
  if (days <= 14) return "hourly";
  if (days <= 180) return "daily";
  return "weekly";
}
```

Meaning:

- `hourly`: ranges up to 14 days
- `daily`: ranges greater than 14 days and up to 180 days
- `weekly`: ranges greater than 180 days

This logic exists today in:

- `src/components/lagoonContainer.tsx`
- `src/components/charts/LagoonLineChart.tsx`

The implementation agent should keep both places consistent, or ideally centralize this helper to avoid drift.

### Backend request behavior

The frontend sends `view` to `useHistory`, and `useHistory` sends it to the API as:

```ts
resolution: view
```

Current values expected by the backend:

- `hourly`
- `daily`
- `weekly`

The agent must not change those literal values unless backend contracts also change.

### Frontend alignment behavior

Even if the backend already returns aggregated data, the chart currently normalizes timestamps again in the frontend so all series share the same aligned timeline.

This happens in `LagoonLineChart.tsx` through `normalizeByView(...)`.

#### Hourly

For `hourly`:

- timestamps are floored to the start of the hour
- logic:

```ts
const ms = new Date(ts).getTime();
return Math.floor(ms / HOUR_MS) * HOUR_MS;
```

Implication:

- points from the same hour are aligned to the same x-axis bucket

#### Daily

For `daily`:

- timestamps are normalized to the UTC day anchor at `12:00`
- current logic:

```ts
function normalizeDayUtc(ts: string | Date) {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12);
}
```

Why noon UTC is used:

- it acts as a stable anchor away from midnight edge cases
- it reduces the chance that timezone conversion shifts the label to the previous or next calendar day

Important:

- if the agent introduces timezone-aware date-range conversion, it should preserve this same chart-bucketing intent unless there is a deliberate refactor of the entire historical model

#### Weekly

For `weekly`:

- timestamps are normalized to the Monday of that UTC week, anchored at `12:00`
- current logic:

```ts
function normalizeWeekUtc(ts: string | Date) {
  const d = new Date(ts);
  const day = d.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  return Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() - diffToMonday,
    12,
  );
}
```

Meaning:

- all points in the same week collapse into the same weekly bucket
- Monday is the start of the week in the current implementation

### What the agent must preserve

When applying timezone improvements, the agent must preserve these invariants:

1. `view` selection still depends on visible range size.
2. The same `view` is sent to backend as `resolution`.
3. The chart still aligns all series to shared hourly/daily/weekly buckets.
4. Tooltip and axis labels may be formatted in lagoon timezone, but bucket alignment must remain stable.
5. `daily` and `weekly` grouping must not accidentally shift because of the browser timezone.

### Recommended adjustment for timezone work

If the agent refactors the chart for timezone correctness:

1. Keep `view` thresholds exactly the same.
2. Keep backend `resolution` values exactly the same.
3. Review whether `normalizeDayUtc` and `normalizeWeekUtc` should remain UTC-anchored or become lagoon-timezone anchored.
4. If changing bucket anchoring, do it intentionally and test that:
   - daily points do not move one day backward or forward
   - weekly points still group consistently
   - zoom and visible range still behave correctly

Unless there is a strong reason to change aggregation semantics, the safer approach is:

- fix timezone conversion for input/output formatting
- keep existing hourly/daily/weekly bucket normalization semantics

### Specific acceptance for chart resolution

The chart part is correct if:

1. A 7-day range uses `hourly`.
2. A 30-day range uses `daily`.
3. A 365-day range uses `weekly`.
4. The request sent to history API uses the same `view` as `resolution`.
5. Multiple series with missing points still align on one common timeline.
6. After timezone work, labels may change presentation timezone, but data grouping does not become inconsistent.

## Conversion Notes

### UTC to local render

Use:

```ts
new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
}).format(new Date(utcIso))
```

### Local calendar date to UTC

This is the tricky part.

The agent must not rely on browser local timezone when converting `YYYY-MM-DD`.

A valid approach is:

1. Parse the calendar parts.
2. Build a provisional UTC timestamp.
3. Calculate the offset for the target timezone using `Intl.DateTimeFormat(...).formatToParts(...)`.
4. Adjust the timestamp.
5. Recalculate once more in case DST changed the offset around the boundary.

## Acceptance Criteria

Implementation is correct if:

1. Dates from API remain stored as UTC strings.
2. Pump events display correctly in the lagoon timezone.
3. Realtime timestamps display correctly in the lagoon timezone.
4. Chart axis labels and tooltips display in the lagoon timezone.
5. Picking a date range in the UI does not depend on the browser timezone.
6. If the browser is in Chile and the lagoon is in Spain, the selected calendar range still resolves using `Europe/Madrid`.
7. Invalid timezone strings fail safely to `null` or `"UTC"`.

## Test Cases

### Case 1: Chile lagoon, browser in Mexico

- Lagoon timezone: `America/Santiago`
- Browser timezone: `America/Mexico_City`
- User selects `2026-05-05`

Expected:

- start UTC should represent midnight in Santiago
- end UTC should represent end-of-day in Santiago

### Case 2: Spain lagoon, browser in Chile

- Lagoon timezone: `Europe/Madrid`
- Realtime timestamp: `2026-11-01T01:30:00.000Z`

Expected:

- label and chart tooltip should render in Madrid local time

### Case 3: Invalid timezone from backend

- backend timezone: `"Chile"`

Expected:

- normalize to `null`
- app falls back to resolved default safely

## Recommended Sequence for the Agent

1. Add `src/lib/datetime/*`
2. Update API and realtime normalization
3. Update formatting helpers
4. Update date-range picker and historical range logic
5. Run build
6. Verify manually with at least two different IANA zones

## Final Deliverables

The agent should leave:

1. Shared timezone utilities in `src/lib/datetime`
2. Existing UI wired to those utilities
3. No duplicated timezone formatting logic where avoidable
4. A passing `build` or a clear note of any blocker
