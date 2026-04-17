# Crystal Lagoons Frontend

Frontend SCADA para monitoreo de lagunas Crystal con React, Vite y TypeScript.

## Objetivo

Mostrar en una sola vista:

- mapa SCADA backend-driven
- estado realtime por WebSocket
- KPIs de bombas y equipos
- historico por rango
- configuracion de alarmas PT/FIT

## Stack

- React 19
- Vite 7
- TypeScript 5
- TailwindCSS 4
- MUI 7
- ApexCharts
- Axios

## Quick start

```powershell
npm install
npm run dev
```

Build:

```powershell
npm run build
```

## Rutas de la app

- `/login`
- `/dashboard`
- `/lagoon/:lagoonId`

## Como se conecta al backend

REST:

- usa `src/api/httpClient.ts`
- por defecto consume rutas browser-relative bajo `VITE_API_PREFIX=/api`
- el proxy de Vite o IIS reescribe `/api/*` al backend real

WebSocket:

- usa `src/hooks/useScadaRealtime.ts`
- intenta primero autenticacion legacy por query string
- si no recibe snapshot, hace fallback a subprotocol `crystal-scada.v1`

## Variables de entorno relevantes

- `VITE_API_HTTP`
- `VITE_API_WS`
- `VITE_SCADA_WS_URL`
- `VITE_BACKEND_WS_PORT`
- `VITE_USE_DIRECT_BACKEND`
- `VITE_DIRECT_BACKEND_ORIGIN`
- `VITE_FORCE_SAME_ORIGIN`
- `VITE_API_PREFIX`
- `VITE_PRODUCT_TYPE`
- `VITE_DEV_RUNTIME_MODE`
- `VITE_IIS_HMR`
- `VITE_DEV_BACKEND_HTTP_TARGET`
- `VITE_DEV_BACKEND_WS_TARGET`

## Estructura importante

- `src/pages/lagoonsView.tsx`: shell principal.
- `src/components/lagoonContainer.tsx`: compone SCADA, historico y bombas.
- `src/hooks/useScadaRealtime.ts`: socket y salud de realtime.
- `src/hooks/useScadaLayoutScene.ts`: layout + mapping + cache.
- `src/hooks/useHistory.ts`: historico.
- `src/hooks/useAlarmThresholds.ts`: modal PT/FIT.
- `src/api/*.ts`: clientes HTTP.
- `src/scada/*`: resolucion de layouts, aliases, labels y estados SVG.
- `src/svg/*`: SVG React por layout.

## Flujo SCADA actual

```text
Browser
  -> /lagoon/:lagoonId
  -> LagoonsProvider -> GET /api/lagoons
  -> useScadaLayoutScene
       -> GET /api/lagoons/{lagoon_id}/mapping
       -> GET /api/layouts/{layout_id}
  -> useScadaRealtime
       -> WS /ws/scada/{lagoon_id}
  -> useHistory
       -> GET /api/scada/{lagoon_id}/history
  -> usePumpEventsLast3
       -> GET /api/scada/{lagoon_id}/pump-events/last-3
  -> useAlarmThresholds
       -> GET/PUT /api/alarms/{lagoon_id}/thresholds/pt-fit
```

## Documentacion relacionada

- `docs/ARCHITECTURE.md`
- `docs/API_CONTRACTS.md`
- `docs/TROUBLESHOOTING.md`
- `docs/SCADA_UI_CHANGES.md`
- `docs/SVG_EDITING_GUIDE.md`
