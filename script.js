let skinViewer = null;
let currentObjectUrl = null;

const canvas = document.getElementById("skinViewer");
const shell = document.getElementById("viewerShell");
const skinInput = document.getElementById("skinInput");
const uploadButton = document.getElementById("uploadButton");
const emptyUploadButton = document.getElementById("emptyUploadButton");
const emptyState = document.getElementById("emptyState");
const statusEl = document.getElementById("status");
const fileNameEl = document.getElementById("fileName");
const modelTypeEl = document.getElementById("modelType");
const resetButton = document.getElementById("resetButton");
const rotateButton = document.getElementById("rotateButton");
const animationToggle = document.getElementById("animationToggle");

function setStatus(message) {
  statusEl.textContent = message;
}

function openPicker() {
  skinInput.click();
}

uploadButton.addEventListener("click", openPicker);
emptyUploadButton.addEventListener("click", openPicker);

function fitViewer() {
  if (!skinViewer) return;
  const rect = shell.getBoundingClientRect();
  skinViewer.width = Math.max(320, Math.floor(rect.width));
  skinViewer.height = Math.max(420, Math.floor(rect.height));
}

function setDefaultView() {
  if (!skinViewer) return;

  skinViewer.autoRotate = false;
  skinViewer.zoom = 0.82;

  if (skinViewer.controls) {
    skinViewer.controls.enableRotate = true;
    skinViewer.controls.enableZoom = true;
    skinViewer.controls.enablePan = true;
  }

  if (skinViewer.playerObject) {
    skinViewer.playerObject.rotation.y = 0;
    skinViewer.playerObject.position.y = 0;
  }
}

async function loadSkinFile(file) {
  if (!file) return;

  if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".png")) {
    setStatus("Please choose a Minecraft skin PNG.");
    return;
  }

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
  }

  currentObjectUrl = URL.createObjectURL(file);

  try {
    setStatus("Loading skin...");
    await skinViewer.loadSkin(currentObjectUrl);
    emptyState.hidden = true;

    fileNameEl.textContent = file.name;

    const slim = skinViewer.playerObject?.skin?.leftArm?.outerLayer;
    const modelName = slim?.size?.x === 3 ? "Slim / Alex" : "Classic / Steve";
    modelTypeEl.textContent = `Model: ${modelName}`;

    setDefaultView();
    fitViewer();
    setStatus("Skin loaded. Drag the player to look around.");
  } catch (error) {
    console.error(error);
    emptyState.hidden = false;
    setStatus("That image could not be loaded as a Minecraft skin.");
    fileNameEl.textContent = "No skin selected";
    modelTypeEl.textContent = "Model: —";
  }
}

function initializeViewer() {
  if (!window.skinview3d) {
    setStatus("The 3D viewer library failed to load. Check your internet connection.");
    return;
  }

  skinViewer = new skinview3d.SkinViewer({
    canvas,
    width: 640,
    height: 640,
    background: 0x000000,
    alpha: true,
    fov: 50,
    zoom: 0.82,
    enableControls: true
  });

  // Keep the lighting close to Minecraft-style character presentation.
  skinViewer.globalLight.intensity = 3;
  skinViewer.cameraLight.intensity = 0.6;

  if (skinViewer.renderer) {
    skinViewer.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  setDefaultView();
  fitViewer();
}

skinInput.addEventListener("change", () => {
  const file = skinInput.files?.[0];
  loadSkinFile(file);
});

resetButton.addEventListener("click", () => {
  setDefaultView();
  setStatus("View reset.");
});

rotateButton.addEventListener("click", () => {
  if (!skinViewer) return;
  skinViewer.autoRotate = !skinViewer.autoRotate;
  rotateButton.textContent = skinViewer.autoRotate ? "Stop Auto Rotate" : "Auto Rotate";
});

animationToggle.addEventListener("change", () => {
  if (!skinViewer) return;
  skinViewer.animation = animationToggle.checked
    ? new skinview3d.WalkingAnimation()
    : null;

  setStatus(animationToggle.checked ? "Walk animation enabled." : "Animation disabled.");
});

["dragenter", "dragover"].forEach(type => {
  shell.addEventListener(type, event => {
    event.preventDefault();
    shell.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach(type => {
  shell.addEventListener(type, event => {
    event.preventDefault();
    shell.classList.remove("dragging");
  });
});

shell.addEventListener("drop", event => {
  const file = event.dataTransfer?.files?.[0];
  loadSkinFile(file);
});

window.addEventListener("paste", event => {
  const items = Array.from(event.clipboardData?.items || []);
  const imageItem = items.find(item => item.kind === "file" && item.type.startsWith("image/"));
  if (!imageItem) return;

  const file = imageItem.getAsFile();
  if (file) loadSkinFile(file);
});

const resizeObserver = new ResizeObserver(fitViewer);
resizeObserver.observe(shell);

window.addEventListener("resize", fitViewer);

initializeViewer();

// Browsers may block a file chooser without a user gesture.
// We still try automatically, then leave the visible button as fallback.
window.addEventListener("load", () => {
  setTimeout(() => {
    try {
      openPicker();
    } catch {
      // The visible picker button remains available.
    }
  }, 250);
});
