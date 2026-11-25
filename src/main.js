import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const container = document.querySelector('#scene');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const partInfo = document.querySelector('#part-info');
const partName = document.querySelector('#part-name');
const partDescription = document.querySelector('#part-description');
const organList = document.querySelector('#organ-list');
const organStatus = document.querySelector('#organ-status');
const fullscreenToggle = document.querySelector('#fullscreen-toggle');

const organDefinitions = {
  heart: {
    label: 'Heart',
    file: '/heart.glb',
    description: 'A muscular organ that pumps blood through the circulatory system. Click a region to identify its anatomy.',
  },
  maleAnatomy: {
    label: 'Male anatomy',
    file: '/models/male-anatomy.glb',
    description: 'A full male body model showing major anatomical systems, internal organs, and sensory structures.',
  },
  femaleAnatomy: {
    label: 'Female anatomy',
    file: '/models/female-anatomy.glb',
    description: 'A full female body model showing major anatomical systems, internal organs, and reproductive structures.',
  },
  brain: {
    label: 'Brain',
    file: '/models/brain.glb',
    description: 'The control center of the nervous system, responsible for thought, memory, emotion, movement, and sensory processing.',
  },
  skull: {
    label: 'Skull',
    file: '/models/skull.glb',
    description: 'The bony structure that encloses and protects the brain and supports the structures of the face.',
  },
  stomach: {
    label: 'Stomach',
    file: '/models/stomach.glb',
    description: 'A muscular digestive organ that stores food, mixes it with gastric acid, and begins protein digestion.',
  },
  liverMale: {
    label: 'Liver (male)',
    file: '/models/liver-male.glb',
    description: 'The largest gland in the body. This male model shows the liver lobes, surfaces, and associated ligaments.',
  },
  liverFemale: {
    label: 'Liver (female)',
    file: '/models/liver-female.glb',
    description: 'The largest gland in the body. This female model shows the liver lobes, surfaces, and associated ligaments.',
  },
  lungs: {
    label: 'Lungs (female)',
    file: '/models/lungs.glb',
    description: 'A pair of spongy organs where oxygen enters the blood and carbon dioxide is removed. This female model includes the bronchial tree.',
  },
  kidneys: {
    label: 'Kidneys',
    file: '/models/kidneys.glb',
    description: 'A pair of bean-shaped organs that filter blood, remove waste, and regulate fluid, electrolytes, and blood pressure.',
  },
};

const organIcons = {
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
  maleAnatomy: '<circle cx="9" cy="4.5" r="2"/><path d="M5 11c1.2-1.5 2.4-2.2 4-2.2s2.8.7 4 2.2l1.5 5-2 1-1-3v4l2 5M9 9v7l-2 5M9 13l2 5M16 7h5M18.5 4.5v5"/>',
  femaleAnatomy: '<circle cx="9" cy="4.5" r="2"/><path d="M5 11c1.2-1.5 2.4-2.2 4-2.2s2.8.7 4 2.2l1.5 5-2 1-1-3v4l2 5M9 9v7l-2 5M9 13l2 5"/><circle cx="18" cy="9" r="3"/><path d="M18 6v6M15 9h6"/>',
  brain: '<path d="M9.5 4.5A2.5 2.5 0 0 0 5 6a2.5 2.5 0 0 0-1 4.8A3 3 0 0 0 5 16a2.5 2.5 0 0 0 4.5 1.5V4.5ZM14.5 4.5A2.5 2.5 0 0 1 19 6a2.5 2.5 0 0 1 1 4.8 3 3 0 0 1-1 5.2 2.5 2.5 0 0 1-4.5 1.5V4.5Z"/><path d="M8 9h4M12 15h4"/>',
  skull: '<path d="M5 11a7 7 0 0 1 14 0v4l-2 1v3H7v-3l-2-1Z"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/><path d="m10 16 2-2 2 2"/>',
  stomach: '<path d="M9 3v5c0 2-2 3-3.5 5S4 18 7 20c3 2 7 .5 9-2s3-5 1-7-4-1-4-3V3"/><path d="M9 8h5"/>',
  liverMale: '<path d="M4 8c2-3 7-4 11-2 3 1 5 3 5 6 0 3-3 5-7 5-3 0-5-2-8-2-2 0-3-3-1-7Z"/><path d="M13 6c0 3 1 6 1 9"/>',
  liverFemale: '<path d="M4 8c2-3 7-4 11-2 3 1 5 3 5 6 0 3-3 5-7 5-3 0-5-2-8-2-2 0-3-3-1-7Z"/><path d="M13 6c0 3 1 6 1 9"/>',
  lungs: '<path d="M12 3v8M9 7c-2-2-5 0-6 4-1 4-1 8 1 9 2 1 5-1 5-4V7ZM15 7c2-2 5 0 6 4 1 4 1 8-1 9-2 1-5-1-5-4V7Z"/>',
  kidneys: '<path d="M8 5C5 4 3 7 3 11s1 7 4 7c3 0 4-3 3-6s-1-6-2-7ZM16 5c3-1 5 2 5 6s-1 7-4 7c-3 0-4-3-3-6s1-6 2-7Z"/>',
};

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

