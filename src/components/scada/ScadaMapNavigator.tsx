import { useEffect } from "react";

import ScadaMapRenderer from "./ScadaMapRenderer";
import type { RealtimeTagLookup, ResolvedScadaMap } from "../../types/scada-layouts";

interface Props {
  heading: string;
  title: string;
  maps: ResolvedScadaMap[];
  activeMapIndex: number;
  onActiveMapIndexChange: (nextIndex: number) => void;
  tagLookup: RealtimeTagLookup;
  equipmentTagLookup?: RealtimeTagLookup;
  loading?: boolean;
  plcStatus?: "online" | "offline";
  localTime?: string | null;
  timezone?: string | null;
  canControl?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;

  return (
    tagName === "INPUT" ||
    tagName === "SELECT" ||
    tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

export default function ScadaMapNavigator({
  heading,
  title,
  maps,
  activeMapIndex,
  onActiveMapIndexChange,
  tagLookup,
  equipmentTagLookup,
  loading = false,
  plcStatus,
  localTime,
  timezone,
  canControl = true,
}: Props) {
  const activeMap = maps[activeMapIndex] ?? maps[0] ?? null;

  useEffect(() => {
    if (maps.length <= 1) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isTypingTarget(event.target)
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onActiveMapIndexChange(activeMapIndex > 0 ? activeMapIndex - 1 : maps.length - 1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        onActiveMapIndexChange(activeMapIndex < maps.length - 1 ? activeMapIndex + 1 : 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeMapIndex, maps.length, onActiveMapIndexChange]);

  return (
    <>
      <ScadaMapRenderer
        heading={heading}
        title={title}
        activeMap={activeMap}
        tagLookup={tagLookup}
        equipmentTagLookup={equipmentTagLookup}
        loading={loading}
        plcStatus={plcStatus}
        localTime={localTime}
        timezone={timezone}
        canControl={canControl}
      />
    </>
  );
}
