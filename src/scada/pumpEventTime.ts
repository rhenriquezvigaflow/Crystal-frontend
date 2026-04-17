const EXPLICIT_TIMEZONE_SUFFIX = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const LOCAL_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s])(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?/;

interface LocalTimestampParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function hasExplicitTimezone(value: string): boolean {
  return EXPLICIT_TIMEZONE_SUFFIX.test(value.trim());
}

function parseLocalTimestamp(value: string): LocalTimestampParts | null {
  const match = value.trim().match(LOCAL_TIMESTAMP_PATTERN);
  if (!match) return null;

  const [, year, month, day, hour, minute, second = "0", fraction = ""] = match;
  const millisecond = Number(fraction.slice(0, 3).padEnd(3, "0")) || 0;

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
    millisecond,
  };
}

function getLocalSortTime(parts: LocalTimestampParts): number {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );
}

export function getPumpEventSortTime(value?: string | null): number | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim();
  if (!hasExplicitTimezone(trimmed)) {
    const localParts = parseLocalTimestamp(trimmed);
    if (localParts) return getLocalSortTime(localParts);
  }

  const parsedTime = new Date(trimmed).getTime();
  return Number.isNaN(parsedTime) ? null : parsedTime;
}

export function formatPumpEventTime(
  value?: string | null,
  timezone?: string | null,
): string {
  if (!value?.trim()) return "--";

  const trimmed = value.trim();
  if (!hasExplicitTimezone(trimmed)) {
    const localParts = parseLocalTimestamp(trimmed);
    if (localParts) {
      return `${pad2(localParts.day)}/${pad2(localParts.month)} - ${pad2(
        localParts.hour,
      )}:${pad2(localParts.minute)}`;
    }
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return "--";

  const fallbackTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  try {
    return date
      .toLocaleString("es-CL", {
        timeZone: timezone || fallbackTz,
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", " -");
  } catch {
    return date
      .toLocaleString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", " -");
  }
}
