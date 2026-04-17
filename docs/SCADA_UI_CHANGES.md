# SCADA UI Changes

Resumen del estado funcional actual de la UI SCADA.

## Shell responsive

Archivos:

- `src/pages/lagoonsView.tsx`
- `src/components/TopBar.tsx`
- `src/components/Sidebar.tsx`

Estado:

- sidebar fijo en desktop
- drawer en mobile
- TopBar con selector de laguna, logout y boton de alarmas
- RBAC visible con `can_edit` y `can_control`

## Mapa SCADA backend-driven

Archivos:

- `src/components/lagoon/ScadaMapPanel.tsx`
- `src/hooks/useScadaLayoutScene.ts`
- `src/api/scadaLayoutsApi.ts`
- `src/scada/layoutSceneResolver.ts`

Estado:

- posiciones principales vienen de backend
- mapping por laguna viene de `mapping_json`
- `collector_tags` filtra tarjetas tecnicas no habilitadas
- si no hay realtime, luego de 7s se muestra el plano con `--`
- existen overrides locales por laguna via `scene/lagoons/*.scene.json`

## Layouts soportados

- `layout1`
- `layout2`
- `layout3`
- `layout4`

Alias:

- `layout_small` se normaliza a `layout3`

## KPI cards

Archivo:

- `src/components/scada/KPIComponent.tsx`

Reglas:

- posicion absoluta con `translate(-50%, -50%)`
- label limpia sufijos tecnicos
- si no hay dato, valor `--`

## Labels de equipos

Archivos:

- `src/scada/labels/layouts/*.base.json`
- `src/scada/labels/lagoons/*.json`
- `src/containers/ScadaTextOverlay.tsx`

Uso:

- base por layout
- override por laguna
- soporte para color, width, weight, align y shadow

## Estados SVG

Archivos:

- `src/scada/equipment-state/layouts/*.equipment.json`
- `src/scada/svgEquipmentState.ts`
- `src/containers/ScadaEquipmentStateOverlay.tsx`

Estado visual:

- `0` rojo
- `1` verde
- `2` azul
- `3` amarillo
- sin dato gris

## Realtime health

Archivo:

- `src/components/lagoonContainer.tsx`

Estados:

- `connecting`
- `reconnecting`
- `degraded`
- `disconnected`

La UI levanta banners cuando el socket se cae o los datos quedan congelados.

## Historico

Archivos:

- `src/components/charts/LagoonLineChart.tsx`
- `src/components/charts/historySeries.ts`
- `src/hooks/useHistory.ts`

Estado:

- selector multi-tag
- `Seleccionar todo`
- rangos rapidos `1D`, `7D`, `30D`, `90D`, `185D`, `365D`
- resolucion automatica por dias visibles

## Modal de alarmas PT/FIT

Archivo:

- `src/components/AlarmManagerModal.tsx`

Estado:

- filas configuradas + candidatas
- guardado por fila o en lote
- modo solo lectura cuando `can_edit=false`

## Validacion visual rapida

1. probar `layout1` a `layout4`
2. probar una laguna offline
3. confirmar filtros por `collector_tags`
4. validar colores de equipos
5. validar selector de tags del historico
6. ejecutar `npm run build`
