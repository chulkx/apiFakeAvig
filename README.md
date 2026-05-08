# apiFakeAvig

Fake Avigilon webhook sender para testear `parking-disponibility-service - Taquillas-Service` sin necesitar una instalacion real de Avigilon.

Simula el comportamiento de Avigilon enviando payloads autenticados con HMAC-SHA256 al endpoint `POST /webhook` del servicio real.

---

## Requisitos

- Node.js 18+
- npm

---

## Instalacion

```bash
npm install
cp .env.example .env
```

Editar `.env`:

```env
TARGET_URL=http://localhost:3000/webhook
AVIGILON_TOKEN=<base64>
PORT=4000
```

- `TARGET_URL`: endpoint del `parking-disponibility-service`
- `AVIGILON_TOKEN`: mismo valor que `AVIGILON_WEBHOOK_TOKEN` en el servicio real

Para generar un token compatible:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

---

## Uso

```bash
# Desarrollo
npm run dev

# Produccion
npm run build
npm start
```

---

## Endpoints

### Envio manual

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `POST` | `/event` | Envia un evento `NOTIFICATION` unico |
| `POST` | `/batch` | Envia multiples eventos en un `NOTIFICATION` |
| `POST` | `/hello` | Envia mensaje `HELLO` |
| `POST` | `/heartbeat` | Envia mensaje `HEARTBEAT` |
| `GET` | `/status` | Muestra configuracion actual |

### Simulacion automatica

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `POST` | `/simulate/start` | Arranca el envio periodico |
| `POST` | `/simulate/stop` | Detiene el envio |
| `GET` | `/simulate/status` | Muestra estado y contadores |
| `POST` | `/simulate/reload` | Recarga el archivo de escenarios sin reiniciar |

---

## Payloads soportados

El simulador exige `analyticEventName` y `cameraId` como campos minimos del evento.

Fuera de esos campos obligatorios, ahora preserva cualquier propiedad adicional incluida en el body o en los escenarios. Esto permite representar eventos reales de Avigilon sin recortar campos como:

- `classifiedObjects`
- `activity`
- `eventTriggerTime`
- `originatingServerName`
- `originatingServerId`
- `location`
- `area`
- `targetIdsDeprecated`
- `cameraIds`
- `entityIds`

Si `id` o `timestamp` no vienen informados, el sistema los completa automaticamente antes de firmar y enviar el webhook.

Ejemplo de evento realista:

```json
{
  "analyticEventName": "EMB_S_8_N1",
  "cameraId": "4xIx1DMwMLSwMDVNS0u0MNNLTsw1MBAS6JjWED_J3SV2YkCfFIe4dQEA",
  "activity": "OBJECT_PRESENT",
  "eventTriggerTime": "2026-05-08T15:55:38.428Z",
  "timestamp": "2026-05-08T15:47:03.416Z",
  "type": "DEVICE_ANALYTICS_START",
  "thisId": "11352980",
  "linkedEventId": "-1",
  "originatingEventId": "11352980",
  "originatingServerName": "EZE11",
  "originatingServerId": "iJaAX5JHRF2RUI4aCBc7cA",
  "location": "EGRESO TAQUILLA",
  "area": "",
  "targetIdsDeprecated": [],
  "cameraIds": [],
  "entityIds": [],
  "classifiedObjects": [
    {
      "subclass": "VEHICLE_BUS",
      "objectId": 24516879
    }
  ]
}
```

---

## Catalogo de escenarios

Por defecto el simulador arranca leyendo `scenarios_embotellamiento_1_Via.json`. Tambien se puede indicar otro archivo con `scenariosFile` en `/simulate/start` o `/simulate/reload`.

Ejemplo:

```json
[
  {
    "analyticEventName": "EMB_E_1-2-3_N2",
    "cameraId": "cam-001",
    "weight": 3,
    "description": "Embotellamiento entrada vias 1-2-3 nivel 2"
  },
  {
    "analyticEventName": "EMB_S_8_N1",
    "cameraId": "4xIx1DMwMLSwMDVNS0u0MNNLTsw1MBAS6JjWED_J3SV2YkCfFIe4dQEA",
    "activity": "OBJECT_PRESENT",
    "eventTriggerTime": "2026-05-08T15:55:38.428Z",
    "type": "DEVICE_ANALYTICS_START",
    "location": "EGRESO TAQUILLA",
    "classifiedObjects": [
      {
        "subclass": "VEHICLE_BUS",
        "objectId": 24516879
      }
    ],
    "weight": 5,
    "description": "Evento de analytics completo"
  }
]
```

