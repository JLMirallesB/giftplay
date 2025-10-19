/**
 * Cliente PeerJS para el Jugador
 * Maneja la conexión con el presentador
 */

class PeerClient {
    constructor() {
        this.peer = null;
        this.conn = null;
        this.gameId = null;
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

            const peerConfig = {
                host: '0.peerjs.com',
                port: 443,
                path: '/',
                secure: true,
                debug: 2,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.relay.metered.ca:80' },
                        {
                            urls: 'turn:standard.relay.metered.ca:80',
                            username: '9745e21b303bdaea589c29bc',
                            credential: 'UgG56tBqCEGNjzLY'
                        },
                        {
                            urls: 'turn:standard.relay.metered.ca:443?transport=tcp',
                            username: '9745e21b303bdaea589c29bc',
                            credential: 'UgG56tBqCEGNjzLY'
                        }
                    ],
                    iceTransportPolicy: 'all'
                }
            };

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
                if (this.onDisconnectedCallback) {
                    this.onDisconnectedCallback();
                }
            });
        });
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
}
