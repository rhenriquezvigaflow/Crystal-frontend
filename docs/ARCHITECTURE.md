# Arquitectura Frontend SCADA

## 1) Panorama general

El frontend se organiza en una arquitectura por capas:

1. `pages` y `components` para composicion de UI
2. `hooks` para orquestar estado remoto
3. `api` para llamadas HTTP tipadas
4. `config` para direccionamiento de backend

## 2) Diagrama de alto nivel

```text
Usuario (Browser)
  -> Router (App.tsx)
    -> /lagoon/:lagoonId
      -> LagoonsView
        -> LagoonContainer
          -> useScadaRealtime      (WebSocket)
          -> useHistory            (HTTP)
          -> usePumpEventsLast3    (HTTP)
          -> ScadaOverlay
          -> PumpStatusKpi
          -> LagoonLineChart
```

## 3) Flujos de datos

### 3.1 Realtime SCADA

- Hook: `src/hooks/useScadaRealtime.ts`
- Endpoint: `ws://.../ws/scada?lagoon_id={id}`
- Datos principales:
  - `tags`
  - `plc_status`
  - `local_time`
  - `timezone`
  - `pump_last_on` (fallback legacy)

### 3.2 Historico

- Hook: `src/hooks/useHistory.ts`
- API: `src/api/scadaHistory.ts`
- Endpoint usado hoy:
  - `GET /scada/history/hourly`
- Uso:
  - Alimenta `LagoonLineChart`
  - Filtros de rango: 1D, 7D, 30D, 90D, etc.

### 3.3 Eventos de bombas (last 3)

- Hook: `src/hooks/usePumpEventsLast3.ts`
- API: `src/api/scadaPumpEvents.ts`
- Endpoint:
  - `GET /scada/{lagoon_id}/pump-events/last-3`
- Uso:
  - `LagoonContainer` agrupa eventos por `tag_id`
  - `PumpStatusKpi` renderiza hasta 3 eventos por bomba
  - Soporta estados UI: `loading`, `error`, `empty`

## 4) Composicion visual

- `src/pages/lagoonsView.tsx`
  - Estructura shell: `Sidebar + TopBar + LagoonContainer`

- `src/components/lagoonContainer.tsx`
  - Carga layout dinamico JSON (`src/layouts/crystal-layout*.layout.json`)
  - Resuelve SVG via `src/scada/svgRegistry.ts`
  - Conecta datos realtime + historico + eventos

- `src/containers/ScadaOverlay.tsx`
  - Dibuja KPIs sobre el SVG segun layout

- `src/components/lagoon/PumpStatusKpi.tsx`
  - Estado de bombas
  - Lista de eventos recientes (hasta 3)
  - Etiquetas visibles amigables

- `src/components/charts/LagoonLineChart.tsx`
  - Historico multi-serie
  - Formato en timezone de laguna
  - Tooltip compartido

## 5) Modelo de estado de bomba

La UI acepta estado de bomba tanto numerico como booleano:

- `1` o `true` -> `FUNCIONANDO`
- `0` o `false` -> `DETENIDA`

Esta normalizacion vive en `LagoonContainer` para evitar que tags booleanos (ej. `RETRO_SCADA`) aparezcan como `SIN DATO`.

## 6) Decisiones tecnicas importantes

1. Layout desacoplado por JSON + SVG:
   - Permite agregar lagunas sin reescribir componentes principales.

2. Hooks como capa de acceso remoto:
   - Evita mezclar fetch/ws directamente en componentes visuales.

3. Fallback de eventos de bomba:
   - Si falla `pump-events/last-3`, se puede usar `pump_last_on` realtime como degradacion.

## 7) Riesgos y deuda tecnica actual

1. Configuracion API inconsistente:
   - `src/config/api.ts` usa host hardcoded
   - `src/auth/authApi.ts` usa env vars
   - Recomendado: unificar todo en `.env` por entorno.

2. Tipado laxo en componentes legacy:
   - Hay uso de `any` en algunos contenedores/hook.

3. Logging en consola en produccion:
   - Revisar `console.log/console.error` para control centralizado.
