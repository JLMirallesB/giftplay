
# Guía Completa del Formato GIFT

## ¿Qué es GIFT?

GIFT (General Import Format Technology) es un formato de texto plano para crear preguntas de cuestionarios. Fue desarrollado originalmente para Moodle y es ampliamente utilizado en entornos educativos.

## Ventajas de GIFT

✅ **Texto plano**: Fácil de crear y editar
✅ **Portable**: Compatible con Moodle y otras plataformas
✅ **Versionable**: Se puede usar con Git
✅ **Legible**: Sintaxis clara y comprensible
✅ **Flexible**: Soporta múltiples tipos de preguntas

---

## Estructura Básica

```gift
::Título:: Texto de la pregunta {
    ~Opción incorrecta
    =Opción correcta
    ~Otra incorrecta
}
```

### Componentes

| Elemento | Descripción | Obligatorio |
|----------|-------------|-------------|
| `::Título::` | Identificador de la pregunta | No |
| Texto de la pregunta | Enunciado | Sí |
| `{...}` | Bloque de respuestas | Sí |
| `=` | Marca respuesta correcta | Sí |
| `~` | Marca respuesta incorrecta | Sí |
| `#` | Introduce feedback | No |

---

## Tipos de Preguntas

### 1. Opción Múltiple (Respuesta Única)

La pregunta tiene **una sola respuesta correcta**.

```gift
::Geografía:: ¿Cuál es la capital de Francia? {
    ~Madrid
    ~Londres
    =París
    ~Roma
}
```

**Puntuación**: Todo o nada (100% o 0%)

---

### 2. Verdadero/Falso

Pregunta binaria con respuesta Verdadero o Falso.

```gift
::Ciencia:: La Tierra gira alrededor del Sol. {T}

::Historia:: La Segunda Guerra Mundial terminó en 1939. {F}
```

**Alternativas válidas**:
- `{T}` o `{TRUE}` para Verdadero
- `{F}` o `{FALSE}` para Falso

---

### 3. Opción Múltiple (Varias Respuestas Correctas)

La pregunta puede tener **múltiples respuestas correctas** con ponderación.

```gift
::Biología:: ¿Qué características tienen los mamíferos? {
    ~%33.33%Dan a luz crías vivas
    ~%33.33%Tienen glándulas mamarias
    ~%33.33%Son de sangre caliente
    ~%-100%Ponen huevos (todos los mamíferos)
}
```

**Ponderación**:
- `~%50%` = 50% de los puntos si se selecciona
- `~%100%` o `=` = 100% (respuesta completamente correcta)
- `~%-100%` = Penalización completa si se selecciona
- `~%0%` = 0 puntos (neutral)

**Ejemplo con 2 correctas**:
```gift
¿Qué son plantas? {
    ~%50%Organismos autótrofos
    ~%50%Producen oxígeno
    ~%-100%Son heterótrofas
}
```

---

### 4. Con Feedback

Proporciona retroalimentación específica por cada respuesta.

```gift
::Matemáticas:: ¿Cuánto es 7 × 8? {
    ~54 # No, verifica la tabla del 7
    =56 # ¡Correcto! 7 × 8 = 56
    ~63 # No, ese es 7 × 9
    ~48 # No, ese es 6 × 8
}
```

**Feedback general** (para todas las respuestas):
```gift
¿Capital de España? {
    =Madrid
    ~Barcelona
    ~Sevilla
    ####Recuerda que Madrid es la capital desde 1561
}
```

---

## Características Avanzadas

### Tiempo Personalizado

GIFTPlay permite especificar tiempo personalizado por pregunta usando comentarios especiales:

```gift
// @time: 120
::Pregunta compleja:: Esta pregunta requiere 2 minutos... {
    ~Opción A
    =Opción B
    ~Opción C
}
```

Sin la directiva `@time`, se usa el tiempo configurado globalmente.

---

### Fórmulas Matemáticas (LaTeX)

GIFTPlay soporta LaTeX para renderizar fórmulas matemáticas.

**Inline** (en línea):
```gift
¿Cuál es el valor de $x$ en $2x + 5 = 11$? {
    ~$x = 2$
    =$ x = 3$
    ~$x = 4$
}
```

**Display** (bloque):
```gift
Resuelve el sistema: $$\begin{cases} x + y = 5 \\ x - y = 1 \end{cases}$$ {
    ~$x = 2, y = 3$
    =$x = 3, y = 2$
    ~$x = 4, y = 1$
}
```

**Funciones LaTeX comunes**:
- Fracciones: `$\dfrac{a}{b}$` → $\dfrac{a}{b}$
- Raíces: `$\sqrt{x}$` → $\sqrt{x}$
- Potencias: `$x^2$` → $x^2$
- Subíndices: `$x_1$` → $x_1$
- Sumatorias: `$\sum_{i=1}^{n}$` → $\sum_{i=1}^{n}$
- Integrales: `$\int_{0}^{1}$` → $\int_{0}^{1}$

---

### Markdown

GIFTPlay soporta Markdown básico en el texto de las preguntas:

```gift
::Programación:: ¿Qué es **Python**? {
    ~Un reptil
    =Un lenguaje de *programación*
    ~Un framework web
}
```

**Sintaxis soportada**:
- `**negrita**`
- `*cursiva*`
- `` `código` ``
- Listas
- Enlaces

---

### Multimedia

Puedes incluir imágenes, vídeos o iframes usando HTML:

