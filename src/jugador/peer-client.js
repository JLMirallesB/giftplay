/**
 * Cliente PeerJS para el Jugador
 * Maneja la conexión con el presentador
 */

class PeerClient {
    constructor() {
        this.peer = null;
        this.conn = null;
        this.gameId = null;
        this.nombreJugador = null;
        this.onJoinConfirmedCallback = null;
        this.onGameStartedCallback = null;
        this.onQuestionCallback = null;
        this.onAnswerReceivedCallback = null;
        this.onResultCallback = null;
        this.onFinalResultCallback = null;
        this.onPauseCallback = null;
        this.onResumeCallback = null;
        this.onKickedCallback = null;
        this.onErrorCallback = null;
        this.onDisconnectedCallback = null;
        this.onReconnectingCallback = null;
        this.onReconnectedCallback = null;

        // Configuración de reconexión
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000; // ms inicial
        this.maxReconnectDelay = 10000; // ms máximo
        this.isReconnecting = false;
        this.reconnectTimeout = null;
    }

    /**
     * Conecta al jugador con el presentador
     * @param {string} gameId - Código de la partida
     * @param {string} nombreJugador - Nombre del jugador (incluye emoji)
     * @returns {Promise<void>}
     */
    async connect(gameId, nombreJugador) {
        return new Promise((resolve, reject) => {
            this.gameId = gameId;
            this.nombreJugador = nombreJugador;

            // Usar configuración centralizada (sin credenciales hardcodeadas)
            const peerConfig = PeerConfig.getFullConfig();

            // Crear peer con ID aleatorio
            this.peer = new Peer(null, peerConfig);

            this.peer.on('open', (id) => {
                console.log('Peer del jugador abierto con ID:', id);

                // Conectar al presentador
                this.conn = this.peer.connect(gameId, { reliable: true });

                this.conn.on('open', () => {
                    console.log('Conectado al presentador');
                    // Enviar solicitud de unión
                    this.send(Protocol.createJoinMessage(nombreJugador));
                    resolve();
                });

                this.conn.on('data', (data) => {
                    this.handleHostMessage(data);
                });

                this.conn.on('close', () => {
                    console.log('Conexión con presentador cerrada');
                    if (this.onDisconnectedCallback) {
                        this.onDisconnectedCallback();
                    }
                });

                this.conn.on('error', (err) => {
                    console.error('Error en conexión:', err);
                    if (this.onErrorCallback) {
                        this.onErrorCallback(err);
                    }
                    reject(err);
                });
            });

            this.peer.on('error', (err) => {
                console.error('Error de PeerJS:', err);
                if (this.onErrorCallback) {
                    this.onErrorCallback(err);
                }
                reject(err);
            });

            this.peer.on('disconnected', () => {
                console.log('Peer desconectado');
                // Intentar reconexión automática
                this.attemptReconnect();
            });
        });
    }

    /**
     * Intenta reconectar automáticamente con backoff exponencial
     */
    attemptReconnect() {
        if (this.isReconnecting) return;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Máximo de intentos de reconexión alcanzado');
            this.isReconnecting = false;
            if (this.onDisconnectedCallback) {
                this.onDisconnectedCallback();
            }
            return;
        }

        this.isReconnecting = true;
        this.reconnectAttempts++;

        // Calcular delay con backoff exponencial
        const delay = Math.min(
            this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
            this.maxReconnectDelay
        );

        console.log(`Intentando reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts} en ${delay}ms`);

        if (this.onReconnectingCallback) {
            this.onReconnectingCallback(this.reconnectAttempts, this.maxReconnectAttempts);
        }

