import layout from "../../layouts/crystal-lagoons.layout.json";
import ScadaValue from "./ScadaValue";

interface Props {
  tags: Record<string, any>;
}

export default function ScadaOverlay({ tags }: Props) {
  return (
    <>
      {layout.kpis
        .filter((kpi) => kpi.type === "kpi" || kpi.type === "level")
        .map((kpi) => {
          const raw = tags[kpi.backendTag];
          if (raw === undefined || raw === null) return null;

          const value =
            typeof raw === "number"
              ? raw.toFixed(2)
              : raw;

          return (
            <div
              key={kpi.id}
              className="absolute"
              style={{
                top: kpi.position.top,
                left: kpi.position.left,
                transform: "translate(-50%, -50%)",
              }}
            >
              <ScadaValue value={value} unit={kpi.unit} />
            </div>
          );
        })}
    </>
  );
}
