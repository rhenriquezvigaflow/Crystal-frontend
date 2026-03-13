# Arquitectura Frontend SCADA

Ultima actualizacion: 2026-03-13

## 1) Panorama general

El frontend esta dividido en capas claras:

1. `pages` y `components` para composicion de UI.
2. `hooks` para estado remoto y orquestacion de datos.
3. `api` para acceso HTTP tipado con `axios`.
4. `auth` y `lagoons` para contexto global de sesion y permisos.
5. `layouts` + `svg` para desacoplar presentacion SCADA por planta.

## 2) Diagrama de alto nivel

```text
Browser
  -> App.tsx
    -> BrowserRouter
      -> AuthProvider
        -> LagoonsProvider
          -> Routes
             /login                -> LoginPage
             /dashboard            -> ProtectedRoute -> DashboardRedirect
             /lagoon/:lagoonId     -> ProtectedRoute -> LagoonsView
                                         -> TopBar + Sidebar + LagoonContainer
```

## 3) Routing y providers

- `AuthProvider`:
  - restaura sesion desde `localStorage`.
  - valida JWT (`isTokenValid`).
  - expone `login/logout/isAuthenticated`.
- `LagoonsProvider`:
  - obtiene lagunas desde `GET /lagoons`.
  - filtra por `can_view`.
  - aplica allowlist de nombres visibles en UI.
- `ProtectedRoute`:
  - redirige a `/login` si no hay sesion valida.
- `DashboardRedirect`:
  - redirige a la primera laguna disponible.
- `App.tsx`:
  - aplica auto refresh cada 30 minutos.

## 4) Flujos de datos

### 4.1 Realtime

- Hook: `src/hooks/useScadaRealtime.ts`
- Transporte: WebSocket
- Ruta: `/ws/scada/{lagoonId}?token={accessToken}`
- Payload consumido:
  - `tags`
  - `pump_last_on`
  - `ts`
  - `plc_status`
  - `local_time`
  - `timezone`

### 4.2 Historico

- Hook: `src/hooks/useHistory.ts`
- API: `src/api/scadaHistory.ts`
- Endpoint usado hoy: `GET /scada/history/hourly`
- `view` (`hourly|daily|weekly`) se calcula en frontend segun rango visible.
- `LagoonLineChart`:
  - alinea series por timeline comun.
  - formatea fechas en timezone de laguna.
  - devuelve nuevo rango al hacer zoom.

### 4.3 Eventos de bombas

- Hook: `src/hooks/usePumpEventsLast3.ts`
- API: `src/api/scadaPumpEvents.ts`
- Endpoint: `GET /scada/{lagoon_id}/pump-events/last-3`
- Integracion:
  - `LagoonContainer` agrupa por `tag_id`.
  - `PumpStatusKpi` muestra hasta 3 eventos por bomba.
  - si falla endpoint, usa fallback con `pump_last_on` realtime.

## 5) Pipeline de layout + SVG

1. El backend entrega `lagoon.scada_layout`.
2. `LagoonContainer` resuelve alias (`layout_small -> layout3`).
3. Carga dinamicamente JSON:
   - `src/layouts/crystal-${layout}.layout.json`
4. Resuelve SVG desde `src/scada/svgRegistry.ts`:
   - componente React.
   - `aspectRatio` para el contenedor.
5. `ScadaMapPanel` renderiza:
   - SVG base.
   - `ScadaOverlay` (KPIs y caja PLC).

## 6) Responsabilidades de cada bloque visual

- `LagoonsView`:
  - shell responsive.
  - drawer movil para sidebar.
- `ScadaMapPanel`:
  - encabezado de laguna.
  - marco del plano SCADA.
  - aplica `canControl` para ocultar controles cuando corresponde.
- `ScadaOverlay`:
  - dibuja elementos de `layout.kpis`.
  - soporta tipos `kpi` y `plc_status`.
- `PumpStatusKpi`:
  - estado por bomba.
  - eventos recientes por tarjeta.
- `LagoonLineChart`:
  - historico multi serie por TAG.

## 7) Modelo de permisos (RBAC en UI)

- `can_view`:
  - controla acceso de laguna en sidebar y routing.
- `can_edit`:
  - habilita/deshabilita affordances de edicion en topbar.
- `can_control`:
  - si es `false`, se ocultan controles visuales en el SVG.
  - se muestra mensaje: "Controles de bombas ocultos por permisos RBAC."

## 8) Configuracion y errores

- HTTP y WS base: `src/config/api.ts`.
- Cliente HTTP: `src/api/httpClient.ts` con interceptor de token.
- Errores API se envuelven en `ApiError` con `status` y `message`.
- Mensajes de 403 se tratan de forma explicita en login, lagunas e historico/eventos.

## 9) Riesgos y deuda tecnica

1. Uso de `any` en varios modulos de layout y contenedores.
2. Inconsistencia entre tipos `crystal-lagoons.types.ts` y layout JSON real (`plc_status`, `pumps` no estan tipados ahi).
3. Hay texto legacy con encoding irregular en algunos mensajes de UI.
4. Algunos SVG siguen en formato exportado extenso, con ruido de metadatos.
