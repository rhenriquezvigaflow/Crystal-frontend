interface Props {
  activeLabel: string;
  activeTitle: string | null;
  activeIndex: number;
  totalMaps: number;
  onPrevious: () => void;
  onNext: () => void;
}

export default function MapNavigation({
  activeLabel,
  activeTitle,
  activeIndex,
  totalMaps,
  onPrevious,
  onNext,
}: Props) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      <button
        type="button"
        className="scada-map-switcher__button"
        onClick={onPrevious}
        aria-label="Previous map"
      >
        &#8249;
      </button>

      <div
        key={`${activeIndex}-${activeLabel}`}
        className="scada-map-switcher__active-chip min-w-0 flex-1"
        title={activeTitle ?? activeLabel}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-[13px] font-semibold text-slate-900 sm:text-sm">
            {activeLabel}
          </span>
          <span className="scada-map-switcher__count shrink-0">
            {totalMaps} maps
          </span>
        </div>
      </div>

      <button
        type="button"
        className="scada-map-switcher__button"
        onClick={onNext}
        aria-label="Next map"
      >
        &#8250;
      </button>
    </div>
  );
}
