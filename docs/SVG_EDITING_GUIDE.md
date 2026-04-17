# Guia de edicion de SVGs

Guia practica para modificar layouts SCADA sin romper overlays ni bindings.

## Archivos involucrados

SVG React:

- `src/svg/layout1.tsx`
- `src/svg/layout2.tsx`
- `src/svg/layout3.tsx`
- `src/svg/layout4.tsx`

Registro:

- `src/scada/svgRegistry.ts`

Scene y resolucion:

- `src/scada/layoutResolver.ts`
- `src/scada/layoutSceneResolver.ts`
- `src/scada/localSceneRegistry.ts`

Labels:

- `src/scada/labels/layouts/*.base.json`
- `src/scada/labels/lagoons/*.json`

Estados SVG:

- `src/scada/equipment-state/layouts/*.equipment.json`
- `src/scada/svgEquipmentState.ts`

## Regla principal

La fuente de verdad de posiciones y elementos es backend, salvo que exista un override local por laguna.

Orden efectivo:

1. backend mapping/layout
2. override local `src/scada/scene/lagoons/<lagoon>.scene.json`
3. render final de overlays

## Antes de editar

Identificar:

- `layout_id`
- `svg_component`
- elementos que dependen de `svg_target`
- labels asociados
- equipment-state asociado

## Buenas practicas

- conservar `viewBox`
- mantener IDs estables
- no renombrar nodos usados por `svg_target`
- evitar filtros o metadata innecesaria
- si cambia proporcion, ajustar `aspectRatio` en `svgRegistry`

## Ajustar cards y elementos

Las cards no dependen del SVG para su posicion final.

La posicion sale de:

- backend `layout.json_definition.elements[].position`
- o override local de escena si existe

Ejemplo:

```json
{
  "id": "pressure_1",
  "type": "kpi",
  "position": { "left": "21.3%", "top": "40.3%" }
}
```

## Ajustar labels

Base por layout:

```json
{
  "id": "FIS001",
  "text": "FISS - 001",
  "position": { "left": "42.5%", "top": "41.5%" },
  "align": "center",
  "color": "#ffffff"
}
```

Override por laguna:

- usar solo diferencias en `src/scada/labels/lagoons/<lagoon>.json`

## Ajustar estados de equipos

Ejemplo fijo:

```json
{
  "id": "layout2_static_circle26",
  "svg_target": "circle26",
  "role": "pump",
  "state": 0
}
```

Ejemplo dinamico:

```json
{
  "id": "layout2_pump_005",
  "svg_target": "circle26-4",
  "role": "pump",
  "tag": "P005_STS_SCADA"
}
```

Colores:

- `0` rojo
- `1` verde
- `2` azul
- `3` amarillo

## Overrides locales de escena

Si necesitas un layout puntual sin tocar backend:

- crear `src/scada/scene/lagoons/<lagoon_id>.scene.json`

Ese archivo puede definir:

- `layout.id`
- `layout.json_definition`

El hook `useScadaLayoutScene` usara el layout local y seguira mezclando `collector_tags` del backend cuando existan.

## Validacion minima

1. `npm run build`
2. revisar vista desktop y mobile
3. probar laguna online y offline
4. confirmar overlays y labels
5. confirmar colores por `svg_target`
