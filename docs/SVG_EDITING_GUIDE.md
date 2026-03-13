# Guia de edicion de SVGs (SCADA)

Ultima actualizacion: 2026-03-13

## Objetivo

Estandarizar como editar o agregar un SVG SCADA sin romper:

- el render del mapa.
- el overlay de KPIs.
- los permisos RBAC de control.
- la relacion visual del layout en responsive.

## Archivos involucrados

- SVG React: `src/svg/layout1.tsx`, `src/svg/layout2.tsx`, `src/svg/layout3.tsx`
- Registro: `src/scada/svgRegistry.ts`
- Layout de overlay: `src/layouts/crystal-layout*.layout.json`
- Render del mapa: `src/components/lagoon/ScadaMapPanel.tsx`
- Overlay de KPIs/PLC: `src/containers/ScadaOverlay.tsx`
- Regla RBAC de controles: `src/index.css`

## Flujo recomendado (paso a paso)

### 1) Definir layout objetivo

Antes de editar, identifica cual layout usa la laguna:

- valor backend: `scada_layout` en `GET /lagoons`.
- alias vigente: `layout_small` se resuelve a `layout3`.

### 2) Editar el archivo base en herramienta grafica

Puedes usar Inkscape/Illustrator/Figma, pero exporta finalmente a SVG plano.

Recomendaciones:

- mantener el mismo `viewBox` cuando sea un ajuste menor.
- si cambias el lienzo, documentar nuevo ancho/alto del `viewBox`.
- evitar filtros pesados o imagenes embebidas muy grandes.

### 3) Convertir a componente React

El archivo final en este repo es TSX.

Estructura minima recomendada:

```tsx
import type { ScadaSvgProps } from "../scada/svgRegistry";

const SVGComponent = ({ tags = {}, ...props }: ScadaSvgProps) => {
  return (
    <svg viewBox="0 0 1400 1150" {...props}>
      {/* contenido */}
    </svg>
  );
};

export default SVGComponent;
```

Notas:

- `tags` es opcional, pero recomendado para layouts con colores dinamicos.
- evita atributos invalidos en JSX (`class` -> `className`, `stroke-width` -> `strokeWidth`, etc).

### 4) Mantener ids de controles RBAC

La UI oculta controles cuando `can_control=false` con esta regla:

- `.scada-stage-no-control svg [id^="Vector_324"] { display: none !important; }`

Si cambias ids de esos elementos, debes:

1. mantener prefijo `Vector_324`, o
2. actualizar la regla CSS para el nuevo patron.

### 5) Sincronizar `svgRegistry`

Actualiza `src/scada/svgRegistry.ts`:

- componente del layout.
- `aspectRatio`.

Regla practica:

- `aspectRatio` debe ser consistente con el `viewBox` que quieres mostrar.
- si el mapa se ve estirado/cortado, revisar primero este campo.

### 6) Ajustar overlay en JSON

El SVG base y el overlay estan desacoplados:

- el dibujo vive en `src/svg/*.tsx`.
- KPIs/PLC/pumps viven en `src/layouts/crystal-*.layout.json`.

Si moviste equipos en el plano:

1. ajustar `position.top` y `position.left` de cada KPI.
2. validar `backendTag` correcto.
3. revisar bloque `type: "pumps"` y sus `backendTag`.

### 7) Si el SVG usa colores por tag

Para layouts dinamicos (como `layout2` y `layout3`):

- normaliza keys de tags (quitar guiones/underscores y pasar a lowercase).
- convierte valores a estado comun (`0|1|2|3`).
- mapea estado a color.

Estados usados en UI:

- `0`: falla
- `1`: funcionando
- `2`: moviendose
- `3`: detenida/cerrada

### 8) Validar en UI

Checklist visual minimo:

1. desktop y mobile.
2. laguna con `can_control=true` y `can_control=false`.
3. overlay de KPIs alineado.
4. tarjeta PLC visible y legible.
5. sin cortes horizontales en contenedor (`overflow-x`).

### 9) Validar build

Ejecutar:

```bash
npm run build
```

Si falla, revisar primero errores JSX/TSX del SVG (atributos o sintaxis).

## Errores frecuentes

1. El SVG no aparece:
   - no esta registrado en `svgRegistry`.
   - el import del componente esta mal.
2. El plano se ve deformado:
   - `aspectRatio` no coincide con `viewBox`.
3. KPIs fuera de lugar:
   - faltan ajustes en layout JSON.
4. Controles no se ocultan con RBAC:
   - ids ya no cumplen selector `Vector_324`.
5. Colores no cambian por estado:
   - no encuentra tags por alias/sufijo.

## Convencion recomendada para cambios futuros

1. editar SVG.
2. actualizar `svgRegistry`.
3. actualizar layout JSON.
4. probar realtime + historico + bombas.
5. ejecutar build.
6. documentar cambios en `docs/SCADA_UI_CHANGES.md`.
