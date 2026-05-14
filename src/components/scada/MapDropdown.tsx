import type { ChangeEvent } from "react";

interface MapDropdownOption {
  id: string;
  label: string;
  title: string | null;
}

interface Props {
  options: MapDropdownOption[];
  activeIndex: number;
  onActiveMapIndexChange: (nextIndex: number) => void;
}

export default function MapDropdown({
  options,
  activeIndex,
  onActiveMapIndexChange,
}: Props) {
  if (options.length <= 2) return null;

  const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    onActiveMapIndexChange(Number(event.target.value));
  };

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <div className="scada-map-switcher__divider hidden sm:block" />

      <div className="relative min-w-0 flex-1 sm:w-[132px]">
        <select
          className="scada-map-switcher__select"
          value={String(activeIndex)}
          onChange={handleSelect}
          aria-label="Select SCADA map"
        >
          {options.map((option, index) => (
            <option key={option.id} value={String(index)} title={option.title ?? option.label}>
              {option.label}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] text-slate-400">
          &#709;
        </span>
      </div>
    </div>
  );
}
