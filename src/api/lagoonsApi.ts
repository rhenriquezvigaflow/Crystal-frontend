import { httpClient } from "./httpClient";

export interface LagoonAccess {
  lagoon_id: string;
  lagoon_name: string;
  scada_layout: string;
  timezone: string | null;
  ip: string | null;
  can_view: boolean;
  can_edit: boolean;
  can_control: boolean;
}

type RawLagoon = Partial<LagoonAccess> & {
  lagoon_id?: string | number | null;
  lagoon_name?: string | null;
  scada_layout?: string | null;
  timezone?: string | null;
  ip?: string | null;
  can_view?: boolean | number | string | null;
  can_edit?: boolean | number | string | null;
  can_control?: boolean | number | string | null;
};

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "si"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }

  return fallback;
}

function getRawRows(payload: unknown): RawLagoon[] {
  if (Array.isArray(payload)) return payload as RawLagoon[];

  if (payload && typeof payload === "object") {
    const withLagoons = payload as { lagoons?: unknown };
    if (Array.isArray(withLagoons.lagoons)) {
      return withLagoons.lagoons as RawLagoon[];
    }
  }

  return [];
}

export async function fetchLagoons(): Promise<LagoonAccess[]> {
  const { data } = await httpClient.get<unknown>("/lagoons");
  const rows = getRawRows(data);

  return rows
    .map((lagoon) => ({
      lagoon_id: String(lagoon?.lagoon_id ?? ""),
      lagoon_name: String(lagoon?.lagoon_name ?? ""),
      scada_layout: String(lagoon?.scada_layout ?? "layout1"),
      timezone: lagoon?.timezone ? String(lagoon.timezone) : null,
      ip: lagoon?.ip ? String(lagoon.ip) : null,
      can_view: parseBoolean(lagoon?.can_view, true),
      can_edit: parseBoolean(lagoon?.can_edit, true),
      can_control: parseBoolean(lagoon?.can_control, true),
    }))
    .filter((lagoon) => lagoon.lagoon_id && lagoon.lagoon_name);
}
