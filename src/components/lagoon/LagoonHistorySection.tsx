import LagoonBarChart from "../../components/charts/lagoonBarChart";
import { useLagoonHistoryHourly } from "../../hooks/useHistoryHourly";

interface Props {
  lagoonId: string;
  tags: string[];
}

export default function LagoonHistorySection({
  lagoonId,
  tags,
}: Props) {
  const { labels, series, loading } = useLagoonHistoryHourly({
    lagoonId,
    tags,
    range: "day",
  });

  return (
    <LagoonBarChart
      labels={labels}
      series={series}
      loading={loading}
    />
  );
}