Object.entries(organDefinitions).forEach(([key, definition]) => {
  const label = document.createElement('label');
  label.className = 'organ-option';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.value = key;
  input.checked = key === 'heart';

  const mark = document.createElement('span');
  mark.className = 'checkbox-mark';
  mark.setAttribute('aria-hidden', 'true');

  const icon = document.createElement('span');
  icon.className = 'organ-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = `<svg viewBox="0 0 24 24">${organIcons[key]}</svg>`;

  const text = document.createElement('span');
  text.className = 'organ-name';
  text.textContent = definition.label;

  label.append(input, mark, icon, text);
  organList.append(label);
});

function updateFullscreenButton() {
  const isFullscreen = document.fullscreenElement === document.documentElement;
  const label = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen';
  fullscreenToggle.setAttribute('aria-label', label);
  fullscreenToggle.setAttribute('aria-pressed', String(isFullscreen));
  fullscreenToggle.title = label;
}

fullscreenToggle.hidden = typeof document.documentElement.requestFullscreen !== 'function';

fullscreenToggle.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  } catch (error) {
    console.error('Unable to change fullscreen mode.', error);
  }
});

document.addEventListener('fullscreenchange', () => {
  updateFullscreenButton();
  resize();
});

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

const organPivot = new THREE.Group();
organPivot.visible = false;
scene.add(organPivot);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const loadingOrgans = new Map();
let activeOrgan = null;
let displayedOrganKey = null;
let requestedOrganKey = null;
let selectionVersion = 0;
let activeReveal = reducedMotion ? 1 : 0;
let isInteracting = false;
let pointerStart = null;

controls.addEventListener('start', () => {
  isInteracting = true;
});

controls.addEventListener('end', () => {
  isInteracting = false;
});

function isFemaleMuscle(name) {
  return /muscle|deltoid|trapezius|intercostals|calf|upper_arm|back_muscles|adductors|gluteal|iliopsoas|rotator|shoulder|shin|abdominal|quadriceps|hamstrings|pelvic_floor/.test(name.toLowerCase());
}

function getFemaleAnatomyColor(name) {
  const part = name.toLowerCase();
  if (/arter|aorta|carotid|coronary|pulmonary_vessels/.test(part)) return 0xb63d4b;
  if (/vein|vena_cava/.test(part)) return 0x426a9d;
  if (/heart/.test(part)) return 0x8f263d;
  if (/lung|trachea|bronchi|larynx|diaphragm|pharynx/.test(part)) return 0xc17f8a;
  if (/brain|cerebellum|spinal|cranial|pituitary/.test(part)) return 0xc2a38f;
  if (isFemaleMuscle(part)) return 0xa94d55;
  if (/kidney|ureter|bladder|adrenal/.test(part)) return 0xa64550;
  if (/uterus|ovary|fallopian|vagina|breast/.test(part)) return 0xb16f8f;
  if (/liver|appendix|colon|gallbladder|esophagus|intestine|stomach|pancreas|salivary|tongue/.test(part)) return 0xa45e48;
  if (/thymus|spleen/.test(part)) return 0x9d596d;
  if (/skin/.test(part)) return 0xb88c74;
  if (/eye/.test(part)) return 0xd7d8d0;
  return 0xc1b49c;
}

