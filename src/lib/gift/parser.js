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
     * Una pregunta termina con } o con una línea vacía después del texto
     */
    splitIntoBlocks(text) {
        const lines = text.split('\n');
        const blocks = [];
        let currentBlock = [];
        let inQuestion = false;
        let braceDepth = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Ignorar comentarios que no son directivas (deben estar solos en su línea)
            if (trimmed.startsWith('//') && !trimmed.includes('@')) {
                if (!inQuestion) continue;
            }

            // Línea vacía
            if (!trimmed) {
                if (inQuestion && braceDepth === 0) {
                    // Fin de pregunta
                    if (currentBlock.length > 0) {
                        blocks.push(currentBlock.join('\n'));
                        currentBlock = [];
                        inQuestion = false;
                    }
                }
                continue;
            }

            // Contar llaves para saber si estamos dentro de respuestas
            for (let char of line) {
                if (char === '{' && !this.isEscaped(line, line.indexOf(char))) {
                    braceDepth++;
                } else if (char === '}' && !this.isEscaped(line, line.indexOf(char))) {
                    braceDepth--;
                }
            }

            // Iniciar pregunta
            if (!inQuestion && trimmed) {
                inQuestion = true;
            }

            if (inQuestion) {
                currentBlock.push(line);

                // Si braceDepth vuelve a 0 y ya teníamos llaves, fin de pregunta
                if (braceDepth === 0 && currentBlock.join('').includes('{')) {
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
     * Verifica si un caracter en una posición está escapado
     */
    isEscaped(text, pos) {
        if (pos === 0) return false;
        let backslashCount = 0;
        let i = pos - 1;
        while (i >= 0 && text[i] === '\\') {
            backslashCount++;
            i--;
        }
        return backslashCount % 2 === 1;
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
            tiempo: null,
            formato: 'moodle'
        };

        // Extraer título (::título::)
        const titleMatch = block.match(/^::([^:]+)::/);
        if (titleMatch) {
            question.titulo = titleMatch[1].trim();
            block = block.replace(titleMatch[0], '').trim();
        }

        // Extraer directiva de tiempo (@time: N) - puede estar en comentario
        const timeMatch = block.match(/\/\/\s*@time:\s*(\d+)/i);
        if (timeMatch) {
            question.tiempo = parseInt(timeMatch[1]);
        }

        // Extraer formato de texto [html], [markdown], [plain], [moodle]
        const formatMatch = block.match(/\[(html|markdown|plain|moodle)\]/i);
        if (formatMatch) {
            question.formato = formatMatch[1].toLowerCase();
            block = block.replace(formatMatch[0], '').trim();
        }

        // Extraer multimedia embebida (<img src="..."> o similares)
        const mediaMatch = block.match(/<(img|video|audio|iframe)[^>]*>/i);
        if (mediaMatch) {
            question.multimedia = mediaMatch[0];
            block = block.replace(mediaMatch[0], '').trim();
        }

        // Dividir pregunta y respuestas
        const braceIndex = this.findFirstUnescapedBrace(block);
        if (braceIndex === -1) {
            throw new Error('Formato inválido: falta {');
        }

        question.pregunta = block.substring(0, braceIndex).trim();
        const lastBraceIndex = this.findLastUnescapedBrace(block);
        const answersBlock = block.substring(braceIndex + 1, lastBraceIndex).trim();

        // Si la pregunta está vacía, usar el título como pregunta
        if (!question.pregunta && question.titulo) {
            question.pregunta = question.titulo;
        }

        // Determinar tipo de pregunta y parsear respuestas
        if (answersBlock === '') {
            // Ensayo - no soportado en GIFTPlay (requiere evaluación manual)
            question.tipo = 'essay';
            question.opciones = [];
            console.warn(`Pregunta ${index + 1}: Las preguntas de ensayo no son soportadas en GIFTPlay`);
            return null; // Saltar pregunta de ensayo
        } else if (answersBlock === 'T' || answersBlock === 'TRUE' || answersBlock.startsWith('T#') || answersBlock.startsWith('TRUE#')) {
            // Verdadero/Falso - TRUE
            question.tipo = 'true-false';
            const feedback = this.extractTrueFalseFeedback(answersBlock);
            question.opciones = [
                { texto: 'Verdadero', correcta: true, peso: 100, feedback: feedback.correct },
                { texto: 'Falso', correcta: false, peso: 0, feedback: feedback.incorrect }
            ];
        } else if (answersBlock === 'F' || answersBlock === 'FALSE' || answersBlock.startsWith('F#') || answersBlock.startsWith('FALSE#')) {
            // Verdadero/Falso - FALSE
            question.tipo = 'true-false';
            const feedback = this.extractTrueFalseFeedback(answersBlock);
            question.opciones = [
                { texto: 'Verdadero', correcta: false, peso: 0, feedback: feedback.incorrect },
                { texto: 'Falso', correcta: true, peso: 100, feedback: feedback.correct }
            ];
        } else if (answersBlock.startsWith('#')) {
            // Pregunta numérica
            question.tipo = 'numerical';
            question.opciones = this.parseNumericalAnswers(answersBlock);
        } else {
            // Opción múltiple o respuesta corta
            question.opciones = this.parseAnswers(answersBlock);

            // Extraer feedback general (####Feedback)
            const feedbackMatch = answersBlock.match(/####([^}]+)/);
            if (feedbackMatch) {
                question.feedback_general = feedbackMatch[1].trim();
            }

            // Determinar si es respuesta única o múltiple
            const correctCount = question.opciones.filter(o => o.correcta).length;
            const hasPartialWeights = question.opciones.some(o => o.peso > 0 && o.peso < 100);

            if (correctCount > 1 || hasPartialWeights) {
                question.tipo = 'multiple-choice-multiple';
            } else if (correctCount === 1) {
                question.tipo = 'multiple-choice-single';
            } else {
                // Sin respuesta correcta marcada, podría ser respuesta corta
                question.tipo = 'short-answer';
            }
        }

        return question;
    }

    /**
     * Encuentra la primera llave { no escapada
     */
    findFirstUnescapedBrace(text) {
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '{' && !this.isEscaped(text, i)) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Encuentra la última llave } no escapada
     */
    findLastUnescapedBrace(text) {
        for (let i = text.length - 1; i >= 0; i--) {
            if (text[i] === '}' && !this.isEscaped(text, i)) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Extrae el feedback de preguntas True/False
     * Formato: {T#feedback incorrecto#feedback correcto}
     */
    extractTrueFalseFeedback(answersBlock) {
        const parts = answersBlock.split('#');
        return {
            incorrect: parts[1] ? parts[1].trim() : '',
            correct: parts[2] ? parts[2].trim() : ''
        };
    }

    /**
     * Parsea respuestas numéricas
     */
    parseNumericalAnswers(answersText) {
        const answers = [];
        // Formato: {#3:2} o {#1..5} o {#=1822:0 =%50%1822:2}

        // Eliminar el # inicial
        answersText = answersText.substring(1);

        // Buscar respuestas con porcentaje
        const answerRegex = /(%(\d+)%)?([0-9.]+)(?::([0-9.]+)|\.\.([0-9.]+))?(#[^=]+)?/g;
        let match;

        while ((match = answerRegex.exec(answersText)) !== null) {
            const percentage = match[2] ? parseInt(match[2]) : 100;
            const value = parseFloat(match[3]);
            const tolerance = match[4] ? parseFloat(match[4]) : 0;
            const maxValue = match[5] ? parseFloat(match[5]) : null;
            const feedback = match[6] ? match[6].substring(1).trim() : '';

            answers.push({
                texto: maxValue ? `${value}..${maxValue}` : `${value}±${tolerance}`,
                correcta: percentage > 0,
                peso: percentage,
                feedback: feedback,
                valor: value,
                tolerancia: tolerance,
                valorMax: maxValue
            });
        }

        return answers;
    }

    /**
     * Parsea las respuestas de una pregunta
     * Mejorado para manejar feedback con # correctamente
     */
    parseAnswers(answersText) {
        const answers = [];

        // Primero, extraer y eliminar el feedback general si existe
        answersText = answersText.replace(/####[^}]*$/, '');

        // Dividir por marcadores de respuesta (= o ~) que no estén escapados
        const parts = [];
        let current = '';
        let i = 0;

        while (i < answersText.length) {
            const char = answersText[i];

            if ((char === '=' || char === '~') && !this.isEscaped(answersText, i)) {
                if (current.trim()) {
                    parts.push(current);
                }
                current = char;
            } else {
                current += char;
            }
            i++;
        }
        if (current.trim()) {
            parts.push(current);
        }

        // Parsear cada parte
        for (let part of parts) {
            part = part.trim();
            if (!part || part === '=' || part === '~') continue;

            const marker = part[0]; // = o ~
            part = part.substring(1); // Remover el marcador

            // Extraer porcentaje si existe: %50%
            let peso = null;
            const pesoMatch = part.match(/^%(-?\d+(?:\.\d+)?)%/);
            if (pesoMatch) {
                peso = parseFloat(pesoMatch[1]);
                part = part.substring(pesoMatch[0].length);
            }

            // Separar texto de feedback (último # no escapado)
            let texto = part;
            let feedback = '';

            // Buscar el último # no escapado
            for (let j = part.length - 1; j >= 0; j--) {
                if (part[j] === '#' && !this.isEscaped(part, j)) {
                    texto = part.substring(0, j).trim();
                    feedback = part.substring(j + 1).trim();
                    break;
                }
            }

            // Desescapar caracteres especiales
            texto = this.unescapeGIFT(texto);
            feedback = this.unescapeGIFT(feedback);

            // Determinar si es correcta y el peso
            let correcta = false;
            let weight = 0;

            if (marker === '=') {
                correcta = true;
                weight = peso !== null ? peso : 100;
            } else if (marker === '~') {
                if (peso !== null) {
                    weight = peso;
                    correcta = weight > 0;
                } else {
                    weight = 0;
                    correcta = false;
                }
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
     * El orden es importante: primero \\ luego los demás
     */
    unescapeGIFT(text) {
        return text
            .replace(/\\\\/g, '\x00') // Marcador temporal para \\
            .replace(/\\~/g, '~')
            .replace(/\\=/g, '=')
            .replace(/\\#/g, '#')
            .replace(/\\{/g, '{')
            .replace(/\\}/g, '}')
            .replace(/\\:/g, ':')
            .replace(/\x00/g, '\\'); // Restaurar \\ como \
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

            // Preguntas de ensayo no necesitan opciones
            if (q.tipo !== 'essay' && q.opciones.length === 0) {
                errors.push(`Pregunta ${index + 1}: No tiene opciones`);
            }

            // Verificar respuesta correcta solo para tipos que la necesitan
            if (!['essay', 'true-false'].includes(q.tipo) && !q.opciones.some(o => o.correcta)) {
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
