# Contratos API consumidos por el frontend

## Base URLs

- Realtime/HTTP SCADA: `src/config/api.ts`
- Auth: `src/auth/authApi.ts`

## 1) Realtime SCADA

- Metodo: `WS`
- Ruta: `/ws/scada?lagoon_id={lagoonId}`
- Consumidor: `useScadaRealtime`
- Campos esperados:
  - `tags: Record<string, unknown>`
  - `pump_last_on?: Record<string, unknown>`
  - `plc_status?: "online" | "offline"`
  - `local_time?: string`
  - `timezone?: string`

## 2) Historico

- Metodo: `GET`
- Ruta: `/scada/history/hourly`
- Consumidor: `useHistory` -> `fetchHistory`
- Query params:
  - `lagoon_id: string`
  - `start_date: string (ISO)`
  - `end_date: string (ISO)`
  - `tags: string[]`
  - `view?: "hourly" | "daily" | "weekly"`

## 3) Eventos de bombas (ultimos 3)

- Metodo: `GET`
- Ruta: `/scada/{lagoon_id}/pump-events/last-3`
- Consumidor: `usePumpEventsLast3` -> `fetchPumpEventsLast3`
- Respuesta:

```json
{
  "lagoon_id": "costa_del_lago",
  "events": [
    {
      "lagoon_id": "costa_del_lago",
      "tag_id": "P002_STS_SCADA",
      "tag_label": "P002_STS_SCADA",
      "start_local": "2026-02-25T14:49:45.964664"
    }
  ]
}
```

## 4) Login

- Metodo: `POST`
- Ruta: `/auth/login`
- Consumidor: `authApi.login`
- Request:

```json
{
  "email": "user@domain.com",
  "password": "secret"
}
```

- Response:

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

## Reglas de resiliencia usadas hoy

1. Eventos bomba:
   - Si el endpoint `last-3` falla, la UI puede degradar usando `pump_last_on` realtime.

2. Historico:
   - En error muestra mensaje, no bloquea el resto del dashboard.

3. Realtime:
   - Errores de parseo/ws se loguean y no derriban la UI.
