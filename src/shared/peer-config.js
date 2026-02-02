/**
 * Configuración de PeerJS
 *
 * IMPORTANTE: Este archivo contiene la configuración de los servidores ICE.
 * Por defecto solo usa STUN (gratuito), que funciona en la mayoría de redes.
 *
 * Si necesitas TURN (para redes muy restrictivas), configura tus propias
 * credenciales en un servicio como:
 * - https://www.metered.ca/tools/openrelay/ (gratuito limitado)
 * - https://xirsys.com/ (de pago)
 * - Tu propio servidor TURN (coturn)
 */

const PeerConfig = {
    // Configuración del servidor PeerJS
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    debug: 1, // Reducido para producción (0=ninguno, 1=errores, 2=warnings, 3=todo)

    /**
     * Obtiene la configuración de servidores ICE
     * Prioriza credenciales de variables de entorno/localStorage si existen
     */
    getIceServers: function() {
        const servers = [
            // STUN gratuitos (funcionan para la mayoría de conexiones)
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun.relay.metered.ca:80' }
        ];

        // Intentar cargar credenciales TURN desde localStorage (configuradas por admin)
        try {
            const turnConfig = localStorage.getItem('giftplay_turn_config');
            if (turnConfig) {
                const parsed = JSON.parse(turnConfig);
                if (parsed.urls && parsed.username && parsed.credential) {
                    servers.push({
                        urls: parsed.urls,
                        username: parsed.username,
                        credential: parsed.credential
                    });
                    console.log('TURN server configurado desde localStorage');
                }
            }
        } catch (e) {
            // Ignorar errores de parsing
        }

        // También verificar si hay configuración global (para despliegues personalizados)
        if (typeof window !== 'undefined' && window.GIFTPLAY_TURN_CONFIG) {
            const cfg = window.GIFTPLAY_TURN_CONFIG;
            if (cfg.urls && cfg.username && cfg.credential) {
                servers.push({
                    urls: cfg.urls,
                    username: cfg.username,
                    credential: cfg.credential
                });
                console.log('TURN server configurado desde window.GIFTPLAY_TURN_CONFIG');
            }
        }

        return servers;
    },

    /**
     * Configura credenciales TURN (para administradores)
     * @param {Object} config - {urls, username, credential}
     */
    setTurnCredentials: function(config) {
        if (config && config.urls && config.username && config.credential) {
            localStorage.setItem('giftplay_turn_config', JSON.stringify(config));
            console.log('Credenciales TURN guardadas. Recarga la página para aplicar.');
            return true;
        }
        return false;
    },

    /**
     * Elimina credenciales TURN configuradas
     */
    clearTurnCredentials: function() {
        localStorage.removeItem('giftplay_turn_config');
        console.log('Credenciales TURN eliminadas. Recarga la página para aplicar.');
    },

    /**
     * Genera la configuración completa para PeerJS
     */
    getFullConfig: function() {
        return {
            host: this.host,
            port: this.port,
            path: this.path,
            secure: this.secure,
            debug: this.debug,
            config: {
                iceServers: this.getIceServers(),
                iceTransportPolicy: 'all'
            }
        };
    }
};

// Export para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PeerConfig;
}
