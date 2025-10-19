/**
 * Gestión del Estado del Juego
 * Maneja el estado de las preguntas, puntuaciones y progreso del juego
 */

class GameState {
    constructor() {
        this.cuestionario = [];
        this.preguntaActualIndex = 0;
        this.tiempoPorDefecto = 30;
        this.tiempoRestante = 0;
        this.timerInterval = null;
        this.tiempoInicioPregunta = null;
        this.pausado = false;
        this.estado = 'inicio'; // inicio, lobby, jugando, resultado, finalizado
        this.respuestasRonda = new Map(); // Map<peerId, respuestaData>
    }

    /**
     * Carga el cuestionario desde un array de preguntas parseadas
     */
    cargarCuestionario(preguntas, tiempoPorDefecto = 30) {
        this.cuestionario = preguntas;
        this.tiempoPorDefecto = tiempoPorDefecto;
        this.preguntaActualIndex = 0;
    }

    /**
     * Obtiene la pregunta actual
     */
    getPreguntaActual() {
        return this.cuestionario[this.preguntaActualIndex];
    }

    /**
     * Obtiene el número de la pregunta actual (1-based)
     */
    getNumeroPreguntaActual() {
        return this.preguntaActualIndex + 1;
    }

    /**
     * Obtiene el total de preguntas
     */
    getTotalPreguntas() {
        return this.cuestionario.length;
    }

    /**
     * Verifica si hay más preguntas
     */
    hayMasPreguntas() {
        return this.preguntaActualIndex < this.cuestionario.length - 1;
    }

    /**
     * Avanza a la siguiente pregunta
     */
    siguientePregunta() {
        if (this.hayMasPreguntas()) {
            this.preguntaActualIndex++;
            this.limpiarRespuestas();
            return true;
        }
        return false;
    }

    /**
     * Obtiene el tiempo para la pregunta actual
     */
    getTiempoPreguntaActual() {
        const pregunta = this.getPreguntaActual();
        return pregunta.tiempo || this.tiempoPorDefecto;
    }

    /**
     * Inicia el temporizador de la pregunta actual
     */
    iniciarTemporizador(onTick, onTimeout) {
        this.tiempoRestante = this.getTiempoPreguntaActual();
        this.tiempoInicioPregunta = Date.now();
        this.pausado = false;

        this.timerInterval = setInterval(() => {
            if (!this.pausado) {
                this.tiempoRestante--;

                if (onTick) {
                    onTick(this.tiempoRestante);
                }

                if (this.tiempoRestante <= 0) {
                    this.detenerTemporizador();
                    if (onTimeout) {
                        onTimeout();
                    }
                }
            }
        }, 1000);
    }

    /**
     * Detiene el temporizador
     */
    detenerTemporizador() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Pausa el temporizador
     */
    pausar() {
        this.pausado = true;
    }

    /**
     * Reanuda el temporizador
     */
    reanudar() {
        this.pausado = false;
    }

    /**
     * Registra una respuesta de un jugador
     */
    registrarRespuesta(peerId, respuesta, tiempoRespuesta) {
        this.respuestasRonda.set(peerId, {
            respuesta: respuesta,
            tiempoRespuesta: tiempoRespuesta,
            timestamp: Date.now()
        });
    }

    /**
     * Verifica si un jugador ya respondió
     */
    haRespondido(peerId) {
        return this.respuestasRonda.has(peerId);
    }

    /**
     * Obtiene el número de respuestas recibidas
     */
    getNumeroRespuestas() {
        return this.respuestasRonda.size;
    }

    /**
     * Limpia las respuestas de la ronda actual
     */
    limpiarRespuestas() {
        this.respuestasRonda.clear();
    }

