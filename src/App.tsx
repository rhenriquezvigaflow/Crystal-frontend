import { useEffect } from "react";

import "./App.css";
import "./styles/charts.css";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LagoonsView from "./pages/lagoonsView";
import Login from "./pages/LoginPage";
import DashboardRedirect from "./pages/DashboardRedirect";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import { AUTO_PAGE_REFRESH_MS } from "./config/timing";
import { LagoonsProvider } from "./lagoons/LagoonsContext";
import { getDefaultDashboardPathForCurrentUser } from "./modules/shared/auth/productAccess";
import { ProductProvider } from "./modules/shared/product/ProductContext";
import type { ProductType } from "./modules/shared/product/types";
import ProductModule from "./modules/shared/layouts/ProductModule";

function ProductRoutes({ productType }: { productType: ProductType }) {
  return (
    <ProductModule productType={productType}>
      <Routes>
        <Route path="dashboard" element={<DashboardRedirect />} />
        <Route path="lagoon/:lagoonId" element={<LagoonsView />} />
        <Route path="*" element={<Navigate to={`/${productType}/dashboard`} replace />} />
      </Routes>
    </ProductModule>
  );
}

function LegacyDashboardRedirect() {
  return <Navigate to={getDefaultDashboardPathForCurrentUser()} replace />;
}

function App() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      // Recarga la URL actual para mantener al usuario en el mismo link.
      window.location.reload();
    }, AUTO_PAGE_REFRESH_MS);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <LegacyDashboardRedirect />
              </ProtectedRoute>
            }
          />

          <Route path="/crystal/*" element={<ProductRoutes productType="crystal" />} />
          <Route path="/small/*" element={<ProductRoutes productType="small" />} />

          <Route
            path="/lagoon/:lagoonId"
            element={
              <ProductProvider productType="crystal">
                <ProtectedRoute>
                  <LagoonsProvider productType="crystal">
                    <LagoonsView legacyRoute />
                  </LagoonsProvider>
                </ProtectedRoute>
              </ProductProvider>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