function prepareModel(gltf, definition, key) {
  const model = gltf.scene;
  model.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);
  if (!maxSize) throw new Error(`The ${definition.label} model has no geometry.`);

  model.scale.multiplyScalar(2.4 / maxSize);
  model.updateMatrixWorld(true);

  const scaledBounds = new THREE.Box3().setFromObject(model);
  const scaledCenter = scaledBounds.getCenter(new THREE.Vector3());
  const normalizedSize = scaledBounds.getSize(new THREE.Vector3());
  model.position.sub(scaledCenter);

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  let textureCanvas = null;
  let textureContext = null;
  let textureFlipY = false;

  model.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;

    if (key === 'femaleAnatomy') {
      if (/^skin(?:_\d+)?$/i.test(object.name) || isFemaleMuscle(object.name)) {
        object.visible = false;
        return;
      }
      object.material = object.material.clone();
      object.material.color.set(getFemaleAnatomyColor(object.name));
    }

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material.color) material.color.multiplyScalar(0.52);
      if ('metalness' in material) material.metalness = 0.48;
      if ('roughness' in material) material.roughness = 0.2;
      if ('envMapIntensity' in material) material.envMapIntensity = 1.8;
      if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;

      Object.values(material).forEach((value) => {
        if (value?.isTexture) value.anisotropy = maxAnisotropy;
      });

      if (key === 'heart' && material.map?.image && !textureCanvas) {
        textureCanvas = document.createElement('canvas');
        textureCanvas.width = material.map.image.naturalWidth || material.map.image.width;
        textureCanvas.height = material.map.image.naturalHeight || material.map.image.height;
        textureContext = textureCanvas.getContext('2d', { willReadFrequently: true });
        textureContext.drawImage(material.map.image, 0, 0);
        textureFlipY = material.map.flipY;
      }
    });
  });

  if (key === 'kidneys') {
    const kidneyMeshes = [];
    model.traverse((object) => {
      if (object.isMesh) kidneyMeshes.push(object);
    });
    kidneyMeshes.forEach((object) => {
      object.userData.centerX = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3()).x;
    });
    kidneyMeshes.sort((first, second) => second.userData.centerX - first.userData.centerX);
    kidneyMeshes.forEach((object, index) => {
      object.userData.partName = index === 0 ? 'Left kidney' : 'Right kidney';
    });
  }

  model.name = definition.label;
  model.visible = false;

  return { model, bounds, size, normalizedSize, textureCanvas, textureContext, textureFlipY };
}

function loadOrgan(key, definition) {
  if (loadingOrgans.has(key)) return loadingOrgans.get(key);

  const request = loader
    .loadAsync(definition.file)
    .then((gltf) => prepareModel(gltf, definition, key))
    .finally(() => {
      loadingOrgans.delete(key);
    });

  loadingOrgans.set(key, request);
  return request;
}

function updateOrganCheckboxes(key) {
  organList.querySelectorAll('input').forEach((input) => {
    input.checked = input.value === key;
  });
}

function disposeOrgan(organ) {
  if (!organ) return;
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const images = new Set();

  organ.model.traverse((object) => {
    if (!object.isMesh) return;
    geometries.add(object.geometry);
    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
    objectMaterials.forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value) => {
        if (value?.isTexture) {
          textures.add(value);
          if (value.image) images.add(value.image);
        }
      });
    });
  });

  organ.model.removeFromParent();
  organ.model.visible = false;
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
  images.forEach((image) => image.close?.());
}

function setEmptyView() {
  disposeOrgan(activeOrgan);
  activeOrgan = null;
  displayedOrganKey = null;
  organPivot.visible = false;
}

function resetView() {
  organPivot.rotation.set(0, 0, 0);
  organPivot.position.y = 0;
  controls.reset();
}

function showOrgan(key, organ) {
  if (activeOrgan && activeOrgan !== organ) disposeOrgan(activeOrgan);
  organPivot.add(organ.model);
  organ.model.visible = true;
  activeOrgan = organ;
  displayedOrganKey = key;
  activeReveal = reducedMotion ? 1 : 0;
  organPivot.visible = true;
  organStatus.hidden = true;
  resize();

  const definition = organDefinitions[key];
  renderer.domElement.setAttribute(
    'aria-label',
    key === 'heart'
      ? 'A 3D heart. Click a part to learn its name, or drag to rotate.'
      : `A 3D ${definition.label.toLowerCase()} model. Click for information, or drag to rotate.`,
  );
}

