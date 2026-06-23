import { httpClient } from "./httpClient";

export type SmallPumpAction = "partir" | "parar";

interface SmallControlResponse {
  ok: boolean;
  product_type: "small";
  lagoon_id: string;
  action: SmallPumpAction;
  pulse_seconds: number;
}

interface SmallValueControlResponse {
  ok: boolean;
  product_type: "small";
  lagoon_id: string;
  module_id: string;
  command_id: string;
  value: number | boolean;
  data_type: string;
}

export async function sendSmallPumpControl(
  lagoonId: string,
  action: SmallPumpAction,
  moduleId?: string | null,
): Promise<SmallControlResponse> {
  const { data } = await httpClient.post<SmallControlResponse>("/small/control", {
    lagoon_id: lagoonId,
    action,
    payload: moduleId ? { module_id: moduleId } : {},
  });
  return data;
}

export async function sendSmallNumericControl(
  lagoonId: string,
  moduleId: string,
  commandId: string,
  value: number,
): Promise<SmallValueControlResponse> {
  const { data } = await httpClient.put<SmallValueControlResponse>(
    "/small/control/value",
    {
      lagoon_id: lagoonId,
      module_id: moduleId,
      command_id: commandId,
      value,
    },
  );
  return data;
}
