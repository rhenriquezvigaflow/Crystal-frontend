import { BiCalendar } from "react-icons/bi";

interface Props {
  onClick: () => void;
  visible?: boolean;
}

export default function ProgrammingButton({ onClick, visible = true }: Props) {
return (
    <button
      type="button"
      className={`small-programming-button${visible ? "" : " is-placeholder"}`}
      title={visible ? "Pump programming" : undefined}
      aria-label={visible ? "Pump programming" : undefined}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={visible ? onClick : undefined}
    >
      <BiCalendar aria-hidden="true" focusable="false" />
    </button>
  );
}
