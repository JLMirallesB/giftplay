/**
 * Protocolo de comunicación entre Presentador y Jugadores
 *
 * Define todos los tipos de mensajes intercambiados vía PeerJS
 */

const Protocol = {
    // Tipos de mensajes del Jugador → Presentador
    PLAYER_TO_HOST: {
        JOIN: 'join',                    // Solicitar unirse a la partida
        ANSWER: 'answer',                // Enviar respuesta
        DISCONNECT: 'disconnect'         // Notificar desconexión
    },

    // Tipos de mensajes del Presentador → Jugador
    HOST_TO_PLAYER: {
        JOIN_CONFIRMED: 'join_confirmed',           // Confirmación de entrada
        GAME_STARTED: 'game_started',               // La partida ha comenzado
        QUESTION: 'question',                       // Nueva pregunta
        ANSWER_RECEIVED: 'answer_received',         // Respuesta recibida (confirmación)
        RESULT: 'result',                           // Resultado de la pregunta actual
        FINAL_RESULT: 'final_result',               // Resultados finales
        PAUSE: 'pause',                             // Pausar la pregunta
        RESUME: 'resume',                           // Reanudar la pregunta
        KICKED: 'kicked',                           // Jugador expulsado
        ERROR: 'error'                              // Error
    },

    /**
     * Crea un mensaje JOIN
     * @param {string} nombre - Nombre del jugador (incluye emoji)
     */
    createJoinMessage(nombre) {
        return {
            tipo: this.PLAYER_TO_HOST.JOIN,
            payload: { nombre }
        };
    },

    /**
     * Crea un mensaje ANSWER
     * @param {number|number[]} respuesta - Índice(s) de respuesta(s) seleccionada(s)
     * @param {number} tiempoRespuesta - Tiempo en ms que tardó en responder
     */
    createAnswerMessage(respuesta, tiempoRespuesta) {
        return {
            tipo: this.PLAYER_TO_HOST.ANSWER,
            payload: {
                respuesta,
                tiempoRespuesta
            }
        };
    },

    /**
     * Crea un mensaje JOIN_CONFIRMED
     * @param {number} jugadoresConectados - Número de jugadores conectados
     */
    createJoinConfirmedMessage(jugadoresConectados) {
        return {
            tipo: this.HOST_TO_PLAYER.JOIN_CONFIRMED,
            payload: { jugadoresConectados }
        };
    },

    /**
     * Crea un mensaje GAME_STARTED
     * @param {number} totalPreguntas - Número total de preguntas
     */
    createGameStartedMessage(totalPreguntas) {
        return {
            tipo: this.HOST_TO_PLAYER.GAME_STARTED,
            payload: { totalPreguntas }
        };
    },

    /**
     * Crea un mensaje QUESTION
     * @param {object} pregunta - Objeto pregunta
     * @param {number} numeroPregunta - Número de la pregunta actual (1-based)
     * @param {number} totalPreguntas - Total de preguntas
     * @param {number} tiempo - Tiempo en segundos para responder
     */
    createQuestionMessage(pregunta, numeroPregunta, totalPreguntas, tiempo) {
        return {
            tipo: this.HOST_TO_PLAYER.QUESTION,
            payload: {
                pregunta: pregunta.pregunta,
                opciones: pregunta.opciones.map(o => ({
                    texto: o.texto
                    // NO enviar si es correcta, peso, etc.
                })),
                tipo: pregunta.tipo,
                multimedia: pregunta.multimedia,
                numeroPregunta,
                totalPreguntas,
                tiempo
            }
        };
    },

    /**
     * Crea un mensaje ANSWER_RECEIVED
     */
    createAnswerReceivedMessage() {
        return {
            tipo: this.HOST_TO_PLAYER.ANSWER_RECEIVED,
            payload: {}
        };
    },

    /**
     * Crea un mensaje RESULT
     * @param {boolean|number} esCorrecta - true/false para binario, 0-100 para ponderado
     * @param {number} puntosGanados - Puntos ganados en esta pregunta
     * @param {number} puntosTotal - Puntos totales acumulados
     * @param {object} respuestaCorrecta - Info de la(s) respuesta(s) correcta(s)
     * @param {string} feedback - Feedback de la respuesta
     */
    createResultMessage(esCorrecta, puntosGanados, puntosTotal, respuestaCorrecta, feedback = '') {
        return {
            tipo: this.HOST_TO_PLAYER.RESULT,
            payload: {
                esCorrecta,
                puntosGanados,
                puntosTotal,
                respuestaCorrecta,
                feedback
            }
        };
    },

    /**
     * Crea un mensaje FINAL_RESULT
     * @param {number} puntuacionFinal - Puntos totales del jugador
     * @param {number} puntuacionMaxima - Puntos máximos posibles
     * @param {number} respuestasCorrectas - Número de respuestas correctas
     * @param {number} totalPreguntas - Total de preguntas
     * @param {number} posicion - Posición en el ranking (1-based)
     */
    createFinalResultMessage(puntuacionFinal, puntuacionMaxima, respuestasCorrectas, totalPreguntas, posicion) {
        return {
            tipo: this.HOST_TO_PLAYER.FINAL_RESULT,
            payload: {
                puntuacionFinal,
                puntuacionMaxima,
                respuestasCorrectas,
                totalPreguntas,
                posicion
            }
        };
    },

    /**
     * Crea un mensaje PAUSE
     */
    createPauseMessage() {
        return {
            tipo: this.HOST_TO_PLAYER.PAUSE,
            payload: {}
        };
    },

    /**
     * Crea un mensaje RESUME
     * @param {number} tiempoRestante - Tiempo restante en segundos
     */
    createResumeMessage(tiempoRestante) {
        return {
            tipo: this.HOST_TO_PLAYER.RESUME,
            payload: { tiempoRestante }
        };
    },

    /**
     * Crea un mensaje KICKED
     * @param {string} razon - Razón de la expulsión
     */
    createKickedMessage(razon = 'Expulsado por el presentador') {
        return {
            tipo: this.HOST_TO_PLAYER.KICKED,
            payload: { razon }
        };
    },

    /**
     * Crea un mensaje ERROR
     * @param {string} mensaje - Mensaje de error
     */
    createErrorMessage(mensaje) {
        return {
            tipo: this.HOST_TO_PLAYER.ERROR,
            payload: { mensaje }
        };
    }
};

// Export para usar en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Protocol;
}
