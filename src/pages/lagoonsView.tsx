import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import LagoonContainer from "../components/lagoonContainer";

export default function LagoonsView() {
  return (
    <div className=" bg-slate-50">
      <div
        className="
          grid
          grid-cols-[260px_1fr]
          grid-rows-[56px_1fr]
        "
      >
        <div className="row-span-2">
          <Sidebar />
        </div>

        <TopBar />

        <div className="p-4 overflow-hidden mt-8">
          <LagoonContainer />
        </div>
      </div>
    </div>
  );
}
