# Plan de Mejoras para GIFTPlay

## Resumen Ejecutivo

Este documento presenta un análisis completo de:
1. **Fallos identificados** en GIFTPlay (34 problemas)
2. **Mejoras potenciales** basadas en los forks QPlay y EduHoot

---

## Parte 1: Fallos Identificados en GIFTPlay

### Resumen por Severidad

| Severidad | Cantidad | Descripción |
|-----------|----------|-------------|
| **CRÍTICA** | 1 | Credenciales TURN expuestas |
| **ALTA** | 3 | Parser incorrecto, sin reconexión, XSS potencial |
| **MEDIA** | 18 | Timers, desconexiones, validaciones, memory leaks |
| **BAJA** | 12 | UX menor, compatibilidad, documentación |

---

### 1. Problemas CRÍTICOS

#### 1.1 Credenciales TURN Expuestas en Código Cliente
- **Ubicación**: `src/presentador/peer-manager.js:37-45` y `src/jugador/peer-client.js:43-51`
- **Problema**: Las credenciales TURN (`username` y `credential` para `relay.metered.ca`) están hardcodeadas en código JavaScript visible al cliente
- **Impacto**: Las credenciales pueden ser abusadas, causando gastos inesperados o bloqueo del servicio
- **Solución**:
  - Usar un proxy/servidor para obtener credenciales temporales
  - O eliminar TURN y usar solo STUN (con limitación de conectividad)

---

### 2. Problemas de Severidad ALTA

#### 2.1 BraceDepth Incorrecto en Parser GIFT
- **Ubicación**: `src/lib/gift/parser.js:82-86`
- **Problema**: El contador de `braceDepth` usa `line.indexOf(char)` que siempre retorna la primera ocurrencia, no la actual
- **Impacto**: Archivos GIFT con múltiples llaves se parsean incorrectamente
- **Solución**: Usar índice del bucle en lugar de `indexOf`

#### 2.2 Sin Reconexión Automática en PeerClient
- **Ubicación**: `src/jugador/peer-client.js:102-107`
- **Problema**: El evento `disconnected` se maneja pero no intenta reconexión automática
- **Impacto**: Desconexiones por mala red resultan en abandono permanente del jugador
- **Solución**: Implementar lógica de reconexión con backoff exponencial

#### 2.3 innerHTML Sin Sanitización (XSS Potencial)
- **Ubicación**: Múltiples archivos
  - `src/jugador/app.js`: líneas 193, 197, 322, 327, 340, 359
  - `src/presentador/app.js`: líneas 240, 482, 486, 493, 618, 650, 697
- **Problema**: Se usa `innerHTML` directamente con datos que podrían contener HTML/JS malicioso (feedback de preguntas GIFT)
- **Impacto**: XSS si un archivo GIFT contiene código malicioso en campos de feedback
- **Solución**: Sanitizar HTML antes de insertar o usar `textContent` cuando sea posible

---

### 3. Problemas de Severidad MEDIA

#### 3.1 Parser GIFT
| Problema | Ubicación | Descripción |
|----------|-----------|-------------|
| Preguntas sin cierre de llaves | parser.js:175-182 | Crash si falta `}` final |
| Preguntas de ensayo ignoradas silenciosamente | parser.js:190-195 | Solo `console.warn`, sin notificación UI |
| Respuestas numéricas mal validadas | parser.js:282-311 | No valida que sean números antes de `parseFloat` |
| BOM no eliminado completamente | parser.js:24 | Solo maneja BOM al inicio del archivo |

#### 3.2 Conexiones P2P
| Problema | Ubicación | Descripción |
|----------|-----------|-------------|
| Sin heartbeat/keep-alive | peer-manager.js, peer-client.js | Conexiones "fantasma" permanecen activas |
| Sin timeout para respuestas | app.js:545-548 | Espera indefinida si jugador no responde |
| Desconexión durante pregunta no manejada | app.js:573-604 | Puntuación incorrecta si se desconecta mid-game |
| Sin límite de reconexión | Ambos peers | Flood de intentos sin backoff |

#### 3.3 Manejo de Errores
| Problema | Ubicación | Descripción |
|----------|-----------|-------------|
| Sin validación de payload P2P | peer-manager.js:106-109 | Payload malformado causa crash |
| loadTranslations sin reintentos | i18n.js:16-30 | Fallo silencioso si ambos idiomas fallan |
| JSON.parse sin validación de estructura | game-state.js:300-305 | Estado corrupto causa errores runtime |

