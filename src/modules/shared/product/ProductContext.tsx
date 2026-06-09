import React, { useEffect, useMemo } from "react";

import { getProductConfig } from "./registry";
import { ProductContext } from "./productContextValue";
import type { ProductType } from "./types";

export function ProductProvider({
  productType,
  children,
}: {
  productType: ProductType;
  children: React.ReactNode;
}) {
  const value = useMemo(() => getProductConfig(productType), [productType]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--lagoon-ink", value.theme.colors.ink);
    root.style.setProperty("--product-accent", value.theme.colors.accent);
    root.style.setProperty("--product-accent-soft", value.theme.colors.accentSoft);
    root.style.setProperty("--product-sidebar-from", value.theme.colors.sidebarFrom);
    root.style.setProperty("--product-sidebar-to", value.theme.colors.sidebarTo);
    root.style.setProperty("--product-background-from", value.theme.colors.backgroundFrom);
    root.style.setProperty("--product-background-to", value.theme.colors.backgroundTo);
  }, [value]);

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}
