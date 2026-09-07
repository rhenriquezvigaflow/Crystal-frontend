import { useMemo } from "react";

import pumpType2Svg from "../../../svg/PUMP_TYPE2.svg?raw";

interface Props {
  statusColor: string;
  className?: string;
}

const SAFE_CSS_COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i;

export default function ProcessPumpGraphic({ statusColor, className }: Props) {
  const markup = useMemo(() => {
    const color = SAFE_CSS_COLOR.test(statusColor.trim()) ? statusColor : "#868588";
    return pumpType2Svg.replace(
      "</style>",
      `#rect12-7-7{fill:${color} !important;fill-opacity:1 !important;}</style>`,
    );
  }, [statusColor]);

  return (
    <div
      className={[className, "small-pump-modal__graphic--process"].filter(Boolean).join(" ")}
      role="img"
      aria-label="Type 2 pump"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}