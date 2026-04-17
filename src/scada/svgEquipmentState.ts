import { getDiscreteStateColor, getDiscreteStateLabel, normalizeDiscreteState } from "./layoutSceneResolver";

export type EquipmentRole = "pump" | "valve";

const SCADA_TARGET_BASE_CLASS = "scada-equipment-target";
const ROLE_CLASS_PREFIX = "scada-equipment--";
const STATE_CLASS_PREFIX = "scada-equipment-state--";
const ALL_STATE_CLASSES = [
  `${STATE_CLASS_PREFIX}unknown`,
  `${STATE_CLASS_PREFIX}0`,
  `${STATE_CLASS_PREFIX}1`,
  `${STATE_CLASS_PREFIX}2`,
  `${STATE_CLASS_PREFIX}3`,
];

function normalizeTargetKey(value: string): string {
  return value.trim().toUpperCase();
}

function getStateClass(state: number | null): string {
  return `${STATE_CLASS_PREFIX}${state === null ? "unknown" : state}`;
}

function getEquipmentOpacity(role: EquipmentRole, state: number | null): string {
  if (state === null) return "0.72";
  if (role === "pump" && state === 1) return "1";
  if (role === "valve" && state === 2) return "1";
  return "0.96";
}

function matchesScadaTarget(node: SVGElement, targetKey: string): boolean {
  const candidates = [
    node.getAttribute("data-scada-id"),
    node.getAttribute("id"),
    node.getAttribute("inkscape:label"),
    node.getAttribute("label"),
    node.getAttribute("data-name"),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeTargetKey(value));

  return candidates.includes(targetKey);
}

export function findScadaEquipmentTargets(root: ParentNode, svgTarget: string): SVGElement[] {
  const targetKey = normalizeTargetKey(svgTarget);
  const nodes = Array.from(root.querySelectorAll<SVGElement>("svg *"));
  const dataScadaMatches = nodes.filter(
    (node) => normalizeTargetKey(node.getAttribute("data-scada-id") ?? "") === targetKey,
  );
  if (dataScadaMatches.length) return dataScadaMatches;

  const idMatches = nodes.filter(
    (node) => normalizeTargetKey(node.getAttribute("id") ?? "") === targetKey,
  );
  if (idMatches.length) return idMatches;

  return nodes.filter((node) => matchesScadaTarget(node, targetKey));
}

function resetScadaEquipmentNode(node: SVGElement, role: EquipmentRole) {
  node.classList.remove(
    SCADA_TARGET_BASE_CLASS,
    `${ROLE_CLASS_PREFIX}${role}`,
    ...ALL_STATE_CLASSES,
  );
  node.style.removeProperty("--scada-state-color");
  node.style.removeProperty("fill");
  node.style.removeProperty("stroke");
  node.style.removeProperty("opacity");
  node.style.removeProperty("transform-box");
  node.style.removeProperty("transform-origin");
  node.removeAttribute("aria-label");
}

export function applyScadaEquipmentState(
  root: ParentNode,
  svgTarget: string,
  role: EquipmentRole,
  label: string,
  value: unknown,
): () => void {
  const targets = findScadaEquipmentTargets(root, svgTarget);
  if (!targets.length) return () => undefined;

  const state = normalizeDiscreteState(value);
  const color = getDiscreteStateColor(value);
  const stateClass = getStateClass(state);
  const ariaLabel = `${label}: ${getDiscreteStateLabel(value)}`;

  targets.forEach((target) => {
    resetScadaEquipmentNode(target, role);
    target.classList.add(
      SCADA_TARGET_BASE_CLASS,
      `${ROLE_CLASS_PREFIX}${role}`,
      stateClass,
    );
    target.style.setProperty("--scada-state-color", color);
    target.style.fill = color;

    if (target.getAttribute("stroke") || target.style.stroke) {
      target.style.stroke = color;
    }

    target.style.opacity = getEquipmentOpacity(role, state);
    target.style.transformBox = "fill-box";
    target.style.transformOrigin = "center";
    target.setAttribute("aria-label", ariaLabel);
  });

  return () => {
    targets.forEach((target) => resetScadaEquipmentNode(target, role));
  };
}
