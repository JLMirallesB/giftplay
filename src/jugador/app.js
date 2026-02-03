/**
 * Aplicación Principal del Jugador
 * GIFTPlay - Jugador
 */

// Estado global
let peerClient = null;
let emojiSeleccionado = '😀';
let tiempoInicioPregunta = null;
let respuestaEnviada = false;
let puntosTotales = 0;
let timerInterval = null; // Para limpiar memory leaks

// Referencias DOM
const elementos = {};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    inicializarReferenciasDOM();
    inicializarEventos();
    cargarCodigoURL();
});

// Limpiar recursos al cerrar/navegar (memory leak fix)
window.addEventListener('beforeunload', () => {
    limpiarRecursos();
});

/**
 * Limpia todos los recursos (timers, conexiones)
 */
function limpiarRecursos() {
    // Detener temporizador
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Desconectar peer
    if (peerClient) {
        peerClient.disconnect();
    }
}

/**
 * Inicializa referencias a elementos DOM
 */
function inicializarReferenciasDOM() {
    // Pantallas
    elementos.pantallaEntrada = document.getElementById('pantalla-entrada');
    elementos.pantallaLobby = document.getElementById('pantalla-lobby');
    elementos.pantallaPregunta = document.getElementById('pantalla-pregunta');
    elementos.pantallaResultado = document.getElementById('pantalla-resultado');
    elementos.pantallaFinal = document.getElementById('pantalla-final');
    elementos.pantallaError = document.getElementById('pantalla-error');

    // Entrada
    elementos.codigoInput = document.getElementById('codigo-input');
    elementos.nombreInput = document.getElementById('nombre-input');
    elementos.emojiSelector = document.getElementById('emoji-selector');
    elementos.emojiSelected = document.getElementById('emoji-selected');
    elementos.btnUnirse = document.getElementById('btn-unirse');
    elementos.errorMessage = document.getElementById('error-message');

    // Lobby
    elementos.playerDisplay = document.getElementById('player-display');
    elementos.playersCount = document.getElementById('players-count');

    // Pregunta
    elementos.numPregunta = document.getElementById('num-pregunta');
    elementos.totalPreguntas = document.getElementById('total-preguntas');
    elementos.tiempoRestante = document.getElementById('tiempo-restante');
    elementos.multimediaContainer = document.getElementById('multimedia-container');
    elementos.textoPregunta = document.getElementById('texto-pregunta');
    elementos.answersContainer = document.getElementById('answers-container');
    elementos.answerSentMessage = document.getElementById('answer-sent-message');

    // Resultado
    elementos.resultIcon = document.getElementById('result-icon');
    elementos.resultMessage = document.getElementById('result-message');
    elementos.puntosGanados = document.getElementById('puntos-ganados');
    elementos.puntosTotales = document.getElementById('puntos-totales');
    elementos.feedbackContainer = document.getElementById('feedback-container');

    // Final
    elementos.positionBadge = document.getElementById('position-badge');
    elementos.finalPuntos = document.getElementById('final-puntos');
    elementos.finalCorrectas = document.getElementById('final-correctas');
    elementos.finalPorcentaje = document.getElementById('final-porcentaje');
    elementos.finalMessage = document.getElementById('final-message');

    // Error
    elementos.errorText = document.getElementById('error-text');
    elementos.btnReintentar = document.getElementById('btn-reintentar');

    // Indicador de conexión
    elementos.connectionIndicator = document.getElementById('connection-indicator');
    elementos.connectionText = document.getElementById('connection-text');
}

/**
 * Inicializa eventos
 */
function inicializarEventos() {
    // Entrada
    elementos.codigoInput.addEventListener('input', validarFormulario);
    elementos.nombreInput.addEventListener('input', validarFormulario);
    elementos.emojiSelector.addEventListener('click', seleccionarEmoji);
    elementos.btnUnirse.addEventListener('click', unirseAlJuego);

    // Error
    elementos.btnReintentar.addEventListener('click', () => location.reload());
}

/**
 * Carga el código desde la URL si existe
 */
function cargarCodigoURL() {
    const params = new URLSearchParams(window.location.search);
    const codigoURL = params.get('partida');

    if (codigoURL) {
        elementos.codigoInput.value = codigoURL.toUpperCase();
        validarFormulario();
    }
}

/**
 * Valida el formulario de entrada
 */
function validarFormulario() {
    const codigo = elementos.codigoInput.value.trim();
    const nombre = elementos.nombreInput.value.trim();

    elementos.btnUnirse.disabled = !(codigo.length === 5 && nombre.length >= 2);
}

/**
 * Selecciona un emoji
 */