    /**
     * Evalúa la respuesta de un jugador
     * @returns {object} { esCorrecta, puntosGanados, feedback }
     */
    evaluarRespuesta(respuesta) {
        const pregunta = this.getPreguntaActual();
        const opciones = pregunta.opciones;

        if (pregunta.tipo === 'true-false' || pregunta.tipo === 'multiple-choice-single') {
            // Respuesta única
            const opcionSeleccionada = opciones[respuesta];
            if (!opcionSeleccionada) {
                return { esCorrecta: false, puntosGanados: 0, feedback: '' };
            }

            return {
                esCorrecta: opcionSeleccionada.correcta,
                puntosGanados: opcionSeleccionada.correcta ? 1000 : 0,
                feedback: opcionSeleccionada.feedback || ''
            };
        } else if (pregunta.tipo === 'multiple-choice-multiple') {
            // Respuesta múltiple con ponderación
            if (!Array.isArray(respuesta)) {
                return { esCorrecta: false, puntosGanados: 0, feedback: '' };
            }

            let puntosTotales = 0;
            let feedbacks = [];

            respuesta.forEach(index => {
                const opcion = opciones[index];
                if (opcion) {
                    puntosTotales += opcion.peso;
                    if (opcion.feedback) {
                        feedbacks.push(opcion.feedback);
                    }
                }
            });

            // Verificar que seleccionó todas las correctas y ninguna incorrecta
            const correctasSeleccionadas = respuesta.filter(i => opciones[i]?.correcta).length;
            const totalCorrectas = opciones.filter(o => o.correcta).length;
            const incorrectasSeleccionadas = respuesta.filter(i => !opciones[i]?.correcta).length;

            const esCompletamenteCorrecta = correctasSeleccionadas === totalCorrectas && incorrectasSeleccionadas === 0;

            return {
                esCorrecta: esCompletamenteCorrecta ? true : (puntosTotales > 0 ? puntosTotales : false),
                puntosGanados: Math.max(0, puntosTotales) * 10, // Escalar puntos
                feedback: feedbacks.join(' | ')
            };
        }

        return { esCorrecta: false, puntosGanados: 0, feedback: '' };
    }

    /**
     * Obtiene las respuestas correctas de la pregunta actual
     */
    getRespuestasCorrectas() {
        const pregunta = this.getPreguntaActual();
        return pregunta.opciones
            .map((opcion, index) => ({ ...opcion, index }))
            .filter(opcion => opcion.correcta);
    }

    /**
     * Calcula estadísticas de la pregunta actual
     */
    getEstadisticasPregunta(jugadores) {
        const stats = {
            correctas: 0,
            incorrectas: 0,
            sinResponder: 0,
            distribucioRespuestas: {}
        };

        jugadores.forEach(jugador => {
            const respuestaData = this.respuestasRonda.get(jugador.peerId);

            if (!respuestaData) {
                stats.sinResponder++;
            } else {
                const evaluacion = this.evaluarRespuesta(respuestaData.respuesta);
                if (evaluacion.esCorrecta === true) {
                    stats.correctas++;
                } else {
                    stats.incorrectas++;
                }

                // Contar distribución de respuestas
                const resp = Array.isArray(respuestaData.respuesta)
                    ? respuestaData.respuesta.join(',')
                    : respuestaData.respuesta;

                stats.distribucioRespuestas[resp] = (stats.distribucioRespuestas[resp] || 0) + 1;
            }
        });

        return stats;
    }

    /**
     * Guarda el estado del juego en localStorage
     */
    guardarEstado(gameId, jugadores) {
        const estado = {
            gameId: gameId,
            cuestionario: this.cuestionario,
            preguntaActualIndex: this.preguntaActualIndex,
            tiempoPorDefecto: this.tiempoPorDefecto,
            estado: this.estado,
            jugadores: Array.from(jugadores.values()).map(j => ({
                nombre: j.nombre,
                puntos: j.puntos,
                respuestasCorrectas: j.respuestasCorrectas
            }))
        };

        localStorage.setItem('giftplay_estado_partida', JSON.stringify(estado));
    }

    /**
     * Recupera el estado del juego desde localStorage
     */
    static recuperarEstado() {
        const estadoJSON = localStorage.getItem('giftplay_estado_partida');
        if (!estadoJSON) return null;

        try {
            return JSON.parse(estadoJSON);
        } catch (e) {
            console.error('Error al recuperar estado:', e);
            return null;
        }
    }

    /**
     * Limpia el estado guardado
     */
    static limpiarEstadoGuardado() {
        localStorage.removeItem('giftplay_estado_partida');
    }
}
