import type { ComponentType } from "react";

import ScadaOverlay from "../../containers/ScadaOverlay";
import type { ScadaSvgProps } from "../../scada/svgRegistry";

interface Props {
  heading: string;
  title: string;
  layout: any;
  tags: Record<string, any>;
  plcStatus?: "online" | "offline";
  localTime?: string | null;
  timezone?: string | null;
  SvgComponent: ComponentType<ScadaSvgProps> | null;
  aspectRatio: string;
}

export default function ScadaMapPanel({
  heading,
  title,
  layout,
  tags,
  plcStatus,
  localTime,
  timezone,
  SvgComponent,
  aspectRatio,
}: Props) {
  return (
    <section className="lagoon-map-shell rounded-[18px] p-3 sm:p-4">
      <div className="lagoon-glow left-6 top-6 h-20 w-20 bg-sky-200/55" />
      <div className="lagoon-glow bottom-6 right-8 h-24 w-24 bg-cyan-200/45" />

      <div className="relative mb-4 px-2 py-1 sm:px-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-700/70">
          {heading}
        </div>
        <div className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">
          {title}
        </div>
      </div>

      <div className="mb-4 h-px w-full bg-slate-200" />

      <div className="overflow-x-auto overflow-y-hidden">
        <div
          className="lagoon-map-frame relative mx-auto w-full min-w-[760px] rounded-[14px] md:min-w-0"
          style={{
            aspectRatio,
            maxWidth: "100%",
          }}
          >
          {SvgComponent ? (
            <div className="scada-stage absolute inset-0">
              <SvgComponent className="h-full w-full" tags={tags} />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-[14px] text-sm font-medium text-slate-500">
              No hay layout SCADA disponible para esta laguna.
            </div>
          )}

          {layout && SvgComponent && (
            <ScadaOverlay
              layout={layout}
              tags={tags}
              plc_status={plcStatus}
              local_time={localTime}
              timezone={timezone}
            />
          )}
        </div>
      </div>
    </section>
  );
}