function seleccionarEmoji(event) {
    const btn = event.target.closest('.emoji-btn');
    if (!btn) return;

    // Remover selección previa
    elementos.emojiSelector.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));

    // Seleccionar nuevo
    btn.classList.add('selected');
    emojiSeleccionado = btn.dataset.emoji;
    elementos.emojiSelected.textContent = emojiSeleccionado;
}

/**
 * Une al jugador al juego
 */
async function unirseAlJuego() {
    const codigo = elementos.codigoInput.value.trim().toUpperCase();
    const nombre = elementos.nombreInput.value.trim();
    const nombreCompleto = `${emojiSeleccionado} ${nombre}`;

    try {
        elementos.btnUnirse.disabled = true;
        elementos.btnUnirse.textContent = 'Conectando...';

        peerClient = new PeerClient();

        // Configurar callbacks
        peerClient.onJoinConfirmed(manejarJoinConfirmado);
        peerClient.onGameStarted(manejarJuegoIniciado);
        peerClient.onQuestion(manejarPregunta);
        peerClient.onAnswerReceived(manejarRespuestaRecibida);
        peerClient.onResult(manejarResultado);
        peerClient.onFinalResult(manejarResultadoFinal);
        peerClient.onPause(manejarPausa);
        peerClient.onResume(manejarResumen);
        peerClient.onKicked(manejarExpulsion);
        peerClient.onError(manejarError);
        peerClient.onDisconnected(manejarDesconexion);
        peerClient.onTimeSync(sincronizarTiempo);
        peerClient.onReconnecting(manejarReconectando);
        peerClient.onReconnected(manejarReconectado);

        // Conectar
        await peerClient.connect(codigo, nombreCompleto);

    } catch (error) {
        console.error('[DEBUG] Error al unirse:', error);
        console.error('[DEBUG] Error stack:', error.stack);

        // Mostrar error detallado para diagnóstico
        let mensajeError = 'No se pudo conectar. ';
        if (error.type) {
            mensajeError += `Tipo: ${error.type}. `;
        }
        if (error.message) {
            mensajeError += error.message;
        } else {
            mensajeError += 'Verifica el código e intenta de nuevo.';
        }

        manejarError(mensajeError);
        elementos.btnUnirse.disabled = false;
        elementos.btnUnirse.textContent = t('join_game') || '¡A jugar!';
    }
}

/**
 * Maneja la confirmación de unión
 */
function manejarJoinConfirmado(payload) {
    mostrarPantalla('lobby');
    elementos.playerDisplay.textContent = `${emojiSeleccionado} ${elementos.nombreInput.value}`;
    elementos.playersCount.textContent = payload.jugadoresConectados;

    // Mostrar indicador de conexión
    actualizarIndicadorConexion('connected');
}

/**
 * Maneja el inicio del juego
 */
function manejarJuegoIniciado(payload) {
    console.log('Juego iniciado. Total preguntas:', payload.totalPreguntas);
}

/**
 * Maneja una nueva pregunta
 */
function manejarPregunta(payload) {
    mostrarPantalla('pregunta');
    respuestaEnviada = false;
    tiempoInicioPregunta = Date.now();

    // Actualizar info
    elementos.numPregunta.textContent = payload.numeroPregunta;
    elementos.totalPreguntas.textContent = payload.totalPreguntas;
    elementos.textoPregunta.innerHTML = renderizarTexto(payload.pregunta);

    // Multimedia (sanitizado para prevenir XSS)
    if (payload.multimedia) {
        elementos.multimediaContainer.innerHTML = Sanitize.sanitizeMultimedia(payload.multimedia);
        elementos.multimediaContainer.classList.remove('hidden');
    } else {
        elementos.multimediaContainer.classList.add('hidden');
    }

    // Ocultar mensaje de respuesta enviada
    elementos.answerSentMessage.classList.add('hidden');

    // Mostrar opciones
    renderizarOpciones(payload.opciones, payload.tipo);

    // Iniciar temporizador visual
    iniciarTemporizador(payload.tiempo);
}

/**
 * Renderiza las opciones de respuesta
 */
function renderizarOpciones(opciones, tipo) {
    if (tipo === 'multiple-choice-multiple') {
        // Múltiple selección (checkboxes)
        elementos.answersContainer.innerHTML = opciones.map((opcion, index) => {
            const letra = String.fromCharCode(65 + index);
            return `
                <label class="answer-option checkbox">
                    <input type="checkbox" name="respuesta" value="${index}">
                    <span class="answer-letter">${letra}</span>
                    <span class="answer-text">${renderizarTexto(opcion.texto)}</span>
                </label>
            `;
        }).join('') + `
            <button class="btn btn-primary btn-send-answer" onclick="enviarRespuestaMultiple()">
                ${t('send_answer') || 'Enviar Respuesta'}
            </button>
        `;
    } else {
        // Selección única (botones)
        elementos.answersContainer.innerHTML = opciones.map((opcion, index) => {
            const letra = String.fromCharCode(65 + index);
            return `
                <button class="answer-option" onclick="enviarRespuestaUnica(${index})">
                    <span class="answer-letter">${letra}</span>
                    <span class="answer-text">${renderizarTexto(opcion.texto)}</span>
                </button>
            `;
        }).join('');
    }
}

