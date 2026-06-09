import { memo } from "react";
import type { CSSProperties } from "react";

import type { ScadaPlacementLookup } from "../hooks/useScadaLayout";
import {
  buildScadaOverlayStyle,
} from "../scada/scadaLayoutPosition";
import type { ResolvedScadaElement } from "../types/scada-layouts";

const imageAssets = import.meta.glob("../lagoons/img/*", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

interface Props {
  elements: ResolvedScadaElement[];
  placements?: ScadaPlacementLookup;
}

function normalizeAssetToken(value: string): string {
  return value.trim().replace(/\\/g, "/").replace(/^\/+/, "").toLowerCase();
}

function resolveImageSrc(value: string | null | undefined): string | null {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) return null;

  const normalizedValue = normalizeAssetToken(rawValue);
  const fileName = normalizedValue.split("/").pop();

  for (const [assetPath, assetUrl] of Object.entries(imageAssets)) {
    const normalizedAssetPath = normalizeAssetToken(assetPath);
    const assetFileName = normalizedAssetPath.split("/").pop();

    if (
      normalizedAssetPath === normalizedValue ||
      normalizedAssetPath.endsWith(`/${normalizedValue}`) ||
      assetFileName === fileName
    ) {
      return assetUrl;
    }
  }

  return rawValue;
}

function normalizeObjectFit(value: string | null | undefined): CSSProperties["objectFit"] {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (
    normalized === "cover" ||
    normalized === "fill" ||
    normalized === "none" ||
    normalized === "scale-down"
  ) {
    return normalized;
  }

  return "contain";
}

function buildImageStyle(
  element: ResolvedScadaElement,
  _placement: ScadaPlacementLookup[string] | undefined,
): CSSProperties | null {
  const baseStyle: CSSProperties = {
    pointerEvents: "none",
    userSelect: "none",
    objectFit: normalizeObjectFit(element.object_fit),
    opacity: element.opacity ?? undefined,
    zIndex: element.z_index ?? 0,
  };

  if (element.full_stage) {
    return {
      ...baseStyle,
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
    };
  }

  const overlayStyle = element.position?.left && element.position.top
    ? buildScadaOverlayStyle(element.position)
    : null;

  if (!overlayStyle) return null;

  return {
    ...overlayStyle,
    ...baseStyle,
    width: element.width ?? undefined,
    height: element.height ?? undefined,
  };
}

function ScadaImageOverlay({ elements, placements = {} }: Props) {
  const imageElements = elements.filter((element) => element.type === "image");
  if (!imageElements.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]">
      {imageElements.map((element) => {
        const src = resolveImageSrc(element.src);
        const style = buildImageStyle(element, placements[element.id]);

        if (!src || !style) return null;

        return (
          <img
            key={element.id}
            src={src}
            alt={element.alt ?? ""}
            className="absolute block"
            draggable={false}
            style={style}
          />
        );
      })}
    </div>
  );
}

export default memo(ScadaImageOverlay);
