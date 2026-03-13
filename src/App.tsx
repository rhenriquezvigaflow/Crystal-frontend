import { useEffect } from "react";

import "./App.css";
import "./styles/charts.css";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LagoonsView from "./pages/lagoonsView";
import Login from "./pages/LoginPage";
import DashboardRedirect from "./pages/DashboardRedirect";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import { LagoonsProvider } from "./lagoons/LagoonsContext";

const AUTO_REFRESH_MS = 30 * 60 * 1000; // 30 minutos

function App() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.reload();
    }, AUTO_REFRESH_MS);

    return () => clearTimeout(timer);
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
