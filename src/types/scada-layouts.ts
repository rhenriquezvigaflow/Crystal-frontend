export interface ScadaLayoutPosition {
  top: string;
  left: string;
}

export type ScadaElementType =
  | "kpi"
  | "pump"
  | "valve"
  | "tank"
  | "chemical"
  | "image"
  | "plc_status";

export type ScadaRenderableElementType =
  | "pump"
  | "valve"
  | "tank"
  | "chemical";

export type ScadaTankStateKey = "LOW" | "MEDIUM" | "HIGH";

export type ScadaRenderMode = "color" | "pulse" | "binary_level" | "multi_level";

export interface ScadaTankStateTagCondition {
  tag: string;
  active_state?: number | string | boolean | null;
}

export type ScadaTankStateTagEntry = string | ScadaTankStateTagCondition;
export type ScadaTankStateTagSelector =
  | ScadaTankStateTagEntry
  | ScadaTankStateTagEntry[]
  | null;

export interface ScadaTankStateTags {
  LOW?: ScadaTankStateTagSelector;
  MEDIUM?: ScadaTankStateTagSelector;
  HIGH?: ScadaTankStateTagSelector;
}

export interface ScadaRenderRuleState {
  color?: string | null;
  level?: number | null;
}

export interface ScadaRenderRuleAnimation {
  type?: string | null;
  duration_ms?: number | null;
  pulse?: boolean | null;
  scale?: boolean | null;
}

export interface ScadaRenderRule {
  mode: ScadaRenderMode;
  states: Record<string, ScadaRenderRuleState>;
  animation?: ScadaRenderRuleAnimation | null;
}

export interface ScadaRenderRules {
  pump: ScadaRenderRule;
  valve: ScadaRenderRule;
  tank: ScadaRenderRule;
  chemical: ScadaRenderRule;
}

export interface LagoonScadaEquipmentDefinition {
  tag: string;
  label?: string | null;
  position?: ScadaLayoutPosition | null;
  svg_target?: string | null;
  type?: ScadaRenderableElementType | null;
  state_tags?: ScadaTankStateTags | null;
  panel?: string | null;
  always_visible?: boolean | null;
}

export interface LagoonScadaKpiDefinition {
  tag: string;
  label?: string | null;
  unit?: string | null;
  position: ScadaLayoutPosition;
  icon_type?: string | null;
  always_visible?: boolean | null;
}

export type LagoonScadaPumpDefinition = LagoonScadaEquipmentDefinition;

export type LagoonScadaValveDefinition = LagoonScadaEquipmentDefinition;

export type LagoonScadaTankDefinition = LagoonScadaEquipmentDefinition;

export type LagoonScadaChemicalDefinition = LagoonScadaEquipmentDefinition;

export interface LagoonScadaImageDefinition {
  id?: string | null;
  src: string;
  alt?: string | null;
  position?: ScadaLayoutPosition | null;
  width?: string | number | null;
  height?: string | number | null;
  object_fit?: string | null;
  opacity?: number | null;
  z_index?: number | null;
  full_stage?: boolean | null;
}

export type LagoonMetricKey = "temperature" | "orp" | "dosage";

export interface LagoonMetricDefinition {
  key?: LagoonMetricKey | string | null;
  tag: string;
  label?: string | null;
  unit?: string | null;
  fallback_tag?: string | null;
}

export interface LagoonMetricsOverlayDefinition {
  position?: ScadaLayoutPosition | null;
  width?: string | number | null;
  z_index?: number | null;
  metrics: LagoonMetricDefinition[];
}

export interface LagoonScadaPlcStatusDefinition {
  position: ScadaLayoutPosition;
}

export interface LagoonScadaConfig {
  lagoon_id: string;
  layout_id?: string | null;
  svg_component?: string | null;
  aspect_ratio?: string | null;
  map_id?: string | null;
  map_name?: string | null;
  map_order?: number | null;
  default_map?: boolean | null;
  kpis: LagoonScadaKpiDefinition[];
  pumps: LagoonScadaPumpDefinition[];
  valves?: LagoonScadaValveDefinition[];
  tanks?: LagoonScadaTankDefinition[];
  hipoclorito?: LagoonScadaChemicalDefinition[];
  chemicals?: LagoonScadaChemicalDefinition[];
  images?: LagoonScadaImageDefinition[];
  lagoon_metrics_overlay?: LagoonMetricsOverlayDefinition | null;
  plc_status?: LagoonScadaPlcStatusDefinition | null;
  render_rules?: Partial<ScadaRenderRules> | null;
  labels?: ScadaTextLabelDefinition[] | null;
  warnings?: string[] | null;
}

