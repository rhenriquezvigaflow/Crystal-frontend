import { httpClient } from "./httpClient";
import { normalizeLagoonId } from "../lagoons/lagoonAliases";

export interface PumpEvent {
  lagoon_id: string;
  tag_id: string;
  tag_label?: string | null;
  start_local: string;
}

export interface PumpEventsLast3Response {
  lagoon_id: string;
  events: PumpEvent[];
}

export interface PumpEventsReportDownload {
  blob: Blob;
  filename: string;
}

function getReportFilename(disposition: unknown, fallback: string): string {
  if (typeof disposition !== "string") return fallback;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ""));
    } catch {
      return utf8Match[1].trim().replace(/^"|"$/g, "") || fallback;
    }
  }

  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1]?.trim() || fallback;
}

export async function fetchPumpEventsLast3(
  lagoonId: string,
): Promise<PumpEventsLast3Response> {
  const normalizedLagoonId = normalizeLagoonId(lagoonId);
  if (!normalizedLagoonId) {
    return {
      lagoon_id: lagoonId,
      events: [],
    };
  }

  const endpoint = `/scada/${encodeURIComponent(normalizedLagoonId)}/pump-events/last-3`;

  const { data } = await httpClient.get<PumpEventsLast3Response>(endpoint);
  const events = Array.isArray(data?.events) ? data.events : [];

  return {
    lagoon_id: data?.lagoon_id ?? normalizedLagoonId,
    events,
  };
}

export async function downloadPumpEventsReport(
  lagoonId: string,
): Promise<PumpEventsReportDownload> {
  const normalizedLagoonId = normalizeLagoonId(lagoonId);
  const fallbackFilename = `reporte_bombas_${normalizedLagoonId || "laguna"}.xlsx`;

  if (!normalizedLagoonId) {
    return {
      blob: new Blob([], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      filename: fallbackFilename,
    };
  }

  const endpoint = `/scada/${encodeURIComponent(normalizedLagoonId)}/pump-events/report.xlsx`;
  const response = await httpClient.get<Blob>(endpoint, {
    responseType: "blob",
  });

  return {
    blob: response.data,
    filename: getReportFilename(
      response.headers?.["content-disposition"] ?? response.headers?.["Content-Disposition"],
      fallbackFilename,
    ),
  };
}
