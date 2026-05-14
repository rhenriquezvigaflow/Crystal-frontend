import { memo } from "react";

export interface ScadaDevtoolsStatusItem {
  id: string;
  type: string;
  label: string;
  tag: string | null;
  source_tags: string[];
  svg_target: string;
  status: string;
  value: unknown;
}

interface Props {
  items: ScadaDevtoolsStatusItem[];
  layoutId: string;
  title: string;
  localTime?: string | null;
  timezone?: string | null;
}

function ScadaDevtoolsStatus(_props: Props) {
  return null;
}

export default memo(ScadaDevtoolsStatus);
