import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { useLagoons } from "../lagoons/LagoonsContext";

type FullscreenMessageProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

function FullscreenMessage({ message, actionLabel, onAction }: FullscreenMessageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-700 shadow-sm">
        <p>{message}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function DashboardRedirect() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { lagoons, loading, error, errorStatus } = useLagoons();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return <FullscreenMessage message="Cargando lagunas..." />;
  }

  if (errorStatus === 403) {
    return <FullscreenMessage message="Acceso no permitido" />;
  }

  if (error) {
    return <FullscreenMessage message={error} />;
  }

  if (!lagoons.length) {
    return (
      <FullscreenMessage
        message="No hay lagunas disponibles para tu usuario."
        actionLabel="Cerrar sesión"
        onAction={handleLogout}
      />
    );
  }

  return <Navigate to={`/lagoon/${encodeURIComponent(lagoons[0].lagoon_id)}`} replace />;
}
