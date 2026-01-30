export interface HistoryPoint {
  timestamp: string;
  value: number;
}

export interface HistorySeries {
  tag_key: string;
  name: string;
  points: HistoryPoint[];
}

export interface HistoryResponse {
  series: HistorySeries[];
}