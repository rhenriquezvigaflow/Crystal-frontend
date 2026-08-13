import * as React from "react";
import { createPortal } from "react-dom";
import PopUpPump from "../components/scada/pop-up-pump";

const SMALL_PUMP_ID = "g24-6";
const SMALL_PUMP_NAME = "Pump recirculation";
const FALLBACK_PUMP_COLOR = "#0e76e7";

const TANK_LEVEL_BOTTOM = 2300;
const TANK_LEVEL_HEIGHT = 3620;
const TANK_LEVEL_MARKS = [0, 25, 50, 75, 100];
const TANK_LEVEL_SIMULATION = [0, 25, 50, 75, 100, 75, 50, 25];
const TANK_WATER_LEFT = 2800;
const TANK_WATER_RIGHT = 7425;
const TANK_WATER_CORNER_X = 390;
const TANK_WATER_CORNER_Y = 330;

function clampTankLevel(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.min(100, Math.max(0, numericValue));
}

function TankLevelVisual({ level }) {
  const normalizedLevel = clampTankLevel(level);
  const fillScale = normalizedLevel / 100;
  const waterClipId = `tank-water-${React.useId().replace(/:/g, "")}`;
  const tankLevelTop = TANK_LEVEL_BOTTOM + TANK_LEVEL_HEIGHT;
  const animatedFillStyle = {
    transform: `scaleY(${fillScale})`,
    transformBox: "fill-box",
    transformOrigin: "center top",
    transition: "transform 450ms ease-in-out",
  };

  return (
    <g
      id="recirculation-tank-level"
      data-level={normalizedLevel}
      pointerEvents="none"
      role="img"
      aria-label={`Tank level ${Math.round(normalizedLevel)} percent`}
    >
      <title>{`Tank level: ${Math.round(normalizedLevel)}%`}</title>
      <defs>
        <clipPath id={waterClipId} clipPathUnits="userSpaceOnUse">
          <path
            d={`M ${TANK_WATER_LEFT},${tankLevelTop} H ${TANK_WATER_RIGHT} V ${
              TANK_LEVEL_BOTTOM + TANK_WATER_CORNER_Y
            } Q ${TANK_WATER_RIGHT},${TANK_LEVEL_BOTTOM} ${
              TANK_WATER_RIGHT - TANK_WATER_CORNER_X
            },${TANK_LEVEL_BOTTOM} H ${TANK_WATER_LEFT + TANK_WATER_CORNER_X} Q ${
              TANK_WATER_LEFT
            },${TANK_LEVEL_BOTTOM} ${TANK_WATER_LEFT},${
              TANK_LEVEL_BOTTOM + TANK_WATER_CORNER_Y
            } Z`}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${waterClipId})`}>
        <rect
          id="recirculation-tank-water"
          x={TANK_WATER_LEFT}
          y={TANK_LEVEL_BOTTOM}
          width={TANK_WATER_RIGHT - TANK_WATER_LEFT}
          height={TANK_LEVEL_HEIGHT}
          fill="#35ade9"
          fillOpacity={0.82}
          stroke="none"
          style={animatedFillStyle}
        />
      </g>

      <g id="recirculation-tank-level-bar">
        <rect
          x={7810}
          y={TANK_LEVEL_BOTTOM - 60}
          width={570}
          height={TANK_LEVEL_HEIGHT + 120}
          rx={70}
          fill="#ffffff"
          fillOpacity={0.94}
        />
        <rect
          x={7900}
          y={TANK_LEVEL_BOTTOM}
          width={390}
          height={TANK_LEVEL_HEIGHT}
          fill="#f4f7f9"
        />
        <rect
          id="recirculation-tank-level-fill"
          x={7900}
          y={TANK_LEVEL_BOTTOM}
          width={390}
          height={TANK_LEVEL_HEIGHT}
          fill="#35ade9"
          style={animatedFillStyle}
        />
        {TANK_LEVEL_MARKS.map((mark) => {
          const markY = TANK_LEVEL_BOTTOM + (TANK_LEVEL_HEIGHT * mark) / 100;
          return (
            <line
              key={mark}
              x1={7900}
              x2={8290}
              y1={markY}
              y2={markY}
              stroke="#2f3e49"
              strokeWidth={mark === 0 || mark === 100 ? 36 : 22}
              strokeOpacity={mark === 0 || mark === 100 ? 1 : 0.55}
            />
          );
        })}
        <rect
          x={7900}
          y={TANK_LEVEL_BOTTOM}
          width={390}
          height={TANK_LEVEL_HEIGHT}
          fill="none"
          stroke="#2f3e49"
          strokeWidth={42}
        />
      </g>
    </g>
  );
}

function normalizePaintColor(value) {
  const color = String(value ?? "").trim();
  if (!color || color === "none" || color === "transparent") return null;
  if (/^rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)$/i.test(color)) return null;
  return color;
}

function readPumpCircleColor(target) {
  if (!(target instanceof Element) || typeof window === "undefined") {
    return FALLBACK_PUMP_COLOR;
  }

  const targetStateColor = normalizePaintColor(
    window.getComputedStyle(target).getPropertyValue("--scada-state-color"),
  );
  if (targetStateColor) return targetStateColor;

  const circle = target.matches("#circle280, circle, ellipse")
    ? target
    : target.querySelector("#circle280") ?? target.querySelector("circle, ellipse");
  if (!(circle instanceof Element)) return FALLBACK_PUMP_COLOR;

  return (
    normalizePaintColor(window.getComputedStyle(circle).fill) ??
    normalizePaintColor(circle.getAttribute("fill")) ??
    FALLBACK_PUMP_COLOR
  );
}

function defaultPumpControlHandler(pumpId) {
  void pumpId;
}

function defaultNumericControlHandler(moduleId, commandId, value) {
  void moduleId;
  void commandId;
  void value;
}

function SmallPumpPopup({
  pumpPopup,
  pumpColor,
  pumpStateLabel,
  canControl,
  actionPending,
  actionError,
  pendingPumpAction,
  closePumpPopup,
  handlePopupClick,
  handleStartPump,
  handleStopPump,
  confirmPumpAction,
  cancelPumpAction,
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="presentation"
      onClick={closePumpPopup}
      style={{
        alignItems: "center",
        backdropFilter: "blur(5px)",
        background: "rgba(15, 23, 42, 0.34)",
        display: "flex",
        inset: 0,
        justifyContent: "center",
        padding: 20,
        position: "fixed",
        zIndex: 10001,
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Popup ${pumpPopup.name}`}
        onClick={handlePopupClick}
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 12,
          boxShadow: "0 30px 70px rgba(15, 23, 42, 0.3)",
          boxSizing: "border-box",
          color: "#0f172a",
          fontFamily: "Calibri, Arial, sans-serif",
          maxWidth: "min(360px, calc(100vw - 32px))",
          minHeight: 242,
          padding: 18,
          position: "relative",
          textAlign: "center",
          width: 340,
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 12,
            justifyContent: "space-between",
          }}
        >
          <strong
            style={{
              fontSize: 16,
              lineHeight: 1.2,
              overflow: "hidden",
              textAlign: "left",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {pumpPopup.name}
          </strong>
          <button
            type="button"
            aria-label="Close popup"
            onClick={(event) => {
              event.stopPropagation();
              closePumpPopup();
            }}
            style={{
              alignItems: "center",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              color: "#475569",
              cursor: "pointer",
              display: "inline-flex",
              flex: "0 0 auto",
              fontSize: 20,
              height: 34,
              justifyContent: "center",
              lineHeight: 1,
              padding: 0,
              width: 34,
            }}
          >
            x
          </button>
        </div>

        <div
          style={{
            alignItems: "center",
            display: "flex",
            height: 118,
            justifyContent: "center",
            marginTop: 14,
          }}
        >
          <PopUpPump
            pumpColor={pumpColor}
            style={{
              display: "block",
              height: 108,
              maxWidth: "100%",
              width: 152,
            }}
          />
        </div>

        <div
          style={{
            color: "#475569",
            fontSize: 12,
            fontWeight: 700,
            marginTop: 4,
          }}
        >
          {`Status: ${pumpStateLabel}`}
        </div>

        {canControl ? (
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              marginTop: 14,
            }}
          >
            <button
              type="button"
              disabled={actionPending}
              onClick={handleStartPump}
              style={{
                background: "#16a34a",
                border: "1px solid #15803d",
                borderRadius: 7,
                color: "#ffffff",
                cursor: actionPending ? "wait" : "pointer",
                fontSize: 13,
                fontWeight: 700,
                height: 34,
                minWidth: 94,
                opacity: actionPending ? 0.65 : 1,
              }}
            >
              Start
            </button>
            <button
              type="button"
              disabled={actionPending}
              onClick={handleStopPump}
              style={{
                background: "#dc2626",
                border: "1px solid #b91c1c",
                borderRadius: 7,
                color: "#ffffff",
                cursor: actionPending ? "wait" : "pointer",
                fontSize: 13,
                fontWeight: 700,
                height: 34,
                minWidth: 94,
                opacity: actionPending ? 0.65 : 1,
              }}
            >
              Stop
            </button>
          </div>
        ) : null}

        {actionError ? (
          <div
            role="alert"
            style={{
              color: "#b91c1c",
              fontSize: 12,
              marginTop: 10,
            }}
          >
            {actionError}
          </div>
        ) : null}

        {pendingPumpAction ? (
          <div
            role="alertdialog"
            aria-label="Confirm pump action"
            style={{
              alignItems: "center",
              background: "rgba(15, 23, 42, 0.18)",
              borderRadius: 12,
              display: "flex",
              inset: 0,
              justifyContent: "center",
              padding: 14,
              position: "absolute",
              zIndex: 2,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                boxShadow: "0 18px 34px rgba(15, 23, 42, 0.2)",
                padding: "12px 14px",
                width: "100%",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.35,
                  textAlign: "center",
                }}
              >
                {`Do you want to ${
                  pendingPumpAction === "partir" ? "start" : "stop"
                } pump ${pumpPopup.name}?`}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "center",
                  marginTop: 10,
                }}
              >
                <button
                  type="button"
                  disabled={actionPending}
                  onClick={confirmPumpAction}
                  style={{
                    background: "#0f766e",
                    border: "1px solid #0f766e",
                    borderRadius: 6,
                    color: "#ffffff",
                    cursor: actionPending ? "wait" : "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    height: 28,
                    minWidth: 64,
                  }}
                >
                  {actionPending ? "Sending..." : "Yes"}
                </button>
                <button
                  type="button"
                  disabled={actionPending}
                  onClick={cancelPumpAction}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    color: "#334155",
                    cursor: actionPending ? "wait" : "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    height: 28,
                    minWidth: 64,
                  }}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>,
    document.body,
  );
}

