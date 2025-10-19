# API de Comunicación PeerJS

Documentación del protocolo de mensajes entre Presentador y Jugadores en GIFTPlay.

## Arquitectura

GIFTPlay utiliza **PeerJS** (basado en WebRTC) para comunicación P2P sin servidor backend centralizado.

```
┌─────────────────┐         PeerJS          ┌─────────────┐
│   PRESENTADOR   │ ◄────────────────────► │  JUGADOR 1  │
│   (Host/Server) │                         └─────────────┘
│                 │         PeerJS
│                 │ ◄────────────────────► ┌─────────────┐
│                 │                         │  JUGADOR 2  │
└─────────────────┘                         └─────────────┘
```

### Servidor PeerJS

- **Host**: `0.peerjs.com`
- **Puerto**: `443` (HTTPS)
- **STUN/TURN**: Servidores de relay.metered.ca

---

## Estructura de Mensajes

Todos los mensajes siguen el formato:

```javascript
{
    tipo: string,      // Tipo de mensaje
    payload: object    // Datos del mensaje
}
```

---

## Mensajes: Jugador → Presentador

### `join`

Solicitud de unirse a la partida.

**Datos:**
```javascript
{
    tipo: 'join',
    payload: {
        nombre: string  // Nombre del jugador (incluye emoji)
    }
}
```

**Ejemplo:**
```javascript
{
    tipo: 'join',
    payload: {
        nombre: '🎮 Pedro'
    }
}
```

---

### `answer`

Envío de respuesta a una pregunta.

**Datos:**
```javascript
{
    tipo: 'answer',
    payload: {
        respuesta: number | number[],  // Índice(s) de respuesta (0-based)
        tiempoRespuesta: number          // Tiempo en ms desde que se mostró la pregunta
    }
}
```

**Ejemplos:**

Respuesta única:
```javascript
{
    tipo: 'answer',
    payload: {
        respuesta: 2,           // Opción C (índice 2)
        tiempoRespuesta: 3450   // 3.45 segundos
    }
}
```

Respuesta múltiple:
```javascript
{
    tipo: 'answer',
    payload: {
        respuesta: [0, 2],      // Opciones A y C
        tiempoRespuesta: 5200
    }
}
```

---

## Mensajes: Presentador → Jugador

### `join_confirmed`

Confirmación de que el jugador se unió exitosamente.

**Datos:**
```javascript
{
    tipo: 'join_confirmed',
    payload: {
        jugadoresConectados: number  // Total de jugadores conectados
    }
}
```

---

### `game_started`

Notificación de que el juego ha comenzado.

**Datos:**
```javascript
{
    tipo: 'game_started',
    payload: {
        totalPreguntas: number  // Número total de preguntas
    }
}
```

---

### `question`

Nueva pregunta para responder.

**Datos:**
```javascript
{
    tipo: 'question',
    payload: {
        pregunta: string,           // Texto de la pregunta (Markdown + LaTeX)
        opciones: [                 // Array de opciones (solo texto, sin info de corrección)
            { texto: string },
            { texto: string },
            ...
        ],
        tipo: string,               // 'multiple-choice-single', 'multiple-choice-multiple', 'true-false'
        multimedia: string,         // HTML de multimedia (img, video, iframe) o vacío
        numeroPregunta: number,     // Número de pregunta actual (1-based)
        totalPreguntas: number,     // Total de preguntas
        tiempo: number              // Segundos para responder
    }
}
```

**Ejemplo:**
```javascript
{
    tipo: 'question',
    payload: {
        pregunta: '¿Cuál es la capital de Francia?',
        opciones: [
            { texto: 'Madrid' },
            { texto: 'París' },
            { texto: 'Roma' },
            { texto: 'Londres' }
        ],
        tipo: 'multiple-choice-single',
        multimedia: '',
        numeroPregunta: 1,
        totalPreguntas: 10,
        tiempo: 30
    }
}
```

---

### `answer_received`

Confirmación de que la respuesta fue recibida.

**Datos:**
```javascript
{
    tipo: 'answer_received',
    payload: {}
}
```

---

### `result`

Resultado de la pregunta actual.

**Datos:**
```javascript
{
    tipo: 'result',
    payload: {
        esCorrecta: boolean | number,  // true/false o 0-100 para ponderado
        puntosGanados: number,          // Puntos ganados en esta pregunta
        puntosTotal: number,            // Puntos totales acumulados
        respuestaCorrecta: [            // Info de las respuestas correctas
            {
                index: number,
                texto: string,
                correcta: boolean,
                peso: number
            }
        ],
        feedback: string                // Feedback de la respuesta (puede estar vacío)
    }
}
```

**Ejemplo:**
```javascript
{
    tipo: 'result',
    payload: {
        esCorrecta: true,
        puntosGanados: 1000,
        puntosTotal: 3000,
        respuestaCorrecta: [
            {
                index: 1,
                texto: 'París',
                correcta: true,
                peso: 100
            }
        ],
        feedback: '¡Correcto! París es la capital de Francia desde 987 d.C.'
    }
}
```

---

### `final_result`

Resultados finales del juego.

**Datos:**
```javascript
{
    tipo: 'final_result',
    payload: {
        puntuacionFinal: number,        // Puntos totales del jugador
        puntuacionMaxima: number,       // Máxima puntuación posible
        respuestasCorrectas: number,    // Número de respuestas correctas
        totalPreguntas: number,         // Total de preguntas
        posicion: number                // Posición en el ranking (1-based)
    }
}
```