/**
 * Envía respuesta única
 */
window.enviarRespuestaUnica = function(index) {
    if (respuestaEnviada) return;

    const tiempoRespuesta = Date.now() - tiempoInicioPregunta;
    peerClient.sendAnswer(index, tiempoRespuesta);
    respuestaEnviada = true;
    elementos.answerSentMessage.classList.remove('hidden');

    // Deshabilitar opciones
    elementos.answersContainer.querySelectorAll('.answer-option').forEach(btn => {
        btn.disabled = true;
        btn.classList.add('disabled');
    });
};

/**
 * Envía respuesta múltiple
 */
window.enviarRespuestaMultiple = function() {
    if (respuestaEnviada) return;

    const seleccionadas = Array.from(elementos.answersContainer.querySelectorAll('input[name="respuesta"]:checked'))
        .map(input => parseInt(input.value));

    if (seleccionadas.length === 0) {
        alert(t('select_at_least_one') || 'Selecciona al menos una opción');
        return;
    }

    const tiempoRespuesta = Date.now() - tiempoInicioPregunta;
    peerClient.sendAnswer(seleccionadas, tiempoRespuesta);
    respuestaEnviada = true;
    elementos.answerSentMessage.classList.remove('hidden');

    // Deshabilitar opciones
    elementos.answersContainer.querySelectorAll('input, button').forEach(el => {
        el.disabled = true;
    });
};

/**
 * Inicia el temporizador visual
 */
