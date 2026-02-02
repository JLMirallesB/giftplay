/**
 * Gestor de Conexiones PeerJS para el Presentador
 * Maneja todas las conexiones con los jugadores
 */

class PeerManager {
    constructor() {
        this.peer = null;
        this.gameId = null;
        this.connections = new Map(); // Map<peerId, connection>
        this.jugadores = new Map();   // Map<peerId, jugadorData>
        this.onPlayerJoinCallback = null;
        this.onPlayerAnswerCallback = null;
        this.onPlayerDisconnectCallback = null;
        this.onErrorCallback = null;

        // Heartbeat configuration
        this.heartbeatInterval = null;
        this.heartbeatIntervalMs = 5000; // Ping every 5 seconds
        this.heartbeatTimeoutMs = 15000; // Consider disconnected after 15s without pong
        this.lastPongTime = new Map(); // Map<peerId, timestamp>
    }

    /**
     * Inicializa PeerJS y crea una sesión
     * @param {string} existingGameId - ID de juego existente (para recuperación)
     * @returns {Promise<string>} - Game ID
     */
    async initialize(existingGameId = null) {
        return new Promise((resolve, reject) => {
            this.gameId = existingGameId || this.generateGameCode(5);

            // Usar configuración centralizada (sin credenciales hardcodeadas)
            const peerConfig = PeerConfig.getFullConfig();

            this.peer = new Peer(this.gameId, peerConfig);

            this.peer.on('open', (id) => {
                console.log('Peer abierto con ID:', id);
                resolve(id);
            });

            this.peer.on('connection', (conn) => {
                this.handleNewConnection(conn);
            });

            this.peer.on('error', (err) => {
                console.error('Error de PeerJS:', err);
                if (this.onErrorCallback) {
                    this.onErrorCallback(err);
                }
                reject(err);
            });

            this.peer.on('close', () => {
                console.log('Conexión PeerJS cerrada');
            });
        });
    }

    /**
     * Maneja una nueva conexión de jugador
     */
    handleNewConnection(conn) {
        console.log('Nueva conexión:', conn.peer);

        conn.on('open', () => {
            this.connections.set(conn.peer, conn);
            console.log('Conexión abierta con:', conn.peer);
        });

        conn.on('data', (data) => {
            this.handlePlayerMessage(conn.peer, data);
        });

        conn.on('close', () => {
            this.handlePlayerDisconnect(conn.peer);
        });

        conn.on('error', (err) => {
            console.error('Error en conexión con', conn.peer, err);
        });
    }

    /**
     * Maneja mensajes de un jugador
     */
    handlePlayerMessage(peerId, data) {
        console.log('Mensaje de', peerId, ':', data);

        if (!data || !data.tipo) {
            console.error('Mensaje inválido:', data);
            return;
        }

        switch (data.tipo) {
            case Protocol.PLAYER_TO_HOST.JOIN:
                this.handlePlayerJoin(peerId, data.payload);
                break;

            case Protocol.PLAYER_TO_HOST.ANSWER:
                this.handlePlayerAnswer(peerId, data.payload);
                break;

            case Protocol.PLAYER_TO_HOST.DISCONNECT:
                this.handlePlayerDisconnect(peerId);
                break;

            case Protocol.PLAYER_TO_HOST.PONG:
                this.handlePong(peerId, data.payload);
                break;

            default:
                console.warn('Tipo de mensaje desconocido:', data.tipo);
        }
    }

    /**
     * Maneja la respuesta PONG de un jugador
     */
    handlePong(peerId, payload) {
        this.lastPongTime.set(peerId, Date.now());
        const jugador = this.jugadores.get(peerId);
        if (jugador && !jugador.conectado) {
            // Reconnected
            jugador.conectado = true;
            console.log(`Jugador ${jugador.nombre} reconectado (heartbeat)`);
        }
    }

