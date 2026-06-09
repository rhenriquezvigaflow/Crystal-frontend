import type { ProductType } from "../product/types";

export function productDashboardPath(productType: ProductType): string {
  return `/${productType}/dashboard`;
}

export function productLagoonPath(
  productType: ProductType,
  lagoonId: string,
): string {
  return `/${productType}/lagoon/${encodeURIComponent(lagoonId)}`;
}

export function legacyCrystalLagoonPath(lagoonId: string): string {
  return `/lagoon/${encodeURIComponent(lagoonId)}`;
}
