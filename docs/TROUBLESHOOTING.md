# Playbook de Troubleshooting

## No Puedo Entrar al Dashboard

Sintoma:

- redireccion a `/login`

Revisar:

1. `localStorage.crystal_auth_v1`
2. expiracion del JWT
3. `POST /api/auth/login`

## No Aparece una Laguna

Causas tipicas:

- `can_view=false`
- `enable=false`
- `GET /api/{product}/lagoons` devuelve lista vacia
- `product_type` de la laguna no coincide con el modulo activo
- la laguna existe en el collector pero no en backend/BD

Revisar:

1. response de `/api/crystal/lagoons` o `/api/small/lagoons`
2. permisos del usuario
3. JWT y roles

## Vista sin Plano SCADA

Causas tipicas:

- no existe `src/assets/positions/{lagoon_id}.json`
- `svg_component` no existe en `src/scada/svgRegistry.ts`
- `layout_id` o `svg_component` no existe en `src/svg/*.tsx`
- JSON malformed

Revisar:

1. archivo local en `src/assets/positions`
2. `lagoon_id` en minusculas
3. `svg_component`
4. consola browser por `Error cargando configuracion SCADA`

## Tarjetas no Aparecen

Causas tipicas:

- el elemento no tiene `position`
- el tag no viene por WebSocket
- la escena usa un nombre de tag distinto al collector

Revisar:

1. `kpis[]`, `pumps[]`, `valves[]` en `src/assets/positions/{lagoon_id}.json`
2. payload `tags` del WebSocket
3. que `always_visible=true` este presente si un elemento debe salir aunque no haya dato

## Tiempo Real no Conecta

Revisar:

1. URL WS final construida en `src/config/env.ts`
2. token JWT valido
3. fallback por subprotocol si falla query token
4. backend `WS /ws/{product}/{lagoon_id}`

Si la conexion cae:

- la UI puede quedar `reconnecting`, `degraded` o `disconnected`
- luego de 7 segundos igual debe mostrar el plano con valores `--`

## Laguna Offline no Muestra Tarjetas

Comportamiento esperado:

- despues de la gracia inicial, el plano aparece con `--`

Revisar:

1. `sceneLoading` y `sceneError`
2. existencia de `elements`
3. posiciones validas en la escena local

## Colores de Pumps o Valvulas no Cambian

Revisar:

1. `svg_target` en `src/assets/positions/{lagoon_id}.json`
2. que ese ID exista dentro del SVG React
3. payload `tags` del WebSocket
4. valor discreto esperado `0..3`

Mapa de color:

- `0` rojo
- `1` verde
- `2` azul
- `3` amarillo

## Historico no Muestra Lineas

Revisar:

1. `GET /api/{product}/history?lagoon_id={lagoon_id}`
2. `resolution` enviada
3. `series[].points`
4. que los tags no hayan sido filtrados por no ploteables

Tags que el frontend descarta:

- contiene `WM`
- contiene `_ST_`
- contiene `_STATUS`
- contiene `_BOOL`
- contiene `RETRO`

## Eventos de Pumps no Aparecen

Revisar:

1. `GET /api/{product}/lagoons/{lagoon_id}/pump-events/last-3`
2. `tag_id` de cada evento
3. fallback `pump_last_on` del WS
4. que el pump tenga `panel: "pump-status"`

## Alarmas PT/FIT no Cargan o no Guardan

Revisar:

1. `GET /api/alarms/{lagoon_id}/thresholds/pt-fit/view`
2. `PUT /api/alarms/{lagoon_id}/thresholds/pt-fit`
3. permisos `can_edit`
4. validaciones de `min_value`, `max_value`, `severity` y prefijo `PT/FIT`

## Build Falla

Revisar:

1. `npm run build`
2. primer error real
3. SVG con atributos JSX invalidos
4. JSON malformed
5. imports en `svgRegistry.ts`

## Checklist Antes de Escalar

1. `lagoon_id`
2. response de `/api/{product}/lagoons`
3. archivo `src/assets/positions/{lagoon_id}.json`
4. payload WS o banner de health
5. response de `/api/{product}/history` si aplica
6. captura UI + consola browser