```gift
::Arte:: ¿Quién pintó esta obra? <img src="https://ejemplo.com/monalisa.jpg"> {
    ~Van Gogh
    =Leonardo da Vinci
    ~Picasso
}
```

**Formatos soportados**:
- `<img src="URL">` - Imágenes
- `<video src="URL">` - Vídeos
- `<iframe src="URL">` - YouTube, Vimeo, etc.

---

## Caracteres Especiales

Si necesitas usar caracteres especiales en el texto, escápalos con `\`:

| Carácter | Escapado |
|----------|----------|
| `~` | `\~` |
| `=` | `\=` |
| `#` | `\#` |
| `{` | `\{` |
| `}` | `\}` |
| `:` | `\:` |
| `\` | `\\` |

**Ejemplo**:
```gift
¿Cuál es la fórmula del agua\: H₂O? {
    =Verdadero
    ~Falso
}
```

---

## Comentarios

Usa `//` para agregar comentarios que serán ignorados:

```gift
// Este es un comentario
// Las siguientes preguntas son de geografía

::Ríos:: ¿Cuál es el río más largo del mundo? {
    ~Nilo # Aunque es muy largo, el Amazonas es más largo
    =Amazonas # ¡Correcto! Aproximadamente 6,400 km
    ~Yangtsé
}
```

---

## Mejores Prácticas

### ✅ Recomendado

1. **Usa títulos descriptivos**
   ```gift
   ::Matemáticas - Ecuaciones lineales:: ...
   ```

2. **Agrupa por tema**
   ```gift
   // === GEOGRAFÍA ===
   ::Capitales - Francia:: ...
   ::Capitales - España:: ...

   // === HISTORIA ===
   ::Fechas - Descubrimiento América:: ...
   ```

3. **Añade feedback educativo**
   ```gift
   {
       =Respuesta correcta # ¡Muy bien! Aquí está la explicación...
       ~Respuesta incorrecta # No exactamente. Recuerda que...
   }
   ```

4. **Usa LaTeX para matemáticas**
   ```gift
   $\dfrac{x^2 + 1}{2}$ en lugar de (x^2 + 1)/2
   ```

5. **Balancea las opciones**
   - 3-5 opciones para preguntas de opción múltiple
   - Opciones de longitud similar
   - Evita patrones obvios (ej: siempre la opción B es correcta)

### ❌ Evita

1. **Preguntas ambiguas**
   ```gift
   // MAL
   ¿Es grande París? {T}

   // BIEN
   ¿París tiene más de 2 millones de habitantes? {T}
   ```

2. **Demasiadas opciones**
   ```gift
   // Evita más de 6 opciones
   ```

3. **Texto excesivo en opciones**
   ```gift
   // Las opciones deben ser concisas
   ```

4. **Respuestas que se solapan**
   ```gift
   // MAL
   {
       ~Mayor de 5
       =Mayor de 10  // Confuso: 15 cumple ambas
   }
   ```

---

## Ejemplos Completos

### Cuestionario de Matemáticas

```gift
// Cuestionario de Álgebra Básica
// Tiempo: 60 segundos por pregunta

// @time: 60
::Ecuaciones:: Resuelve $2x + 5 = 11$ {
    ~$x = 2$
    =$x = 3$ # ¡Correcto! $2(3) + 5 = 11$
    ~$x = 4$
    ~$x = 5$
}

// @time: 90
::Sistemas:: ¿Qué método NO es válido para resolver sistemas de ecuaciones? {
    ~Sustitución
    ~Igualación
    ~Reducción
    =Multiplicación # La multiplicación no es un método de resolución de sistemas
}

::Potencias:: $2^3 = 8$ {TRUE}
```

### Cuestionario de Ciencias

```gift
// Biología - Fotosíntesis

::Fotosíntesis:: ¿Qué elementos necesitan las plantas para la fotosíntesis? {
    ~%33.33%Luz solar # Correcto, la energía luminosa es esencial
    ~%33.33%Dióxido de carbono (CO₂) # Correcto, lo absorben del aire
    ~%33.33%Agua (H₂O) # Correcto, la absorben por las raíces
    ~%-100%Nitrógeno (N₂) # No es un componente directo de la fotosíntesis
}

::Clorofila:: La clorofila es el pigmento que da color **verde** a las plantas. {T}
```

---

## Recursos Adicionales

- 📖 [Especificación oficial GIFT](https://docs.moodle.org/en/GIFT_format)
- 🎨 [Editor GIFT online](https://fuhrmanator.github.io/GIFT-grammar-PEG.js/)
- 📝 [LaTeX Math Symbols](https://katex.org/docs/supported.html)
- 🎮 [GIFTPlay GitHub](https://github.com/tuusuario/giftplay)

---

## Soporte en GIFTPlay

| Característica | Soportado |
|----------------|-----------|
| Opción múltiple (única) | ✅ |
| Opción múltiple (varias) | ✅ |
| Verdadero/Falso | ✅ |
| Feedback por respuesta | ✅ |
| Ponderación | ✅ |
| LaTeX | ✅ |
| Markdown | ✅ |
| Multimedia (img, video) | ✅ |
| Tiempo personalizado | ✅ (con `// @time: N`) |
| Respuesta corta | ❌ (futuro) |
| Numérica | ❌ (futuro) |
| Emparejamiento | ❌ (no planeado) |

---

**¡Empieza a crear tus cuestionarios con GIFT!** 🚀
