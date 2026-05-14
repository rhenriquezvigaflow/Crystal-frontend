import MapSwitcher from "./MapSwitcher";
import type { ResolvedScadaMap } from "../../types/scada-layouts";

interface Props {
  maps: ResolvedScadaMap[];
  activeMapIndex: number;
  onActiveMapIndexChange: (nextIndex: number) => void;
  compact?: boolean;
}

export default function ScadaMapControls(props: Props) {
  return <MapSwitcher {...props} />;
}
