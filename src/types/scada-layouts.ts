export interface ScadaLayoutPosition {
  top?: string | null;
  left?: string | null;
}

export interface ScadaLayoutElement {
  id: string;
  type: string;
  position?: ScadaLayoutPosition | null;
  svg_target?: string | null;
  default_label?: string | null;
  fallback_tag?: string | null;
  unit?: string | null;
  icon_type?: string | null;
  panel?: string | null;
  [key: string]: unknown;
}

export interface ScadaLayoutDefinition {
  plant?: string | null;
  version?: string | null;
  description?: string | null;
  svg_component?: string | null;
  aspect_ratio?: string | null;
  elements: ScadaLayoutElement[];
}

export interface ScadaLayoutRecord {
  id: string;
  name: string;
  json_definition: ScadaLayoutDefinition;
  updated_at: string | null;
}

export interface ScadaLayoutMappingEntry {
  tag?: string | null;
  label?: string | null;
  svg_target?: string | null;
  [key: string]: unknown;
}

export type ScadaLayoutMappingJson = Record<string, ScadaLayoutMappingEntry>;

export interface LagoonScadaMapping {
  lagoon_id: string;
  layout_id: string;
  mapping_json: ScadaLayoutMappingJson;
  collector_tags: string[];
  warnings: string[];
  updated_at: string | null;
}

export interface ResolvedScadaElement extends ScadaLayoutElement {
  tag: string | null;
  label: string;
  mapping: ScadaLayoutMappingEntry | null;
}

export interface ResolvedScadaScene {
  layout: ScadaLayoutRecord;
  mapping: LagoonScadaMapping;
  elements: ResolvedScadaElement[];
}

export interface RealtimeTagLookup {
  exact: Record<string, unknown>;
  normalized: Record<string, unknown>;
}

export type ScadaTextLabelAlign = "left" | "center" | "right";

export interface ScadaTextLabelDefinition {
  id: string;
  text?: string | null;
  position?: ScadaLayoutPosition | null;
  align?: ScadaTextLabelAlign | null;
  hidden?: boolean | null;
  max_width?: number | null;
  color?: string | null;
  font_size?: number | null;
  font_weight?: number | null;
  text_shadow?: string | null;
}

export interface ResolvedScadaTextLabel {
  id: string;
  text: string;
  position: ScadaLayoutPosition;
  align: ScadaTextLabelAlign;
  max_width: number | null;
  color: string | null;
  font_size: number | null;
  font_weight: number | null;
  text_shadow: string | null;
}
