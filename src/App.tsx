import { useEffect } from "react";

import "./App.css";
import "./styles/charts.css";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LagoonsView from "./pages/lagoonsView";

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
      <Routes>
       
        <Route
          path="/"
          element={<Navigate to="/lagoon/costa_del_lago" replace />}
        />

 
        <Route path="/lagoon/:lagoonId" element={<LagoonsView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
