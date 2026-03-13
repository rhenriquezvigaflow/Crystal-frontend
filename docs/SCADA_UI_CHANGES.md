# SCADA UI Changes (Estado actual)

Ultima actualizacion: 2026-03-13

Este documento resume el estado visual actual de la UI SCADA, no solo un changelog historico.

## 1) Shell responsive de pagina

Archivo: `src/pages/lagoonsView.tsx`

- Desktop:
  - `Sidebar` fijo a la izquierda.
  - `TopBar` + contenido a la derecha.
- Mobile/Tablet:
  - sidebar en drawer lateral.
  - cierre por click en backdrop o tecla `Escape`.
  - bloqueo de scroll de `body` mientras el drawer esta abierto.

## 2) TopBar

Archivo: `src/components/TopBar.tsx`

- estilo visual glass blanco/celeste.
- selector de laguna:
  - visible en desktop y mobile.
  - usa lagunas habilitadas por RBAC.
- indicadores de rol:
  - `Editor` si `can_edit`.
  - `Solo lectura` si no.
- boton de cierre de sesion.
- boton hamburguesa en mobile.

## 3) Sidebar

Archivo: `src/components/Sidebar.tsx`

- panel lateral con estilo atmosferico.
- estado activo claro por laguna seleccionada.
- navegacion con `react-router-dom`.
- al navegar en mobile, cierra drawer automaticamente.

## 4) Sistema visual global

Archivo: `src/index.css`

Tokens y clases principales:

- variables CSS en `:root` (`--lagoon-*`).
- fondo global con gradientes y capas radiales.
- clases reutilizables:
  - `.lagoon-topbar`
  - `.lagoon-sidebar`
  - `.lagoon-panel`
  - `.lagoon-map-shell`
  - `.lagoon-map-frame`
  - `.lagoon-glow`
- reglas SCADA:
  - `.scada-stage svg` ajusta el SVG al contenedor.
  - `.scada-stage-no-control svg [id^="Vector_324"]` oculta controles cuando no hay permiso.

## 5) Bloque de mapa SCADA

Archivo: `src/components/lagoon/ScadaMapPanel.tsx`

- el titulo de laguna vive dentro del panel del mapa.
- el heading usa timezone de la laguna como contexto visual.
- el mapa usa `aspectRatio` definido en `svgRegistry`.
- renderiza:
  - SVG base (`SvgComponent`).
  - overlay de KPIs (`ScadaOverlay`).
- muestra mensaje si no existe layout/SVG para la laguna.

## 6) Overlay de KPIs y PLC

Archivo: `src/containers/ScadaOverlay.tsx`

- KPIs tipo `kpi`:
  - visual plano (valor + unidad).
  - posicion absoluta segun `layout.kpis[].position`.
- KPI tipo `plc_status`:
  - tarjeta destacada con estado (`online/offline`).
  - reloj local (`local_time`) y `timezone`.

## 7) Estado de bombas

Archivo: `src/components/lagoon/PumpStatusKpi.tsx`

- tarjetas por bomba con codificacion por color:
  - `FUNCIONANDO`
  - `DETENIDA`
  - `MOVIENDOSE`
  - `FALLA`
  - `SIN DATO`
- lista hasta 3 eventos recientes por bomba.
- estados UX cubiertos:
  - `loading`
  - `error`
  - `empty`

## 8) Historico y chart

Archivos:

- `src/components/lagoonContainer.tsx`
- `src/components/charts/LagoonLineChart.tsx`

Cambios/estado actual:

- selector multi TAG con "Seleccionar todo".
- botones de rango rapido: `1D`, `7D`, `30D`, `90D`, `185D`, `365D`.
- selector de fechas `Desde/Hasta`.
- chart con zoom horizontal y timeline alineado entre series.
- tooltip compartido y fechas formateadas en timezone de laguna.

## 9) Integracion con RBAC

Archivo principal: `src/components/lagoonContainer.tsx`

- `can_control=false`:
  - oculta controles en SVG.
  - muestra alerta "Controles de bombas ocultos por permisos RBAC."
- `can_edit` impacta affordances de topbar.
- `can_view` define visibilidad de lagunas en navegacion.

## 10) Registro de layouts SVG

Archivo: `src/scada/svgRegistry.ts`

Cada layout mapea:

- `component`: componente React del SVG.
- `aspectRatio`: relacion usada por el contenedor del mapa.

Layouts activos:

- `layout1`
- `layout2`
- `layout3`
- `layout_small` (alias de `layout3`)

## 11) Alcance funcional

La UI actual mantiene la logica de negocio principal:

- consumo realtime (`useScadaRealtime`).
- historico (`useHistory`).
- eventos de bombas (`usePumpEventsLast3`).
- carga dinamica JSON+SVG por layout.
- fallback de eventos via `pump_last_on` cuando falla endpoint `last-3`.
