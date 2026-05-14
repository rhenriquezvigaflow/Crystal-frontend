# Arquitectura Frontend SCADA

Documento alineado al codigo actual del frontend.

## Panorama General

Capas principales:

1. `pages` para shell y routing.
2. `auth` y `lagoons` para sesion y alcance RBAC.
3. `api` para REST.
4. `hooks` para realtime, historico, escenas y alarmas.
5. `scada` para resolver escenas locales, tags, labels y estado SVG.
6. `components` y `containers` para render final.

## Arranque

```text
main.tsx
  -> App.tsx
      -> BrowserRouter
      -> AuthProvider
      -> LagoonsProvider
      -> /login | /dashboard | /lagoon/:lagoonId
```

Notas:

- `App.tsx` hace auto-refresh de pagina cada 1 hora.
- `DashboardRedirect` redirige a la primera laguna permitida.
- `ProtectedRoute` exige sesion valida.

## Networking y Entorno

Archivos:

- `src/config/env.ts`
- `src/config/api.ts`
- `src/api/httpClient.ts`
- `vite.config.ts`

Comportamiento:

- REST usa `VITE_API_PREFIX` con default `/api`.
- Por defecto el frontend trabaja same-origin.
- Si `VITE_USE_DIRECT_BACKEND=true`, puede apuntar a un origin directo.
- El WebSocket se arma desde `VITE_API_WS`, `VITE_SCADA_WS_URL`, `VITE_BACKEND_WS_PORT` o browser origin.
- En dev, Vite puede proxyear REST `/api` y WS `/ws`.

## RBAC y Lagunas

Archivos:

- `src/auth/AuthContext.tsx`
- `src/api/lagoonsApi.ts`
- `src/api/productApi.ts`
- `src/lagoons/LagoonsContext.tsx`

Flujo:

1. Login obtiene JWT.
2. `LagoonsProvider` llama `GET /api/lagoons`.
3. El frontend normaliza lagunas y aplica `can_view && enable`.
4. `can_edit` habilita guardado de alarmas.
5. `can_control` controla visibilidad de controles de bombas.

## Resolucion de Escena SCADA

Archivos:

- `src/hooks/useScadaLayoutScene.ts`
- `src/scada/localSceneRegistry.ts`
- `src/scada/lagoonSceneBundle.ts`
- `src/scada/layoutResolver.ts`
- `src/scada/scadaLayoutPosition.ts`
- `src/assets/positions/*.json`

Flujo actual:

1. `lagoonSceneBundle` descubre `src/assets/positions/*.json` con `import.meta.glob`.
2. Registra cada escena por nombre de archivo y por `lagoon_id` embebido.
3. `useScadaLayoutScene(lagoonId)` carga y cachea la escena.
4. En dev, refresca el JSON local cada `DEV_SCENE_REFRESH_MS` si la pestana esta visible.
5. La escena se normaliza a `ResolvedScadaScene`.

Formatos soportados:

- `kpis[]`, `pumps[]`, `valves[]`, `plc_status`, `labels[]`.
- `elements[]` con `type`.
- `mapping_json` embebido para sobrescribir `tag`, `label`, `svg_target`, `unit`, `icon_type`, `panel` o `always_visible`.

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

Estado expuesto:

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

`degraded` aparece cuando pasan 30 segundos sin mensaje nuevo.

## Contenedor Principal

Archivo:

- `src/components/lagoonContainer.tsx`

Responsabilidades:

- pedir escena local;
- abrir WebSocket;
- esperar hasta 7 segundos por realtime antes de mostrar `--`;
- renderizar banner de salud;
- resolver SVG desde `svgRegistry`;
- componer `ScadaMapPanel`, `PumpStatusKpi` e historico.

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

## Bombas y Eventos

Archivos:

- `src/hooks/usePumpEventsLast3.ts`
- `src/api/scadaPumpEvents.ts`
- `src/components/lagoon/PumpStatusKpi.tsx`

Endpoint:

- `GET /api/scada/{lagoon_id}/pump-events/last-3`

Fallback:

- si falla el endpoint, la UI puede usar `pump_last_on` del WebSocket.

## Alarmas PT/FIT

Archivos:

- `src/components/AlarmManagerModal.tsx`
- `src/hooks/useAlarmThresholds.ts`
- `src/services/alarm-thresholds.api.ts`

Endpoints:

- `GET /api/alarms/{lagoon_id}/thresholds/pt-fit/view`
- `PUT /api/alarms/{lagoon_id}/thresholds/pt-fit`

Comportamiento:

- mezcla filas configuradas del backend con tags PT/FIT detectados por realtime;
- valida min/max, severity y prefijo PT/FIT;
- puede trabajar en modo solo lectura si `can_edit=false`.

## Labels y Estados SVG

Labels:

- vienen desde `labels[]` dentro de cada JSON en `src/assets/positions`.
- se renderizan con `ScadaTextOverlay` y `ScadaSvgEquipmentLabelsOverlay`.

Estados discretos:

- `0` rojo
- `1` verde
- `2` azul
- `3` amarillo
- sin dato gris

La aplicacion de color se hace en `src/scada/svgEquipmentState.ts` sobre cada `svg_target` definido en la escena.

## Riesgos Visibles

- Los SVG grandes son sensibles a cambios de IDs.
- Si una laguna no tiene JSON en `src/assets/positions`, no habra escena SCADA.
- Si `svg_component` no existe en `svgRegistry`, la vista no puede renderizar el plano.
- El bundle sigue creciendo y conviene vigilar `manualChunks`.
