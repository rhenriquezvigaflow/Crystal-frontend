import { normalizeScadaLayoutName, type ScadaLayoutId } from "../scada/layoutResolver";
import { normalizeLagoonId } from "../lagoons/lagoonAliases";
import { httpClient } from "./httpClient";
import { productApiPath } from "../modules/shared/api/productEndpoints";
import type { ProductType } from "../modules/shared/product/types";
import {
  hasWritePrivilegesForProduct,
  inferProductTypeFromValue,
  resolveCurrentUserScope,
  type UserScope,
} from "./productApi";

export interface LagoonAccess {
  lagoon_id: string;
  lagoon_name: string;
  scada_layout: ScadaLayoutId;
  timezone: string | null;
  ip: string | null;
  enable: boolean;
  can_view: boolean;
  can_edit: boolean;
  can_control: boolean;
  product_type?: ProductType | null;
}

type RawLagoon = {
  lagoon_id?: string | number | null;
  lagoon_name?: string | null;
  id?: string | number | null;
  name?: string | null;
  scada_layout?: string | null;
  layout?: string | null;
  layout_id?: string | null;
  timezone?: string | null;
  ip?: string | null;
  product_type?: string | null;
  enable?: boolean | number | string | null;
  enabled?: boolean | number | string | null;
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

function asCleanString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toNullableString(value: unknown): string | null {
  const clean = asCleanString(value);
  return clean || null;
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

function normalizeLagoon(
  raw: RawLagoon,
  scope: UserScope,
): LagoonAccess | null {
  const lagoonId = normalizeLagoonId(asCleanString(raw.lagoon_id ?? raw.id));
  const lagoonName = asCleanString(raw.lagoon_name ?? raw.name);
  if (!lagoonId || !lagoonName) return null;
  const apiLayout = normalizeScadaLayoutName(
    raw.scada_layout ?? raw.layout ?? raw.layout_id,
  );

  const productType = inferProductTypeFromValue(raw.product_type);
  const inferredWrite = hasWritePrivilegesForProduct(scope, productType);

  return {
    lagoon_id: lagoonId,
    lagoon_name: lagoonName,
    scada_layout: apiLayout,
    timezone: toNullableString(raw.timezone),
    ip: toNullableString(raw.ip),
    enable: parseBoolean(raw.enable ?? raw.enabled, false),
    can_view: parseBoolean(raw.can_view, true),
    can_edit: parseBoolean(raw.can_edit, inferredWrite),
    can_control: parseBoolean(raw.can_control, inferredWrite),
    product_type: productType,
  };
}

function mergeLagoon(current: LagoonAccess, incoming: LagoonAccess): LagoonAccess {
  return {
    lagoon_id: current.lagoon_id,
    lagoon_name: current.lagoon_name || incoming.lagoon_name,
    scada_layout:
      current.scada_layout && current.scada_layout !== "layout1"
        ? current.scada_layout
        : incoming.scada_layout || current.scada_layout,
    timezone: current.timezone ?? incoming.timezone,
    ip: current.ip ?? incoming.ip,
    enable: current.enable && incoming.enable,
    can_view: current.can_view || incoming.can_view,
    can_edit: current.can_edit || incoming.can_edit,
    can_control: current.can_control || incoming.can_control,
    product_type: current.product_type ?? incoming.product_type ?? null,
  };
}

export async function fetchLagoons(productType: ProductType): Promise<LagoonAccess[]> {
  const scope = resolveCurrentUserScope();
  const endpoint = productApiPath(productType, "/lagoons");

  const { data } = await httpClient.get<unknown>(endpoint);
  const rows = getRawRows(data);
  const normalized = rows
    .map((row) => normalizeLagoon(row, scope))
    .filter((lagoon): lagoon is LagoonAccess => lagoon !== null);

  const merged = new Map<string, LagoonAccess>();
  normalized.forEach((lagoon) => {
    const existing = merged.get(lagoon.lagoon_id);
    merged.set(
      lagoon.lagoon_id,
      existing ? mergeLagoon(existing, lagoon) : lagoon,
    );
  });

  const final = Array.from(merged.values()).filter(
    (lagoon) =>
      lagoon.can_view &&
      lagoon.enable &&
      (!productType || lagoon.product_type === productType),
  );

  return final;
}
