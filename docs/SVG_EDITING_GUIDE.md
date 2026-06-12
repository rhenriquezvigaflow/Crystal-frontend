# Guia de Edicion de SVGs y Escenas SCADA

Guia practica para modificar layouts SCADA sin romper overlays ni bindings.

## Archivos Involucrados

SVG React:

- `src/svg/layout1.tsx`
- `src/svg/layout2.tsx`
- `src/svg/layout3.tsx`
- `src/svg/layout4.tsx`
- `src/svg/small_layout_1.tsx`

Registro:

- `src/scada/svgRegistry.ts`

Escenas por laguna:

- `src/assets/positions/*.json`
- `src/lagoons/img/*`

Resolucion:

- `src/scada/layoutResolver.ts`
- `src/scada/lagoonSceneBundle.ts`
- `src/scada/localSceneRegistry.ts`
- `src/scada/scadaLayoutPosition.ts`

Render:

- `src/containers/ScadaOverlay.tsx`
- `src/containers/ScadaTextOverlay.tsx`
- `src/containers/ScadaSvgEquipmentLabelsOverlay.tsx`
- `src/containers/ScadaEquipmentStateOverlay.tsx`

## Regla Principal

La fuente de verdad visual actual es el JSON local de la laguna en `src/assets/positions`.

El backend no entrega layout/mapping visual en el flujo actual. Entrega:

- lista de lagunas y permisos;
- realtime por WebSocket;
- historico;
- eventos;
- alarmas.

## Antes de Editar

Identificar:

- `lagoon_id`;
- `layout_id`;
- `svg_component`;
- `aspect_ratio`;
- tags usados por KPIs, pumps y valvulas;
- imagenes y `lagoon_metrics_overlay` si aplica;
- `svg_target` de cada pump o valvula que debe cambiar de color;
- labels fijos sobre el plano.

## Buenas Practicas SVG

- conservar `viewBox`;
- mantener IDs estables en los nodos usados por `svg_target`;
- evitar renombrar pumps o valvulas ya referenciadas por JSON;
- evitar filtros o metadata innecesaria;
- si cambia la proporcion, ajustar `aspectRatio` en `svgRegistry.ts` y/o `aspect_ratio` en la escena.
- para SmallLagoons, conservar hitboxes transparentes usados por popups de bombas o dosificadores.

## Ajustar KPI Cards

Ejemplo:

```json
{
  "tag": "PT117_R",
  "label": "PT_117",
  "unit": "bar",
  "position": {
    "top": "29%",
    "left": "37.4%"
  },
  "icon_type": "pressure"
}
```

`position` acepta:

- `{ "top": "29%", "left": "37.4%" }`
- `{ "x": 0.374, "y": 0.29 }`

## Ajustar Pumps y Valvulas

Ejemplo pump con panel de eventos:

```json
{
  "tag": "P005_ST",
  "label": "Pump Filtro",
  "svg_target": "circle26-4",
  "panel": "pump-status"
}
```

Ejemplo valvula:

```json
{
  "tag": "VE246_ST",
  "label": "VE-401",
  "svg_target": "VE-401"
}
```

Colores por estado:

- `0` rojo
- `1` verde
- `2` azul
- `3` amarillo

## Ajustar Labels

Ejemplo:

```json
{
  "id": "valve-title-ve-401",
  "text": "VX-254",
  "source_svg_target": "VE-401",
  "source_element_type": "valve",
  "position": {
    "top": "86%",
    "left": "16.5%"
  },
  "align": "center",
  "color": "#ffffff"
}
```

Campos opcionales:

- `max_width`
- `font_size`
- `font_weight`
- `text_shadow`
- `hidden`

## Ajustar Imagenes

Ejemplo:

```json
{
  "id": "small-lagoons-image",
  "type": "image",
  "src": "small_lagoons.webp",
  "alt": "Small Lagoons",
  "position": {
    "top": "42%",
    "left": "16%"
  },
  "width": "48%",
  "height": "40%",
  "object_fit": "contain"
}
```

`src` se busca por nombre dentro de `src/lagoons/img/*`. Si no existe, se usa el valor como URL.

## Ajustar Lagoon Metrics Overlay

Ejemplo Small:

```json
{
  "lagoon_metrics_overlay": {
    "position": {
      "top": "41.5%",
      "left": "16.5%"
    },
    "width": "24%",
    "metrics": [
      { "key": "temperature", "tag": "TEMP", "label": "TEMP", "unit": "C" },
      { "key": "orp", "tag": "ORP", "label": "ORP", "unit": "mV" },
      { "key": "dosage", "tag": "Dosif", "label": "Dosif", "unit": "ppm" }
    ]
  }
}
```

`key` acepta `temperature`, `orp` y `dosage`.

## Agregar una Laguna

1. Crear `src/assets/positions/<lagoon_id>.json`.
2. Usar un `svg_component` existente (`layout1` a `layout4`) o agregar uno nuevo.
3. Si agregas SVG nuevo:
   - crear `src/svg/<nombre_layout>.tsx`;
   - confirmar que `src/scada/svgRegistry.ts` lo descubre via `import.meta.glob`;
   - usar ese nombre en `svg_component`.
4. Confirmar que el backend devuelve la laguna en `GET /api/{product}/lagoons`.
5. Confirmar que el collector envia tags con los mismos nombres usados por la escena.

Para SmallLagoons, usar `product_type = "small"` y la ruta `/small/lagoon/<lagoon_id>`.

## Debug Visual

Agregar query string:

```text
?scadaDebug=1
```

Esto muestra grilla de coordenadas sobre el plano.

## Validacion Minima

1. `npm run build`
2. revisar vista desktop y mobile
3. probar laguna online y offline
4. confirmar overlays y labels
5. confirmar colores por `svg_target`
