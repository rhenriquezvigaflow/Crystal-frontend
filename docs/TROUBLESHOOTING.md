# Playbook de Troubleshooting (Operacion)

Ultima actualizacion: 2026-03-13

Guia rapida para soporte y desarrollo cuando el dashboard SCADA presenta fallas.

## 1) No puedo entrar al dashboard (redireccion a login)

Sintoma:

- al abrir `/dashboard` o `/lagoon/:id`, vuelve a `/login`.

Causas probables:

- token vencido o invalido.
- sesion local corrupta.

Accion:

1. Revisar `localStorage` (`token` y `crystal_auth_v1`).
2. Verificar expiracion del JWT (`exp`).
3. Reautenticar y validar respuesta de `/auth/login`.

## 2) "Acceso no permitido" al cargar lagunas

Sintoma:

- pantalla de acceso no permitido en `/dashboard` o `/lagoon/:id`.

Causas probables:

- backend responde `403`.
- usuario sin `can_view`.

Accion:

1. Revisar respuesta de `GET /lagoons`.
2. Confirmar permisos RBAC del usuario.
3. Validar que token corresponda al ambiente correcto.

## 3) No aparece una laguna que existe en backend

Sintoma:

- la laguna viene en backend pero no se lista en sidebar/topbar.

Causas probables:

- `can_view=false`.
- nombre fuera de allowlist en `LagoonsContext`.

Accion:

1. Revisar flags `can_view`, `can_edit`, `can_control`.
2. Validar nombre de `lagoon_name` y normalizacion (acentos/espacios).
3. Ajustar allowlist en `src/lagoons/LagoonsContext.tsx` si corresponde.

## 4) Vista de laguna sin plano SCADA

Sintoma:

- mensaje: "No hay layout SCADA disponible para esta laguna."

Causas probables:

- `scada_layout` no registrado en `src/scada/svgRegistry.ts`.
- no existe JSON `src/layouts/crystal-{layout}.layout.json`.

Accion:

1. Confirmar valor de `scada_layout` que retorna `/lagoons`.
2. Verificar alias activos (`layout_small -> layout3`).
3. Registrar componente SVG y `aspectRatio` en `svgRegistry`.
4. Crear o corregir layout JSON correspondiente.

## 5) Realtime no actualiza (KPIs congelados)

Sintoma:

- tags no cambian, estado PLC no se actualiza.

Causas probables:

- WS desconectado.
- URL WS incorrecta.
- token invalido en query param.

Accion:

1. Revisar consola para `WS disconnected` o `WS parse error`.
2. Verificar construccion de URL:
   - `/ws/scada/{lagoonId}?token={accessToken}`.
3. Validar `API_WS` (`VITE_API_WS` o derivado desde `API_HTTP`).
4. Confirmar que el token siga vigente.

## 6) Hora local o timezone incorrectos

Sintoma:

- tarjeta PLC y chart muestran hora que no coincide con planta.

Causas probables:

- WS no envia `local_time` o `timezone`.
- timezone invalida cae a fallback del navegador.

Accion:

1. Inspeccionar payload WS para `local_time` y `timezone`.
2. Verificar props hacia `ScadaOverlay` y `LagoonLineChart`.
3. Comprobar que timezone sea IANA valida (ej: `America/Santiago`).

## 7) Controles de bombas ocultos

Sintoma:

- no se ven controles dentro del SVG y aparece alerta de RBAC.

Causas probables:

- `can_control=false` para esa laguna/usuario.

Accion:

1. Revisar payload de `/lagoons` (`can_control`).
2. Confirmar que no sea un bug visual:
   - CSS `.scada-stage-no-control svg [id^="Vector_324"]`.
3. Si usuario debe controlar, ajustar permisos en backend.

## 8) Eventos de bombas vacios o incompletos

Sintoma:

- "Sin eventos recientes" o pocos eventos en cards.

Causas probables:

- endpoint `last-3` devuelve vacio.
- error HTTP en `/pump-events/last-3`.
- fechas invalidas en `start_local`.

Accion:

1. Validar respuesta de `GET /scada/{lagoon_id}/pump-events/last-3`.
2. Revisar estado `eventsError` en UI.
3. Confirmar fallback realtime `pump_last_on` cuando el endpoint falla.
4. Verificar agrupacion por `tag_id` en `LagoonContainer`.

## 9) Historico sin lineas o con pocas series

Sintoma:

- chart vacio o tooltip incompleto.

Causas probables:

- no hay datos en rango.
- TAGs no seleccionados.
- TAGs no ploteables filtrados por regla (`_ST_`, `_STATUS`, `_BOOL`, `RETRO`, etc).
- timestamps desalineados o fuera de rango visible.

Accion:

1. Probar rango corto (`1D`) y luego ampliar.
2. Usar "Seleccionar todo" en selector de TAG.
3. Validar payload de historico (`series[].points[]`).
4. Confirmar normalizacion temporal (`hourly/daily/weekly`) en `LagoonLineChart`.

## 10) Error general de API

Sintoma:

- mensajes genericos de error en login, historico o eventos.

Causas probables:

- backend caido o host incorrecto.
- CORS o red interna inaccesible.

Accion:

1. Confirmar `API_HTTP` efectivo (`VITE_API_HTTP` / fallback local).
2. Probar endpoint base manualmente.
3. Revisar detalle de error normalizado por `ApiError`.

## 11) Build falla localmente

Sintoma:

- `npm run build` falla.

Causas probables:

- error de tipos o sintaxis en cambios recientes.
- dependencias no instaladas.

Accion:

1. Ejecutar `npm install`.
2. Ejecutar `npm run build` y revisar el primer error.
3. Corregir imports, tipos y rutas.

## Checklist antes de escalar

1. Laguna afectada (`lagoon_id`) y hora exacta del incidente.
2. Payloads capturados:
   - `GET /lagoons`
   - WS `/ws/scada/{lagoonId}?token=...`
   - `GET /scada/history/hourly`
   - `GET /scada/{lagoon_id}/pump-events/last-3`
3. Captura de pantalla de UI + logs de consola.
4. Confirmar si afecta una laguna o todas.
