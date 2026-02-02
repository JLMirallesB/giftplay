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

    // Inicio - Toggle y secciones
    elementos.btnModeFile = document.getElementById('btn-mode-file');
    elementos.btnModeText = document.getElementById('btn-mode-text');
    elementos.fileUploadSection = document.getElementById('file-upload-section');
    elementos.textInputSection = document.getElementById('text-input-section');

    // Inicio - Inputs
    elementos.giftFileInput = document.getElementById('gift-file-input');
    elementos.giftTextInput = document.getElementById('gift-text-input');
    elementos.btnProcessText = document.getElementById('btn-process-text');
    elementos.fileInfo = document.getElementById('file-info');
    elementos.fileName = document.getElementById('file-name');
    elementos.fileQuestions = document.getElementById('file-questions');
    elementos.tiempoPregunta = document.getElementById('tiempo-pregunta');
    elementos.btnEmpezarSesion = document.getElementById('btn-empezar-sesion');
    elementos.errorMessage = document.getElementById('error-message');

    // Visualizador de preguntas
    elementos.questionsPreview = document.getElementById('questions-preview');
    elementos.questionsList = document.getElementById('questions-list');
    elementos.btnTogglePreview = document.getElementById('btn-toggle-preview');

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
    // Inicio - Toggle
    elementos.btnModeFile.addEventListener('click', () => cambiarModoEntrada('file'));
    elementos.btnModeText.addEventListener('click', () => cambiarModoEntrada('text'));

    // Inicio - Inputs
    elementos.giftFileInput.addEventListener('change', manejarArchivoGIFT);
    elementos.btnProcessText.addEventListener('click', manejarTextoGIFT);
    elementos.btnEmpezarSesion.addEventListener('click', empezarSesion);

    // Visualizador
    elementos.btnTogglePreview.addEventListener('click', togglePreview);

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
 * Cambia entre modo de subir archivo y pegar texto
 */
function cambiarModoEntrada(modo) {
    if (modo === 'file') {
        elementos.btnModeFile.classList.add('active');
        elementos.btnModeText.classList.remove('active');
        elementos.fileUploadSection.classList.remove('hidden');
        elementos.textInputSection.classList.add('hidden');
    } else {
        elementos.btnModeText.classList.add('active');
        elementos.btnModeFile.classList.remove('active');
        elementos.textInputSection.classList.remove('hidden');
        elementos.fileUploadSection.classList.add('hidden');
    }

    // Limpiar estado
    elementos.fileInfo.classList.add('hidden');
    elementos.questionsPreview.classList.add('hidden');
    elementos.btnEmpezarSesion.disabled = true;
    ocultarError();
}

/**
 * Maneja la carga del archivo GIFT
 */
async function manejarArchivoGIFT(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const texto = await file.text();
        procesarTextoGIFT(texto, file.name);
    } catch (error) {
        console.error('Error al leer archivo GIFT:', error);
        mostrarError('Error al leer el archivo: ' + error.message);
    }
}

/**
 * Maneja el texto GIFT pegado directamente
 */
function manejarTextoGIFT() {
    const texto = elementos.giftTextInput.value.trim();

    if (!texto) {
        mostrarError('Por favor, pega el texto en formato GIFT');
        return;
    }

    procesarTextoGIFT(texto, 'Texto pegado');
}

/**
 * Procesa el texto GIFT (común para archivo y texto pegado)
 */
function procesarTextoGIFT(texto, nombre) {
    try {
        const preguntas = giftParser.parse(texto);

        if (preguntas.length === 0) {
            mostrarError('El texto no contiene preguntas válidas en formato GIFT');
            return;
        }

        const validacion = giftParser.validate();
        if (!validacion.valid) {
            mostrarError('Errores en el formato GIFT:\n' + validacion.errors.join('\n'));
            return;
        }

        // Mostrar info del archivo/texto
        elementos.fileName.textContent = nombre;
        elementos.fileQuestions.textContent = `${preguntas.length} pregunta(s)`;
        elementos.fileInfo.classList.remove('hidden');
        elementos.btnEmpezarSesion.disabled = false;

        // Guardar preguntas
        gameState.cargarCuestionario(preguntas, parseInt(elementos.tiempoPregunta.value));

        // Mostrar visualizador de preguntas
        mostrarVisualizadorPreguntas(preguntas);

        ocultarError();
    } catch (error) {
        console.error('Error al procesar texto GIFT:', error);
        mostrarError('Error al procesar el texto: ' + error.message);
    }
}

/**
 * Muestra el visualizador de preguntas
 */
function mostrarVisualizadorPreguntas(preguntas) {
    elementos.questionsPreview.classList.remove('hidden');
    renderizarListaPreguntas(preguntas);
}

/**
 * Renderiza la lista de preguntas en el visualizador
 */
