# Playbook de Troubleshooting (Operacion)

Guia rapida para soporte y desarrollo cuando el dashboard SCADA presenta fallas.

## 1) No carga la vista de laguna

- Sintoma:
  - Pantalla en blanco o sin datos al entrar a `/lagoon/{id}`.
- Causas probables:
  - `lagoonId` invalido o no configurado en `src/data/lagoons.ts`.
  - Layout JSON/SVG no registrado en `src/scada/svgRegistry.ts`.
- Accion:
  1. Verificar que el `id` exista en `src/data/lagoons.ts`.
  2. Confirmar que el layout (`layout1/layout2/layout3`) exista en `src/layouts`.
  3. Revisar `svgRegistry` y validar que el SVG este mapeado.

## 2) SCADA realtime no actualiza

- Sintoma:
  - KPIs congelados, estado PLC sin cambios.
- Causas probables:
  - WebSocket desconectado (`/ws/scada`).
  - URL WS incorrecta en `src/config/api.ts`.
- Accion:
  1. Revisar consola del navegador (`WS disconnected` / `WS parse error`).
  2. Validar `API_WS` en `src/config/api.ts`.
  3. Confirmar conectividad a backend (host/puerto).

## 3) Hora local incorrecta en grafico o cards

- Sintoma:
  - Tooltip/eje con hora distinta a la laguna.
- Causas probables:
  - `timezone` no llega desde backend.
  - Formateo cae a timezone local del navegador.
- Accion:
  1. Verificar que WS entregue `timezone`.
  2. Revisar props `timezone` hacia `LagoonLineChart` y `PumpStatusKpi`.
  3. Confirmar formato de fecha ISO en backend.

## 4) Eventos de bombas vacios

- Sintoma:
  - Cards muestran "Sin eventos recientes".
- Causas probables:
  - Endpoint `/scada/{lagoon_id}/pump-events/last-3` devuelve arreglo vacio.
  - Error HTTP al consultar endpoint.
- Accion:
  1. Confirmar respuesta del endpoint para la laguna.
  2. Revisar error en UI (estado `eventsError`).
  3. Si falla endpoint, confirmar fallback con `pump_last_on` via WS.

## 5) Se ve solo 1 evento de bomba

- Sintoma:
  - En "Eventos recientes" aparece solo una fila.
- Causas probables:
  - Backend retorna solo 1 evento real.
  - Datos repetidos/invalidos tras normalizacion.
- Accion:
  1. Verificar payload `events[]` (deberian venir hasta 3).
  2. Confirmar que `start_local` sea fecha valida.
  3. Revisar agrupacion por `tag_id` en `LagoonContainer`.

## 6) RETRO_SCADA aparece como "SIN DATO"

- Sintoma:
  - Estado de retrolavado no refleja `true/false`.
- Causas probables:
  - Tag booleano no normalizado.
- Accion:
  1. Verificar que el valor llegue como boolean en `tags`.
  2. Confirmar `normalizePumpState`:
     - `true -> 1 (FUNCIONANDO)`
     - `false -> 0 (DETENIDA)`

## 7) Tooltip del chart muestra solo una serie

- Sintoma:
  - Tooltip compartido no lista todas las lineas.
- Causas probables:
  - Timestamps de series desalineados.
- Accion:
  1. Verificar alineacion de timeline comun en `LagoonLineChart`.
  2. Confirmar `tooltip.shared = true`.
  3. Revisar normalizacion por bucket (hourly/daily/weekly).

## 8) En 90D no se dibujan lineas

- Sintoma:
  - Hay datos en tooltip pero grafico "plano" o sin trazo visible.
- Causas probables:
  - Buckets fuera de rango visible.
  - Normalizacion de fechas con offsets incorrectos.
- Accion:
  1. Validar normalizacion en UTC para buckets diarios/semanales.
  2. Confirmar `min/max` de eje X con rango seleccionado.
  3. Revisar que valores no sean `null` por sobrescritura.

## 9) Login falla

- Sintoma:
  - No permite iniciar sesion.
- Causas probables:
  - Base URL de auth mal configurada.
  - Token no persistido.
- Accion:
  1. Revisar `VITE_API_HTTP` o `VITE_API_BASE_URL`.
  2. Validar respuesta de `/auth/login`.
  3. Revisar `localStorage` para token.

## 10) Build falla localmente

- Sintoma:
  - `npm run build` con error.
- Causas probables:
  - Dependencias desactualizadas o lock inconsistente.
  - Error de tipado/sintaxis en cambios recientes.
- Accion:
  1. Ejecutar `npm install`.
  2. Ejecutar `npm run build` y revisar primer error real.
  3. Validar imports/rutas absolutas y tipos nuevos.

## Checklist rapido antes de escalar

1. Confirmar laguna afectada (`lagoon_id`) y hora del incidente.
2. Guardar payload de:
   - WS `/ws/scada`
   - HTTP `/scada/{lagoon_id}/pump-events/last-3`
3. Adjuntar screenshot y error de consola.
4. Indicar si afecta una sola laguna o todas.
