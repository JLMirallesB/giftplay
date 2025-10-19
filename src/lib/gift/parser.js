/**
 * Parser GIFT (General Import Format Technology)
 *
 * Parsea archivos GIFT y los convierte en objetos JavaScript
 * Especificación: https://docs.moodle.org/en/GIFT_format
 */

class GIFTParser {
    constructor() {
        this.questions = [];
        this.errors = [];
    }

    /**
     * Parsea un texto GIFT completo
     * @param {string} giftText - Texto GIFT
     * @returns {Array} Array de objetos pregunta
     */
    parse(giftText) {
        this.questions = [];
        this.errors = [];

        // Limpiar BOM si existe
        giftText = giftText.replace(/^\uFEFF/, '');

        // Separar en bloques de preguntas
        const blocks = this.splitIntoBlocks(giftText);

        blocks.forEach((block, index) => {
            try {
                const question = this.parseQuestion(block, index);
                if (question) {
                    this.questions.push(question);
                }
            } catch (error) {
                this.errors.push({
                    block: index + 1,
                    message: error.message,
                    text: block.substring(0, 100)
                });
            }
        });

        return this.questions;
    }

    /**
     * Divide el texto en bloques de preguntas
     */
    splitIntoBlocks(text) {
        const lines = text.split('\n');
        const blocks = [];
        let currentBlock = [];
        let inQuestion = false;

        for (let line of lines) {
            const trimmed = line.trim();

            // Ignorar líneas vacías fuera de preguntas
            if (!trimmed && !inQuestion) {
                continue;
            }

            // Ignorar comentarios que no son directivas
            if (trimmed.startsWith('//') && !trimmed.includes('@')) {
                continue;
            }

            // Detectar inicio de pregunta (línea con contenido no vacío)
            if (trimmed && !inQuestion) {
                inQuestion = true;
                currentBlock = [line];
            }
            // Detectar fin de pregunta (} en su propia línea o línea vacía después de })
            else if (inQuestion) {
                currentBlock.push(line);

                if (trimmed === '}' || trimmed.endsWith('}')) {
                    blocks.push(currentBlock.join('\n'));
                    currentBlock = [];
                    inQuestion = false;
                }
            }
        }

        // Agregar último bloque si existe
        if (currentBlock.length > 0) {
            blocks.push(currentBlock.join('\n'));
        }

        return blocks.filter(b => b.trim());
    }

    /**
     * Parsea una pregunta individual
     */
    parseQuestion(block, index) {
        block = block.trim();
        if (!block) return null;

        let question = {
            id: index + 1,
            titulo: '',
            pregunta: '',
            tipo: '',
            opciones: [],
            feedback_general: '',
            multimedia: '',
            tiempo: null
        };

        // Extraer título (::título::)
        const titleMatch = block.match(/^::([^:]+)::/);
        if (titleMatch) {
            question.titulo = titleMatch[1].trim();
            block = block.replace(titleMatch[0], '').trim();
        }

        // Extraer directiva de tiempo (@time: N)
        const timeMatch = block.match(/\/\/\s*@time:\s*(\d+)/i);
        if (timeMatch) {
            question.tiempo = parseInt(timeMatch[1]);
            block = block.replace(timeMatch[0], '').trim();
        }

        // Extraer multimedia embebida (<img src="..."> o similares)
        const mediaMatch = block.match(/<(img|video|audio|iframe)[^>]*>/i);
        if (mediaMatch) {
            question.multimedia = mediaMatch[0];
            block = block.replace(mediaMatch[0], '').trim();
        }

        // Dividir pregunta y respuestas
        const braceIndex = block.indexOf('{');
        if (braceIndex === -1) {
            throw new Error('Formato inválido: falta {');
        }

        question.pregunta = block.substring(0, braceIndex).trim();
        const answersBlock = block.substring(braceIndex + 1, block.lastIndexOf('}')).trim();

        // Determinar tipo de pregunta y parsear respuestas
        if (answersBlock === 'T' || answersBlock === 'TRUE' || answersBlock === 'F' || answersBlock === 'FALSE') {
            // Verdadero/Falso
            question.tipo = 'true-false';
            const isTrue = answersBlock === 'T' || answersBlock === 'TRUE';
            question.opciones = [
                { texto: 'Verdadero', correcta: isTrue, peso: isTrue ? 100 : 0, feedback: '' },
                { texto: 'Falso', correcta: !isTrue, peso: !isTrue ? 100 : 0, feedback: '' }
            ];
        } else {
            // Opción múltiple
            question.opciones = this.parseAnswers(answersBlock);

            // Determinar si es respuesta única o múltiple
            const correctCount = question.opciones.filter(o => o.correcta).length;
            const hasWeights = question.opciones.some(o => o.peso > 0 && o.peso < 100);

            if (correctCount > 1 || hasWeights) {
                question.tipo = 'multiple-choice-multiple';
            } else {
                question.tipo = 'multiple-choice-single';
            }
        }

        // Extraer feedback general (####Feedback)
        const feedbackMatch = answersBlock.match(/####(.+)$/);
        if (feedbackMatch) {
            question.feedback_general = feedbackMatch[1].trim();
        }

        return question;
    }

    /**
     * Parsea las respuestas de una pregunta
     */
    parseAnswers(answersText) {
        const answers = [];

        // Regex para capturar cada respuesta
        // Formato: ~%peso%texto # feedback o =texto # feedback
        const answerRegex = /([=~])(%(-?\d+)%)?((?:[^#~=]|\\[#~=])+)(#(.+?))?(?=[~=]|$)/g;

        let match;
        while ((match = answerRegex.exec(answersText)) !== null) {
            const marker = match[1];           // = o ~
            const peso = match[3];             // número del peso (opcional)
            let texto = match[4].trim();       // texto de la respuesta
            const feedback = match[6] ? match[6].trim() : ''; // feedback (opcional)

            // Desescapar caracteres especiales
            texto = this.unescapeGIFT(texto);

            let correcta = false;
            let weight = 0;

            if (marker === '=') {
                correcta = true;
                weight = 100;
            } else if (peso !== undefined) {
                weight = parseInt(peso);
                correcta = weight > 0;
            }

            answers.push({
                texto: texto,
                correcta: correcta,
                peso: weight,
                feedback: feedback
            });
        }

        return answers;
    }

    /**
     * Desescapa caracteres especiales de GIFT
     */
    unescapeGIFT(text) {
        return text
            .replace(/\\~/g, '~')
            .replace(/\\=/g, '=')
            .replace(/\\#/g, '#')
            .replace(/\\{/g, '{')
            .replace(/\\}/g, '}')
            .replace(/\\:/g, ':')
            .replace(/\\\\/g, '\\');
    }

    /**
     * Obtiene errores de parsing
     */
    getErrors() {
        return this.errors;
    }

    /**
     * Valida que el resultado tenga preguntas válidas
     */
    validate() {
        const errors = [];

        this.questions.forEach((q, index) => {
            if (!q.pregunta) {
                errors.push(`Pregunta ${index + 1}: No tiene enunciado`);
            }

            if (!q.tipo) {
                errors.push(`Pregunta ${index + 1}: No tiene tipo definido`);
            }

            if (q.opciones.length === 0) {
                errors.push(`Pregunta ${index + 1}: No tiene opciones`);
            }

            if (q.tipo !== 'true-false' && !q.opciones.some(o => o.correcta)) {
                errors.push(`Pregunta ${index + 1}: No tiene ninguna respuesta correcta`);
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// Export para usar en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GIFTParser;
}
