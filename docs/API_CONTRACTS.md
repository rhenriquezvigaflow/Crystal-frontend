# Contratos API consumidos por el frontend SCADA

Ultima actualizacion: 2026-03-13

## Base URL y autenticacion

- Configuracion central: `src/config/api.ts`
- `API_HTTP`:
  - usa `VITE_API_HTTP` o `VITE_API_BASE_URL` si existen.
  - fallback actual: `http://192.168.1.22:8000`
- `API_WS`:
  - usa `VITE_API_WS` si existe.
  - si no existe, se deriva desde `API_HTTP` (`http -> ws`).
- Token:
  - se guarda en `localStorage` (`token` y `crystal_auth_v1`).
  - para HTTP se inyecta via interceptor (`Authorization: Bearer <token>`).
  - para WS se envia como query param `token`.

## 1) Autenticacion

- Metodo: `POST`
- Ruta: `/auth/login`
- Consumidor: `authApi.login`

Request:

```json
{
  "email": "user@domain.com",
  "password": "secret"
}
```

Response esperada:

```json
{
  "access_token": "jwt",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@domain.com",
    "role": "ADMIN"
  }
}
```

## 2) Lagunas disponibles (RBAC)

- Metodo: `GET`
- Ruta: `/lagoons`
- Consumidor: `fetchLagoons` (`src/api/lagoonsApi.ts`)

El frontend soporta dos formatos de payload:

```json
[
  {
    "lagoon_id": "ava_lagoons",
    "lagoon_name": "AVA Lagoons",
    "scada_layout": "layout2",
    "timezone": "America/Santiago",
    "ip": "10.0.0.2",
    "can_view": true,
    "can_edit": false,
    "can_control": true
  }
]
```

o:

```json
{
  "lagoons": [
    {
      "lagoon_id": "ava_lagoons",
      "lagoon_name": "AVA Lagoons",
      "scada_layout": "layout2",
      "can_view": true,
      "can_edit": false,
      "can_control": true
    }
  ]
}
```

Notas:

- `can_view`, `can_edit`, `can_control` se normalizan a boolean.
- si `scada_layout` no viene, fallback a `layout1`.
- luego se filtra por `can_view` y por una allowlist de nombres conocida en frontend.

## 3) Realtime SCADA

- Metodo: `WS`
- Ruta: `/ws/scada/{lagoonId}?token={accessToken}`
- Consumidor: `useScadaRealtime`

Campos esperados del mensaje:

- `tags: Record<string, unknown>`
- `pump_last_on?: Record<string, unknown>`
- `ts?: string`
- `plc_status?: "online" | "offline"`
- `local_time?: string`
- `timezone?: string`

## 4) Historico

- Metodo: `GET`
- Ruta usada hoy: `/scada/history/hourly`
- Consumidor: `useHistory` -> `fetchHistory`

Query params:

- `lagoon_id: string`
- `start_date: string` (ISO)
- `end_date: string` (ISO)
- `tags: string[]` (serializacion repetida: `?tags=a&tags=b`)
- `view?: "hourly" | "daily" | "weekly"`

Importante:

- El frontend calcula `view` segun rango visible.
- Actualmente `fetchHistory` siempre resuelve al endpoint hourly (daily/weekly aun no tienen endpoint dedicado en el cliente).

Shape de respuesta compatible:

```json
{
  "series": [
    {
      "tag_key": "PT117_R_SCADA",
      "name": "PT117_R_SCADA",
      "points": [
        {
          "timestamp": "2026-03-13T12:00:00Z",
          "value": 2.34
        }
      ]
    }
  ],
  "timezone": "America/Santiago"
}
```

## 5) Eventos de bombas (ultimos 3)

- Metodo: `GET`
- Ruta: `/scada/{lagoon_id}/pump-events/last-3`
- Consumidor: `usePumpEventsLast3` -> `fetchPumpEventsLast3`

Response:

```json
{
  "lagoon_id": "costa_del_lago",
  "events": [
    {
      "lagoon_id": "costa_del_lago",
      "tag_id": "P002_STS_SCADA",
      "tag_label": "Bomba Retrolavado",
      "start_local": "2026-03-13T12:49:45.964664"
    }
  ]
}
```

## Manejo de errores y degradacion

- HTTP:
  - errores se normalizan a `ApiError(status, message)`.
  - `401` tipico: credenciales invalidas.
  - `403` tipico: acceso no permitido.
- WS:
  - errores de parseo o desconexion se registran en consola, sin derribar la UI.
- Pump events:
  - si falla `/pump-events/last-3`, la UI degrada usando `pump_last_on` realtime.
- Historico:
  - si falla, se muestra mensaje en seccion de chart sin bloquear mapa o estado de bombas.