#### 3.4 UI/UX
| Problema | Ubicación | Descripción |
|----------|-----------|-------------|
| Sin indicador de conexión | Ambas apps | Usuario no sabe si está conectado |
| Timer desincronizado | jugador/app.js:293-305 | Cliente y servidor pueden desincronizarse |
| Pause/Resume incompleto | jugador/app.js:388-398 | Timer visual sigue corriendo en pausa |
| Nombre sin validación de caracteres | jugador/app.js:106-110 | Unicode raro puede romper UI |
| Sin indicador de respuestas incompletas | presentador/app.js:546 | Confusión con resultados |

#### 3.5 Memory Leaks
| Problema | Ubicación | Descripción |
|----------|-----------|-------------|
| setInterval sin limpiar | jugador/app.js:297-304 | Múltiples timers acumulados |
| QRCode sin destruir | presentador/app.js:397-403 | Objetos QR acumulados |

#### 3.6 Otros
| Problema | Ubicación | Descripción |
|----------|-----------|-------------|
| CSV sin escapar caracteres | presentador/app.js:724-743 | `;` en nombre rompe formato |
| Evaluación con tipos mixtos | game-state.js:204-206 | Mezcla boolean con number |
| Sin persistencia de sesión | Ambas apps | Recarga = pérdida total |

---

### 4. Problemas de Severidad BAJA

| Problema | Ubicación | Descripción |
|----------|-----------|-------------|
| Clipboard API sin soporte legacy | presentador/app.js:416-425 | `execCommand` deprecado |
| Sin polyfill URLSearchParams | jugador/app.js:93 | IE11 no soportado |
| navigator.language no soportado | i18n.js:119 | Navegadores móviles antiguos |
| File.text() es API moderna | presentador/app.js:169 | Necesita FileReader para legacy |
| Idiomas ca/gl/eu referenciados pero no existen | locales/ | Error al seleccionar idioma |
| Sin pluralización i18n | Toda la app | "1 preguntas" incorrecto |
| Drag-drop sin persistencia | presentador/app.js:302-369 | Pérdida de reordenamiento |

---

## Parte 2: Mejoras Propuestas desde los Forks

### Comparativa de Funcionalidades

| Funcionalidad | GIFTPlay | QPlay | EduHoot |
|---------------|----------|-------|---------|
| **Formato entrada** | GIFT | CSV | CSV + Kahoot |
| **Arquitectura** | P2P | P2P | Cliente-Servidor |
| **Editor visual** | ❌ | ✅ Manual + IA | ✅ Completo |
| **Música de fondo** | ❌ | ✅ 8+2 temas | ✅ Widget |
| **Modo práctica individual** | ❌ | ❌ | ✅ Completo |
| **Saltar pregunta** | ❌ | ❌ | ✅ |
| **Reconexión automática** | ❌ | ❌ | ✅ |
| **Progreso visual** | ❌ | ❌ | ✅ |
| **Tiempo personalizado/pregunta** | ❌ | ✅ | ✅ |
| **Respuestas múltiples** | Parcial | ✅ | ✅ |
| **Importar Kahoot** | ❌ | ❌ | ✅ |
| **Ranking persistente** | ❌ | ❌ | ✅ |
| **Dark mode** | ❌ | ✅ | ✅ |

---

### Mejoras de QPlay (Prioridad recomendada)

#### ALTA PRIORIDAD

##### 1. Sistema de Música y Audio
- **Descripción**: 8 temas de fondo + 2 de ganador, control de volumen
- **Archivos de referencia**: `qplay/musica/` (63MB), `qplay/index.js:63-272`
- **Beneficio**: Experiencia gamificada, mayor engagement
- **Esfuerzo**: Bajo (copiar archivos + adaptar código)
- **Características**:
  - Música contextual (lobby, jugando, ganador)
  - Slider de volumen con persistencia localStorage
  - Toggle mute

##### 2. Opciones de Configuración del Juego
- **Descripción**: 4 checkboxes configurables antes de empezar
- **Archivo de referencia**: `qplay/index.html:67-97`
- **Beneficio**: Mayor control pedagógico
- **Esfuerzo**: Bajo
- **Opciones**:
  - Preguntas aleatorias
  - Respuestas aleatorias
  - Enviar pregunta completa a móviles
  - Mostrar puntuaciones intermedias

