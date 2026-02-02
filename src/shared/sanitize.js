/**
 * Utilidades de Sanitización para prevenir XSS
 * GIFTPlay - Seguridad
 */

const Sanitize = {
    /**
     * Escapa caracteres HTML peligrosos
     * Usar para cualquier texto que provenga de usuarios o archivos externos
     * @param {string} text - Texto a escapar
     * @returns {string} - Texto escapado
     */
    escapeHTML(text) {
        if (text === null || text === undefined) return '';
        const str = String(text);
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;',
            '`': '&#x60;'
        };
        return str.replace(/[&<>"'`\/]/g, char => escapeMap[char]);
    },

    /**
     * Sanitiza contenido multimedia embebido (img, video, audio, iframe)
     * Solo permite atributos seguros y fuentes conocidas
     * @param {string} html - HTML con multimedia
     * @returns {string} - HTML sanitizado
     */
    sanitizeMultimedia(html) {
        if (!html) return '';

        // Crear un elemento temporal para parsear el HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Lista de etiquetas permitidas
        const allowedTags = ['img', 'video', 'audio', 'iframe', 'source'];

        // Lista de atributos permitidos por etiqueta
        const allowedAttrs = {
            img: ['src', 'alt', 'width', 'height', 'class', 'style'],
            video: ['src', 'width', 'height', 'controls', 'autoplay', 'muted', 'loop', 'poster', 'class', 'style'],
            audio: ['src', 'controls', 'autoplay', 'muted', 'loop', 'class', 'style'],
            iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'allow', 'class', 'style'],
            source: ['src', 'type']
        };

        // Dominios permitidos para iframes
        const allowedIframeDomains = [
            'youtube.com',
            'www.youtube.com',
            'youtube-nocookie.com',
            'www.youtube-nocookie.com',
            'youtu.be',
            'vimeo.com',
            'player.vimeo.com',
            'dailymotion.com',
            'www.dailymotion.com'
        ];

        // Procesar todos los elementos
        const elements = temp.querySelectorAll('*');
        elements.forEach(el => {
            const tagName = el.tagName.toLowerCase();

            // Eliminar etiquetas no permitidas
            if (!allowedTags.includes(tagName)) {
                el.remove();
                return;
            }

            // Filtrar atributos
            const allowed = allowedAttrs[tagName] || [];
            Array.from(el.attributes).forEach(attr => {
                if (!allowed.includes(attr.name.toLowerCase())) {
                    el.removeAttribute(attr.name);
                }
            });

            // Validar src para iframes
            if (tagName === 'iframe') {
                const src = el.getAttribute('src');
                if (src) {
                    try {
                        const url = new URL(src);
                        const domain = url.hostname;
                        if (!allowedIframeDomains.some(d => domain === d || domain.endsWith('.' + d))) {
                            el.remove();
                            return;
                        }
                    } catch (e) {
                        el.remove();
                        return;
                    }
                }
            }

            // Validar src para evitar javascript:
            const src = el.getAttribute('src');
            if (src && (src.toLowerCase().startsWith('javascript:') || src.toLowerCase().startsWith('data:text/html'))) {
                el.remove();
                return;
            }

            // Sanitizar atributo style (remover expresiones peligrosas)
            const style = el.getAttribute('style');
            if (style) {
                const sanitizedStyle = this.sanitizeStyle(style);
                if (sanitizedStyle) {
                    el.setAttribute('style', sanitizedStyle);
                } else {
                    el.removeAttribute('style');
                }
            }

            // Remover event handlers (onclick, onerror, etc.)
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.toLowerCase().startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            });
        });

        return temp.innerHTML;
    },

    /**
     * Sanitiza estilos CSS inline
     * @param {string} style - String de estilos CSS
     * @returns {string} - Estilos sanitizados
     */
    sanitizeStyle(style) {
        if (!style) return '';

        // Propiedades CSS permitidas
        const allowedProperties = [
            'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
            'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
            'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
            'border', 'border-radius', 'display', 'object-fit', 'aspect-ratio'
        ];

        // Patrones peligrosos
        const dangerousPatterns = [
            /expression\s*\(/i,
            /javascript\s*:/i,
            /behavior\s*:/i,
            /-moz-binding/i,
            /url\s*\(/i
        ];

        // Verificar patrones peligrosos
        for (const pattern of dangerousPatterns) {
            if (pattern.test(style)) {
                return '';
            }
        }

        // Filtrar solo propiedades permitidas
        const rules = style.split(';').filter(rule => {
            const [prop] = rule.split(':').map(s => s.trim().toLowerCase());
            return allowedProperties.includes(prop);
        });

        return rules.join(';');
    },

    /**
     * Sanitiza nombre de jugador
     * Permite emojis pero escapa HTML
     * @param {string} nombre - Nombre del jugador
     * @returns {string} - Nombre sanitizado
     */
    sanitizePlayerName(nombre) {
        if (!nombre) return '';
        // Limitar longitud
        const limited = String(nombre).slice(0, 50);
        // Escapar HTML
        return this.escapeHTML(limited);
    },

    /**
     * Valida y sanitiza una respuesta del protocolo P2P
     * @param {Object} payload - Payload recibido
     * @param {Object} schema - Schema esperado {campo: tipo}
     * @returns {Object|null} - Payload validado o null si inválido
     */
    validatePayload(payload, schema) {
        if (!payload || typeof payload !== 'object') return null;

        const result = {};
        for (const [key, expectedType] of Object.entries(schema)) {
            const value = payload[key];

            if (value === undefined) {
                if (expectedType.endsWith('?')) {
                    continue; // Campo opcional
                }
                return null; // Campo requerido faltante
            }

            const type = expectedType.replace('?', '');

            if (type === 'string' && typeof value === 'string') {
                result[key] = this.escapeHTML(value);
            } else if (type === 'number' && typeof value === 'number' && !isNaN(value)) {
                result[key] = value;
            } else if (type === 'boolean' && typeof value === 'boolean') {
                result[key] = value;
            } else if (type === 'array' && Array.isArray(value)) {
                result[key] = value;
            } else if (type === 'any') {
                result[key] = value;
            } else {
                return null; // Tipo incorrecto
            }
        }

        return result;
    }
};

// Export para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sanitize;
}
