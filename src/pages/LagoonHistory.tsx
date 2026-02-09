// lagoon/LagoonHistory.tsx
import HistoryChart from "../components/charts/HistoryChart/HistoryChart";
import { useHistoryHourly } from "../hooks/useHistoryHourly";

interface Props {
  lagoonId: string;
}

const LagoonHistory = ({ lagoonId }: Props) => {
  const today = new Date().toISOString().split("T")[0];

  const { data, loading, error } = useHistoryHourly({
    lagoonId,
    startDate: `${today}T00:00:00Z`, 
    endDate: `${today}T23:59:59Z`,
  });

  if (loading) return <>Cargando histórico…</>;
  if (error) return <>{error}</>;
  if (!data?.series?.length) return <>Sin datos históricos</>;

  return <HistoryChart data={data} />;
};

export default LagoonHistory;
