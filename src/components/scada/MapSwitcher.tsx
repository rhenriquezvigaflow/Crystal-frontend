import MapDropdown from "./MapDropdown";
import MapNavigation from "./MapNavigation";
import type { ResolvedScadaMap } from "../../types/scada-layouts";

interface Props {
  maps: ResolvedScadaMap[];
  activeMapIndex: number;
  onActiveMapIndexChange: (nextIndex: number) => void;
  compact?: boolean;
}

function clampIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  if (index < 0) return total - 1;
  if (index >= total) return 0;
  return index;
}

function getMapLabel(map: ResolvedScadaMap | null, index: number): string {
  return map?.name?.trim() || `Map ${index + 1}`;
}

export default function MapSwitcher({
  maps,
  activeMapIndex,
  onActiveMapIndexChange,
  compact = false,
}: Props) {
  if (maps.length <= 1) return null;

  const safeActiveIndex = clampIndex(activeMapIndex, maps.length);
  const activeMap = maps[safeActiveIndex] ?? maps[0] ?? null;
  const options = maps.map((map, index) => ({
    id: map.id,
    label: getMapLabel(map, index),
    title: map.name ?? null,
  }));

  const goToIndex = (nextIndex: number) => {
    onActiveMapIndexChange(clampIndex(nextIndex, maps.length));
  };

  const containerClassName = compact
    ? "scada-map-switcher flex w-full max-w-full flex-col gap-2 sm:w-auto sm:min-w-[0] sm:flex-row sm:items-center"
    : "scada-map-switcher flex w-full max-w-full flex-col gap-2 sm:flex-row sm:items-center";

  return (
    <div className={containerClassName}>
      <MapNavigation
        activeLabel={getMapLabel(activeMap, safeActiveIndex)}
        activeTitle={activeMap?.name ?? null}
        activeIndex={safeActiveIndex}
        totalMaps={maps.length}
        onPrevious={() => goToIndex(safeActiveIndex - 1)}
        onNext={() => goToIndex(safeActiveIndex + 1)}
      />

      <MapDropdown
        options={options}
        activeIndex={safeActiveIndex}
        onActiveMapIndexChange={goToIndex}
      />
    </div>
  );
}
