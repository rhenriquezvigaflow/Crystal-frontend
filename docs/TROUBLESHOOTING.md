# Playbook de Troubleshooting

## No puedo entrar al dashboard

Sintoma:

- redireccion a `/login`

Revisar:

1. `localStorage.crystal_auth_v1`
2. expiracion del JWT
3. `POST /api/auth/login`

## No aparece una laguna

Causas tipicas:

- `can_view=false`
- `enable=false`
- `GET /api/lagoons` devuelve lista vacia

Revisar:

1. response de `/api/lagoons`
2. permisos del usuario
3. JWT y roles

## Vista sin plano SCADA

Causas tipicas:

- el `layout_id` no existe en backend
- el `svg_component` no existe en `svgRegistry`
- hay error al cargar mapping/layout

Revisar:

1. `GET /api/lagoons/{lagoon_id}/mapping`
2. `GET /api/layouts/{layout_id}`
3. `src/scada/svgRegistry.ts`
4. consola browser por `Error cargando layout SCADA`

## Tarjetas no aparecen

Causas tipicas:

- el tag no esta en `collector_tags`
- el elemento no tiene posicion valida
- `mapping_json` apunta al tag equivocado

Revisar:

1. `mapping.collector_tags`
2. `mapping.mapping_json`
3. `layout.json_definition.elements`
4. `always_visible=true` si el elemento debe salir siempre

## Tiempo real no conecta

Revisar:

1. URL WS final construida en `src/config/env.ts`
2. token JWT valido
3. si falla query token, validar fallback por subprotocol
4. backend `WS /ws/scada/{lagoon_id}`

Si la conexion cae:

- la UI puede quedar `reconnecting`, `degraded` o `disconnected`
- luego de 7s igual debe mostrar el plano con valores `--`

## Laguna offline no muestra tarjetas

Comportamiento esperado:

- despues de la gracia inicial, el plano aparece con `--`

Revisar:

1. `sceneLoading` y `sceneError`
2. existencia de `elements`
3. que `collector_tags` no este filtrando todo

## Colores de bombas o valvulas no cambian

Revisar:

1. `src/scada/equipment-state/layouts/{layout}.equipment.json`
2. `svg_target`
3. payload `tags` del WebSocket
4. valor discreto esperado `0..3`

Mapa de color:

- `0` rojo
- `1` verde
- `2` azul
- `3` amarillo

## Historico no muestra lineas

Revisar:

1. `GET /api/scada/{lagoon_id}/history`
2. `resolution` enviada
3. `series[].points`
4. que los tags no hayan sido filtrados por no ploteables

Tags que el frontend descarta:

- contiene `WM`
- contiene `_ST_`
- contiene `_STATUS`
- contiene `_BOOL`
- contiene `RETRO`

## Eventos de bombas no aparecen

Revisar:

1. `GET /api/scada/{lagoon_id}/pump-events/last-3`
2. `tag_id` de cada evento
3. fallback `pump_last_on` del WS

## Alarmas PT/FIT no cargan o no guardan

Revisar:

1. `GET /api/alarms/{lagoon_id}/thresholds/pt-fit/view`
2. `PUT /api/alarms/{lagoon_id}/thresholds/pt-fit`
3. permisos `can_edit`
4. validaciones de `min_value`, `max_value`, `severity` y prefijo `PT/FIT`

## Build falla

Revisar:

1. `npm run build`
2. el primer error real
3. SVG con atributos JSX invalidos
4. JSON malformed

## Overrides locales no aplican

Revisar:

1. archivo `src/scada/scene/lagoons/<lagoon_id>.scene.json`
2. nombre exacto de la laguna en minusculas
3. `layout.id` dentro del archivo local

## Checklist antes de escalar

1. `lagoon_id`
2. response de `/api/lagoons`
3. response de `/api/lagoons/{lagoon_id}/mapping`
4. response de `/api/layouts/{layout_id}`
5. payload WS o banner de health
6. response de `/api/scada/{lagoon_id}/history` si aplica
7. captura UI + consola browser
