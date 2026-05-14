import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import ScadaDevtoolsStatus from "../../containers/ScadaDevtoolsStatus";
import ScadaEquipmentStateOverlay from "../../containers/ScadaEquipmentStateOverlay";
import ScadaOverlay from "../../containers/ScadaOverlay";
import ScadaSvgEquipmentLabelsOverlay from "../../containers/ScadaSvgEquipmentLabelsOverlay";
import ScadaTextOverlay from "../../containers/ScadaTextOverlay";
import { useScadaLayout } from "../../hooks/useScadaLayout";
import {
  getScadaEquipmentBindingValue,
  getScadaEquipmentStateBindingsFromElements,
} from "../../scada/layoutEquipmentState";
import { getDiscreteStateLabel } from "../../scada/layoutSceneResolver";
import { resolveScadaSvgRegistryEntry } from "../../scada/svgRegistry";
import type {
  RealtimeTagLookup,
  ResolvedScadaMap,
  ResolvedScadaTextLabel,
  ScadaRenderRules,
} from "../../types/scada-layouts";

interface Props {
  heading: string;
  title: string;
  activeMap: ResolvedScadaMap | null;
  tagLookup: RealtimeTagLookup;
  equipmentTagLookup?: RealtimeTagLookup;
  loading?: boolean;
  plcStatus?: "online" | "offline";
  localTime?: string | null;
  timezone?: string | null;
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

function isScadaDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("scadaDebug") === "1";
}

function normalizeTagList(value: string | string[] | null | undefined): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean);
}

function ScadaDebugLayer() {
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="pointer-events-none absolute inset-0 z-[3] text-[10px] font-semibold text-sky-950/70">
      <div className="absolute inset-0 scada-debug-grid" />
      {ticks.map((tick) => (
        <div
          key={`x-${tick}`}
          className="absolute top-1 rounded bg-white/85 px-1"
          style={{ left: `${tick * 100}%`, transform: "translateX(-50%)" }}
        >
          x {tick.toFixed(2)}
        </div>
      ))}
      {ticks.map((tick) => (
        <div
          key={`y-${tick}`}
          className="absolute left-1 rounded bg-white/85 px-1"
          style={{ top: `${tick * 100}%`, transform: "translateY(-50%)" }}
        >
          y {tick.toFixed(2)}
        </div>
      ))}
    </div>
  );
}

function InlineScadaSvg({ markup }: { markup: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const svgRoot = containerRef.current?.querySelector("svg");
    if (!(svgRoot instanceof SVGSVGElement)) return;

    svgRoot.classList.add("scada-svg");
    if (!svgRoot.getAttribute("preserveAspectRatio")) {
      svgRoot.setAttribute("preserveAspectRatio", "xMidYMid meet");
    }
  }, [markup]);

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: markup }} />;
}

function resolveMapPresentation(activeMap: ResolvedScadaMap | null) {
  if (!activeMap) {
    return {
      SvgComponent: null,
      svgMarkup: null,
      aspectRatio: "1400 / 1150",
    };
  }

  if (activeMap.svg.type === "inline") {
    return {
      SvgComponent: null,
      svgMarkup: activeMap.svg.markup,
      aspectRatio: activeMap.svg.aspect_ratio ?? activeMap.scene.aspect_ratio ?? "1400 / 1150",
    };
  }

  const svgEntry = resolveScadaSvgRegistryEntry(activeMap.svg.component_id);

  return {
    SvgComponent: svgEntry?.component ?? null,
    svgMarkup: null,
    aspectRatio:
      activeMap.svg.aspect_ratio ??
      svgEntry?.aspectRatio ??
      activeMap.scene.aspect_ratio ??
      "1400 / 1150",
  };
}

