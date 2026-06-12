# Guia Frontend para Agregar una Nueva Laguna

**Actualizado:** 2026-06-12

Esta guia cubre solo el lado frontend. La laguna tambien debe existir en backend y collector con el mismo `lagoon_id`.

## 1. Definir Producto y Ruta

Productos soportados:

- `crystal`
- `small`

Rutas:

- Crystal: `/crystal/lagoon/{lagoon_id}`
- SmallLagoons: `/small/lagoon/{lagoon_id}`
- Legacy Crystal: `/lagoon/{lagoon_id}`

El selector carga lagunas desde:

- `/api/crystal/lagoons`
- `/api/small/lagoons`

El frontend descarta filas sin `can_view`, con `enable=false` o con `product_type` distinto al modulo activo.

## 2. Crear Escena Local

Crear:

```text
src/assets/positions/<lagoon_id>.json
```

Ejemplo minimo Crystal:

```json
{
  "lagoon_id": "mi_laguna",
  "layout_id": "layout2",
  "svg_component": "layout2",
  "aspect_ratio": "1400 / 1150",
  "kpis": [
    {
      "tag": "PT117_R",
      "label": "PT_117",
      "unit": "bar",
      "position": { "top": "29%", "left": "37.4%" },
      "icon_type": "pressure"
    }
  ],
  "pumps": [
    {
      "tag": "P006_ST",
      "label": "Bomba Filtracion",
      "svg_target": "circle26-4",
      "panel": "pump-status"
    }
  ],
  "valves": [],
  "labels": [],
  "plc_status": {
    "position": { "top": "12%", "left": "14%" }
  }
}
```

Reglas:

- `lagoon_id` debe coincidir con backend y collector.
- `tag` debe coincidir exactamente con el tag recibido por WebSocket.
- `svg_target` debe existir como `id` dentro del SVG.
- `svg_component` debe existir en `src/svg/*.tsx`.

## 3. SmallLagoons

Base actual:

- `src/assets/positions/small_sim.json`
- `src/svg/small_layout_1.tsx`

Ejemplo Small:

```json
{
  "lagoon_id": "small_sim",
  "layout_id": "small_layout_1",
  "svg_component": "small_layout_1",
  "aspect_ratio": "1393.0437 / 1000",
  "map_name": "Small Simulator",
  "map_order": 1,
  "default_map": true,
  "images": [
    {
      "id": "small-lagoons-image",
      "type": "image",
      "src": "small_lagoons.webp",
      "alt": "Small Lagoons",
      "position": { "top": "42%", "left": "16%" },
      "width": "48%",
      "height": "40%",
      "object_fit": "contain"
    }
  ],
  "kpis": [
    { "tag": "PT-123", "label": "PT-123", "unit": "Bar", "position": { "top": "34%", "left": "35%" }, "always_visible": true }
  ],
  "lagoon_metrics_overlay": {
    "position": { "top": "41.5%", "left": "16.5%" },
    "width": "24%",
    "metrics": [
      { "key": "temperature", "tag": "TEMP", "label": "TEMP", "unit": "C" },
      { "key": "orp", "tag": "ORP", "label": "ORP", "unit": "mV" },
      { "key": "dosage", "tag": "Dosif", "label": "Dosif", "unit": "ppm" }
    ]
  },
  "labels": []
}
```

Los assets de `images[]` se resuelven desde `src/lagoons/img/*` por nombre de archivo.

## 4. SVG Nuevo

Crear:

```text
src/svg/<nombre_layout>.tsx
```

`src/scada/svgRegistry.ts` descubre automaticamente todos los `*.tsx` dentro de `src/svg`.

Validar:

- `viewBox` estable;
- `preserveAspectRatio` adecuado;
- IDs usados por `svg_target`;
- `aspect_ratio` en la escena.

## 5. Multiples Mapas

Se soportan dos estrategias:

- Varios JSON embebidos para la misma laguna usando el mismo `lagoon_id` y `map_order`.
- Bundle externo en `/scada/maps/{lagoon_id}/maps.json` con `layout.json` y `map.svg`.

Si hay mapas multiples, el selector usa `map_order`, `default_map` y `map_name`.

## 6. WebSocket y Datos

El modulo activo abre:

```text
WS /ws/{product_type}/{lagoon_id}
```

Ejemplos:

- `WS /ws/crystal/mi_laguna`
- `WS /ws/small/small_sim`

El layout se muestra aunque no haya datos; despues de la gracia inicial los valores quedan como `--`.

## 7. Checklist

1. La laguna aparece en `/api/{product}/lagoons`.
2. Existe `src/assets/positions/<lagoon_id>.json`.
3. `svg_component` existe en `src/svg`.
4. Los tags del JSON coinciden con WebSocket.
5. Los `svg_target` existen en el SVG.
6. `npm run build` termina sin errores.