##### 3. Tiempo Personalizado por Pregunta
- **Descripción**: Cada pregunta puede tener su propio tiempo límite
- **Archivo de referencia**: `qplay/editor.html:70-154`
- **Beneficio**: Preguntas difíciles = más tiempo
- **Esfuerzo**: Medio (modificar parser GIFT + UI)

#### MEDIA PRIORIDAD

##### 4. Editor con Integración IA
- **Descripción**: Genera prompts JSON para ChatGPT que devuelve CSV
- **Archivo de referencia**: `qplay/editor_ia.html`
- **Beneficio**: Creación rápida de cuestionarios
- **Esfuerzo**: Medio
- **Flujo**:
  1. Usuario configura parámetros (tema, nivel, idioma, cantidad)
  2. Sistema genera prompt JSON
  3. Usuario lo pega en ChatGPT
  4. ChatGPT devuelve CSV
  5. Sistema lo importa

##### 5. Editor Manual de Preguntas
- **Descripción**: Crear/editar preguntas visualmente con preview
- **Archivo de referencia**: `qplay/editor.html`
- **Beneficio**: No requiere conocer formato GIFT
- **Esfuerzo**: Alto (nueva página completa)
- **Características**:
  - Toolbar Markdown + KaTeX
  - Preview en tiempo real
  - Drag-drop para reordenar

##### 6. UI Mejorada con Tailwind CSS
- **Descripción**: Glassmorphism, gradientes animados, dark mode
- **Archivo de referencia**: `qplay/index.css`
- **Beneficio**: Experiencia visual moderna
- **Esfuerzo**: Medio
- **Características**:
  - Gradiente animado de fondo
  - Glass cards con blur
  - Temporizador circular SVG
  - Colores distintivos por respuesta

#### BAJA PRIORIDAD

##### 7. Soporte CSV además de GIFT
- **Descripción**: Importar cuestionarios en formato CSV
- **Beneficio**: Más accesible que GIFT para usuarios no técnicos
- **Esfuerzo**: Medio (parser adicional)

##### 8. Resultados Detallados CSV
- **Descripción**: Exportar resultados con detalle por pregunta por jugador
- **Archivo de referencia**: `qplay/index.js:882-926`
- **Beneficio**: Análisis pedagógico profundo

---

### Mejoras de EduHoot (Adaptadas a P2P)

#### ALTA PRIORIDAD

##### 1. Reconexión Automática
- **Descripción**: Reintentar conexión automáticamente si se pierde
- **Archivo de referencia**: `EduHoot/src/public/js/playerGame.js:1-113`
- **Beneficio**: Jugadores no pierden su sesión por cortes de red
- **Esfuerzo**: Medio
- **Adaptación P2P**:
  - Heartbeat cada 5s via WebRTC DataChannel
  - Buffer de últimos 20 mensajes para resync
  - Backoff exponencial (500ms → 3s)
  - Máximo 20 intentos

##### 2. Indicador de Progreso Visual
- **Descripción**: "Pregunta 5 de 20" + barra de progreso
- **Archivo de referencia**: `EduHoot/src/public/js/solo.js:1325-1330`
- **Beneficio**: Jugadores saben cuánto falta
- **Esfuerzo**: Bajo
- **Implementación**: Texto + barra SVG circular animada

##### 3. Saltar Pregunta
- **Descripción**: Botón para que el presentador salte a la siguiente
- **Archivo de referencia**: `EduHoot/src/public/js/hostGame.js:155-156`
- **Beneficio**: Control total del presentador sobre el ritmo
- **Esfuerzo**: Bajo
- **Adaptación P2P**: Broadcast `skip-question-event` via DataChannel

#### MEDIA PRIORIDAD

##### 4. Modo Práctica Individual ("Solo")
- **Descripción**: Jugar cuestionarios sin necesidad de presentador
- **Archivo de referencia**: `EduHoot/src/public/js/solo.js` (2143 líneas)
- **Beneficio**: Práctica autónoma, preparación de exámenes
- **Esfuerzo**: Alto
- **Características adaptables**:
  - Catálogo de quizzes locales (IndexedDB)
  - Timer regresivo de alta precisión
  - Puntuación con bonus por velocidad
  - Ranking local Top 10

