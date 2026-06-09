import { useContext } from "react";

import { getProductConfig } from "./registry";
import { ProductContext } from "./productContextValue";
import type { ProductConfig } from "./types";

export function useProduct(): ProductConfig {
  const value = useContext(ProductContext);
  if (!value) return getProductConfig("crystal");
  return value;
}

export function useOptionalProduct(): ProductConfig | null {
  return useContext(ProductContext);
}
