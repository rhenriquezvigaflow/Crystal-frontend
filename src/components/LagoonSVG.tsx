import CostaDelLagoSvg from "../svg/layout1";

export default function LagoonSVG() {
  return (
    <div className="relative w-full aspect-video">
      <CostaDelLagoSvg
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}