export default function ScadaMapRenderer({
  heading,
  title,
  activeMap,
  tagLookup,
  equipmentTagLookup,
  loading = false,
  plcStatus,
  localTime,
  timezone,
  canControl = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    setContainerElement(node);
  }, []);

  const scene = activeMap?.scene ?? null;
  const elements = scene?.elements ?? [];
  const labels = scene?.labels ?? [];
  const layoutId = scene?.layout_id ?? activeMap?.id ?? "default";
  const renderRules = scene?.render_rules ?? ({
    tank: { mode: "binary_level", states: {}, animation: null },
    valve: { mode: "color", states: {}, animation: null },
    pump: { mode: "color", states: {}, animation: null },
    chemical: { mode: "color", states: {}, animation: null },
  } satisfies ScadaRenderRules);

  const layout = useMemo(
    () => ({
      elements,
      labels,
    }),
    [elements, labels],
  );

  const scadaLayout = useScadaLayout(layout, containerRef, { containerElement });
  const debugLayout = useMemo(() => isScadaDebugEnabled(), []);
  const equipmentLookup = equipmentTagLookup ?? tagLookup;
  const devtoolsStatusItems = useMemo(
    () =>
      getScadaEquipmentStateBindingsFromElements(elements).map((binding) => {
        const value = getScadaEquipmentBindingValue(binding, equipmentLookup);
        const status =
          binding.type === "tank"
            ? String(value ?? "UNKNOWN")
            : getDiscreteStateLabel(value);
        const sourceTags = binding.type === "tank" && binding.state_tags
          ? [
              ...normalizeTagList(binding.state_tags.LOW),
              ...normalizeTagList(binding.state_tags.MEDIUM),
              ...normalizeTagList(binding.state_tags.HIGH),
            ]
          : [binding.tag, binding.fallback_tag]
              .map((tag) => String(tag ?? "").trim())
              .filter(Boolean);

        return {
          id: binding.id,
          type: binding.type,
          label: binding.label,
          tag: sourceTags[0] ?? null,
          source_tags: Array.from(new Set(sourceTags)),
          svg_target: binding.svg_target,
          status,
          value,
        };
      }),
    [elements, equipmentLookup],
  );

  const { SvgComponent, svgMarkup, aspectRatio } = useMemo(
    () => resolveMapPresentation(activeMap),
    [activeMap],
  );

  const frameStyle: CSSProperties = loading || (!SvgComponent && !svgMarkup)
    ? { aspectRatio, width: "100%" }
    : { width: "100%" };

  return (
    <div className="-mx-2 overflow-hidden px-2 sm:mx-0 sm:px-0">
      <div
        className="lagoon-map-frame relative w-full min-w-0 rounded-[14px]"
        style={frameStyle}
      >
        {loading ? (
          <ScadaMapSkeleton />
        ) : SvgComponent || svgMarkup ? (
          <div
            key={activeMap?.id ?? "empty-map"}
            ref={setContainerRef}
            className={[
              "scada-stage relative w-full scada-map-fade",
              canControl ? "" : "scada-stage-no-control",
            ]
              .filter(Boolean)
              .join(" ")}
            data-scada-scale={scadaLayout.scale.toFixed(2)}
            data-scada-width={scadaLayout.containerSize.width}
            data-scada-map-id={activeMap?.id ?? ""}
            data-scada-heading={heading}
            data-scada-title={title}
          >
            {SvgComponent ? (
              <SvgComponent
                className="scada-svg"
                preserveAspectRatio="xMidYMid meet"
              />
            ) : svgMarkup ? (
              <InlineScadaSvg markup={svgMarkup} />
            ) : null}
            {debugLayout ? <ScadaDebugLayer /> : null}
            <ScadaTextOverlay labels={labels as ResolvedScadaTextLabel[]} placements={scadaLayout.labels} />
            <ScadaSvgEquipmentLabelsOverlay
              elements={elements}
              labels={labels}
              stageRef={containerRef}
            />
            <ScadaOverlay
              layoutId={layoutId}
              elements={elements}
              tagLookup={tagLookup}
              stageRef={containerRef}
              plc_status={plcStatus}
              local_time={localTime}
              timezone={timezone}
              placements={scadaLayout.elements}
            />
            <ScadaEquipmentStateOverlay
              layoutId={layoutId}
              elements={elements}
              renderRules={renderRules}
              tagLookup={equipmentLookup}
              stageRef={containerRef}
            />
            <ScadaDevtoolsStatus
              items={devtoolsStatusItems}
              layoutId={layoutId}
              title={title}
              localTime={localTime}
              timezone={timezone}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-[14px] text-sm font-medium text-slate-500">
            No SCADA layout is available for this lagoon.
          </div>
        )}
      </div>
    </div>
  );
}
