# Contratos API consumidos por el frontend

Este documento lista las rutas realmente usadas por el frontend actual.

## Convencion de URL

Desde el browser, el frontend llama normalmente a rutas bajo `/api/*`.

Ejemplos:

- frontend: `/api/lagoons`
- backend real detras del proxy: `/lagoons`

## Autenticacion

Ruta:

- `POST /api/auth/login`

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
    "roles": ["AdminCrystal"]
  }
}
```

## Lagunas

Ruta:

- `GET /api/lagoons`

Payload compatible:

```json
[
  {
    "lagoon_id": "costa_del_lago",
    "lagoon_name": "Costa del Lago",
    "scada_layout": "layout2",
    "timezone": "America/Santiago",
    "product_type": "crystal",
    "enable": true,
    "can_view": true,
    "can_edit": false,
    "can_control": true
  }
]
```

## Layout SCADA

### 1) Mapping por laguna

Ruta:

- `GET /api/lagoons/{lagoon_id}/mapping`

Response esperada:

```json
{
  "lagoon_id": "costa_del_lago",
  "layout_id": "layout2",
  "mapping_json": {
    "pressure_1": {
      "tag": "PT112_R_SCADA",
      "label": "PT_112"
    }
  },
  "collector_tags": ["PT112_R_SCADA", "P005_STS_SCADA"],
  "warnings": [],
  "updated_at": "2026-04-17T10:00:00Z"
}
```

### 2) Layout base

Ruta:

- `GET /api/layouts/{layout_id}`

Response esperada:

```json
{
  "id": "layout2",
  "name": "Crystal Layout 2",
  "json_definition": {
    "plant": "LAYOUT2 - SCADA",
    "svg_component": "layout2",
    "aspect_ratio": "1429.5 / 960",
    "elements": [
      {
        "id": "pressure_1",
        "type": "kpi",
        "fallback_tag": "PT117_R_SCADA",
        "default_label": "PT117_R_SCADA",
        "position": { "left": "21.3%", "top": "40.3%" }
      }
    ]
  }
}
```

## Realtime SCADA

Ruta:

- `WS /ws/scada/{lagoon_id}`

Autenticacion soportada por el frontend:

- query string `?token=<jwt>`
- subprotocol `crystal-scada.v1` + `bearer.<jwt>`

Payload esperado:

```json
{
  "type": "tick",
  "lagoon_id": "costa_del_lago",
  "tags": { "PT117_R_SCADA": 2.31 },
  "pump_last_on": {},
  "ts": "2026-04-17T14:20:00Z",
  "plc_status": "online",
  "local_time": "10:20:00",
  "timezone": "America/Santiago",
  "scada_layout": "layout2"
}
```

El frontend tambien ignora mensajes:

```json
{ "type": "ping" }
```

## Historico

Ruta:

- `GET /api/scada/{lagoon_id}/history`

Query:

- `start_date`
- `end_date`
- `resolution=hourly|daily|weekly`
- `tags[]`

Response compatible:

```json
{
  "lagoon_id": "costa_del_lago",
  "resolution": "hourly",
  "source": "table",
  "series": [
    {
      "tag": "PT117_R_SCADA",
      "points": [
        { "timestamp": "2026-04-17T12:00:00Z", "value": 2.34 }
      ]
    }
  ]
}
```

Las series aceptan cualquiera de estos identificadores:

- `tag`
- `tag_key`
- `name`

## Eventos de bombas

Ruta:

- `GET /api/scada/{lagoon_id}/pump-events/last-3`

Response esperada:

```json
{
  "lagoon_id": "costa_del_lago",
  "events": [
    {
      "lagoon_id": "costa_del_lago",
      "tag_id": "P002_STS_SCADA",
      "tag_label": "Bomba Retrolavado",
      "start_local": "2026-04-17T12:49:45.964664"
    }
  ]
}
```

## Alarmas PT/FIT

Lectura:

- `GET /api/alarms/{lagoon_id}/thresholds/pt-fit/view`

Escritura:

- `PUT /api/alarms/{lagoon_id}/thresholds/pt-fit`

Request de guardado:

```json
{
  "items": [
    {
      "tag_id": "PT117_R_SCADA",
      "min_value": 1.2,
      "max_value": 3.5,
      "severity": "warning",
      "enabled": true
    }
  ]
}
```

## Manejo de errores esperado

- `401/403`: cortar la accion y mostrar error de permisos o sesion
- `404` en mapping/layout/history: mostrar estado vacio o mensaje no bloqueante
- fallo WebSocket: seguir mostrando layout y datos vacios luego de la gracia inicial
- `422` en alarmas PT/FIT: reflejar error de validacion en el modal
