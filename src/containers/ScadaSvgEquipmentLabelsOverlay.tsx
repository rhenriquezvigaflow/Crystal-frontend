import { memo, useEffect, useMemo, useState } from "react";
import type { RefObject } from "react";

import { SCADA_FONT_FAMILY } from "../scada/scadaTypography";

import type {
  ResolvedScadaElement,
  ResolvedScadaTextLabel,
} from "../types/scada-layouts";

interface Props {
  elements: ResolvedScadaElement[];
  labels?: ResolvedScadaTextLabel[];
  stageRef: RefObject<HTMLDivElement | null>;
}

interface EquipmentLabelPlacement {
  id: string;
  label: string;
  type: "pump" | "valve";
  top: string;
  left: string;
  styleOverride: ResolvedScadaTextLabel | null;
}

function hasManualPosition(element: ResolvedScadaElement): boolean {
  return Boolean(element.position?.top && element.position?.left);
}

function isEquipmentLabelCandidate(
  element: ResolvedScadaElement,
): element is ResolvedScadaElement & { type: "pump" | "valve"; svg_target: string } {
  return (
    (element.type === "pump" || element.type === "valve") &&
    Boolean(element.label?.trim()) &&
    Boolean(element.svg_target?.trim()) &&
    !hasManualPosition(element)
  );
}

function getTargetNode(
  stage: HTMLDivElement,
  svgTarget: string,
): SVGGraphicsElement | null {
  const safeTarget = svgTarget.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const node = stage.querySelector(`[id="${safeTarget}"]`);
  return node instanceof SVGGraphicsElement ? node : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function buildPlacement(
  stage: HTMLDivElement,
  element: ResolvedScadaElement & { type: "pump" | "valve" },
  styleOverride: ResolvedScadaTextLabel | null,
): EquipmentLabelPlacement | null {
  const svgRoot = stage.querySelector("svg.scada-svg");
  if (!(svgRoot instanceof SVGSVGElement) || !element.svg_target) return null;

  const targetNode = getTargetNode(stage, element.svg_target);
  if (!targetNode) return null;

  const svgRect = svgRoot.getBoundingClientRect();
  const targetRect = targetNode.getBoundingClientRect();

  if (
    svgRect.width <= 0 ||
    svgRect.height <= 0 ||
    targetRect.width <= 0 ||
    targetRect.height <= 0
  ) {
    return null;
  }

  const centerX = ((targetRect.left + targetRect.width / 2) - svgRect.left) / svgRect.width;
  const topY = (targetRect.top - svgRect.top) / svgRect.height;

  return {
    id: `${element.id}__svg_label`,
    label: styleOverride?.text.trim() || element.label,
    type: element.type,
    left: toPercent(clamp(centerX * 100, 3, 97)),
    top: toPercent(clamp(topY * 100, 4, 96)),
    styleOverride,
  };
}

function ScadaSvgEquipmentLabelsOverlay({
  elements,
  labels = [],
  stageRef,
}: Props) {
  const manualLabelTargets = useMemo(() => {
    const targets = new Set<string>();

    labels.forEach((label) => {
      if (!label.position?.top || !label.position?.left) return;
      if (!label.source_svg_target?.trim()) return;
      targets.add(label.source_svg_target.trim().toUpperCase());
    });

    return targets;
  }, [labels]);

  const labelCandidates = useMemo(
    () =>
      elements.filter(
        (element): element is ResolvedScadaElement & { type: "pump" | "valve"; svg_target: string } =>
          isEquipmentLabelCandidate(element) &&
          !manualLabelTargets.has(element.svg_target.trim().toUpperCase()),
      ),
    [elements, manualLabelTargets],
  );
  const labelStylesByTarget = useMemo(() => {
    const styles = new Map<string, ResolvedScadaTextLabel>();

    labels.forEach((label) => {
      const target = label.source_svg_target?.trim().toUpperCase();
      if (!target || label.position?.top || label.position?.left) return;
      styles.set(target, label);
    });

    return styles;
  }, [labels]);
  const [placements, setPlacements] = useState<EquipmentLabelPlacement[]>([]);
  const hasLabelCandidates = labelCandidates.length > 0;

  useEffect(() => {
    const stage = stageRef.current;
    if (!hasLabelCandidates || !stage) {
      return undefined;
    }

    let animationFrame = 0;

    const updatePlacements = () => {
      animationFrame = window.requestAnimationFrame(() => {
        setPlacements(
          labelCandidates
            .map((element) =>
              buildPlacement(
                stage,
                element,
                labelStylesByTarget.get(element.svg_target.trim().toUpperCase()) ?? null,
              ),
            )
            .filter(
              (placement): placement is EquipmentLabelPlacement =>
                placement !== null,
            ),
        );
      });
    };

    updatePlacements();

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            updatePlacements();
          });

    resizeObserver?.observe(stage);

    const svgRoot = stage.querySelector("svg.scada-svg");
    if (svgRoot instanceof SVGElement) {
      resizeObserver?.observe(svgRoot);
    }

    window.addEventListener("resize", updatePlacements);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updatePlacements);
    };
  }, [hasLabelCandidates, labelCandidates, labelStylesByTarget, stageRef]);

  if (!hasLabelCandidates || !placements.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[2]">
      {placements.map((placement) => (
        <div
          key={placement.id}
          className={[
            "absolute max-w-[9.5rem] -translate-x-1/2 -translate-y-[calc(100%+6px)]",
            "whitespace-pre-line text-center text-slate-800",
          ].join(" ")}
          style={{
            left: placement.left,
            top: placement.top,
            lineHeight: 1.15,
            maxWidth: placement.styleOverride?.max_width
              ? `${placement.styleOverride.max_width}px`
              : undefined,
            color: placement.styleOverride?.color ?? undefined,
            fontFamily: SCADA_FONT_FAMILY,
            fontSize: `${placement.styleOverride?.font_size ?? 12}px`,
            fontWeight: placement.styleOverride?.font_weight ?? 700,
            backgroundColor: placement.styleOverride?.background_color ?? undefined,
            padding: placement.styleOverride?.background_color ? "2px 8px" : undefined,
            borderRadius: placement.styleOverride?.background_color ? "2px" : undefined,
            textWrap: "balance",
            textShadow:
              placement.styleOverride?.text_shadow ??
              "0 1px 1px rgba(255, 255, 255, 0.88)",
          }}
          title={placement.label}
        >
          {placement.label}
        </div>
      ))}
    </div>
  );
}

export default memo(ScadaSvgEquipmentLabelsOverlay);
