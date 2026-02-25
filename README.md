# Crystal Lagoons Frontend

Frontend SCADA para monitoreo de lagunas Crystal (React + Vite + TypeScript).

## Objetivo

Mostrar en una sola vista:
- Estado en tiempo real (WebSocket)
- KPIs y overlay SCADA por layout
- Historico por rango (1D, 7D, 30D, 90D, etc.)
- Eventos de bombas (ultimos 3)

## Stack

- React 19
- Vite 7
- TypeScript 5
- TailwindCSS 4
- MUI 7
- ApexCharts
- Axios

## Quick Start

```bash
npm install
npm run dev
```

Build de produccion:

```bash
npm run build
```

## Configuracion API

- HTTP/WS principal: `src/config/api.ts`
- Auth API: `src/auth/authApi.ts` (usa `VITE_API_HTTP` o `VITE_API_BASE_URL`)

Nota: hoy existen dos estrategias de configuracion (hardcoded y env vars). Ver arquitectura para estandarizacion recomendada.

## Arquitectura (resumen)

```text
Browser
  -> React Router (/lagoon/:lagoonId)
    -> LagoonContainer
      -> useScadaRealtime (WS /ws/scada)
      -> useHistory (HTTP /scada/history/hourly)
      -> usePumpEventsLast3 (HTTP /scada/{lagoon_id}/pump-events/last-3)
      -> ScadaOverlay + PumpStatusKpi + LagoonLineChart
```

Documentacion completa:
- [Arquitectura](docs/ARCHITECTURE.md)
- [Contratos API](docs/API_CONTRACTS.md)
- [Troubleshooting Operativo](docs/TROUBLESHOOTING.md)

## Estructura principal

- `src/components`: UI, charts y contenedores de modulo
- `src/hooks`: consumo y estado de datos remotos
- `src/api`: clientes HTTP
- `src/layouts`: configuraciones JSON por laguna/layout
- `src/svg`: SVG por layout
- `src/scada/svgRegistry.ts`: registro de layouts SVG

## Flujos criticos

- Realtime: `useScadaRealtime` actualiza tags, PLC status, hora local y timezone.
- Historico: `useHistory` consulta buckets y alimenta `LagoonLineChart`.
- Eventos bomba: `usePumpEventsLast3` trae lista de eventos; `PumpStatusKpi` renderiza hasta 3 por bomba.
- Resolucion de estado de bomba: soporta `number` y `boolean` (`true/false` => `FUNCIONANDO/DETENIDA`).

## Convenciones

- Los tags tecnicos se transforman a labels visibles en UI.
- En cards de bombas, si faltan datos se manejan estados `loading`, `error`, `empty`.
- Los layouts SCADA se cargan dinamicamente desde JSON + SVG registry.