export interface ResolvedScadaElement {
  id: string;
  type: ScadaElementType;
  tag: string | null;
  label: string;
  position?: ScadaLayoutPosition | null;
  svg_target?: string | null;
  unit?: string | null;
  icon_type?: string | null;
  panel?: string | null;
  always_visible?: boolean | null;
  fallback_tag?: string | null;
  state_tags?: ScadaTankStateTags | null;
  src?: string | null;
  alt?: string | null;
  width?: string | number | null;
  height?: string | number | null;
  object_fit?: string | null;
  opacity?: number | null;
  z_index?: number | null;
  full_stage?: boolean | null;
  [key: string]: unknown;
}

export interface ResolvedLagoonMetric {
  key: LagoonMetricKey;
  tag: string;
  label: string;
  unit: string;
  fallback_tag: string | null;
}

export interface ResolvedLagoonMetricsOverlay {
  position: ScadaLayoutPosition | null;
  width: string | number | null;
  z_index: number | null;
  metrics: ResolvedLagoonMetric[];
}

export interface ResolvedScadaScene {
  lagoon_id: string;
  layout_id: string;
  svg_component: string;
  aspect_ratio: string | null;
  warnings: string[];
  elements: ResolvedScadaElement[];
  render_rules: ScadaRenderRules;
  labels: ResolvedScadaTextLabel[];
  lagoon_metrics_overlay: ResolvedLagoonMetricsOverlay | null;
}

export interface ScadaMapManifestEntry {
  id: string;
  name: string;
  svg: string;
  layout: string;
  default?: boolean;
}

export interface ResolvedScadaInlineSvgAsset {
  type: "inline";
  markup: string;
  aspect_ratio: string | null;
}

export interface ResolvedScadaComponentSvgAsset {
  type: "component";
  component_id: string;
  aspect_ratio: string | null;
}

export type ResolvedScadaSvgAsset =
  | ResolvedScadaInlineSvgAsset
  | ResolvedScadaComponentSvgAsset;

export interface ResolvedScadaMap {
  id: string;
  name: string;
  default: boolean;
  scene: ResolvedScadaScene;
  svg: ResolvedScadaSvgAsset;
}

export interface ResolvedEmbeddedScadaMapDefinition {
  id: string;
  name: string;
  default: boolean;
  order: number;
  scene: ResolvedScadaScene;
}

export interface ResolvedScadaMapBundle {
  lagoon_id: string;
  maps: ResolvedScadaMap[];
  warnings: string[];
  source: "manifest" | "legacy-file" | "legacy-embedded" | "embedded";
}

export interface RealtimeTagLookup {
  exact: Record<string, unknown>;
  normalized: Record<string, unknown>;
}

export type ScadaTextLabelAlign = "left" | "center" | "right";

export interface ScadaTextLabelStateDefinition {
  text?: string | number | null;
  label?: string | number | null;
  value?: string | number | null;
  color?: string | null;
  dot_color?: string | null;
}

export type ScadaTextLabelStateDefinitionValue =
  | string
  | number
  | ScadaTextLabelStateDefinition;

export type ScadaTextLabelStateDefinitions =
  Record<string, ScadaTextLabelStateDefinitionValue>;

export interface ScadaTextLabelState {
  text: string;
  color: string | null;
}

export type ScadaTextLabelStates = Record<string, ScadaTextLabelState>;

export interface ScadaTextLabelDefinition {
  id: string;
  text?: string | null;
  tag?: string | null;
  fallback_tag?: string | null;
  states?: ScadaTextLabelStateDefinitions | null;
  position?: ScadaLayoutPosition | null;
  align?: ScadaTextLabelAlign | null;
  hidden?: boolean | null;
  max_width?: number | null;
  color?: string | null;
  font_family?: string | null;
  font_size?: number | null;
  font_weight?: number | null;
  text_shadow?: string | null;
  source_svg_target?: string | null;
  source_element_type?: string | null;
}

export interface ResolvedScadaTextLabel {
  id: string;
  text: string;
  tag: string | null;
  fallback_tag: string | null;
  states: ScadaTextLabelStates | null;
  position: ScadaLayoutPosition | null;
  align: ScadaTextLabelAlign;
  max_width: number | null;
  color: string | null;
  font_family: string | null;
  font_size: number | null;
  font_weight: number | null;
  text_shadow: string | null;
  source_svg_target: string | null;
  source_element_type: string | null;
}