##### 5. Sistema de Favoritos
- **Descripción**: Marcar quizzes favoritos para acceso rápido
- **Beneficio**: Organización personal
- **Esfuerzo**: Bajo (localStorage con Set)

##### 6. Preguntas de Respuesta Libre
- **Descripción**: Respuestas de texto corto con normalización
- **Archivo de referencia**: `EduHoot/src/public/js/solo.js`
- **Beneficio**: Tipos de pregunta más variados
- **Esfuerzo**: Medio
- **Normalización**: minúsculas, sin acentos, espacios únicos

#### BAJA PRIORIDAD

##### 7. Importar Kahoot
- **Descripción**: Importar cuestionarios públicos de Kahoot
- **Archivo de referencia**: `EduHoot/src/server/server.js:1497-1530`
- **Beneficio**: Acceso a millones de quizzes existentes
- **Esfuerzo**: Alto
- **Adaptación P2P**: Fetch desde cliente, requiere CORS proxy

##### 8. Rating de Quizzes (5 estrellas)
- **Descripción**: Calificar quizzes jugados
- **Beneficio**: Filtrar por calidad
- **Esfuerzo**: Medio
- **Almacenamiento**: Device ID + IndexedDB

---

## Parte 3: Plan de Implementación Recomendado

### Fase 1: Corrección de Errores Críticos
**Duración estimada**: Sprint 1
**Prioridad**: URGENTE

1. [ ] Remover/ocultar credenciales TURN
2. [ ] Corregir braceDepth en parser GIFT
3. [ ] Implementar reconexión automática básica
4. [ ] Sanitizar innerHTML para prevenir XSS

### Fase 2: Mejoras de Estabilidad
**Duración estimada**: Sprint 2
**Prioridad**: ALTA

1. [ ] Implementar heartbeat/keep-alive P2P
2. [ ] Añadir timeout para respuestas
3. [ ] Manejar desconexiones durante pregunta
4. [ ] Limpiar memory leaks (timers, QRCode)
5. [ ] Añadir indicador visual de conexión
6. [ ] Sincronizar timer cliente/servidor

### Fase 3: Mejoras de UX (desde QPlay)
**Duración estimada**: Sprint 3
**Prioridad**: MEDIA

1. [ ] Sistema de música con control de volumen
2. [ ] Opciones de configuración del juego
3. [ ] Indicador de progreso visual
4. [ ] Botón "Saltar pregunta"
5. [ ] Dark mode con Tailwind CSS

### Fase 4: Funcionalidades Nuevas
**Duración estimada**: Sprint 4-5
**Prioridad**: MEDIA

1. [ ] Tiempo personalizado por pregunta
2. [ ] Soporte para preguntas de respuesta múltiple completo
3. [ ] Editor IA (generador de prompts)
4. [ ] Soporte CSV además de GIFT

### Fase 5: Funcionalidades Avanzadas
**Duración estimada**: Sprint 6+
**Prioridad**: BAJA

1. [ ] Modo práctica individual
2. [ ] Editor visual de preguntas
3. [ ] Sistema de favoritos
4. [ ] Importación de Kahoot

---

## Apéndice: Archivos Clave de Referencia

### GIFTPlay
- `src/lib/gift/parser.js` - Parser GIFT (466 líneas)
- `src/presentador/peer-manager.js` - Gestión conexiones P2P host
- `src/jugador/peer-client.js` - Cliente P2P jugador
- `src/presentador/app.js` - Lógica principal presentador (803 líneas)
- `src/jugador/app.js` - Lógica principal jugador (462 líneas)

### QPlay
- `index.js` - Lógica principal (1417 líneas)
- `editor.html` - Editor manual (47KB)
- `editor_ia.html` - Editor IA (40KB)
- `musica/` - 10 archivos de audio (63MB)
- `i18n.js` - Sistema de traducciones

### EduHoot
- `src/server/server.js` - Servidor completo (111KB)
- `src/public/js/solo.js` - Modo práctica (2143 líneas)
- `src/public/js/playerGame.js` - Lógica jugador con reconexión
- `src/public/js/hostGame.js` - Lógica presentador

---

*Documento generado el 2 de febrero de 2026*
