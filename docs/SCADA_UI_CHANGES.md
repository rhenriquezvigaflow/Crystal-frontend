# SCADA UI Changes

## Resumen

Este documento resume los cambios visuales y estructurales implementados en el frontend SCADA de Crystal Lagoons.

El alcance fue UI/UX y presentacion. No se modifico la logica de negocio, consumo de APIs, WebSocket, historicos ni reglas funcionales del dashboard.

## Objetivo del trabajo

Se busco:

- mejorar la responsividad para PC, tablet y celular,
- adaptar la navegacion lateral a dispositivos moviles,
- hacer que el plano SCADA escale mejor y se vea integrado con el dashboard,
- mejorar la legibilidad de overlays, estado PLC y reloj,
- unificar la identidad visual con una estetica blanca/celeste, suave y mas llamativa,
- integrar el nombre de la laguna dentro del bloque del plano.

## Cambios implementados

### 1. Layout responsive principal

Archivo principal:

- `src/pages/lagoonsView.tsx`

Cambios:

- El `Sidebar` queda visible en desktop.
- En tablet y movil el `Sidebar` se oculta por defecto.
- Se agrego drawer lateral movil activado con boton hamburguesa.
- Se bloqueo el scroll del `body` cuando el drawer esta abierto.
- Se agrego cierre por `Escape`.
- Se ajusto el `z-index` para que el drawer quede por encima del overlay del SCADA.

Funciones/componentes usados:

- `CloseIcon()`
- `LagoonsView()`

## 2. Top bar

Archivo:

- `src/components/TopBar.tsx`

Cambios:

- Rediseño completo de la barra superior.
- Nuevo look glass / white-cyan.
- Se cambio el titulo principal a `CRYSTAL LAGOONS`.
- Se mantuvo campo de busqueda solo en resoluciones medianas o superiores.
- Se mantuvo boton de configuracion.
- En movil muestra boton hamburguesa.

Funciones:

- `HamburgerIcon()`
- `GearIcon()`
- `TopBar({ onMenuToggle, isMenuOpen })`

## 3. Sidebar

Archivo:

- `src/components/Sidebar.tsx`

Cambios:

- Rediseño del panel lateral con degradado suave celeste/blanco.
- Se mejoro el estado visual del item activo.
- Se agrego soporte para cierre del drawer movil al navegar.
- Se redujo el radio general en la ultima iteracion para evitar exceso de redondeo.

Funcion:

- `Sidebar({ onNavigate, className })`

## 4. Sistema visual global

Archivo:

- `src/index.css`

Cambios:

- Se definio una capa visual global con variables CSS para color, sombras y superficies.
- Se agrego fondo atmosferico general del dashboard.
- Se agregaron clases reutilizables:
  - `.lagoon-topbar`
  - `.lagoon-sidebar`
  - `.lagoon-panel`
  - `.lagoon-map-shell`
  - `.lagoon-map-frame`
  - `.lagoon-glow`
- Se mantuvo `.scada-stage svg` para asegurar escalado correcto del SVG.

## 5. Registro de SVGs

Archivo:

- `src/scada/svgRegistry.ts`

Cambios:

- El registro paso de mapear solo componente a mapear:
  - `component`
  - `aspectRatio`
- Esto permite renderizar cada layout con su proporcion real.

Tipo agregado:

- `SvgRegistryEntry`

## 6. Datos de lagunas

Archivo:

- `src/data/lagoons.ts`

Cambios:

- Se amplio la interfaz local de lagunas.
- Se agrego `layout`.
- Se agrego `country`.
- El encabezado del SCADA ahora toma el pais desde esta configuracion.

Tipo actual:

```ts
export interface LagoonInfo {
  id: string;
  name: string;
  layout: string;
  country: string;
}
```

Configuracion actual:

- `Costa del Lago` -> `Paraguay`
- `AVA Lagoons` -> `Mexico`
- `Santa Rosalia` -> `Espana`

## 7. Bloque del plano SCADA

Archivo:

- `src/components/lagoon/ScadaMapPanel.tsx`

Cambios:

- Se creo un componente dedicado para el bloque del plano.
- El nombre de la laguna se integro dentro del mismo panel del SCADA.
- Sobre el nombre se muestra el pais.
- Se agrego una linea gris divisoria entre encabezado y plano.
- Se elimino la tarjeta separada externa para el nombre de la laguna.
- El encabezado final quedo plano y sin sombra, para parecer parte del mismo plano.
- Se elimino la funcionalidad de pantalla completa en nueva ventana.
- El contenedor del plano se armonizo con el resto de paneles del dashboard.
- Se agregaron halos visuales suaves (`lagoon-glow`) para reforzar la identidad.

Funcion:

- `ScadaMapPanel({ heading, title, layout, tags, plcStatus, localTime, timezone, SvgComponent, aspectRatio })`

## 8. Overlay del SCADA

