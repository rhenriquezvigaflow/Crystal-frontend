import * as React from "react";

type ValveCode =
  | "VE-237"
  | "VE-238"
  | "VE-239"
  | "VE-240"
  | "VE-244"
  | "VE-401"
  | "VE-402";

type AuxiliaryCode =
  | "FILTRACION-RETROLAVADO"
  | "CL-FLO12"
  | "RETORNO-CLARIFICADO"
  | "P-007"
  | "P-008";

type ValveState = 0 | 1 | 2 | 3;

const VALVE_STATE_COLORS: Record<ValveState, string> = {
  0: "#ef4444",
  1: "#22c55e",
  2: "#3b82f6",
  3: "#facc15",
};

const DEFAULT_VALVE_COLOR = VALVE_STATE_COLORS[0];

const TAG_CANDIDATE_SUFFIXES = [
  "",
  "_SCADA",
  "_scada",
  "_STS_SCADA",
  "_sts_scada",
  "_STATUS_SCADA",
  "_status_scada",
  "_STATE_SCADA",
  "_state_scada",
] as const;

const AUXILIARY_TAG_ALIASES: Partial<Record<AuxiliaryCode, string[]>> = {
  "CL-FLO12": ["CL-FL012"],
};

function normalizeTagKey(key: string) {
  return key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function buildNormalizedTags(tags: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(tags ?? {}).map(([key, value]) => [normalizeTagKey(key), value]),
  );
}

function getValveTagCandidates(valveCode: ValveCode) {
  const digits = valveCode.replace(/\D/g, "");
  const baseCandidates = [
    valveCode,
    valveCode.toUpperCase(),
    valveCode.toLowerCase(),
    `VE-${digits}`,
    `ve-${digits}`,
    `VE_${digits}`,
    `ve_${digits}`,
    `VE${digits}`,
    `ve${digits}`,
  ];

  return Array.from(
    new Set(
      baseCandidates.flatMap((candidate) =>
        TAG_CANDIDATE_SUFFIXES.map((suffix) => `${candidate}${suffix}`),
      ),
    ),
  );
}

function getAuxiliaryTagCandidates(auxiliaryCode: AuxiliaryCode) {
  const aliases = AUXILIARY_TAG_ALIASES[auxiliaryCode] ?? [];
  const baseCandidates = [auxiliaryCode, ...aliases].flatMap((code) => {
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

  return Array.from(
    new Set(
      baseCandidates.flatMap((candidate) =>
        TAG_CANDIDATE_SUFFIXES.map((suffix) => `${candidate}${suffix}`),
      ),
    ),
  );
}

function coerceValveState(value: unknown): ValveState | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = Math.trunc(value);
    return parsed >= 0 && parsed <= 3 ? (parsed as ValveState) : null;
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
      case "moviéndose":
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
        return Number.isFinite(parsed) ? coerceValveState(parsed) : null;
      }
    }
  }

  return null;
}

function getValveColor(
  normalizedTags: Record<string, unknown>,
  valveCode: ValveCode,
) {
  for (const candidate of getValveTagCandidates(valveCode)) {
    const state = coerceValveState(normalizedTags[normalizeTagKey(candidate)]);
    if (state !== null) return VALVE_STATE_COLORS[state];
  }

  return DEFAULT_VALVE_COLOR;
}

function getAuxiliaryColor(
  normalizedTags: Record<string, unknown>,
  auxiliaryCode: AuxiliaryCode,
) {
  for (const candidate of getAuxiliaryTagCandidates(auxiliaryCode)) {
    const state = coerceValveState(normalizedTags[normalizeTagKey(candidate)]);
    if (state !== null) return VALVE_STATE_COLORS[state];
  }

  return DEFAULT_VALVE_COLOR;
}

function getValveIndicatorStyle(color: string) {
  return {
    fill: color,
    strokeWidth: 0.858079,
  };
}

function getRoundIndicatorStyle(color: string) {
  return {
    opacity: 1,
    fill: color,
    strokeWidth: 0.779157,
    enableBackground: "new",
  };
}

