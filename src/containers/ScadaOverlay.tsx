/* eslint-disable @typescript-eslint/no-explicit-any */

import layout from "../layouts/crystal-lagoons.layout.json";

interface Props {
  tags: Record<string, any>;
}

export default function ScadaOverlay({ tags }: Props) {
  return (
    <div className="absolute inset-0">
      {layout.kpis.map((item: any) => {
        if (item.type !== "kpi") return null;

        const value = tags?.[item.backendTag];
        if (value === undefined || value === null) return null;

        return (
          <div
            key={item.id}
            className="absolute font-bold text-[14px] md:text-[16px] whitespace-nowrap"
            style={{
              top: item.position.top,
              left: item.position.left,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span>
              {typeof value === "number"
                ? value.toFixed(2)
                : String(value)}
            </span>

            {item.unit && (
              <span className="ml-1 text-[11px] md:text-[12px] font-semibold text-gray-700 italic">
                {item.unit}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
