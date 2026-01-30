import LagoonView from "../../pages/lagoonsView";
import FloatingKpis from "../../components/lagoon/FloatingKPI";
import RightPanel from "../../components/panel/RightPanel";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-slate-100">
      <main className="relative flex-1 p-4">
        <LagoonView />
        <FloatingKpis label={""} value={""} unit={""} />
      </main>

      <RightPanel />
    </div>
  );
}