function iniciarTemporizador(tiempo) {
    // Limpiar timer anterior si existe (memory leak fix)
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    let tiempoRestante = tiempo;
    elementos.tiempoRestante.textContent = tiempoRestante;

    timerInterval = setInterval(() => {
        tiempoRestante--;
        elementos.tiempoRestante.textContent = Math.max(0, tiempoRestante);

        if (tiempoRestante <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }, 1000);
}

/**
 * Sincroniza el temporizador con el servidor
 */
function sincronizarTiempo(payload) {
    // Limpiar timer anterior
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Usar el tiempo del servidor
    let tiempoRestante = payload.tiempoRestante;
    elementos.tiempoRestante.textContent = tiempoRestante;

    timerInterval = setInterval(() => {
        tiempoRestante--;
        elementos.tiempoRestante.textContent = Math.max(0, tiempoRestante);

        if (tiempoRestante <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }, 1000);

    console.log('Tiempo sincronizado con servidor:', tiempoRestante);
}

/**
 * Maneja la confirmación de respuesta recibida
 */
function manejarRespuestaRecibida(payload) {
    console.log('Respuesta recibida por el presentador');
}

/**
 * Maneja el resultado de la pregunta
 */
function manejarResultado(payload) {
    mostrarPantalla('resultado');

    // Icono y mensaje
    if (payload.esCorrecta === true) {
        elementos.resultIcon.innerHTML = '<div class="result-correct">✓</div>';
        elementos.resultMessage.innerHTML = `<h2>${t('correct') || '¡Correcto!'}</h2>`;
        elementos.resultMessage.classList.add('correct');
        elementos.resultMessage.classList.remove('incorrect');
    } else {
        elementos.resultIcon.innerHTML = '<div class="result-incorrect">✗</div>';
        elementos.resultMessage.innerHTML = `<h2>${t('incorrect') || 'Incorrecto'}</h2>`;
        elementos.resultMessage.classList.add('incorrect');
        elementos.resultMessage.classList.remove('correct');
    }

    // Puntos
    elementos.puntosGanados.textContent = payload.puntosGanados;
    elementos.puntosTotales.textContent = payload.puntosTotal;
    puntosTotales = payload.puntosTotal;

    // Feedback (sanitizado para prevenir XSS)
    if (payload.feedback) {
        elementos.feedbackContainer.innerHTML = `<p>${Sanitize.escapeHTML(payload.feedback)}</p>`;
        elementos.feedbackContainer.classList.remove('hidden');
    } else {
        elementos.feedbackContainer.classList.add('hidden');
    }
}

/**
 * Maneja el resultado final
 */
function manejarResultadoFinal(payload) {
    mostrarPantalla('final');

    // Posición
    const posiciones = ['🥇 1º', '🥈 2º', '🥉 3º'];
    const posicionTexto = payload.posicion <= 3 ?
        posiciones[payload.posicion - 1] :
        `#${payload.posicion}`;

    elementos.positionBadge.innerHTML = `<div class="position-number">${posicionTexto}</div>`;

    // Estadísticas
    elementos.finalPuntos.textContent = payload.puntuacionFinal;
    elementos.finalCorrectas.textContent = `${payload.respuestasCorrectas}/${payload.totalPreguntas}`;

    const porcentaje = Math.round((payload.respuestasCorrectas / payload.totalPreguntas) * 100);
    elementos.finalPorcentaje.textContent = `${porcentaje}%`;

    // Mensaje final
    let mensaje = '';
    if (payload.posicion === 1) {
        mensaje = '🏆 ¡Felicidades! ¡Has ganado!';
    } else if (payload.posicion <= 3) {
        mensaje = '🎉 ¡Excelente trabajo! Has quedado en el podio.';
    } else if (porcentaje >= 80) {
        mensaje = '👏 ¡Muy bien! Gran desempeño.';
    } else if (porcentaje >= 50) {
        mensaje = '👍 ¡Buen trabajo! Sigue practicando.';
    } else {
        mensaje = '💪 ¡Sigue intentándolo! La práctica hace al maestro.';
    }

    elementos.finalMessage.textContent = mensaje;
}

/**
 * Maneja la pausa
 */
function manejarPausa(payload) {
    console.log('Juego pausado');
    // Podríamos mostrar un overlay de pausa
}

/**
 * Maneja la reanudación
 */
function manejarResumen(payload) {
    console.log('Juego reanudado');
}

/**
 * Maneja la expulsión
 */
function manejarExpulsion(payload) {
    mostrarPantalla('error');
    elementos.errorText.textContent = payload.razon;
}

/**
 * Maneja errores
 */
function manejarError(error) {
    const mensaje = typeof error === 'string' ? error : error.message || 'Error desconocido';
    mostrarError(mensaje);
}

/**
 * Maneja desconexión
 */
function manejarDesconexion() {
    actualizarIndicadorConexion('disconnected');
    mostrarPantalla('error');
    elementos.errorText.textContent = 'Se ha perdido la conexión con el presentador.';

    // Limpiar timer (memory leak fix)
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/**
 * Maneja intento de reconexión
 */
function manejarReconectando(intento, maxIntentos) {
    console.log(`Reconectando... intento ${intento}/${maxIntentos}`);
    actualizarIndicadorConexion('reconnecting', `Reconectando ${intento}/${maxIntentos}...`);
}

/**
 * Maneja reconexión exitosa
 */
function manejarReconectado() {
    console.log('Reconectado exitosamente');
    actualizarIndicadorConexion('connected');
}

/**
 * Actualiza el indicador de estado de conexión
 */
function actualizarIndicadorConexion(estado, texto = null) {
    if (!elementos.connectionIndicator) return;

    // Mostrar el indicador
    elementos.connectionIndicator.classList.remove('hidden');

    // Quitar todas las clases de estado
    elementos.connectionIndicator.classList.remove('connected', 'reconnecting', 'disconnected');

    // Añadir la clase correspondiente
    elementos.connectionIndicator.classList.add(estado);

    // Actualizar texto
    const textos = {
        connected: 'Conectado',
        reconnecting: texto || 'Reconectando...',
        disconnected: 'Desconectado'
    };

    elementos.connectionText.textContent = texto || textos[estado] || estado;
}

// Utilidades

function mostrarPantalla(nombre) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('active'));
    const pantalla = document.getElementById(`pantalla-${nombre}`);
    if (pantalla) {
        pantalla.classList.add('active');
    }
}

function mostrarError(mensaje) {
    elementos.errorMessage.textContent = mensaje;
    elementos.errorMessage.classList.remove('hidden');
}

function renderizarTexto(texto) {
    // Proteger delimitadores LaTeX
    const protegido = texto
        .replace(/\$\$(.+?)\$\$/g, (_, math) => `<span class="katex-display">${renderKaTeX(math, true)}</span>`)
        .replace(/\$(.+?)\$/g, (_, math) => `<span class="katex-inline">${renderKaTeX(math, false)}</span>`);

    // Renderizar Markdown si está disponible
    if (typeof marked !== 'undefined') {
        return marked.parse(protegido);
    }

    return protegido;
}

function renderKaTeX(math, displayMode) {
    if (typeof katex !== 'undefined') {
        try {
            return katex.renderToString(math, { displayMode, throwOnError: false });
        } catch (e) {
            return math;
        }
    }
    return displayMode ? `$$${math}$$` : `$${math}$`;
}
