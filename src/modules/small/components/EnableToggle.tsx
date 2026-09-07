interface Props {
  enabled: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
}

export default function EnableToggle({ enabled, disabled = false, onChange }: Props) {
  return (
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${enabled ? "bg-green-600" : "bg-slate-300"}`}
      disabled={disabled}
      aria-pressed={enabled}
      aria-label={enabled ? "Disable cycle" : "Enable cycle"}
      onClick={() => onChange(!enabled)}
    >
      <span
        aria-hidden="true"
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}
