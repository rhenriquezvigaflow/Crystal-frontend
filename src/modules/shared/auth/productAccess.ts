import {
  hasReadPrivilegesForProduct,
  resolveCurrentUserScope,
} from "../../../api/productApi";
import type { ProductType } from "../product/types";
import { productDashboardPath } from "../routing/paths";

const PRODUCT_PRIORITY: ProductType[] = ["crystal", "small"];

export function getDefaultProductForCurrentUser(): ProductType {
  const scope = resolveCurrentUserScope();
  return (
    PRODUCT_PRIORITY.find((productType) =>
      hasReadPrivilegesForProduct(scope, productType),
    ) ?? "crystal"
  );
}

export function getDefaultDashboardPathForCurrentUser(): string {
  return productDashboardPath(getDefaultProductForCurrentUser());
}
