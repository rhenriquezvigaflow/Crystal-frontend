import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import {
  hasReadPrivilegesForProduct,
  resolveCurrentUserScope,
} from "../../../api/productApi";
import { useAuth } from "../../../auth/useAuth";
import type { ProductType } from "../product/types";

export default function ProductGuard({
  productType,
  children,
}: {
  productType: ProductType;
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!hasReadPrivilegesForProduct(resolveCurrentUserScope(), productType)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
