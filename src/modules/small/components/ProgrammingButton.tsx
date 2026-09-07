import { BiCalendar } from "react-icons/bi";

interface Props {
  onClick: () => void;
  visible?: boolean;
}

export default function ProgrammingButton({ onClick, visible = true }: Props) {
  if (!visible) return null;

  return (
    <button
      type="button"
      className="small-programming-button"
      title="Pump programming"
      aria-label="Pump programming"
      onClick={onClick}
    >
      <BiCalendar aria-hidden="true" focusable="false" />
    </button>
  );
}
