export interface HistoryPoint {
  timestamp: string;
  value: number | null;
}

export interface HistorySeries {
  tag?: string | null;
  tag_key?: string | null;
  name?: string | null;
  points: HistoryPoint[];
}

export interface HistoryResponse {
  series: HistorySeries[];
}
