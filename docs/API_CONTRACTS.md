# Contratos API Consumidos por el Frontend

Documento alineado al codigo actual del frontend.

## Convencion de URL

Desde el browser, el frontend llama normalmente a rutas bajo `/api/*`.

Ejemplos:

- frontend: `/api/lagoons`
- backend directo: `/lagoons`

La escena SCADA visual no se pide al backend: se carga desde `src/assets/positions/*.json`.

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
    "id": "1",
    "email": "user@domain.com",
    "roles": ["AdminCrystal"],
    "role": "AdminCrystal"
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
    "timezone": "America/Santiago",
    "ip": "192.168.1.10",
    "product_type": "crystal",
    "enable": true,
    "can_view": true,
    "can_edit": false,
    "can_control": true
  }
]
```

Notas:

- El frontend tambien acepta `{ "lagoons": [...] }`.
- `scada_layout`, `layout` o `layout_id` son opcionales; la escena local define el layout efectivo.
- Se descartan lagunas sin `can_view` o con `enable=false`.

## Escena SCADA Local

Fuente:

- `src/assets/positions/{lagoon_id}.json`

Campos soportados:

```json
{
  "lagoon_id": "ary",
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
      "tag": "P005_ST",
      "label": "Pump Filtro",
      "svg_target": "circle26-4",
      "panel": "pump-status"
    }
  ],
  "valves": [
    {
      "tag": "VE246_ST",
      "label": "VE-401",
      "svg_target": "VE-401"
    }
  ],
  "labels": [
    {
      "id": "valve-title-ve-401",
      "text": "VX-254",
      "position": { "top": "86%", "left": "16.5%" }
    }
  ],
  "plc_status": {
    "position": { "top": "12%", "left": "14%" }
  }
}
```

Tambien se acepta una forma con `elements[]` y `mapping_json`, pero el uso actual en el repo es el formato plano con `kpis`, `pumps`, `valves`, `labels` y `plc_status`.

## Realtime SCADA

Ruta:

- `WS /ws/scada/{lagoon_id}`

Autenticacion soportada por el frontend:

- query string `?token=<jwt>`
- fallback por subprotocol `crystal-scada.v1` + `bearer.<jwt>`

Payload esperado:

```json
{
  "type": "tick",
  "lagoon_id": "costa_del_lago",
  "tags": { "PT117_R_SCADA": 2.31 },
  "pump_last_on": {},
  "ts": "2026-04-27T14:20:00Z",
  "plc_status": "online",
  "local_time": "10:20:00",
  "timezone": "America/Santiago"
}
```

El frontend ignora:

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
- `tags`

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
        { "timestamp": "2026-04-27T12:00:00Z", "value": 2.34 }
      ]
    }
  ]
}
```

Las series aceptan cualquiera de estos identificadores:

- `tag`
- `tag_key`
- `name`

## Eventos de Pumps

Lectura:

- `GET /api/scada/{lagoon_id}/pump-events/last-3`

Descarga:

- `GET /api/scada/{lagoon_id}/pump-events/report.xlsx`

Response esperada:

```json
{
  "lagoon_id": "costa_del_lago",
  "events": [
    {
      "lagoon_id": "costa_del_lago",
      "tag_id": "P002_STS_SCADA",
      "tag_label": "Pump Retrolavado",
      "start_local": "2026-04-27T12:49:45.964664"
    }
  ]
}
```

## Alarmas PT/FIT

Lectura:

- `GET /api/alarms/{lagoon_id}/thresholds/pt-fit/view`

Escritura:

- `PUT /api/alarms/{lagoon_id}/thresholds/pt-fit`

Request:

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

## Manejo de Errores Esperado

- `401/403`: cortar accion y mostrar error de permisos o sesion.
- `404` en historico o eventos: mostrar estado vacio no bloqueante.
- escena local ausente: mostrar error de configuracion SCADA.
- fallo WebSocket: seguir mostrando layout y datos vacios luego de la gracia inicial.
- `422` en alarmas PT/FIT: reflejar error de validacion en el modal.
