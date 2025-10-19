# 🎮 GIFTPlay

Aplicación web para cuestionarios interactivos en tiempo real usando el formato GIFT (General Import Format Technology).

## ✨ Características

- 📝 **Formato GIFT estándar**: Compatible con Moodle y otros sistemas educativos
- 🎮 **Juego en tiempo real**: Conexión P2P mediante WebRTC (PeerJS)
- 📱 **Responsive**: Interfaz optimizada para móviles y tablets
- 🚀 **Sin servidor**: No requiere backend, funciona completamente en el navegador
- ⏱️ **Tiempo configurable**: Define el tiempo de respuesta al inicio de la sesión
- 🎯 **Opciones flexibles**: Soporta 2 a N opciones de respuesta (no limitado a 4)
- 🌐 **Multiidioma**: Sistema de internacionalización integrado
- 📊 **Resultados en tiempo real**: Visualización inmediata de puntuaciones

## 🎯 Tipos de Preguntas Soportadas

- ✅ Opción múltiple (respuesta única)
- ✅ Opción múltiple (varias respuestas correctas)
- ✅ Verdadero/Falso
- ✅ Feedback por respuesta
- ✅ Ponderación de respuestas parcialmente correctas
- ✅ Multimedia (imágenes embebidas o URLs)

## 🚀 Inicio Rápido

### Para el Presentador

1. Abre [index.html](index.html) en tu navegador
2. Sube un archivo `.gift` con tus preguntas
3. Configura el tiempo de respuesta (por defecto: 30 segundos)
4. Haz clic en "Empezar Sesión"
5. Comparte el código QR o la URL con tus estudiantes

### Para los Jugadores

1. Abre [jugador.html](jugador.html) en tu navegador (o escanea el QR)
2. Ingresa el código de la sesión
3. Escribe tu nombre y elige un emoji
4. ¡A jugar!

## 📝 Formato GIFT

GIFTPlay utiliza el formato GIFT estándar. Ejemplo:

```gift
// Pregunta de opción múltiple
::Geografía:: ¿Cuál es la capital de Francia? {
    ~Sevilla
    =París
    ~Roma
    ~Lisboa
}

// Pregunta con varias respuestas correctas
::Biología:: ¿Qué características tienen las plantas? {
    ~%50%Son organismos autótrofos
    ~%50%Producen oxígeno
    ~%-100%Son heterótrofas
}

// Verdadero/Falso
::Gramática:: Un adverbio acompaña al verbo. {T}

// Con feedback
::Historia:: ¿En qué año se descubrió América? {
    ~1490 # Muy cerca, pero no es correcto
    =1492 # ¡Exacto! Cristóbal Colón llegó a América en 1492
    ~1500 # Demasiado tarde
}
```

Ver más ejemplos en [assets/examples/](assets/examples/)

## 🛠️ Tecnologías

- **PeerJS 1.5.5**: Comunicación P2P basada en WebRTC
- **QRCode.js**: Generación de códigos QR
- **Marked.js**: Renderizado de Markdown (opcional)
- **KaTeX**: Renderizado de fórmulas matemáticas LaTeX (opcional)
- **Vanilla JavaScript**: Sin frameworks, código limpio y eficiente

## 📚 Documentación

- [Formato GIFT](docs/GIFT-FORMAT.md) - Guía completa del formato
- [API de Mensajes](docs/API.md) - Protocolo de comunicación PeerJS
- [Guía de Despliegue](docs/DEPLOYMENT.md) - Cómo desplegar en GitHub Pages, Netlify, etc.

## 🏗️ Estructura del Proyecto

```
giftplay/
├── index.html              # Interfaz del presentador
├── jugador.html            # Interfaz del jugador
├── src/
│   ├── presentador/        # Lógica del presentador
│   ├── jugador/            # Lógica del jugador
│   ├── shared/             # Código compartido
│   └── lib/gift/           # Parser GIFT
├── assets/
│   ├── css/                # Estilos
│   ├── img/                # Imágenes
│   └── examples/           # Archivos GIFT de ejemplo
├── docs/                   # Documentación
└── tests/                  # Tests unitarios
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## 🙏 Créditos

- Basado en la arquitectura de [QPlay](https://github.com/usuario/qplay)
- Formato GIFT: [Especificación oficial de Moodle](https://docs.moodle.org/en/GIFT_format)
- Parser GIFT inspirado en [GIFT-grammar-PEG.js](https://github.com/fuhrmanator/GIFT-grammar-PEG.js)

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias, abre un [issue](https://github.com/tuusuario/giftplay/issues).

---

**Hecho con ❤️ para educadores y estudiantes**
