import SystemStatusCard from "../status/SystemStatusCard";
import PlantStatusCard from "../status/PlantStatusCard";
import AlarmsPanel from "../panel/AlarmPanel";

export default function RightPanel() {
  return (
    <aside className="w-90 flex flex-col gap-4 p-4">
      <SystemStatusCard status="OK" />
      <PlantStatusCard />
      <AlarmsPanel />
    </aside>
  );
}
