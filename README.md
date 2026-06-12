# Crystal Lagoons Frontend

Frontend SCADA para monitoreo de lagunas Crystal con React, Vite y TypeScript.

## Estado Actual

- Autenticacion por JWT contra `POST /api/auth/login`.
- Modulos por producto: `/crystal/*` y `/small/*`.
- Selector de lagunas desde `GET /api/{product}/lagoons`, filtrado por `enable`, `can_view` y `product_type`.
- Vista SCADA por laguna en `/{product}/lagoon/:lagoonId`.
- Compatibilidad legacy Crystal en `/lagoon/:lagoonId`.
- Escenas SCADA locales desde `src/assets/positions/*.json`.
- SVGs React descubiertos desde `src/svg/*.tsx`.
- Realtime por `WS /ws/{product}/{lagoon_id}`.
- Historico por `GET /api/{product}/history`.
- Eventos de pumps por `GET /api/{product}/lagoons/{lagoon_id}/pump-events/last-3`.
- Configuracion de umbrales PT/FIT por `GET/PUT /api/alarms/{lagoon_id}/thresholds/pt-fit`.
- SmallLagoons incluye `small_sim`, `small_layout_1`, overlays de imagen y `lagoon_metrics_overlay`.

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
- `/crystal/dashboard`
- `/crystal/lagoon/:lagoonId`
- `/small/dashboard`
- `/small/lagoon/:lagoonId`
- `/lagoon/:lagoonId` legacy Crystal

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
- `src/components/lagoonContainer.tsx`: compone mapa SCADA, pumps e historico.
- `src/assets/positions/*.json`: escenas por laguna, fuente actual de posiciones, tags, labels y `svg_target`.
- `src/lagoons/img/*`: assets de imagen usados por `images[]`.
- `src/scada/lagoonSceneBundle.ts`: carga y normaliza escenas locales.
- `src/scada/lagoonScadaMaps.ts`: resuelve mapas embebidos, manifest externos y legacy `/scada/maps`.
- `src/hooks/useScadaLayoutScene.ts`: cache y refresh de escenas.
- `src/hooks/useScadaRealtime.ts`: WebSocket, snapshot, reconexion y salud realtime.
- `src/hooks/useHistory.ts`: historico.
- `src/hooks/useAlarmThresholds.ts`: umbrales PT/FIT.
- `src/scada/svgRegistry.ts`: layouts SVG soportados.
- `src/svg/*`: SVG React por layout.
- `src/modules/shared/product/*`: configuracion Crystal/Small, theme y guards.

## Flujo SCADA Actual

```text
Browser
  -> /{product}/lagoon/:lagoonId
  -> ProductProvider + ProductGuard
  -> LagoonsProvider
       -> GET /api/{product}/lagoons
  -> useScadaLayoutScene
       -> src/assets/positions/{lagoon_id}.json
  -> svgRegistry
       -> src/svg/*.tsx
  -> useScadaRealtime
       -> WS /ws/{product}/{lagoon_id}
  -> useHistory
       -> GET /api/{product}/history
  -> usePumpEventsLast3
       -> GET /api/{product}/lagoons/{lagoon_id}/pump-events/last-3
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
- `gouna`
- `kirah`
- `small_sim`

## SmallLagoons

La escena actual de SmallLagoons esta en:

- `src/assets/positions/small_sim.json`
- `src/svg/small_layout_1.tsx`

Tags esperados por la escena:

- `PT-123`
- `AE-100`
- `AE-022`
- `TEMP`
- `ORP`
- `Dosif`

Funciones visuales relevantes:

- `images[]` permite montar assets desde `src/lagoons/img/*`.
- `lagoon_metrics_overlay` pinta TEMP, ORP y Dosif sobre el plano.
- `small_layout_1.tsx` tiene popups DOSIF y hitbox accesible para el popup de bomba `Pump recirculation`.

## Documentacion Relacionada

- `docs/ARCHITECTURE.md`
- `docs/API_CONTRACTS.md`
- `docs/TROUBLESHOOTING.md`
- `docs/SCADA_UI_CHANGES.md`
- `docs/SVG_EDITING_GUIDE.md`
- `docs/GUIA_NUEVA_LAGUNA.md`
