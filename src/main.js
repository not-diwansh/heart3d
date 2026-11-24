import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const container = document.querySelector('#scene');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const partInfo = document.querySelector('#part-info');
const partName = document.querySelector('#part-name');
const partDescription = document.querySelector('#part-description');

const partDefinitions = {
  aorta: {
    name: 'Aorta',
    description: 'The largest artery in the body. It carries oxygen-rich blood from the left ventricle to the rest of the body.',
  },
  superiorVenaCava: {
    name: 'Superior vena cava',
    description: 'A large vein that returns oxygen-poor blood from the head, neck, arms, and upper chest to the right atrium.',
  },
  inferiorVenaCava: {
    name: 'Inferior vena cava',
    description: 'A large vein that returns oxygen-poor blood from the abdomen and lower body to the right atrium.',
  },
  pulmonaryArtery: {
    name: 'Pulmonary artery',
    description: 'Carries oxygen-poor blood from the right ventricle to the lungs, where it picks up oxygen.',
  },
  rightAtrium: {
    name: 'Right atrium',
    description: 'The upper-right chamber that receives oxygen-poor blood returning from the body before it moves into the right ventricle.',
  },
  leftAtrium: {
    name: 'Left atrium',
    description: 'The upper-left chamber that receives oxygen-rich blood from the lungs through the pulmonary veins.',
  },
  rightVentricle: {
    name: 'Right ventricle',
    description: 'The lower-right chamber that pumps oxygen-poor blood through the pulmonary artery toward the lungs.',
  },
  leftVentricle: {
    name: 'Left ventricle',
    description: 'The thick, muscular lower-left chamber that pumps oxygen-rich blood into the aorta and around the body.',
  },
  apex: {
    name: 'Apex',
    description: 'The pointed lower tip of the heart, formed mainly by the left ventricle.',
  },
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(0, 0, 5.3);
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  powerPreference: 'high-performance',
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute('role', 'img');
renderer.domElement.setAttribute('aria-label', 'A 3D heart. Click a part to learn its name, or drag to rotate.');
container.appendChild(renderer.domElement);

const environmentGenerator = new THREE.PMREMGenerator(renderer);
const room = new RoomEnvironment();
const environment = environmentGenerator.fromScene(room, 0.04).texture;
scene.environment = environment;
scene.environmentIntensity = 0.65;
room.dispose();
environmentGenerator.dispose();

const hemisphere = new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 1.1);
scene.add(hemisphere);

const keyLight = new THREE.DirectionalLight(0xffffff, 3);
keyLight.position.set(-3, 4, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -2;
keyLight.shadow.camera.right = 2;
keyLight.shadow.camera.top = 2;
keyLight.shadow.camera.bottom = -2;
keyLight.shadow.camera.near = 0.1;
keyLight.shadow.camera.far = 12;
keyLight.shadow.bias = -0.0004;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1);
fillLight.position.set(4, 1, 2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
rimLight.position.set(0, 2, -4);
scene.add(rimLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.enableZoom = false;
controls.minPolarAngle = Math.PI * 0.28;
controls.maxPolarAngle = Math.PI * 0.72;

const heartPivot = new THREE.Group();
heartPivot.visible = false;
scene.add(heartPivot);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let heartModel = null;
let heartLocalBounds = null;
let textureCanvas = null;
let textureContext = null;
let textureFlipY = false;
let hasSelection = false;
let isInteracting = false;
let pointerStart = null;

controls.addEventListener('start', () => {
  isInteracting = true;
});

controls.addEventListener('end', () => {
  isInteracting = false;
});

const loader = new GLTFLoader();
loader.load(
  '/heart.glb',
  (gltf) => {
    const heart = gltf.scene;
    heartModel = heart;
    const initialBounds = new THREE.Box3().setFromObject(heart);
    heartLocalBounds = initialBounds.clone();
    const initialSize = initialBounds.getSize(new THREE.Vector3());
    const scale = 2.4 / Math.max(initialSize.x, initialSize.y, initialSize.z);

    heart.scale.setScalar(scale);
    const scaledBounds = new THREE.Box3().setFromObject(heart);
    const scaledCenter = scaledBounds.getCenter(new THREE.Vector3());
    heart.position.sub(scaledCenter);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    heart.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        material.metalness = 0.48;
        material.roughness = 0.2;
        material.envMapIntensity = 1.8;
        material.color.multiplyScalar(0.52);
        if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
        Object.values(material).forEach((value) => {
          if (value?.isTexture) value.anisotropy = maxAnisotropy;
        });
        if (material.map?.image && !textureCanvas) {
          textureCanvas = document.createElement('canvas');
          textureCanvas.width = material.map.image.naturalWidth || material.map.image.width;
          textureCanvas.height = material.map.image.naturalHeight || material.map.image.height;
          textureContext = textureCanvas.getContext('2d', { willReadFrequently: true });
          textureContext.drawImage(material.map.image, 0, 0);
          textureFlipY = material.map.flipY;
        }
      });
    });

    heartPivot.add(heart);
    heartPivot.visible = true;
    heartPivot.scale.setScalar(reducedMotion ? 1 : 0.88);
  },
  undefined,
  (error) => console.error('Unable to load the heart model.', error),
);

