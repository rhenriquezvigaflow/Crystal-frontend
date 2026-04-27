export interface ScadaLayoutPosition {
  top: string;
  left: string;
}

export interface LagoonScadaKpiDefinition {
  tag: string;
  label?: string | null;
  unit?: string | null;
  position: ScadaLayoutPosition;
  icon_type?: string | null;
  always_visible?: boolean | null;
}

export interface LagoonScadaPumpDefinition {
  tag: string;
  label?: string | null;
  position?: ScadaLayoutPosition | null;
  svg_target?: string | null;
  panel?: string | null;
  always_visible?: boolean | null;
}

export interface LagoonScadaValveDefinition {
  tag: string;
  label?: string | null;
  position?: ScadaLayoutPosition | null;
  svg_target?: string | null;
  always_visible?: boolean | null;
}

export interface LagoonScadaPlcStatusDefinition {
  position: ScadaLayoutPosition;
}

export interface LagoonScadaConfig {
  lagoon_id: string;
  layout_id?: string | null;
  svg_component?: string | null;
  aspect_ratio?: string | null;
  kpis: LagoonScadaKpiDefinition[];
  pumps: LagoonScadaPumpDefinition[];
  valves?: LagoonScadaValveDefinition[];
  plc_status?: LagoonScadaPlcStatusDefinition | null;
  labels?: ScadaTextLabelDefinition[] | null;
  warnings?: string[] | null;
}

export interface ResolvedScadaElement {
  id: string;
  type: string;
  tag: string | null;
  label: string;
  position?: ScadaLayoutPosition | null;
  svg_target?: string | null;
  unit?: string | null;
  icon_type?: string | null;
  panel?: string | null;
  always_visible?: boolean | null;
  fallback_tag?: string | null;
  [key: string]: unknown;
}

export interface ResolvedScadaScene {
  lagoon_id: string;
  layout_id: string;
  svg_component: string;
  aspect_ratio: string | null;
  warnings: string[];
  elements: ResolvedScadaElement[];
  labels: ResolvedScadaTextLabel[];
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
  source_svg_target?: string | null;
  source_element_type?: string | null;
}

export interface ResolvedScadaTextLabel {
  id: string;
  text: string;
  position: ScadaLayoutPosition | null;
  align: ScadaTextLabelAlign;
  max_width: number | null;
  color: string | null;
  font_size: number | null;
  font_weight: number | null;
  text_shadow: string | null;
  source_svg_target: string | null;
  source_element_type: string | null;
}
