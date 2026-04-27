import type { LagoonAccess } from "../../api/lagoonsApi";

interface Props {
  lagoons: LagoonAccess[];
  selectedLagoonId: string | null;
  onLagoonChange?: (lagoonId: string) => void;
  className?: string;
}

export default function LagoonSelector({
  lagoons,
  selectedLagoonId,
  onLagoonChange,
  className,
}: Props) {
  return (
    <label className={["block min-w-0", className ?? ""].filter(Boolean).join(" ")}>
      <span className="sr-only">Seleccionar laguna</span>
      <select
        value={selectedLagoonId ?? ""}
        onChange={(event) => onLagoonChange?.(event.target.value)}
        disabled={!lagoons.length}
        className="h-11 w-full min-w-0 rounded-xl border border-sky-100 bg-white/88 px-4 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {!lagoons.length && <option value="">Sin lagunas disponibles</option>}
        {lagoons.map((lagoon) => (
          <option key={lagoon.lagoon_id} value={lagoon.lagoon_id}>
            {lagoon.lagoon_name}
          </option>
        ))}
      </select>
    </label>
  );
}