`weight` controla la frecuencia relativa en modo aleatorio. Si no se informa, vale `1`.

---

## Modos de simulacion

| Modo | Descripcion |
| --- | --- |
| `random` | Elige un evento al azar respetando `weight` |
| `sequential` | Recorre el catalogo en orden y vuelve al inicio |
| `burst` | Envia todos los eventos del catalogo en cada tick |

---

## Ejemplos

### Envio manual

```bash
# Evento unico minimo
curl -X POST http://localhost:4000/event \
  -H "Content-Type: application/json" \
  -d '{"analyticEventName":"EMB_E_1-2-3_N2","cameraId":"cam-001"}'

# Evento con timestamp especifico
curl -X POST http://localhost:4000/event \
  -H "Content-Type: application/json" \
  -d '{"analyticEventName":"VEHICLE_ENTER","cameraId":"cam-004","timestamp":"2024-01-15T10:30:00.000Z"}'

# Evento completo de analytics
curl -X POST http://localhost:4000/event \
  -H "Content-Type: application/json" \
  -d '{"analyticEventName":"EMB_S_8_N1","cameraId":"4xIx1DMwMLSwMDVNS0u0MNNLTsw1MBAS6JjWED_J3SV2YkCfFIe4dQEA","activity":"OBJECT_PRESENT","eventTriggerTime":"2026-05-08T15:55:38.428Z","timestamp":"2026-05-08T15:47:03.416Z","type":"DEVICE_ANALYTICS_START","thisId":"11352980","linkedEventId":"-1","originatingEventId":"11352980","originatingServerName":"EZE11","originatingServerId":"iJaAX5JHRF2RUI4aCBc7cA","location":"EGRESO TAQUILLA","area":"","targetIdsDeprecated":[],"cameraIds":[],"entityIds":[],"classifiedObjects":[{"subclass":"VEHICLE_BUS","objectId":24516879}]}'

# Batch
curl -X POST http://localhost:4000/batch \
  -H "Content-Type: application/json" \
  -d '{"events":[{"analyticEventName":"EMB_E_1-2-3_N2","cameraId":"cam-001"},{"analyticEventName":"VEHICLE_EXIT","cameraId":"cam-005"}]}'

# HELLO / HEARTBEAT
curl -X POST http://localhost:4000/hello
curl -X POST http://localhost:4000/heartbeat
```

### Simulacion automatica

```bash
# Aleatorio cada 5 segundos
curl -X POST http://localhost:4000/simulate/start \
  -H "Content-Type: application/json" \
  -d '{"intervalMs":5000,"mode":"random"}'

# Secuencial cada 2 segundos
curl -X POST http://localhost:4000/simulate/start \
  -H "Content-Type: application/json" \
  -d '{"intervalMs":2000,"mode":"sequential"}'

# Burst cada 10 segundos
curl -X POST http://localhost:4000/simulate/start \
  -H "Content-Type: application/json" \
  -d '{"intervalMs":10000,"mode":"burst"}'

# Con archivo explicito de escenarios
curl -X POST http://localhost:4000/simulate/start \
  -H "Content-Type: application/json" \
  -d '{"intervalMs":5000,"mode":"random","scenariosFile":"./scenarios_embotellamiento_1_Via.json"}'

# Ver estado
curl http://localhost:4000/simulate/status

# Recargar escenarios
curl -X POST http://localhost:4000/simulate/reload \
  -H "Content-Type: application/json" \
  -d '{"scenariosFile":"./scenarios_embotellamiento_1_Via.json"}'

# Parar
curl -X POST http://localhost:4000/simulate/stop
```

---

## Estructura del proyecto

```text
apiFakeAvig/
|-- src/
|   |-- server.ts
|   |-- app.ts
|   |-- config.ts
|   |-- signer.ts
|   |-- sender.ts
|   |-- payloads.ts
|   |-- simulator.ts
|   `-- routes/
|       |-- event.ts
|       |-- batch.ts
|       |-- hello.ts
|       |-- heartbeat.ts
|       |-- status.ts
|       `-- simulate.ts
|-- scenarios_embotellamiento_1_Via.json
|-- .env.example
|-- package.json
`-- tsconfig.json
```

---

## Autenticacion

El servicio real verifica cada request con HMAC-SHA256:

```text
Authorization = Base64(HMAC-SHA256(rawBodyString, Buffer.from(AVIGILON_TOKEN, 'base64')))
```

Si el servicio real responde con `401`, verificar que `AVIGILON_TOKEN` y `AVIGILON_WEBHOOK_TOKEN` coincidan.