Archivo:

- `src/containers/ScadaOverlay.tsx`

Cambios:

- Los KPIs normales quedaron planos:
  - sin fondo,
  - sin capsulas,
  - solo valor y unidad.
- El overlay del PLC y reloj se mantuvo como tarjeta destacada.
- El overlay de reloj tiene:
  - fondo blanco,
  - borde suave,
  - sombra,
  - mejor jerarquia visual.
- Se mejoro la legibilidad del texto sobre el SVG con `textShadow`.

Funcion:

- `ScadaOverlay({ layout, tags, plc_status, local_time, timezone })`

## 9. Contenedor principal de laguna

Archivo:

- `src/components/lagoonContainer.tsx`

Cambios:

- Se reorganizo la composicion principal del dashboard de laguna.
- Se movio el encabezado de laguna dentro del `ScadaMapPanel`.
- Se mantuvo la carga dinamica del JSON de layout.
- Se mantuvo la resolucion dinamica del SVG usando `svgRegistry`.
- Se separaron visualmente las secciones:
  - plano SCADA,
  - estado de bombas,
  - historico.

Helpers y funciones internas:

- `getViewByDays(days)`
- `daysBetween(a, b)`
- `isPlottableTag(tagKey)`
- `extractEventTimestamp(value)`
- `normalizePumpEvents(value)`
- `sortPumpEventsByDate(events)`
- `normalizePumpState(value)`

Subcomponentes internos:

- `PumpStatusSection`
- `HistorySection`

Componente principal:

- `LagoonContainer({ lagoonId })`

## 10. Estado de bombas

Archivo:

- `src/components/lagoon/PumpStatusKpi.tsx`

Cambios:

- Se mantuvo la estructura funcional de estado y eventos.
- Se integro visualmente al nuevo sistema de superficies blancas.
- Tarjetas por bomba con colores por estado.
- Se siguen mostrando los ultimos 3 eventos por bomba.

Helpers:

- `formatPumpTime(iso, timezone)`
- `getTopEvents(events)`
- `toTitleCaseFromTag(raw)`
- `getDisplayPumpName(pumpLabel, event)`
- `getStateConfig(state)`

Componente:

- `PumpStatusKpi({ pumps, timezone, eventsLoading, eventsError, eventsEmpty })`

## 11. Historico y grafico

Archivos:

- `src/components/lagoonContainer.tsx`
- `src/components/charts/LagoonLineChart.tsx`

Cambios:

- El bloque de historico se adapto al mismo lenguaje visual del SCADA.
- Los botones de rango rapido fueron actualizados visualmente.
- El chart ahora aprovecha mejor la altura del contenedor.
- Se usa `height: "100%"` para el grafico.

Helpers en `LagoonLineChart.tsx`:

- `isPlottableTag(tagKey)`
- `daysBetween(a, b)`
- `getViewByDays(days)`
- `normalizeDayUtc(ts)`
- `normalizeWeekUtc(ts)`
- `normalizeByView(ts, view)`

Componente:

- `LagoonLineChart({ data, loading, visibleStart, visibleEnd, onRangeChange, selectedTags, timezone })`

## 12. Elementos eliminados o simplificados

Se eliminaron o simplificaron los siguientes elementos:

- pantalla completa en nueva ventana para el SCADA,
- encabezado duplicado de laguna fuera del panel del plano,
- sidebar siempre visible en dispositivos pequenos,
- capsulas para overlays numericos,
- exceso de bordes redondeados en la ultima iteracion.

## 13. Logica de negocio mantenida

Se mantuvo intacta la logica funcional de:

- `useScadaRealtime`
- `useHistory`
- `usePumpEventsLast3`
- carga de historicos,
- lectura de tags realtime,
- normalizacion de estados de bombas,
- carga de layouts JSON,
- mapeo de SVGs,
- filtros de historico.

## 14. Validacion realizada

Se valido repetidamente con:

```bash
npm run build
```

Resultado:

- compilacion correcta,
- sin errores funcionales derivados de la capa visual,
- permanece solo la advertencia de bundle grande de Vite, sin impacto en esta implementacion.

## Archivos principales modificados

- `src/pages/lagoonsView.tsx`
- `src/components/TopBar.tsx`
- `src/components/Sidebar.tsx`
- `src/components/lagoonContainer.tsx`
- `src/components/lagoon/ScadaMapPanel.tsx`
- `src/containers/ScadaOverlay.tsx`
- `src/components/lagoon/PumpStatusKpi.tsx`
- `src/components/charts/LagoonLineChart.tsx`
- `src/scada/svgRegistry.ts`
- `src/data/lagoons.ts`
- `src/index.css`

## Conclusiones

El resultado final deja un dashboard SCADA:

- responsive,
- mas limpio,
- visualmente consistente,
- mejor integrado con el contexto de monitoreo de lagunas,
- sin alterar la logica de negocio existente.