**Ejemplo:**
```javascript
{
    tipo: 'final_result',
    payload: {
        puntuacionFinal: 7500,
        puntuacionMaxima: 10000,
        respuestasCorrectas: 8,
        totalPreguntas: 10,
        posicion: 2    // Segundo lugar
    }
}
```

---

### `pause`

Notificación de pausa del juego.

**Datos:**
```javascript
{
    tipo: 'pause',
    payload: {}
}
```

---

### `resume`

Notificación de reanudación del juego.

**Datos:**
```javascript
{
    tipo: 'resume',
    payload: {
        tiempoRestante: number  // Segundos restantes de la pregunta
    }
}
```

---

### `kicked`

Notificación de expulsión.

**Datos:**
```javascript
{
    tipo: 'kicked',
    payload: {
        razon: string  // Razón de la expulsión
    }
}
```

---

### `error`

Mensaje de error.

**Datos:**
```javascript
{
    tipo: 'error',
    payload: {
        mensaje: string  // Descripción del error
    }
}
```

---

## Flujo de Comunicación

### 1. Conexión

```
JUGADOR                         PRESENTADOR
   │                                  │
   │──────── connect(gameId) ────────>│
   │                                  │
   │<─────── connection open ─────────│
   │                                  │
   │──────── tipo: 'join' ───────────>│
   │                                  │
   │<─── tipo: 'join_confirmed' ──────│
```

### 2. Inicio del Juego

```
PRESENTADOR                     JUGADORES
   │                                  │
   │──── tipo: 'game_started' ───────>│
   │                                  │
   │──── tipo: 'question' ───────────>│
```

### 3. Respuesta y Resultado

```
JUGADOR                         PRESENTADOR
   │                                  │
   │──────── tipo: 'answer' ─────────>│
   │                                  │
   │<── tipo: 'answer_received' ──────│
   │                                  │
   │<────── tipo: 'result' ───────────│
```

### 4. Finalización

```
PRESENTADOR                     JUGADORES
   │                                  │
   │──── tipo: 'final_result' ───────>│
```

---

## Códigos de Estado

### Estados del Juego

| Estado | Descripción |
|--------|-------------|
| `inicio` | Pantalla inicial de carga de archivo |
| `lobby` | Esperando jugadores |
| `jugando` | Juego en curso |
| `resultado` | Mostrando resultado de pregunta |
| `finalizado` | Juego terminado |

### Estados de Conexión PeerJS

| Evento | Descripción |
|--------|-------------|
| `open` | Conexión establecida |
| `connection` | Nueva conexión de jugador (solo presentador) |
| `data` | Mensaje recibido |
| `close` | Conexión cerrada |
| `error` | Error en la conexión |
| `disconnected` | Desconectado del servidor PeerJS |

---

## Manejo de Errores

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `peer-unavailable` | El código de partida no existe | Verificar el código |
| `network` | Problema de red | Revisar conexión a internet |
| `server-error` | Error del servidor PeerJS | Reintentar más tarde |
| `browser-incompatible` | Navegador no soporta WebRTC | Usar Chrome, Firefox o Edge |

### Reconexión

GIFTPlay **NO** implementa reconexión automática. Si un jugador se desconecta:

1. El jugador es marcado como `conectado: false`
2. No puede volver a unirse a la misma partida
3. Debe esperar a una nueva partida

---

## Límites y Restricciones

| Aspecto | Límite |
|---------|--------|
| Jugadores simultáneos | ~50 (recomendado: 20-30) |
| Tamaño de mensaje | ~1 MB |
| Duración de conexión | Ilimitada (mientras el presentador esté activo) |
| Latencia típica | 50-200 ms |

---

## Seguridad

### ⚠️ Importante

- **NO** se envía información sensible
- Las respuestas **NO están cifradas** end-to-end (confianza en PeerJS)
- El presentador puede ver todas las respuestas en tiempo real
- **NO** hay autenticación de jugadores (solo nombre + emoji)

### Recomendaciones

- Usar en redes confiables (WiFi de la institución educativa)
- No compartir códigos de sesión públicamente
- El presentador debe validar nombres ofensivos manualmente

---

## Ejemplo de Implementación

### Presentador

```javascript
const peerManager = new PeerManager();

// Inicializar
const gameId = await peerManager.initialize();

// Escuchar jugadores
peerManager.onPlayerJoin((jugador) => {
    console.log(`${jugador.nombre} se unió`);
});

// Enviar pregunta a todos
peerManager.broadcast(
    Protocol.createQuestionMessage(pregunta, 1, 10, 30)
);
```

### Jugador

```javascript
const peerClient = new PeerClient();

// Conectar
await peerClient.connect('ABCDE', '🎮 Pedro');

// Escuchar preguntas
peerClient.onQuestion((payload) => {
    console.log('Nueva pregunta:', payload.pregunta);
});

// Enviar respuesta
peerClient.sendAnswer(2, 3450); // Opción C, 3.45s
```

---

## Referencias

- [PeerJS Documentation](https://peerjs.com/docs/)
- [WebRTC Specification](https://www.w3.org/TR/webrtc/)
- [Código fuente: protocol.js](../src/shared/protocol.js)

---

**Documentación actualizada:** 2025-10-19
