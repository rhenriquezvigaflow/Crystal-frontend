import type { ScadaEquipmentStateBinding } from "./layoutEquipmentState";
import {
  getDiscreteStateColor,
  normalizeDiscreteState,
} from "./layoutSceneResolver";
import type { ScadaRenderRule } from "../types/scada-layouts";

const SHAPE_SELECTOR = "path, circle, ellipse, rect, polygon, polyline, line";
const STATE_CLASSES = [
  "scada-equipment-state--0",
  "scada-equipment-state--1",
  "scada-equipment-state--2",
  "scada-equipment-state--3",
];
const TYPE_CLASSES = [
  "scada-equipment--pump",
  "scada-equipment--valve",
  "scada-equipment--tank",
  "scada-equipment--chemical",
];
const SNAPSHOT_ATTRS = [
  "fill",
  "stroke",
  "opacity",
  "transform",
  "y",
  "height",
  "style",
  "class",
];

interface ElementSnapshot {
  node: SVGElement;
  className: string | null;
  style: string | null;
  attrs: Record<string, string | null>;
}

interface TankRectGeometry {
  kind: "rect";
  node: SVGRectElement;
  baseY: number;
  maxHeight: number;
}

interface TankPathGeometry {
  kind: "path";
  node: SVGGraphicsElement;
  height: number;
}

type TankGeometry = TankRectGeometry | TankPathGeometry;

export interface ScadaEquipmentRenderer {
  update(value: unknown): void;
  dispose(): void;
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
  const nodes = isPaintableShape(root) ? [root, ...descendants] : descendants.length ? descendants : [root];
  return Array.from(new Set(nodes));
}

function snapshotNodes(nodes: SVGElement[]): ElementSnapshot[] {
  return nodes.map((node) => ({
    node,
    className: node.getAttribute("class"),
    style: node.getAttribute("style"),
    attrs: Object.fromEntries(
      SNAPSHOT_ATTRS.map((attr) => [attr, node.getAttribute(attr)]),
    ),
  }));
}

function restoreNodes(snapshots: ElementSnapshot[]): void {
  snapshots.forEach(({ node, className, style, attrs }) => {
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

    Object.entries(attrs).forEach(([attr, value]) => {
      if (attr === "class" || attr === "style") return;
      if (value === null) {
        node.removeAttribute(attr);
      } else {
        node.setAttribute(attr, value);
      }
    });
  });
}

function getRuleStateKey(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.round(value));
  }

  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }

  const normalizedDiscreteState = normalizeDiscreteState(value);
  return normalizedDiscreteState === null ? null : String(normalizedDiscreteState);
}

function resolveRuleState(rule: ScadaRenderRule, value: unknown) {
  const stateKey = getRuleStateKey(value);
  if (stateKey) {
    const exactMatch =
      rule.states[stateKey] ??
      rule.states[stateKey.toLowerCase()] ??
      rule.states[stateKey.toUpperCase()];

    if (exactMatch) return exactMatch;
  }

  if (rule.mode === "multi_level") {
    const discreteState = normalizeDiscreteState(value);
    if (discreteState === 1) return rule.states.HIGH ?? null;
    if (discreteState === 2) return rule.states.MEDIUM ?? null;
    if (discreteState === 0) return rule.states.LOW ?? null;
  }

  return null;
}