async function selectOrgan(key) {
  const definition = organDefinitions[key];
  if (!definition) return;

  const version = ++selectionVersion;
  requestedOrganKey = key;
  updateOrganCheckboxes(key);
  hidePart();
  setEmptyView();
  resetView();

  organStatus.textContent = `Loading ${definition.label.toLowerCase()}…`;
  organStatus.hidden = false;

  try {
    const organ = await loadOrgan(key, definition);
    if (version !== selectionVersion || requestedOrganKey !== key) {
      if (requestedOrganKey !== key) disposeOrgan(organ);
      return;
    }
    showOrgan(key, organ);
  } catch (error) {
    if (version !== selectionVersion) return;
    console.error(`Unable to load ${definition.label}.`, error);
    organStatus.textContent = `Unable to load ${definition.label.toLowerCase()}.`;
  }
}

function clearOrgan() {
  selectionVersion += 1;
  requestedOrganKey = null;
  updateOrganCheckboxes(null);
  setEmptyView();
  hidePart();
  organStatus.hidden = true;
}

organList.addEventListener('change', (event) => {
  if (!(event.target instanceof HTMLInputElement)) return;
  if (event.target.checked) {
    void selectOrgan(event.target.value);
  } else {
    clearOrgan();
  }
});

function sampleTextureColor(uv, organ) {
  if (!organ?.textureContext || !uv) return null;
  const width = organ.textureCanvas.width;
  const height = organ.textureCanvas.height;
  const u = THREE.MathUtils.clamp(uv.x, 0, 0.9999);
  const v = THREE.MathUtils.clamp(uv.y, 0, 0.9999);
  const x = Math.floor(u * width);
  const y = Math.floor((organ.textureFlipY ? 1 - v : v) * height);
  let red = 0;
  let green = 0;
  let blue = 0;
  let samples = 0;

  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      const pixel = organ.textureContext.getImageData(
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

function classifyHeartPart(hit) {
  const localPoint = activeOrgan.model.worldToLocal(hit.point.clone());
  const bounds = activeOrgan.bounds;
  const size = activeOrgan.size;
  const normalized = new THREE.Vector3(
    (localPoint.x - bounds.min.x) / Math.max(size.x, 0.0001),
    (localPoint.y - bounds.min.y) / Math.max(size.y, 0.0001),
    (localPoint.z - bounds.min.z) / Math.max(size.z, 0.0001),
  );
  const color = sampleTextureColor(hit.uv, activeOrgan);
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

function formatPartName(name) {
  if (!name) return null;

  const systemNames = [
    [/musclev3/i, 'Muscular system'],
    [/digestiveSystem/i, 'Digestive system'],
    [/lymphatic[_\s]?system/i, 'Lymphatic system'],
    [/nervous[_\s]?system/i, 'Nervous system'],
    [/skeletonv2/i, 'Skeletal system'],
    [/urinarySystem/i, 'Urinary system'],
    [/bronchial[_\s]?tree/i, 'Bronchial tree'],
    [/diaphragm/i, 'Diaphragm'],
  ];
  const systemName = systemNames.find(([pattern]) => pattern.test(name))?.[1];
  if (systemName) return systemName;

  if (
    /^(mesh[-_]\d+|scene|root(?:[._]\d+)*|rootnode(?:[._]\d+)*|sketchfab_model(?:[._]\d+)*|gltf_scenerootnode(?:[._]\d+)*|object_\d+(?:[._]\d+)*|polygon_reduction.*|group\d+(?:[._]\d+)*|sphere(?:[._]\d+)*|stingraypbs.*|default|material|.*kidney_tex.*|.*brain_mri.*|kidney.*group.*)$/i.test(name) ||
    /^[a-f0-9]{24,}(?:\.fbx)?(?:[._]\d+)*$/i.test(name)
  ) {
    return null;
  }

  const side = name.match(/^(.*?)[_-]([lr])$/i);
  if (side) name = `${side[2].toLowerCase() === 'l' ? 'left' : 'right'} ${side[1]}`;

  const formatted = name
    .replace(/^VH_[MF]_/i, '')
    .replace(/_/g, ' ')
    .replace(/\d+$/g, '')
    .replace(/\bPareital\b/gi, 'Parietal')
    .replace(/\bsegmennt\b/gi, 'segment')
    .replace(/\bsegm\b/gi, 'segment')
    .replace(/^([LR])\s+/i, (_, side) => (side.toLowerCase() === 'l' ? 'left ' : 'right '))
    .trim();

  if (!formatted || /^3d-vh-f-lung$/i.test(formatted)) return null;
  return formatted.replace(/\b\w/g, (character) => character.toUpperCase());
}

function getClickedPartName(hit) {
  if (hit.object.userData.partName) return hit.object.userData.partName;
  let object = hit.object;
  while (object && object !== activeOrgan.model) {
    const name = formatPartName(object.name);
    if (name) return name;
    object = object.parent;
  }
  return organDefinitions[displayedOrganKey].label;
}

function getIntersection(clientX, clientY) {
  if (!activeOrgan) return null;
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObject(activeOrgan.model, true).find((hit) => {
    let object = hit.object;
    while (object) {
      if (!object.visible) return false;
      object = object.parent;
    }
    return true;
  }) || null;
}

function showInfo(name, description) {
  partName.textContent = name;
  partDescription.textContent = description;
  partInfo.hidden = false;
  partInfo.setAttribute('aria-hidden', 'false');
}

function hidePart() {
  partInfo.hidden = true;
  partInfo.setAttribute('aria-hidden', 'true');
}

function selectPartAt(clientX, clientY) {
  if (!activeOrgan || requestedOrganKey !== displayedOrganKey) {
    hidePart();
    return;
  }

  const hit = getIntersection(clientX, clientY);
  if (!hit) {
    hidePart();
    return;
  }

  if (displayedOrganKey === 'heart') {
    const part = partDefinitions[classifyHeartPart(hit)];
    showInfo(part.name, part.description);
  } else {
    const definition = organDefinitions[displayedOrganKey];
    showInfo(getClickedPartName(hit), definition.description);
  }
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
  if (event.key === 'Escape' && !document.fullscreenElement) hidePart();
});

function resize() {
  const width = Math.max(window.innerWidth, 1);
  const height = Math.max(window.innerHeight, 1);
  const aspect = width / height;
  const mobile = width <= 600;
  const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
  const modelSize = activeOrgan?.normalizedSize || new THREE.Vector3(2.4, 2.4, 2.4);
  const widthDistance = (modelSize.x * (mobile ? 1.85 : 1.15)) / aspect / (2 * Math.tan(halfFov));
  const heightDistance = (modelSize.y * (mobile ? 1.18 : 1.12)) / (2 * Math.tan(halfFov));
  const distance = Math.max(5.3, widthDistance, heightDistance);
  const viewShift = mobile ? Math.min(0.22, 86 / width) : 0.035;

  camera.aspect = aspect;
  camera.position.normalize().multiplyScalar(distance);
  camera.setViewOffset(width, height, width * viewShift, 0, width, height);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  controls.update();
  controls.saveState();
}

window.addEventListener('resize', resize);
resize();
void selectOrgan('heart');

const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  activeReveal = Math.min(1, activeReveal + delta * 1.6);
  const easedReveal = 1 - Math.pow(1 - activeReveal, 3);
  const isHeart = displayedOrganKey === 'heart';
  const beatPhase = elapsed % 1.4;
  const primaryBeat = Math.exp(-Math.pow((beatPhase - 0.14) / 0.055, 2));
  const secondaryBeat = 0.45 * Math.exp(-Math.pow((beatPhase - 0.3) / 0.075, 2));
  const pulse = reducedMotion || !isHeart ? 1 : 1 + (primaryBeat + secondaryBeat) * 0.015;

  organPivot.scale.setScalar((0.88 + easedReveal * 0.12) * pulse);

  if (!reducedMotion && activeOrgan && partInfo.hidden && !isInteracting) {
    organPivot.rotation.y += delta * 0.12;
    organPivot.position.y = Math.sin(elapsed * 0.9) * 0.035;
  }

  controls.update(delta);
  renderer.render(scene, camera);
});
