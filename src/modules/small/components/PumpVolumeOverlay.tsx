interface Props {
  pumpLabel: string;
  volumeM3: number;
}

/** Compact SCADA label for the accumulated volume of one pump. */
export default function PumpVolumeOverlay({ pumpLabel, volumeM3 }: Props) {
  return (
    <output
      className="small-pump-volume__card flex flex-col items-center justify-center gap-0.5 text-center leading-none"
      aria-label={`${pumpLabel} volume`}
    >
      <span className="small-pump-volume__label font-medium text-slate-500">Volume Pump</span>
      <span className="small-pump-volume__value font-semibold text-slate-800">
        {volumeM3.toFixed(2)}<span className="small-pump-volume__unit ml-0.5 font-medium text-slate-500">m<sup>3</sup></span>
      </span>
    </output>
  );
}