export function getScadaEquipmentStateColor(
  rule: ScadaRenderRule,
  value: unknown,
): string {
  return resolveRuleState(rule, value)?.color ?? getDiscreteStateColor(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function setTargetClasses(root: SVGElement, type: ScadaEquipmentStateBinding["type"], value: unknown): void {
  root.classList.add("scada-equipment-target", `scada-equipment--${type}`);
  TYPE_CLASSES
    .filter((className) => className !== `scada-equipment--${type}`)
    .forEach((className) => root.classList.remove(className));

  STATE_CLASSES.forEach((className) => root.classList.remove(className));
  const state = normalizeDiscreteState(value);
  if (state !== null) {
    root.classList.add(`scada-equipment-state--${state}`);
  }
}

function resolveTankGeometry(node: SVGElement): TankGeometry | null {
  if (node instanceof SVGRectElement) {
    const baseY = Number.parseFloat(node.getAttribute("y") ?? "");
    const maxHeight = Number.parseFloat(node.getAttribute("height") ?? "");

    if (!Number.isFinite(baseY) || !Number.isFinite(maxHeight) || maxHeight <= 0) {
      return null;
    }

    return {
      kind: "rect",
      node,
      baseY,
      maxHeight,
    };
  }

  if (node instanceof SVGGraphicsElement) {
    const bbox = node.getBBox();
    if (!Number.isFinite(bbox.height) || bbox.height <= 0) return null;

    return {
      kind: "path",
      node,
      height: bbox.height,
    };
  }

  return null;
}

function resolveTankFillNode(root: SVGElement): SVGElement | null {
  const preferredSelectors = [
    '[data-scada-role="tank-water"]',
    '[data-role="tank-water"]',
    '[id$="__water"]',
    "rect",
    "path",
  ];

  if (root instanceof SVGRectElement || root instanceof SVGPathElement) {
    return root;
  }

  for (const selector of preferredSelectors) {
    const candidate = root.querySelector(selector);
    if (candidate instanceof SVGElement) {
      return candidate;
    }
  }

  return root;
}

function createDiscreteRenderer(
  root: SVGElement,
  binding: ScadaEquipmentStateBinding,
  rule: ScadaRenderRule,
): ScadaEquipmentRenderer {
  const paintableNodes = collectPaintableNodes(root);
  const snapshots = snapshotNodes(Array.from(new Set([root, ...paintableNodes])));

  return {
    update(value: unknown) {
      const color = getScadaEquipmentStateColor(rule, value);
      const state = normalizeDiscreteState(value);

      setTargetClasses(root, binding.type, value);
      root.style.setProperty("--scada-state-color", color);

      paintableNodes.forEach((node) => {
        node.classList.add("scada-equipment-target");
        node.style.setProperty("--scada-state-color", color);
        node.style.setProperty("fill", color, "important");
        node.style.setProperty("stroke", color, "important");
        node.style.setProperty("opacity", state === null ? "0.72" : "1");
      });
    },
    dispose() {
      restoreNodes(snapshots);
    },
  };
}

function createTankRenderer(
  root: SVGElement,
  binding: ScadaEquipmentStateBinding,
  rule: ScadaRenderRule,
): ScadaEquipmentRenderer {
  const fillNode = resolveTankFillNode(root);
  const geometry = fillNode ? resolveTankGeometry(fillNode) : null;
  const paintableNodes = fillNode ? [fillNode] : [root];
  const snapshots = snapshotNodes(Array.from(new Set([root, ...paintableNodes])));

  const applyTankLevel = (levelRatio: number, color: string) => {
    if (!fillNode || !geometry) return;

    fillNode.classList.add("scada-equipment-target");
    fillNode.style.setProperty("fill", color, "important");
    fillNode.style.setProperty("stroke", color, "important");
    fillNode.style.setProperty("opacity", "1");

    if (geometry.kind === "rect") {
      const nextHeight = geometry.maxHeight * levelRatio;
      const nextY = geometry.baseY + (geometry.maxHeight - nextHeight);
      geometry.node.setAttribute("height", nextHeight.toFixed(2));
      geometry.node.setAttribute("y", nextY.toFixed(2));
      geometry.node.style.removeProperty("transform");
      return;
    }

    const translateY = geometry.height * (1 - levelRatio);
    fillNode.style.setProperty("transform-box", "fill-box");
    fillNode.style.setProperty("transform-origin", "center bottom");
    fillNode.style.setProperty(
      "transform",
      `translateY(${translateY.toFixed(2)}px) scaleY(${Math.max(levelRatio, 0.001).toFixed(4)})`,
    );
  };

  return {
    update(value: unknown) {
      const nextState = resolveRuleState(rule, value);
      const targetLevel = clamp((nextState?.level ?? 0) / 100, 0, 1);
      const targetColor = nextState?.color ?? getScadaEquipmentStateColor(rule, value);

      setTargetClasses(root, binding.type, value);
      root.style.setProperty("--scada-state-color", targetColor);

      if (!geometry || !fillNode) {
        return;
      }

      applyTankLevel(targetLevel, targetColor);
    },
    dispose() {
      restoreNodes(snapshots);
    },
  };
}

export function createScadaEquipmentRenderer(
  stage: HTMLDivElement,
  binding: ScadaEquipmentStateBinding,
  rule: ScadaRenderRule,
): ScadaEquipmentRenderer | null {
  const normalizedTarget = String(binding.svg_target ?? "").trim();
  if (!normalizedTarget) return null;

  const root = queryTarget(stage, normalizedTarget);
  if (!root) return null;

  if (binding.type === "tank") {
    return createTankRenderer(root, binding, rule);
  }

  return createDiscreteRenderer(root, binding, rule);
}
