import { useCallback, useEffect, useMemo, useState } from "react";
import type { RefObject } from "react";

import {
  buildScadaOverlayPlacement,
  getScadaOverlayAnchor,
  normalizeScadaPosition,
} from "../scada/scadaLayoutPosition";
import type {
  ScadaOverlayAnchor,
  ScadaOverlayPlacement,
} from "../scada/scadaLayoutPosition";
import type {
  ScadaLayoutPosition,
  ScadaTextLabelAlign,
} from "../types/scada-layouts";

interface ScadaLayoutItem {
  id: string;
  position?: ScadaLayoutPosition | null;
  align?: ScadaTextLabelAlign | null;
}

interface ScadaLayoutConfig {
  elements?: ScadaLayoutItem[];
  labels?: ScadaLayoutItem[];
}

interface UseScadaLayoutOptions {
  responsiveScale?: (width: number) => number;
  containerElement?: HTMLElement | null;
}

interface ContainerSize {
  width: number;
  height: number;
}

export type ScadaPlacementLookup = Record<string, ScadaOverlayPlacement>;

const DEFAULT_DESKTOP_WIDTH = 1200;
const DEFAULT_MIN_SCALE = 0.24;

function defaultResponsiveScale(width: number): number {
  if (!width) return 1;
  return Math.min(1, Math.max(DEFAULT_MIN_SCALE, width / DEFAULT_DESKTOP_WIDTH));
}

function sameSize(left: ContainerSize, right: ContainerSize): boolean {
  return left.width === right.width && left.height === right.height;
}

function getContainerSize(node: HTMLElement | null): ContainerSize {
  if (!node) return { width: 0, height: 0 };

  const rect = node.getBoundingClientRect();
  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

function buildPlacementLookup(
  items: ScadaLayoutItem[] | undefined,
  scale: number,
  getAnchor: (item: ScadaLayoutItem) => ScadaOverlayAnchor,
): ScadaPlacementLookup {
  if (!items?.length) return {};

  return items.reduce<ScadaPlacementLookup>((lookup, item) => {
    const position = normalizeScadaPosition(item.position);
    if (!position) return lookup;

    lookup[item.id] = buildScadaOverlayPlacement(
      item.id,
      position,
      scale,
      getAnchor(item),
    );
    return lookup;
  }, {});
}

export function useScadaLayout(
  layoutJson: ScadaLayoutConfig | null,
  containerRef: RefObject<HTMLElement | null>,
  options: UseScadaLayoutOptions = {},
) {
  const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 0, height: 0 });
  const responsiveScale = options.responsiveScale ?? defaultResponsiveScale;
  const observedElement = options.containerElement ?? null;

  const updateSize = useCallback(() => {
    const nextSize = getContainerSize(observedElement ?? containerRef.current);
    setContainerSize((currentSize) => (sameSize(currentSize, nextSize) ? currentSize : nextSize));
  }, [containerRef, observedElement]);

  useEffect(() => {
    const node = observedElement ?? containerRef.current;
    if (!node) return undefined;

    const animationFrame = window.requestAnimationFrame(updateSize);

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => {
        window.cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", updateSize);
      };
    }

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(node);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [containerRef, observedElement, updateSize]);

  const scale = useMemo(
    () => responsiveScale(containerSize.width),
    [containerSize.width, responsiveScale],
  );

  const elements = useMemo(
    () => buildPlacementLookup(layoutJson?.elements, scale, () => "center"),
    [layoutJson?.elements, scale],
  );

  const labels = useMemo(
    () => buildPlacementLookup(
      layoutJson?.labels,
      scale,
      (item) => getScadaOverlayAnchor(item.align),
    ),
    [layoutJson?.labels, scale],
  );

  return {
    containerSize,
    scale,
    elements,
    labels,
  };
}