function sampleTextureColor(uv) {
  if (!textureContext || !uv) return null;
  const width = textureCanvas.width;
  const height = textureCanvas.height;
  const u = THREE.MathUtils.clamp(uv.x, 0, 0.9999);
  const v = THREE.MathUtils.clamp(uv.y, 0, 0.9999);
  const x = Math.floor(u * width);
  const y = Math.floor((textureFlipY ? 1 - v : v) * height);
  let red = 0;
  let green = 0;
  let blue = 0;
  let samples = 0;

  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      const pixel = textureContext.getImageData(
        THREE.MathUtils.clamp(x + offsetX, 0, width - 1),
        THREE.MathUtils.clamp(y + offsetY, 0, height - 1),
        1,
        1,
      ).data;
      red += pixel[0];
      green += pixel[1];
      blue += pixel[2];
      samples += 1;
    }
  }

  return { r: red / samples, g: green / samples, b: blue / samples };
}

function classifyPart(hit) {
  const localPoint = heartModel.worldToLocal(hit.point.clone());
  const size = heartLocalBounds.getSize(new THREE.Vector3());
  const normalized = new THREE.Vector3(
    (localPoint.x - heartLocalBounds.min.x) / size.x,
    (localPoint.y - heartLocalBounds.min.y) / size.y,
    (localPoint.z - heartLocalBounds.min.z) / size.z,
  );
  const color = sampleTextureColor(hit.uv);
  const isBlue = color && color.b > color.r * 1.18 && color.b > color.g * 1.02;
  const isPink = color && color.r > color.g * 1.15 && color.b > color.g * 1.05 && color.b > color.r * 0.38;

  if (isBlue) {
    if (normalized.y > 0.7) return 'superiorVenaCava';
    if (normalized.y < 0.27) return 'inferiorVenaCava';
    return 'pulmonaryArtery';
  }

  if (normalized.y > 0.62 && normalized.x < 0.52) return 'aorta';
  if (normalized.y < 0.22 && normalized.x > 0.6) return 'apex';
  if (normalized.y > 0.55 && normalized.x > 0.55 && isPink) return 'leftAtrium';
  if (normalized.y > 0.45 && normalized.x < 0.52) return 'rightAtrium';
  if (normalized.y < 0.56 && normalized.x >= 0.5) return 'leftVentricle';
  if (normalized.y < 0.6) return 'rightVentricle';
  if (normalized.x > 0.55) return 'leftAtrium';
  return 'rightAtrium';
}

function getIntersection(clientX, clientY) {
  if (!heartModel) return null;
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObject(heartModel, true)[0] || null;
}

function showPart(key) {
  const part = partDefinitions[key];
  if (!part) return;
  partName.textContent = part.name;
  partDescription.textContent = part.description;
  partInfo.hidden = false;
  partInfo.setAttribute('aria-hidden', 'false');
  hasSelection = true;
}

function hidePart() {
  partInfo.hidden = true;
  partInfo.setAttribute('aria-hidden', 'true');
  hasSelection = false;
}

function selectPartAt(clientX, clientY) {
  const hit = getIntersection(clientX, clientY);
  if (!hit) {
    hidePart();
    return;
  }
  showPart(classifyPart(hit));
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
});

renderer.domElement.addEventListener('pointerup', (event) => {
  if (!pointerStart || pointerStart.id !== event.pointerId) return;
  const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
  pointerStart = null;
  if (distance < 7) selectPartAt(event.clientX, event.clientY);
});

renderer.domElement.addEventListener('pointercancel', () => {
  pointerStart = null;
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') hidePart();
});

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;
  const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
  const distance = Math.max(5.3, (2.05 / aspect) / (2 * Math.tan(halfFov)) * 1.18);

  camera.aspect = aspect;
  camera.position.normalize().multiplyScalar(distance);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  controls.update();
}

window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
let reveal = reducedMotion ? 1 : 0;

renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  reveal = Math.min(1, reveal + delta * 1.6);
  const easedReveal = 1 - Math.pow(1 - reveal, 3);
  const beatPhase = elapsed % 1.4;
  const primaryBeat = Math.exp(-Math.pow((beatPhase - 0.14) / 0.055, 2));
  const secondaryBeat = 0.45 * Math.exp(-Math.pow((beatPhase - 0.3) / 0.075, 2));
  const pulse = reducedMotion ? 1 : 1 + (primaryBeat + secondaryBeat) * 0.015;

  heartPivot.scale.setScalar((0.88 + easedReveal * 0.12) * pulse);

  if (!reducedMotion && !hasSelection && !isInteracting) {
    heartPivot.rotation.y += delta * 0.12;
    heartPivot.position.y = Math.sin(elapsed * 0.9) * 0.035;
  }

  controls.update(delta);
  renderer.render(scene, camera);
});
