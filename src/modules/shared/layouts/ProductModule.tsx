import React from "react";

import { LagoonsProvider } from "../../../lagoons/LagoonsContext";
import ProductGuard from "../auth/ProductGuard";
import { ProductProvider } from "../product/ProductContext";
import type { ProductType } from "../product/types";

export default function ProductModule({
  productType,
  children,
}: {
  productType: ProductType;
  children: React.ReactNode;
}) {
  return (
    <ProductProvider productType={productType}>
      <ProductGuard productType={productType}>
        <LagoonsProvider productType={productType}>{children}</LagoonsProvider>
      </ProductGuard>
    </ProductProvider>
  );
}
