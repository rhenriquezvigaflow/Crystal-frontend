import {
  getDiscreteStateColor,
  normalizeDiscreteState,
} from "./layoutSceneResolver";

export type EquipmentRole = "pump" | "valve";

const SHAPE_SELECTOR = "path, circle, ellipse, rect, polygon, polyline, line";
const STATE_CLASSES = [
  "scada-equipment-state--0",
  "scada-equipment-state--1",
  "scada-equipment-state--2",
  "scada-equipment-state--3",
];
const ROLE_CLASSES = ["scada-equipment--pump", "scada-equipment--valve"];

interface ElementSnapshot {
  node: SVGElement;
  className: string | null;
  style: string | null;
}

function isSvgElement(value: Element | null): value is SVGElement {
  return value instanceof SVGElement;
}

function isPaintableShape(node: SVGElement): boolean {
  return SHAPE_SELECTOR
    .split(",")
    .map((selector) => selector.trim())
    .includes(node.tagName.toLowerCase());
}

function queryTarget(stage: HTMLDivElement, svgTarget: string): SVGElement | null {
  const safeTarget = svgTarget.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const target = stage.querySelector(`[id="${safeTarget}"]`);
  return isSvgElement(target) ? target : null;
}

function collectPaintableNodes(root: SVGElement): SVGElement[] {
  const descendants = Array.from(root.querySelectorAll<SVGElement>(SHAPE_SELECTOR));
  if (isPaintableShape(root)) {
    return [root, ...descendants];
  }
  return descendants.length ? descendants : [root];
}

function snapshotNodes(nodes: SVGElement[]): ElementSnapshot[] {
  return nodes.map((node) => ({
    node,
    className: node.getAttribute("class"),
    style: node.getAttribute("style"),
  }));
}

function restoreNodes(snapshots: ElementSnapshot[]): void {
  snapshots.forEach(({ node, className, style }) => {
    if (className === null) {
      node.removeAttribute("class");
    } else {
      node.setAttribute("class", className);
    }

    if (style === null) {
      node.removeAttribute("style");
    } else {
      node.setAttribute("style", style);
    }
  });
}

export function applyScadaEquipmentState(
  stage: HTMLDivElement,
  svgTarget: string,
  role: EquipmentRole,
  _label: string,
  value: unknown,
): () => void {
  const normalizedTarget = String(svgTarget ?? "").trim();
  if (!normalizedTarget) return () => undefined;

  const root = queryTarget(stage, normalizedTarget);
  if (!root) return () => undefined;

  const paintableNodes = collectPaintableNodes(root);
  const snapshots = snapshotNodes([root, ...paintableNodes]);
  const state = normalizeDiscreteState(value);
  const color = getDiscreteStateColor(value);

  root.classList.add("scada-equipment-target", `scada-equipment--${role}`);
  ROLE_CLASSES
    .filter((className) => className !== `scada-equipment--${role}`)
    .forEach((className) => root.classList.remove(className));
  root.style.setProperty("--scada-state-color", color);

  STATE_CLASSES.forEach((className) => root.classList.remove(className));
  if (state !== null) {
    root.classList.add(`scada-equipment-state--${state}`);
  }

  paintableNodes.forEach((node) => {
    node.classList.add("scada-equipment-target");
    node.style.setProperty("--scada-state-color", color);
    node.style.setProperty("fill", color, "important");
    node.style.setProperty("stroke", color, "important");
    node.style.setProperty("opacity", state === null ? "0.72" : "1");
  });

  return () => {
    restoreNodes(snapshots);
  };
}
