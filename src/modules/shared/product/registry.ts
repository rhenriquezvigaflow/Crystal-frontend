import { crystalTheme } from "../../crystal/config/theme";
import { smallTheme } from "../../small/config/theme";
import type { ProductConfig, ProductType } from "./types";

export const PRODUCT_CONFIGS: Record<ProductType, ProductConfig> = {
  crystal: {
    id: "crystal",
    routeBase: "/crystal",
    apiBase: "/crystal",
    wsBase: "/ws/crystal",
    readRoles: ["AdminCrystal", "VisualCrystal", "SuperAdmin"],
    writeRoles: ["AdminCrystal", "SuperAdmin"],
    theme: crystalTheme,
  },
  small: {
    id: "small",
    routeBase: "/small",
    apiBase: "/small",
    wsBase: "/ws/small",
    readRoles: ["AdminSmall", "VisualSmall", "SuperAdmin"],
    writeRoles: ["AdminSmall", "SuperAdmin"],
    theme: smallTheme,
  },
};

export function getProductConfig(productType: ProductType): ProductConfig {
  return PRODUCT_CONFIGS[productType];
}

export function isProductType(value: unknown): value is ProductType {
  return value === "crystal" || value === "small";
}
