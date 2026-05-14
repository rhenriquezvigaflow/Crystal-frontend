# SCADA UI Changes

Resumen del estado funcional actual de la UI SCADA.

## Shell Responsive

Archivos:

- `src/pages/lagoonsView.tsx`
- `src/components/TopBar.tsx`
- `src/components/Sidebar.tsx`

Estado:

- sidebar fijo en desktop;
- drawer en mobile;
- TopBar con selector de laguna, logout y boton de alarmas;
- RBAC visible con `can_edit` y `can_control`.

## Mapa SCADA Local-Scene

Archivos:

- `src/components/lagoon/ScadaMapPanel.tsx`
- `src/hooks/useScadaLayoutScene.ts`
- `src/scada/lagoonSceneBundle.ts`
- `src/assets/positions/*.json`

Estado:

- posiciones, tags, labels y `svg_target` vienen de JSON local por laguna;
- el backend entrega datos realtime, historico, alarmas y permisos;
- si no hay realtime, luego de 7 segundos se muestra el plano con `--`;
- en modo dev los JSON locales se refrescan automaticamente sin recargar toda la pagina.

## Layouts Soportados

- `layout1`
- `layout2`
- `layout3`
- `layout4`

Alias:

- `layout_small` se normaliza a `layout3`.

## Laguna ARY

Se agrego escena local para:

- `src/assets/positions/ary.json`
- `layout2`
- tags Rockwell sin sufijo `_SCADA`, por ejemplo `PT117_R`, `FIT002_R`, `P005_ST`, `VE246_ST`.

El collector master incluye:

- `collector_python/config/ary.yml`

## KPI Cards

Archivo:

- `src/components/scada/KPIComponent.tsx`

Reglas:

- posicion absoluta desde escena local;
- label limpia sufijos tecnicos;
- si no hay dato, valor `--`.

## Labels de Equipos

Archivos:

- `src/assets/positions/*.json`
- `src/containers/ScadaTextOverlay.tsx`
- `src/containers/ScadaSvgEquipmentLabelsOverlay.tsx`

Uso:

- `labels[]` puede traer texto fijo sobre el plano;
- se soporta `color`, `max_width`, `font_size`, `font_weight`, `align`, `text_shadow`;
- `source_svg_target` y `source_element_type` permiten asociar labels a objetos SVG.

## Estados SVG

Archivos:

- `src/scada/svgEquipmentState.ts`
- `src/containers/ScadaEquipmentStateOverlay.tsx`

Estado visual:

- `0` rojo
- `1` verde
- `2` azul
- `3` amarillo
- sin dato gris

El binding viene desde `pumps[]` y `valves[]` por `svg_target`.

## Realtime Health

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

- selector multi-tag;
- `Seleccionar todo`;
- rangos rapidos `1D`, `7D`, `30D`, `90D`, `185D`, `365D`;
- resolucion automatica por dias visibles.

## Modal de Alarmas PT/FIT

Archivo:

- `src/components/AlarmManagerModal.tsx`

Estado:

- filas configuradas + candidatas;
- guardado por fila o en lote;
- modo solo lectura cuando `can_edit=false`.

## Validacion Visual Rapida

1. probar `layout1` a `layout4`;
2. probar `ary` y una laguna offline;
3. confirmar colores por `svg_target`;
4. validar selector de tags del historico;
5. ejecutar `npm run build`.