const SVGComponent = ({
  tags = {},
  ...props
}: React.SVGProps<SVGSVGElement> & { tags?: Record<string, unknown> }) => {
  const normalizedTags = buildNormalizedTags(tags);
  const VE237Color = getValveColor(normalizedTags, "VE-237");
  const VE238Color = getValveColor(normalizedTags, "VE-238");
  const VE239Color = getValveColor(normalizedTags, "VE-239");
  const VE240Color = getValveColor(normalizedTags, "VE-240");
  const VE244Color = getValveColor(normalizedTags, "VE-244");
  const VE401Color = getValveColor(normalizedTags, "VE-401");
  const VE402Color = getValveColor(normalizedTags, "VE-402");
  const CLFLO12Color = getAuxiliaryColor(normalizedTags, "CL-FLO12");
  const FiltracionRetrolavadoColor = getAuxiliaryColor(
    normalizedTags,
    "FILTRACION-RETROLAVADO",
  );
  const RetornoClarificadoColor = getAuxiliaryColor(
    normalizedTags,
    "RETORNO-CLARIFICADO",
  );
  const P007Color = getAuxiliaryColor(normalizedTags, "P-007");
  const P008Color = getAuxiliaryColor(normalizedTags, "P-008");
  return (

    
  <svg
    id="Capa_1"
    x={0}
    y={0}
    viewBox="0 0 1400 1150"
    xmlSpace="preserve"
    width={1400}
    height={1150}
    xmlnsXlink="http://www.w3.org/1999/xlink"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs id="defs489">
      <path id="rect1" d="M133.99 238.475h87.626v18.634H133.99z" />
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
      <path id="rect38-8" d="M523.126 339.859h202.021v41H523.126z" />
      <path id="rect38-1" d="M523.126 339.859h100.278v22.229H523.126z" />
      <path id="rect36-2" d="M241.015 625.941h106.521v24.166H241.015z" />
      <path id="rect34-3" d="M28.642 656.679h76.845v20.958H28.642z" />
      <path id="rect36-5" d="M241.015 625.941h113.172v22.355H241.015z" />
      <path id="rect36-0" d="M241.015 625.941h113.172v22.355H241.015z" />
      <path id="rect36-0-0" d="M241.015 625.941h113.172v22.355H241.015z" />
      <path id="rect36-0-0-0" d="M241.015 625.941h113.172v22.355H241.015z" />
      <path id="rect36-0-0-0-1" d="M241.015 625.941h113.172v22.355H241.015z" />
      <path id="rect35-6" d="M141.815 523.946h158.346v61.186H141.815z" />
      <path id="rect35-6-2" d="M141.815 523.946h60.778v21.656h-60.778z" />
      <path id="rect35-6-2-3" d="M141.815 523.946h60.778v21.656h-60.778z" />
      <path id="rect35-6-2-0" d="M141.815 523.946h60.778v21.656h-60.778z" />
      <path id="rect35-6-2-7" d="M141.815 523.946h60.778v21.656h-60.778z" />
      <path id="rect35-6-2-0-2" d="M141.815 523.946h60.778v21.656h-60.778z" />
      <path id="rect35-6-2-7-6" d="M141.815 523.946h60.778v21.656h-60.778z" />
      <path id="rect35-6-2-7-6-7" d="M141.815 523.946h60.778v21.656h-60.778z" />
      <path id="rect35-6-2-0-2-2" d="M141.815 523.946h60.778v21.656h-60.778z" />
      <path
        id="rect35-6-2-0-2-2-3"
        d="M141.815 523.946h60.778v21.656h-60.778z"
      />
      <path id="rect35-6-2-0-5" d="M141.815 523.946h60.778v21.656h-60.778z" />
      <path id="rect35-6-2-0-5-8" d="M141.815 523.946h60.778v21.656h-60.778z" />
      <path id="rect35-6-2-0-5-1" d="M141.815 523.946h60.778v21.656h-60.778z" />
      <path id="rect35-6-2-0-5-2" d="M141.815 523.946h80.856v21.656h-80.856z" />
      <path id="rect35-6-2-0-5-4" d="M141.815 523.946h60.778v21.656h-60.778z" />
      <path id="rect35-0" d="M141.815 523.946h60.778v21.656h-60.778z" />
      <path id="rect35-4" d="M141.815 523.946h60.778v21.656h-60.778z" />
      <path id="rect35-5" d="M141.815 523.946h60.778v21.656h-60.778z" />
      <path id="rect2" d="M1134.477 31.501h230.267v31.501h-230.267z" />
      <path id="rect35-1" d="M141.815 523.946h83.514v18.274h-83.514z" />
      <linearGradient id="swatch12">
        <stop
          style={{
            stopColor: "#182b3e",
            stopOpacity: 1,
          }}
          offset={0}
          id="stop12"
        />
      </linearGradient>
      <linearGradient id="linearGradient7">
        <stop
          style={{
            stopColor: "#000",
            stopOpacity: 1,
          }}
          offset={0}
          id="stop7"
        />
        <stop
          style={{
            stopColor: "#070606",
            stopOpacity: 0,
          }}
          offset={1}
          id="stop8"
        />
      </linearGradient>
      <linearGradient id="swatch25">
        <stop
          style={{
            stopColor: "#050606",
            stopOpacity: 1,
          }}
          offset={0}
          id="stop25"
        />
      </linearGradient>
      <linearGradient
        id="panelFill"
        x1={240}
        y1={140}
        x2={560}
        y2={460}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#fff" stopOpacity={0.06} id="stop1" />
        <stop offset="100%" stopColor="#fff" stopOpacity={0.015} id="stop2" />
      </linearGradient>
      <linearGradient
        id="borderGrey"
        x1={238.5}
        y1={138.5}
        x2={238.5}
        y2={461.5}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#d0d0d0" stopOpacity={0.95} id="stop3" />
        <stop offset="100%" stopColor="#8e8e8e" stopOpacity={0.95} id="stop4" />
      </linearGradient>
      <linearGradient
        id="panelFill-6"
        x1={240}
        y1={140}
        x2={560}
        y2={460}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#fff" stopOpacity={0.06} id="stop1-0" />
        <stop offset="100%" stopColor="#fff" stopOpacity={0.015} id="stop2-2" />
      </linearGradient>
      <linearGradient
        id="borderGrey-4"
        x1={238.5}
        y1={138.5}
        x2={238.5}
        y2={461.5}
        gradientUnits="userSpaceOnUse"
      >
        <stop
          offset={0}
          stopColor="#d0d0d0"
          stopOpacity={0.95}
          id="stop3-8"
          style={{
            stopColor: "#000",
            stopOpacity: 1,
          }}
        />
        <stop
          offset={1}
          stopColor="#8e8e8e"
          stopOpacity={0.95}
          id="stop4-6"
          style={{
            stopColor: "#000",
            stopOpacity: 1,
          }}
        />
      </linearGradient>
      <linearGradient
        xlinkHref="#swatch12-1"
        id="linearGradient12"
        x1={1090.585}
        y1={95.016}
        x2={1353.869}
        y2={95.016}
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(5.808 19.148)"
      />
      <linearGradient id="swatch12-1">
        <stop
          style={{
            stopColor: "#000",
            stopOpacity: 1,
          }}
          offset={0.25}
          id="stop12-8"
        />
      </linearGradient>
      <pattern
        id="microGrid"
        width={16}
        height={16}
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M16 0H0v16"
          fill="none"
          stroke="#fff"
          strokeOpacity={0.04}
          strokeWidth={1}
          id="path4"
        />
      </pattern>
      <pattern
        id="microGrid-5"
        width={16}
        height={16}
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M16 0H0v16"
          fill="none"
          stroke="#fff"
          strokeOpacity={0.04}
          strokeWidth={1}
          id="path4-0"
        />
      </pattern>
      <filter
        id="softShadow"
        x={-0.005}
        y={-0.005}
        width={1.009}
        height={1.009}
      >
        <feDropShadow
          dx={0}
          dy={6}
          stdDeviation={8}
          floodColor="#000"
          floodOpacity={0.25}
        />
      </filter>
      <filter
        id="softShadow-8"
        x={-0.005}
        y={-0.005}
        width={1.009}
        height={1.009}
      >
        <feDropShadow
          dx={0}
          dy={6}
          stdDeviation={8}
          floodColor="#000"
          floodOpacity={0.25}
        />
      </filter>
    </defs>
    <style type="text/css" id="style1">
      {
        '.st4{fill:#00cd98}.st5{fill:#3574e0}.st6{fill:#fbc43b}.st7{fill:#ff6200}.st8{fill:#666}.st9{font-family:"ArialMT"}.st10{font-size:14px}.st11{fill:#606060}.st12{font-family:"Arial-BoldMT"}.st13{font-size:17px}.st14{fill:#00e098}.st15{opacity:.5;fill:none;stroke:#b3b3b3;stroke-width:.5;stroke-miterlimit:10;enable-background:new}.st17{fill:#2f3e49}.st18{fill:#00aeed}.st19{opacity:.15;fill:#0e76e7;enable-background:new}.st20{font-size:11px}.st21{opacity:.6;fill:none;stroke:#cbcbcb;stroke-width:2;stroke-miterlimit:10;enable-background:new}.st22{fill:#cbcbcb}.st23{fill:none;stroke:#2f3e49;stroke-width:4;stroke-miterlimit:10}.st24{fill:#00a39b}.st25{fill:none;stroke:#35ace8;stroke-width:4;stroke-miterlimit:10}.st26{fill:#0e76e7}.st27{fill:#323e48}.st28,.st29{fill:none;stroke:#323e48;stroke-width:4;stroke-miterlimit:10}.st29{stroke:#fff;stroke-width:2}.st30{fill:#7c7c7c}.st31{font-size:9px}.st32{fill:none;stroke:#2f3e49;stroke-width:3;stroke-miterlimit:10}.st33{font-size:16px}.st34{font-size:13px}.st35{fill:#c6c6c6}.st36{font-size:10px}.st37{fill:#fff;stroke:#35ace8;stroke-width:4;stroke-miterlimit:10}.st38{enable-background:new}.st39,.st40{fill:#fff;stroke:#008ba3;stroke-width:4;stroke-miterlimit:10}.st40{fill:#00aeed;stroke:#fff}.bg{fill:#e9eaec}.panel{fill:#fff;stroke:#9aa3ad;stroke-width:2;rx:10}.pipe{fill:none;stroke:#7b8794;stroke-width:8}.flow{fill:#2f80ff}.equip{fill:#e7b84b;stroke:#9c7a1e;rx:10}.equip,.lagoon,.tank{stroke-width:2}.tank{rx:10;fill:#f5f7fa;stroke:#9aa3ad}.lagoon{fill:#2fd0e6;stroke:#0aa;rx:18}.label{font-family:Arial,Helvetica,sans-serif;fill:#1f2937;font-size:16px}.small{font-size:14px}.title{font-size:28px;font-weight:700}.status-green{fill:#22c55e}.status-red{fill:#ef4444}.status-yellow{fill:#f59e0b}.st2{fill:#004b84}.st3{fill:#394049}'
      }
    </style>
    <path
      className="st26"
      id="rect37"
      style={{
        fill: "#0e76e7",
        strokeWidth: 1.17561,
      }}
      d="M101.683 499.492h124.8v80.411h-124.8z"
    />
    <path
      className="st23"
      d="M226.189 483.367v92.992c0 1.422-.598 2.592-1.196 2.592h-121.62c-.697 0-1.196-1.17-1.196-2.592v-92.992"
      id="path38"
      style={{
        fill: "none",
        stroke: "#2f3e49",
        strokeWidth: 4.55445,
        strokeMiterlimit: 10,
      }}
    />
    <g
      id="g24"
      transform="matrix(1.33727 0 0 1.33926 -268.106 -173.882)"
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
      transform="matrix(1.26637 0 0 1.30074 -245.901 -159.419)"
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
            enableBackground: "new",
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
        style={getRoundIndicatorStyle(CLFLO12Color)}
      />
    </g>
    <g
      id="g24-6"
      transform="matrix(1.33727 0 0 1.33926 -38.108 233.631)"
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
      id="g27-2"
      transform="matrix(1.26637 0 0 1.30074 -17.771 248.217)"
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
            enableBackground: "new",
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
        style={getRoundIndicatorStyle(FiltracionRetrolavadoColor)}
      />
    </g>
    <g id="g9" transform="translate(-29 89)" />
    <g id="layer1" />
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
      transform="translate(-21.28 -254.026)"
    >
      <tspan x={36.718} y={671.277} id="tspan3">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan2"
        >
          {"CL-FL012"}
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
      transform="translate(-22.521 -136.818)"
    >
      <tspan x={149.986} y={538.543} id="tspan5">
        <tspan
          style={{
            fontSize: 14,
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan4"
        >
          {"BOMBA"}
        </tspan>
      </tspan>
      <tspan x={141.814} y={560.199} id="tspan7">
        <tspan
          dx="0 11.171875 7.65625 7.265625 9.1953125 8.75 12.59375 10.171875"
          id="tspan6"
        />
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      id="text35-8"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 14,
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
        shapeInside: "url(#rect35-1)",
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
      transform="translate(-32.18 -122.546)"
    >
      <tspan x={157.017} y={536.718} id="tspan9">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan8"
        >
          {"CL-FL012"}
        </tspan>
      </tspan>
    </text>
    <g
      id="Group_32-5"
      transform="matrix(1.2 0 0 1.13179 -469.096 94.139)"
      style={{
        strokeWidth: 0.858079,
      }}
    >
      <path
        id="Vector_65-4"
        d="M596.6 586h-14.8c-.9 0-1.6-.7-1.6-1.6v-14.8c0-.9.7-1.6 1.6-1.6h14.8c.9 0 1.6.7 1.6 1.6v14.8c0 .9-.7 1.6-1.6 1.6"
        fill="#323e48"
        style={getValveIndicatorStyle(VE401Color)}
      />
      <g
        id="Group_33-3"
        style={{
          strokeWidth: 0.858079,
        }}
      >
        <path
          id="Vector_66-1"
          d="m581.4 589.9 7.9 4.6c.5.3.5 1 0 1.3l-7.9 4.6c-.5.3-1.2-.1-1.2-.7v-9.2c0-.5.7-.9 1.2-.6"
          fill="#323e48"
          style={getValveIndicatorStyle(VE401Color)}
        />
        <path
          id="Vector_67-2"
          d="m597 600.5-7.9-4.6c-.5-.3-.5-1 0-1.3l7.9-4.6c.5-.3 1.2.1 1.2.7v9.2c0 .5-.7.9-1.2.6"
          fill="#323e48"
          style={getValveIndicatorStyle(VE401Color)}
        />
      </g>
      <path
        id="Vector_68-3"
        d="M589.2 585v10"
        stroke={VE401Color}
        strokeWidth={3.432}
        strokeMiterlimit={10}
      />
      <path
        id="Vector_69-3"
        d="M580.2 577h18"
        stroke="#fff"
        strokeWidth={1.716}
        strokeMiterlimit={10}
      />
      <path
        id="Vector_70-4"
        d="M589.2 578v8"
        stroke="#fff"
        strokeWidth={1.716}
        strokeMiterlimit={10}
      />
    </g>
    <g
      id="Group_32-5-6"
      transform="matrix(1.2 0 0 1.13179 -475.192 278.593)"
      style={{
        strokeWidth: 0.858079,
      }}
    >
      <path
        id="Vector_65-4-0"
        d="M595.727 663.02h-14.8c-.9 0-1.6-.7-1.6-1.6v-14.8c0-.9.7-1.6 1.6-1.6h14.8c.9 0 1.6.7 1.6 1.6v14.8c0 .9-.7 1.6-1.6 1.6"
        fill="#323e48"
        style={getValveIndicatorStyle(VE402Color)}
      />
      <g
        id="Group_33-3-6"
        transform="translate(-.873 77.02)"
        style={{
          strokeWidth: 0.858079,
        }}
      >
        <path
          id="Vector_66-1-1"
          d="m581.4 589.9 7.9 4.6c.5.3.5 1 0 1.3l-7.9 4.6c-.5.3-1.2-.1-1.2-.7v-9.2c0-.5.7-.9 1.2-.6"
          fill="#323e48"
          style={getValveIndicatorStyle(VE402Color)}
        />
        <path
          id="Vector_67-2-1"
          d="m597 600.5-7.9-4.6c-.5-.3-.5-1 0-1.3l7.9-4.6c.5-.3 1.2.1 1.2.7v9.2c0 .5-.7.9-1.2.6"
          fill="#323e48"
          style={getValveIndicatorStyle(VE402Color)}
        />
      </g>
      <path
        id="Vector_68-3-1"
        d="M588.327 662.02v10"
        stroke={VE402Color}
        strokeWidth={3.432}
        strokeMiterlimit={10}
      />
      <path
        id="Vector_69-3-7"
        d="M579.327 654.02h18"
        stroke="#fff"
        strokeWidth={1.716}
        strokeMiterlimit={10}
      />
      <path
        id="Vector_70-4-3"
        d="M588.327 655.02v8"
        stroke="#fff"
        strokeWidth={1.716}
        strokeMiterlimit={10}
      />
    </g>
    <path
      className="st26"
      id="rect37-0"
      style={{
        fill: "#0e76e7",
        strokeWidth: 1.17561,
      }}
      d="M12.062 780.781h124.8v80.411h-124.8z"
    />
    <path
      className="st23"
      d="M134.592 767.621v92.992c0 1.421-.599 2.592-1.197 2.592H11.776c-.698 0-1.196-1.17-1.196-2.592V767.62"
      id="path38-1"
      style={{
        fill: "none",
        stroke: "#2f3e49",
        strokeWidth: 4.55445,
        strokeMiterlimit: 10,
      }}
    />
    <text
      xmlSpace="preserve"
      id="text36-7"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 14,
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
        shapeInside: "url(#rect36-5)",
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
      transform="translate(-246.593 -102.833)"
    >
      <tspan x={262.226} y={638.714} id="tspan11">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan10"
        >
          {"TK LIMPIEZA"}
        </tspan>
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      id="text36-9"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 14,
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
        shapeInside: "url(#rect36-0)",
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
      transform="translate(-245.882 -87.436)"
    >
      <tspan x={276.352} y={638.714} id="tspan15">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan14"
        >
          {"FONDO"}
        </tspan>
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      id="text36-9-4"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 14,
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
        shapeInside: "url(#rect36-0-0)",
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
      transform="translate(-190.931 248.555)"
    >
      <tspan x={273.184} y={638.714} id="tspan17">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan16"
        >
          {"LAGUNA"}
        </tspan>
      </tspan>
    </text>
    <g
      id="pt-card-87-7-6"
      transform="matrix(.83672 0 0 .70824 342.468 529.646)"
      style={{
        strokeWidth: 1.32336,
      }}
    >
      <rect
        x={2.476}
        y={1}
        width={138}
        height={68}
        rx={4.894}
        ry={6.063}
        fill="#fff"
        stroke="#8a94a6"
        strokeWidth={2.647}
        id="rect1-2-7-4-2"
      />
      <path
        stroke="#8a94a6"
        strokeWidth={1.985}
        id="line1-8-3-6"
        d="M6 34h128"
      />
    </g>
    <text
      xmlSpace="preserve"
      id="text35-5-9-6-9-5"
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
        shapeInside: "url(#rect35-6-2-0-5-2)",
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
      transform="translate(216.31 9.885)"
    >
      <tspan x={158.665} y={538.543} id="tspan19">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan18"
        >
          {"FIT-002"}
        </tspan>
      </tspan>
    </text>
    <g
      id="pt-card-87-7-6-0"
      transform="matrix(.83662 0 0 .70824 342.476 431.131)"
      style={{
        strokeWidth: 1.32344,
      }}
    >
      <rect
        x={2.476}
        y={1}
        width={138}
        height={68}
        rx={4.894}
        ry={6.063}
        fill="#fff"
        stroke="#8a94a6"
        strokeWidth={2.647}
        id="rect1-2-7-4-2-0"
      />
      <path
        stroke="#8a94a6"
        strokeWidth={1.985}
        id="line1-8-3-6-8"
        d="M6 34h128"
      />
    </g>
    <text
      xmlSpace="preserve"
      id="text35-5-9-6-9"
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
        shapeInside: "url(#rect35-6-2-0-5)",
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
      transform="translate(228.61 -89.931)"
    >
      <tspan x={150.219} y={538.543} id="tspan21">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan20"
        >
          {"PT-112"}
        </tspan>
      </tspan>
    </text>
    <g
      id="pt-card-87-7-6-0-4"
      transform="matrix(.83662 0 0 .70824 946.202 700.292)"
      style={{
        strokeWidth: 1.32344,
      }}
    >
      <rect
        x={2.476}
        y={1}
        width={138}
        height={68}
        rx={4.894}
        ry={6.063}
        fill="#fff"
        stroke="#8a94a6"
        strokeWidth={2.647}
        id="rect1-2-7-4-2-0-0"
      />
      <path
        stroke="#8a94a6"
        strokeWidth={1.985}
        id="line1-8-3-6-8-6"
        d="M6 34h128"
      />
    </g>
    <text
      xmlSpace="preserve"
      id="text35-5-9-6-9-1"
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
        shapeInside: "url(#rect35-6-2-0-5-1)",
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
      transform="translate(833.124 180.621)"
    >
      <tspan x={150.219} y={538.543} id="tspan23">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan22"
        >
          {"PT-116"}
        </tspan>
      </tspan>
    </text>
    <path
      d="m461.215 455.652 22.182-.215"
      style={{
        fill: "none",
        stroke: "#2f3e49",
        strokeWidth: 2,
        strokeMiterlimit: 10,
        strokeDasharray: "none",
      }}
      id="path1-38"
    />
    <path
      d="m461.241 553.876 20.268-.214"
      style={{
        fill: "none",
        stroke: "#2f3e49",
        strokeWidth: 2.02466,
        strokeMiterlimit: 10,
      }}
      id="path1-38-5"
    />
    <g
      id="Group_32-5-67"
      transform="matrix(1.2 0 0 1.13179 -97.998 -160.13)"
      style={{
        strokeWidth: 0.858079,
      }}
    >
      <path
        id="Vector_65-4-6"
        d="M596.6 586h-14.8c-.9 0-1.6-.7-1.6-1.6v-14.8c0-.9.7-1.6 1.6-1.6h14.8c.9 0 1.6.7 1.6 1.6v14.8c0 .9-.7 1.6-1.6 1.6"
        fill="#323e48"
        style={getValveIndicatorStyle(VE239Color)}
      />
      <g
        id="Group_33-3-7"
        style={{
          strokeWidth: 0.858079,
        }}
      >
        <path
          id="Vector_66-1-7"
          d="m581.4 589.9 7.9 4.6c.5.3.5 1 0 1.3l-7.9 4.6c-.5.3-1.2-.1-1.2-.7v-9.2c0-.5.7-.9 1.2-.6"
          fill="#323e48"
          style={getValveIndicatorStyle(VE239Color)}
        />
        <path
          id="Vector_67-2-19"
          d="m597 600.5-7.9-4.6c-.5-.3-.5-1 0-1.3l7.9-4.6c.5-.3 1.2.1 1.2.7v9.2c0 .5-.7.9-1.2.6"
          fill="#323e48"
          style={getValveIndicatorStyle(VE239Color)}
        />
      </g>
      <path
        id="Vector_68-3-16"
        d="M589.2 585v10"
        stroke={VE239Color}
        strokeWidth={3.432}
        strokeMiterlimit={10}
      />
      <path
        id="Vector_69-3-2"
        d="M580.2 577h18"
        stroke="#fff"
        strokeWidth={1.716}
        strokeMiterlimit={10}
      />
      <path
        id="Vector_70-4-7"
        d="M589.2 578v8"
        stroke="#fff"
        strokeWidth={1.716}
        strokeMiterlimit={10}
      />
    </g>
    <g
      id="Group_32-5-67-9"
      transform="matrix(1.2 0 0 1.13179 -94.999 -283.835)"
      style={{
        strokeWidth: 0.858079,
      }}
    >
      <path
        id="Vector_65-4-6-9"
        d="M596.6 586h-14.8c-.9 0-1.6-.7-1.6-1.6v-14.8c0-.9.7-1.6 1.6-1.6h14.8c.9 0 1.6.7 1.6 1.6v14.8c0 .9-.7 1.6-1.6 1.6"
        fill="#323e48"
        style={getValveIndicatorStyle(VE237Color)}
      />
      <g
        id="Group_33-3-7-5"
        style={{
          strokeWidth: 0.858079,
        }}
      >
        <path
          id="Vector_66-1-7-9"
          d="m581.4 589.9 7.9 4.6c.5.3.5 1 0 1.3l-7.9 4.6c-.5.3-1.2-.1-1.2-.7v-9.2c0-.5.7-.9 1.2-.6"
          fill="#323e48"
          style={getValveIndicatorStyle(VE237Color)}
        />
        <path
          id="Vector_67-2-19-2"
          d="m597 600.5-7.9-4.6c-.5-.3-.5-1 0-1.3l7.9-4.6c.5-.3 1.2.1 1.2.7v9.2c0 .5-.7.9-1.2.6"
          fill="#323e48"
          style={getValveIndicatorStyle(VE237Color)}
        />
      </g>
      <path
        id="Vector_68-3-16-6"
        d="M589.2 585v10"
        stroke={VE237Color}
        strokeWidth={3.432}
        strokeMiterlimit={10}
      />
      <path
        id="Vector_69-3-2-5"
        d="M580.2 577h18"
        stroke="#fff"
        strokeWidth={1.716}
        strokeMiterlimit={10}
      />
      <path
        id="Vector_70-4-7-3"
        d="M589.2 578v8"
        stroke="#fff"
        strokeWidth={1.716}
        strokeMiterlimit={10}
      />
    </g>
    <path
      d="M939.096 335.766c0-47.761-44.163-86.839-124.946-86.839s-125.417 39.078-125.417 86.839v232.206c0 25.01 28.132 45.85 63.337 48.803v25.357h27.504v-24.836h65.223v24.836h27.504v-25.357c37.091-1.39 66.795-22.751 66.795-48.803V343.408Z"
      id="path16"
      style={{
        opacity: 0.86747,
        fill: "#252d34",
        fillOpacity: 0.58,
        strokeWidth: 1.9079,
        enableBackground: "new",
      }}
    />
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 32,
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
      x={813.749}
      y={364.091}
      id="text32-8-5"
    >
      <tspan
        id="tspan32-3-5"
        x={813.749}
        y={364.091}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 32,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
          fill: "#efefef",
          fillOpacity: 1,
        }}
      >
        {"FIS - 003"}
      </tspan>
    </text>
    <ellipse
      style={{
        fill: "#fff",
        fillOpacity: 1,
        stroke: "#656a58",
        strokeWidth: 4.20841,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 0.154898,
      }}
      id="path2-1-5"
      cx={811.241}
      cy={512.016}
      rx={17.938}
      ry={15.715}
    />
    <ellipse
      style={{
        fill: "#fff",
        fillOpacity: 1,
        stroke: "#656a58",
        strokeWidth: 4.20841,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 0.154898,
      }}
      id="path2-1-5-3"
      cx={811.241}
      cy={392.016}
      rx={17.938}
      ry={15.715}
    />
    <g
      id="Group_32-5-67-3"
      transform="matrix(1.2 0 0 1.13179 351.318 -159.956)"
      style={{
        strokeWidth: 0.858079,
      }}
    >
      <path
        id="Vector_65-4-6-2"
        d="M524.443 586.627h-14.8c-.9 0-1.6-.7-1.6-1.6v-14.8c0-.9.7-1.6 1.6-1.6h14.8c.9 0 1.6.7 1.6 1.6v14.8c0 .9-.7 1.6-1.6 1.6"
        fill="#323e48"
        style={getValveIndicatorStyle(VE240Color)}
      />
      <g
        id="Group_33-3-7-4"
        transform="translate(-72.157 .627)"
        style={{
          strokeWidth: 0.858079,
        }}
      >
        <path
          id="Vector_66-1-7-1"
          d="m581.4 589.9 7.9 4.6c.5.3.5 1 0 1.3l-7.9 4.6c-.5.3-1.2-.1-1.2-.7v-9.2c0-.5.7-.9 1.2-.6"
          fill="#323e48"
          style={getValveIndicatorStyle(VE240Color)}
        />
        <path
          id="Vector_67-2-19-1"
          d="m597 600.5-7.9-4.6c-.5-.3-.5-1 0-1.3l7.9-4.6c.5-.3 1.2.1 1.2.7v9.2c0 .5-.7.9-1.2.6"
          fill="#323e48"
          style={getValveIndicatorStyle(VE240Color)}
        />
      </g>
      <path
        id="Vector_68-3-16-5"
        d="M517.043 585.627v10"
        stroke={VE240Color}
        strokeWidth={3.432}
        strokeMiterlimit={10}
      />
      <path
        id="Vector_69-3-2-9"
        d="M508.043 577.627h18"
        stroke="#fff"
        strokeWidth={1.716}
        strokeMiterlimit={10}
      />
      <path
        id="Vector_70-4-7-5"
        d="M517.043 578.627v8"
        stroke="#fff"
        strokeWidth={1.716}
        strokeMiterlimit={10}
      />
    </g>
    <g
      id="Group_32-5-67-3-0"
      transform="matrix(1.2 0 0 1.13179 371.656 -280.725)"
      style={{
        strokeWidth: 0.858079,
      }}
    >
      <path
        id="Vector_65-4-6-2-6"
        d="M533.541 585.373h-14.8c-.9 0-1.6-.7-1.6-1.6v-14.8c0-.9.7-1.6 1.6-1.6h14.8c.9 0 1.6.7 1.6 1.6v14.8c0 .9-.7 1.6-1.6 1.6"
        fill="#323e48"
        style={getValveIndicatorStyle(VE238Color)}
      />
      <g
        id="Group_33-3-7-4-4"
        transform="translate(-63.059 -.627)"
        style={{
          strokeWidth: 0.858079,
        }}
      >
        <path
          id="Vector_66-1-7-1-5"
          d="m581.4 589.9 7.9 4.6c.5.3.5 1 0 1.3l-7.9 4.6c-.5.3-1.2-.1-1.2-.7v-9.2c0-.5.7-.9 1.2-.6"
          fill="#323e48"
          style={getValveIndicatorStyle(VE238Color)}
        />
        <path
          id="Vector_67-2-19-1-3"
          d="m597 600.5-7.9-4.6c-.5-.3-.5-1 0-1.3l7.9-4.6c.5-.3 1.2.1 1.2.7v9.2c0 .5-.7.9-1.2.6"
          fill="#323e48"
          style={getValveIndicatorStyle(VE238Color)}
        />
      </g>
      <path
        id="Vector_68-3-16-5-0"
        d="M526.141 584.373v10"
        stroke={VE238Color}
        strokeWidth={3.432}
        strokeMiterlimit={10}
      />
      <path
        id="Vector_69-3-2-9-8"
        d="M517.141 576.373h18"
        stroke="#fff"
        strokeWidth={1.716}
        strokeMiterlimit={10}
      />
      <path
        id="Vector_70-4-7-5-9"
        d="M526.141 577.373v8"
        stroke="#fff"
        strokeWidth={1.716}
        strokeMiterlimit={10}
      />
    </g>
    <path
      className="st26"
      id="rect37-8"
      style={{
        fill: "#0e76e7",
        strokeWidth: 1,
      }}
      d="M1234.511 611.427h124.8v58.182h-124.8z"
    />
    <path
      className="st23"
      d="M1359.211 595.532v71.505c0 1.093-.6 1.993-1.2 1.993h-122c-.7 0-1.2-.9-1.2-1.993v-71.505"
      id="path38-2"
      style={{
        fill: "none",
        stroke: "#2f3e49",
        strokeWidth: 4,
        strokeMiterlimit: 10,
      }}
    />
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 11,
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
      x={1296.54}
      y={691.608}
      id="text41"
    >
      <tspan
        id="tspan41"
        x={1296.54}
        y={691.608}
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
      <tspan
        x={1296.54}
        y={711.608}
        id="tspan42"
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
    <g
      id="Group_12-6-4-7"
      transform="matrix(1.76927 0 0 1.5723 581.028 -439.945)"
    >
      <g id="Group_15-0-9-6">
        <g id="Group_16-6-6-1">
          <path
            id="Vector_29-6-3-4"
            d="M395.197 549.87v52.091c0 .807-.398 1.498-.796 1.498h-36.914c-.497 0-.79-.691-.796-1.498l-.418-52.012"
            stroke="#2f3e49"
            strokeWidth={4.283}
            strokeMiterlimit={10}
            style={{
              fill: "#00a39b",
              fillOpacity: 1,
            }}
          />
          <g id="Group_17-1-7-2" transform="translate(-7.503 -12.63)" />
        </g>
      </g>
    </g>
    <path
      id="Vector_185-8-4"
      d="M1241.93 423.818h14c.8 0 1.5-.7 1.5-1.5v-14c0-.8-.7-1.5-1.5-1.5h-14c-.8 0-1.5.7-1.5 1.5v14c0 .8.7 1.5 1.5 1.5"
      fill={P008Color}
    />
    <g
      id="Group_12-6-4-7-2"
      transform="matrix(1.76927 0 0 1.5723 684.68 -439.945)"
    >
      <g id="Group_15-0-9-6-3">
        <g id="Group_16-6-6-1-3">
          <path
            id="Vector_29-6-3-4-4"
            d="M395.197 549.87v52.091c0 .807-.398 1.498-.796 1.498h-36.914c-.497 0-.79-.691-.796-1.498l-.418-52.012"
            stroke="#2f3e49"
            strokeWidth={4.283}
            strokeMiterlimit={10}
            style={{
              fill: "#00a39b",
              fillOpacity: 1,
            }}
          />
          <g id="Group_17-1-7-2-1" transform="translate(-7.503 -12.63)" />
        </g>
      </g>
    </g>
    <g
      id="Group_12-6-4-7-8"
      transform="matrix(1.76927 0 0 1.5723 -617.987 -556.028)"
      style={{
        strokeWidth: 1.6595896,
        strokeDasharray: "none",
      }}
    >
      <g
        id="Group_15-0-9-6-6"
        style={{
          strokeWidth: 1.6595896,
          strokeDasharray: "none",
        }}
      >
        <g
          id="Group_16-6-6-1-0"
          style={{
            strokeWidth: 1.6595896,
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
              strokeWidth: 1.6595896,
              strokeDasharray: "none",
            }}
          />
          <g
            id="Group_17-1-7-2-4"
            transform="translate(-7.503 -12.63)"
            style={{
              strokeWidth: 1.6595896,
              strokeDasharray: "none",
            }}
          />
        </g>
      </g>
    </g>
    <g
      id="g33"
      transform="matrix(.503 0 0 .62917 638.803 889.667)"
      style={{
        strokeWidth: 1.52558,
      }}
    >
      <path
        d="M60 120c50-80 210-100 350-70 180-20 310 50 340 120 30 90-100 170-290 170-180 20-350-40-380-100-40-50-40-90-20-120"
        fill="#e8d8a8"
        id="path1-2"
        style={{
          strokeWidth: 1.52558,
        }}
      />
      <path
        d="M90 130c40-60 170-70 310-50 150-20 260 30 280 80 20 60-70 120-220 120-150 20-310-20-340-60-30-30-30-60-30-90"
        fill="#1ecbe1"
        id="path2"
        style={{
          fill: "#0ff",
          fillOpacity: 1,
          strokeWidth: 1.52558,
        }}
      />
      <text
        xmlSpace="preserve"
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: "37.6891px",
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
        x={368.658}
        y={180.021}
        id="text37-7-1-9"
        transform="scale(1.0385 .96293)"
      >
        <tspan
          id="tspan37-5-1-4"
          x={368.658}
          y={180.021}
          style={{
            fontStyle: "normal",
            fontVariant: "normal",
            fontWeight: 400,
            fontStretch: "normal",
            fontFamily: "&quot",
            InkscapeFontSpecification: "&quot",
            fill: "#000",
            fillOpacity: 0.375828,
            strokeWidth: 0,
          }}
        >
          {"LAGUNA"}
        </tspan>
      </text>
    </g>
    <g
      id="Group_32-5-67-3-6"
      transform="matrix(1.2 0 0 1.13179 442.348 -25.55)"
      style={{
        strokeWidth: 0.858079,
      }}
    >
      <path
        id="Vector_65-4-6-2-3"
        d="M524.443 586.627h-14.8c-.9 0-1.6-.7-1.6-1.6v-14.8c0-.9.7-1.6 1.6-1.6h14.8c.9 0 1.6.7 1.6 1.6v14.8c0 .9-.7 1.6-1.6 1.6"
        fill="#323e48"
        style={getValveIndicatorStyle(VE244Color)}
      />
      <g
        id="Group_33-3-7-4-7"
        transform="translate(-72.157 .627)"
        style={{
          strokeWidth: 0.858079,
        }}
      >
        <path
          id="Vector_66-1-7-1-8"
          d="m581.4 589.9 7.9 4.6c.5.3.5 1 0 1.3l-7.9 4.6c-.5.3-1.2-.1-1.2-.7v-9.2c0-.5.7-.9 1.2-.6"
          fill="#323e48"
          style={getValveIndicatorStyle(VE244Color)}
        />
        <path
          id="Vector_67-2-19-1-8"
          d="m597 600.5-7.9-4.6c-.5-.3-.5-1 0-1.3l7.9-4.6c.5-.3 1.2.1 1.2.7v9.2c0 .5-.7.9-1.2.6"
          fill="#323e48"
          style={getValveIndicatorStyle(VE244Color)}
        />
      </g>
      <path
        id="Vector_68-3-16-5-2"
        d="M517.043 585.627v10"
        stroke={VE244Color}
        strokeWidth={3.432}
        strokeMiterlimit={10}
      />
      <path
        id="Vector_69-3-2-9-9"
        d="M508.043 577.627h18"
        stroke="#fff"
        strokeWidth={1.716}
        strokeMiterlimit={10}
      />
      <path
        id="Vector_70-4-7-5-1"
        d="M517.043 578.627v8"
        stroke="#fff"
        strokeWidth={1.716}
        strokeMiterlimit={10}
      />
    </g>
    <g
      id="g24-6-8"
      transform="matrix(-1.22975 0 0 1.33926 1620.774 288.312)"
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
      id="g27-2-7"
      transform="matrix(1.26637 0 0 1.30074 843.531 303.256)"
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
            enableBackground: "new",
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
        style={getRoundIndicatorStyle(RetornoClarificadoColor)}
      />
    </g>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 14,
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
      x={1237.841}
      y={866.928}
      id="text43"
    >
      <tspan
        id="tspan43"
        x={1237.841}
        y={866.928}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 14,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"RETORNO"}
      </tspan>
      <tspan
        x={1237.841}
        y={884.951}
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 14,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
        id="tspan45"
      >
        {" CLARIFICADO"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      id="text35-5"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 14,
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
        shapeInside: "url(#rect35-6)",
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
      transform="translate(160.21 277.616)"
    >
      <tspan x={183.431} y={536.718} id="tspan25">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan24"
        >
          {"FILTRACION /\n"}
        </tspan>
      </tspan>
      <tspan x={178.666} y={554.741} id="tspan27">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan26"
        >
          {"RETROLAVADO"}
        </tspan>
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      id="text35-5-9"
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
        shapeInside: "url(#rect35-6-2)",
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
      transform="translate(66.458 194.014)"
    >
      <tspan x={149.25} y={538.543} id="tspan29">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan28"
        >
          {"VE-401"}
        </tspan>
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      id="text35-5-9-6"
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
        shapeInside: "url(#rect35-6-2-0)",
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
      transform="translate(440.076 -184.863)"
    >
      <tspan x={149.25} y={538.543} id="tspan31">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan30"
        >
          {"VE-237"}
        </tspan>
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      id="text35-5-9-2"
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
        shapeInside: "url(#rect35-6-2-3)",
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
      transform="translate(57.357 466.117)"
    >
      <tspan x={149.25} y={538.543} id="tspan33">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan32"
        >
          {"VE-402"}
        </tspan>
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      id="text35-5-9-4"
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
        shapeInside: "url(#rect35-6-2-7)",
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
      transform="translate(436.923 -60.13)"
    >
      <tspan x={149.25} y={538.543} id="tspan35">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan34"
        >
          {"VE-239"}
        </tspan>
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      id="text35-5-9-6-0"
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
        shapeInside: "url(#rect35-6-2-0-2)",
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
      transform="translate(830.853 -181.723)"
    >
      <tspan x={149.25} y={538.543} id="tspan37">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan36"
        >
          {"VE-238"}
        </tspan>
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      id="text35-5-9-4-7"
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
        shapeInside: "url(#rect35-6-2-7-6)",
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
      transform="translate(798.826 -59.855)"
    >
      <tspan x={149.25} y={538.543} id="tspan39">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan38"
        >
          {"VE-240"}
        </tspan>
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      id="text35-5-9-4-7-7"
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
        shapeInside: "url(#rect35-6-2-7-6-7)",
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
      transform="translate(889.593 76.033)"
    >
      <tspan x={149.25} y={538.543} id="tspan44">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan40"
        >
          {"VE-244"}
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
      x={1246.664}
      y={530.857}
      id="text41-5"
    >
      <tspan
        x={1246.664}
        y={530.857}
        id="tspan42-9"
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
      x={1349.176}
      y={530.857}
      id="text41-5-1"
    >
      <tspan
        x={1349.176}
        y={530.857}
        id="tspan42-9-8"
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
        {"F-H1LO"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      id="text35-5-9-6-0-6"
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
        shapeInside: "url(#rect35-6-2-0-2-2)",
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
      transform="translate(1106.12 -139.1)"
    >
      <tspan x={153.695} y={538.543} id="tspan47">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan46"
        >
          {"P-008"}
        </tspan>
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      id="text35-5-9-6-0-6-0"
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
        shapeInside: "url(#rect35-6-2-0-2-2-3)",
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
      transform="translate(1206.465 -139.1)"
    >
      <tspan x={153.695} y={538.543} id="tspan49">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan48"
        >
          {"P-007"}
        </tspan>
      </tspan>
    </text>
    <g id="g5" transform="matrix(.38243 0 0 .32518 753.224 425.503)">
      <path
        d="M61.2 44.4c-10.5 9.4-8.2 21.2.5 26.3 9.3 5.3 19.5 1.2 26.4-8 11.5-15.4 6.1-48-25.1-59.2 7.8 6.2 13.1 27.4-1.8 40.9"
        id="path1"
        style={{
          stroke: "#008ba3",
          strokeWidth: 4,
          strokeMiterlimit: 10,
          fill: "#00a09a",
        }}
      />
      <path
        d="M43.7 61C40.1 47.4 28.5 44.1 20 49.5c-8.9 5.9-9.9 16.8-4.8 27.1 8.5 17.2 40 27.2 64.1 4.5-9 4.3-30.3-.6-35.6-20.1"
        id="path2-8"
        style={{
          stroke: "#00aeed",
          strokeWidth: 4,
          strokeMiterlimit: 10,
          fill: "#6d7279",
        }}
      />
      <path
        className="st2"
        d="M39.9 37.4c13.6 3.5 22.2-5 21.5-15.1-.8-10.6-9.8-16.8-21.3-17.4C20.8 4-4.2 23.5 2.5 59.3c.8-9.9 17.9-26.7 37.4-21.9"
        id="path3"
      />
      <path
        className="st3"
        d="M306 87.7h-6.2l-9 35.5h-.2L282 87.7h-8.5l-8.7 35.5h-.2l-9-35.5h-6.1l10.7 39.6h8.8l8.5-35.5h.2l8.5 35.5h8.7zm-89.6 19.8c0-13.8.8-15.5 11.4-15.5s11.4 1.7 11.4 15.5c0 13.7-.8 15.4-11.4 15.4-10.7 0-11.4-1.6-11.4-15.4m-6.2 0c0 16.7 2.9 20.2 17.6 20.2s17.6-3.5 17.6-20.2c0-16.8-2.9-20.3-17.6-20.3s-17.6 3.6-17.6 20.3M201.1 82h-6v45.3h6zm-23 15.4v-6.1c0-4.2 3.2-4.6 6.2-4.7 1.2 0 3.1 0 4.3.1v-5c-1.2-.1-2.5-.1-3.7-.1-9.7 0-12.8 2.4-12.8 10.1v5.6h-6v4.8h6v25.1h6v-25.1h10.5v-4.8h-10.5z"
        id="path4-6"
      />
      <path
        className="st3"
        id="polyline4"
        d="m248 75.4 20.3-68.1h17.4L306 75.2h-11.5l-4.3-12.6h-17.1l-1.6-10.1h16L277 16.6l-17 58.6h-12.3"
      />
      <path
        className="st3"
        d="M228.1 8c-3.2-.3-7-.2-10.7-.2-18.9 0-26.9 4-26.9 26.6V50c0 23 7.3 26.8 26.9 26.8 21.8 0 26.3-4.2 26.3-24.3V40.2h-27.1v9.9H232v2.4c0 12.9-3.4 13.1-14.6 13.1-13 0-15-1.4-15.2-15.7V34.4c.2-13.1 1.5-15.5 15.2-15.5 3.3 0 6-.1 8.2.2"
        id="path5-1"
      />
      <path className="st3" id="rect5" d="M167.8 8.2h11.7v67.9h-11.7z" />
      <path
        className="st3"
        id="polygon5"
        d="m131 65.2-16.3-57h-12l19.6 67.9H140l19.7-67.9h-12.2l-16.3 57z"
      />
    </g>
    <g
      id="pt-card-87-7-6-0-9"
      transform="matrix(.70716 0 0 .59524 470.989 307.627)"
      style={{
        strokeWidth: 1.32344,
      }}
    >
      <rect
        x={2.476}
        y={1}
        width={138}
        height={68}
        rx={4.894}
        ry={6.063}
        fill="#fff"
        stroke="#8a94a6"
        strokeWidth={2.647}
        id="rect1-2-7-4-2-0-4"
      />
      <path
        stroke="#8a94a6"
        strokeWidth={1.985}
        id="line1-8-3-6-8-8"
        d="M6 34h128"
      />
    </g>
    <text
      xmlSpace="preserve"
      id="text35-5-9-6-9-51"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 14,
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
        shapeInside: "url(#rect35-6-2-0-5-4)",
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
      transform="translate(350.205 -213.183)"
    >
      <tspan x={152.967} y={536.718} id="tspan51">
        <tspan
          style={{
            fontFamily: "Calibri",
            InkscapeFontSpecification: "Calibri",
          }}
          id="tspan50"
        >
          {"PT-114"}
        </tspan>
      </tspan>
    </text>
    <path
      d="m523.934 349.488.063 40.408"
      style={{
        fill: "none",
        stroke: "#2f3e49",
        strokeWidth: 1.69684,
        strokeMiterlimit: 10,
        strokeDasharray: "none",
      }}
      id="path1-38-2"
    />
    <path
      d="m1008.094 651 .064 48.999"
      style={{
        fill: "none",
        stroke: "#2f3e49",
        strokeWidth: 1.88858,
        strokeMiterlimit: 10,
        strokeDasharray: "none",
      }}
      id="path1-38-2-1"
    />
    <rect
      style={{
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
      id="rect1-2"
      width={260.284}
      height={163.175}
      x={1097.893}
      y={32.577}
      rx={1.8}
      ry={1.8}
    />
    <path
      id="Vector_185-8-4-2"
      d="M1342.457 423.818h14c.8 0 1.5-.7 1.5-1.5v-14c0-.8-.7-1.5-1.5-1.5h-14c-.8 0-1.5.7-1.5 1.5v14c0 .8.7 1.5 1.5 1.5"
      fill={P007Color}
    />
    <path
      style={{
        opacity: 1,
        fill: "#0a53e9",
        fillOpacity: 0,
        stroke: "#36a9ec",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="M71.241 867.482v172.616H218v0"
      id="path45"
    />
    <path
      style={{
        opacity: 1,
        fill: "#0a53e9",
        fillOpacity: 0,
        stroke: "#36a9ec",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="M301.448 770v269.94l-57.906.152"
      id="path47"
    />
    <path
      style={{
        opacity: 1,
        fill: "#0a53e9",
        fillOpacity: 0,
        stroke: "#36a9ec",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m225.138 767.794-61.055.206V583.228"
      id="path48"
    />
    <path
      style={{
        opacity: 1,
        fill: "#0a53e9",
        fillOpacity: 0,
        stroke: "#36a9ec",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m411.49 752.498 70.675-.498 1.433-360.774v0l115.642-.057"
      id="path49"
    />
    <path
      style={{
        opacity: 1,
        fill: "#fff",
        fillOpacity: 1,
        stroke: "#36a9ec",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m789.234 392.016-164.417-.46"
      id="path50"
    />
    <path
      style={{
        opacity: 1,
        fill: "#fff",
        fillOpacity: 1,
        stroke: "#36a9ec",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m621.85 514.075 167.391.01v0"
      id="path51"
    />
    <path
      style={{
        opacity: 1,
        fill: "#fff",
        fillOpacity: 1,
        stroke: "#36a9ec",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m596.241 514.076-112.834.049"
      id="path52"
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
      x={1191.741}
      y={116.194}
      id="text12-1"
    >
      <tspan
        id="tspan12-5"
        x={1191.741}
        y={116.194}
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
      d="M1126.942 139.23a9.45 9.539 0 0 1 9.28-9.698 9.45 9.539 0 0 1 9.617 9.356 9.45 9.539 0 0 1-9.257 9.719 9.45 9.539 0 0 1-9.64-9.332l9.448-.205z"
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
      d="M1126.942 170.634a9.45 9.539 0 0 1 9.28-9.696 9.45 9.539 0 0 1 9.617 9.355 9.45 9.539 0 0 1-9.257 9.72 9.45 9.539 0 0 1-9.64-9.333l9.448-.205z"
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
      d="M1126.863 111.495a9.45 9.539 0 0 1 9.28-9.697 9.45 9.539 0 0 1 9.617 9.355 9.45 9.539 0 0 1-9.257 9.72 9.45 9.539 0 0 1-9.64-9.332l9.448-.206z"
    />
    <text
      xmlSpace="preserve"
      id="text1-2"
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
      transform="translate(-12.01 6.79)"
    >
      <tspan x={1136.993} y={49} id="tspan53">
        <tspan
          style={{
            fill: "#2c2c2c",
          }}
          id="tspan52"
        >
          {"Funcionamiento de Equipos"}
        </tspan>
      </tspan>
    </text>
    <path
      style={{
        fill: "#03f903",
        fillOpacity: 1,
        stroke: "#03f903",
        strokeWidth: 0.0999996,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      id="path3-6"
      d="M1126.84 83.76a9.45 9.539 0 0 1 9.288-9.697 9.45 9.539 0 0 1 9.61 9.371 9.45 9.539 0 0 1-9.28 9.704 9.45 9.539 0 0 1-9.617-9.363l9.448-.174z"
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
      x={1193.733}
      y={89.216}
      id="text12"
    >
      <tspan
        id="tspan12"
        x={1193.733}
        y={89.216}
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
        fill: "#000303",
        fillOpacity: 1,
        stroke: "#000303",
        strokeWidth: 0.1,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      x={1166.35}
      y={144.437}
      id="text13"
    >
      <tspan id="tspan13" x={1166.35} y={144.437}>
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
      x={1180.839}
      y={175.716}
      id="text13-6"
    >
      <tspan id="tspan13-1" x={1180.839} y={175.716}>
        {"Detenida"}
      </tspan>
    </text>
    <path
      style={{
        opacity: 1,
        fill: "#36a9ec",
        fillOpacity: 1,
        stroke: "#36a9ec",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeOpacity: 1,
      }}
      d="m832.914 392.016 157.31.074"
      id="path5"
    />
    <path
      style={{
        opacity: 1,
        fill: "#36a9ec",
        fillOpacity: 0,
        stroke: "#36a9ec",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeOpacity: 1,
      }}
      d="m1015.787 392.261 174.473-.02.727 247.759h39.824"
      id="path6"
    />
    <path
      style={{
        opacity: 1,
        fill: "#36a9ec",
        fillOpacity: 0,
        stroke: "#36a9ec",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeOpacity: 1,
      }}
      d="m832.017 514.092 126.967 1.084"
      id="path7"
    />
    <path
      style={{
        opacity: 1,
        fill: "#36a9ec",
        fillOpacity: 0,
        stroke: "#36a9ec",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeOpacity: 1,
      }}
      d="m984.573 515.035 110.33.158L1095 395"
      id="path8"
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
      d="M-645.97-477.066a9.272 9.144 0 0 1-9.173 9.143 9.272 9.144 0 0 1-9.37-8.946"
      transform="rotate(89.45)scale(-1 1)skewY(.121)"
    />
    <path
      style={{
        opacity: 1,
        fill: "#0a53e9",
        fillOpacity: 0,
        stroke: "#36a9ec",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m250.662 767.552 105.863-.326"
      id="path46"
    />
    <path
      style={{
        opacity: 1,
        fill: "#36a9ec",
        fillOpacity: 0,
        stroke: "#36a9ec",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeOpacity: 1,
      }}
      d="M999.216 515.3 1000 650h50"
      id="path10"
    />
    <path
      style={{
        opacity: 1,
        fill: "#36a9ec",
        fillOpacity: 0,
        stroke: "#36a9ec",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeOpacity: 1,
      }}
      d="m1018.213 1000.75 122.414-1.05-.639-350.364-64.4 1"
      id="path11"
    />
    <path
      className="st37"
      id="circle448-2-4"
      style={{
        fill: "#fff",
        fillOpacity: 1,
        stroke: "#35ace8",
        strokeWidth: 4,
        strokeMiterlimit: 10,
        strokeDasharray: "none",
      }}
      d="M-810.698-1132.478a9.272 9.446 0 0 1-9.172 9.445 9.272 9.446 0 0 1-9.37-9.242"
      transform="rotate(89.467)scale(-1 1)skewY(.161)"
    />
    <path
      style={{
        opacity: 1,
        fill: "#36a9ec",
        fillOpacity: 0,
        stroke: "#36a9ec",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeOpacity: 1,
      }}
      d="M1206.892 808.306 605.442 810V650H282.126l-.506-141.228-51.11.228"
      id="path9"
    />
    <g
      id="pt-card-0"
      transform="matrix(.71419 0 0 .55248 680.007 699.448)"
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
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 14,
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
      x={729.033}
      y={777.431}
      id="text49-2"
    >
      <tspan
        x={729.033}
        y={777.431}
        id="tspan50-3"
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 14,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"PRESI\xD3N"}
      </tspan>
    </text>
    <text
      xmlSpace="preserve"
      style={{
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: 400,
        fontStretch: "normal",
        fontSize: 14,
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
      x={730}
      y={760}
      id="text49"
    >
      <tspan
        x={730}
        y={760}
        id="tspan50-2"
        style={{
          fontStyle: "normal",
          fontVariant: "normal",
          fontWeight: 400,
          fontStretch: "normal",
          fontSize: 14,
          fontFamily: "Calibri",
          InkscapeFontSpecification: "Calibri",
        }}
      >
        {"DIFERENCIAL DE"}
      </tspan>
    </text>
    <path
      style={{
        opacity: 1,
        fill: "#00a39b",
        fillOpacity: 0,
        stroke: "#00a39b",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeOpacity: 1,
      }}
      d="m126.684 356.865-41.98.221"
      id="path12"
    />
    <path
      style={{
        opacity: 1,
        fill: "#36a9ec",
        fillOpacity: 0,
        stroke: "#00a39b",
        strokeWidth: 4,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeOpacity: 1,
      }}
      d="M181.451 345H210v147.467"
      id="path15"
    />
    <path
      id="Vector_324-6-6-5-1-0"
      d="M1133.097 897.227c.01-1.262.943-2.401 2.177-2.391l10.178.08c1.131.009 2.152 1.05 2.141 2.426 0 .63-.215 1.26-.578 1.658l-5.132 5.636c-.778.854-2.063.844-2.931.092l-.102-.115-5.046-5.717c-.614-.52-.712-1.038-.708-1.668z"
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
      id="Vector_324-6-6-5-1-0-5"
      d="M1177.241 801.172c1.261.022 2.393.965 2.372 2.198l-.17 10.178c-.017 1.13-1.067 2.142-2.443 2.12-.63-.006-1.258-.227-1.653-.593l-5.591-5.181c-.848-.785-.826-2.07-.067-2.932l.116-.101 5.76-4.996c.527-.609 1.044-.703 1.675-.693z"
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
      id="Vector_324-6-6-5-1-0-7"
      d="M822.53 801.944c1.26-.005 2.412.913 2.419 2.146l.051 10.18c.007 1.13-1.021 2.164-2.397 2.171-.63.008-1.263-.199-1.666-.556l-5.702-5.059c-.864-.766-.87-2.051-.13-2.93l.114-.103 5.65-5.12c.513-.62 1.029-.725 1.66-.729z"
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
      id="Vector_324-6-6-5-1-0-1"
      d="M612.807 721.54c-.02 1.26-.96 2.394-2.193 2.376l-10.178-.146c-1.13-.016-2.144-1.064-2.125-2.44.004-.63.223-1.258.589-1.654l5.168-5.603c.784-.849 2.069-.83 2.932-.073l.101.116 5.01 5.75c.609.524.704 1.042.696 1.672z"
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
      id="Vector_324-6-6-5-1-0-2"
      d="M489.705 706.423c-.019 1.261-.959 2.395-2.192 2.377l-10.178-.147c-1.131-.015-2.145-1.063-2.125-2.439.004-.63.223-1.258.589-1.654l5.168-5.603c.783-.849 2.068-.83 2.932-.073L484 699l5.01 5.749c.609.525.704 1.042.695 1.673z"
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
      id="Vector_324-6-6-5-1-0-6"
      d="M490.705 476.423c-.019 1.261-.959 2.395-2.192 2.377l-10.178-.147c-1.131-.015-2.145-1.063-2.125-2.439.004-.63.223-1.258.589-1.654l5.168-5.603c.783-.849 2.068-.83 2.932-.073L485 469l5.01 5.749c.609.525.704 1.042.695 1.673z"
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
      id="Vector_324-6-6-5-1-0-4"
      d="M382.555 642.765c1.262-.005 2.413.912 2.42 2.146l.05 10.178c.008 1.131-1.02 2.165-2.396 2.173-.631.008-1.263-.2-1.666-.557l-5.702-5.059c-.864-.766-.87-2.051-.13-2.93l.114-.103 5.65-5.12c.513-.62 1.028-.725 1.66-.729z"
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
      id="Vector_324-6-6-5-1-0-3"
      d="M289.26 560.275c.024 1.261-.877 2.426-2.11 2.45l-10.177.202c-1.13.023-2.18-.99-2.207-2.365-.018-.63.18-1.265.532-1.674l4.973-5.776c.754-.875 2.039-.9 2.928-.174l.105.113 5.203 5.574c.627.504.74 1.018.753 1.649z"
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
      id="Vector_324-6-6-5-1-0-21"
      d="M308.696 891.674c-.019 1.261-.959 2.395-2.192 2.377l-10.178-.147c-1.131-.015-2.145-1.063-2.125-2.439.004-.63.223-1.258.589-1.654l5.168-5.603c.783-.849 2.068-.83 2.932-.073l.101.116L308 890c.61.525.705 1.042.696 1.673z"
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
      id="Vector_324-6-6-5-1-0-8"
      d="M560.174 521.732c-1.26-.025-2.39-.97-2.367-2.203l.193-10.177c.02-1.131 1.073-2.14 2.448-2.114.631.007 1.258.229 1.652.596l5.58 5.194c.845.787.82 2.072.06 2.932l-.117.1-5.771 4.983c-.528.608-1.046.7-1.676.69z"
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
      id="Vector_324-6-6-5-1-0-76"
      d="M556.41 398.157c-1.262 0-2.41-.923-2.41-2.157l-.004-10.179c-.001-1.13 1.031-2.16 2.407-2.161.63-.005 1.262.205 1.663.564l5.68 5.085c.86.77.86 2.056.116 2.93l-.115.103-5.674 5.094c-.516.617-1.032.72-1.662.721z"
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
      id="Vector_324-6-6-5-1-0-89"
      d="M992.214 577.59c.01-1.26.943-2.4 2.177-2.39l10.179.08c1.13.008 2.15 1.05 2.14 2.426 0 .63-.215 1.26-.578 1.658L1001 585c-.778.854-2.063.844-2.931.092l-.102-.115-5.046-5.717c-.613-.52-.712-1.038-.707-1.668z"
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
      id="Vector_324-6-6-5-1-0-79"
      d="M1050.074 520.898c-1.261-.025-2.39-.97-2.367-2.203l.193-10.177c.02-1.131 1.072-2.14 2.448-2.114.63.007 1.257.229 1.652.596l5.58 5.194c.845.787.82 2.072.06 2.932l-.117.1-5.772 4.983c-.527.608-1.045.701-1.676.69z"
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
      id="Vector_324-6-6-5-1-0-43"
      d="M1102.324 438.668c-.01 1.262-.94 2.403-2.173 2.395l-10.179-.066c-1.13-.006-2.153-1.045-2.145-2.421 0-.631.214-1.26.576-1.66l5.124-5.644c.776-.855 2.061-.846 2.93-.096l.103.115 5.055 5.709c.614.52.713 1.037.71 1.667z"
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
      id="Vector_324-6-6-5-1-0-23"
      d="M1062.5 399.39c-1.262 0-2.409-.923-2.41-2.157v-10.179c0-1.13 1.031-2.16 2.407-2.16.631-.006 1.262.204 1.663.564l5.68 5.084c.86.77.86 2.056.116 2.93l-.115.104-5.673 5.093c-.516.618-1.032.721-1.663.722z"
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
      id="Vector_324-6-6-5-1-0-41"
      d="M1183.214 512.59c.01-1.26.943-2.4 2.177-2.39l10.179.08c1.13.008 2.15 1.05 2.14 2.426 0 .63-.215 1.26-.578 1.658L1192 520c-.778.854-2.063.844-2.931.092l-.102-.115-5.046-5.717c-.613-.52-.712-1.038-.707-1.668z"
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
      d="M1249.222 404.818v-50.787l-83.365-.266.258 28.319"
      id="path1-6"
    />
    <path
      id="Vector_324-1"
      d="M1160.452 383.663c.013-.86.744-1.635 1.703-1.624l7.92.09c.88.008 1.67.722 1.656 1.661-.01.43-.172.86-.456 1.13l-4.015 3.828c-.608.58-1.608.569-2.28.053l-.08-.08-3.904-3.917c-.475-.357-.55-.71-.544-1.14z"
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
      id="Vector_324-1-8"
      d="M1119.425 383.663c.013-.86.744-1.635 1.704-1.624l7.92.09c.88.009 1.67.723 1.656 1.661-.01.43-.172.86-.456 1.13l-4.015 3.828c-.609.58-1.609.57-2.281.053l-.08-.08-3.904-3.917c-.475-.357-.55-.71-.544-1.14z"
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
      id="Vector_324-1-8-4"
      d="M204.343 494.046c.013-.86.743-1.635 1.703-1.624l7.92.09c.88.008 1.67.722 1.656 1.661-.01.43-.172.86-.456 1.13l-4.015 3.828c-.608.58-1.608.569-2.281.053l-.079-.08-3.905-3.917c-.474-.357-.55-.71-.543-1.14z"
      fill="#00aeed"
      stroke="#fff"
      strokeWidth={2.172}
      strokeMiterlimit={10}
      style={{
        fill: "#00a39b",
        fillOpacity: 1,
        stroke: "#00a39b",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      onclick={12}
    />
    <path
      style={{
        fill: "#2a8b8b",
        fillOpacity: 0,
        stroke: "#2a8b8b",
        strokeWidth: 4.47792,
        strokeLinecap: "square",
        strokeLinejoin: "round",
        strokeDasharray: "none",
        strokeOpacity: 1,
      }}
      d="m1125.065 379.961.59-66.505 223.954.447.567 90.559v0"
      id="path8-7"
    />
  </svg>
);
};
export default SVGComponent;
