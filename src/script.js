
const MODEL_URL =
  "https://teachablemachine.withgoogle.com/models/2otILMuhs/";

const CONFIDENCE_THRESHOLD = 0.75;

// Cantidad de predicciones consecutivas necesarias.
const REQUIRED_STABLE_FRAMES = 5;

const video = document.getElementById("webcam");
const startButton = document.getElementById("start-btn");
const cameraStatus = document.getElementById("camera-status");
const cameraPlaceholder = document.getElementById("camera-placeholder");
const cameraOverlay = document.getElementById("camera-overlay");
const cameraContainer = document.getElementById("webcam-container");
const detectionBox = document.getElementById("detection-box");

const cropSizeSlider = document.getElementById("crop-size");
const cropSizeValue = document.getElementById("crop-size-value");
const resetCropButton = document.getElementById("reset-crop");

const cropCanvas = document.getElementById("crop-preview");
const cropContext = cropCanvas.getContext("2d");

const predictionElement = document.getElementById("prediction");
const predictionStatus = document.getElementById("prediction-status");
const confidenceElement = document.getElementById("confidence");
const confidenceBar = document.getElementById("confidence-bar");
const translatedText = document.getElementById("translated-text");

let model = null;
let stream = null;
let running = false;
let predicting = false;
let animationId = null;

let cropScale = 0.72;
let cropCenterX = 0.5;
let cropCenterY = 0.5;

let dragging = false;
let dragStartX = 0;
let dragStartY = 0;
let initialCenterX = 0;
let initialCenterY = 0;

// Variables para estabilizar el reconocimiento.
let candidateClass = null;
let candidateCount = 0;
let confirmedClass = null;

