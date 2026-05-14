# Crystal Lagoons Frontend

Frontend SCADA para monitoreo de lagunas Crystal con React, Vite y TypeScript.

## Estado Actual

- Autenticacion por JWT contra `POST /api/auth/login`.
- Selector de lagunas desde `GET /api/lagoons`, filtrado por `enable` y `can_view`.
- Vista SCADA por laguna en `/lagoon/:lagoonId`.
- Escenas SCADA locales desde `src/assets/positions/*.json`.
- SVGs React registrados en `src/scada/svgRegistry.ts`.
- Realtime por `WS /ws/scada/{lagoon_id}`.
- Historico por `GET /api/scada/{lagoon_id}/history`.
- Eventos de bombas por `GET /api/scada/{lagoon_id}/pump-events/last-3`.
- Configuracion de umbrales PT/FIT por `GET/PUT /api/alarms/{lagoon_id}/thresholds/pt-fit`.

## Stack

- React 19
- Vite 7
- TypeScript 5
- TailwindCSS 4
- MUI 7
- ApexCharts
- Axios

## Quick Start

```powershell
npm install
npm run dev
```

Build:

```powershell
npm run build
```

## Rutas de la App

- `/login`
- `/dashboard`
- `/lagoon/:lagoonId`

## Variables de Entorno

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

Por defecto REST usa rutas browser-relative bajo `/api`. Vite o IIS deben reenviar `/api/*` al backend real.

## Estructura Importante

- `src/App.tsx`: routing, providers y refresh horario.
- `src/pages/lagoonsView.tsx`: shell principal.
- `src/components/lagoonContainer.tsx`: compone mapa SCADA, bombas e historico.
- `src/assets/positions/*.json`: escenas por laguna, fuente actual de posiciones, tags, labels y `svg_target`.
- `src/scada/lagoonSceneBundle.ts`: carga y normaliza escenas locales.
- `src/hooks/useScadaLayoutScene.ts`: cache y refresh de escenas.
- `src/hooks/useScadaRealtime.ts`: WebSocket, snapshot, reconexion y salud realtime.
- `src/hooks/useHistory.ts`: historico.
- `src/hooks/useAlarmThresholds.ts`: umbrales PT/FIT.
- `src/scada/svgRegistry.ts`: layouts SVG soportados.
- `src/svg/*`: SVG React por layout.

## Flujo SCADA Actual

```text
Browser
  -> /lagoon/:lagoonId
  -> LagoonsProvider
       -> GET /api/lagoons
  -> useScadaLayoutScene
       -> src/assets/positions/{lagoon_id}.json
  -> svgRegistry
       -> src/svg/layout*.tsx
  -> useScadaRealtime
       -> WS /ws/scada/{lagoon_id}
  -> useHistory
       -> GET /api/scada/{lagoon_id}/history
  -> usePumpEventsLast3
       -> GET /api/scada/{lagoon_id}/pump-events/last-3
  -> useAlarmThresholds
       -> GET/PUT /api/alarms/{lagoon_id}/thresholds/pt-fit
```

## Lagunas con Escena Local

Las escenas se descubren automaticamente con `import.meta.glob("../assets/positions/*.json")`. El nombre del archivo o el campo `lagoon_id` embebido registran la laguna.

Ejemplos actuales:

- `aquavista`
- `aquaterra`
- `ary`
- `ava_lagoons`
- `costa_del_lago`
- `laguna_santa_rosalia`
- `central_hub_dubai`
- `kirah`

## Documentacion Relacionada

- `docs/ARCHITECTURE.md`
- `docs/API_CONTRACTS.md`
- `docs/TROUBLESHOOTING.md`
- `docs/SCADA_UI_CHANGES.md`
- `docs/SVG_EDITING_GUIDE.md`
