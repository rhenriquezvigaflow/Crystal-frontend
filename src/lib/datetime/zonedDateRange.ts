export const DEFAULT_HISTORY_TIME_ZONE = "UTC";

type DateInputParts = {
  year: number;
  month: number;
  day: number;
};

type ZonedDateTimeParts = DateInputParts & {
  hour: number;
  minute: number;
  second: number;
};

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();
const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();

export function getSafeTimeZone(timeZone?: string | null): string {
  const candidate = timeZone?.trim() || DEFAULT_HISTORY_TIME_ZONE;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date(0));
    return candidate;
  } catch {
    return DEFAULT_HISTORY_TIME_ZONE;
  }
}

function getDateFormatter(timeZone: string): Intl.DateTimeFormat {
  const safeTimeZone = getSafeTimeZone(timeZone);
  const cached = dateFormatterCache.get(safeTimeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  dateFormatterCache.set(safeTimeZone, formatter);
  return formatter;
}

function getDateTimeFormatter(timeZone: string): Intl.DateTimeFormat {
  const safeTimeZone = getSafeTimeZone(timeZone);
  const cached = dateTimeFormatterCache.get(safeTimeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  dateTimeFormatterCache.set(safeTimeZone, formatter);
  return formatter;
}

function partsRecord(parts: Intl.DateTimeFormatPart[]): Record<string, string> {
  const record: Record<string, string> = {};

  parts.forEach((part) => {
    if (part.type !== "literal") record[part.type] = part.value;
  });

  return record;
}

function toPaddedDate(parts: DateInputParts): string {
  const year = String(parts.year).padStart(4, "0");
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateParts(date: Date, timeZone: string): DateInputParts | null {
  if (Number.isNaN(date.getTime())) return null;

  const values = partsRecord(getDateFormatter(timeZone).formatToParts(date));
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);

  if (![year, month, day].every(Number.isFinite)) return null;
  return { year, month, day };
}

function getZonedDateTimeParts(date: Date, timeZone: string): ZonedDateTimeParts {
  const values = partsRecord(getDateTimeFormatter(timeZone).formatToParts(date));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function parseDateInputValue(value: string): DateInputParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function addCalendarDays(parts: DateInputParts, days: number): DateInputParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getZonedDateTimeParts(date, timeZone);
  const samePartsAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return samePartsAsUtc - date.getTime();
}

function zonedDateTimeToUtc(parts: ZonedDateTimeParts, timeZone: string): Date {
  const safeTimeZone = getSafeTimeZone(timeZone);
  const utcGuess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  const initialOffset = getTimeZoneOffsetMs(new Date(utcGuess), safeTimeZone);
  let result = new Date(utcGuess - initialOffset);
  const adjustedOffset = getTimeZoneOffsetMs(result, safeTimeZone);

  if (adjustedOffset !== initialOffset) {
    result = new Date(utcGuess - adjustedOffset);
  }

  return result;
}

export function formatDateForInput(
  value: Date | string | number,
  timeZone?: string | null,
): string {
  const date = value instanceof Date ? value : new Date(value);
  const parts = getDateParts(date, getSafeTimeZone(timeZone));
  return parts ? toPaddedDate(parts) : "";
}

export function getZonedDayBounds(
  value: string,
  timeZone?: string | null,
): { start: Date; end: Date } | null {
  const dateParts = parseDateInputValue(value);
  if (!dateParts) return null;

  const safeTimeZone = getSafeTimeZone(timeZone);
  const start = zonedDateTimeToUtc(
    { ...dateParts, hour: 0, minute: 0, second: 0 },
    safeTimeZone,
  );
  const nextDay = addCalendarDays(dateParts, 1);
  const nextStart = zonedDateTimeToUtc(
    { ...nextDay, hour: 0, minute: 0, second: 0 },
    safeTimeZone,
  );

  return {
    start,
    end: new Date(nextStart.getTime() - 1),
  };
}
