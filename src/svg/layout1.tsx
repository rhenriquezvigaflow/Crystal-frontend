import * as React from "react";

type DeviceCode =
  | "P-017"
  | "BOMBA-FILTRACION"
  | "BOMBA-RETROLAVADO"
  | "BOMBA-RETORNO-CLARIFICADO"
  | "VE-288"
  | "VE-322"
  | "VE-320"
  | "VE-318"
  | "P-015"
  | "P-016";

type DeviceState = 0 | 1 | 2 | 3;

const DEVICE_STATE_COLORS: Record<DeviceState, string> = {
  0: "#ef4444",
  1: "#22c55e",
  2: "#3b82f6",
  3: "#facc15",
};

const DEFAULT_DEVICE_COLOR = DEVICE_STATE_COLORS[0];

const DEVICE_TAG_ALIASES: Partial<Record<DeviceCode, string[]>> = {
  "P-017": ["CL-FLO12", "CL-FL012"],
  "BOMBA-FILTRACION": ["FILTRACION-RETROLAVADO"],
  "BOMBA-RETROLAVADO": ["FILTRACION-RETROLAVADO"],
  "BOMBA-RETORNO-CLARIFICADO": ["RETORNO-CLARIFICADO"],
  "P-015": ["P-008"],
  "P-016": ["P-007"],
};

function normalizeTagKey(key: string) {
  return key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function buildNormalizedTags(tags: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(tags ?? {}).map(([key, value]) => [normalizeTagKey(key), value]),
  );
}

function getDeviceTagCandidates(deviceCode: DeviceCode) {
  const aliases = DEVICE_TAG_ALIASES[deviceCode] ?? [];
  const baseCandidates = [deviceCode, ...aliases].flatMap((code) => {
    const compactCode = code.replace(/[^a-zA-Z0-9]/g, "");
    const underscoredCode = code
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_");
    const dashedCode = code
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-");

    return [
      code,
      code.toUpperCase(),
      code.toLowerCase(),
      compactCode,
      compactCode.toUpperCase(),
      compactCode.toLowerCase(),
      underscoredCode,
      underscoredCode.toUpperCase(),
      underscoredCode.toLowerCase(),
      dashedCode,
      dashedCode.toUpperCase(),
      dashedCode.toLowerCase(),
    ];
  });

  const suffixes = [
    "",
    "_SCADA",
    "_scada",
    "_STS_SCADA",
    "_sts_scada",
    "_STATUS_SCADA",
    "_status_scada",
    "_STATE_SCADA",
    "_state_scada",
  ];

  return Array.from(
    new Set(
      baseCandidates.flatMap((candidate) =>
        suffixes.map((suffix) => `${candidate}${suffix}`),
      ),
    ),
  );
}

function coerceDeviceState(value: unknown): DeviceState | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = Math.trunc(value);
    return parsed >= 0 && parsed <= 3 ? (parsed as DeviceState) : null;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    switch (normalized) {
      case "fault":
      case "falla":
      case "error":
      case "alarm":
      case "alarma":
        return 0;
      case "running":
      case "funcionando":
      case "open":
      case "abierta":
      case "abierto":
        return 1;
      case "moving":
      case "moviendose":
        return 2;
      case "stopped":
      case "detenida":
      case "detenido":
      case "closed":
      case "cerrada":
      case "cerrado":
        return 3;
      default: {
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? coerceDeviceState(parsed) : null;
      }
    }
  }

  return null;
}

function getDeviceColor(
  normalizedTags: Record<string, unknown>,
  deviceCode: DeviceCode,
) {
  for (const candidate of getDeviceTagCandidates(deviceCode)) {
    const state = coerceDeviceState(normalizedTags[normalizeTagKey(candidate)]);
    if (state !== null) return DEVICE_STATE_COLORS[state];
  }

  return DEFAULT_DEVICE_COLOR;
}

function getDeviceIndicatorStyle(color: string, strokeWidth: number) {
  return {
    fill: color,
    strokeWidth,
  };
}

