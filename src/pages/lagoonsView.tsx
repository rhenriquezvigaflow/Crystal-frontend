import { useParams } from "react-router-dom";
import { lagoons } from "../data/lagoons";

import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import LagoonContainer from "../components/lagoonContainer";

export default function LagoonsView() {
  const { lagoonId } = useParams<{ lagoonId: string }>();

  const lagoonName =
    lagoons.find((l) => l.id === lagoonId)?.name ?? lagoonId ?? "";

  return (
    <div className="bg-slate-50">
      <div className="grid grid-cols-[260px_1fr] grid-rows-[56px_1fr]">
        <div className="row-span-2">
          <Sidebar />
        </div>

        <TopBar lagoonName={lagoonName} />

        <div className="p-4 overflow-hidden mt-8">
          <LagoonContainer lagoonId={lagoonId ?? "--"} />
        </div>
      </div>
    </div>
  );
}
