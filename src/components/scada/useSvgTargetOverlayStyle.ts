import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, RefObject } from "react";

import {
  buildScadaOverlayStyle,
  type ScadaOverlayAnchor,
} from "../../scada/scadaLayoutPosition";

const SVG_SHAPE_SELECTOR = "path, circle, ellipse, rect, polygon, polyline, line";

interface UseSvgTargetOverlayStyleOptions {
  stageRef?: RefObject<HTMLDivElement | null>;
  svgTarget?: string | null;
  manualStyle?: CSSProperties | null;
  scale?: number;
  anchor?: ScadaOverlayAnchor;
}

interface UseSvgTargetColorOptions {
  stageRef?: RefObject<HTMLDivElement | null>;
  svgTarget?: string | null;
  fallbackColor: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function getTargetNode(
  stage: HTMLDivElement,
  svgTarget: string,
): SVGGraphicsElement | null {
  const safeTarget = svgTarget.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const node = stage.querySelector(`[id="${safeTarget}"]`);
  return node instanceof SVGGraphicsElement ? node : null;
}

function normalizeColorValue(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.toLowerCase();
  if (
    normalized === "none" ||
    normalized === "transparent" ||
    normalized === "rgba(0, 0, 0, 0)" ||
    normalized === "rgb(0, 0, 0, 0)"
  ) {
    return null;
  }

  return trimmed;
}

function getNodePaintColor(node: SVGElement): string | null {
  const computedStyle = window.getComputedStyle(node);

  return (
    normalizeColorValue(
      computedStyle.getPropertyValue("--scada-state-color"),
    ) ??
    normalizeColorValue(node.getAttribute("fill")) ??
    normalizeColorValue(computedStyle.fill) ??
    normalizeColorValue(node.getAttribute("stroke")) ??
    normalizeColorValue(computedStyle.stroke)
  );
}

function resolveSvgTargetColor(targetNode: SVGGraphicsElement): string | null {
  const ownColor = getNodePaintColor(targetNode);
  if (ownColor) return ownColor;

  const paintableNodes = Array.from(
    targetNode.querySelectorAll<SVGElement>(SVG_SHAPE_SELECTOR),
  );

  for (const node of paintableNodes) {
    const color = getNodePaintColor(node);
    if (color) return color;
  }

  return null;
}

export function useSvgTargetOverlayStyle({
  stageRef,
  svgTarget,
  manualStyle,
  scale = 1,
  anchor = "center",
}: UseSvgTargetOverlayStyleOptions): CSSProperties | null {
  const [autoStyle, setAutoStyle] = useState<CSSProperties | null>(null);
  const hasAutoTarget = !manualStyle && Boolean(svgTarget?.trim());

  useEffect(() => {
    if (!hasAutoTarget || !stageRef?.current || !svgTarget?.trim()) {
      return undefined;
    }

    const stage = stageRef.current;
    let animationFrame = 0;

    const updatePlacement = () => {
      animationFrame = window.requestAnimationFrame(() => {
        const svgRoot = stage.querySelector("svg.scada-svg");
        const targetNode = getTargetNode(stage, svgTarget);

        if (!(svgRoot instanceof SVGSVGElement) || !targetNode) {
          setAutoStyle(null);
          return;
        }

        const svgRect = svgRoot.getBoundingClientRect();
        const targetRect = targetNode.getBoundingClientRect();

        if (
          svgRect.width <= 0 ||
          svgRect.height <= 0 ||
          targetRect.width <= 0 ||
          targetRect.height <= 0
        ) {
          setAutoStyle(null);
          return;
        }

        const centerX =
          ((targetRect.left + (targetRect.width / 2)) - svgRect.left) /
          svgRect.width;
        const centerY =
          ((targetRect.top + (targetRect.height / 2)) - svgRect.top) /
          svgRect.height;

        setAutoStyle(
          buildScadaOverlayStyle(
            {
              left: toPercent(clamp(centerX * 100, 2, 98)),
              top: toPercent(clamp(centerY * 100, 2, 98)),
            },
            scale,
            anchor,
          ),
        );
      });
    };

    updatePlacement();

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            updatePlacement();
          });

    resizeObserver?.observe(stage);

    const svgRoot = stage.querySelector("svg.scada-svg");
    if (svgRoot instanceof SVGElement) {
      resizeObserver?.observe(svgRoot);
    }

    window.addEventListener("resize", updatePlacement);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updatePlacement);
    };
  }, [anchor, hasAutoTarget, scale, stageRef, svgTarget]);

  return useMemo(() => {
    if (manualStyle) return manualStyle;
    if (!hasAutoTarget) return null;
    return autoStyle;
  }, [autoStyle, hasAutoTarget, manualStyle]);
}

export function useSvgTargetColor({
  stageRef,
  svgTarget,
  fallbackColor,
}: UseSvgTargetColorOptions): string {
  const [resolvedColor, setResolvedColor] = useState(fallbackColor);
  const hasColorTarget = Boolean(svgTarget?.trim());

  useEffect(() => {
    if (!hasColorTarget || !stageRef?.current || !svgTarget?.trim()) {
      return undefined;
    }

    const stage = stageRef.current;
    const targetNode = getTargetNode(stage, svgTarget);

    if (!targetNode) {
      const animationFrame = window.requestAnimationFrame(() => {
        setResolvedColor(fallbackColor);
      });

      return () => {
        window.cancelAnimationFrame(animationFrame);
      };
    }

    let animationFrame = 0;

    const updateColor = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        setResolvedColor(resolveSvgTargetColor(targetNode) ?? fallbackColor);
      });
    };

    updateColor();

    const mutationObserver = new MutationObserver(() => {
      updateColor();
    });

    mutationObserver.observe(targetNode, {
      subtree: true,
      childList: false,
      attributes: true,
      attributeFilter: ["style", "fill", "stroke", "class"],
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      mutationObserver.disconnect();
    };
  }, [fallbackColor, hasColorTarget, stageRef, svgTarget]);

  return hasColorTarget ? resolvedColor : fallbackColor;
}
