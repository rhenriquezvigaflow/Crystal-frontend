import { httpClient } from "./httpClient";

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

export async function fetchPumpEventsLast3(
  lagoonId: string,
): Promise<PumpEventsLast3Response> {
  const normalizedLagoonId = lagoonId.trim();
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