const EMPTY_CLASSES = [
  "sin gesto",
  "sin seña",
  "ninguno",
  "background"
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeClassName(className) {
  return className.trim().toLowerCase();
}

function isEmptyClass(className) {
  return EMPTY_CLASSES.includes(
    normalizeClassName(className)
  );
}

function getCrop() {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  const size = Math.max(
    1,
    Math.floor(
      Math.min(videoWidth, videoHeight) * cropScale
    )
  );

  const centerX = videoWidth * cropCenterX;
  const centerY = videoHeight * cropCenterY;

  const x = Math.round(
    clamp(centerX - size / 2, 0, videoWidth - size)
  );

  const y = Math.round(
    clamp(centerY - size / 2, 0, videoHeight - size)
  );

  return { x, y, size };
}

function getVideoDisplay() {
  const containerWidth = cameraContainer.clientWidth;
  const containerHeight = cameraContainer.clientHeight;

  const scale = Math.min(
    containerWidth / video.videoWidth,
    containerHeight / video.videoHeight
  );

  return {
    scale,
    offsetX:
      (containerWidth - video.videoWidth * scale) / 2,
    offsetY:
      (containerHeight - video.videoHeight * scale) / 2
  };
}

function updateDetectionBox() {
  if (!video.videoWidth || !video.videoHeight) {
    return;
  }

  const crop = getCrop();
  const display = getVideoDisplay();

  const mirroredX =
    video.videoWidth - crop.x - crop.size;

  detectionBox.style.left =
    `${display.offsetX + mirroredX * display.scale}px`;

  detectionBox.style.top =
    `${display.offsetY + crop.y * display.scale}px`;

  detectionBox.style.width =
    `${crop.size * display.scale}px`;

  detectionBox.style.height =
    `${crop.size * display.scale}px`;
}

function updateCropPreview() {
  if (!video.videoWidth || video.readyState < 2) {
    return;
  }

  const crop = getCrop();

  cropContext.clearRect(
    0,
    0,
    cropCanvas.width,
    cropCanvas.height
  );

  cropContext.drawImage(
    video,
    crop.x,
    crop.y,
    crop.size,
    crop.size,
    0,
    0,
    cropCanvas.width,
    cropCanvas.height
  );
}

function updateCrop() {
  updateDetectionBox();
  updateCropPreview();
}

cropSizeSlider.addEventListener("input", () => {
  cropScale = Number(cropSizeSlider.value) / 100;

  cropSizeValue.textContent =
    `${cropSizeSlider.value}%`;

  updateCrop();
});

resetCropButton.addEventListener("click", () => {
  cropCenterX = 0.5;
  cropCenterY = 0.5;

  updateCrop();
});

detectionBox.addEventListener("pointerdown", (event) => {
  if (!running) {
    return;
  }

  dragging = true;

  dragStartX = event.clientX;
  dragStartY = event.clientY;

  initialCenterX = cropCenterX;
  initialCenterY = cropCenterY;

  detectionBox.setPointerCapture(event.pointerId);
});

detectionBox.addEventListener("pointermove", (event) => {
  if (!dragging || !video.videoWidth) {
    return;
  }

  const display = getVideoDisplay();

  const deltaX =
    -(event.clientX - dragStartX) / display.scale;

  const deltaY =
    (event.clientY - dragStartY) / display.scale;

  const size = getCrop().size;

  const halfWidth =
    size / (2 * video.videoWidth);

  const halfHeight =
    size / (2 * video.videoHeight);

  cropCenterX = clamp(
    initialCenterX + deltaX / video.videoWidth,
    halfWidth,
    1 - halfWidth
  );

  cropCenterY = clamp(
    initialCenterY + deltaY / video.videoHeight,
    halfHeight,
    1 - halfHeight
  );

  updateCrop();
});

function endDragging() {
  dragging = false;
}

detectionBox.addEventListener("pointerup", endDragging);
detectionBox.addEventListener("pointercancel", endDragging);
detectionBox.addEventListener(
  "lostpointercapture",
  endDragging
);

// Reinicia la secuencia de predicciones candidatas.
function resetCandidate() {
  candidateClass = null;
  candidateCount = 0;
}

// Actualiza la interfaz solo cuando se confirma
// una nueva clase estable.
function confirmPrediction(className) {
  confirmedClass = className;

  if (isEmptyClass(className)) {
    predictionElement.textContent = "—";
    predictionStatus.textContent =
      "Sin gesto detectado";
    translatedText.textContent =
      "Esperando una seña...";
    return;
  }

  predictionElement.textContent = className;
  predictionStatus.textContent =
    "Seña reconocida";

  translatedText.textContent =
    `Seña reconocida: ${className}`;
}

// Procesa las predicciones sin cambiar
// inmediatamente la letra de la pantalla.
function processPrediction(className, probability) {
  const confidence = probability * 100;

  confidenceElement.textContent =
    `${confidence.toFixed(1)}%`;

  confidenceBar.style.width =
    `${confidence}%`;

  if (probability < CONFIDENCE_THRESHOLD) {
    resetCandidate();

    if (confirmedClass === null) {
      predictionStatus.textContent =
        "Buscando una seña estable...";
    }

    return;
  }

  if (className === candidateClass) {
    candidateCount++;
  } else {
    candidateClass = className;
    candidateCount = 1;
  }

  // Si ya está confirmada, no es necesario
  // volver a actualizar la pantalla.
  if (className === confirmedClass) {
    return;
  }

  if (candidateCount < REQUIRED_STABLE_FRAMES) {
    if (confirmedClass === null) {
      predictionStatus.textContent =
        `Estabilizando: ${candidateCount}/${REQUIRED_STABLE_FRAMES}`;
    }

    return;
  }

  confirmPrediction(className);
}

async function predictFrame() {
  if (!running || !model || predicting) {
    return;
  }

  if (video.readyState < 2) {
    return;
  }

  predicting = true;

  try {
    updateCropPreview();

    const predictions = await model.predict(cropCanvas);

    if (!running) {
      return;
    }

    const bestPrediction = predictions.reduce(
      (best, current) =>
        current.probability > best.probability
          ? current
          : best
    );

    processPrediction(
      bestPrediction.className,
      bestPrediction.probability
    );
  } catch (error) {
    console.error(
      "Error de reconocimiento:",
      error
    );

    predictionStatus.textContent =
      "Error de reconocimiento";
  } finally {
    predicting = false;
  }
}

async function predictionLoop() {
  if (!running) {
    return;
  }

  await predictFrame();

  if (running) {
    animationId = requestAnimationFrame(
      predictionLoop
    );
  }
}

async function loadModel() {
  if (model) {
    return;
  }

  model = await tmImage.load(
    MODEL_URL + "model.json",
    MODEL_URL + "metadata.json"
  );

  console.log("Modelo cargado correctamente.");
  console.log(
    "Clases disponibles:",
    model.getTotalClasses()
  );
}

async function startCamera() {
  startButton.disabled = true;
  startButton.textContent = "Iniciando...";

  try {
    cameraStatus.textContent =
      "Cargando modelo";

    await loadModel();

    stream =
      await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

    video.srcObject = stream;

    await new Promise((resolve, reject) => {
      if (video.readyState >= 1) {
        resolve();
        return;
      }

      video.onloadedmetadata = resolve;
      video.onerror = reject;
    });

    await video.play();

    video.style.display = "block";
    cameraPlaceholder.style.display = "none";
    cameraOverlay.style.display = "block";

    resetCandidate();
    confirmedClass = null;

    running = true;

    updateCrop();

    cameraStatus.textContent =
      "Cámara activa";
    cameraStatus.classList.add("active");

    startButton.textContent =
      "Detener cámara";
    startButton.disabled = false;

    predictionStatus.textContent =
      "Buscando una seña estable...";

    predictionLoop();
  } catch (error) {
    console.error(
      "Error al iniciar SignBridge:",
      error
    );

    running = false;

    if (stream) {
      stream.getTracks().forEach(
        track => track.stop()
      );
      stream = null;
    }

    video.srcObject = null;
    video.style.display = "none";
    cameraOverlay.style.display = "none";
    cameraPlaceholder.style.display = "flex";

    cameraStatus.textContent =
      "Error de cámara";
    cameraStatus.classList.remove("active");

    startButton.textContent =
      "Intentar nuevamente";
    startButton.disabled = false;

    translatedText.textContent =
      "Comprueba los permisos de cámara y la conexión.";
  }
}

function stopCamera() {
  running = false;
  dragging = false;

  resetCandidate();
  confirmedClass = null;

  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  if (stream) {
    stream.getTracks().forEach(
      track => track.stop()
    );
    stream = null;
  }

  video.pause();
  video.srcObject = null;
  video.style.display = "none";

  cameraOverlay.style.display = "none";
  cameraPlaceholder.style.display = "flex";

  cameraStatus.textContent =
    "Cámara apagada";
  cameraStatus.classList.remove("active");

  startButton.textContent =
    "Activar cámara";

  predictionElement.textContent = "—";
  predictionStatus.textContent =
    "Esperando cámara";

  confidenceElement.textContent = "0%";
  confidenceBar.style.width = "0%";

  translatedText.textContent =
    "Activa la cámara para comenzar.";

  cropContext.clearRect(
    0,
    0,
    cropCanvas.width,
    cropCanvas.height
  );
}

startButton.addEventListener("click", async () => {
  if (running) {
    stopCamera();
  } else {
    await startCamera();
  }
});

window.addEventListener(
  "resize",
  updateDetectionBox
);
