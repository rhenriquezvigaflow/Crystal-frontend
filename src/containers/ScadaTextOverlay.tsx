import { memo } from "react";

import EquipmentLabel from "../components/scada/EquipmentLabel";
import type { ScadaPlacementLookup } from "../hooks/useScadaLayout";
import { getRealtimeValue } from "../scada/layoutSceneResolver";
import type {
  RealtimeTagLookup,
  ScadaTextLabelState,
  ResolvedScadaTextLabel,
} from "../types/scada-layouts";

interface Props {
  labels: ResolvedScadaTextLabel[];
  tagLookup?: RealtimeTagLookup;
  placements?: ScadaPlacementLookup;
}

interface LabelDisplay {
  text: string;
  stateColor: string | null;
}

function normalizeStateKey(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.round(value));
  }

  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }

  if (typeof value !== "string") return null;

  const normalized = value.trim();
  if (!normalized) return null;

  const numericValue = Number(normalized);
  if (Number.isFinite(numericValue)) {
    return String(Math.round(numericValue));
  }

  return normalized;
}

function getStateConfig(
  label: ResolvedScadaTextLabel,
  stateKey: string | null,
): ScadaTextLabelState | null {
  if (!stateKey) return null;

  return (
    label.states?.[stateKey] ??
    label.states?.[stateKey.toLowerCase()] ??
    label.states?.[stateKey.toUpperCase()] ??
    null
  );
}

function resolveLabelDisplay(
  label: ResolvedScadaTextLabel,
  tagLookup?: RealtimeTagLookup,
): LabelDisplay {
  if (!label.tag || !tagLookup) {
    return {
      text: label.text,
      stateColor: null,
    };
  }

  const value = getRealtimeValue(tagLookup, label.tag, label.fallback_tag);
  const stateKey = normalizeStateKey(value);
  const stateConfig = getStateConfig(label, stateKey);

  if (stateConfig) {
    return {
      text: stateConfig.text,
      stateColor: stateConfig.color,
    };
  }

  if (value !== undefined && value !== null && String(value).trim()) {
    return {
      text: String(value),
      stateColor: null,
    };
  }

  return {
    text: label.text,
    stateColor: null,
  };
}

function ScadaTextOverlay({ labels, tagLookup, placements = {} }: Props) {
  if (!labels.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[2]">
      {labels.map((label) => {
        const display = resolveLabelDisplay(label, tagLookup);

        return (
          <EquipmentLabel
            key={label.id}
            label={label}
            text={display.text}
            stateColor={display.stateColor}
            placement={placements[label.id]}
          />
        );
      })}
    </div>
  );
}

export default memo(ScadaTextOverlay);
