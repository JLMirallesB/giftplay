# Ejemplos de Archivos GIFT

Esta carpeta contiene archivos de ejemplo para usar con GIFTPlay.

## Archivos Disponibles

### 📚 [ejemplo-basico.gift](ejemplo-basico.gift)
Preguntas de cultura general básicas que demuestran todos los tipos de preguntas soportados:
- Opción múltiple (respuesta única)
- Verdadero/Falso
- Opción múltiple (varias respuestas correctas con ponderación)
- Feedback por respuesta

**Ideal para:** Primeros pasos con GIFTPlay

---

### 🔢 [ejemplo-matematicas.gift](ejemplo-matematicas.gift)
Preguntas de matemáticas con fórmulas LaTeX:
- Ecuaciones con notación LaTeX inline (`$x^2$`)
- Fórmulas en modo display (`$$...$$`)
- Tiempo personalizado por pregunta (`// @time: 60`)
- Fracciones, raíces, potencias

**Ideal para:** Cuestionarios de ciencias, matemáticas, física

---

## Cómo Usar

1. Descarga uno de los archivos `.gift`
2. Abre [index.html](../../index.html) (presentador)
3. Haz clic en "Subir archivo GIFT"
4. Selecciona el archivo descargado
5. Configura el tiempo de respuesta
6. ¡Empieza la sesión!

---

## Crear tus Propias Preguntas

### Sintaxis Básica

```gift
// Comentario (se ignora)

::Título de la pregunta:: Texto de la pregunta {
    ~Respuesta incorrecta
    =Respuesta correcta
    ~Otra incorrecta
}
```

### Tipos de Preguntas

#### 1. Opción Múltiple (Respuesta Única)

```gift
¿Cuál es la capital de España? {
    ~Barcelona
    =Madrid
    ~Sevilla
}
```

#### 2. Verdadero/Falso

```gift
La Tierra es plana. {F}
El agua hierve a 100°C al nivel del mar. {T}
```

#### 3. Opción Múltiple (Varias Correctas)

```gift
¿Qué son mamíferos? {
    ~%50%Perro
    ~%50%Ballena
    ~%-100%Cocodrilo
    ~%-100%Pez
}
```

El porcentaje indica el peso de la respuesta:
- `%50%` = 50% de los puntos si se selecciona
- `%-100%` = Penalización si se selecciona incorrecta

#### 4. Con Feedback

```gift
¿Capital de Francia? {
    =París # ¡Correcto!
    ~Londres # No, Londres es la capital de Inglaterra
    ~Berlín # No, Berlín es la capital de Alemania
}
```

#### 5. Con LaTeX

```gift
¿Cuánto es $2^3$? {
    ~4
    ~6
    =8
    ~16
}
```

#### 6. Con Tiempo Personalizado

```gift
// @time: 120
Pregunta que requiere 2 minutos para responder...
```

---

## Recursos

- [Especificación GIFT oficial](https://docs.moodle.org/en/GIFT_format)
- [Editor GIFT online](https://fuhrmanator.github.io/GIFT-grammar-PEG.js/)
- [Más ejemplos](https://docs.moodle.org/en/GIFT_format#Examples)

---

## Consejos

✅ **Recomendado:**
- Usa títulos descriptivos (`::Geografía::`)
- Añade feedback para ayudar al aprendizaje
- Agrupa preguntas por tema
- Usa LaTeX para fórmulas matemáticas

❌ **Evita:**
- Preguntas ambiguas
- Demasiadas opciones (máx. 6 recomendado)
- Texto excesivamente largo en las opciones

---

**¡Diviértete creando tus cuestionarios!** 🎮
