import {
  SMALL_SCADA_LAYOUT,
  toSmallScadaPositionStyle,
} from "../config/smallScadaLayout";
import type { TankLevel } from "../types/smallScada.types";

const LEVEL_MARKS = [0, 25, 50, 75, 100] as const;

interface Props {
  level: TankLevel;
}

export default function TankLevelIndicator({ level }: Props) {
  return (
    <div className="small-tank-level-container" style={toSmallScadaPositionStyle(SMALL_SCADA_LAYOUT.tank.levelIndicator)}>
      <span className="small-tank-level__value" aria-hidden="true">{level}%</span>
      <div
        className="small-tank-level"
        role="img"
        aria-label={`A-C1LO tank level: ${level}%`}
        data-level={level}
      >
        <span className="small-tank-level__fill" style={{ height: `${level}%` }} />
        <span className="small-tank-level__marks" aria-hidden="true">
          {LEVEL_MARKS.map((mark) => (
            <span key={mark} className="small-tank-level__mark" style={{ bottom: `${mark}%` }} />
          ))}
        </span>
      </div>
    </div>
  );
}
