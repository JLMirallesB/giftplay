/**
 * Aplicación Principal del Presentador
 * GIFTPlay - Presentador
 */

// Estado global
let peerManager = null;
let gameState = null;
let giftParser = null;
let qrCodeInstance = null;

// Referencias DOM
const elementos = {};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    inicializarReferenciasDOM();
    inicializarEventos();
    inicializarInstancias();
});

/**
 * Inicializa referencias a elementos DOM
 */
function inicializarReferenciasDOM() {
    // Pantallas
    elementos.pantallaInicio = document.getElementById('pantalla-inicio');
    elementos.pantallaLobby = document.getElementById('pantalla-lobby');
    elementos.pantallaPregunta = document.getElementById('pantalla-pregunta');
    elementos.pantallaResultadoPregunta = document.getElementById('pantalla-resultado-pregunta');
    elementos.pantallaResultadosFinales = document.getElementById('pantalla-resultados-finales');

    // Inicio
    elementos.giftFileInput = document.getElementById('gift-file-input');
    elementos.fileInfo = document.getElementById('file-info');
    elementos.fileName = document.getElementById('file-name');
    elementos.fileQuestions = document.getElementById('file-questions');
    elementos.tiempoPregunta = document.getElementById('tiempo-pregunta');
    elementos.btnEmpezarSesion = document.getElementById('btn-empezar-sesion');
    elementos.errorMessage = document.getElementById('error-message');

    // Lobby
    elementos.codigoPartida = document.getElementById('codigo-partida');
    elementos.qrCode = document.getElementById('qr-code');
    elementos.urlPartida = document.getElementById('url-partida');
    elementos.btnCopiarUrl = document.getElementById('btn-copiar-url');
    elementos.playerCount = document.getElementById('player-count');
    elementos.playersList = document.getElementById('players-list');
    elementos.btnEmpezarJuego = document.getElementById('btn-empezar-juego');

    // Pregunta
    elementos.numPreguntaActual = document.getElementById('num-pregunta-actual');
    elementos.numPreguntaTotal = document.getElementById('num-pregunta-total');
    elementos.tiempoRestante = document.getElementById('tiempo-restante');
    elementos.multimediaContainer = document.getElementById('multimedia-container');
    elementos.textoPregunta = document.getElementById('texto-pregunta');
    elementos.respuestasGrid = document.getElementById('respuestas-grid');
    elementos.btnPausar = document.getElementById('btn-pausar');
    elementos.btnFinalizarPregunta = document.getElementById('btn-finalizar-pregunta');
    elementos.responsesCount = document.getElementById('responses-count');
    elementos.totalPlayers = document.getElementById('total-players');
    elementos.responsesList = document.getElementById('responses-list');

    // Resultado Pregunta
    elementos.respuestaCorrectaDisplay = document.getElementById('respuesta-correcta-display');
    elementos.statCorrect = document.getElementById('stat-correct');
    elementos.statIncorrect = document.getElementById('stat-incorrect');
    elementos.leaderboardList = document.getElementById('leaderboard-list');
    elementos.btnSiguientePregunta = document.getElementById('btn-siguiente-pregunta');

    // Resultados Finales
    elementos.podiumContainer = document.getElementById('podium-container');
    elementos.finalLeaderboardList = document.getElementById('final-leaderboard-list');
    elementos.btnNuevaPartida = document.getElementById('btn-nueva-partida');
    elementos.btnExportarResultados = document.getElementById('btn-exportar-resultados');
}

/**
 * Inicializa eventos
 */
function inicializarEventos() {
    // Inicio
    elementos.giftFileInput.addEventListener('change', manejarArchivoGIFT);
    elementos.btnEmpezarSesion.addEventListener('click', empezarSesion);

    // Lobby
    elementos.btnCopiarUrl.addEventListener('click', copiarURL);
    elementos.btnEmpezarJuego.addEventListener('click', empezarJuego);

    // Pregunta
    elementos.btnPausar.addEventListener('click', togglePausa);
    elementos.btnFinalizarPregunta.addEventListener('click', finalizarPregunta);

    // Resultado
    elementos.btnSiguientePregunta.addEventListener('click', siguientePregunta);

    // Final
    elementos.btnNuevaPartida.addEventListener('click', nuevaPartida);
    elementos.btnExportarResultados.addEventListener('click', exportarResultados);
}

