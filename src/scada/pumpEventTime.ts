function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function getPumpEventSortTime(value: string | null | undefined): number | null {
  const parsed = toDate(value);
  return parsed ? parsed.getTime() : null;
}

export function formatPumpEventTime(
  value: string | null | undefined,
  timezone?: string | null,
): string {
  const parsed = toDate(value);
  if (!parsed) return "--";

  try {
    return new Intl.DateTimeFormat("es-CL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      ...(timezone ? { timeZone: timezone } : {}),
    })
      .format(parsed)
      .replace(",", "");
  } catch {
    return parsed.toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
}
