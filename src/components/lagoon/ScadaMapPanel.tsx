import { useRef } from "react";
import type { ComponentType } from "react";

import ScadaEquipmentStateOverlay from "../../containers/ScadaEquipmentStateOverlay";
import ScadaOverlay from "../../containers/ScadaOverlay";
import ScadaTextOverlay from "../../containers/ScadaTextOverlay";
import type { ScadaSvgProps } from "../../scada/svgRegistry";
import type {
  RealtimeTagLookup,
  ResolvedScadaElement,
  ResolvedScadaTextLabel,
} from "../../types/scada-layouts";

interface Props {
  heading: string;
  title: string;
  layoutId: string;
  elements: ResolvedScadaElement[];
  labels?: ResolvedScadaTextLabel[];
  tagLookup: RealtimeTagLookup;
  loading?: boolean;
  plcStatus?: "online" | "offline";
  localTime?: string | null;
  timezone?: string | null;
  SvgComponent: ComponentType<ScadaSvgProps> | null;
  aspectRatio: string;
  canControl?: boolean;
}

const SKELETON_PLACEHOLDERS = [
  { left: "18%", top: "26%", width: 122 },
  { left: "30%", top: "46%", width: 118 },
  { left: "52%", top: "34%", width: 126 },
  { left: "66%", top: "61%", width: 118 },
  { left: "81%", top: "28%", width: 122 },
];

function ScadaMapSkeleton() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[14px] bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.10),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.08),transparent_22%)]" />

      {SKELETON_PLACEHOLDERS.map((placeholder, index) => (
        <div
          key={index}
          className="absolute animate-pulse rounded-[6px] border border-slate-200 bg-slate-100/95 px-[10px] py-[6px]"
          style={{
            left: placeholder.left,
            top: placeholder.top,
            width: placeholder.width,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="mx-auto h-[11px] w-[58px] rounded bg-slate-300/80" />
          <div className="mb-1 mt-[4px] h-px w-full bg-slate-300/90" />
          <div className="flex items-end justify-center gap-1">
            <div className="h-[16px] w-[40px] rounded bg-slate-300" />
            <div className="h-[11px] w-[18px] rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ScadaMapPanel({
  heading,
  title,
  layoutId,
  elements,
  labels = [],
  tagLookup,
  loading = false,
  plcStatus,
  localTime,
  timezone,
  SvgComponent,
  aspectRatio,
  canControl = true,
}: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);

  return (
    <section className="lagoon-map-shell rounded-[18px] p-2 sm:p-3">
      <div className="lagoon-glow left-6 top-6 h-20 w-20 bg-sky-200/55" />
      <div className="lagoon-glow bottom-6 right-8 h-24 w-24 bg-cyan-200/45" />

      <div className="relative mb-3 px-1.5 py-1 sm:px-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-700/70">
          {heading}
        </div>
        <div className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">{title}</div>
      </div>

      <div className="mb-3 h-px w-full bg-slate-200" />

      <div className="-mx-2 overflow-x-auto overflow-y-hidden px-2 sm:mx-0 sm:px-0">
        <div
          className="lagoon-map-frame relative w-full min-w-[820px] rounded-[14px] sm:min-w-[900px] md:min-w-0"
          style={{ aspectRatio, maxWidth: "100%" }}
        >
          {loading ? (
            <ScadaMapSkeleton />
          ) : SvgComponent ? (
            <div
              ref={stageRef}
              className={[
                "scada-stage",
                canControl ? "" : "scada-stage-no-control",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <SvgComponent className="h-full w-full" />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-[14px] text-sm font-medium text-slate-500">
              No hay layout SCADA disponible para esta laguna.
            </div>
          )}

          {!loading && SvgComponent ? (
            <>
              <ScadaTextOverlay labels={labels} />
              <ScadaOverlay
                layoutId={layoutId}
                elements={elements}
                tagLookup={tagLookup}
                stageRef={stageRef}
                plc_status={plcStatus}
                local_time={localTime}
                timezone={timezone}
              />
              <ScadaEquipmentStateOverlay
                layoutId={layoutId}
                elements={elements}
                tagLookup={tagLookup}
                stageRef={stageRef}
              />
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
