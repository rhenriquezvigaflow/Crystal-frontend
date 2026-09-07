import { useEffect } from "react";
import { createPortal } from "react-dom";

import PopUpPump from "../../../components/scada/pop-up-pump";
import ProcessPumpGraphic from "./ProcessPumpGraphic";
import { EQUIPMENT_STATUS_LABELS } from "./equipmentStatus";
import type { EquipmentStatus, PumpConfig } from "../types/smallScada.types";

interface Props {
  pump: PumpConfig;
  status: EquipmentStatus;
  pumpColor: string;
  canOperate: boolean;
  onClose: () => void;
  onStart: () => void;
  onStop: () => void;
}

export default function PumpEquipmentModal({
  pump,
  status,
  pumpColor,
  canOperate,
  onClose,
  onStart,
  onStop,
}: Props) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);


  return createPortal(
    <div className="small-pump-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="small-pump-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="small-pump-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id="small-pump-modal-title">Pump {pump.label}</h2>
          <button type="button" className="small-modal-close" onClick={onClose} aria-label="Close pump">
            ×
          </button>
        </header>

        {pump.svgId === "PUMP004" ? (
          <PopUpPump className="small-pump-modal__graphic small-pump-modal__graphic--circulation" pumpColor={pumpColor} aria-hidden="true" />
        ) : (
          <ProcessPumpGraphic className="small-pump-modal__graphic" statusColor={pumpColor} />
        )}

        <p className="small-pump-modal__status">
          Status: <strong>{EQUIPMENT_STATUS_LABELS[status]}</strong>
        </p>

        {canOperate ? (
          <div className="small-pump-modal__actions">
            <button type="button" className="small-pump-modal__start" onClick={onStart}>Start</button>
            <button type="button" className="small-pump-modal__stop" onClick={onStop}>Stop</button>
          </div>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-800">
            Read-only access
          </p>
        )}
      </section>
    </div>,
    document.body,
  );
}
