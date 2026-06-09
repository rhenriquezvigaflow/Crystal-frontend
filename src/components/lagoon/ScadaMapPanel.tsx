import ScadaMapNavigator from "../scada/ScadaMapNavigator";
import ScadaMapControls from "../scada/ScadaMapControls";
import type { RealtimeTagLookup, ResolvedScadaMap } from "../../types/scada-layouts";

interface Props {
  heading: string;
  title: string;
  maps: ResolvedScadaMap[];
  activeMapIndex: number;
  onActiveMapIndexChange: (nextIndex: number) => void;
  tagLookup: RealtimeTagLookup;
  equipmentTagLookup?: RealtimeTagLookup;
  loading?: boolean;
  plcStatus?: "online" | "offline";
  localTime?: string | null;
  timezone?: string | null;
  filterStatus?: string | null;
  canControl?: boolean;
}

export default function ScadaMapPanel({
  heading,
  title,
  maps,
  activeMapIndex,
  onActiveMapIndexChange,
  tagLookup,
  equipmentTagLookup,
  loading = false,
  plcStatus,
  localTime,
  timezone,
  filterStatus,
  canControl = true,
}: Props) {
  return (
    <section className="lagoon-map-shell rounded-[18px] p-2 sm:p-3">
      <div className="lagoon-glow left-6 top-6 h-20 w-20 bg-sky-200/55" />
      <div className="lagoon-glow bottom-6 right-8 h-24 w-24 bg-cyan-200/45" />

      <div className="relative mb-3 px-1.5 py-1 sm:px-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-700/70">
              {heading}
            </div>
            <div className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">{title}</div>
          </div>

          <div className="w-full sm:w-auto sm:max-w-full">
            <ScadaMapControls
              maps={maps}
              activeMapIndex={activeMapIndex}
              onActiveMapIndexChange={onActiveMapIndexChange}
              compact
            />
          </div>
        </div>
      </div>

      <div className="mb-3 h-px w-full bg-slate-200" />

      <ScadaMapNavigator
        heading={heading}
        title={title}
        maps={maps}
        activeMapIndex={activeMapIndex}
        onActiveMapIndexChange={onActiveMapIndexChange}
        tagLookup={tagLookup}
        equipmentTagLookup={equipmentTagLookup}
        loading={loading}
        plcStatus={plcStatus}
        localTime={localTime}
        timezone={timezone}
        filterStatus={filterStatus}
        canControl={canControl}
      />
    </section>
  );
}
