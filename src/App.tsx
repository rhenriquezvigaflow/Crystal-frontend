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
        <LagoonsProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              }
            />

            <Route
              path="/lagoon/:lagoonId"
              element={
                <ProtectedRoute>
                  <LagoonsView />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </LagoonsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
