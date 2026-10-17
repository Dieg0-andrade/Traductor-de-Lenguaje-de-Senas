# SignBridge

SignBridge es un prototipo de aplicación web que utiliza inteligencia artificial para reconocer gestos manuales basados en el alfabeto dactilológico y mostrar las letras identificadas en tiempo real.

El proyecto busca explorar el uso de la inteligencia artificial como apoyo para la comunicación entre personas que utilizan lengua de señas y quienes no están familiarizados con ella.

En esta primera etapa, el sistema reconoce gestos individuales mediante un modelo de **Teachable Machine Image**, integrado en una aplicación desarrollada con HTML, CSS y JavaScript.

## Clases del modelo

El modelo fue entrenado con **7.707 imágenes**, distribuidas en 28 clases:

**Letras del alfabeto:**

`A` `B` `C` `D` `E` `F` `G` `H` `I` `J` `K` `L` `M` `N` `O` `P` `Q` `R` `S` `T` `U` `V` `W` `X` `Y` `Z`

**Clases adicionales:**

- `Espacio`
- `Borrar`

## Funcionamiento

```text
Webcam
   ↓
Selección de la región de la mano
   ↓
Teachable Machine Image
   ↓
Clasificación del gesto
   ↓
Clase + nivel de confianza
   ↓
Validación de la predicción
   ↓
Visualización de la letra en SignBridge
```

La aplicación permite mover y modificar el tamaño del recuadro de reconocimiento para seleccionar la región de la imagen que será analizada por el modelo.

Para reducir los cambios repentinos entre resultados, se utiliza un **umbral mínimo de confianza del 75 %** y se requieren **cinco predicciones consecutivas** de la misma clase antes de confirmar el gesto.

## Tecnologías

- Google Teachable Machine Image
- TensorFlow.js
- JavaScript
- HTML5
- CSS3
- Python
- Visual Studio Code

## Estructura

```text
Traductor-de-Lenguaje-de-Senas/
│
├── App.py
│
├── src/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── Presentacion SignBridge.pptx
│
├── SignBridge.docx
│
└── README.md
```

## Instalación

**1. Clonar el repositorio:**

```bash
git clone https://github.com/Dieg0-andrade/Traductor-de-Lenguaje-de-Senas.git
cd Traductor-de-Lenguaje-de-Senas
```

**2. Ejecutar la aplicación:**

```bash
python App.py
```

El programa inicia un servidor local que permite utilizar la aplicación desde el navegador.

La aplicación necesita acceso a la cámara web y conexión a Internet para cargar el modelo y las bibliotecas de inteligencia artificial.

**3. Iniciar el reconocimiento:**

- Presionar el botón **Activar cámara**.
- Permitir el acceso a la webcam.
- Colocar la mano dentro del recuadro de detección.
- Ajustar la posición o el tamaño del recuadro si es necesario.
- Observar la letra reconocida y su nivel de confianza.

## Modelo

El modelo fue entrenado utilizando **Google Teachable Machine**, mediante un conjunto de imágenes capturadas con una cámara web.

Durante el entrenamiento se identificaron dificultades relacionadas con la similitud entre algunas señas y la influencia del fondo de las imágenes.

Para mejorar el funcionamiento del prototipo se utilizaron encuadres centrados en la mano y se incorporó una región de reconocimiento ajustable.


## Estado del proyecto

**Primera versión funcional.**

SignBridge permite reconocer gestos manuales basados en el alfabeto dactilológico y visualizar las clases detectadas en tiempo real.

El entrenamiento fue realizado con imágenes de una sola persona y todavía no se ha efectuado una evaluación formal de precisión con usuarios externos.

Actualmente, el sistema identifica gestos individuales, pero no forma palabras automáticamente ni traduce conversaciones completas en lengua de señas.

## Mejoras futuras

- Formación de palabras y oraciones a partir de las letras reconocidas.
- Reconocimiento de señas que representen palabras completas.
- Conversión de texto a voz.
- Entrenamiento y evaluación con diferentes usuarios.
- Desarrollo de una versión para dispositivos móviles.
