/* eslint-disable @typescript-eslint/no-explicit-any */

import layout from "../layouts/crystal-lagoons.layout.json";

interface Props {
  tags: Record<string, any>;
}

export default function ScadaOverlay({ tags }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {layout.kpis
        .filter((kpi) => kpi.type === "kpi")
        .map((kpi) => {
          const value = tags[kpi.backendTag];

          if (value === undefined || value === null) return null;
          if (!kpi.position) return null;

          return (
            <div
              key={kpi.id}
              className="absolute text-xs md:text-sm font-semibold text-slate-800"
              style={{
                top: kpi.position.top,
                left: kpi.position.left,
                transform: "translate(-50%, -50%)",
              }}
            >
              {typeof value === "number"
                ? value.toFixed(2)
                : String(value)}{" "}
              <span className="text-[10px] text-slate-500">
                {kpi.unit}
              </span>
            </div>
          );
        })}
    </div>
  );
}
