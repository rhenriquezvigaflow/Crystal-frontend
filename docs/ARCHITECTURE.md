# Arquitectura Frontend SCADA

Documento alineado al codigo actual del frontend.

## Panorama general

Capas principales:

1. `pages` para shell y routing.
2. `auth` y `lagoons` para sesion y alcance RBAC.
3. `api` para REST.
4. `hooks` para realtime, historico, layouts y alarmas.
5. `scada` para resolver escenas, tags, labels y estado SVG.
6. `components` y `containers` para render final.

## Arranque de la aplicacion

```text
main.tsx
  -> App.tsx
      -> BrowserRouter
      -> AuthProvider
      -> LagoonsProvider
      -> /login | /dashboard | /lagoon/:lagoonId
```

Notas:

- `App.tsx` hace auto-refresh de pagina cada 30 minutos.
- `DashboardRedirect` redirige a la laguna permitida.
- `ProtectedRoute` exige sesion valida.

## Networking y entorno

Archivos:

- `src/config/env.ts`
- `src/config/api.ts`
- `src/api/httpClient.ts`
- `vite.config.ts`

Comportamiento actual:

- REST usa `VITE_API_PREFIX` con default `/api`
- por defecto el frontend trabaja same-origin
- si `VITE_USE_DIRECT_BACKEND=true`, puede apuntar a un origin directo
- el WebSocket se arma desde `VITE_API_WS`, `VITE_SCADA_WS_URL`, `VITE_BACKEND_WS_PORT` o browser origin
- en dev hay dos modos:
  - `iis`: REST por `/api`, WS same-host, HMR opcional
  - `vite`: REST por proxy `/api` y WS proxy `/ws`

## RBAC y lagunas

Archivos:

- `src/auth/AuthContext.tsx`
- `src/api/lagoonsApi.ts`
- `src/api/productApi.ts`
- `src/lagoons/LagoonsContext.tsx`

Flujo:

1. login obtiene JWT
2. `LagoonsProvider` llama `GET /api/lagoons`
3. el frontend normaliza lagunas y aplica filtro `can_view && enable`
4. `can_edit` y `can_control` gobiernan modal de alarmas y visibilidad de controles

## Resolucion de escena SCADA

Archivos:

- `src/hooks/useScadaLayoutScene.ts`
- `src/api/scadaLayoutsApi.ts`
- `src/scada/layoutSceneResolver.ts`
- `src/scada/layoutResolver.ts`
- `src/scada/localSceneRegistry.ts`

Flujo:

1. `GET /api/lagoons/{lagoon_id}/mapping`
2. `GET /api/layouts/{layout_id}`
3. `resolveScadaElements()` mezcla layout y mapping
4. `collector_tags` filtra tarjetas que no deben mostrarse
5. si existe override local `src/scada/scene/lagoons/<lagoon>.scene.json`, ese layout local puede reemplazar el de backend

Caches en memoria:

- `layoutCache`
- `mappingCache`
- `sceneCache`
- `inFlightRequests`

Layouts soportados en `svgRegistry`:

- `layout1`
- `layout2`
- `layout3`
- `layout4`

Alias:

- `layout_small` -> `layout3`

## Realtime SCADA

Archivo:

- `src/hooks/useScadaRealtime.ts`

URL efectiva:

- `WS /ws/scada/{lagoon_id}`

Autenticacion:

1. intento legacy con `?token=<jwt>`
2. fallback a subprotocol:
   - `crystal-scada.v1`
   - `bearer.<jwt>`

Estado expuesto por el hook:

- `tags`
- `pumpLastOn`
- `ts`
- `plc_status`
- `local_time`
- `timezone`
- `connection_state`
- `connection_error`
- `last_data_age_sec`

Salud:

- `connected`
- `reconnecting`
- `degraded`
- `disconnected`

`degraded` aparece cuando pasan 30s sin mensaje nuevo.

## Contenedor principal de laguna

Archivo:

- `src/components/lagoonContainer.tsx`

Responsabilidades:

- pedir escena
- abrir WebSocket
- esperar hasta 7s por realtime antes de mostrar `--`
- renderizar banner de salud
- componer:
  - `ScadaMapPanel`
  - `PumpStatusSection`
  - `HistorySection`

## Historico

Archivos:

- `src/hooks/useHistory.ts`
- `src/api/scadaHistory.ts`
- `src/components/charts/LagoonLineChart.tsx`
- `src/components/charts/historySeries.ts`

Endpoint:

- `GET /api/scada/{lagoon_id}/history`

Resolucion:

- `hourly` hasta 14 dias
- `daily` hasta 180 dias
- `weekly` sobre 180 dias

Filtro de tags no ploteables:

- contiene `WM`
- contiene `_ST_`
- contiene `_STATUS`
- contiene `_BOOL`
- contiene `RETRO`

## Bombas y eventos

Archivos:

- `src/hooks/usePumpEventsLast3.ts`
- `src/api/scadaPumpEvents.ts`
- `src/components/lagoon/PumpStatusKpi.tsx`

Endpoint:

- `GET /api/scada/{lagoon_id}/pump-events/last-3`

Fallback:

- si falla el endpoint, la UI puede usar `pump_last_on` del WebSocket

## Alarmas PT/FIT

Archivos:

- `src/components/AlarmManagerModal.tsx`
- `src/hooks/useAlarmThresholds.ts`
- `src/services/alarm-thresholds.api.ts`

Endpoint:

- `GET /api/alarms/{lagoon_id}/thresholds/pt-fit/view`
- `PUT /api/alarms/{lagoon_id}/thresholds/pt-fit`

Comportamiento:

- mezcla filas configuradas de backend con tags PT/FIT detectados por realtime
- valida min/max, severity y prefijo PT/FIT
- puede trabajar en modo solo lectura si `can_edit=false`

## Labels y estados SVG

Archivos:

- `src/scada/labels/layouts/*.base.json`
- `src/scada/labels/lagoons/*.json`
- `src/scada/equipment-state/layouts/*.equipment.json`
- `src/containers/ScadaTextOverlay.tsx`
- `src/containers/ScadaEquipmentStateOverlay.tsx`

Estados discretos:

- `0` rojo
- `1` verde
- `2` azul
- `3` amarillo
- sin dato gris

## Riesgos visibles

- el bundle sigue creciendo y conviene vigilar `manualChunks`
- los SVG grandes son sensibles a cambios de IDs
- la escena puede divergir si backend y override local representan layouts distintos
