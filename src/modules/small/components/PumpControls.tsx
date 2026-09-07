import OperationMode from "./OperationMode";
import ProgrammingButton from "./ProgrammingButton";
import type { OperationMode as OperationModeValue, PumpConfig } from "../types/smallScada.types";

interface Props {
  pump: PumpConfig;
  mode: OperationModeValue;
  canOperate: boolean;
  canViewSchedule: boolean;
  onModeChange: (mode: OperationModeValue) => void;
  onProgrammingClick: () => void;
}

export default function PumpControls({
  mode,
  canOperate,
  canViewSchedule,
  onModeChange,
  onProgrammingClick,
}: Props) {
  return (
    <div className="small-pump-controls__content">
      <OperationMode mode={mode} disabled={!canOperate} onChange={onModeChange} />
      <ProgrammingButton
        visible={canOperate && canViewSchedule && mode === "automatic"}
        onClick={onProgrammingClick}
      />
    </div>
  );
}