function renderizarListaPreguntas(preguntas) {
    elementos.questionsList.innerHTML = preguntas.map((pregunta, index) => {
        const titulo = pregunta.titulo || pregunta.pregunta.substring(0, 60) + (pregunta.pregunta.length > 60 ? '...' : '');
        const tipo = obtenerNombreTipo(pregunta.tipo);
        const tipoClass = pregunta.tipo;

        return `
            <div class="question-item" draggable="true" data-index="${index}">
                <span class="drag-handle">⋮⋮</span>
                <span class="question-number">${index + 1}</span>
                <div class="question-info">
                    <div class="question-title">${titulo}</div>
                    <div class="question-type">
                        <span class="type-badge ${tipoClass}">${tipo}</span>
                        <span>${pregunta.opciones.length} opción(es)</span>
                    </div>
                </div>
                <div class="question-controls">
                    <button class="btn-reorder" onclick="moverPregunta(${index}, -1)" ${index === 0 ? 'disabled' : ''}>▲</button>
                    <button class="btn-reorder" onclick="moverPregunta(${index}, 1)" ${index === preguntas.length - 1 ? 'disabled' : ''}>▼</button>
                </div>
            </div>
        `;
    }).join('');

    // Agregar eventos de drag and drop
    agregarEventosDragDrop();
}

/**
 * Obtiene el nombre legible del tipo de pregunta
 */
function obtenerNombreTipo(tipo) {
    const tipos = {
        'true-false': 'V/F',
        'multiple-choice-single': 'Opción Única',
        'multiple-choice-multiple': 'Opción Múltiple',
        'short-answer': 'Respuesta Corta',
        'numerical': 'Numérica',
        'essay': 'Ensayo'
    };
    return tipos[tipo] || tipo;
}

/**
 * Mueve una pregunta arriba o abajo
 */
function moverPregunta(index, direccion) {
    const preguntas = gameState.cuestionario;
    const newIndex = index + direccion;

    if (newIndex < 0 || newIndex >= preguntas.length) return;

    // Intercambiar preguntas
    [preguntas[index], preguntas[newIndex]] = [preguntas[newIndex], preguntas[index]];

    // Re-renderizar
    renderizarListaPreguntas(preguntas);
}

/**
 * Agrega eventos de drag and drop a los items
 */
function agregarEventosDragDrop() {
    const items = elementos.questionsList.querySelectorAll('.question-item');

    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
    });
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');

    // Remover todas las clases drag-over
    const items = elementos.questionsList.querySelectorAll('.question-item');
    items.forEach(item => item.classList.remove('drag-over'));
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (this !== draggedElement) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (draggedElement !== this) {
        const fromIndex = parseInt(draggedElement.dataset.index);
        const toIndex = parseInt(this.dataset.index);

        // Mover en el array
        const preguntas = gameState.cuestionario;
        const [removed] = preguntas.splice(fromIndex, 1);
        preguntas.splice(toIndex, 0, removed);

        // Re-renderizar
        renderizarListaPreguntas(preguntas);
    }

    return false;
}

/**
 * Toggle del visualizador (colapsar/expandir)
 */
function togglePreview() {
    elementos.questionsPreview.classList.toggle('collapsed');
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

    // Sanitizar nombres de jugadores para prevenir XSS
    elementos.playersList.innerHTML = jugadores.map(j => `
        <div class="player-card ${!j.conectado ? 'disconnected' : ''}">
            <span class="player-name">${Sanitize.sanitizePlayerName(j.nombre)}</span>
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

    // Multimedia (sanitizado para prevenir XSS)
    if (pregunta.multimedia) {
        elementos.multimediaContainer.innerHTML = Sanitize.sanitizeMultimedia(pregunta.multimedia);
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
    // CRÍTICO: Registrar la respuesta en gameState
    gameState.registrarRespuesta(jugador.peerId, jugador.respuestaActual, jugador.tiempoRespuesta);

    // Actualizar contador
    const numRespuestas = gameState.getNumeroRespuestas();
    elementos.responsesCount.textContent = numRespuestas;

    // Actualizar lista (nombres sanitizados)
    elementos.responsesList.innerHTML = Array.from(peerManager.getPlayers())
        .map(j => {
            const haRespondido = gameState.haRespondido(j.peerId);
            return `
                <div class="response-item ${haRespondido ? 'answered' : ''}">
                    <span>${Sanitize.sanitizePlayerName(j.nombre)}</span>
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

    // Sanitizar nombres para prevenir XSS
    container.innerHTML = jugadores.map((j, index) => `
        <div class="leaderboard-item">
            <span class="position">${index + 1}</span>
            <span class="player-name">${Sanitize.sanitizePlayerName(j.nombre)}</span>
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

    // Mostrar podio (top 3) - nombres sanitizados
    const top3 = jugadores.slice(0, 3);
    elementos.podiumContainer.innerHTML = top3.map((j, i) => {
        const medals = ['🥇', '🥈', '🥉'];
        return `
            <div class="podium-place place-${i + 1}">
                <div class="medal">${medals[i]}</div>
                <div class="player-name">${Sanitize.sanitizePlayerName(j.nombre)}</div>
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