const SVGComponent = ({
  tags = {},
  ...props
}: React.SVGProps<SVGSVGElement> & { tags?: Record<string, unknown> }) => {
  const normalizedTags = buildNormalizedTags(tags);
  const P017Color = getDeviceColor(normalizedTags, "P-017");
  const BombaFiltracionColor = getDeviceColor(normalizedTags, "BOMBA-FILTRACION");
  const BombaRetrolavadoColor = getDeviceColor(normalizedTags, "BOMBA-RETROLAVADO");
  const BombaRetornoClarificadoColor = getDeviceColor(
    normalizedTags,
    "BOMBA-RETORNO-CLARIFICADO",
  );
  const VE288Color = getDeviceColor(normalizedTags, "VE-288");
  const VE322Color = getDeviceColor(normalizedTags, "VE-322");
  const VE320Color = getDeviceColor(normalizedTags, "VE-320");
  const VE318Color = getDeviceColor(normalizedTags, "VE-318");
  const P015Color = getDeviceColor(normalizedTags, "P-015");
  const P016Color = getDeviceColor(normalizedTags, "P-016");

  return (
  <svg
    id="Capa_1"
    x={0}
    y={0}
    viewBox="0 0 1393.044 1150"
    xmlSpace="preserve"
    width={1393.044}
    height={1150}
    xmlnsXlink="http://www.w3.org/1999/xlink"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs id="defs489">
      <path id="rect2" d="M1134.477 31.501h230.267v31.501h-230.267z" />
      <path id="rect47" d="M322.323 656.748h49.645V681.2h-49.645z" />
      <path id="rect39" d="M601.669 165.484h257.364v39.518H601.669z" />
      <path id="rect38" d="M523.126 339.859h100.278v22.229H523.126z" />
      <path id="rect36" d="M241.015 625.941h113.172v22.355H241.015z" />
      <path id="rect35" d="M141.815 523.946h60.778v21.656h-60.778z" />
      <path id="rect34" d="M28.642 656.679h76.845v20.958H28.642z" />
      <path id="rect31" d="M653.885 527.439h107.584v39.121H653.885z" />
      <path id="rect20" d="M669.952 522.549h69.161v27.944h-69.161z" />
      <path id="rect18" d="M655.282 521.85h96.406v27.944h-96.406z" />
      <path id="rect17" d="M836.917 520.453h101.296v32.135H836.917z" />
      <path id="rect47-6" d="M322.323 656.748h49.645V681.2h-49.645z" />
      <path id="rect47-67" d="M322.323 656.748h49.645V681.2h-49.645z" />
      <path id="rect47-1" d="M322.323 656.748h49.645V681.2h-49.645z" />
      <path id="rect47-67-2" d="M322.323 656.748h49.645V681.2h-49.645z" />
      <path id="rect47-67-1" d="M322.323 656.748h49.645V681.2h-49.645z" />
      <path id="rect47-6-9" d="M322.323 656.748h49.645V681.2h-49.645z" />
      <path id="rect47-5" d="M322.323 656.748h49.645V681.2h-49.645z" />
      <path id="rect38-8" d="M523.126 339.859h100.278v22.229H523.126z" />
      <path id="rect38-8-0" d="M523.126 339.859h100.278v22.229H523.126z" />
      <path id="rect38-8-0-5" d="M523.126 339.859h100.278v22.229H523.126z" />
      <path id="rect31-6" d="M653.885 527.439h107.584v39.121H653.885z" />
      <path id="rect31-6-7" d="M653.885 527.439h107.584v39.121H653.885z" />
      <linearGradient id="swatch12">
        <stop
          style={{
            stopColor: "#11063d",
            stopOpacity: 1,
          }}
          offset={0}
          id="stop12"
        />
      </linearGradient>
      <linearGradient id="swatch49">
        <stop
          style={{
            stopColor: "#000",
            stopOpacity: 1,
          }}
          offset={0}
          id="stop49"
        />
      </linearGradient>
      <linearGradient id="linearGradient26-2">
        <stop
          style={{
            stopColor: "#000",
            stopOpacity: 0.88195992,
          }}
          offset={0}
          id="stop40"
        />
        <stop
          style={{
            stopColor: "#000",
            stopOpacity: 0,
          }}
          offset={1}
          id="stop41"
        />
      </linearGradient>
      <linearGradient id="linearGradient26-1">
        <stop
          style={{
            stopColor: "#000",
            stopOpacity: 0.88195992,
          }}
          offset={0}
          id="stop38"
        />
        <stop
          style={{
            stopColor: "#000",
            stopOpacity: 0,
          }}
          offset={1}
          id="stop39"
        />
      </linearGradient>
      <linearGradient id="linearGradient26">
        <stop
          style={{
            stopColor: "#000",
            stopOpacity: 0.88195992,
          }}
          offset={0}
          id="stop36"
        />
        <stop
          style={{
            stopColor: "#000",
            stopOpacity: 0,
          }}
          offset={1}
          id="stop37"
        />
      </linearGradient>
      <linearGradient id="swatch35">
        <stop
          style={{
            stopColor: "#5d8a54",
            stopOpacity: 1,
          }}
          offset={0}
          id="stop35"
        />
      </linearGradient>
      <linearGradient id="linearGradient26-3">
        <stop
          style={{
            stopColor: "#000",
            stopOpacity: 0.88195992,
          }}
          offset={0}
          id="stop24"
        />
        <stop
          style={{
            stopColor: "#000",
            stopOpacity: 0,
          }}
          offset={1}
          id="stop26"
        />
      </linearGradient>
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
      <linearGradient
        xlinkHref="#linearGradient13"
        id="linearGradient16"
        gradientUnits="userSpaceOnUse"
        gradientTransform="matrix(.98512 0 0 1.00035 -1208.037 -43.738)"
        x1={1291.686}
        y1={314.19}
        x2={1278.187}
        y2={302.111}
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
        gradientTransform="matrix(1.40329 0 0 1.03328 -651.208 -854.407)"
        x1={1291.686}
        y1={314.19}
        x2={1278.187}
        y2={302.111}
      />
      <linearGradient
        xlinkHref="#linearGradient13"
        id="linearGradient1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="matrix(1.40329 0 0 1.03328 -500.978 -853.213)"
        x1={1291.686}
        y1={314.19}
        x2={1278.187}
        y2={302.111}
      />
      <linearGradient
        xlinkHref="#swatch12"
        id="linearGradient12"
        x1={1090.585}
        y1={95.016}
        x2={1353.869}
        y2={95.016}
        gradientUnits="userSpaceOnUse"
      />
    </defs>
    <style type="text/css" id="style1">
      {
        '.st0,.st1{fill:none;stroke:#008ba3;stroke-width:4;stroke-miterlimit:10}.st1{stroke:#00aeed}.st2{fill:#fff}.st3{fill:#e33f09}.st4{fill:#00cd98}.st5{fill:#3574e0}.st6{fill:#fbc43b}.st7{fill:#ff6200}.st8{fill:#666}.st9{font-family:"ArialMT"}.st10{font-size:14px}.st11{fill:#606060}.st12{font-family:"Arial-BoldMT"}.st13{font-size:17px}.st14{fill:#00e098}.st15,.st16{enable-background:new}.st15{opacity:.5;fill:none;stroke:#b3b3b3;stroke-width:.5;stroke-miterlimit:10}.st16{opacity:7.000000e-02;fill:#323e48}.st17{fill:#2f3e49}.st18{fill:#00aeed}.st19{opacity:.15;fill:#0e76e7;enable-background:new}.st20{font-size:11px}.st21{opacity:.6;fill:none;stroke:#cbcbcb;stroke-width:2;stroke-miterlimit:10;enable-background:new}.st22{fill:#cbcbcb}.st23{fill:none;stroke:#2f3e49;stroke-width:4;stroke-miterlimit:10}.st24{fill:#00a39b}.st25{fill:none;stroke:#35ace8;stroke-width:4;stroke-miterlimit:10}.st26{fill:#0e76e7}.st27{fill:#323e48}.st28,.st29{fill:none;stroke:#323e48;stroke-width:4;stroke-miterlimit:10}.st29{stroke:#fff;stroke-width:2}.st30{fill:#7c7c7c}.st31{font-size:9px}.st33{font-size:16px}.st34{font-size:13px}.st35{fill:#c6c6c6}.st36{font-size:10px}.st37{fill:#fff;stroke:#35ace8;stroke-width:4;stroke-miterlimit:10}.st38{enable-background:new}.st39,.st40{fill:#fff;stroke:#008ba3;stroke-width:4;stroke-miterlimit:10}.st40{fill:#00aeed;stroke:#fff}.bg{fill:#e9eaec}.panel{fill:#fff;stroke:#9aa3ad;stroke-width:2;rx:10}.pipe{fill:none;stroke:#7b8794;stroke-width:8}.flow{fill:#2f80ff}.equip{fill:#e7b84b;stroke:#9c7a1e;rx:10}.equip,.lagoon,.tank{stroke-width:2}.tank{rx:10;fill:#f5f7fa;stroke:#9aa3ad}.lagoon{fill:#2fd0e6;stroke:#0aa;rx:18}.label{font-family:Arial,Helvetica,sans-serif;fill:#1f2937;font-size:16px}.small{font-size:14px}.title{font-size:28px;font-weight:700}.status-green{fill:#22c55e}.status-red{fill:#ef4444}.status-yellow{fill:#f59e0b}'
      }
    </style>
    <path
      style={{
        opacity: 1,
        fill: "#fff",
        fillOpacity: 0,
        fillRule: "nonzero",
        stroke: "#35aae9",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 0.853007,
      }}
      d="m608.206 1011.334 66.824-.314"
      id="path64"
    />
    <path
      className="st26"
      id="rect37"
      style={{
        fill: "#0e76e7",
        strokeWidth: 1,
      }}
      d="M100.727 682.243h124.8v58.182h-124.8z"
    />
    <path
      className="st23"
      d="M225.427 666.348v71.504c0 1.093-.6 1.993-1.2 1.993h-122c-.7 0-1.2-.9-1.2-1.993v-71.504"
      id="path38"
      style={{
        fill: "none",
        stroke: "#2f3e49",
        strokeWidth: 4,
        strokeMiterlimit: 10,
      }}
    />
    <path
      className="st23"
      d="M169.089 913.769v71.504c0 1.093-.6 1.994-1.2 1.994h-122c-.7 0-1.2-.9-1.2-1.994V913.77"
      id="path38-9"
      style={{
        fill: "none",
        stroke: "#2f3e49",
        strokeWidth: 4,
        strokeMiterlimit: 10,
      }}
    />
    <g
      id="g24"
      transform="matrix(1.33727 0 0 1.33926 -278.58 -33.417)"
      style={{
        strokeWidth: 0.747236,
      }}
    >
      <path
        className="st17"
        d="M332 382.8h-17.4c-1.1-.3-2.2-.4-3.4-.4-8.1 0-14.6 6.5-14.6 14.6 0 4.1 1.7 7.8 4.3 10.4l-4.1 9c-.3.7.1 1.6.7 1.6h27.7c.6 0 .9-.9.6-1.6l-4.1-9.1c2.6-2.6 4.2-6.3 4.2-10.3q0-2.25-.6-4.2h6.8c1.4 0 2.6-1.2 2.6-2.7v-4.6c0-1.5-1.2-2.7-2.7-2.7"
        id="path23"
        style={{
          fill: "#2f3e49",
          strokeWidth: 0.747236,
        }}
      />
    </g>
    <g
      id="g27"
      transform="matrix(1.26637 0 0 1.30074 -257.788 -18.796)"
      style={{
        strokeWidth: 0.779157,
      }}
    >
      <g
        id="g26"
        style={{
          strokeWidth: 0.779157,
        }}
      >
        <image
          style={{
            overflow: "visible",
            opacity: 0.15,
            strokeWidth: 0.779157,
          }}
          width={40}
          height={40}
          xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAACXBIWXMAAAycAAAMnAGTj5aaAAAA GXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA8dJREFUeNrsmOlS2zAUhWNb2SHs he7v/1wtnZZQSMkeO1GlzrnM4VaO5STDLzxzxsbYyqeru1mNxtvxdrwdtY/klca0+wxoDgyWBCDt vtDJAeC00gCQVdebOrDJnpZLIf93huuM7jUIymtN1xuCtoeGZItlkHebJsmQRT1MAeVQAWCGLrWs 2RFQ4FpQx6nn1MV1k8b2ICunpdPcaQEtFXApqNkR0ADGQx05DaBjpz7uN/FeDqiZ0wQa4zzD/1Zk 2Z0hQ4Ae6MTpwunS6dzpFLA9BTkH1JPTyOnB6dHpD+5NYdkGuUgtSPZBBvRQ75zeQ1e4N4AlW3h/ BWtNAeUBh053OBuVEawGNTWDpIXl9DA3Tp+cPjt9BPApJtDB2JZ8cgareQue0XMZfsPS85buRVsy xfJ1scRXAPvq9MXpA5b9hKyY0g8XWM4TSFxCnpP0JBngRWoykYnaz7aNIPFWvAbkZ1hTrNjDc5mC 3AC+S1mgibFlAku4xZyi/Z81Y5db++I1/PAGVj3DBNolPmZx36j0VFBQjUk5QLdCaivKUgvkFax3 AQv2AdhU1YYDISVJ/lwAyvvpbwRVS61EYiLTjkAOYLVznAe0xCFAXdUynNt4bwAflYATPzUItufZ VS03Qx6R8x9TPjQlgGX1XsaUStWjyRpl8SjIlEpfH6B9iuIYwNCYAtoiGUpJzxNLI9ovGaxNEdop GbRu35lSFctorBd9aRoZ3VwSDQ2aNvY/kqpJxvyIVfkuug+sGJN7zTWN+1/3nlYMxM1qjogT5WVd S+Shq4z0nBs1iSCkbvfX1G7NUYOlxcpLrFC1KjzxJSkPgFZaUgaUdmuMTmaMrkZ6waIGqHTqK4w5 Vb1lrprgygaDuxiBHFEvOKBanaiSmJRMWGr1jCYtfeVMuZGNqd3aktJqDakcNqmtkrSUBCDZglOM 9UDlcASLrhTkc5mK/TKU9NOiSsO5zQYCbk1w0vyOMNEfTt+dbp1+AXaigzKLzF+hb+skkEbWKmJz asHYencA/AZIf32P/y/Ixyt9koOAu+sRLbF0MhNqenXLZgl2gvc90E9Y8LYE0Nb9ELMElChw+eFL 6ma6ylc5OzwCaoglHuLeTPljo050szU19JIi/p4s2Q1Yckb++EjnJ0pnRaiSmRoljEHFD5f0gfWA aA99QhRUDKaB7+5lYJNgp22WpKR7aQGqg7NEPn8FhqrLoqQc2kPuBSWBjSpTsmHVICuxxdbb4A6x 9ZdsSU1JAHKj8mh0J3WInV6dT7ft9trA9atvR8dC1jr+CjAAphWuxrXCynUAAAAASUVORK5CYII="
          transform="translate(293.273 379.5)scale(.875)"
          id="image24"
        />
        <g
          id="g25"
          style={{
            strokeWidth: 0.779157,
          }}
        >
          <circle
            className="st2"
            cx={311.1}
            cy={397.3}
            r={10.9}
            id="circle24"
            style={{
              fill: "#fff",
              strokeWidth: 0.779157,
            }}
          />
        </g>
      </g>
      <circle
        className="st19"
        cx={311.1}
        cy={397.1}
        r={8}
        id="circle26"
        style={{
          ...getDeviceIndicatorStyle(P017Color, 0.779157),
          opacity: 1,
        }}
      />
    </g>
    <path
      className="st1"
      id="line37"
      style={{
        fill: "none",
        stroke: "#2a8b8b",
        strokeWidth: 4,
        strokeMiterlimit: 10,
        strokeOpacity: 1,
      }}
      d="M75 496.402h43"
    />
    <path
      className="st26"
      id="rect37-8"
      style={{
        fill: "#0e76e7",
        strokeWidth: 1,
      }}
      d="M1221.205 499.962h124.8v58.182h-124.8z"
    />
    <path
      className="st23"
      d="M1345.266 485.31v72.716c0 1.112-.6 2.027-1.2 2.027H1222.09c-.7 0-1.2-.915-1.2-2.027V485.31"
      id="path38-2"
      style={{
        fill: "none",
        stroke: "#2f3e49",
        strokeWidth: 4.03337,
        strokeMiterlimit: 10,
      }}
    />
    <g
      id="g24-6"
      transform="matrix(1.33727 0 0 1.33926 -100.015 352.445)"
      style={{
        strokeWidth: 0.747236,
      }}
    >
      <path
        className="st17"
        d="M332 382.8h-17.4c-1.1-.3-2.2-.4-3.4-.4-8.1 0-14.6 6.5-14.6 14.6 0 4.1 1.7 7.8 4.3 10.4l-4.1 9c-.3.7.1 1.6.7 1.6h27.7c.6 0 .9-.9.6-1.6l-4.1-9.1c2.6-2.6 4.2-6.3 4.2-10.3q0-2.25-.6-4.2h6.8c1.4 0 2.6-1.2 2.6-2.7v-4.6c0-1.5-1.2-2.7-2.7-2.7"
        id="path23-5"
        style={{
          fill: "#2f3e49",
          strokeWidth: 0.747236,
        }}
      />
    </g>
    <g
      id="g24-6-8"
      transform="matrix(-1.22975 0 0 1.33926 1670.273 281.298)"
      style={{
        strokeWidth: 0.779219,
      }}
    >
      <path
        className="st17"
        d="M332 382.8h-17.4c-1.1-.3-2.2-.4-3.4-.4-8.1 0-14.6 6.5-14.6 14.6 0 4.1 1.7 7.8 4.3 10.4l-4.1 9c-.3.7.1 1.6.7 1.6h27.7c.6 0 .9-.9.6-1.6l-4.1-9.1c2.6-2.6 4.2-6.3 4.2-10.3q0-2.25-.6-4.2h6.8c1.4 0 2.6-1.2 2.6-2.7v-4.6c0-1.5-1.2-2.7-2.7-2.7"
        id="path23-5-6"
        style={{
          fill: "#2f3e49",
          strokeWidth: 0.779219,
        }}
      />
    </g>
    <g
      id="g27-2"
      transform="matrix(1.26637 0 0 1.30074 -78.949 366.05)"
      style={{
        strokeWidth: 0.779157,
      }}
    >
      <g
        id="g26-8"
        style={{
          strokeWidth: 0.779157,
        }}
      >
        <image
          style={{
            overflow: "visible",
            opacity: 0.15,
            strokeWidth: 0.779157,
          }}
          width={40}
          height={40}
          xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAACXBIWXMAAAycAAAMnAGTj5aaAAAA GXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA8dJREFUeNrsmOlS2zAUhWNb2SHs he7v/1wtnZZQSMkeO1GlzrnM4VaO5STDLzxzxsbYyqeru1mNxtvxdrwdtY/klca0+wxoDgyWBCDt vtDJAeC00gCQVdebOrDJnpZLIf93huuM7jUIymtN1xuCtoeGZItlkHebJsmQRT1MAeVQAWCGLrWs 2RFQ4FpQx6nn1MV1k8b2ICunpdPcaQEtFXApqNkR0ADGQx05DaBjpz7uN/FeDqiZ0wQa4zzD/1Zk 2Z0hQ4Ae6MTpwunS6dzpFLA9BTkH1JPTyOnB6dHpD+5NYdkGuUgtSPZBBvRQ75zeQ1e4N4AlW3h/ BWtNAeUBh053OBuVEawGNTWDpIXl9DA3Tp+cPjt9BPApJtDB2JZ8cgareQue0XMZfsPS85buRVsy xfJ1scRXAPvq9MXpA5b9hKyY0g8XWM4TSFxCnpP0JBngRWoykYnaz7aNIPFWvAbkZ1hTrNjDc5mC 3AC+S1mgibFlAku4xZyi/Z81Y5db++I1/PAGVj3DBNolPmZx36j0VFBQjUk5QLdCaivKUgvkFax3 AQv2AdhU1YYDISVJ/lwAyvvpbwRVS61EYiLTjkAOYLVznAe0xCFAXdUynNt4bwAflYATPzUItufZ VS03Qx6R8x9TPjQlgGX1XsaUStWjyRpl8SjIlEpfH6B9iuIYwNCYAtoiGUpJzxNLI9ovGaxNEdop GbRu35lSFctorBd9aRoZ3VwSDQ2aNvY/kqpJxvyIVfkuug+sGJN7zTWN+1/3nlYMxM1qjogT5WVd S+Shq4z0nBs1iSCkbvfX1G7NUYOlxcpLrFC1KjzxJSkPgFZaUgaUdmuMTmaMrkZ6waIGqHTqK4w5 Vb1lrprgygaDuxiBHFEvOKBanaiSmJRMWGr1jCYtfeVMuZGNqd3aktJqDakcNqmtkrSUBCDZglOM 9UDlcASLrhTkc5mK/TKU9NOiSsO5zQYCbk1w0vyOMNEfTt+dbp1+AXaigzKLzF+hb+skkEbWKmJz asHYencA/AZIf32P/y/Ixyt9koOAu+sRLbF0MhNqenXLZgl2gvc90E9Y8LYE0Nb9ELMElChw+eFL 6ma6ylc5OzwCaoglHuLeTPljo050szU19JIi/p4s2Q1Yckb++EjnJ0pnRaiSmRoljEHFD5f0gfWA aA99QhRUDKaB7+5lYJNgp22WpKR7aQGqg7NEPn8FhqrLoqQc2kPuBSWBjSpTsmHVICuxxdbb4A6x 9ZdsSU1JAHKj8mh0J3WInV6dT7ft9trA9atvR8dC1jr+CjAAphWuxrXCynUAAAAASUVORK5CYII="
          transform="translate(293.273 379.5)scale(.875)"
          id="image24-6"
        />
        <g
          id="g25-0"
          style={{
            strokeWidth: 0.779157,
          }}
        >
          <circle
            className="st2"
            cx={311.1}
            cy={397.3}
            r={10.9}
            id="circle24-2"
            style={{
              fill: "#fff",
              strokeWidth: 0.779157,
            }}
          />
        </g>
      </g>
      <circle
        className="st19"
        cx={311.1}
        cy={397.1}
        r={8}
        id="circle26-4"
        style={{
          ...getDeviceIndicatorStyle(BombaFiltracionColor, 0.779157),
          opacity: 1,
        }}
      />
    </g>
    <g
      id="g27-2-7"
      transform="matrix(1.26637 0 0 1.30074 893.695 296.463)"
      style={{
        strokeWidth: 0.779157,
      }}
    >
      <g
        id="g26-8-2"
        style={{
          strokeWidth: 0.779157,
        }}
      >
        <image
          style={{
            overflow: "visible",
            opacity: 0.15,
            strokeWidth: 0.779157,
          }}
          width={40}
          height={40}
          xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAACXBIWXMAAAycAAAMnAGTj5aaAAAA GXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA8dJREFUeNrsmOlS2zAUhWNb2SHs he7v/1wtnZZQSMkeO1GlzrnM4VaO5STDLzxzxsbYyqeru1mNxtvxdrwdtY/klca0+wxoDgyWBCDt vtDJAeC00gCQVdebOrDJnpZLIf93huuM7jUIymtN1xuCtoeGZItlkHebJsmQRT1MAeVQAWCGLrWs 2RFQ4FpQx6nn1MV1k8b2ICunpdPcaQEtFXApqNkR0ADGQx05DaBjpz7uN/FeDqiZ0wQa4zzD/1Zk 2Z0hQ4Ae6MTpwunS6dzpFLA9BTkH1JPTyOnB6dHpD+5NYdkGuUgtSPZBBvRQ75zeQ1e4N4AlW3h/ BWtNAeUBh053OBuVEawGNTWDpIXl9DA3Tp+cPjt9BPApJtDB2JZ8cgareQue0XMZfsPS85buRVsy xfJ1scRXAPvq9MXpA5b9hKyY0g8XWM4TSFxCnpP0JBngRWoykYnaz7aNIPFWvAbkZ1hTrNjDc5mC 3AC+S1mgibFlAku4xZyi/Z81Y5db++I1/PAGVj3DBNolPmZx36j0VFBQjUk5QLdCaivKUgvkFax3 AQv2AdhU1YYDISVJ/lwAyvvpbwRVS61EYiLTjkAOYLVznAe0xCFAXdUynNt4bwAflYATPzUItufZ VS03Qx6R8x9TPjQlgGX1XsaUStWjyRpl8SjIlEpfH6B9iuIYwNCYAtoiGUpJzxNLI9ovGaxNEdop GbRu35lSFctorBd9aRoZ3VwSDQ2aNvY/kqpJxvyIVfkuug+sGJN7zTWN+1/3nlYMxM1qjogT5WVd S+Shq4z0nBs1iSCkbvfX1G7NUYOlxcpLrFC1KjzxJSkPgFZaUgaUdmuMTmaMrkZ6waIGqHTqK4w5 Vb1lrprgygaDuxiBHFEvOKBanaiSmJRMWGr1jCYtfeVMuZGNqd3aktJqDakcNqmtkrSUBCDZglOM 9UDlcASLrhTkc5mK/TKU9NOiSsO5zQYCbk1w0vyOMNEfTt+dbp1+AXaigzKLzF+hb+skkEbWKmJz asHYencA/AZIf32P/y/Ixyt9koOAu+sRLbF0MhNqenXLZgl2gvc90E9Y8LYE0Nb9ELMElChw+eFL 6ma6ylc5OzwCaoglHuLeTPljo050szU19JIi/p4s2Q1Yckb++EjnJ0pnRaiSmRoljEHFD5f0gfWA aA99QhRUDKaB7+5lYJNgp22WpKR7aQGqg7NEPn8FhqrLoqQc2kPuBSWBjSpTsmHVICuxxdbb4A6x 9ZdsSU1JAHKj8mh0J3WInV6dT7ft9trA9atvR8dC1jr+CjAAphWuxrXCynUAAAAASUVORK5CYII="
          transform="translate(293.273 379.5)scale(.875)"
          id="image24-6-2"
        />
        <g
          id="g25-0-9"
          style={{
            strokeWidth: 0.779157,
          }}
        >
          <circle
            className="st2"
            cx={311.1}
            cy={397.3}
            r={10.9}
            id="circle24-2-4"
            style={{
              fill: "#fff",
              strokeWidth: 0.779157,
            }}
          />
        </g>
      </g>
      <circle
        className="st19"
        cx={311.1}
        cy={397.1}
        r={8}
        id="circle26-4-1"
        style={{
          ...getDeviceIndicatorStyle(BombaRetornoClarificadoColor, 0.779157),
          opacity: 1,
        }}
      />
    </g>
    <path
      d="m338.563 450.944 28.964-.213"
      style={{
        fill: "none",
        stroke: "#2f3e49",
        strokeWidth: 2.23914,
        strokeMiterlimit: 10,
      }}
      id="path1-38"
    />
    <path
      d="M508.07 297.288v68.832"
      id="path67-5"
      style={{
        fill: "none",
        stroke: "#2f3e49",
        strokeWidth: 3.67337,
        strokeMiterlimit: 10,
      }}
    />
    <g id="g9" transform="translate(-58.163 58.937)" />
    <g id="layer1" transform="matrix(1.00222 0 0 1 -71.023 164.8)">
      <path
        className="st16"
        d="M728.973 304.833c0-24.199-23.787-43.998-67.298-43.998-43.51 0-67.551 19.8-67.551 43.998v117.649c0 12.672 15.152 23.231 34.114 24.727v12.847h14.814v-12.583h35.13v12.583h14.814V447.21c19.978-.704 35.977-11.527 35.977-24.727V308.705z"
        id="path16-4-7"
        style={{
          opacity: 0.578838,
          fill: "#252d34",
          fillOpacity: 1,
          strokeWidth: 0.996673,
        }}
      />
      <text
        xmlSpace="preserve"
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 24,
          fontFamily: "Arial-BoldMT",
          InkscapeFontSpecification: "&quot",
          fontVariantLigatures: "normal",
          fontVariantCaps: "normal",
          fontVariantNumeric: "normal",
          fontVariantEastAsian: "normal",
          textAlign: "center",
          writingMode: "lr-tb",
          direction: "ltr",
          textAnchor: "middle",
          fill: "#efefef",
          fillOpacity: 1,
          stroke: "#030303",
          strokeWidth: 0,
          strokeLinecap: "square",
          strokeLinejoin: "round",
          strokeDasharray: "none",
          strokeOpacity: 1,
          paintOrder: "fill markers stroke",
        }}
        x={662.282}
        y={321.593}
        id="text32"
      >
        <tspan
          id="tspan32"
          x={662.282}
          y={321.593}
          style={{
            fontStyle: "normal",
            fontVariant: "normal",
            fontWeight: 400,
            fontStretch: "normal",
            fontSize: 24,
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
            fill: "#efefef",
            fillOpacity: 1,
          }}
        >
          {"FIS - 001"}
        </tspan>
      </text>
      <rect
        x={613.486}
        y={345.647}
        width={94.616}
        height={23.2}
        rx={8.396}
        fill="#26e000"
        id="rect2-7-6"
        style={{
          fill: "#e6e6e6",
          fillOpacity: 1,
          strokeWidth: 1,
        }}
        ry={8.396}
      />
    </g>
    <g
      id="g5"
      transform="matrix(.32847 0 0 .26511 541.266 544.824)"
      style={{
        strokeWidth: 1.19501,
      }}
    >
      <path
        className="st0"
        d="M61.2 44.4c-10.5 9.4-8.2 21.2.5 26.3 9.3 5.3 19.5 1.2 26.4-8 11.5-15.4 6.1-48-25.1-59.2 7.8 6.2 13.1 27.4-1.8 40.9"
        id="path1-24"
        style={{
          fill: "#00a09a",
          stroke: "#008ba3",
          strokeWidth: 4.78005,
          strokeMiterlimit: 10,
        }}
      />
      <path
        className="st1"
        d="M43.7 61C40.1 47.4 28.5 44.1 20 49.5c-8.9 5.9-9.9 16.8-4.8 27.1 8.5 17.2 40 27.2 64.1 4.5-9 4.3-30.3-.6-35.6-20.1"
        id="path2-8"
        style={{
          fill: "#6d7279",
          stroke: "#00aeed",
          strokeWidth: 4.78005,
          strokeMiterlimit: 10,
        }}
      />
      <path
        className="st2"
        d="M39.9 37.4c13.6 3.5 22.2-5 21.5-15.1-.8-10.6-9.8-16.8-21.3-17.4C20.8 4-4.2 23.5 2.5 59.3c.8-9.9 17.9-26.7 37.4-21.9"
        id="path3-5"
        style={{
          fill: "#004b84",
          strokeWidth: 1.19501,
        }}
      />
      <path
        className="st3"
        d="M306 87.7h-6.2l-9 35.5h-.2L282 87.7h-8.5l-8.7 35.5h-.2l-9-35.5h-6.1l10.7 39.6h8.8l8.5-35.5h.2l8.5 35.5h8.7zm-89.6 19.8c0-13.8.8-15.5 11.4-15.5s11.4 1.7 11.4 15.5c0 13.7-.8 15.4-11.4 15.4-10.7 0-11.4-1.6-11.4-15.4m-6.2 0c0 16.7 2.9 20.2 17.6 20.2s17.6-3.5 17.6-20.2c0-16.8-2.9-20.3-17.6-20.3s-17.6 3.6-17.6 20.3M201.1 82h-6v45.3h6zm-23 15.4v-6.1c0-4.2 3.2-4.6 6.2-4.7 1.2 0 3.1 0 4.3.1v-5c-1.2-.1-2.5-.1-3.7-.1-9.7 0-12.8 2.4-12.8 10.1v5.6h-6v4.8h6v25.1h6v-25.1h10.5v-4.8h-10.5z"
        id="path4-6"
        style={{
          fill: "#394049",
          strokeWidth: 1.19501,
        }}
      />
      <path
        className="st3"
        id="polyline4"
        style={{
          fill: "#394049",
          strokeWidth: 1.19501,
        }}
        d="m248 75.4 20.3-68.1h17.4L306 75.2h-11.5l-4.3-12.6h-17.1l-1.6-10.1h16L277 16.6l-17 58.6h-12.3"
      />
      <path
        className="st3"
        d="M228.1 8c-3.2-.3-7-.2-10.7-.2-18.9 0-26.9 4-26.9 26.6V50c0 23 7.3 26.8 26.9 26.8 21.8 0 26.3-4.2 26.3-24.3V40.2h-27.1v9.9H232v2.4c0 12.9-3.4 13.1-14.6 13.1-13 0-15-1.4-15.2-15.7V34.4c.2-13.1 1.5-15.5 15.2-15.5 3.3 0 6-.1 8.2.2"
        id="path5-1"
        style={{
          fill: "#394049",
          strokeWidth: 1.19501,
        }}
      />
      <path
        className="st3"
        id="rect5"
        style={{
          fill: "#394049",
          strokeWidth: 1.19501,
        }}
        d="M167.8 8.2h11.7v67.9h-11.7z"
      />
      <path
        className="st3"
        id="polygon5"
        style={{
          fill: "#394049",
          strokeWidth: 1.19501,
        }}
        d="m140 76.1 19.7-67.9h-12.2l-16.3 57h-.2l-16.3-57h-12l19.6 67.9z"
      />
    </g>
    <g
      id="pt-card-0"
      transform="matrix(.71419 0 0 .55248 538.573 639.848)"
      style={{
        strokeWidth: 1.59198,
      }}
    >
      <rect
        x={1}
        y={1}
        width={138}
        height={68}
        rx={4.894}
        ry={6.063}
        fill="#fff"
        stroke="#8a94a6"
        strokeWidth={3.184}
        id="rect1-2-6"
      />
    </g>
    <g id="g6-9" transform="translate(651.534 226.194)">
      <rect
        x={99.899}
        y={176.744}
        width={58.174}
        height={21.577}
        rx={10}
        fill="#0b0b0b"
        id="rect1-7-8"
        ry={10}
      />
    </g>
    <path
      d="m687.58 660.605 40.853-.204"
      style={{
        fill: "none",
        stroke: "#2f3e49",
        strokeWidth: 3.82716,
        strokeMiterlimit: 10,
      }}
      id="path1-38-1"
    />
    <path
      className="st26"
      id="rect37-9"
      style={{
        fill: "#0e76e7",
        strokeWidth: 1.00114,
      }}
      d="M46.627 928.039h120.629v58.182H46.627z"
    />
    <g
      id="g24-6-6"
      transform="matrix(1.33727 0 0 1.33926 -163.019 530.078)"
      style={{
        strokeWidth: 0.747236,
      }}
    >
      <path
        className="st17"
        d="M332 382.8h-17.4c-1.1-.3-2.2-.4-3.4-.4-8.1 0-14.6 6.5-14.6 14.6 0 4.1 1.7 7.8 4.3 10.4l-4.1 9c-.3.7.1 1.6.7 1.6h27.7c.6 0 .9-.9.6-1.6l-4.1-9.1c2.6-2.6 4.2-6.3 4.2-10.3q0-2.25-.6-4.2h6.8c1.4 0 2.6-1.2 2.6-2.7v-4.6c0-1.5-1.2-2.7-2.7-2.7"
        id="path23-5-3"
        style={{
          fill: "#2f3e49",
          strokeWidth: 0.747236,
        }}
      />
    </g>
    <g
      id="g27-2-4"
      transform="matrix(1.26637 0 0 1.30074 -140.31 545.013)"
      style={{
        strokeWidth: 0.779157,
      }}
    >
      <g
        id="g26-8-28"
        style={{
          strokeWidth: 0.779157,
        }}
      >
        <image
          style={{
            overflow: "visible",
            opacity: 0.15,
            strokeWidth: 0.779157,
          }}
          width={40}
          height={40}
          xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAACXBIWXMAAAycAAAMnAGTj5aaAAAA GXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA8dJREFUeNrsmOlS2zAUhWNb2SHs he7v/1wtnZZQSMkeO1GlzrnM4VaO5STDLzxzxsbYyqeru1mNxtvxdrwdtY/klca0+wxoDgyWBCDt vtDJAeC00gCQVdebOrDJnpZLIf93huuM7jUIymtN1xuCtoeGZItlkHebJsmQRT1MAeVQAWCGLrWs 2RFQ4FpQx6nn1MV1k8b2ICunpdPcaQEtFXApqNkR0ADGQx05DaBjpz7uN/FeDqiZ0wQa4zzD/1Zk 2Z0hQ4Ae6MTpwunS6dzpFLA9BTkH1JPTyOnB6dHpD+5NYdkGuUgtSPZBBvRQ75zeQ1e4N4AlW3h/ BWtNAeUBh053OBuVEawGNTWDpIXl9DA3Tp+cPjt9BPApJtDB2JZ8cgareQue0XMZfsPS85buRVsy xfJ1scRXAPvq9MXpA5b9hKyY0g8XWM4TSFxCnpP0JBngRWoykYnaz7aNIPFWvAbkZ1hTrNjDc5mC 3AC+S1mgibFlAku4xZyi/Z81Y5db++I1/PAGVj3DBNolPmZx36j0VFBQjUk5QLdCaivKUgvkFax3 AQv2AdhU1YYDISVJ/lwAyvvpbwRVS61EYiLTjkAOYLVznAe0xCFAXdUynNt4bwAflYATPzUItufZ VS03Qx6R8x9TPjQlgGX1XsaUStWjyRpl8SjIlEpfH6B9iuIYwNCYAtoiGUpJzxNLI9ovGaxNEdop GbRu35lSFctorBd9aRoZ3VwSDQ2aNvY/kqpJxvyIVfkuug+sGJN7zTWN+1/3nlYMxM1qjogT5WVd S+Shq4z0nBs1iSCkbvfX1G7NUYOlxcpLrFC1KjzxJSkPgFZaUgaUdmuMTmaMrkZ6waIGqHTqK4w5 Vb1lrprgygaDuxiBHFEvOKBanaiSmJRMWGr1jCYtfeVMuZGNqd3aktJqDakcNqmtkrSUBCDZglOM 9UDlcASLrhTkc5mK/TKU9NOiSsO5zQYCbk1w0vyOMNEfTt+dbp1+AXaigzKLzF+hb+skkEbWKmJz asHYencA/AZIf32P/y/Ixyt9koOAu+sRLbF0MhNqenXLZgl2gvc90E9Y8LYE0Nb9ELMElChw+eFL 6ma6ylc5OzwCaoglHuLeTPljo050szU19JIi/p4s2Q1Yckb++EjnJ0pnRaiSmRoljEHFD5f0gfWA aA99QhRUDKaB7+5lYJNgp22WpKR7aQGqg7NEPn8FhqrLoqQc2kPuBSWBjSpTsmHVICuxxdbb4A6x 9ZdsSU1JAHKj8mh0J3WInV6dT7ft9trA9atvR8dC1jr+CjAAphWuxrXCynUAAAAASUVORK5CYII="
          transform="translate(293.273 379.5)scale(.875)"
          id="image24-6-8"
        />
        <g
          id="g25-0-7"
          style={{
            strokeWidth: 0.779157,
          }}
        >
          <circle
            className="st2"
            cx={311.1}
            cy={397.3}
            r={10.9}
            id="circle24-2-5"
            style={{
              fill: "#fff",
              strokeWidth: 0.779157,
            }}
          />
        </g>
      </g>
      <circle
        className="st19"
        cx={311.1}
        cy={397.1}
        r={8}
        id="circle26-4-8"
        style={{
          ...getDeviceIndicatorStyle(BombaRetrolavadoColor, 0.779157),
          opacity: 1,
        }}
      />
    </g>
    <g
      id="g33"
      transform="matrix(.58104 0 0 .73947 619.097 737.24)"
      style={{
        strokeWidth: 1.52558,
      }}
    >
      <path
        d="M111.16 310.196c50-80 210-100 350-70 180-20 310 50 340 120 30 90-100 170-290 170-180 20-350-40-380-100-40-50-40-90-20-120"
        fill="#e8d8a8"
        id="path1-2"
        style={{
          strokeWidth: 1.52558,
        }}
      />
      <path
        d="M143.451 330.396c40-60 170-70 310-50 150-20 260 30 280 80 20 60-70 120-220 120-150 20-310-20-340-60-30-30-30-60-30-90"
        fill="#1ecbe1"
        id="path2"
        style={{
          fill: "#0ff",
          fillOpacity: 1,
          strokeWidth: 1.52558,
        }}
      />
      <text
        x={469.231}
        y={348.618}
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize={31.715}
        fill="#0f172a"
        opacity={0.5}
        id="text2"
        style={{
          strokeWidth: 1.52558,
        }}
        transform="scale(.9117 1.09685)"
      >
        {"     LAGUNA  "}
      </text>
      <g
        id="Group_12-6-4-7-8-9"
        transform="matrix(2.5203 0 0 1.57668 139.687 -1396.7)"
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
              d="M395.197 549.87v52.091c0 .807-.398 1.498-.796 1.498h-36.914c-.497 0-.79-.691-.796-1.498l-.418-52.012"
              stroke="#2f3e49"
              strokeWidth={4.347}
              strokeMiterlimit={10}
              style={{
                fill: "#00a39b",
                fillOpacity: 1,
              }}
            />
            <g
              id="Group_17-1-7-2-4-1"
              transform="translate(-7.503 -12.63)"
              style={{
                strokeWidth: 1.54833,
              }}
            />
          </g>
        </g>
      </g>
      <text
        xmlSpace="preserve"
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: "24.4092px",
          fontFamily: "Arial-BoldMT",
          InkscapeFontSpecification: "&quot",
          fontVariantLigatures: "normal",
          fontVariantCaps: "normal",
          fontVariantNumeric: "normal",
          fontVariantEastAsian: "normal",
          textAlign: "center",
          writingMode: "lr-tb",
          direction: "ltr",
          textAnchor: "middle",
          fill: "#000",
          fillOpacity: 1,
          stroke: "#030303",
          strokeWidth: 0,
          strokeLinecap: "square",
          strokeLinejoin: "round",
          strokeDasharray: "none",
          strokeOpacity: 1,
          paintOrder: "fill markers stroke",
        }}
        x={1011.524}
        y={-644.159}
        id="text40"
        transform="scale(1.12812 .88643)"
      >
        <tspan
          id="tspan40"
          x={1011.524}
          y={-644.159}
          style={{
            fontStyle: "normal",
            fontVariant: "normal",
            fontWeight: 400,
            fontStretch: "normal",
            fontSize: "24.4092px",
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
            strokeWidth: 0,
            strokeDasharray: "none",
          }}
        >
          {"P-015"}
        </tspan>
      </text>
      <g
        id="Group_12-6-4-7-8-9-1"
        transform="matrix(2.5203 0 0 1.62405 293.398 -1423.478)"
        style={{
          strokeWidth: 1.52558,
        }}
      >
        <g
          id="Group_15-0-9-6-6-5-3"
          transform="matrix(1 0 0 .96107 0 21.918)"
          style={{
            strokeWidth: 1.55617,
          }}
        >
          <g
            id="Group_16-6-6-1-0-4-8"
            style={{
              strokeWidth: 1.55617,
            }}
          >
            <path
              id="Vector_29-6-3-4-2-3-7"
              d="M395.197 549.87v52.091c0 .807-.398 1.498-.796 1.498h-36.914c-.497 0-.79-.691-.796-1.498l-.418-52.012"
              stroke="#2f3e49"
              strokeWidth={4.369}
              strokeMiterlimit={10}
              style={{
                fill: "#00a39b",
                fillOpacity: 1,
              }}
            />
            <g
              id="Group_17-1-7-2-4-1-4"
              transform="translate(-7.503 -12.63)"
              style={{
                strokeWidth: 1.55617,
              }}
            />
          </g>
        </g>
      </g>
      <path
        style={{
          opacity: 1,
          fill: "#2a8b8b",
          fillOpacity: 0,
          stroke: "#2a8b8b",
          strokeWidth: 6.83143,
          strokeLinecap: "square",
          strokeLinejoin: "round",
          strokeDasharray: "none",
          strokeOpacity: 1,
        }}
        d="m849.885-570.902.976-86.538 385.435.597.975 120.855v0"
        id="path8"
      />
    </g>
    <g
      id="g34"
      transform="matrix(.39487 0 0 .37602 552.276 973.789)"
      style={{
        strokeWidth: 2.59516,
      }}
    >
      <rect
        x={30}
        y={45}
        width={100}
        height={50}
        rx={6}
        fill="#1e40af"
        id="rect1-73"
        style={{
          strokeWidth: 2.59516,
        }}
        ry={6}
      />
      <rect
        x={20}
        y={90}
        width={120}
        height={16}
        rx={4}
        fill="#1e3a8a"
        id="rect2-0"
        style={{
          strokeWidth: 2.59516,
        }}
        ry={4}
      />
      <rect
        x={45}
        y={30}
        width={70}
        height={22}
        rx={5}
        fill="#2563eb"
        id="rect3-38"
        style={{
          strokeWidth: 2.59516,
        }}
        ry={5}
      />
      <rect
        x={55}
        y={22}
        width={50}
        height={10}
        rx={4}
        fill="#60a5fa"
        id="rect4-25"
        style={{
          strokeWidth: 2.59516,
        }}
        ry={4}
      />
      <path
        d="M60 22c0-12 40-12 40 0"
        fill="none"
        stroke="#6b7280"
        strokeWidth={10.381}
        strokeLinecap="round"
        id="path4-2"
      />
    </g>
    <text
      xmlSpace="preserve"
      id="text34"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        whiteSpace: "pre",
        shapeInside: "url(#rect34)",
        display: "inline",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      transform="translate(-28.087 -102.62)"
    >
      <tspan x={36.718} y={671.277} id="tspan14">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan11"
        >
          {"CL-FLO12"}
        </tspan>
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      id="text35"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        whiteSpace: "pre",
        shapeInside: "url(#rect35)",
        display: "inline",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      transform="translate(-29.485 -70.484)"
    >
      <tspan x={153.695} y={538.543} id="tspan16">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan15"
        >
          {"P-017"}
        </tspan>
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={439.209}
      y={329.357}
      id="text37"
    >
      <tspan
        id="tspan37"
        x={439.209}
        y={329.357}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"VE-288"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={1365}
      y={315}
      id="text40-5"
    >
      <tspan
        id="tspan40-1"
        x={1365}
        y={315}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
          strokeWidth: 0,
          strokeDasharray: "none",
        }}
      >
        {"P-016"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={1251.323}
      y={429.746}
      id="text40-5-2"
    >
      <tspan
        id="tspan40-1-2"
        x={1251.323}
        y={429.746}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
          strokeWidth: 0,
          strokeDasharray: "none",
        }}
      >
        {"A-C1LO"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={1342.644}
      y={429.456}
      id="text40-5-2-4"
    >
      <tspan
        id="tspan40-1-2-0"
        x={1342.644}
        y={429.456}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
          strokeWidth: 0,
          strokeDasharray: "none",
        }}
      >
        {"F-H1LO"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={1275.928}
      y={584.207}
      id="text41"
    >
      <tspan
        id="tspan41"
        x={1275.928}
        y={584.207}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"TK "}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={1276.025}
      y={598.99}
      id="text41-1"
    >
      <tspan
        id="tspan41-6"
        x={1276.025}
        y={598.99}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"DECANTADOR"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={255.77}
      y={1111.348}
      id="text43-0"
    >
      <tspan
        id="tspan43-0"
        x={255.77}
        y={1111.348}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"BOMBA "}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={258.725}
      y={1125.478}
      id="text43-0-4"
    >
      <tspan
        id="tspan43-0-9"
        x={258.725}
        y={1125.478}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"RETROLAVADO"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={500.048}
      y={1114.408}
      id="text44"
    >
      <tspan
        id="tspan44"
        x={500.048}
        y={1114.408}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"AGUA DE"}
      </tspan>
    </text>
    <g id="Capa_1-5" transform="translate(-958.86 -11.164)">
      <text
        xmlSpace="preserve"
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Arial-BoldMT",
          InkscapeFontSpecification: "&quot",
          fontVariantLigatures: "normal",
          fontVariantCaps: "normal",
          fontVariantNumeric: "normal",
          fontVariantEastAsian: "normal",
          textAlign: "center",
          writingMode: "lr-tb",
          direction: "ltr",
          textAnchor: "middle",
          fill: "#000",
          fillOpacity: 1,
          stroke: "#030303",
          strokeWidth: 0,
          strokeLinecap: "square",
          strokeLinejoin: "round",
          strokeDasharray: "none",
          strokeOpacity: 1,
          paintOrder: "fill markers stroke",
        }}
        x={1093.546}
        y={1016.865}
        id="text46"
      >
        <tspan
          id="tspan46"
          x={1093.546}
          y={1016.865}
          style={{
            fontStyle: "normal",
            fontVariant: "normal",
            fontWeight: 400,
            fontStretch: "normal",
            fontSize: 16,
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
        >
          {"LAGUNA"}
        </tspan>
      </text>
      <text
        xmlSpace="preserve"
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Arial-BoldMT",
          InkscapeFontSpecification: "&quot",
          fontVariantLigatures: "normal",
          fontVariantCaps: "normal",
          fontVariantNumeric: "normal",
          fontVariantEastAsian: "normal",
          textAlign: "center",
          writingMode: "lr-tb",
          direction: "ltr",
          textAnchor: "middle",
          fill: "#000",
          fillOpacity: 1,
          stroke: "#008ae5",
          strokeWidth: 0,
          strokeLinecap: "square",
          strokeLinejoin: "round",
          strokeDasharray: "none",
          strokeOpacity: 1,
          paintOrder: "stroke markers fill",
        }}
        x={1009.05}
        y={711.021}
        id="text49-4"
      >
        <tspan
          x={1009.05}
          y={711.021}
          id="tspan50-8"
          style={{
            fontStyle: "normal",
            fontVariant: "normal",
            fontWeight: 400,
            fontStretch: "normal",
            fontSize: 16,
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
        >
          {"TK LIMPIEZA"}
        </tspan>
      </text>
      <text
        xmlSpace="preserve"
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Arial-BoldMT",
          InkscapeFontSpecification: "&quot",
          fontVariantLigatures: "normal",
          fontVariantCaps: "normal",
          fontVariantNumeric: "normal",
          fontVariantEastAsian: "normal",
          textAlign: "center",
          writingMode: "lr-tb",
          direction: "ltr",
          textAnchor: "middle",
          fill: "#000",
          fillOpacity: 1,
          stroke: "#008ae5",
          strokeWidth: 0,
          strokeLinecap: "square",
          strokeLinejoin: "round",
          strokeDasharray: "none",
          strokeOpacity: 1,
          paintOrder: "stroke markers fill",
        }}
        x={1008.173}
        y={729.034}
        id="text49-4-4"
      >
        <tspan
          x={1008.173}
          y={729.034}
          id="tspan50-8-5"
          style={{
            fontStyle: "normal",
            fontVariant: "normal",
            fontWeight: 400,
            fontStretch: "normal",
            fontSize: 16,
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
        >
          {"FONDO"}
        </tspan>
      </text>
    </g>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={454.184}
      y={610.208}
      id="text37-0"
    >
      <tspan
        id="tspan37-4"
        x={454.184}
        y={610.208}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"VE-322"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={1067.578}
      y={288.474}
      id="text37-9"
    >
      <tspan
        id="tspan37-56"
        x={1067.578}
        y={288.474}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"VE-320"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={1125.636}
      y={693.083}
      id="text37-9-8"
    >
      <tspan
        id="tspan37-56-2"
        x={1125.636}
        y={693.083}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"VE-318"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={584.46}
      y={968.165}
      id="text37-9-8-6"
    >
      <tspan
        id="tspan37-56-2-8"
        x={584.46}
        y={968.165}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"WM-001"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#008ae5",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "stroke markers fill",
      }}
      x={589.825}
      y={697.221}
      id="text49"
    >
      <tspan
        x={589.825}
        y={697.221}
        id="tspan50"
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"DIFERENCIAL DE"}
      </tspan>
    </text>
    <g
      id="Group_12-6-4-7-8"
      transform="matrix(1.76927 0 0 1.5723 -624.669 -402.103)"
      style={{
        strokeWidth: 1.41976451,
        strokeDasharray: "none",
      }}
    >
      <g
        id="Group_15-0-9-6-6"
        style={{
          strokeWidth: 1.41976451,
          strokeDasharray: "none",
        }}
      >
        <g
          id="Group_16-6-6-1-0"
          style={{
            strokeWidth: 1.41976451,
            strokeDasharray: "none",
          }}
        >
          <path
            id="Vector_29-6-3-4-2"
            d="M395.197 549.87v52.091c0 .807-.398 1.498-.796 1.498h-36.914c-.497 0-.79-.691-.796-1.498l-.418-52.012"
            stroke="#2f3e49"
            strokeWidth={4.283}
            strokeMiterlimit={10}
            style={{
              fill: "#00a39b",
              fillOpacity: 1,
              strokeWidth: 1.41976451,
              strokeDasharray: "none",
            }}
          />
          <g
            id="Group_17-1-7-2-4"
            transform="translate(-7.503 -12.63)"
            style={{
              strokeWidth: 1.41976451,
              strokeDasharray: "none",
            }}
          />
        </g>
      </g>
    </g>
    <g
      id="Group_32-5-67-9"
      transform="matrix(1.20095 0 0 1.13377 -269.995 -307.517)"
      style={{
        strokeWidth: 1.58724,
        strokeDasharray: "none",
      }}
    >
      <path
        id="Vector_65-4-6-9"
        d="M596.6 586h-14.8c-.9 0-1.6-.7-1.6-1.6v-14.8c0-.9.7-1.6 1.6-1.6h14.8c.9 0 1.6.7 1.6 1.6v14.8c0 .9-.7 1.6-1.6 1.6"
        fill={VE288Color}
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      />
      <g
        id="Group_33-3-7-5"
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      >
        <path
          id="Vector_66-1-7-9"
          d="m581.4 589.9 7.9 4.6c.5.3.5 1 0 1.3l-7.9 4.6c-.5.3-1.2-.1-1.2-.7v-9.2c0-.5.7-.9 1.2-.6"
          fill={VE288Color}
          style={{
            strokeWidth: 1.58724,
            strokeDasharray: "none",
          }}
        />
        <path
          id="Vector_67-2-19-2"
          d="m597 600.5-7.9-4.6c-.5-.3-.5-1 0-1.3l7.9-4.6c.5-.3 1.2.1 1.2.7v9.2c0 .5-.7.9-1.2.6"
          fill={VE288Color}
          style={{
            strokeWidth: 1.58724,
            strokeDasharray: "none",
          }}
        />
      </g>
      <path
        id="Vector_68-3-16-6"
        d="M589.2 585v10"
        stroke={VE288Color}
        strokeWidth={4}
        strokeMiterlimit={10}
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      />
      <path
        id="Vector_69-3-2-5"
        d="M580.2 577h18"
        stroke="#fff"
        strokeWidth={2}
        strokeMiterlimit={10}
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      />
      <path
        id="Vector_70-4-7-3"
        d="M589.2 578v8"
        stroke="#fff"
        strokeWidth={2}
        strokeMiterlimit={10}
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      />
    </g>
    <g
      id="Group_32-5-67-9-8"
      transform="matrix(1.20095 0 0 1.13377 -253.676 -25.57)"
      style={{
        strokeWidth: 1.58724,
        strokeDasharray: "none",
      }}
    >
      <path
        id="Vector_65-4-6-9-7"
        d="M596.6 586h-14.8c-.9 0-1.6-.7-1.6-1.6v-14.8c0-.9.7-1.6 1.6-1.6h14.8c.9 0 1.6.7 1.6 1.6v14.8c0 .9-.7 1.6-1.6 1.6"
        fill={VE322Color}
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      />
      <g
        id="Group_33-3-7-5-4"
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      >
        <path
          id="Vector_66-1-7-9-2"
          d="m581.4 589.9 7.9 4.6c.5.3.5 1 0 1.3l-7.9 4.6c-.5.3-1.2-.1-1.2-.7v-9.2c0-.5.7-.9 1.2-.6"
          fill={VE322Color}
          style={{
            strokeWidth: 1.58724,
            strokeDasharray: "none",
          }}
        />
        <path
          id="Vector_67-2-19-2-7"
          d="m597 600.5-7.9-4.6c-.5-.3-.5-1 0-1.3l7.9-4.6c.5-.3 1.2.1 1.2.7v9.2c0 .5-.7.9-1.2.6"
          fill={VE322Color}
          style={{
            strokeWidth: 1.58724,
            strokeDasharray: "none",
          }}
        />
      </g>
      <path
        id="Vector_68-3-16-6-7"
        d="M589.2 585v10"
        stroke={VE322Color}
        strokeWidth={4}
        strokeMiterlimit={10}
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      />
      <path
        id="Vector_69-3-2-5-9"
        d="M580.2 577h18"
        stroke="#fff"
        strokeWidth={2}
        strokeMiterlimit={10}
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      />
      <path
        id="Vector_70-4-7-3-3"
        d="M589.2 578v8"
        stroke="#fff"
        strokeWidth={2}
        strokeMiterlimit={10}
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      />
    </g>
    <g
      id="pt-card-87-9"
      transform="matrix(.76732 0 0 .68476 239.23 427.96)"
      style={{
        strokeWidth: 1.26048,
      }}
    >
      <rect
        x={1}
        y={1}
        width={138}
        height={68}
        rx={4.894}
        ry={6.063}
        fill="#fff"
        stroke="#8a94a6"
        strokeWidth={2.521}
        id="rect1-2-7-3"
      />
      <path stroke="#8a94a6" strokeWidth={1.891} id="line1-8-1" d="M6 34h128" />
    </g>
    <text
      xmlSpace="preserve"
      id="text38-8"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        whiteSpace: "pre",
        shapeInside: "url(#rect38-8-0)",
        display: "inline",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      transform="translate(-281.088 93.2)"
    >
      <tspan x={551.28} y={354.457} id="tspan18">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan17"
        >
          {"PT-117"}
        </tspan>
      </tspan>
    </text>
    <g
      id="pt-card-87-9-5"
      transform="matrix(.76732 0 0 .68476 728.914 637.238)"
      style={{
        strokeWidth: 1.26048,
      }}
    >
      <rect
        x={1}
        y={1}
        width={138}
        height={68}
        rx={4.894}
        ry={6.063}
        fill="#fff"
        stroke="#8a94a6"
        strokeWidth={2.521}
        id="rect1-2-7-3-0"
      />
      <path
        stroke="#8a94a6"
        strokeWidth={1.891}
        id="line1-8-1-2"
        d="M6 34h128"
      />
    </g>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={781.851}
      y={654.838}
      id="text37-7"
    >
      <tspan
        id="tspan37-5"
        x={781.851}
        y={654.838}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"PT-141"}
      </tspan>
    </text>
    <path
      d="m879.125 660.605 40.853-.204"
      style={{
        fill: "none",
        stroke: "#2f3e49",
        strokeWidth: 3.82716,
        strokeMiterlimit: 10,
      }}
      id="path1-38-1-8"
    />
    <path
      d="m1064.146 625.295 32.976-.205"
      style={{
        fill: "none",
        stroke: "#2f3e49",
        strokeWidth: 3.44623,
        strokeMiterlimit: 10,
      }}
      id="path1-38-1-8-3"
    />
    <g
      id="pt-card-87-9-5-65"
      transform="matrix(.76732 0 0 .68476 920.015 637.238)"
      style={{
        strokeWidth: 1.26048,
      }}
    >
      <rect
        x={1}
        y={1}
        width={138}
        height={68}
        rx={4.894}
        ry={6.063}
        fill="#fff"
        stroke="#8a94a6"
        strokeWidth={2.521}
        id="rect1-2-7-3-0-0"
      />
      <path
        stroke="#8a94a6"
        strokeWidth={1.891}
        id="line1-8-1-2-9"
        d="M6 34h128"
      />
    </g>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={970.289}
      y={655.089}
      id="text37-7-0"
    >
      <tspan
        id="tspan37-5-0"
        x={970.289}
        y={655.089}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"PT-143"}
      </tspan>
    </text>
    <g
      id="pt-card-87-9-5-0-5"
      transform="matrix(.68894 0 0 .64115 1097.006 603.181)"
      style={{
        strokeWidth: 1.26048,
      }}
    >
      <rect
        x={1}
        y={1}
        width={138}
        height={68}
        rx={4.894}
        ry={6.063}
        fill="#fff"
        stroke="#8a94a6"
        strokeWidth={2.521}
        id="rect1-2-7-3-0-2-0"
      />
      <path
        stroke="#8a94a6"
        strokeWidth={1.891}
        id="line1-8-1-2-4-9"
        d="M6 34h128"
      />
    </g>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={1142.226}
      y={621.474}
      id="text37-7-1-2"
    >
      <tspan
        id="tspan37-5-1-5"
        x={1142.226}
        y={621.474}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"PT-145"}
      </tspan>
    </text>
    <g
      id="pt-card-87-9-5-6"
      transform="matrix(.76732 0 0 .68476 458.202 248.44)"
      style={{
        strokeWidth: 1.26048,
      }}
    >
      <rect
        x={1}
        y={1}
        width={138}
        height={68}
        rx={4.894}
        ry={6.063}
        fill="#fff"
        stroke="#8a94a6"
        strokeWidth={2.521}
        id="rect1-2-7-3-0-1"
      />
      <path
        stroke="#8a94a6"
        strokeWidth={1.891}
        id="line1-8-1-2-3"
        d="M6 34h128"
      />
    </g>
    <text
      xmlSpace="preserve"
      id="text38"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        whiteSpace: "pre",
        shapeInside: "url(#rect38-8)",
        display: "inline",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      transform="translate(-65.97 -88.843)"
    >
      <tspan x={551.28} y={354.457} id="tspan20">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan19"
        >
          {"PT-148"}
        </tspan>
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={499.614}
      y={1129.058}
      id="text44-7"
    >
      <tspan
        id="tspan44-6"
        x={499.614}
        y={1129.058}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"LLENADO"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#008ae5",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "stroke markers fill",
      }}
      x={588.858}
      y={714.652}
      id="text49-2"
    >
      <tspan
        x={588.858}
        y={714.652}
        id="tspan50-3"
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"PRESI\xD3N"}
      </tspan>
    </text>
    <g
      id="Group_32-5-67-9-6"
      transform="matrix(1.20095 0 0 1.13377 361.056 -334.605)"
      style={{
        strokeWidth: 1.58724,
        strokeDasharray: "none",
      }}
    >
      <path
        id="Vector_65-4-6-9-1"
        d="M596.73 571.888h-14.8c-.9 0-1.6-.7-1.6-1.6v-14.8c0-.9.7-1.6 1.6-1.6h14.8c.9 0 1.6.7 1.6 1.6v14.8c0 .9-.7 1.6-1.6 1.6"
        fill={VE320Color}
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      />
      <g
        id="Group_33-3-7-5-42"
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
        transform="translate(.13 -14.112)"
      >
        <path
          id="Vector_66-1-7-9-3"
          d="m581.4 589.9 7.9 4.6c.5.3.5 1 0 1.3l-7.9 4.6c-.5.3-1.2-.1-1.2-.7v-9.2c0-.5.7-.9 1.2-.6"
          fill={VE320Color}
          style={{
            strokeWidth: 1.58724,
            strokeDasharray: "none",
          }}
        />
        <path
          id="Vector_67-2-19-2-2"
          d="m597 600.5-7.9-4.6c-.5-.3-.5-1 0-1.3l7.9-4.6c.5-.3 1.2.1 1.2.7v9.2c0 .5-.7.9-1.2.6"
          fill={VE320Color}
          style={{
            strokeWidth: 1.58724,
            strokeDasharray: "none",
          }}
        />
      </g>
      <path
        id="Vector_68-3-16-6-2"
        d="M589.33 570.888v10"
        stroke={VE320Color}
        strokeWidth={4}
        strokeMiterlimit={10}
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      />
      <path
        id="Vector_69-3-2-5-1"
        d="M580.33 562.888h18"
        stroke="#fff"
        strokeWidth={2}
        strokeMiterlimit={10}
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      />
      <path
        id="Vector_70-4-7-3-6"
        d="M589.33 563.888v8"
        stroke="#fff"
        strokeWidth={2}
        strokeMiterlimit={10}
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      />
    </g>
    <path
      style={{
        fill: "#272727",
        fillOpacity: 0,
        stroke: "#4a4a4a",
        strokeWidth: 4.34973,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeDashoffset: 0,
        strokeOpacity: 1,
        paintOrder: "markers stroke fill",
      }}
      d="m1141.333 129.882 89.098.314-.627 265.412h31.372"
      id="path14"
      transform="matrix(1.11232 0 0 .76026 -186.782 225.4)"
    />
    <path
      id="Vector_324"
      d="M1142.204 331.216c-1.261-.002-2.407-.929-2.405-2.163l.018-10.178c0-1.131 1.036-2.158 2.412-2.156.631 0 1.261.207 1.662.568l5.668 5.097c.859.772.857 2.057.11 2.93l-.115.103-5.685 5.081c-.517.617-1.034.719-1.664.718z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#000",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      id="Vector_324-6"
      d="M1174.17 448.302c0-1.262.923-2.41 2.156-2.411l10.18-.012c1.13-.003 2.16 1.03 2.162 2.405 0 .631-.204 1.262-.563 1.664l-5.08 5.683c-.77.86-2.055.862-2.93.118l-.104-.115-5.098-5.67c-.617-.515-.721-1.031-.722-1.662z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#000",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      id="Vector_185-8-1-9"
      d="M1327.38 345.096h18.913c1.08 0 2.026-.914 2.026-1.958v-18.276c0-1.044-.945-1.958-2.026-1.958h-18.913c-1.08 0-2.026.914-2.026 1.958v18.276c0 1.044.946 1.958 2.026 1.958"
      fill={P016Color}
      style={{
        strokeWidth: 1.32796,
        strokeLinecap: "square",
      }}
    />
    <g id="g6" transform="translate(460.977 226.867)">
      <rect
        x={99.899}
        y={176.744}
        width={58.174}
        height={21.577}
        rx={10}
        fill="#0b0b0b"
        id="rect1-7"
        ry={10}
      />
    </g>
    <path
      style={{
        fill: "#fff",
        fillOpacity: 1,
        stroke: "#2a8b8b",
        strokeWidth: 3.9853,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m171.634 484.534 30.602.029V670"
      id="path30"
    />
    <path
      id="Vector_324-1-4"
      d="M196.184 672.83c.013-.862.744-1.636 1.704-1.625l7.92.09c.88.008 1.669.722 1.656 1.661-.01.43-.173.86-.457 1.13l-4.015 3.828c-.608.58-1.608.569-2.28.053l-.08-.08-3.904-3.917c-.475-.357-.55-.71-.544-1.14z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#2a8b8b",
        fillOpacity: 1,
        stroke: "#2a8b8b",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <g id="layer1-2" transform="matrix(1.00222 0 0 1 118.422 164.8)">
      <path
        className="st16"
        d="M728.973 304.833c0-24.199-23.787-43.998-67.298-43.998-43.51 0-67.551 19.8-67.551 43.998v117.649c0 12.672 15.152 23.231 34.114 24.727v12.847h14.814v-12.583h35.13v12.583h14.814V447.21c19.978-.704 35.977-11.527 35.977-24.727V308.705z"
        id="path16-4-7-3"
        style={{
          opacity: 0.578838,
          fill: "#252d34",
          fillOpacity: 1,
          strokeWidth: 0.996673,
        }}
      />
      <text
        xmlSpace="preserve"
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 24,
          fontFamily: "Arial-BoldMT",
          InkscapeFontSpecification: "&quot",
          fontVariantLigatures: "normal",
          fontVariantCaps: "normal",
          fontVariantNumeric: "normal",
          fontVariantEastAsian: "normal",
          textAlign: "center",
          writingMode: "lr-tb",
          direction: "ltr",
          textAnchor: "middle",
          fill: "#efefef",
          fillOpacity: 1,
          stroke: "#030303",
          strokeWidth: 0,
          strokeLinecap: "square",
          strokeLinejoin: "round",
          strokeDasharray: "none",
          strokeOpacity: 1,
          paintOrder: "fill markers stroke",
        }}
        x={662.282}
        y={321.593}
        id="text32-2"
      >
        <tspan
          id="tspan32-1"
          x={662.282}
          y={321.593}
          style={{
            fontStyle: "normal",
            fontVariant: "normal",
            fontWeight: 400,
            fontStretch: "normal",
            fontSize: 24,
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
            fill: "#efefef",
            fillOpacity: 1,
          }}
        >
          {"FIS - 002"}
        </tspan>
      </text>
      <rect
        x={613.486}
        y={345.647}
        width={94.616}
        height={23.2}
        rx={8.396}
        fill="#26e000"
        id="rect2-7-6-6"
        style={{
          fill: "#e6e6e6",
          fillOpacity: 1,
          strokeWidth: 1,
        }}
        ry={8.396}
      />
    </g>
    <g
      id="g5-1"
      transform="matrix(.32847 0 0 .26511 731.04 544.824)"
      style={{
        strokeWidth: 1.19501,
      }}
    >
      <path
        className="st0"
        d="M61.2 44.4c-10.5 9.4-8.2 21.2.5 26.3 9.3 5.3 19.5 1.2 26.4-8 11.5-15.4 6.1-48-25.1-59.2 7.8 6.2 13.1 27.4-1.8 40.9"
        id="path1-24-4"
        style={{
          fill: "#00a09a",
          stroke: "#008ba3",
          strokeWidth: 4.78005,
          strokeMiterlimit: 10,
        }}
      />
      <path
        className="st1"
        d="M43.7 61C40.1 47.4 28.5 44.1 20 49.5c-8.9 5.9-9.9 16.8-4.8 27.1 8.5 17.2 40 27.2 64.1 4.5-9 4.3-30.3-.6-35.6-20.1"
        id="path2-8-2"
        style={{
          fill: "#6d7279",
          stroke: "#00aeed",
          strokeWidth: 4.78005,
          strokeMiterlimit: 10,
        }}
      />
      <path
        className="st2"
        d="M39.9 37.4c13.6 3.5 22.2-5 21.5-15.1-.8-10.6-9.8-16.8-21.3-17.4C20.8 4-4.2 23.5 2.5 59.3c.8-9.9 17.9-26.7 37.4-21.9"
        id="path3-5-3"
        style={{
          fill: "#004b84",
          strokeWidth: 1.19501,
        }}
      />
      <path
        className="st3"
        d="M306 87.7h-6.2l-9 35.5h-.2L282 87.7h-8.5l-8.7 35.5h-.2l-9-35.5h-6.1l10.7 39.6h8.8l8.5-35.5h.2l8.5 35.5h8.7zm-89.6 19.8c0-13.8.8-15.5 11.4-15.5s11.4 1.7 11.4 15.5c0 13.7-.8 15.4-11.4 15.4-10.7 0-11.4-1.6-11.4-15.4m-6.2 0c0 16.7 2.9 20.2 17.6 20.2s17.6-3.5 17.6-20.2c0-16.8-2.9-20.3-17.6-20.3s-17.6 3.6-17.6 20.3M201.1 82h-6v45.3h6zm-23 15.4v-6.1c0-4.2 3.2-4.6 6.2-4.7 1.2 0 3.1 0 4.3.1v-5c-1.2-.1-2.5-.1-3.7-.1-9.7 0-12.8 2.4-12.8 10.1v5.6h-6v4.8h6v25.1h6v-25.1h10.5v-4.8h-10.5z"
        id="path4-6-2"
        style={{
          fill: "#394049",
          strokeWidth: 1.19501,
        }}
      />
      <path
        className="st3"
        id="polyline4-2"
        style={{
          fill: "#394049",
          strokeWidth: 1.19501,
        }}
        d="m248 75.4 20.3-68.1h17.4L306 75.2h-11.5l-4.3-12.6h-17.1l-1.6-10.1h16L277 16.6l-17 58.6h-12.3"
      />
      <path
        className="st3"
        d="M228.1 8c-3.2-.3-7-.2-10.7-.2-18.9 0-26.9 4-26.9 26.6V50c0 23 7.3 26.8 26.9 26.8 21.8 0 26.3-4.2 26.3-24.3V40.2h-27.1v9.9H232v2.4c0 12.9-3.4 13.1-14.6 13.1-13 0-15-1.4-15.2-15.7V34.4c.2-13.1 1.5-15.5 15.2-15.5 3.3 0 6-.1 8.2.2"
        id="path5-1-1"
        style={{
          fill: "#394049",
          strokeWidth: 1.19501,
        }}
      />
      <path
        className="st3"
        id="rect5-6"
        style={{
          fill: "#394049",
          strokeWidth: 1.19501,
        }}
        d="M167.8 8.2h11.7v67.9h-11.7z"
      />
      <path
        className="st3"
        id="polygon5-8"
        style={{
          fill: "#394049",
          strokeWidth: 1.19501,
        }}
        d="m140 76.1 19.7-67.9h-12.2l-16.3 57h-.2l-16.3-57h-12l19.6 67.9z"
      />
    </g>
    <g id="layer1-2-8" transform="matrix(1.00222 0 0 1 302.879 164.8)">
      <path
        className="st16"
        d="M726.938 304.99c0-24.199-23.787-43.998-67.297-43.998s-67.552 19.8-67.552 43.998v117.649c0 12.672 15.153 23.231 34.115 24.727v12.847h14.814V447.63h35.13v12.583h14.814v-12.847c19.977-.704 35.976-11.527 35.976-24.727V308.862z"
        id="path16-4-7-3-9"
        style={{
          opacity: 0.578838,
          fill: "#252d34",
          fillOpacity: 1,
          strokeWidth: 0.996673,
        }}
      />
      <text
        xmlSpace="preserve"
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 24,
          fontFamily: "Arial-BoldMT",
          InkscapeFontSpecification: "&quot",
          fontVariantLigatures: "normal",
          fontVariantCaps: "normal",
          fontVariantNumeric: "normal",
          fontVariantEastAsian: "normal",
          textAlign: "center",
          writingMode: "lr-tb",
          direction: "ltr",
          textAnchor: "middle",
          fill: "#efefef",
          fillOpacity: 1,
          stroke: "#030303",
          strokeWidth: 0,
          strokeLinecap: "square",
          strokeLinejoin: "round",
          strokeDasharray: "none",
          strokeOpacity: 1,
          paintOrder: "fill markers stroke",
        }}
        x={662.282}
        y={321.593}
        id="text32-2-7"
      >
        <tspan
          id="tspan32-1-9"
          x={662.282}
          y={321.593}
          style={{
            fontStyle: "normal",
            fontVariant: "normal",
            fontWeight: 400,
            fontStretch: "normal",
            fontSize: 24,
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
            fill: "#efefef",
            fillOpacity: 1,
          }}
        >
          {"FIS - 003"}
        </tspan>
      </text>
      <rect
        x={613.486}
        y={345.647}
        width={94.616}
        height={23.2}
        rx={8.396}
        fill="#26e000"
        id="rect2-7-6-6-5"
        style={{
          fill: "#e6e6e6",
          fillOpacity: 1,
          strokeWidth: 1,
        }}
        ry={8.396}
      />
    </g>
    <g
      id="g5-6"
      transform="matrix(.32847 0 0 .26511 911.683 544.824)"
      style={{
        strokeWidth: 1.19501,
      }}
    >
      <path
        className="st0"
        d="M61.2 44.4c-10.5 9.4-8.2 21.2.5 26.3 9.3 5.3 19.5 1.2 26.4-8 11.5-15.4 6.1-48-25.1-59.2 7.8 6.2 13.1 27.4-1.8 40.9"
        id="path1-24-1"
        style={{
          fill: "#00a09a",
          stroke: "#008ba3",
          strokeWidth: 4.78005,
          strokeMiterlimit: 10,
        }}
      />
      <path
        className="st1"
        d="M43.7 61C40.1 47.4 28.5 44.1 20 49.5c-8.9 5.9-9.9 16.8-4.8 27.1 8.5 17.2 40 27.2 64.1 4.5-9 4.3-30.3-.6-35.6-20.1"
        id="path2-8-8"
        style={{
          fill: "#6d7279",
          stroke: "#00aeed",
          strokeWidth: 4.78005,
          strokeMiterlimit: 10,
        }}
      />
      <path
        className="st2"
        d="M39.9 37.4c13.6 3.5 22.2-5 21.5-15.1-.8-10.6-9.8-16.8-21.3-17.4C20.8 4-4.2 23.5 2.5 59.3c.8-9.9 17.9-26.7 37.4-21.9"
        id="path3-5-9"
        style={{
          fill: "#004b84",
          strokeWidth: 1.19501,
        }}
      />
      <path
        className="st3"
        d="M306 87.7h-6.2l-9 35.5h-.2L282 87.7h-8.5l-8.7 35.5h-.2l-9-35.5h-6.1l10.7 39.6h8.8l8.5-35.5h.2l8.5 35.5h8.7zm-89.6 19.8c0-13.8.8-15.5 11.4-15.5s11.4 1.7 11.4 15.5c0 13.7-.8 15.4-11.4 15.4-10.7 0-11.4-1.6-11.4-15.4m-6.2 0c0 16.7 2.9 20.2 17.6 20.2s17.6-3.5 17.6-20.2c0-16.8-2.9-20.3-17.6-20.3s-17.6 3.6-17.6 20.3M201.1 82h-6v45.3h6zm-23 15.4v-6.1c0-4.2 3.2-4.6 6.2-4.7 1.2 0 3.1 0 4.3.1v-5c-1.2-.1-2.5-.1-3.7-.1-9.7 0-12.8 2.4-12.8 10.1v5.6h-6v4.8h6v25.1h6v-25.1h10.5v-4.8h-10.5z"
        id="path4-6-27"
        style={{
          fill: "#394049",
          strokeWidth: 1.19501,
        }}
      />
      <path
        className="st3"
        id="polyline4-9"
        style={{
          fill: "#394049",
          strokeWidth: 1.19501,
        }}
        d="m248 75.4 20.3-68.1h17.4L306 75.2h-11.5l-4.3-12.6h-17.1l-1.6-10.1h16L277 16.6l-17 58.6h-12.3"
      />
      <path
        className="st3"
        d="M228.1 8c-3.2-.3-7-.2-10.7-.2-18.9 0-26.9 4-26.9 26.6V50c0 23 7.3 26.8 26.9 26.8 21.8 0 26.3-4.2 26.3-24.3V40.2h-27.1v9.9H232v2.4c0 12.9-3.4 13.1-14.6 13.1-13 0-15-1.4-15.2-15.7V34.4c.2-13.1 1.5-15.5 15.2-15.5 3.3 0 6-.1 8.2.2"
        id="path5-1-5"
        style={{
          fill: "#394049",
          strokeWidth: 1.19501,
        }}
      />
      <path
        className="st3"
        id="rect5-4"
        style={{
          fill: "#394049",
          strokeWidth: 1.19501,
        }}
        d="M167.8 8.2h11.7v67.9h-11.7z"
      />
      <path
        className="st3"
        id="polygon5-3"
        style={{
          fill: "#394049",
          strokeWidth: 1.19501,
        }}
        d="m147.5 8.2-16.3 57h-.2l-16.3-57h-12l19.6 67.9H140l19.7-67.9z"
      />
    </g>
    <path
      style={{
        opacity: 1,
        fill: "#4a4a4a",
        fillOpacity: 0,
        fillRule: "nonzero",
        stroke: "#4a4a4a",
        strokeWidth: 3.99679,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m780.005 359.858-.168-31.987"
      id="path55"
    />
    <path
      style={{
        fill: "#4a4a4a",
        fillOpacity: 0,
        fillRule: "nonzero",
        stroke: "#4a4a4a",
        strokeWidth: 3.99679,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m780.08 400.927-.16-22.89"
      id="path55-4"
    />
    <path
      style={{
        fill: "#fff",
        fillOpacity: 0,
        stroke: "#35aee9",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="M931.88 416.108h-46.69V369.93l-434.54-1.957v0"
      id="path28"
    />
    <path
      className="st37"
      id="circle448-3"
      style={{
        fill: "#0bffff",
        fillOpacity: 0,
        stroke: "#4a4a4a",
        strokeWidth: 4,
        strokeMiterlimit: 10,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="M-367.259-777.697a8.956 8.842 0 0 1-8.86 8.841 8.956 8.842 0 0 1-9.05-8.65"
      transform="rotate(89.45)scale(-1 1)skewY(.123)"
    />
    <path
      id="Vector_324-6-6-4-8-4"
      d="M835.416 377.25c-1.262.022-2.426-.88-2.449-2.113l-.191-10.177c-.023-1.13.99-2.179 2.367-2.205.63-.011 1.265.181 1.673.533l5.771 4.98c.875.754.899 2.04.17 2.927l-.112.105-5.58 5.198c-.504.627-1.018.74-1.649.751z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      style={{
        opacity: 1,
        fill: "#efefef",
        fillOpacity: 0,
        fillRule: "nonzero",
        stroke: "#34ade9",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m231.721 1061.986-160.598-.484.623-70.12v0"
      id="path51"
    />
    <path
      style={{
        opacity: 1,
        fill: "#fffffb",
        fillOpacity: 1,
        stroke: "#35ade9",
        strokeWidth: 4.01089,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m350.195 871.405 10.073.128 1.775-503.273h62.104v0"
      id="path9"
    />
    <path
      className="st37"
      id="circle448-3-2"
      style={{
        fill: "#0bffff",
        fillOpacity: 0,
        stroke: "#4b4b4b",
        strokeWidth: 4,
        strokeMiterlimit: 10,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="M-364.606-585.483a8.956 8.842 0 0 1-8.86 8.842 8.956 8.842 0 0 1-9.05-8.651"
      transform="rotate(89.45)scale(-1 1)skewY(.123)"
    />
    <path
      style={{
        opacity: 1,
        fill: "#efefef",
        fillOpacity: 0,
        fillRule: "nonzero",
        stroke: "#34ade9",
        strokeWidth: 3.98284,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m438.057 649.242-36.995-.223.283 401.903H286.718v0"
      id="path52"
    />
    <path
      style={{
        opacity: 1,
        fill: "#efefef",
        fillOpacity: 0,
        fillRule: "nonzero",
        stroke: "#34ade9",
        strokeWidth: 5.10109,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m294.27 882.547-122.237-1.106V744.314"
      id="path53"
    />
    <path
      className="st37"
      id="circle448-2"
      style={{
        fill: "#fff",
        fillOpacity: 1,
        stroke: "#35ace8",
        strokeWidth: 4,
        strokeMiterlimit: 10,
        strokeDasharray: "none",
      }}
      d="M-794.459-353.392a9.272 8.842 0 0 1-9.172 8.842 9.272 8.842 0 0 1-9.37-8.651"
      transform="rotate(89.43)scale(-1 1)skewY(.08)"
    />
    <path
      className="st37"
      id="circle448-0"
      style={{
        fill: "#fff",
        fillOpacity: 1,
        stroke: "#35ace8",
        strokeWidth: 4,
        strokeMiterlimit: 10,
        strokeDasharray: "none",
      }}
      d="M-794.284-394.165a9.272 8.842 0 0 1-9.172 8.842 9.272 8.842 0 0 1-9.37-8.651"
      transform="rotate(89.43)scale(-1 1)skewY(.08)"
    />
    <path
      style={{
        opacity: 1,
        fill: "#efefef",
        fillOpacity: 0,
        fillRule: "nonzero",
        stroke: "#34ade9",
        strokeWidth: 4.00311,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m466.88 649.764 26.363.287-.465-279.443v0"
      id="path54"
    />
    <path
      style={{
        opacity: 1,
        fill: "#efefef",
        fillOpacity: 0,
        fillRule: "nonzero",
        stroke: "#34ade9",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m1112.217 729.487-427.159.447.441-316.337h-64.426"
      id="path57"
    />
    <path
      id="Vector_324-6-6-5-1"
      d="M967.37 736.744c-1.262-.014-2.4-.948-2.388-2.181l.1-10.179c.01-1.13 1.052-2.15 2.428-2.136.63.007 1.26.217 1.658.58l5.627 5.143c.852.78.84 2.064.087 2.931l-.116.102-5.726 5.036c-.522.612-1.039.71-1.67.704z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      style={{
        fill: "#27a046",
        fillOpacity: 0,
        stroke: "#4a4a4a",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="M1055.537 324.881h-467.71V358"
      id="path7"
    />
    <path
      id="Vector_324-6-6-5-1-0"
      d="M778.338 736.752c-1.26-.013-2.399-.948-2.387-2.181l.1-10.179c.01-1.13 1.052-2.15 2.428-2.136.63.007 1.26.217 1.657.58l5.627 5.143c.853.78.84 2.064.087 2.931l-.115.102-5.726 5.036c-.522.612-1.039.71-1.67.704z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      style={{
        opacity: 1,
        fill: "#efefef",
        fillOpacity: 0,
        fillRule: "nonzero",
        stroke: "#34ade9",
        strokeWidth: 3.96505,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m877.533 727.29-1.297-315.487h-64.402"
      id="path58"
    />
    <path
      style={{
        opacity: 1,
        fill: "#efefef",
        fillOpacity: 0,
        fillRule: "nonzero",
        stroke: "#34ade9",
        strokeWidth: 4.01222,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m1064.205 727.751-.518-314.089-69.912.628"
      id="path59"
    />
    <path
      id="Vector_324-6-6"
      d="M1056.657 540.874c0-1.261.922-2.41 2.156-2.41l10.178-.012c1.131-.003 2.161 1.029 2.163 2.405 0 .63-.203 1.262-.563 1.664l-5.08 5.682c-.77.861-2.055.863-2.93.119l-.103-.115-5.098-5.67c-.618-.515-.722-1.031-.723-1.662z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      id="Vector_324-6-6-20"
      d="M892.317 332.277c-1.26-.017-2.396-.954-2.38-2.188l.127-10.178c.012-1.131 1.059-2.147 2.435-2.13.63.01 1.258.221 1.655.586l5.613 5.158c.85.781.834 2.066.078 2.931l-.116.102-5.74 5.02c-.523.61-1.04.707-1.671.7z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#000",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      id="Vector_324-6-6-4"
      d="M688.304 332.436c-1.261.022-2.425-.879-2.448-2.112l-.192-10.177c-.023-1.131.991-2.18 2.367-2.205.63-.012 1.265.18 1.673.533l5.772 4.98c.874.754.898 2.039.17 2.927l-.113.105-5.58 5.198c-.504.626-1.018.739-1.648.751z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#000",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      id="Vector_324-6-6-4-8"
      d="M689.116 376.321c-1.262.023-2.426-.879-2.449-2.112l-.191-10.177c-.023-1.131.99-2.179 2.367-2.205.63-.011 1.265.181 1.673.533l5.771 4.98c.875.754.899 2.04.17 2.927l-.112.105-5.58 5.198c-.504.627-1.018.74-1.649.751z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      id="Vector_324-6-6-5"
      d="M869.422 540.874c0-1.261.922-2.41 2.155-2.41l10.18-.012c1.13-.003 2.16 1.029 2.162 2.405 0 .63-.204 1.262-.563 1.664l-5.08 5.682c-.77.861-2.055.863-2.93.119l-.104-.115-5.098-5.67c-.617-.515-.721-1.031-.722-1.662z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <g id="g6-9-3" transform="translate(833.566 227.512)">
      <rect
        x={99.977}
        y={175.725}
        width={58.174}
        height={21.577}
        rx={10}
        fill="#0b0b0b"
        id="rect1-7-8-3"
        ry={10}
      />
    </g>
    <path
      style={{
        opacity: 1,
        fill: "#fff",
        fillOpacity: 1,
        fillRule: "nonzero",
        stroke: "#35aae9",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="M1336.718 564.106v246.38l-29.146.433"
      id="path61"
    />
    <path
      id="Vector_324-6-6-5-1-7-7-5-8"
      d="M500.417 485.295c-.007 1.262-.935 2.405-2.168 2.4l-10.18-.042c-1.13-.002-2.154-1.041-2.15-2.417.005-.63.211-1.26.573-1.66l5.11-5.656c.775-.857 2.06-.852 2.931-.104l.103.116 5.067 5.697c.615.519.716 1.035.714 1.666z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      id="Vector_324-6-6-5-1-7-7-5-8-0"
      d="M368.95 504.817c-.007 1.262-.935 2.404-2.168 2.4l-10.18-.043c-1.13-.002-2.154-1.04-2.15-2.416.005-.631.211-1.261.573-1.66l5.11-5.657c.775-.856 2.06-.851 2.931-.103l.103.115 5.067 5.698c.615.518.716 1.035.714 1.666z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      id="Vector_324-6-6-5-1-7-7-5-8-0-0"
      d="M368.272 717.4c-.007 1.262-.935 2.405-2.168 2.4l-10.18-.042c-1.13-.002-2.155-1.041-2.15-2.417.005-.63.211-1.26.573-1.66l5.11-5.656c.775-.857 2.06-.852 2.931-.103l.102.115 5.068 5.697c.615.519.716 1.035.714 1.666z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      style={{
        opacity: 1,
        fill: "#fff",
        fillOpacity: 0,
        fillRule: "nonzero",
        stroke: "#35aae9",
        strokeWidth: 3.66765,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 0.853007,
      }}
      d="m455.604 1098.972.424-89.012 102.419.692"
      id="path63"
    />
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={319.333}
      y={930.455}
      id="text43-0-7"
    >
      <tspan
        id="tspan43-0-8"
        x={319.333}
        y={930.455}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"BOMBA  "}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={318.524}
      y={944.585}
      id="text43-0-4-8"
    >
      <tspan
        id="tspan43-0-9-2"
        x={318.524}
        y={944.585}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"FILTRACION"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={1288.494}
      y={860.01}
      id="text43-0-7-2"
    >
      <tspan
        id="tspan43-0-8-0"
        x={1288.494}
        y={860.01}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"BOMBA  "}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={1288.626}
      y={873.513}
      id="text43-0-4-8-9"
    >
      <tspan
        id="tspan43-0-9-2-7"
        x={1288.626}
        y={873.513}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"RETORNO"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 16,
        fontFamily: "Arial-BoldMT",
        InkscapeFontSpecification: "&quot",
        fontVariantLigatures: "normal",
        fontVariantCaps: "normal",
        fontVariantNumeric: "normal",
        fontVariantEastAsian: "normal",
        textAlign: "center",
        writingMode: "lr-tb",
        direction: "ltr",
        textAnchor: "middle",
        fill: "#000",
        fillOpacity: 1,
        stroke: "#030303",
        strokeWidth: 0,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
        paintOrder: "fill markers stroke",
      }}
      x={1289.979}
      y={889.206}
      id="text43-0-4-8-9-2"
    >
      <tspan
        id="tspan43-0-9-2-7-6"
        x={1289.979}
        y={889.206}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 16,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"CLARIFICADO"}
      </tspan>
    </text>
    <path
      id="Vector_324-6-6-2"
      d="M678.05 540.874c0-1.26.921-2.409 2.155-2.41l10.179-.012c1.13-.003 2.16 1.03 2.163 2.405 0 .63-.204 1.262-.563 1.664l-5.081 5.683c-.77.86-2.055.862-2.93.118l-.103-.115-5.098-5.67c-.618-.515-.722-1.031-.723-1.662z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      id="Vector_324-6-6-5-1-7-7-5-8-0-4"
      d="M408.446 919.05c-.007 1.262-.935 2.404-2.168 2.4l-10.179-.042c-1.131-.002-2.155-1.041-2.15-2.417.004-.631.21-1.261.572-1.66l5.11-5.656c.775-.857 2.06-.852 2.931-.104l.103.115 5.067 5.698c.615.518.716 1.035.714 1.666z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      id="Vector_324-6-6-5-1-7-7-5-8-0-4-3"
      d="M463.272 1041.28c-.007 1.262-.934 2.405-2.168 2.4l-10.179-.042c-1.13 0-2.155-1.04-2.15-2.417.004-.63.21-1.26.572-1.66l5.11-5.656c.775-.857 2.06-.851 2.932-.103l.102.115 5.068 5.697c.615.519.716 1.036.713 1.666z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <g
      id="Group_32-5-67-9-8-4"
      transform="matrix(1.20095 0 0 1.13377 418.05 53.728)"
      style={{
        strokeWidth: 1.58724,
        strokeDasharray: "none",
      }}
    >
      <path
        id="Vector_65-4-6-9-7-8"
        d="M596.6 586h-14.8c-.9 0-1.6-.7-1.6-1.6v-14.8c0-.9.7-1.6 1.6-1.6h14.8c.9 0 1.6.7 1.6 1.6v14.8c0 .9-.7 1.6-1.6 1.6"
        fill={VE318Color}
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      />
      <g
        id="Group_33-3-7-5-4-8"
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      >
        <path
          id="Vector_66-1-7-9-2-2"
          d="m581.4 589.9 7.9 4.6c.5.3.5 1 0 1.3l-7.9 4.6c-.5.3-1.2-.1-1.2-.7v-9.2c0-.5.7-.9 1.2-.6"
          fill={VE318Color}
          style={{
            strokeWidth: 1.58724,
            strokeDasharray: "none",
          }}
        />
        <path
          id="Vector_67-2-19-2-7-4"
          d="m597 600.5-7.9-4.6c-.5-.3-.5-1 0-1.3l7.9-4.6c.5-.3 1.2.1 1.2.7v9.2c0 .5-.7.9-1.2.6"
          fill={VE318Color}
          style={{
            strokeWidth: 1.58724,
            strokeDasharray: "none",
          }}
        />
      </g>
      <path
        id="Vector_68-3-16-6-7-5"
        d="M589.2 585v10"
        stroke={VE318Color}
        strokeWidth={4}
        strokeMiterlimit={10}
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      />
      <path
        id="Vector_69-3-2-5-9-5"
        d="M580.2 577h18"
        stroke="#fff"
        strokeWidth={2}
        strokeMiterlimit={10}
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      />
      <path
        id="Vector_70-4-7-3-3-1"
        d="M589.2 578v8"
        stroke="#fff"
        strokeWidth={2}
        strokeMiterlimit={10}
        style={{
          strokeWidth: 1.58724,
          strokeDasharray: "none",
        }}
      />
    </g>
    <path
      style={{
        opacity: 0.994302,
        fill: "#71a5ff",
        fillOpacity: 0,
        stroke: "#2a8b8b",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="M1255.075 336.53v-52.41l-83.365-.275.258 29.223"
      id="path1"
    />
    <path
      id="Vector_324-1"
      d="M1166.656 316.505c.013-.86.744-1.635 1.704-1.624l7.92.09c.88.008 1.67.722 1.656 1.661-.01.43-.172.86-.456 1.13l-4.015 3.828c-.609.58-1.609.569-2.281.053l-.08-.08-3.904-3.917c-.475-.357-.55-.71-.544-1.14z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#2a8b8b",
        fillOpacity: 1,
        stroke: "#2a8b8b",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      id="Vector_324-1-7"
      d="M1107.221 316.819c.013-.86.744-1.635 1.703-1.624l7.92.09c.88.008 1.67.722 1.657 1.661-.01.43-.173.859-.456 1.13l-4.016 3.828c-.608.58-1.608.569-2.28.053l-.08-.08-3.904-3.917c-.475-.357-.55-.71-.544-1.14z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#2a8b8b",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      style={{
        opacity: 1,
        fill: "#fffffb",
        fillOpacity: 0.0344828,
        stroke: "#35ade9",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m1138.716 728.824 33.882-.627-1.255 286.745v0h-82.196"
      id="path10"
    />
    <path
      className="st37"
      id="circle448-0-6"
      style={{
        fill: "#fff",
        fillOpacity: 1,
        stroke: "#35ace8",
        strokeWidth: 4,
        strokeMiterlimit: 10,
        strokeDasharray: "none",
      }}
      d="M-803.072-1165.211a9.272 8.842 0 0 1-9.172 8.841 9.272 8.842 0 0 1-9.37-8.651"
      transform="rotate(89.43)scale(-1 1)skewY(.08)"
    />
    <path
      id="Vector_185-8-1"
      d="M1246.06 345.096h18.914c1.08 0 2.026-.914 2.026-1.958v-18.276c0-1.044-.946-1.958-2.026-1.958h-18.913c-1.08 0-2.026.914-2.026 1.958v18.276c0 1.044.945 1.958 2.026 1.958"
      fill={P015Color}
      style={{
        strokeWidth: 1.32796,
      }}
    />
    <path
      style={{
        opacity: 1,
        fill: "#fffffb",
        fillOpacity: 0.0344828,
        stroke: "#35ade9",
        strokeWidth: 3.99874,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m228.492 724.243 78.923.887-.443 74.095 949.354 1.757"
      id="path11"
    />
    <path
      id="Vector_324-6-6-5-1-7-7-7"
      d="M962.555 792.825c1.262-.007 2.414.908 2.423 2.142l.068 10.179c.01 1.13-1.018 2.166-2.394 2.176-.63.003-1.262-.197-1.666-.554l-5.71-5.05c-.866-.765-.874-2.05-.136-2.929l.114-.104 5.642-5.129c.512-.62 1.028-.727 1.659-.731z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      id="Vector_324-6-6-5-1-7-7-5-8-0-0-1"
      d="M314.603 760.295c-.007 1.261-.935 2.404-2.168 2.399l-10.18-.042c-1.13-.002-2.155-1.041-2.15-2.417.005-.63.211-1.26.573-1.66l5.11-5.656c.775-.857 2.06-.852 2.931-.103l.102.115 5.068 5.697c.615.519.716 1.035.714 1.666z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      id="Vector_324-6-6-5-1-7-7-77"
      d="M566.241 792.178c1.262-.007 2.415.908 2.423 2.142l.068 10.178c.01 1.131-1.017 2.167-2.393 2.176-.631.003-1.263-.196-1.667-.553l-5.71-5.05c-.866-.765-.874-2.05-.135-2.929l.114-.104 5.642-5.129c.512-.62 1.027-.727 1.658-.731z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#007eea",
        fillOpacity: 1,
        stroke: "#fff",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <rect
      style={{
        opacity: 1,
        mixBlendMode: "hard-light",
        fill: "#fff",
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
      height={163.175}
      x={1092.085}
      y={13.428}
      rx={1.8}
      ry={0}
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
      x={1164.581}
      y={97.879}
      id="text12-1"
    >
      <tspan
        id="tspan12-5"
        x={1164.581}
        y={97.879}
        style={{
          fontSize: 16,
        }}
      >
        {"Moviendose"}
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
      d="M1100.217 120.059a9.76 9.539 0 0 1 9.584-9.697 9.76 9.539 0 0 1 9.934 9.355 9.76 9.539 0 0 1-9.56 9.72 9.76 9.539 0 0 1-9.958-9.332l9.759-.206z"
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
      d="M1100.445 146.956a9.76 9.539 0 0 1 9.585-9.696 9.76 9.539 0 0 1 9.934 9.355 9.76 9.539 0 0 1-9.561 9.72 9.76 9.539 0 0 1-9.957-9.333l9.759-.205z"
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
      d="M1100.217 93.07a9.76 9.539 0 0 1 9.584-9.698 9.76 9.539 0 0 1 9.934 9.356 9.76 9.539 0 0 1-9.56 9.719 9.76 9.539 0 0 1-9.958-9.332l9.759-.205z"
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
        fill: "#fff",
        fillOpacity: 1,
        stroke: "#113c54",
        strokeWidth: 0.1,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      transform="translate(-38.657 -11.636)"
    >
      <tspan x={1136.993} y={49} id="tspan22">
        <tspan
          style={{
            fill: "#2c2c2c",
          }}
          id="tspan21"
        >
          {"Funcionamiento de Equipos"}
        </tspan>
      </tspan>
    </text>
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
      d="M1100.194 65.335a9.776 9.539 0 0 1 9.608-9.697 9.776 9.539 0 0 1 9.942 9.37 9.776 9.539 0 0 1-9.6 9.705 9.776 9.539 0 0 1-9.95-9.363l9.775-.175z"
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
      x={1165.886}
      y={70.902}
      id="text12"
    >
      <tspan
        id="tspan12"
        x={1165.886}
        y={70.902}
        style={{
          fontSize: 16,
        }}
      >
        {"Funcionando"}
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
      x={1139.016}
      y={125.702}
      id="text13"
    >
      <tspan id="tspan13" x={1139.016} y={125.702}>
        {"Falla"}
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
      x={1153.426}
      y={151.264}
      id="text13-6"
    >
      <tspan id="tspan13-1" x={1153.426} y={151.264}>
        {"Detenida"}
      </tspan>
    </text>
    <path
      style={{
        fill: "#4a4a4a",
        fillOpacity: 0,
        fillRule: "nonzero",
        stroke: "#4a4a4a",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m587.997 401.6-.159-24.588"
      id="path55-4-1"
    />
    <path
      style={{
        fill: "#0bffff",
        fillOpacity: 0,
        stroke: "#4b4b4b",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="M962 325.308v75.996"
      id="path4"
    />
    <g
      id="pt-card-0-0"
      transform="matrix(.84984 0 0 .62558 525.511 1034.374)"
      style={{
        strokeWidth: 1.37149,
      }}
    >
      <rect
        x={1}
        y={1}
        width={138}
        height={68}
        rx={4.113}
        ry={5.354}
        fill="#fff"
        stroke="#8a94a6"
        strokeWidth={2.743}
        id="rect1-2-6-3"
      />
    </g>
  </svg>
  );
};
export default SVGComponent;
