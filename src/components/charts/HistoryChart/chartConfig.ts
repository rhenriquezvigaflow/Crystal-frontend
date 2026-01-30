export const KPI_COLORS = [
  "#6366F1", // indigo
  "#22C55E", // green
  "#F97316", // orange
  "#EF4444", // red
  "#06B6D4", // cyan
  "#A855F7", // violet
  "#F59E0B", // amber
  "#10B981", // emerald
];

export const getColorByIndex = (i: number) =>
  KPI_COLORS[i % KPI_COLORS.length];