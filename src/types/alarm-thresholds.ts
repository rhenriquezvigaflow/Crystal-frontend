export type AlarmSeverity = "info" | "warning" | "critical";

export type AlarmThresholdSource = "configured" | "candidate";

export interface ThresholdConfigItem {
  tag_id: string;
  min_value?: number;
  max_value?: number;
  severity?: AlarmSeverity;
  enabled: boolean;
}

export interface ThresholdConfigRequest {
  items: ThresholdConfigItem[];
}

export interface ThresholdConfigResponse {
  ok: boolean;
  lagoon_id: string;
  created: string[];
  updated: string[];
}

export interface ThresholdViewRow {
  tag_id: string;
  tag_name?: string | null;
  source: AlarmThresholdSource;
  min_value?: number | null;
  max_value?: number | null;
  severity?: AlarmSeverity | null;
  enabled?: boolean | null;
}

export interface ThresholdViewResponse {
  lagoon_id: string;
  rows: ThresholdViewRow[];
}

export interface AlarmThresholdRow {
  tag_id: string;
  tag_name?: string | null;
  source: AlarmThresholdSource;
  min_value: number | null;
  max_value: number | null;
  severity: AlarmSeverity;
  enabled: boolean;
  dirty: boolean;
}

export type AlarmThresholdField =
  | "min_value"
  | "max_value"
  | "severity"
  | "enabled";

export type AlarmThresholdValidationErrors = Partial<
  Record<AlarmThresholdField | "tag_id", string>
>;

export interface AlarmToastMessage {
  kind: "success" | "error";
  message: string;
}

export const ALARM_SEVERITIES: AlarmSeverity[] = [
  "info",
  "warning",
  "critical",
];
