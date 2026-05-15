import { useContext } from "react";

import { LagoonsContext } from "./lagoonsContextValue";

export function useLagoons() {
  const context = useContext(LagoonsContext);
  if (!context) throw new Error("useLagoons must be used within LagoonsProvider");
  return context;
}