/**
 * Inicializa instancias
 */
function inicializarInstancias() {
    giftParser = new GIFTParser();
    gameState = new GameState();
    peerManager = new PeerManager();

    // Configurar callbacks de PeerManager
    peerManager.onPlayerJoin(manejarNuevoJugador);
    peerManager.onPlayerAnswer(manejarRespuestaJugador);
    peerManager.onPlayerDisconnect(manejarDesconexionJugador);
    peerManager.onError(manejarErrorPeer);
}

/**
 * Maneja la carga del archivo GIFT
 */
async function manejarArchivoGIFT(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const texto = await file.text();
        const preguntas = giftParser.parse(texto);

        if (preguntas.length === 0) {
            mostrarError('El archivo no contiene preguntas válidas');
            return;
        }

        const validacion = giftParser.validate();
        if (!validacion.valid) {
            mostrarError('Errores en el archivo GIFT:\\n' + validacion.errors.join('\\n'));
            return;
        }

        // Mostrar info del archivo
        elementos.fileName.textContent = file.name;
        elementos.fileQuestions.textContent = `${preguntas.length} pregunta(s)`;
        elementos.fileInfo.classList.remove('hidden');
        elementos.btnEmpezarSesion.disabled = false;

        // Guardar preguntas
        gameState.cargarCuestionario(preguntas, parseInt(elementos.tiempoPregunta.value));

        ocultarError();
    } catch (error) {
        console.error('Error al procesar archivo GIFT:', error);
        mostrarError('Error al procesar el archivo: ' + error.message);
    }
}

/**
 * Empieza la sesión (crea el lobby)
 */