        this.reconnectTimeout = setTimeout(async () => {
            try {
                // Intentar reconectar el peer
                if (this.peer && !this.peer.destroyed) {
                    this.peer.reconnect();
                } else {
                    // Si el peer está destruido, crear uno nuevo
                    await this.connect(this.gameId, this.nombreJugador);
                }

                // Reconectar al host
                if (this.peer && this.peer.open) {
                    this.conn = this.peer.connect(this.gameId, { reliable: true });

                    this.conn.on('open', () => {
                        console.log('Reconectado exitosamente al presentador');
                        this.isReconnecting = false;
                        this.reconnectAttempts = 0;

                        // Re-enviar join
                        this.send(Protocol.createJoinMessage(this.nombreJugador));

                        if (this.onReconnectedCallback) {
                            this.onReconnectedCallback();
                        }
                    });

                    this.conn.on('data', (data) => {
                        this.handleHostMessage(data);
                    });

                    this.conn.on('close', () => {
                        console.log('Conexión con presentador cerrada tras reconexión');
                        this.attemptReconnect();
                    });

                    this.conn.on('error', (err) => {
                        console.error('Error en reconexión:', err);
                        this.isReconnecting = false;
                        this.attemptReconnect();
                    });
                } else {
                    this.isReconnecting = false;
                    this.attemptReconnect();
                }
            } catch (error) {
                console.error('Error durante reconexión:', error);
                this.isReconnecting = false;
                this.attemptReconnect();
            }
        }, delay);
    }

    /**
     * Cancela intentos de reconexión
     */
    cancelReconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
    }

    /**
     * Maneja mensajes del presentador
     */
    handleHostMessage(data) {
        console.log('Mensaje del presentador:', data);

        if (!data || !data.tipo) {
            console.error('Mensaje inválido:', data);
            return;
        }

        switch (data.tipo) {
            case Protocol.HOST_TO_PLAYER.JOIN_CONFIRMED:
                if (this.onJoinConfirmedCallback) {
                    this.onJoinConfirmedCallback(data.payload);
                }
                break;

            case Protocol.HOST_TO_PLAYER.GAME_STARTED:
                if (this.onGameStartedCallback) {
                    this.onGameStartedCallback(data.payload);
                }
                break;

            case Protocol.HOST_TO_PLAYER.QUESTION:
                if (this.onQuestionCallback) {
                    this.onQuestionCallback(data.payload);
                }
                break;

            case Protocol.HOST_TO_PLAYER.ANSWER_RECEIVED:
                if (this.onAnswerReceivedCallback) {
                    this.onAnswerReceivedCallback(data.payload);
                }
                break;

            case Protocol.HOST_TO_PLAYER.RESULT:
                if (this.onResultCallback) {
                    this.onResultCallback(data.payload);
                }
                break;

            case Protocol.HOST_TO_PLAYER.FINAL_RESULT:
                if (this.onFinalResultCallback) {
                    this.onFinalResultCallback(data.payload);
                }
                break;

            case Protocol.HOST_TO_PLAYER.PAUSE:
                if (this.onPauseCallback) {
                    this.onPauseCallback(data.payload);
                }
                break;

            case Protocol.HOST_TO_PLAYER.RESUME:
                if (this.onResumeCallback) {
                    this.onResumeCallback(data.payload);
                }
                break;

            case Protocol.HOST_TO_PLAYER.KICKED:
                if (this.onKickedCallback) {
                    this.onKickedCallback(data.payload);
                }
                break;

            case Protocol.HOST_TO_PLAYER.ERROR:
                if (this.onErrorCallback) {
                    this.onErrorCallback(data.payload.mensaje);
                }
                break;

            default:
                console.warn('Tipo de mensaje desconocido:', data.tipo);
        }
    }

    /**
     * Envía un mensaje al presentador
     */
    send(message) {
        if (this.conn && this.conn.open) {
            this.conn.send(message);
        } else {
            console.error('No se puede enviar mensaje - conexión no disponible');
        }
    }

    /**
     * Envía una respuesta al presentador
     * @param {number|number[]} respuesta - Índice(s) de respuesta
     * @param {number} tiempoRespuesta - Tiempo en ms que tardó en responder
     */
    sendAnswer(respuesta, tiempoRespuesta) {
        this.send(Protocol.createAnswerMessage(respuesta, tiempoRespuesta));
    }

    /**
     * Cierra la conexión
     */
    disconnect() {
        this.cancelReconnect();
        if (this.conn) {
            this.conn.close();
        }
        if (this.peer) {
            this.peer.destroy();
        }
    }

    // Setters para callbacks
    onJoinConfirmed(callback) {
        this.onJoinConfirmedCallback = callback;
    }

    onGameStarted(callback) {
        this.onGameStartedCallback = callback;
    }

    onQuestion(callback) {
        this.onQuestionCallback = callback;
    }

    onAnswerReceived(callback) {
        this.onAnswerReceivedCallback = callback;
    }

    onResult(callback) {
        this.onResultCallback = callback;
    }

    onFinalResult(callback) {
        this.onFinalResultCallback = callback;
    }

    onPause(callback) {
        this.onPauseCallback = callback;
    }

    onResume(callback) {
        this.onResumeCallback = callback;
    }

    onKicked(callback) {
        this.onKickedCallback = callback;
    }

    onError(callback) {
        this.onErrorCallback = callback;
    }

    onDisconnected(callback) {
        this.onDisconnectedCallback = callback;
    }

    onReconnecting(callback) {
        this.onReconnectingCallback = callback;
    }

    onReconnected(callback) {
        this.onReconnectedCallback = callback;
    }
}
