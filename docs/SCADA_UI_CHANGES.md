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
- rutas productizadas `/crystal/*` y `/small/*` con guard por rol.

## Mapa SCADA Local-Scene

Archivos:

- `src/components/lagoon/ScadaMapPanel.tsx`
- `src/hooks/useScadaLayoutScene.ts`
- `src/scada/lagoonSceneBundle.ts`
- `src/assets/positions/*.json`

Estado:

- posiciones, tags, labels y `svg_target` vienen de JSON local por laguna;
- se soportan `images[]`, `lagoon_metrics_overlay` y multiples mapas por `map_order`;
- el backend entrega datos realtime, historico, alarmas y permisos;
- si no hay realtime, luego de 7 segundos se muestra el plano con `--`;
- en modo dev los JSON locales se refrescan automaticamente sin recargar toda la pagina.

## Layouts Soportados

- `layout1`
- `layout2`
- `layout3`
- `layout4`
- `small_layout_1`

Alias:

- `layout_small` se normaliza a `layout3`.

## SmallLagoons

Se agrego escena local para:

- `src/assets/positions/small_sim.json`
- `src/svg/small_layout_1.tsx`

Estado:

- ruta `/small/lagoon/small_sim`;
- WebSocket `/ws/small/small_sim`;
- KPIs `PT-123`, `AE-100`, `AE-022`;
- overlay compacto `TEMP`, `ORP`, `Dosif`;
- asset `small_lagoons.webp` via `images[]`;
- popups DOSIF y hitbox accesible para popup de bomba `Pump recirculation`.

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
2. probar `small_layout_1`;
3. probar `ary`, `small_sim` y una laguna offline;
4. confirmar colores por `svg_target`;
5. validar selector de tags del historico;
6. ejecutar `npm run build`.