    /**
     * Inicia el sistema de heartbeat
     */
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
            this.checkHeartbeatTimeouts();
        }, this.heartbeatIntervalMs);

        console.log('Heartbeat iniciado');
    }

    /**
     * Detiene el sistema de heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        console.log('Heartbeat detenido');
    }

    /**
     * Envía ping a todos los jugadores conectados
     */
    sendHeartbeat() {
        const pingMessage = Protocol.createPingMessage();
        this.connections.forEach((conn, peerId) => {
            if (conn.open) {
                conn.send(pingMessage);
            }
        });
    }

    /**
     * Verifica timeouts de heartbeat y marca jugadores como desconectados
     */
    checkHeartbeatTimeouts() {
        const now = Date.now();
        this.jugadores.forEach((jugador, peerId) => {
            if (!jugador.conectado) return;

            const lastPong = this.lastPongTime.get(peerId);
            if (lastPong && (now - lastPong) > this.heartbeatTimeoutMs) {
                console.log(`Jugador ${jugador.nombre} no responde al heartbeat`);
                jugador.conectado = false;
                if (this.onPlayerDisconnectCallback) {
                    this.onPlayerDisconnectCallback(jugador);
                }
            }
        });
    }

    /**
     * Maneja la solicitud de unión de un jugador
     */
    handlePlayerJoin(peerId, payload) {
        const nombre = payload.nombre;

        // Verificar si es una reconexión (mismo nombre pero desconectado)
        const jugadorExistente = Array.from(this.jugadores.entries()).find(
            ([_, j]) => j.nombre === nombre
        );

        if (jugadorExistente) {
            const [oldPeerId, jugador] = jugadorExistente;

            // Es una reconexión - actualizar el peerId
            if (!jugador.conectado) {
                console.log(`Jugador ${nombre} reconectándose con nuevo peerId`);

                // Remover la entrada vieja y crear una nueva con el nuevo peerId
                this.jugadores.delete(oldPeerId);
                this.connections.delete(oldPeerId);
                this.lastPongTime.delete(oldPeerId);

                jugador.peerId = peerId;
                jugador.conectado = true;

                this.jugadores.set(peerId, jugador);
                this.lastPongTime.set(peerId, Date.now());

                // Confirmar unión
                this.sendToPlayer(peerId, Protocol.createJoinConfirmedMessage(
                    this.getConnectedPlayersCount()
                ));

                // Notificar reconexión
                if (this.onPlayerJoinCallback) {
                    this.onPlayerJoinCallback(jugador, true); // true = reconexión
                }

                console.log(`Jugador ${nombre} reconectado. Puntos: ${jugador.puntos}`);
                return;
            } else {
                // El nombre ya está en uso por alguien conectado
                this.sendToPlayer(peerId, Protocol.createErrorMessage('El nombre ya está en uso'));
                return;
            }
        }

        // Nuevo jugador
        const jugador = {
            peerId: peerId,
            nombre: nombre,
            puntos: 0,
            respuestasCorrectas: 0,
            conectado: true,
            respuestaActual: null,
            tiempoRespuesta: null
        };

        this.jugadores.set(peerId, jugador);
        this.lastPongTime.set(peerId, Date.now()); // Initialize heartbeat tracking

        // Start heartbeat if first player
        if (this.jugadores.size === 1) {
            this.startHeartbeat();
        }

        // Confirmar unión
        this.sendToPlayer(peerId, Protocol.createJoinConfirmedMessage(this.jugadores.size));

        // Notificar al presentador
        if (this.onPlayerJoinCallback) {
            this.onPlayerJoinCallback(jugador, false); // false = nuevo jugador
        }

        console.log(`Jugador ${nombre} unido. Total: ${this.jugadores.size}`);
    }

    /**
     * Obtiene el número de jugadores conectados
     */
    getConnectedPlayersCount() {
        return Array.from(this.jugadores.values()).filter(j => j.conectado).length;
    }

    /**
     * Maneja la respuesta de un jugador
     */
    handlePlayerAnswer(peerId, payload) {
        const jugador = this.jugadores.get(peerId);
        if (!jugador) {
            console.error('Jugador no encontrado:', peerId);
            return;
        }

        jugador.respuestaActual = payload.respuesta;
        jugador.tiempoRespuesta = payload.tiempoRespuesta;

        // Confirmar recepción
        this.sendToPlayer(peerId, Protocol.createAnswerReceivedMessage());

        // Notificar al presentador
        if (this.onPlayerAnswerCallback) {
            this.onPlayerAnswerCallback(jugador);
        }
    }

    /**
     * Maneja la desconexión de un jugador
     */
    handlePlayerDisconnect(peerId) {
        const jugador = this.jugadores.get(peerId);
        if (jugador) {
            jugador.conectado = false;
            console.log(`Jugador ${jugador.nombre} desconectado`);

            if (this.onPlayerDisconnectCallback) {
                this.onPlayerDisconnectCallback(jugador);
            }
        }

        this.connections.delete(peerId);
    }

    /**
     * Envía un mensaje a un jugador específico
     */
    sendToPlayer(peerId, message) {
        const conn = this.connections.get(peerId);
        if (conn && conn.open) {
            conn.send(message);
        } else {
            console.error('No se puede enviar mensaje a', peerId, '- conexión no disponible');
        }
    }

    /**
     * Envía un mensaje a todos los jugadores
     */
    broadcast(message) {
        this.connections.forEach((conn, peerId) => {
            if (conn.open) {
                conn.send(message);
            }
        });
    }

    /**
     * Expulsa a un jugador
     */
    kickPlayer(peerId, razon) {
        this.sendToPlayer(peerId, Protocol.createKickedMessage(razon));
        const conn = this.connections.get(peerId);
        if (conn) {
            setTimeout(() => conn.close(), 1000);
        }
        this.handlePlayerDisconnect(peerId);
    }

    /**
     * Obtiene lista de jugadores
     */
    getPlayers() {
        return Array.from(this.jugadores.values());
    }

    /**
     * Obtiene un jugador por ID
     */
    getPlayer(peerId) {
        return this.jugadores.get(peerId);
    }

    /**
     * Limpia las respuestas actuales de todos los jugadores
     */
    clearAnswers() {
        this.jugadores.forEach(jugador => {
            jugador.respuestaActual = null;
            jugador.tiempoRespuesta = null;
        });
    }

    /**
     * Genera un código de juego aleatorio
     */
    generateGameCode(length = 5) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Cierra todas las conexiones y destruye el peer
     */
    destroy() {
        this.stopHeartbeat();
        this.lastPongTime.clear();
        this.connections.forEach(conn => conn.close());
        this.connections.clear();
        this.jugadores.clear();
        if (this.peer) {
            this.peer.destroy();
        }
    }

    // Setters para callbacks
    onPlayerJoin(callback) {
        this.onPlayerJoinCallback = callback;
    }

    onPlayerAnswer(callback) {
        this.onPlayerAnswerCallback = callback;
    }

    onPlayerDisconnect(callback) {
        this.onPlayerDisconnectCallback = callback;
    }

    onError(callback) {
        this.onErrorCallback = callback;
    }
}
