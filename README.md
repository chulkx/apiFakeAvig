# apiFakeAvig

Fake Avigilon webhook sender para testear el `parking-disponibility-service - Taquillas-Service` sin necesitar una instalación real de Avigilon.

Simula el comportamiento de Avigilon enviando payloads autenticados con HMAC-SHA256 al endpoint `POST /webhook` del servicio real.

---

## Requisitos

- Node.js 18+
- npm

---

## Instalación

```bash
npm install
cp .env.example .env
```

Editar `.env`:

```env
TARGET_URL=http://localhost:3000/webhook   # endpoint del parking-disponibility-service
AVIGILON_TOKEN=<base64>                    # mismo valor que AVIGILON_WEBHOOK_TOKEN en el servicio real
PORT=4000
```

Para generar un token compatible:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

---

## Uso

```bash
# Desarrollo (hot reload)
npm run dev

# Producción
npm run build && npm start
```

---

## Endpoints

### Envío manual

| Método  | Ruta              | Descripción                                  |
| ------- | ----------------- | -------------------------------------------- |
| `POST`  | `/event`          | Envía un evento NOTIFICATION único           |
| `POST`  | `/batch`          | Envía múltiples eventos en un NOTIFICATION   |
| `POST`  | `/hello`          | Envía mensaje HELLO (handshake)              |
| `POST`  | `/heartbeat`      | Envía mensaje HEARTBEAT (keep-alive)         |
| `GET`   | `/status`         | Muestra configuración actual                 |

### Simulación automática

| Método  | Ruta                | Descripción                              |
| ------- | ------------------- | ---------------------------------------- |
| `POST`  | `/simulate/start`   | Arranca el envío periódico               |
| `POST`  | `/simulate/stop`    | Para el envío                            |
| `GET`   | `/simulate/status`  | Estado + contadores                      |
| `POST`  | `/simulate/reload`  | Recarga `scenarios.json` sin parar       |

---

## Catálogo de escenarios

Editar `scenarios.json` en la raíz del proyecto para definir los eventos y cámaras a simular:

```json
[
  {
    "analyticEventName": "EMB_E_1-2-3_N2",
    "cameraId": "cam-001",
    "weight": 3,
    "description": "Embotellamiento entrada vías 1-2-3 nivel 2"
  },
  {
    "analyticEventName": "VEHICLE_ENTER",
    "cameraId": "cam-004",
    "weight": 5,
    "description": "Vehículo entrando"
  }
]
```

El campo `weight` controla la frecuencia relativa en modo aleatorio. Un evento con `weight: 5` se dispara ~5 veces más que uno con `weight: 1`. Es opcional (por defecto `1`).

También se puede apuntar a un archivo diferente pasando `scenariosFile` en el body de `/simulate/start` o `/simulate/reload`.

---

## Modos de simulación

| Modo | Descripción |
|------|-------------|
| `random` | Elige un evento al azar del catálogo en cada tick, respetando los pesos |
| `sequential` | Recorre el catálogo en orden, uno por tick, en loop |
| `burst` | Envía todos los eventos del catálogo de golpe en cada tick |

---

## Ejemplos

### Envío manual

```bash
# Evento único
curl -X POST http://localhost:4000/event \
  -H "Content-Type: application/json" \
  -d '{"analyticEventName": "EMB_E_1-2-3_N2", "cameraId": "cam-001"}'

# Con timestamp específico
curl -X POST http://localhost:4000/event \
  -H "Content-Type: application/json" \
  -d '{"analyticEventName": "VEHICLE_ENTER", "cameraId": "cam-004", "timestamp": "2024-01-15T10:30:00.000Z"}'

# Batch
curl -X POST http://localhost:4000/batch \
  -H "Content-Type: application/json" \
  -d '{"events": [{"analyticEventName": "EMB_E_1-2-3_N2", "cameraId": "cam-001"}, {"analyticEventName": "VEHICLE_EXIT", "cameraId": "cam-005"}]}'

# HELLO / HEARTBEAT
curl -X POST http://localhost:4000/hello
curl -X POST http://localhost:4000/heartbeat
```

### Simulación automática

```bash
# Arrancar en modo aleatorio cada 5 segundos
curl -X POST http://localhost:4000/simulate/start \
  -H "Content-Type: application/json" \
  -d '{"intervalMs": 5000, "mode": "random"}'

# Arrancar en modo secuencial cada 2 segundos
curl -X POST http://localhost:4000/simulate/start \
  -H "Content-Type: application/json" \
  -d '{"intervalMs": 2000, "mode": "sequential"}'

# Burst: todos los eventos de golpe cada 10 segundos
curl -X POST http://localhost:4000/simulate/start \
  -H "Content-Type: application/json" \
  -d '{"intervalMs": 10000, "mode": "burst"}'

# Ver estado
curl http://localhost:4000/simulate/status

# Recargar escenarios en caliente
curl -X POST http://localhost:4000/simulate/reload

# Parar
curl -X POST http://localhost:4000/simulate/stop
```

---

## Estructura del proyecto

```
apiFakeAvig/
├── src/
│   ├── server.ts           # Entry point
│   ├── app.ts              # Express app
│   ├── config.ts           # Variables de entorno
│   ├── signer.ts           # HMAC-SHA256 (firma de requests)
│   ├── sender.ts           # Serializa, firma y envía al target
│   ├── payloads.ts         # Constructores de payloads Avigilon
│   ├── simulator.ts        # Scheduler + modos random/sequential/burst
│   └── routes/
│       ├── event.ts        # POST /event
│       ├── batch.ts        # POST /batch
│       ├── hello.ts        # POST /hello
│       ├── heartbeat.ts    # POST /heartbeat
│       ├── status.ts       # GET /status
│       └── simulate.ts     # /simulate/*
├── scenarios.json          # Catálogo de eventos y cámaras
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Autenticación

El servicio real verifica cada request con HMAC-SHA256:

```
Authorization = Base64( HMAC-SHA256( rawBodyString, Buffer.from(AVIGILON_TOKEN, 'base64') ) )
```

`AVIGILON_TOKEN` debe ser el mismo valor que `AVIGILON_WEBHOOK_TOKEN` configurado en el `parking-disponibility-service`. Si el servicio real responde con `401`, verificar que ambos tokens coincidan.
