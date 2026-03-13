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
  const { data } = await httpClient.get<PumpEventsLast3Response>(
    `/scada/${encodeURIComponent(lagoonId)}/pump-events/last-3`,
  );

  return {
    lagoon_id: data?.lagoon_id ?? lagoonId,
    events: Array.isArray(data?.events) ? data.events : [],
  };
}