function DosifPopup({
  dosifPopup,
  canControl,
  onClose,
  onWriteNumericControl,
}) {
  const control = dosifPopup.control;
  const currentValue =
    control?.value === null || control?.value === undefined
      ? Number.NaN
      : Number(control.value);
  const [draftValue, setDraftValue] = React.useState(
    Number.isFinite(currentValue) ? String(currentValue) : "",
  );
  const [writePending, setWritePending] = React.useState(false);
  const [writeError, setWriteError] = React.useState(null);
  const [writeSuccess, setWriteSuccess] = React.useState(null);
  const [pendingValue, setPendingValue] = React.useState(null);

  if (typeof document === "undefined") return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!control || writePending) return;

    const numericValue = Number(draftValue);
    if (!Number.isFinite(numericValue)) {
      setWriteError("Enter a valid number.");
      return;
    }
    if (control.min !== null && numericValue < control.min) {
      setWriteError(`The minimum value is ${control.min}.`);
      return;
    }
    if (control.max !== null && numericValue > control.max) {
      setWriteError(`The maximum value is ${control.max}.`);
      return;
    }

    setWriteError(null);
    setWriteSuccess(null);
    setPendingValue(numericValue);
  };

  const confirmValueChange = async (event) => {
    event.stopPropagation();
    if (!control || pendingValue === null || writePending) return;

    setWritePending(true);
    setWriteError(null);
    setWriteSuccess(null);
    try {
      await onWriteNumericControl(
        control.module_id,
        control.command_id,
        pendingValue,
      );
      setWriteSuccess(`Value ${pendingValue} was sent to the PLC.`);
      setPendingValue(null);
    } catch (error) {
      setPendingValue(null);
      setWriteError(
        error instanceof Error
          ? error.message
          : "The value could not be written to the PLC.",
      );
    } finally {
      setWritePending(false);
    }
  };

  const cancelValueChange = (event) => {
    event.stopPropagation();
    if (writePending) return;
    setPendingValue(null);
  };

  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      style={{
        alignItems: "center",
        backdropFilter: "blur(5px)",
        background: "rgba(15, 23, 42, 0.34)",
        display: "flex",
        inset: 0,
        justifyContent: "center",
        padding: 20,
        position: "fixed",
        zIndex: 10001,
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Popup ${dosifPopup.name}`}
        onClick={(event) => event.stopPropagation()}
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 12,
          boxShadow: "0 30px 70px rgba(15, 23, 42, 0.3)",
          color: "#0f172a",
          fontFamily: "Calibri, Arial, sans-serif",
          maxWidth: "min(360px, calc(100vw - 32px))",
          padding: 18,
          position: "relative",
          textAlign: "center",
          width: 340,
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <strong style={{ fontSize: 16 }}>{dosifPopup.name}</strong>
          <button
            type="button"
            aria-label="Close popup"
            onClick={onClose}
            style={{
              alignItems: "center",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              color: "#475569",
              cursor: "pointer",
              display: "inline-flex",
              flex: "0 0 auto",
              fontSize: 20,
              height: 34,
              justifyContent: "center",
              lineHeight: 1,
              padding: 0,
              width: 34,
            }}
          >
            x
          </button>
        </div>
        {control ? (
          <form onSubmit={handleSubmit}>
            <div
              style={{
                color: "#475569",
                fontSize: 12,
                marginTop: 18,
                textAlign: "left",
              }}
            >
              {control.label}
              {control.unit ? ` (${control.unit})` : ""}
            </div>
            <input
              type="number"
              aria-label={`${control.label} value`}
              value={draftValue}
              min={control.min ?? undefined}
              max={control.max ?? undefined}
              step={control.step}
              disabled={!canControl || writePending}
              onChange={(event) => {
                setDraftValue(event.target.value);
                setWriteError(null);
                setWriteSuccess(null);
              }}
              style={{
                background: canControl ? "#ffffff" : "#f1f5f9",
                border: "1px solid #94a3b8",
                borderRadius: 8,
                boxSizing: "border-box",
                color: "#0f172a",
                fontSize: 16,
                height: 42,
                marginTop: 7,
                padding: "0 12px",
                width: "100%",
              }}
            />
            <div
              style={{
                color: "#64748b",
                fontSize: 11,
                marginTop: 6,
                textAlign: "left",
              }}
            >
              {`Range: ${control.min ?? "-"} to ${control.max ?? "-"}`}
            </div>
            {canControl ? (
              <button
                type="submit"
                disabled={writePending || draftValue.trim() === ""}
                style={{
                  background: "#0f766e",
                  border: "1px solid #0f766e",
                  borderRadius: 7,
                  color: "#ffffff",
                  cursor: writePending ? "wait" : "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  height: 36,
                  marginTop: 14,
                  opacity: writePending ? 0.65 : 1,
                  width: "100%",
                }}
              >
                {writePending ? "Sending..." : "Save to PLC"}
              </button>
            ) : (
              <div
                style={{
                  color: "#64748b",
                  fontSize: 12,
                  marginTop: 14,
                }}
              >
                Your user has read-only access.
              </div>
            )}
            {writeError ? (
              <div
                role="alert"
                style={{ color: "#b91c1c", fontSize: 12, marginTop: 10 }}
              >
                {writeError}
              </div>
            ) : null}
            {writeSuccess ? (
              <div
                role="status"
                style={{ color: "#15803d", fontSize: 12, marginTop: 10 }}
              >
                {writeSuccess}
              </div>
            ) : null}
            {pendingValue !== null ? (
              <div
                role="alertdialog"
                aria-label="Confirm value change"
                style={{
                  alignItems: "center",
                  background: "rgba(15, 23, 42, 0.18)",
                  borderRadius: 12,
                  display: "flex",
                  inset: 0,
                  justifyContent: "center",
                  padding: 14,
                  position: "absolute",
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    boxShadow: "0 18px 34px rgba(15, 23, 42, 0.2)",
                    padding: "12px 14px",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.35,
                      textAlign: "center",
                    }}
                  >
                    {`Do you want to change ${dosifPopup.name} from ${
                      Number.isFinite(currentValue) ? currentValue : "--"
                    } to ${pendingValue}?`}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "center",
                      marginTop: 10,
                    }}
                  >
                    <button
                      type="button"
                      disabled={writePending}
                      onClick={confirmValueChange}
                      style={{
                        background: "#0f766e",
                        border: "1px solid #0f766e",
                        borderRadius: 6,
                        color: "#ffffff",
                        cursor: writePending ? "wait" : "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        height: 28,
                        minWidth: 64,
                      }}
                    >
                      {writePending ? "Sending..." : "Yes"}
                    </button>
                    <button
                      type="button"
                      disabled={writePending}
                      onClick={cancelValueChange}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: 6,
                        color: "#334155",
                        cursor: writePending ? "wait" : "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        height: 28,
                        minWidth: 64,
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </form>
        ) : (
          <p
            style={{
              color: "#475569",
              fontSize: 13,
              lineHeight: 1.45,
              margin: "18px 0 0",
            }}
          >
            This equipment does not have a configured numeric control.
          </p>
        )}
      </section>
    </div>,
    document.body,
  );
}

const SVGComponent = ({
  onClick,
  level = null,
  simulateLevel = true,
  simulationInterval = 1200,
  canControl = true,
  pumpStateColor = FALLBACK_PUMP_COLOR,
  pumpStateLabel = "No data",
  numericControls = [],
  onStartPump = defaultPumpControlHandler,
  onStopPump = defaultPumpControlHandler,
  onWriteNumericControl = defaultNumericControlHandler,
  ...props
}) => {
  const hasExternalLevel = level !== null && level !== undefined && level !== "";
  const externalLevel = hasExternalLevel ? clampTankLevel(level) : null;
  const [simulatedLevel, setSimulatedLevel] = React.useState(0);
  const tankLevel = externalLevel ?? (simulateLevel ? simulatedLevel : 0);
  const [pumpPopup, setPumpPopup] = React.useState(null);
  const [pendingPumpAction, setPendingPumpAction] = React.useState(null);
  const [pumpActionPending, setPumpActionPending] = React.useState(false);
  const [pumpActionError, setPumpActionError] = React.useState(null);
  const [dosifPopup, setDosifPopup] = React.useState(null);

  React.useEffect(() => {
    if (!simulateLevel || externalLevel !== null) return undefined;

    let simulationIndex = 0;
    const interval = Math.max(500, Number(simulationInterval) || 1200);
    const timer = window.setInterval(() => {
      simulationIndex = (simulationIndex + 1) % TANK_LEVEL_SIMULATION.length;
      setSimulatedLevel(TANK_LEVEL_SIMULATION[simulationIndex]);
    }, interval);

    return () => window.clearInterval(timer);
  }, [externalLevel, simulateLevel, simulationInterval]);

  const closePumpPopup = React.useCallback(() => {
    setPumpPopup(null);
    setPendingPumpAction(null);
    setPumpActionPending(false);
    setPumpActionError(null);
  }, []);

  const closeDosifPopup = React.useCallback(() => {
    setDosifPopup(null);
  }, []);

  const handleSvgClick = React.useCallback(
    (event) => {
      onClick?.(event);
      closePumpPopup();
    },
    [closePumpPopup, onClick],
  );

  const openPumpPopup = React.useCallback((event) => {
    event.stopPropagation();
    const pumpRoot = event.currentTarget.closest(`#${SMALL_PUMP_ID}`) ?? event.currentTarget;
    setDosifPopup(null);
    setPumpPopup({
      id: SMALL_PUMP_ID,
      name: SMALL_PUMP_NAME,
      color: pumpStateColor || readPumpCircleColor(pumpRoot),
    });
    setPendingPumpAction(null);
    setPumpActionError(null);
  }, [pumpStateColor]);

  const handlePumpKeyDown = React.useCallback(
    (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      openPumpPopup(event);
    },
    [openPumpPopup],
  );

  const openDosifPopup = React.useCallback(
    (id, name) => (event) => {
      event.stopPropagation();
      closePumpPopup();
      setDosifPopup({
        id,
        name,
        control: numericControls.find((control) => control.id === id) ?? null,
      });
    },
    [closePumpPopup, numericControls],
  );

  const handleDosifKeyDown = React.useCallback(
    (id, name) => (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      openDosifPopup(id, name)(event);
    },
    [openDosifPopup],
  );

  const handlePopupClick = React.useCallback((event) => {
    event.stopPropagation();
  }, []);

  const handleStartPump = React.useCallback(
    (event) => {
      event.stopPropagation();
      if (!pumpPopup) return;
      setPumpActionError(null);
      setPendingPumpAction("partir");
    },
    [pumpPopup],
  );

  const handleStopPump = React.useCallback(
    (event) => {
      event.stopPropagation();
      if (!pumpPopup) return;
      setPumpActionError(null);
      setPendingPumpAction("parar");
    },
    [pumpPopup],
  );

  const confirmPumpAction = React.useCallback(
    async (event) => {
      event.stopPropagation();
      if (!pumpPopup || !pendingPumpAction || pumpActionPending) return;

      setPumpActionPending(true);
      setPumpActionError(null);
      try {
        if (pendingPumpAction === "partir") {
          await onStartPump(pumpPopup.id);
        } else {
          await onStopPump(pumpPopup.id);
        }
        setPendingPumpAction(null);
      } catch (error) {
        setPendingPumpAction(null);
        setPumpActionError(
          error instanceof Error ? error.message : "The command could not be sent.",
        );
      } finally {
        setPumpActionPending(false);
      }
    },
    [
      onStartPump,
      onStopPump,
      pendingPumpAction,
      pumpActionPending,
      pumpPopup,
    ],
  );

  const cancelPumpAction = React.useCallback(
    (event) => {
      event.stopPropagation();
      setPendingPumpAction(null);
    },
    [],
  );

  return (
    <>
      <svg
    id="Capa_1"
    x="0px"
    y="0px"
    viewBox="0 0 1393.0437 1000"
    xmlSpace="preserve"
    width={1393.0437}
    height={1000}
    sodipodi:docname="small_layout1.svg"
    inkscape:version="1.4.2 (f4327f4, 2025-05-13)"
    xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
    xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:svg="http://www.w3.org/2000/svg"
    {...props}
    onClick={handleSvgClick}
  >
    <sodipodi:namedview
      id="namedview1"
      pagecolor="#ffffff"
      bordercolor="#000000"
      borderopacity={0.25}
      inkscape:showpageshadow={2}
      inkscape:pageopacity={0}
      inkscape:pagecheckerboard={0}
      inkscape:deskcolor="#d1d1d1"
      inkscape:zoom={0.5}
      inkscape:cx={654}
      inkscape:cy={587}
      inkscape:window-width={1920}
      inkscape:window-height={1009}
      inkscape:window-x={-8}
      inkscape:window-y={-8}
      inkscape:window-maximized={1}
      inkscape:current-layer="g21"
      showgrid="true"
      showguides="false"
      inkscape:antialias-rendering="true"
      showborder="true"
      inkscape:lockguides="false"
    >
      <inkscape:grid
        id="grid1"
        units="px"
        originx={0}
        originy={0}
        spacingx={1}
        spacingy={1}
        empcolor="#0099e5"
        empopacity={0.30196078}
        color="#0099e5"
        opacity={0.14902}
        empspacing={5}
        enabled="true"
        visible="true"
      />
    </sodipodi:namedview>
    <defs id="defs489">
      <rect x={307.20475} y={928} width={127.79525} height={52} id="rect9" />
      <linearGradient id="swatch62" inkscape:swatch="solid">
        <stop
          style={{
            stopColor: "#929292",
            stopOpacity: 1,
          }}
          offset={0}
          id="stop62"
        />
      </linearGradient>
      <linearGradient id="swatch12" inkscape:swatch="solid">
        <stop
          style={{
            stopColor: "#11063d",
            stopOpacity: 1,
          }}
          offset={0}
          id="stop12"
        />
      </linearGradient>
      <inkscape:path-effect
        effect="fillet_chamfer"
        id="path-effect13"
        is_visible="true"
        lpeversion={1}
        nodesatellites_param="F,0,0,1,0,18.239822,0,1 @ F,0,0,1,0,18.239822,0,1 @ F,0,0,1,0,18.239822,0,1 @ F,0,0,1,0,18.239822,0,1"
        radius={0}
        unit="px"
        method="auto"
        mode="F"
        chamfer_steps={1}
        flexible="false"
        use_knot_distance="true"
        apply_no_radius="true"
        apply_with_radius="true"
        only_selected="false"
        hide_knots="false"
      />
      <rect
        x={1134.4766}
        y={31.500916}
        width={230.26724}
        height={31.500916}
        id="rect2"
      />
      <linearGradient id="swatch49" inkscape:swatch="solid">
        <stop
          style={{
            stopColor: "#000000",
            stopOpacity: 1,
          }}
          offset={0}
          id="stop49"
        />
      </linearGradient>
      <linearGradient id="linearGradient26-2" inkscape:swatch="gradient">
        <stop
          style={{
            stopColor: "#000000",
            stopOpacity: 0.88195992,
          }}
          offset={0}
          id="stop40"
        />
        <stop
          style={{
            stopColor: "#000000",
            stopOpacity: 0,
          }}
          offset={1}
          id="stop41"
        />
      </linearGradient>
      <linearGradient id="linearGradient26-1" inkscape:swatch="gradient">
        <stop
          style={{
            stopColor: "#000000",
            stopOpacity: 0.88195992,
          }}
          offset={0}
          id="stop38"
        />
        <stop
          style={{
            stopColor: "#000000",
            stopOpacity: 0,
          }}
          offset={1}
          id="stop39"
        />
      </linearGradient>
      <linearGradient id="linearGradient26" inkscape:swatch="gradient">
        <stop
          style={{
            stopColor: "#000000",
            stopOpacity: 0.88195992,
          }}
          offset={0}
          id="stop36"
        />
        <stop
          style={{
            stopColor: "#000000",
            stopOpacity: 0,
          }}
          offset={1}
          id="stop37"
        />
      </linearGradient>
      <linearGradient id="swatch35" inkscape:swatch="solid">
        <stop
          style={{
            stopColor: "#5d8a54",
            stopOpacity: 1,
          }}
          offset={0}
          id="stop35"
        />
      </linearGradient>
      <linearGradient id="linearGradient26-3" inkscape:swatch="gradient">
        <stop
          style={{
            stopColor: "#000000",
            stopOpacity: 0.88195992,
          }}
          offset={0}
          id="stop24"
        />
        <stop
          style={{
            stopColor: "#000000",
            stopOpacity: 0,
          }}
          offset={1}
          id="stop26"
        />
      </linearGradient>
      <inkscape:path-effect
        effect="bspline"
        id="path-effect15"
        is_visible="true"
        lpeversion={1.3}
        weight={33.333333}
        steps={2}
        helper_size={0}
        apply_no_weight="true"
        apply_with_weight="true"
        only_selected="false"
        uniform="false"
      />
      <inkscape:path-effect
        effect="bspline"
        id="path-effect14"
        is_visible="true"
        lpeversion={1.3}
        weight={33.333333}
        steps={2}
        helper_size={0}
        apply_no_weight="true"
        apply_with_weight="true"
        only_selected="false"
        uniform="false"
      />
      <inkscape:path-effect
        effect="bspline"
        id="path-effect7"
        is_visible="true"
        lpeversion={1.3}
        weight={33.333333}
        steps={2}
        helper_size={0}
        apply_no_weight="true"
        apply_with_weight="true"
        only_selected="false"
        uniform="false"
      />
      <inkscape:path-effect
        effect="bspline"
        id="path-effect6"
        is_visible="true"
        lpeversion={1.3}
        weight={33.333333}
        steps={2}
        helper_size={0}
        apply_no_weight="true"
        apply_with_weight="true"
        only_selected="false"
        uniform="false"
      />
      <inkscape:path-effect
        effect="bspline"
        id="path-effect4"
        is_visible="true"
        lpeversion={1.3}
        weight={33.333333}
        steps={2}
        helper_size={0}
        apply_no_weight="true"
        apply_with_weight="true"
        only_selected="false"
        uniform="false"
      />
      <rect
        x={322.32266}
        y={656.74786}
        width={49.6451}
        height={24.452065}
        id="rect47"
      />
      <rect
        x={601.66895}
        y={165.48366}
        width={257.36414}
        height={39.518486}
        id="rect39"
      />
      <rect
        x={523.12598}
        y={339.85898}
        width={100.27816}
        height={22.229149}
        id="rect38"
      />
      <rect
        x={241.01518}
        y={625.94092}
        width={113.17235}
        height={22.355032}
        id="rect36"
      />
      <rect
        x={141.81474}
        y={523.94604}
        width={60.777744}
        height={21.656437}
        id="rect35"
      />
      <rect
        x={28.642385}
        y={656.67908}
        width={76.845421}
        height={20.957844}
        id="rect34"
      />
      <rect
        x={653.8847}
        y={527.43903}
        width={107.58359}
        height={39.121307}
        id="rect31"
      />
      <linearGradient id="swatch25">
        <stop
          style={{
            stopColor: "#020907",
            stopOpacity: 1,
          }}
          offset={0}
          id="stop25"
        />
      </linearGradient>
      <rect
        x={669.95239}
        y={522.54889}
        width={69.160881}
        height={27.94379}
        id="rect20"
      />
      <rect
        x={655.28186}
        y={521.85028}
        width={96.406075}
        height={27.94379}
        id="rect18"
      />
      <rect
        x={836.9165}
        y={520.45306}
        width={101.29624}
        height={32.135361}
        id="rect17"
      />
      <rect
        x={322.32266}
        y={656.74786}
        width={49.6451}
        height={24.452065}
        id="rect47-6"
      />
      <rect
        x={322.32266}
        y={656.74786}
        width={49.6451}
        height={24.452065}
        id="rect47-67"
      />
      <rect
        x={322.32266}
        y={656.74786}
        width={49.6451}
        height={24.452065}
        id="rect47-1"
      />
      <rect
        x={322.32266}
        y={656.74786}
        width={49.6451}
        height={24.452065}
        id="rect47-67-2"
      />
      <rect
        x={322.32266}
        y={656.74786}
        width={49.6451}
        height={24.452065}
        id="rect47-67-1"
      />
      <rect
        x={322.32266}
        y={656.74786}
        width={49.6451}
        height={24.452065}
        id="rect47-6-9"
      />
      <rect
        x={322.32266}
        y={656.74786}
        width={49.6451}
        height={24.452065}
        id="rect47-5"
      />
      <linearGradient
        xlinkHref="#linearGradient13"
        id="linearGradient16"
        gradientUnits="userSpaceOnUse"
        gradientTransform="matrix(0.98512187,0,0,1.000351,-1208.0367,-43.738231)"
        x1={1291.6862}
        y1={314.18967}
        x2={1278.1874}
        y2={302.11124}
      />
      <linearGradient id="linearGradient13">
        <stop
          style={{
            stopColor: "#160a0a",
            stopOpacity: 0.232346,
          }}
          offset={0}
          id="stop13"
        />
        <stop
          style={{
            stopColor: "#140c0c",
            stopOpacity: 0,
          }}
          offset={1}
          id="stop14"
        />
      </linearGradient>
      <linearGradient
        xlinkHref="#linearGradient13"
        id="linearGradient16-8"
        gradientUnits="userSpaceOnUse"
        gradientTransform="matrix(1.4032878,0,0,1.0332772,-651.20797,-854.40745)"
        x1={1291.6862}
        y1={314.18967}
        x2={1278.1874}
        y2={302.11124}
      />
      <linearGradient
        xlinkHref="#linearGradient13"
        id="linearGradient1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="matrix(1.4032878,0,0,1.0332772,-500.97842,-853.21253)"
        x1={1291.6862}
        y1={314.18967}
        x2={1278.1874}
        y2={302.11124}
      />
      <rect
        x={523.12598}
        y={339.85898}
        width={100.27816}
        height={22.229149}
        id="rect38-8"
      />
      <rect
        x={523.12598}
        y={339.85898}
        width={100.27816}
        height={22.229149}
        id="rect38-8-0"
      />
      <rect
        x={523.12598}
        y={339.85898}
        width={100.27816}
        height={22.229149}
        id="rect38-8-0-5"
      />
      <rect
        x={653.8847}
        y={527.43903}
        width={107.58359}
        height={39.121307}
        id="rect31-6"
      />
      <rect
        x={653.8847}
        y={527.43903}
        width={107.58359}
        height={39.121307}
        id="rect31-6-7"
      />
      <linearGradient
        inkscape:collect="always"
        xlinkHref="#swatch12"
        id="linearGradient12"
        x1={1090.585}
        y1={95.015755}
        x2={1353.8693}
        y2={95.015755}
        gradientUnits="userSpaceOnUse"
      />
      <linearGradient
        id="linearGradient246"
        x1={-0.41933534}
        y1={0.22768055}
        x2={0.41933534}
        y2={0.77231961}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop244" />
        <stop
          offset={0.5}
          stopColor="#d9d9d9"
          id="stop245"
          style={{
            stopColor: "#d3d9d9",
            stopOpacity: 1,
          }}
        />
        <stop offset="100%" stopColor="#b9b9b9" id="stop246" />
      </linearGradient>
      <linearGradient
        id="linearGradient243"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop241" />
        <stop offset="50%" stopColor="#d9d9d9" id="stop242" />
        <stop offset={0.8429268} stopColor="#b9b9b9" id="stop243" />
      </linearGradient>
      <linearGradient
        id="linearGradient240"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop238" />
        <stop offset="50%" stopColor="#d9d9d9" id="stop239" />
        <stop offset={0.87707317} stopColor="#b9b9b9" id="stop240" />
      </linearGradient>
      <linearGradient
        id="linearGradient237"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop235" />
        <stop offset="50%" stopColor="#d9d9d9" id="stop236" />
        <stop offset={0.93268293} stopColor="#b9b9b9" id="stop237" />
      </linearGradient>
      <linearGradient
        id="linearGradient234"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop232" />
        <stop offset="50%" stopColor="#d9d9d9" id="stop233" />
        <stop offset={0.97560978} stopColor="#b9b9b9" id="stop234" />
      </linearGradient>
      <linearGradient
        id="linearGradient231"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop229" />
        <stop offset="50%" stopColor="#d9d9d9" id="stop230" />
        <stop offset={0.99512196} stopColor="#b9b9b9" id="stop231" />
      </linearGradient>
      <linearGradient
        id="linearGradient228"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop226" />
        <stop offset={0.37121952} stopColor="#d9d9d9" id="stop227" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop228" />
      </linearGradient>
      <linearGradient
        id="linearGradient225"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop223" />
        <stop offset={0.37609756} stopColor="#d9d9d9" id="stop224" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop225" />
      </linearGradient>
      <linearGradient
        id="linearGradient222"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop220" />
        <stop offset={0.38878047} stopColor="#d9d9d9" id="stop221" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop222" />
      </linearGradient>
      <linearGradient
        id="linearGradient219"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop217" />
        <stop offset={0.39853659} stopColor="#d9d9d9" id="stop218" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop219" />
      </linearGradient>
      <linearGradient
        id="linearGradient216"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop214" />
        <stop offset={0.3995122} stopColor="#d9d9d9" id="stop215" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop216" />
      </linearGradient>
      <linearGradient
        id="linearGradient213"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop211" />
        <stop offset={0.40146342} stopColor="#d9d9d9" id="stop212" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop213" />
      </linearGradient>
      <linearGradient
        id="linearGradient210"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop208" />
        <stop offset={0.45219511} stopColor="#d9d9d9" id="stop209" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop210" />
      </linearGradient>
      <linearGradient
        id="linearGradient207"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop205" />
        <stop offset={0.49609756} stopColor="#d9d9d9" id="stop206" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop207" />
      </linearGradient>
      <linearGradient
        id="linearGradient204"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop202" />
        <stop
          offset={0.5}
          stopColor="#d9d9d9"
          id="stop203"
          style={{
            stopColor: "#d9d934",
            stopOpacity: 1,
          }}
        />
        <stop offset="100%" stopColor="#b9b9b9" id="stop204" />
      </linearGradient>
      <linearGradient
        id="linearGradient198"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop196" />
        <stop
          offset={0.5}
          stopColor="#d9d9d9"
          id="stop197"
          style={{
            stopColor: "#d9d984",
            stopOpacity: 1,
          }}
        />
        <stop offset="100%" stopColor="#b9b9b9" id="stop198" />
      </linearGradient>
      <linearGradient
        id="linearGradient195"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop193" />
        <stop
          offset={0.5}
          stopColor="#d9d9d9"
          id="stop194"
          style={{
            stopColor: "#d9d988",
            stopOpacity: 1,
          }}
        />
        <stop offset="100%" stopColor="#b9b9b9" id="stop195" />
      </linearGradient>
      <linearGradient
        id="linearGradient192"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop190" />
        <stop
          offset={0.5}
          stopColor="#d9d9d9"
          id="stop191"
          style={{
            stopColor: "#d9d991",
            stopOpacity: 1,
          }}
        />
        <stop offset="100%" stopColor="#b9b9b9" id="stop192" />
      </linearGradient>
      <linearGradient
        id="linearGradient186"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop184" />
        <stop
          offset={0.5}
          stopColor="#d9d9d9"
          id="stop185"
          style={{
            stopColor: "#d9d9c3",
            stopOpacity: 1,
          }}
        />
        <stop offset="100%" stopColor="#b9b9b9" id="stop186" />
      </linearGradient>
      <linearGradient
        id="linearGradient183"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop181" />
        <stop
          offset={0.5}
          stopColor="#d9d9d9"
          id="stop182"
          style={{
            stopColor: "#d9d9c7",
            stopOpacity: 1,
          }}
        />
        <stop offset="100%" stopColor="#b9b9b9" id="stop183" />
      </linearGradient>
      <linearGradient
        id="linearGradient180"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop178" />
        <stop
          offset={0.5}
          stopColor="#d9d9d9"
          id="stop179"
          style={{
            stopColor: "#d9d9d2",
            stopOpacity: 1,
          }}
        />
        <stop offset="100%" stopColor="#b9b9b9" id="stop180" />
      </linearGradient>
      <linearGradient
        id="linearGradient177"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop175" />
        <stop
          offset={0.5}
          stopColor="#d9d9d9"
          id="stop176"
          style={{
            stopColor: "#d9d9d6",
            stopOpacity: 1,
          }}
        />
        <stop offset="100%" stopColor="#b9b9b9" id="stop177" />
      </linearGradient>
      <linearGradient
        id="linearGradient171"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop169"
          style={{
            stopColor: "#efef99",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop170" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop171" />
      </linearGradient>
      <linearGradient
        id="linearGradient168"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop166"
          style={{
            stopColor: "#efef9a",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop167" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop168" />
      </linearGradient>
      <linearGradient
        id="linearGradient165"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop163"
          style={{
            stopColor: "#efefa2",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop164" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop165" />
      </linearGradient>
      <linearGradient
        id="linearGradient162"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop160"
          style={{
            stopColor: "#efefac",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop161" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop162" />
      </linearGradient>
      <linearGradient
        id="linearGradient159"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop157"
          style={{
            stopColor: "#efefbd",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop158" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop159" />
      </linearGradient>
      <linearGradient
        id="linearGradient156"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop154"
          style={{
            stopColor: "#efefd1",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop155" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop156" />
      </linearGradient>
      <linearGradient
        id="linearGradient153"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop151"
          style={{
            stopColor: "#efefe7",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop152" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop153" />
      </linearGradient>
      <linearGradient
        id="linearGradient150"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop148"
          style={{
            stopColor: "#efefee",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop149" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop150" />
      </linearGradient>
      <linearGradient
        id="linearGradient147"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop145"
          style={{
            stopColor: "#efefef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop146" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop147" />
      </linearGradient>
      <linearGradient
        id="linearGradient144"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop142"
          style={{
            stopColor: "#efef1e",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop143" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop144" />
      </linearGradient>
      <linearGradient
        id="linearGradient141"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop139" />
        <stop
          offset={0.5}
          stopColor="#d9d9d9"
          id="stop140"
          style={{
            stopColor: "#d9d959",
            stopOpacity: 1,
          }}
        />
        <stop offset="100%" stopColor="#b9b9b9" id="stop141" />
      </linearGradient>
      <linearGradient
        id="linearGradient138"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop136" />
        <stop
          offset={0.5}
          stopColor="#d9d9d9"
          id="stop137"
          style={{
            stopColor: "#d972d9",
            stopOpacity: 1,
          }}
        />
        <stop offset="100%" stopColor="#b9b9b9" id="stop138" />
      </linearGradient>
      <linearGradient
        id="linearGradient135"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop133" />
        <stop
          offset={0.5}
          stopColor="#d9d9d9"
          id="stop134"
          style={{
            stopColor: "#d975d9",
            stopOpacity: 1,
          }}
        />
        <stop offset="100%" stopColor="#b9b9b9" id="stop135" />
      </linearGradient>
      <linearGradient
        id="linearGradient132"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop130" />
        <stop
          offset={0.5}
          stopColor="#d9d9d9"
          id="stop131"
          style={{
            stopColor: "#d977d9",
            stopOpacity: 1,
          }}
        />
        <stop offset="100%" stopColor="#b9b9b9" id="stop132" />
      </linearGradient>
      <linearGradient
        id="linearGradient129"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop127"
          style={{
            stopColor: "#ccefef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop128" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop129" />
      </linearGradient>
      <linearGradient
        id="linearGradient126"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop124"
          style={{
            stopColor: "#d5efef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop125" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop126" />
      </linearGradient>
      <linearGradient
        id="linearGradient123"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop121"
          style={{
            stopColor: "#e0efef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop122" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop123" />
      </linearGradient>
      <linearGradient
        id="linearGradient120"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop118"
          style={{
            stopColor: "#e6efef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop119" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop120" />
      </linearGradient>
      <linearGradient
        id="linearGradient117"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop115"
          style={{
            stopColor: "#ebefef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop116" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop117" />
      </linearGradient>
      <linearGradient
        id="linearGradient111"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop109"
          style={{
            stopColor: "#f1efef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop110" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop111" />
      </linearGradient>
      <linearGradient
        id="linearGradient105"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop103"
          style={{
            stopColor: "#e3efef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop104" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop105" />
      </linearGradient>
      <linearGradient
        id="linearGradient102"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop100"
          style={{
            stopColor: "#e2efef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop101" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop102" />
      </linearGradient>
      <linearGradient
        id="linearGradient99"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop97"
          style={{
            stopColor: "#caefef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop98" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop99" />
      </linearGradient>
      <linearGradient
        id="linearGradient96"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop94"
          style={{
            stopColor: "#95efef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop95" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop96" />
      </linearGradient>
      <linearGradient
        id="linearGradient93"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop91"
          style={{
            stopColor: "#72efef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop92" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop93" />
      </linearGradient>
      <linearGradient
        id="linearGradient90"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop88"
          style={{
            stopColor: "#67efef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop89" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop90" />
      </linearGradient>
      <linearGradient
        id="linearGradient87"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop85"
          style={{
            stopColor: "#66efef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop86" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop87" />
      </linearGradient>
      <linearGradient
        id="linearGradient84"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop82"
          style={{
            stopColor: "#60efef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop83" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop84" />
      </linearGradient>
      <linearGradient
        id="linearGradient81"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop79"
          style={{
            stopColor: "#65efef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop80" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop81" />
      </linearGradient>
      <linearGradient
        id="linearGradient78"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop76"
          style={{
            stopColor: "#6befef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop77" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop78" />
      </linearGradient>
      <linearGradient
        id="linearGradient75"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop73"
          style={{
            stopColor: "#70efef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop74" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop75" />
      </linearGradient>
      <linearGradient
        id="linearGradient72"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop70"
          style={{
            stopColor: "#74efef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop71" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop72" />
      </linearGradient>
      <linearGradient
        id="linearGradient66"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop64"
          style={{
            stopColor: "#6cefef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop65" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop66" />
      </linearGradient>
      <linearGradient
        id="linearGradient57"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop55"
          style={{
            stopColor: "#5fefef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop56" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop57" />
      </linearGradient>
      <linearGradient
        id="linearGradient54"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop52"
          style={{
            stopColor: "#5cefef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop53" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop54" />
      </linearGradient>
      <linearGradient
        id="linearGradient51"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop49-5"
          style={{
            stopColor: "#5befef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop50" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop51" />
      </linearGradient>
      <linearGradient
        id="linearGradient48"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop46"
          style={{
            stopColor: "#5aefef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop47" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop48" />
      </linearGradient>
      <linearGradient
        id="linearGradient42"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop40-1"
          style={{
            stopColor: "#54efef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop41-7" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop42" />
      </linearGradient>
      <linearGradient
        id="linearGradient39"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop37-1"
          style={{
            stopColor: "#4eefef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop38-1" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop39-5" />
      </linearGradient>
      <linearGradient
        id="linearGradient36"
        x1={0}
        y1={0}
        x2={0}
        y2={1}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop
          offset={0}
          stopColor="#efefef"
          id="stop34"
          style={{
            stopColor: "#45efef",
            stopOpacity: 1,
          }}
        />
        <stop offset="50%" stopColor="#d9d9d9" id="stop35-2" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop36-7" />
      </linearGradient>
      <linearGradient
        id="metalMain"
        x1={-0.41933534}
        y1={0.22768055}
        x2={0.41933534}
        y2={0.77231961}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
      >
        <stop offset="0%" stopColor="#efefef" id="stop1" />
        <stop offset="50%" stopColor="#d9d9d9" id="stop2" />
        <stop offset="100%" stopColor="#b9b9b9" id="stop3" />
      </linearGradient>
      <linearGradient id="metalDark" x1={0} y1={0} x2={0} y2={1}>
        <stop offset="0%" stopColor="#d0d0d0" id="stop4" />
        <stop offset="100%" stopColor="#9f9f9f" id="stop5" />
      </linearGradient>
      <filter
        id="softShadow"
        x={-0.10418149}
        y={-0.068007365}
        width={1.2083631}
        height={1.1360147}
      >
        <feDropShadow
          dx={0}
          dy={3}
          stdDeviation={3}
          floodColor="#555"
          floodOpacity={0.25}
        />
      </filter>
      <linearGradient
        id="metalDark-0"
        x1={385.80219}
        y1={278.26758}
        x2={385.80219}
        y2={522.14258}
        gradientTransform="matrix(1.2506409,0,0,0.79959006,-89.166667,180)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#d0d0d0" id="stop4-9" />
        <stop offset="100%" stopColor="#9f9f9f" id="stop5-4" />
      </linearGradient>
      <filter
        id="filter246"
        x={-0.017137345}
        y={-0.010593995}
        width={1.0342747}
        height={1.021188}
      >
        <feDropShadow
          dx={0}
          dy={3}
          stdDeviation={3}
          floodColor="#555"
          floodOpacity={0.25}
        />
        <feGaussianBlur stdDeviation={0.0055619325} id="feGaussianBlur246" />
      </filter>
      <filter
        id="softShadow-3"
        x={-0.010935787}
        y={-0.0071386392}
        width={1.0218716}
        height={1.0142773}
      >
        <feDropShadow
          dx={0}
          dy={3}
          stdDeviation={3}
          floodColor="#555"
          floodOpacity={0.25}
        />
      </filter>
      <filter
        id="softShadow-7"
        x={-0.010935787}
        y={-0.0071386392}
        width={1.0218716}
        height={1.0142773}
      >
        <feDropShadow
          dx={0}
          dy={3}
          stdDeviation={3}
          floodColor="#555"
          floodOpacity={0.25}
        />
      </filter>
      <filter
        id="softShadow-8"
        x={-0.010935787}
        y={-0.0071386392}
        width={1.0218716}
        height={1.0142773}
      >
        <feDropShadow
          dx={0}
          dy={3}
          stdDeviation={3}
          floodColor="#555"
          floodOpacity={0.25}
        />
      </filter>
      <linearGradient
        id="tankBodyGray"
        x1={32.370045}
        y1={53.631435}
        x2={32.370045}
        y2={305.5531}
        gradientTransform="matrix(0.98986117,0,0,0.61249854,21.654131,0)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#9a9a9a" id="stop1-0" />
        <stop offset="55%" stopColor="#858585" id="stop2-8" />
        <stop offset="100%" stopColor="#747474" id="stop3-7" />
      </linearGradient>
      <linearGradient id="pipeGray" x1={0} y1={0} x2={1} y2={0}>
        <stop offset="0%" stopColor="#6f6f6f" id="stop4-7" />
        <stop offset="50%" stopColor="#bdbdbd" id="stop5-8" />
        <stop offset="100%" stopColor="#6f6f6f" id="stop6" />
      </linearGradient>
      <filter
        id="softShadow-5"
        x={-0.013398468}
        y={-0.0087462217}
        width={1.0267969}
        height={1.0174924}
      >
        <feDropShadow
          dx={0}
          dy={3}
          stdDeviation={3}
          floodColor="#555"
          floodOpacity={0.25}
        />
      </filter>
      <linearGradient
        id="panelGradient"
        x1={19.825289}
        y1={15.081747}
        x2={19.825289}
        y2={199.54314}
        gradientTransform="matrix(1.1601344,0,0,0.8619691,-12.48887,7.5184446)"
        gradientUnits="userSpaceOnUse"
      >
        <stop
          offset={0.41555557}
          stopColor="#f7f7f7"
          id="stop1-9"
          style={{
            stopColor: "#929292",
            stopOpacity: 1,
          }}
        />
        <stop
          offset={1}
          stopColor="#d8d8d8"
          id="stop2-2"
          style={{
            stopColor: "#c460b8",
            stopOpacity: 1,
          }}
        />
      </linearGradient>
      <linearGradient id="metalGradient" x1={0} y1={0} x2={1} y2={0}>
        <stop offset="0%" stopColor="#bdbdbd" id="stop3-4" />
        <stop offset="50%" stopColor="#ececec" id="stop4-6" />
        <stop offset="100%" stopColor="#9c9c9c" id="stop5-1" />
      </linearGradient>
      <filter
        id="shadow"
        x={-0.024495}
        y={-0.033186775}
        width={1.04899}
        height={1.0663736}
      >
        <feDropShadow
          dx={0}
          dy={2}
          stdDeviation={2}
          floodColor="#555"
          floodOpacity={0.25}
        />
      </filter>
      <linearGradient id="panelGradient-0" x1={0} y1={0} x2={0} y2={1}>
        <stop offset="0%" stopColor="#f7f7f7" id="stop1-94" />
        <stop offset="100%" stopColor="#d8d8d8" id="stop2-88" />
      </linearGradient>
      <filter
        id="shadow-5"
        x={-0.0095238099}
        y={-0.012903226}
        width={1.0190476}
        height={1.0258065}
      >
        <feDropShadow
          dx={0}
          dy={2}
          stdDeviation={2}
          floodColor="#555"
          floodOpacity={0.25}
        />
      </filter>
      <linearGradient id="swatch1" inkscape:swatch="solid">
        <stop
          style={{
            stopColor: "#909092",
            stopOpacity: 0.54521628,
          }}
          offset={0}
          id="stop6-5"
        />
      </linearGradient>
      <linearGradient id="panelGradient-2" x1={0} y1={0} x2={0} y2={1}>
        <stop
          offset={0}
          stopColor="#f7f7f7"
          id="stop1-7"
          style={{
            stopColor: "#555555",
            stopOpacity: 1,
          }}
        />
        <stop offset="100%" stopColor="#d8d8d8" id="stop2-6" />
      </linearGradient>
      <filter
        id="shadow-3"
        x={-0.0092857145}
        y={-0.012580645}
        width={1.0185714}
        height={1.0251613}
      >
        <feDropShadow
          dx={0}
          dy={2}
          stdDeviation={2}
          floodColor="#555"
          floodOpacity={0.25}
        />
      </filter>
      <filter
        id="softShadow-5-2"
        x={-0.013398468}
        y={-0.0087462217}
        width={1.0267969}
        height={1.0174924}
      >
        <feDropShadow
          dx={0}
          dy={3}
          stdDeviation={3}
          floodColor="#555"
          floodOpacity={0.25}
        />
      </filter>
      <filter
        id="softShadow-5-0"
        x={-0.013398468}
        y={-0.0087462217}
        width={1.0267969}
        height={1.0174924}
      >
        <feDropShadow
          dx={0}
          dy={3}
          stdDeviation={3}
          floodColor="#555"
          floodOpacity={0.25}
        />
      </filter>
      <filter
        id="softShadow-5-25"
        x={-0.013398468}
        y={-0.0087462217}
        width={1.0267969}
        height={1.0174924}
      >
        <feDropShadow
          dx={0}
          dy={3}
          stdDeviation={3}
          floodColor="#555"
          floodOpacity={0.25}
        />
      </filter>
      <linearGradient
        id="metalBody"
        x1={15.806954}
        y1={34.075649}
        x2={15.806954}
        y2={118.70604}
        gradientTransform="matrix(1.3764116,0,0,0.72652685,-64.828181,20.954022)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#e5e5e5" id="stop1-5" />
        <stop offset="50%" stopColor="#c9c9c9" id="stop2-3" />
        <stop offset="100%" stopColor="#a9a9a9" id="stop3-5" />
      </linearGradient>
      <linearGradient
        id="metalPipe"
        x1={59.963181}
        y1={52.27232}
        x2={110.14427}
        y2={52.27232}
        gradientTransform="scale(1.3814797,0.72386151)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#8f8f8f" id="stop4-1" />
        <stop offset="50%" stopColor="#d8d8d8" id="stop5-2" />
        <stop offset="100%" stopColor="#7d7d7d" id="stop6-2" />
      </linearGradient>
      <rect x={307.20474} y={928} width={127.79525} height={52} id="rect9-3" />
      <rect
        x={307.20474}
        y={928}
        width={127.79525}
        height={52}
        id="rect9-3-3"
      />
      <rect
        x={307.20474}
        y={928}
        width={127.79525}
        height={52}
        id="rect9-3-3-7"
      />
      <rect
        x={307.20474}
        y={928}
        width={127.79525}
        height={52}
        id="rect9-3-2"
      />
      <filter
        id="shadow-8"
        x={-0.0092857145}
        y={-0.012580645}
        width={1.0185714}
        height={1.0251613}
      >
        <feDropShadow
          dx={0}
          dy={2}
          stdDeviation={2}
          floodColor="#555"
          floodOpacity={0.25}
        />
      </filter>
      <rect
        x={307.20474}
        y={928}
        width={127.79525}
        height={52}
        id="rect9-3-0"
      />
      <rect
        x={307.20474}
        y={928}
        width={127.79525}
        height={52}
        id="rect9-3-0-8"
      />
    </defs>
    <style type="text/css" id="style1">
      {
        ".st0{fill:none;stroke:#008BA3;stroke-width:4;stroke-miterlimit:10;}\n\t.st1{fill:none;stroke:#00AEED;stroke-width:4;stroke-miterlimit:10;}\n\t.st2{fill:#FFFFFF;}\n\t.st3{fill:#E33F09;}\n\t.st4{fill:#00CD98;}\n\t.st5{fill:#3574E0;}\n\t.st6{fill:#FBC43B;}\n\t.st7{fill:#FF6200;}\n\t.st8{fill:#666666;}\n\t.st9{font-family:'ArialMT';}\n\t.st10{font-size:14px;}\n\t.st11{fill:#606060;}\n\t.st12{font-family:'Arial-BoldMT';}\n\t.st13{font-size:17px;}\n\t.st14{fill:#00E098;}\n\t.st15{opacity:0.5;fill:none;stroke:#B3B3B3;stroke-width:0.5;stroke-miterlimit:10;enable-background:new    ;}\n\t.st16{opacity:7.000000e-02;fill:#323E48;enable-background:new    ;}\n\t.st17{fill:#2F3E49;}\n\t.st18{fill:#00AEED;}\n\t.st19{opacity:0.15;fill:#0E76E7;enable-background:new    ;}\n\t.st20{font-size:11px;}\n\t.st21{opacity:0.6;fill:none;stroke:#CBCBCB;stroke-width:2;stroke-miterlimit:10;enable-background:new    ;}\n\t.st22{fill:#CBCBCB;}\n\t.st23{fill:none;stroke:#2F3E49;stroke-width:4;stroke-miterlimit:10;}\n\t.st24{fill:#00A39B;}\n\t.st25{fill:none;stroke:#35ACE8;stroke-width:4;stroke-miterlimit:10;}\n\t.st26{fill:#0E76E7;}\n\t.st27{fill:#323E48;}\n\t.st28{fill:none;stroke:#323E48;stroke-width:4;stroke-miterlimit:10;}\n\t.st29{fill:none;stroke:#FFFFFF;stroke-width:2;stroke-miterlimit:10;}\n\t.st30{fill:#7C7C7C;}\n\t.st31{font-size:9px;}\n\t.st32{fill:none;stroke:#2F3E49;stroke-width:3;stroke-miterlimit:10;}\n\t.st33{font-size:16px;}\n\t.st34{font-size:13px;}\n\t.st35{fill:#C6C6C6;}\n\t.st36{font-size:10px;}\n\t.st37{fill:#FFFFFF;stroke:#35ACE8;stroke-width:4;stroke-miterlimit:10;}\n\t.st38{enable-background:new    ;}\n\t.st39{fill:#FFFFFF;stroke:#008BA3;stroke-width:4;stroke-miterlimit:10;}\n\t.st40{fill:#00AEED;stroke:#FFFFFF;stroke-width:4;stroke-miterlimit:10;}"
      }
    </style>
    <style id="style1-8">
      {
        ".bg { fill:#e9eaec; }\n    .panel { fill:#ffffff; stroke:#9aa3ad; stroke-width:2; rx:10; }\n    .pipe { fill:none; stroke:#7b8794; stroke-width:8; }\n    .flow { fill:#2f80ff; }\n    .equip { fill:#e7b84b; stroke:#9c7a1e; stroke-width:2; rx:10; }\n    .tank { fill:#f5f7fa; stroke:#9aa3ad; stroke-width:2; rx:10; }\n    .lagoon { fill:#2fd0e6; stroke:#0aa; stroke-width:2; rx:18; }\n    .label { font-family: Arial, Helvetica, sans-serif; fill:#1f2937; font-size:16px; }\n    .small { font-size:14px; }\n    .title { font-size:28px; font-weight:bold; }\n    .status-green { fill:#22c55e; }\n    .status-red { fill:#ef4444; }\n    .status-yellow { fill:#f59e0b; }"
      }
    </style>
    <g
      id="g3"
      transform="matrix(0.18751318,0,0,0.12594391,279.80541,339.2788)"
      style={{
        strokeWidth: 6.50722,
      }}
    >
      <g
        id="g50-8-3-4"
        transform="matrix(0.78841553,0,0,0.60565108,-281.0516,-1086.5567)"
        style={{
          stroke: "#000000",
          strokeWidth: 9.41687,
          strokeDasharray: "none",
          strokeOpacity: 1,
        }}
      >
        <g
          id="g62-5-8-8"
          transform="matrix(2.354924,0,0,2.6736548,-254.08844,-48.287153)"
          style={{
            stroke: "#000000",
            strokeWidth: 3.75288,
            strokeDasharray: "none",
            strokeOpacity: 1,
          }}
        >
          <path
            style={{
              opacity: 1,
              fill: "#000000",
              fillOpacity: 0,
              stroke: "#35ade9",
              strokeWidth: 15.0116,
              strokeLinejoin: "round",
              strokeMiterlimit: 10.7,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            d="m -140.86215,1576.973 -1.43518,490.1531 h 399.25552"
            id="path4"
            sodipodi:nodetypes="ccc"
          />
        </g>
        <g
          inkscape:groupmode="layer"
          id="layer1"
          inkscape:label="Layer 1"
          style={{
            strokeWidth: 9.41687,
          }}
        />
      </g>
    </g>
    <g
      id="g24-6"
      role="button"
      tabIndex={0}
      aria-label={`Open popup ${SMALL_PUMP_NAME}`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={openPumpPopup}
      onKeyDown={handlePumpKeyDown}
      transform="matrix(1.3372687,0,0,1.1041878,-147.07268,9.8892832)"
      style={{
        stroke: "#000000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
    >
      <g
        id="g278"
        transform="matrix(0.74779287,0,0,0.90564304,-396.72455,-450.5477)"
      >
        <path
          className="st17"
          d="m 987.9,1083.1 h -17.4 c -1.1,-0.3 -2.2,-0.4 -3.4,-0.4 -8.1,0 -14.6,6.5 -14.6,14.6 0,4.1 1.7,7.8 4.3,10.4 l -4.1,9 c -0.3,0.7 0.1,1.6 0.7,1.6 h 27.7 c 0.6,0 0.9,-0.9 0.6,-1.6 l -4.1,-9.1 c 2.6,-2.6 4.2,-6.3 4.2,-10.3 0,-1.5 -0.2,-2.9 -0.6,-4.2 h 6.8 c 1.4,0 2.6,-1.2 2.6,-2.7 v -4.6 c 0,-1.5 -1.2,-2.7 -2.7,-2.7 z"
          id="path278"
          style={{
            fill: "#2f3e49",
          }}
        />
      </g>
      <g
        id="g282"
        transform="matrix(0.74779287,0,0,0.90564304,-397.09844,-451.27227)"
      >
        <image
          style={{
            overflow: "visible",
            opacity: 0.15,
            enableBackground: "new",
          }}
          width={40}
          height={40}
          xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAACXBIWXMAAAycAAAMnAGTj5aaAAAA GXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA8VJREFUeNrsmItT2kAQxnPJgYAP 8NWXdvr//122dmxVUARMQpLeOd92Pren5JC+ZszMN3kAyy+7e7ubJMnr9rr9W5v5A3b9cQP9dUhD +1WQUdBmQ3AMlgauCVStzlvBmg14TqD8PlN7hvSAldq3gjUb8J4FVAfy510CTQisJC1xLQT8aLMv AEwJyKtP6uGa2F8C7F4pdyoImNNhbUgG9BBbTgOnbaeh0y60A9AOvl8AaOZ0B01xPgOwwP4Cal8A 2AOMhzt0OnI6cBo57cGjXfy2AIiHu3WaOI2hCa7NcCOlBrVrhngLHtt3euP03ukdjvcDkBJqD3Lj dO30HerDZkpgEv7WnuRFkuGPtwHjwU6dPjp9IMht/HkGGxW8tECYx/jeLm7YUj3lhfSwjwl3ihwb IMTHTidOnwjySHmRV/cS3hxR/vYpbyt8J8fxz7pqI8LMXjyA107gyVOcj/B5l7yTkIf65GVZWCnB yeIq8X3/WW0jvGhheA+QbykXjxG+HQpfGih3lmopl6cFrfxrnBeSl7ZlLkqo+wR5DB3Bg1J2BDBV vTqhvDYU4hx56uGukE7cDFp5MqWyM6BVfQjYPVzfou5jnmmhDC72RtCuagTemyZtmZMZdRWpjZL8 fOfZilbLsBnV2wHlKqeLSQJ585Rh6c09GBPxXWeRjSEju13qYB2VEk960qj5kPt0j8KrPWhaAuoo ZQE7pq0njcrLjFamJcPrbE1gUQUnszTCUPPM8Jq8AJRt1srmw3G64sd6YC2x4go1YsXANoFpnefM ioBbe5IBcyq8c7S5kkasGFBplTLGybhWqhtv0giDBQ0ItzQPLpQHmhbhrWkQXuCGebZ8NATblpDi ybmaBydUgGUBdZ6JEIe3gL072Jngxrklrpwn2SPak2PMgkMaKPjRVT+I6RDngLuhdngN0LmCbLKW HUdPQ1IzO7o7UMLXlM9L8t49ec/f6Bfos9MFYOecm7FdgmFTVddqevqraEGVFAVJFw/yzenc6QyA /vgS3s35ecdGrMaK8mhCv63hnSkmoiG1TJ64eSSbIMRf4cVznN8qwCZm4ejp2qhcvaM/lrmSp+6a IKf47iXCfYHjsQ5z7NMig5bKu7nKsVHgkbahciMLZkxVYorr96GaayNbWB2odwXl2hUAB4EHLInC gp69Z1Rri5AX133NYgIDh4xZPez1ANyotpoH3mAsdTvcxLugEHBG4KE6WQUUGiw2+upPwxp1zO8n EwVTt339t6mXqOaJYXnVdNXEGP+dr6KTdd/w/lfbDwEGADwKtLJYhw5GAAAAAElFTkSuQmCC"
          transform="matrix(0.875,0,0,0.875,949.1988,1079.8372)"
          id="image280"
        />
        <g id="g281">
          <circle
            className="st2"
            cx={967.09998}
            cy={1097.6}
            r={10.9}
            id="circle280"
            style={{
              fill: "#ffffff",
            }}
          />
        </g>
        <ellipse
          className="st19"
          cx={326.09204}
          cy={542.58044}
          id="circle282"
          style={{
            stroke: "#000000",
            strokeWidth: 0,
            strokeDasharray: "none",
            strokeOpacity: 1,
            opacity: 0.15,
            fill: "#0e76e7",
            enableBackground: "new",
          }}
          rx={5.9823432}
          ry={7.2451444}
          transform="matrix(1.3372687,0,0,1.1041878,531.02732,498.28934)"
        />
      </g>
    </g>
    <path
      style={{
        opacity: 1,
        fill: "#000000",
        fillOpacity: 0,
        stroke: "#35ade9",
        strokeWidth: 3.29176,
        strokeLinejoin: "round",
        strokeMiterlimit: 10.7,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m 344.03907,534.88249 709.54443,-0.6232 -1.6529,-322.55708 -837.96182,-0.0523 -0.0839,85.85522"
      id="path5"
      sodipodi:nodetypes="ccccc"
      transform="matrix(1.3372687,0,0,1.1041878,-147.07268,9.8892832)"
    />
    <path
      id="Vector_324-6-6-5-1-7-7-7-06"
      d="m 1267.0274,318.09194 c 0.025,1.26109 -0.8731,2.42718 -2.1065,2.45366 l -10.1766,0.21662 c -1.1308,0.0226 -2.181,-0.98591 -2.2107,-2.36152 -0.012,-0.63071 0.1783,-1.26557 0.5294,-1.67447 l 4.9655,-5.78363 c 0.7524,-0.87626 2.0373,-0.90343 2.9271,-0.17748 l 0.1054,0.11259 5.2108,5.56662 c 0.628,0.5028 0.742,1.01673 0.7557,1.64729 z"
      fill="#00aeed"
      stroke="#ffffff"
      strokeWidth={2.1717}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#ffffff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      inkscape:transform-center-x={-0.20461431}
      inkscape:transform-center-y={-0.66509277}
      inkscape:highlight-color="#aa6a31"
      onclick="12&#10;"
    />
    <path
      id="Vector_324-6-6-5-1-7-7-7-89"
      d="m 901.43609,235.97281 c 1.26137,0.0102 2.40163,0.9411 2.39337,2.17478 l -0.0703,10.17865 c -0.005,1.13105 -1.04694,2.1524 -2.42284,2.1433 -0.63078,-0.006 -1.26002,-0.21384 -1.65893,-0.57637 l -5.64138,-5.12646 c -0.85472,-0.77672 -0.84577,-2.0619 -0.0951,-2.93093 l 0.11549,-0.10218 5.71126,-5.05198 c 0.52029,-0.61354 1.03718,-0.71302 1.66789,-0.7089 z"
      fill="#00aeed"
      stroke="#ffffff"
      strokeWidth={2.1717}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#ffffff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      inkscape:transform-center-x={0.69886196}
      inkscape:transform-center-y={-0.14617663}
      inkscape:highlight-color="#aa6a31"
      onclick="12&#10;"
    />
    <path
      id="Vector_324-6-6-5-1-7-7-7-0"
      d="m 1267.238,552.56274 c 0,1.26134 -0.9149,2.41174 -2.1486,2.41691 l -10.1788,0.0407 c -1.131,0.003 -2.1637,-1.02346 -2.1696,-2.39938 0,-0.63082 0.2002,-1.2623 0.5583,-1.66507 l 5.0647,-5.69694 c 0.7674,-0.86313 2.0526,-0.8681 2.9297,-0.12689 l 0.1035,0.11442 5.1138,5.65585 c 0.6192,0.51358 0.7243,1.0294 0.7271,1.66009 z"
      fill="#00aeed"
      stroke="#ffffff"
      strokeWidth={2.1717}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#ffffff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      inkscape:transform-center-x={-0.16877715}
      inkscape:transform-center-y={-0.70738077}
      inkscape:highlight-color="#aa6a31"
      onclick="12&#10;"
    />
    <path
      id="Vector_324-6-6-5-1-7-7-7-8"
      d="m 1042.474,607.23176 c -1.2613,-0.011 -2.401,-0.94272 -2.3919,-2.17638 l 0.077,-10.17858 c 0.01,-1.13104 1.0484,-2.15171 2.4243,-2.14167 0.6308,0.006 1.2599,0.21469 1.6585,0.57748 l 5.638,5.13024 c 0.8542,0.77729 0.8443,2.06246 0.093,2.931 l -0.1156,0.10208 -5.7146,5.04815 c -0.5207,0.61319 -1.0377,0.71232 -1.6684,0.70777 z"
      fill="#00aeed"
      stroke="#ffffff"
      strokeWidth={2.1717}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#ffffff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      inkscape:transform-center-x={-0.69708309}
      inkscape:transform-center-y={0.14477399}
      inkscape:highlight-color="#aa6a31"
      onclick="12&#10;"
    />
    <path
      id="Vector_324-6-6-5-1-7-7-7"
      d="m 538.35337,607.26567 c -1.26137,-0.011 -2.40101,-0.94272 -2.39192,-2.17638 l 0.0771,-10.17859 c 0.006,-1.13103 1.04838,-2.1517 2.42428,-2.14166 0.63078,0.006 1.25987,0.21469 1.65854,0.57748 l 5.63794,5.13024 c 0.8542,0.77729 0.84438,2.06246 0.0932,2.931 l -0.11557,0.10208 -5.71464,5.04815 c -0.5207,0.61319 -1.03766,0.71231 -1.66836,0.70777 z"
      fill="#00aeed"
      stroke="#ffffff"
      strokeWidth={2.1717}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#ffffff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      inkscape:transform-center-x={-0.69708309}
      inkscape:transform-center-y={0.14477399}
      inkscape:highlight-color="#aa6a31"
      onclick="12&#10;"
    />
    <text
      xmlSpace="preserve"
      style={{
        fontSize: 14,
        fontFamily: "Calibri",
        InkscapeFontSpecification: "Calibri",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        opacity: 1,
        fill: "#ffffff",
        fillOpacity: 0,
        fillRule: "nonzero",
        stroke: "#35aae9",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 0.853007,
      }}
      x={250.23262}
      y={835.66156}
      id="text64"
    >
      <tspan sodipodi:role="line" id="tspan64" x={250.23262} y={835.66156} />
      <tspan sodipodi:role="line" id="tspan65" x={250.23262} y={853.16156} />
      <tspan sodipodi:role="line" x={250.23262} y={870.66156} id="tspan66" />
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontSize: 14,
        fontFamily: "Calibri",
        InkscapeFontSpecification: "Calibri",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        opacity: 1,
        fill: "#ffffff",
        fillOpacity: 0,
        fillRule: "nonzero",
        stroke: "#35aae9",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 0.853007,
      }}
      x={1263.0314}
      y={691.35632}
      id="text69"
    >
      <tspan sodipodi:role="line" id="tspan69" x={1263.0314} y={691.35632} />
    </text>
    <rect
      style={{
        opacity: 1,
        mixBlendMode: "hard-light",
        fill: "#ffffff",
        fillOpacity: 1,
        stroke: "url(#linearGradient12)",
        strokeWidth: 1.5,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      id="rect1"
      width={260.284}
      height={163.17505}
      x={1092.085}
      y={13.428226}
      rx={1.8}
      sodipodi:type="rect"
      ry={1.8}
      sodipodi:insensitive="true"
    />
    <text
      xmlSpace="preserve"
      style={{
        fontSize: 16,
        fontFamily: "Calibri",
        InkscapeFontSpecification: "Calibri",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000303",
        fillOpacity: 1,
        stroke: "#000303",
        strokeWidth: 0.1,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      x={1149.9917}
      y={97.87925}
      id="text12-1"
    >
      <tspan
        sodipodi:role="line"
        id="tspan12-5"
        x={1149.9917}
        y={97.87925}
        style={{
          fontSize: 16,
        }}
      >
        {"Moving"}
      </tspan>
    </text>
    <path
      style={{
        fill: "#fafc00",
        fillOpacity: 1,
        stroke: "#fafcff",
        strokeWidth: 0.1,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      id="path3-2"
      sodipodi:type="arc"
      sodipodi:cx={1109.976}
      sodipodi:cy={119.89948}
      sodipodi:rx={9.7608471}
      sodipodi:ry={9.5390091}
      sodipodi:start={3.1248947}
      sodipodi:end={3.1200791}
      sodipodi:arc-type="slice"
      d="m 1100.2165,120.05876 a 9.7608471,9.5390091 0 0 1 9.5847,-9.69676 9.7608471,9.5390091 0 0 1 9.9338,9.35524 9.7608471,9.5390091 0 0 1 -9.5608,9.71928 9.7608471,9.5390091 0 0 1 -9.9568,-9.33184 l 9.7586,-0.2052 z"
    />
    <path
      style={{
        fill: "#f30303",
        fillOpacity: 1,
        stroke: "#f30303",
        strokeWidth: 0.1,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      id="path3-1"
      sodipodi:type="arc"
      sodipodi:cx={1110.2047}
      sodipodi:cy={146.79721}
      sodipodi:rx={9.7608471}
      sodipodi:ry={9.5390091}
      sodipodi:start={3.1248947}
      sodipodi:end={3.1200791}
      sodipodi:arc-type="slice"
      d="m 1100.4452,146.95649 a 9.7608471,9.5390091 0 0 1 9.5848,-9.69676 9.7608471,9.5390091 0 0 1 9.9338,9.35524 9.7608471,9.5390091 0 0 1 -9.5609,9.71928 9.7608471,9.5390091 0 0 1 -9.9568,-9.33184 l 9.7586,-0.2052 z"
    />
    <path
      style={{
        fill: "#0443fb",
        fillOpacity: 1,
        stroke: "#0443fb",
        strokeWidth: 0.1,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      id="path3-4"
      sodipodi:type="arc"
      sodipodi:cx={1109.976}
      sodipodi:cy={92.909882}
      sodipodi:rx={9.7608471}
      sodipodi:ry={9.5390091}
      sodipodi:start={3.1248947}
      sodipodi:end={3.1200791}
      sodipodi:arc-type="slice"
      d="m 1100.2165,93.069156 a 9.7608471,9.5390091 0 0 1 9.5847,-9.696755 9.7608471,9.5390091 0 0 1 9.9338,9.355242 9.7608471,9.5390091 0 0 1 -9.5608,9.719277 9.7608471,9.5390091 0 0 1 -9.9568,-9.331836 l 9.7586,-0.205202 z"
    />
    <text
      xmlSpace="preserve"
      id="text1"
      style={{
        fontSize: 20,
        fontFamily: "Calibri",
        InkscapeFontSpecification: "Calibri",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        whiteSpace: "pre",
        shapeInside: "url(#rect2)",
        display: "inline",
        fill: "#ffffff",
        fillOpacity: 1,
        stroke: "#113c54",
        strokeWidth: 0.1,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      transform="translate(-38.656589,-11.635832)"
    >
      <tspan x={1158.2432} y={49} id="tspan4">
        <tspan
          style={{
            fill: "#2c2c2c",
          }}
          id="tspan2"
        >
          {"Equipment Operations"}
        </tspan>
      </tspan>
    </text>
    <g id="g9" transform="translate(-98.981123,-19.025712)">
      <g
        id="Group_12-6-4-7-8-9"
        transform="matrix(1.4643977,0,0,1.1659134,146.19322,77.83278)"
        style={{
          strokeWidth: 1.54833,
        }}
      >
        <g
          id="Group_15-0-9-6-6-5"
          style={{
            strokeWidth: 1.54833,
          }}
        >
          <g
            id="Group_16-6-6-1-0-4"
            style={{
              strokeWidth: 1.54833,
            }}
          >
            <path
              id="Vector_29-6-3-4-2-3"
              d="m 395.19691,549.87048 v 52.09053 c 0,0.80671 -0.39799,1.49818 -0.79598,1.49818 h -36.91362 c -0.49749,0 -0.78948,-0.6915 -0.79598,-1.49818 l -0.4188,-52.01199"
              stroke="#2f3e49"
              strokeWidth={4.34715}
              strokeMiterlimit={10}
              style={{
                fill: "#00a39b",
                fillOpacity: 1,
              }}
            />
            <g
              id="Group_17-1-7-2-4-1"
              transform="translate(-7.5025782,-12.630209)"
              style={{
                strokeWidth: 1.54833,
              }}
            />
          </g>
        </g>
      </g>
      <g
        id="Group_12-6-4-7-8-9-3"
        transform="matrix(1.4643977,0,0,1.1659134,417.25645,77.83278)"
        style={{
          strokeWidth: 1.54833,
        }}
      >
        <g
          id="Group_15-0-9-6-6-5-1"
          style={{
            strokeWidth: 1.54833,
          }}
        >
          <g
            id="Group_16-6-6-1-0-4-2"
            style={{
              strokeWidth: 1.54833,
            }}
          >
            <path
              id="Vector_29-6-3-4-2-3-3"
              d="m 395.19691,549.87048 v 52.09053 c 0,0.80671 -0.39799,1.49818 -0.79598,1.49818 h -36.91362 c -0.49749,0 -0.78948,-0.6915 -0.79598,-1.49818 l -0.4188,-52.01199"
              stroke="#2f3e49"
              strokeWidth={4.34715}
              strokeMiterlimit={10}
              style={{
                fill: "#00a39b",
                fillOpacity: 1,
              }}
            />
            <g
              id="Group_17-1-7-2-4-1-3"
              transform="translate(-7.5025782,-12.630209)"
              style={{
                strokeWidth: 1.54833,
              }}
            />
          </g>
        </g>
      </g>
      <g
        id="Group_12-6-4-7-8-9-3-3"
        transform="matrix(1.4643977,0,0,1.1659134,670.84076,77.83278)"
        style={{
          strokeWidth: 1.54833,
        }}
      >
        <g
          id="Group_15-0-9-6-6-5-1-8"
          style={{
            strokeWidth: 1.54833,
          }}
        >
          <g
            id="Group_16-6-6-1-0-4-2-7"
            style={{
              strokeWidth: 1.54833,
            }}
          >
            <path
              id="Vector_29-6-3-4-2-3-3-4"
              d="m 395.19691,549.87048 v 52.09053 c 0,0.80671 -0.39799,1.49818 -0.79598,1.49818 h -36.91362 c -0.49749,0 -0.78948,-0.6915 -0.79598,-1.49818 l -0.4188,-52.01199"
              stroke="#2f3e49"
              strokeWidth={4.34715}
              strokeMiterlimit={10}
              style={{
                fill: "#00a39b",
                fillOpacity: 1,
              }}
            />
            <g
              id="Group_17-1-7-2-4-1-3-2"
              transform="translate(-7.5025782,-12.630209)"
              style={{
                strokeWidth: 1.54833,
              }}
            />
          </g>
        </g>
      </g>
      <path
        style={{
          opacity: 1,
          fill: "#000000",
          fillOpacity: 0,
          stroke: "#35ade9",
          strokeWidth: 0,
          strokeLinejoin: "round",
          strokeMiterlimit: 10.7,
          strokeDasharray: "none",
          strokeOpacity: 1,
        }}
        d="m 696.41826,704.72145 7e-5,-85.74107"
        id="path6"
      />
      <path
        style={{
          opacity: 1,
          fill: "#2f3e49",
          fillOpacity: 0,
          stroke: "#2f3e49",
          strokeWidth: 3,
          strokeLinejoin: "round",
          strokeMiterlimit: 10.7,
          strokeDasharray: "none",
          strokeOpacity: 1,
        }}
        d="M 589.02017,338.98486 V 264.58329"
        id="path9"
      />
      <path
        style={{
          fill: "#2f3e49",
          fillOpacity: 0,
          stroke: "#2f3e49",
          strokeWidth: 3,
          strokeLinejoin: "round",
          strokeMiterlimit: 10.7,
          strokeDasharray: "none",
          strokeOpacity: 1,
        }}
        d="M 849.28535,339.02571 V 264.62414"
        id="path9-6"
      />
      <path
        style={{
          fill: "#2f3e49",
          fillOpacity: 0,
          stroke: "#2f3e49",
          strokeWidth: 3,
          strokeLinejoin: "round",
          strokeMiterlimit: 10.7,
          strokeDasharray: "none",
          strokeOpacity: 1,
        }}
        d="M 1080.7854,338.99923 V 264.59766"
        id="path9-6-8"
      />
      <path
        style={{
          fill: "#35ade9",
          fillOpacity: 0,
          stroke: "#2a8b8b",
          strokeWidth: 2.3,
          strokeLinejoin: "round",
          strokeMiterlimit: 10.7,
          strokeDasharray: "none",
          strokeOpacity: 0.99215686,
        }}
        d="m 703.19578,696.27203 16.30861,0.0469 -0.008,-70.29319"
        id="path7"
        sodipodi:nodetypes="ccc"
      />
      <g
        id="g1-2"
        transform="matrix(-0.01572811,0,0,0.01875805,986.32599,713.12925)"
        style={{
          strokeWidth: 7.35888,
          strokeDasharray: "none",
        }}
      />
      <path
        style={{
          fill: "#35ade9",
          fillOpacity: 0,
          stroke: "#2a8b8b",
          strokeWidth: 2.3,
          strokeLinejoin: "round",
          strokeMiterlimit: 10.7,
          strokeDasharray: "none",
          strokeOpacity: 0.992157,
        }}
        d="m 975.57015,696.64633 16.30861,0.0469 -0.008,-70.29319"
        id="path7-3"
        sodipodi:nodetypes="ccc"
      />
      <rect
        style={{
          strokeWidth: 0,
          strokeDasharray: "none",
          stroke: "#283e49",
          strokeOpacity: 1,
          opacity: 1,
          fill: "#a02632",
          fillOpacity: 1,
          strokeLinecap: "square",
          strokeLinejoin: "round",
          strokeMiterlimit: 10.7,
        }}
        id="rect10"
        width={98.230049}
        height={272.45264}
        x={-452.23032}
        y={455.00616}
        transform="matrix(0.03761124,0,0,0.03349206,1236.99,682.78662)"
        rx={15.504617}
        ry={14.339559}
      />
      <g
        id="g1-2-1"
        role="button"
        tabIndex={0}
        aria-label="Open popup DOSIF003"
        onClick={openDosifPopup("dosif003", "DOSIF003")}
        onKeyDown={handleDosifKeyDown("dosif003", "DOSIF003")}
        transform="matrix(-0.01572811,0,0,0.01875805,1239.6103,712.40078)"
        style={{
          strokeWidth: 7.35888,
          strokeDasharray: "none",
        }}
        inkscape:label="dosif003"
      >
        <g
          fill="none"
          stroke="#050505"
          strokeWidth={53.0248}
          strokeLinejoin="round"
          strokeLinecap="round"
          id="g23-4-8"
          style={{
            stroke: "#2f3e49",
            strokeWidth: 18.56759672,
            strokeDasharray: "none",
            strokeOpacity: 1,
          }}
          transform="matrix(2.3913386,0,0,1.7854765,166.59629,-1578.7439)"
        >
          <rect
            style={{
              strokeWidth: 0,
              strokeDasharray: "none",
              stroke: "#283e49",
              strokeOpacity: 1,
              opacity: 1,
              fill: "#868588",
              fillOpacity: 0.9137255,
              strokeLinecap: "square",
              strokeLinejoin: "round",
              strokeMiterlimit: 10.7,
            }}
            id="rect12"
            width={664.69495}
            height={734.99994}
            x={-1118.3475}
            y={315}
            transform="matrix(-1.0000001,0,0,1.0000001,8.5679948e-4,-2.9457882e-5)"
            rx={15.504619}
            ry={14.33956}
          />
          <rect
            style={{
              opacity: 1,
              fill: "#a02632",
              fillOpacity: 1,
              stroke: "#283e49",
              strokeWidth: 0,
              strokeLinecap: "square",
              strokeLinejoin: "round",
              strokeMiterlimit: 10.7,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            id="rect11"
            width={4.2013426}
            height={8.4075842}
            x={1220.1401}
            y={709.67017}
            rx={0.58314788}
            ry={0.48026136}
            transform="matrix(-26.587799,0,0,29.857825,32888.843,-20386.524)"
          />
          <rect
            style={{
              opacity: 1,
              fill: "#a02632",
              fillOpacity: 1,
              stroke: "#283e49",
              strokeWidth: 0,
              strokeLinecap: "square",
              strokeLinejoin: "round",
              strokeMiterlimit: 10.7,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            id="rect8"
            width={176.88971}
            height={131.00005}
            x={-447.16104}
            y={332.71619}
            transform="scale(-1,1)"
            ry={15.504617}
            rx={15.504618}
          />
          <path
            d="m 456,315 h 660 q 10,0 10,10 v 725 H 448 V 325 q 0,-10 8,-10 z"
            id="path1-5-9"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.56759672,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="m 402,1063 h 724"
            strokeWidth={106.05}
            id="path2-5-2"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.56759672,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="M 264,328 448,328.69979 357,474 v 0 229 c -15,21 -22,45 -22,71 v 242 c 0,28 19.33333,43.3333 58,46 h 55 V 325"
            id="path3-9-1-7"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            sodipodi:nodetypes="cccccssccc"
          />
          <path
            d="M 354,473 V 704"
            id="path4-4-7-9"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.56759672,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="m 264,328 v 92 c 0,34.66667 20.81126,52.33333 62.43379,53 h 31.21689"
            id="path5-8-1-5"
            style={{
              opacity: 1,
              fill: "#a02632",
              fillOpacity: 1,
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            sodipodi:nodetypes="cscc"
          />
          <path
            d="m 226,341.13979 v 101.8605"
            id="path10-1-4"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.56759672,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="m 244.34768,353.21004 c 0.61225,28.67077 1.2756,57.67769 0.88692,79.76376"
            id="path10-1-4-4"
            style={{
              stroke: "#a02632",
              strokeWidth: 21.38513795,
              strokeLinecap: "square",
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            inkscape:transform-center-x={-0.009543673}
            inkscape:transform-center-y={0.11693223}
            sodipodi:nodetypes="cc"
          />
          <path
            d="m 226,342 h 38"
            id="path12-5-3"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.56759672,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="m 226,445 h 38"
            id="path13-2-1"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.56759672,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="M 428,411 V 553"
            strokeWidth={59.6528}
            id="path22-7-2"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.56759672,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <rect
            x={368}
            y={358}
            width={21}
            height={22}
            fill="#050505"
            stroke="none"
            id="rect22-6-3"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.56759672,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <rect
            x={383}
            y={656}
            width={25}
            height={25}
            fill="#050505"
            stroke="none"
            id="rect23-1-3"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.56759672,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <ellipse
            cx={393.85883}
            cy={764.29706}
            fill="#ffffff"
            id="circle23-4-4"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.56759672,
              strokeDasharray: "none",
              strokeOpacity: 1,
              fill: "#a02632",
              fillOpacity: 1,
            }}
            rx={54.358845}
            ry={54.428833}
          />
        </g>
      </g>
      <path
        style={{
          fill: "#35ade9",
          fillOpacity: 0,
          stroke: "#2a8b8b",
          strokeWidth: 2.3,
          strokeLinejoin: "round",
          strokeMiterlimit: 10.7,
          strokeDasharray: "none",
          strokeOpacity: 0.992157,
        }}
        d="m 1228.8578,695.93996 16.3086,0.0469 -0.01,-70.29319"
        id="path7-3-1"
        sodipodi:nodetypes="ccc"
      />
      <rect
        style={{
          fill: "#7e808b",
          fillOpacity: 1,
          stroke: "#2f3e49",
          strokeWidth: 0,
          strokeLinecap: "square",
          strokeLinejoin: "round",
          strokeMiterlimit: 10.7,
          strokeDasharray: "none",
          strokeOpacity: 1,
        }}
        id="rect4"
        width={20.447123}
        height={4.7973928}
        x={368.53403}
        y={694.58844}
      />
      <path
        id="Vector_324-1-6-4-1-8"
        d="m 1250.5449,627.25168 c -0.014,0.86059 -0.7458,1.63383 -1.7057,1.62172 l -7.9196,-0.10096 c -0.8799,-0.0103 -1.6687,-0.7255 -1.654,-1.66426 0.011,-0.4303 0.1735,-0.85861 0.4578,-1.12889 l 4.0205,-3.8225 c 0.6091,-0.5792 1.6091,-0.56643 2.2811,-0.0494 l 0.079,0.0793 3.8989,3.92304 c 0.4745,0.35816 0.549,0.7113 0.5422,1.1416 z"
        fill="#00aeed"
        stroke="#ffffff"
        strokeWidth={2.1717}
        strokeMiterlimit={10}
        style={{
          fill: "#2a8b8b",
          fillOpacity: 1,
          stroke: "#2a8b8b",
          strokeWidth: 0,
          strokeDasharray: "none",
          strokeOpacity: 1,
        }}
        inkscape:transform-center-x={-0.10221554}
        inkscape:transform-center-y={-0.46324031}
        inkscape:highlight-color="#aa6a31"
        onclick="12&#10;"
      />
      <rect
        style={{
          fill: "#612632",
          fillOpacity: 1,
          stroke: "#603e49",
          strokeWidth: 2.3,
          strokeLinejoin: "round",
          strokeMiterlimit: 10.7,
          strokeOpacity: 1,
        }}
        id="rect3"
        width={0}
        height={1.3992147}
        x={-1227.9103}
        y={695.0257}
        transform="scale(-1,1)"
      />
      <g
        id="g1-2-1-8"
        role="button"
        tabIndex={0}
        aria-label="Open popup DOSIF002"
        onClick={openDosifPopup("dosif002", "DOSIF002")}
        onKeyDown={handleDosifKeyDown("dosif002", "DOSIF002")}
        transform="matrix(-0.01572811,0,0,0.01875805,986.466,712.79813)"
        style={{
          strokeWidth: 7.35888,
          strokeDasharray: "none",
        }}
        inkscape:label="dosif002"
      >
        <g
          fill="none"
          stroke="#050505"
          strokeWidth={53.0248}
          strokeLinejoin="round"
          strokeLinecap="round"
          id="g23-4-8-5"
          style={{
            stroke: "#2f3e49",
            strokeWidth: 18.5676,
            strokeDasharray: "none",
            strokeOpacity: 1,
          }}
          transform="matrix(2.3913386,0,0,1.7854765,166.59629,-1578.7439)"
        >
          <rect
            style={{
              strokeWidth: 0,
              strokeDasharray: "none",
              stroke: "#283e49",
              strokeOpacity: 1,
              fill: "#a02632",
              fillOpacity: 1,
              strokeLinecap: "square",
              strokeLinejoin: "round",
              strokeMiterlimit: 10.7,
            }}
            id="rect10-3"
            width={83.744766}
            height={273.33612}
            x={-442.46094}
            y={451.83197}
            transform="matrix(-1.0000001,0,0,1.0000001,5.9165515e-5,-2.9457879e-5)"
            rx={15.504619}
            ry={14.339563}
          />
          <rect
            style={{
              opacity: 1,
              fill: "#868588",
              fillOpacity: 0.913725,
              stroke: "#283e49",
              strokeWidth: 0,
              strokeLinecap: "square",
              strokeLinejoin: "round",
              strokeMiterlimit: 10.7,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            id="rect12-7"
            width={664.69495}
            height={734.99994}
            x={-1118.3475}
            y={315}
            transform="matrix(-1.0000001,0,0,1.0000001,8.5679948e-4,-2.9457882e-5)"
            rx={15.504619}
            ry={14.33956}
          />
          <rect
            style={{
              opacity: 1,
              fill: "#a02632",
              fillOpacity: 1,
              stroke: "#283e49",
              strokeWidth: 0,
              strokeLinecap: "square",
              strokeLinejoin: "round",
              strokeMiterlimit: 10.7,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            id="rect11-6"
            width={4.2013426}
            height={8.4075842}
            x={1220.1401}
            y={709.67017}
            rx={0.58314788}
            ry={0.48026136}
            transform="matrix(-26.587799,0,0,29.857825,32888.843,-20386.524)"
          />
          <rect
            style={{
              opacity: 1,
              fill: "#a02632",
              fillOpacity: 1,
              stroke: "#283e49",
              strokeWidth: 0,
              strokeLinecap: "square",
              strokeLinejoin: "round",
              strokeMiterlimit: 10.7,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            id="rect8-1"
            width={176.88971}
            height={131.00005}
            x={-447.16104}
            y={332.71619}
            transform="scale(-1,1)"
            ry={15.504617}
            rx={15.504618}
          />
          <path
            d="m 456,315 h 660 q 10,0 10,10 v 725 H 448 V 325 q 0,-10 8,-10 z"
            id="path1-5-9-8"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="m 402,1063 h 724"
            strokeWidth={106.05}
            id="path2-5-2-9"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="M 264,328 448,328.69979 357,474 v 0 229 c -15,21 -22,45 -22,71 v 242 c 0,28 19.33333,43.3333 58,46 h 55 V 325"
            id="path3-9-1-7-2"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            sodipodi:nodetypes="cccccssccc"
          />
          <path
            d="M 354,473 V 704"
            id="path4-4-7-9-7"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="m 264,328 v 92 c 0,34.66667 20.81126,52.33333 62.43379,53 h 31.21689"
            id="path5-8-1-5-9"
            style={{
              opacity: 1,
              fill: "#a02632",
              fillOpacity: 1,
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            sodipodi:nodetypes="cscc"
          />
          <path
            d="m 226,341.13979 v 101.8605"
            id="path10-1-4-5"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="m 244.34768,353.21004 c 0.61225,28.67077 1.2756,57.67769 0.88692,79.76376"
            id="path10-1-4-4-4"
            style={{
              stroke: "#a02632",
              strokeWidth: 21.3851,
              strokeLinecap: "square",
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            inkscape:transform-center-x={-0.009543673}
            inkscape:transform-center-y={0.11693223}
            sodipodi:nodetypes="cc"
          />
          <path
            d="m 226,342 h 38"
            id="path12-5-3-3"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="m 226,445 h 38"
            id="path13-2-1-1"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="M 428,411 V 553"
            strokeWidth={59.6528}
            id="path22-7-2-2"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <rect
            x={368}
            y={358}
            width={21}
            height={22}
            fill="#050505"
            stroke="none"
            id="rect22-6-3-3"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <rect
            x={383}
            y={656}
            width={25}
            height={25}
            fill="#050505"
            stroke="none"
            id="rect23-1-3-3"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <ellipse
            cx={393.85883}
            cy={764.29706}
            fill="#ffffff"
            id="circle23-4-4-4"
            style={{
              fill: "#a02632",
              fillOpacity: 1,
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            rx={54.358845}
            ry={54.428833}
          />
        </g>
      </g>
      <g
        id="g1-2-1-8-4"
        role="button"
        tabIndex={0}
        aria-label="Open popup DOSIF001"
        onClick={openDosifPopup("dosif001", "DOSIF001")}
        onKeyDown={handleDosifKeyDown("dosif001", "DOSIF001")}
        transform="matrix(-0.01572811,0,0,0.01875805,714.24288,712.92979)"
        style={{
          strokeWidth: 7.35888,
          strokeDasharray: "none",
        }}
        inkscape:label="dosif001"
      >
        <g
          fill="none"
          stroke="#050505"
          strokeWidth={53.0248}
          strokeLinejoin="round"
          strokeLinecap="round"
          id="g23-4-8-5-2"
          style={{
            stroke: "#2f3e49",
            strokeWidth: 18.5676,
            strokeDasharray: "none",
            strokeOpacity: 1,
          }}
          transform="matrix(2.3913386,0,0,1.7854765,166.59629,-1578.7439)"
        >
          <rect
            style={{
              fill: "#a02632",
              fillOpacity: 1,
              stroke: "#283e49",
              strokeWidth: 0,
              strokeLinecap: "square",
              strokeLinejoin: "round",
              strokeMiterlimit: 10.7,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            id="rect10-3-7"
            width={83.744766}
            height={273.33612}
            x={-442.46094}
            y={451.83197}
            transform="matrix(-1.0000001,0,0,1.0000001,5.9165515e-5,-2.9457879e-5)"
            rx={15.504619}
            ry={14.339563}
          />
          <rect
            style={{
              opacity: 1,
              fill: "#868588",
              fillOpacity: 0.913725,
              stroke: "#283e49",
              strokeWidth: 0,
              strokeLinecap: "square",
              strokeLinejoin: "round",
              strokeMiterlimit: 10.7,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            id="rect12-7-7"
            width={664.69495}
            height={734.99994}
            x={-1118.3475}
            y={315}
            transform="matrix(-1.0000001,0,0,1.0000001,8.5679948e-4,-2.9457882e-5)"
            rx={15.504619}
            ry={14.33956}
          />
          <rect
            style={{
              opacity: 1,
              fill: "#a02632",
              fillOpacity: 1,
              stroke: "#283e49",
              strokeWidth: 0,
              strokeLinecap: "square",
              strokeLinejoin: "round",
              strokeMiterlimit: 10.7,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            id="rect11-6-9"
            width={4.2013426}
            height={8.4075842}
            x={1220.1401}
            y={709.67017}
            rx={0.58314788}
            ry={0.48026136}
            transform="matrix(-26.587799,0,0,29.857825,32888.843,-20386.524)"
          />
          <rect
            style={{
              opacity: 1,
              fill: "#a02632",
              fillOpacity: 1,
              stroke: "#283e49",
              strokeWidth: 0,
              strokeLinecap: "square",
              strokeLinejoin: "round",
              strokeMiterlimit: 10.7,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            id="rect8-1-3"
            width={176.88971}
            height={131.00005}
            x={-447.16104}
            y={332.71619}
            transform="scale(-1,1)"
            ry={15.504617}
            rx={15.504618}
          />
          <path
            d="m 456,315 h 660 q 10,0 10,10 v 725 H 448 V 325 q 0,-10 8,-10 z"
            id="path1-5-9-8-1"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="m 402,1063 h 724"
            strokeWidth={106.05}
            id="path2-5-2-9-9"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="M 264,328 448,328.69979 357,474 v 0 229 c -15,21 -22,45 -22,71 v 242 c 0,28 19.33333,43.3333 58,46 h 55 V 325"
            id="path3-9-1-7-2-8"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            sodipodi:nodetypes="cccccssccc"
          />
          <path
            d="M 354,473 V 704"
            id="path4-4-7-9-7-6"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="m 264,328 v 92 c 0,34.66667 20.81126,52.33333 62.43379,53 h 31.21689"
            id="path5-8-1-5-9-5"
            style={{
              opacity: 1,
              fill: "#a02632",
              fillOpacity: 1,
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            sodipodi:nodetypes="cscc"
          />
          <path
            d="m 226,341.13979 v 101.8605"
            id="path10-1-4-5-0"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="m 244.34768,353.21004 c 0.61225,28.67077 1.2756,57.67769 0.88692,79.76376"
            id="path10-1-4-4-4-2"
            style={{
              stroke: "#a02632",
              strokeWidth: 21.3851,
              strokeLinecap: "square",
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            inkscape:transform-center-x={-0.009543673}
            inkscape:transform-center-y={0.11693223}
            sodipodi:nodetypes="cc"
          />
          <path
            d="m 226,342 h 38"
            id="path12-5-3-3-8"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="m 226,445 h 38"
            id="path13-2-1-1-6"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <path
            d="M 428,411 V 553"
            strokeWidth={59.6528}
            id="path22-7-2-2-0"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <rect
            x={368}
            y={358}
            width={21}
            height={22}
            fill="#050505"
            stroke="none"
            id="rect22-6-3-3-2"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <rect
            x={383}
            y={656}
            width={25}
            height={25}
            fill="#050505"
            stroke="none"
            id="rect23-1-3-3-4"
            style={{
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
          />
          <ellipse
            cx={393.85883}
            cy={764.29706}
            fill="#ffffff"
            id="circle23-4-4-4-8"
            style={{
              fill: "#a02632",
              fillOpacity: 1,
              stroke: "#2f3e49",
              strokeWidth: 18.5676,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            rx={54.358845}
            ry={54.428833}
          />
        </g>
      </g>
      <path
        style={{
          opacity: 1,
          fill: "#35ade9",
          fillOpacity: 0,
          stroke: "#35ade9",
          strokeWidth: 4,
          strokeLinecap: "square",
          strokeLinejoin: "round",
          strokeMiterlimit: 10.7,
          strokeDasharray: "none",
          strokeOpacity: 1,
        }}
        d="m 443.92232,815.77571 165.0588,-0.125 0.125,-64.45313 51.875,-0.17187"
        id="path12"
        sodipodi:nodetypes="cccc"
      />
      <path
        style={{
          fill: "#2f3e49",
          fillOpacity: 0,
          stroke: "#2f3e49",
          strokeWidth: 3,
          strokeLinejoin: "round",
          strokeMiterlimit: 10.7,
          strokeDasharray: "none",
          strokeOpacity: 1,
        }}
        d="m 720.60098,667.52271 53.38006,0.003"
        id="path9-7"
        sodipodi:nodetypes="cc"
      />
      <g
        transform="matrix(0.0256218,0,0,-0.03112019,247.78744,940.53131)"
        fill="#000000"
        stroke="none"
        id="g21"
        style={{
          strokeWidth: 7.08278497,
          strokeDasharray: "none",
          stroke: "#2f3e49",
          strokeOpacity: 1,
        }}
      >
        <rect
          style={{
            fill: "#a2a4af",
            fillOpacity: 1,
            stroke: "#2f3e49",
            strokeWidth: 7.08278497,
            strokeLinecap: "square",
            strokeLinejoin: "round",
            strokeMiterlimit: 10.7,
            strokeDasharray: "none",
            strokeOpacity: 1,
          }}
          id="rect5"
          width={740}
          height={179.7919}
          x={4750.0005}
          y={-8090.7925}
          transform="matrix(1,0,0,-1,1.3442029e-4,-7.2100709e-5)"
        />
        <path
          d="m 4736,8220 c -57,-29 -85,-58 -112,-115 -22,-46 -24,-63 -24,-212 v -162 l -47,-6 c -163,-21 -428,-70 -546,-100 -826,-210 -1331,-599 -1406,-1085 -9,-56 -11,-575 -9,-2030 3,-1862 4,-1958 21,-2010 30,-88 91,-182 165,-252 75,-71 145,-109 232,-127 41,-9 581,-11 2140,-9 2002,3 2087,4 2134,22 163,60 284,188 348,366 l 23,65 v 1990 1990 l -28,90 c -36,117 -66,180 -122,264 -117,175 -292,322 -552,465 -330,182 -715,292 -1260,361 l -53,7 v 159 c 0,171 -6,201 -56,266 -14,18 -47,44 -74,58 l -49,25 h -343 c -321,-1 -346,-2 -382,-20 z m 730,-163 c 19,-23 24,-39 24,-87 v -59 l -72,2 -73,1 -6,85 -5,86 -2,-87 -2,-88 -287,-2 -291.2178,0.2871 -1.7822,-5.71 287,0.4229 457.7295,-2.2034 v -64.6102 -93.3559 L 5038,7750 H 4750 V 7902.5771 8032 l 30,29 29,30 317,-3 316,-3 z m -16,-477 c 527,-37 1006,-155 1361,-336 362,-185 586,-413 655,-669 17,-64 19,-110 19,-575 0,-398 35.0338,-3.3816 26.0338,-2.3816 -7,1 -1081.7584,-1 -2374.7584,0 H 2761.517 v 0 c 0,0 1.483,560.3816 62.483,689.3816 52,108 104,179 202,273 181,174 406,300 734,412 323,110 678,178 1115,212 98,7 443,5 575,-4 z M 7480,3988 c 5.6725,-797.9869 -4,-1356 -10,-1391 -21,-132 -98,-233 -218,-290 l -67,-32 H 5115 3045 l -66,32 c -81,40 -140,102 -182,191 l -32,67 -3,1378 -0.483,1982.5177 H 5091.4687 7466.227 Z"
          id="path1"
          style={{
            fill: "#2f3e49",
            fillOpacity: 1,
            stroke: "#2f3e49",
            strokeWidth: 7.08278497,
            strokeOpacity: 1,
            strokeDasharray: "none",
            opacity: 1,
          }}
          sodipodi:nodetypes="ccsccsccccccccccccccccsccccccsccccccccccccccccccccccccccscccscccccsccccccccccccs"
        />
        <TankLevelVisual level={tankLevel} />
        <path
          d="m 6804.9662,5548.0142 c -14,-27 -13,-124 3,-144 11,-16 36,-17 257,-15 l 245,3 v 85 85 l -247,3 c -236,2 -248,1 -258,-17 z"
          id="path7-5"
          style={{
            fill: "#2f3e49",
            fillOpacity: 1,
            stroke: "#2f3e49",
            strokeWidth: 7.08278497,
            strokeOpacity: 1,
            strokeDasharray: "none",
          }}
        />
        <path
          d="m 6802.9705,4691.2493 c -5,-11 -10,-46 -10,-79 0,-93 -3,-92 253,-92 118,0 227,4 242,10 25,10 26,11 23,92 l -3,83 -247,3 c -236,2 -248,1 -258,-17 z"
          id="path13"
          style={{
            fill: "#2f3e49",
            fillOpacity: 1,
            strokeWidth: 7.08278497,
            strokeDasharray: "none",
            stroke: "#2f3e49",
            strokeOpacity: 1,
          }}
        />
        <path
          d="m 6804.9662,3825.9229 c -5,-11 -10,-46 -10,-79 0,-93 -3,-92 253,-92 118,0 227,4 242,10 25,10 26,11 23,92 l -3,83 -247,3 c -236,2 -248,1 -258,-17 z"
          id="path13-3"
          style={{
            fill: "#2f3e49",
            fillOpacity: 1,
            strokeWidth: 7.08278497,
            strokeDasharray: "none",
            stroke: "#2f3e49",
            strokeOpacity: 1,
          }}
        />
        <path
          d="m 2881,2650 c 0,-8 4,-22 9,-30 12,-18 12,-2 0,25 -6,13 -9,15 -9,5 z"
          id="path15"
          style={{
            strokeWidth: 7.08278497,
            strokeDasharray: "none",
            stroke: "#2f3e49",
            strokeOpacity: 1,
          }}
        />
        <path
          d="m 7265,2629 c -4,-6 -5,-12 -2,-15 2,-3 7,2 10,11 7,17 1,20 -8,4 z"
          id="path16"
          style={{
            strokeWidth: 7.08278497,
            strokeDasharray: "none",
            stroke: "#2f3e49",
            strokeOpacity: 1,
          }}
        />
        <path
          d="m 2911,2578 c 25,-47 62,-88 107,-118 25,-16 50,-30 56,-30 6,0 2,6 -9,11 -59,32 -99,67 -127,111 -33,50 -47,64 -27,26 z"
          id="path17"
          style={{
            strokeWidth: 7.08278497,
            strokeDasharray: "none",
            stroke: "#2f3e49",
            strokeOpacity: 1,
          }}
        />
        <path
          d="m 7190,2515 c -24,-25 -42,-45 -39,-45 3,0 25,20 49,45 24,25 42,45 39,45 -3,0 -25,-20 -49,-45 z"
          id="path18"
          style={{
            strokeWidth: 7.08278497,
            strokeDasharray: "none",
            stroke: "#2f3e49",
            strokeOpacity: 1,
          }}
        />
        <path
          d="m 7114,2454 c -18,-14 -18,-15 4,-4 12,6 22,13 22,15 0,8 -5,6 -26,-11 z"
          id="path19"
          style={{
            strokeWidth: 7.08278497,
            strokeDasharray: "none",
            stroke: "#2f3e49",
            strokeOpacity: 1,
          }}
        />
      </g>
      <g id="recirculation-tank-level-readout" pointerEvents="none" aria-hidden="true">
        <rect
          x={443.4}
          y={739.5}
          width={24}
          height={13}
          rx={3}
          fill="#ffffff"
          fillOpacity={0.94}
        />
        <text
          x={455.4}
          y={749}
          fill="#2f3e49"
          fontFamily="Calibri, Arial, sans-serif"
          fontSize={8.5}
          fontWeight={700}
          textAnchor="middle"
        >
          {`${Math.round(tankLevel)}%`}
        </text>
      </g>

      <path
        style={{
          fill: "#2f3e49",
          fillOpacity: 0,
          stroke: "#2f3e49",
          strokeWidth: 3,
          strokeLinejoin: "round",
          strokeMiterlimit: 10.7,
          strokeDasharray: "none",
          strokeOpacity: 1,
        }}
        d="m 992.98113,667.52271 52.49987,0.003"
        id="path9-7-8"
        sodipodi:nodetypes="cc"
      />
      <path
        style={{
          fill: "#2f3e49",
          fillOpacity: 0,
          stroke: "#2f3e49",
          strokeWidth: 3,
          strokeLinejoin: "round",
          strokeMiterlimit: 10.7,
          strokeDasharray: "none",
          strokeOpacity: 1,
        }}
        d="m 1246.3165,667.78898 53.38,0.003"
        id="path9-7-2"
        sodipodi:nodetypes="cc"
      />
    </g>
    <path
      style={{
        opacity: 1,
        fill: "#03f903",
        fillOpacity: 1,
        stroke: "#03f903",
        strokeWidth: 0.1,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      id="path3"
      sodipodi:type="arc"
      sodipodi:cx={1109.9691}
      sodipodi:cy={65.175385}
      sodipodi:rx={9.7764721}
      sodipodi:ry={9.5390091}
      sodipodi:start={3.1248947}
      sodipodi:end={3.1233266}
      sodipodi:arc-type="slice"
      d="m 1100.194,65.334659 a 9.7764721,9.5390091 0 0 1 9.608,-9.696891 9.7764721,9.5390091 0 0 1 9.9421,9.370864 9.7764721,9.5390091 0 0 1 -9.6002,9.704238 9.7764721,9.5390091 0 0 1 -9.9496,-9.363255 l 9.7748,-0.17423 z"
    />
    <text
      xmlSpace="preserve"
      style={{
        fontSize: 16,
        fontFamily: "Calibri",
        InkscapeFontSpecification: "Calibri",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        opacity: 1,
        fill: "#000303",
        fillOpacity: 1,
        stroke: "#000303",
        strokeWidth: 0.1,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      x={1153.6479}
      y={70.901566}
      id="text12"
    >
      <tspan
        sodipodi:role="line"
        id="tspan12"
        x={1153.6479}
        y={70.901566}
        style={{
          fontSize: 16,
        }}
      >
        {"Working"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontSize: 16,
        fontFamily: "Calibri",
        InkscapeFontSpecification: "Calibri",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        opacity: 1,
        fill: "#000303",
        fillOpacity: 1,
        stroke: "#000303",
        strokeWidth: 0.1,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      x={1147.3823}
      y={125.70233}
      id="text13"
    >
      <tspan sodipodi:role="line" id="tspan13" x={1147.3823} y={125.70233}>
        {"Failure"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontSize: 16,
        fontFamily: "Calibri",
        InkscapeFontSpecification: "Calibri",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000303",
        fillOpacity: 1,
        stroke: "#000303",
        strokeWidth: 0.1,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      x={1153.4255}
      y={151.26404}
      id="text13-6"
    >
      <tspan sodipodi:role="line" id="tspan13-1" x={1153.4255} y={151.26404}>
        {"Stopped"}
      </tspan>
    </text>
    <g inkscape:groupmode="layer" id="layer2" inkscape:label="Layer 2" />
    <path
      id="Vector_324-6-6-5-1-7-7-7-4"
      d="m 377.06107,235.87771 c 1.26138,0.0102 2.40165,0.9411 2.39338,2.17478 l -0.0703,10.17864 c -0.005,1.13105 -1.04694,2.1524 -2.42284,2.1433 -0.63079,-0.006 -1.26002,-0.21384 -1.65893,-0.57636 l -5.64138,-5.12646 c -0.85472,-0.77674 -0.84576,-2.0619 -0.0952,-2.93094 l 0.1155,-0.10216 5.71125,-5.05198 c 0.52029,-0.61354 1.03718,-0.71301 1.66788,-0.7089 z"
      fill="#00aeed"
      stroke="#ffffff"
      strokeWidth={2.1717}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#ffffff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      inkscape:transform-center-x={1.6988668}
      inkscape:transform-center-y={-3.3961664}
      inkscape:highlight-color="#aa6a31"
      onclick="12&#10;"
    />
    <path
      id="Vector_324-1-6-4"
      d="m 626.1294,608.95444 c -0.0142,0.86059 -0.74586,1.63383 -1.70575,1.62172 l -7.91956,-0.10096 c -0.87989,-0.0103 -1.66875,-0.7255 -1.65399,-1.66426 0.0106,-0.4303 0.17344,-0.85861 0.45773,-1.12889 l 4.02053,-3.8225 c 0.60914,-0.5792 1.60912,-0.56643 2.28108,-0.0494 l 0.0789,0.0793 3.89893,3.92304 c 0.47448,0.35816 0.54897,0.7113 0.54225,1.1416 z"
      fill="#00aeed"
      stroke="#ffffff"
      strokeWidth={2.1717}
      strokeMiterlimit={10}
      style={{
        fill: "#2a8b8b",
        fillOpacity: 1,
        stroke: "#2a8b8b",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      inkscape:transform-center-x={-0.10221554}
      inkscape:transform-center-y={-0.46324031}
      inkscape:highlight-color="#aa6a31"
      onclick="12&#10;"
    />
    <path
      id="Vector_324-1-6-4-1"
      d="m 898.2795,608.95444 c -0.0142,0.86059 -0.74586,1.63383 -1.70575,1.62172 l -7.91956,-0.10096 c -0.87989,-0.0103 -1.66875,-0.7255 -1.65399,-1.66426 0.0106,-0.4303 0.17344,-0.85861 0.45773,-1.12889 l 4.02053,-3.8225 c 0.60914,-0.5792 1.60912,-0.56643 2.28108,-0.0494 l 0.0789,0.0793 3.89893,3.92304 c 0.47448,0.35816 0.54897,0.7113 0.54225,1.1416 z"
      fill="#00aeed"
      stroke="#ffffff"
      strokeWidth={2.1717}
      strokeMiterlimit={10}
      style={{
        fill: "#2a8b8b",
        fillOpacity: 1,
        stroke: "#2a8b8b",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      inkscape:transform-center-x={-0.10221554}
      inkscape:transform-center-y={-0.46324031}
      inkscape:highlight-color="#aa6a31"
      onclick="12&#10;"
    />
    <path
      id="Vector_324-1-6-4-4"
      d="m 559.81654,737.81136 c -0.86059,-0.0142 -1.63384,-0.74582 -1.62175,-1.70571 l 0.1008,-7.91957 c 0.0103,-0.87989 0.72547,-1.66876 1.66423,-1.65402 0.4303,0.0106 0.85861,0.17342 1.1289,0.45771 l 3.82257,4.02045 c 0.57922,0.60914 0.56647,1.60911 0.0495,2.28108 l -0.0793,0.0789 -3.92296,3.89901 c -0.35815,0.47449 -0.71129,0.54899 -1.14159,0.54227 z"
      fill="#00aeed"
      stroke="#ffffff"
      strokeWidth={2.1717}
      strokeMiterlimit={10}
      style={{
        fill: "#35ade9",
        fillOpacity: 1,
        stroke: "#35ade9",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      inkscape:transform-center-x={-0.4632875}
      inkscape:transform-center-y={0.10224177}
      inkscape:highlight-color="#aa6a31"
      onclick="12&#10;"
    />
  </svg>
      {pumpPopup ? (
        <SmallPumpPopup
          pumpPopup={pumpPopup}
          pumpColor={pumpStateColor || pumpPopup.color}
          pumpStateLabel={pumpStateLabel}
          canControl={canControl}
          actionPending={pumpActionPending}
          actionError={pumpActionError}
          pendingPumpAction={pendingPumpAction}
          closePumpPopup={closePumpPopup}
          handlePopupClick={handlePopupClick}
          handleStartPump={handleStartPump}
          handleStopPump={handleStopPump}
          confirmPumpAction={confirmPumpAction}
          cancelPumpAction={cancelPumpAction}
        />
      ) : null}
      {dosifPopup ? (
        <DosifPopup
          dosifPopup={dosifPopup}
          canControl={canControl}
          onClose={closeDosifPopup}
          onWriteNumericControl={onWriteNumericControl}
        />
      ) : null}
    </>
  );
};
export default SVGComponent;