async function empezarSesion() {
    try {
        mostrarPantalla('lobby');
        gameState.estado = 'lobby';

        const gameId = await peerManager.initialize();

        // Mostrar código y generar QR
        elementos.codigoPartida.textContent = gameId;

        const urlJugador = new URL('jugador.html', window.location.href);
        urlJugador.searchParams.set('partida', gameId);
        elementos.urlPartida.value = urlJugador.href;

        // Generar QR
        elementos.qrCode.innerHTML = '';
        qrCodeInstance = new QRCode(elementos.qrCode, {
            text: urlJugador.href,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff"
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        mostrarError('No se pudo iniciar la sesión. Intenta de nuevo.');
        mostrarPantalla('inicio');
    }
}

/**
 * Copia la URL al portapapeles
 */
async function copiarURL() {
    try {
        await navigator.clipboard.writeText(elementos.urlPartida.value);
        elementos.btnCopiarUrl.textContent = '✓ Copiado';
        setTimeout(() => {
            elementos.btnCopiarUrl.textContent = t('copy_url');
        }, 2000);
    } catch (error) {
        elementos.urlPartida.select();
        document.execCommand('copy');
    }
}

/**
 * Maneja un nuevo jugador que se une
 */
function manejarNuevoJugador(jugador) {
    actualizarListaJugadores();

    // Habilitar botón de empezar si hay al menos 1 jugador
    if (peerManager.getPlayers().length >= 1) {
        elementos.btnEmpezarJuego.disabled = false;
    }
}

/**
 * Actualiza la lista de jugadores en el lobby
 */
function actualizarListaJugadores() {
    const jugadores = peerManager.getPlayers();
    elementos.playerCount.textContent = jugadores.length;

    elementos.playersList.innerHTML = jugadores.map(j => `
        <div class="player-card ${!j.conectado ? 'disconnected' : ''}">
            <span class="player-name">${j.nombre}</span>
            <span class="player-points">${j.puntos} pts</span>
        </div>
    `).join('');
}

/**
 * Empieza el juego
 */
function empezarJuego() {
    gameState.estado = 'jugando';

    // Notificar a jugadores
    peerManager.broadcast(Protocol.createGameStartedMessage(gameState.getTotalPreguntas()));

    // Mostrar primera pregunta
    setTimeout(() => mostrarPregunta(), 1000);
}

/**
 * Muestra la pregunta actual
 */
function mostrarPregunta() {
    mostrarPantalla('pregunta');

    const pregunta = gameState.getPreguntaActual();
    const numeroPregunta = gameState.getNumeroPreguntaActual();
    const totalPreguntas = gameState.getTotalPreguntas();
    const tiempo = gameState.getTiempoPreguntaActual();

    // Actualizar UI
    elementos.numPreguntaActual.textContent = numeroPregunta;
    elementos.numPreguntaTotal.textContent = totalPreguntas;
    elementos.textoPregunta.innerHTML = renderizarTexto(pregunta.pregunta);

    // Multimedia
    if (pregunta.multimedia) {
        elementos.multimediaContainer.innerHTML = pregunta.multimedia;
        elementos.multimediaContainer.classList.remove('hidden');
    } else {
        elementos.multimediaContainer.classList.add('hidden');
    }

    // Mostrar opciones
    elementos.respuestasGrid.innerHTML = pregunta.opciones.map((opcion, index) => {
        const letra = String.fromCharCode(65 + index); // A, B, C, D...
        return `
            <div class="answer-option">
                <span class="answer-letter">${letra}</span>
                <span class="answer-text">${renderizarTexto(opcion.texto)}</span>
            </div>
        `;
    }).join('');

    // Resetear contadores
    elementos.responsesCount.textContent = '0';
    elementos.totalPlayers.textContent = peerManager.getPlayers().length;
    elementos.responsesList.innerHTML = '';

    // Enviar pregunta a jugadores
    peerManager.broadcast(Protocol.createQuestionMessage(pregunta, numeroPregunta, totalPreguntas, tiempo));

    // Iniciar temporizador
    gameState.iniciarTemporizador(
        (tiempoRestante) => {
            elementos.tiempoRestante.textContent = tiempoRestante;
        },
        () => {
            finalizarPregunta();
        }
    );
}

/**
 * Maneja la respuesta de un jugador
 */
function manejarRespuestaJugador(jugador) {
    // Actualizar contador
    const numRespuestas = gameState.getNumeroRespuestas();
    elementos.responsesCount.textContent = numRespuestas;

    // Actualizar lista
    elementos.responsesList.innerHTML = Array.from(peerManager.getPlayers())
        .map(j => {
            const haRespondido = gameState.haRespondido(j.peerId);
            return `
                <div class="response-item ${haRespondido ? 'answered' : ''}">
                    <span>${j.nombre}</span>
                    ${haRespondido ? '✓' : '⏳'}
                </div>
            `;
        }).join('');

    // Auto-finalizar si todos respondieron
    if (numRespuestas === peerManager.getPlayers().length) {
        setTimeout(() => finalizarPregunta(), 500);
    }
}

/**
 * Toggle pausa
 */
function togglePausa() {
    if (gameState.pausado) {
        gameState.reanudar();
        elementos.btnPausar.textContent = t('pause');
        peerManager.broadcast(Protocol.createResumeMessage(gameState.tiempoRestante));
    } else {
        gameState.pausar();
        elementos.btnPausar.textContent = t('resume');
        peerManager.broadcast(Protocol.createPauseMessage());
    }
}

/**
 * Finaliza la pregunta actual y muestra resultados
 */
function finalizarPregunta() {
    gameState.detenerTemporizador();

    // Evaluar respuestas y enviar resultados
    const jugadores = peerManager.getPlayers();
    jugadores.forEach(jugador => {
        const respuestaData = gameState.respuestasRonda.get(jugador.peerId);

        if (respuestaData) {
            const evaluacion = gameState.evaluarRespuesta(respuestaData.respuesta);

            // Actualizar puntos del jugador
            jugador.puntos += evaluacion.puntosGanados;
            if (evaluacion.esCorrecta === true) {
                jugador.respuestasCorrectas++;
            }

            // Enviar resultado al jugador
            peerManager.sendToPlayer(
                jugador.peerId,
                Protocol.createResultMessage(
                    evaluacion.esCorrecta,
                    evaluacion.puntosGanados,
                    jugador.puntos,
                    gameState.getRespuestasCorrectas(),
                    evaluacion.feedback
                )
            );
        } else {
            // Sin respuesta
            peerManager.sendToPlayer(
                jugador.peerId,
                Protocol.createResultMessage(false, 0, jugador.puntos, gameState.getRespuestasCorrectas(), '')
            );
        }
    });

    // Mostrar resultados
    setTimeout(() => mostrarResultadosPregunta(), 1000);
}

/**
 * Muestra los resultados de la pregunta
 */
function mostrarResultadosPregunta() {
    mostrarPantalla('resultado-pregunta');

    // Mostrar respuestas correctas
    const correctas = gameState.getRespuestasCorrectas();
    elementos.respuestaCorrectaDisplay.innerHTML = correctas.map(c => {
        const letra = String.fromCharCode(65 + c.index);
        return `<div class="correct-answer-item">
            <span class="answer-letter">${letra}</span>
            <span>${renderizarTexto(c.texto)}</span>
        </div>`;
    }).join('');

    // Estadísticas
    const stats = gameState.getEstadisticasPregunta(peerManager.getPlayers());
    elementos.statCorrect.textContent = stats.correctas;
    elementos.statIncorrect.textContent = stats.incorrectas + stats.sinResponder;

    // Clasificación
    mostrarClasificacion(elementos.leaderboardList);

    // Configurar botón
    if (gameState.hayMasPreguntas()) {
        elementos.btnSiguientePregunta.textContent = t('next_question');
    } else {
        elementos.btnSiguientePregunta.textContent = t('show_final_results');
    }
}

/**
 * Muestra la clasificación
 */
function mostrarClasificacion(container) {
    const jugadores = peerManager.getPlayers()
        .filter(j => j.conectado)
        .sort((a, b) => b.puntos - a.puntos);

    container.innerHTML = jugadores.map((j, index) => `
        <div class="leaderboard-item">
            <span class="position">${index + 1}</span>
            <span class="player-name">${j.nombre}</span>
            <span class="player-score">${j.puntos} pts</span>
        </div>
    `).join('');
}

/**
 * Siguiente pregunta o resultados finales
 */
function siguientePregunta() {
    if (gameState.siguientePregunta()) {
        mostrarPregunta();
    } else {
        mostrarResultadosFinales();
    }
}

/**
 * Muestra los resultados finales
 */
function mostrarResultadosFinales() {
    mostrarPantalla('resultados-finales');
    gameState.estado = 'finalizado';

    const jugadores = peerManager.getPlayers()
        .filter(j => j.conectado)
        .sort((a, b) => b.puntos - a.puntos);

    // Enviar resultados finales a cada jugador
    jugadores.forEach((jugador, index) => {
        peerManager.sendToPlayer(
            jugador.peerId,
            Protocol.createFinalResultMessage(
                jugador.puntos,
                gameState.getTotalPreguntas() * 1000,
                jugador.respuestasCorrectas,
                gameState.getTotalPreguntas(),
                index + 1
            )
        );
    });

    // Mostrar podio (top 3)
    const top3 = jugadores.slice(0, 3);
    elementos.podiumContainer.innerHTML = top3.map((j, i) => {
        const medals = ['🥇', '🥈', '🥉'];
        return `
            <div class="podium-place place-${i + 1}">
                <div class="medal">${medals[i]}</div>
                <div class="player-name">${j.nombre}</div>
                <div class="player-score">${j.puntos} pts</div>
            </div>
        `;
    }).join('');

    // Mostrar clasificación completa
    mostrarClasificacion(elementos.finalLeaderboardList);
}

/**
 * Nueva partida
 */
function nuevaPartida() {
    if (confirm(t('confirm_new_game') || '¿Iniciar una nueva partida?')) {
        location.reload();
    }
}

/**
 * Exportar resultados a CSV
 */
function exportarResultados() {
    const jugadores = peerManager.getPlayers().sort((a, b) => b.puntos - a.puntos);

    const csv = [
        ['Posición', 'Nombre', 'Puntos', 'Respuestas Correctas', 'Total Preguntas'].join(';'),
        ...jugadores.map((j, i) => [
            i + 1,
            j.nombre,
            j.puntos,
            j.respuestasCorrectas,
            gameState.getTotalPreguntas()
        ].join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `giftplay_resultados_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

/**
 * Maneja desconexión de jugador
 */
function manejarDesconexionJugador(jugador) {
    console.log('Jugador desconectado:', jugador.nombre);
    actualizarListaJugadores();
}

/**
 * Maneja errores de PeerJS
 */
function manejarErrorPeer(error) {
    console.error('Error de PeerJS:', error);
    mostrarError('Error de conexión: ' + error.type);
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

function ocultarError() {
    elementos.errorMessage.classList.add('hidden');
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
