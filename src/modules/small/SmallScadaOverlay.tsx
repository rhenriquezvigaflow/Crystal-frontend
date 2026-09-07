import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { LagoonMetricsProps } from "../../components/scada/LagoonMetricsOverlay";
import "./smallScada.css";
import PumpEquipmentModal from "./components/PumpEquipmentModal";
import PumpProgrammingModal from "./components/PumpProgrammingModal";
import PumpControls from "./components/PumpControls";
import SmallMobilePanel from "./components/SmallMobilePanel";
import TankLevelIndicator from "./components/TankLevelIndicator";
import {
  SMALL_SCADA_LAYOUT,
  toSmallScadaPositionStyle,
} from "./config/smallScadaLayout";
import { SMALL_PUMPS, smallScadaMock } from "./mocks/smallScada.mock";
import type {
  OperationMode as OperationModeValue,
  PumpId,
  PumpMockState,
  PumpScheduleCycle,
  SmallPumpSvgId,
} from "./types/smallScada.types";

interface Props {
  pumps: Record<PumpId, PumpMockState>;
  canOperate: boolean;
  canViewSchedule: boolean;
  canUpdateSchedule: boolean;
  selectedEquipmentPump: PumpId | null;
  selectedEquipmentColor: string | null;
  onModeChange: (moduleId: string, mode: OperationModeValue) => Promise<void>;
  onStartPump?: (moduleId: string) => void | Promise<void>;
  onStopPump?: (moduleId: string) => void | Promise<void>;
  onCloseEquipmentPump: () => void;
  onOpenEquipmentPump: (svgId: SmallPumpSvgId, color: string) => void;
  mobileHost: HTMLElement | null;
  lagoonMetrics: LagoonMetricsProps | null;
}

export default function SmallScadaOverlay({
  pumps,
  canOperate,
  canViewSchedule,
  canUpdateSchedule,
  selectedEquipmentPump,
  selectedEquipmentColor,
  onModeChange,
  onStartPump,
  onStopPump,
  onCloseEquipmentPump,
  onOpenEquipmentPump,
  mobileHost,
  lagoonMetrics,
}: Props) {
  const [selectedPump, setSelectedPump] = useState<PumpId | null>(null);
  const [modeNotice, setModeNotice] = useState<{ pumpId: PumpId; mode: OperationModeValue } | null>(null);
  const [modeError, setModeError] = useState<string | null>(null);
  const [cyclesByPump, setCyclesByPump] = useState<Record<PumpId, PumpScheduleCycle[]>>(() => (
    Object.fromEntries(SMALL_PUMPS.map((pump) => [
      pump.id,
      smallScadaMock.cycles.map((cycle) => ({ ...cycle })),
    ])) as Record<PumpId, PumpScheduleCycle[]>
  ));
  const closeProgramming = useCallback(() => setSelectedPump(null), []);

  useEffect(() => {
    if (!modeNotice) return undefined;
    const timeoutId = window.setTimeout(() => setModeNotice(null), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [modeNotice]);

  const changeMode = async (pumpId: PumpId, mode: OperationModeValue) => {
    if (!canOperate) return;
    const pump = SMALL_PUMPS.find((item) => item.id === pumpId);
    if (!pump) return;
    setModeError(null);
    try {
      await onModeChange(pump.moduleId, mode);
      setModeNotice({ pumpId, mode });
    } catch (error) {
      setModeError(error instanceof Error ? error.message : "The PLC mode could not be changed.");
    }
  };

  return (
    <>
      <div className="small-scada-overlay hidden xl:block" data-testid="small-scada-overlay">
        <TankLevelIndicator level={smallScadaMock.tankLevel} />
        {canOperate ? SMALL_PUMPS.map((pump) => {
          const state = pumps[pump.id];
          const position = SMALL_SCADA_LAYOUT.pumps[pump.svgId].controls;
          return (
            <div
              key={pump.id}
              className={`small-pump-controls small-pump-controls--${pump.id.toLowerCase()}`}
              style={toSmallScadaPositionStyle(position)}
              data-pump-id={pump.id}
              data-svg-id={pump.svgId}
            >
              <PumpControls
                pump={pump}
                mode={state.mode}
                canOperate={canOperate}
                canViewSchedule={canViewSchedule}
                onModeChange={(mode) => changeMode(pump.id, mode)}
                onProgrammingClick={() => setSelectedPump(pump.id)}
              />
            </div>
          );
        }) : null}
      </div>
      {selectedPump ? (
        <PumpProgrammingModal
          pumpId={selectedPump}
          cycles={cyclesByPump[selectedPump]}
          onCyclesChange={(cycles) => setCyclesByPump((current) => ({
            ...current,
            [selectedPump]: cycles,
          }))}
          readOnly={!canUpdateSchedule}
          onClose={closeProgramming}
        />
      ) : null}
      {mobileHost ? createPortal(
        <SmallMobilePanel
          pumps={pumps}
          canOperate={canOperate}
          canViewSchedule={canViewSchedule}
          lagoonMetrics={lagoonMetrics}
          onModeChange={changeMode}
          onProgrammingClick={setSelectedPump}
          onEquipmentClick={onOpenEquipmentPump}
        />,
        mobileHost,
      ) : null}
      {modeNotice ? createPortal(
        <div
          className={`small-mode-toast small-mode-toast--${modeNotice.mode} fixed right-2.5 bottom-2.5 left-2.5 z-[10050] min-w-0 md:right-5 md:bottom-5 md:left-auto md:min-w-[230px]`}
          role="status"
          aria-live="polite"
        >
          <span className="small-mode-toast__badge" aria-hidden="true">M/A</span>
          <span>
            <strong>Mode request sent to PLC</strong>
            <small>{modeNotice.pumpId}: {modeNotice.mode === "automatic" ? "Automatic" : "Manual"}</small>
          </span>
        </div>,
        document.body,
      ) : null}
      {modeError ? createPortal(
        <div className="small-mode-toast fixed right-2.5 bottom-2.5 left-2.5 z-[10050] min-w-0 md:right-5 md:bottom-5 md:left-auto md:min-w-[230px]" role="alert">
          <span><strong>PLC write failed</strong><small>{modeError}</small></span>
        </div>,
        document.body,
      ) : null}
      {canOperate && selectedEquipmentPump && pumps[selectedEquipmentPump].mode === "manual" ? (() => {
        const pump = SMALL_PUMPS.find((item) => item.id === selectedEquipmentPump);
        if (!pump || !selectedEquipmentColor) return null;
        const state = pumps[selectedEquipmentPump];
        return (
          <PumpEquipmentModal
            pump={pump}
            status={state.status}
            pumpColor={selectedEquipmentColor}
            canOperate={canOperate}
            onClose={onCloseEquipmentPump}
            onStart={() => onStartPump?.(pump.moduleId)}
            onStop={() => onStopPump?.(pump.moduleId)}
          />
        );
      })() : null}
    </>
  );
}
