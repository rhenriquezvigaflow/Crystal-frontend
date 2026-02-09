import CostaDelLagoSvg from "../svg/costa-del-lago";

const VIEWBOX = "150 140 1100 1050";

export default function LagoonSVG() {
  return (
    <div className="w-full h-full">
      <CostaDelLagoSvg
        viewBox={VIEWBOX}
        className="w-full h-full max-w-none"
        preserveAspectRatio="xMidYMin meet"
      />
    </div>
  );
}
