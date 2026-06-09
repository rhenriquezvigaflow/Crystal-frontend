import type { ProductType } from "../product/types";

export function productApiPath(
  productType: ProductType,
  path: string,
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `/${productType}${normalizedPath}`;
}

export function productWsPath(
  productType: ProductType,
  lagoonId: string,
): string {
  const encodedLagoonId = encodeURIComponent(lagoonId);
  return `/ws/${productType}/${encodedLagoonId}`;
}
