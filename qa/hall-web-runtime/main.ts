import * as THREE from 'three';
import layouts from '../../docs/hall-v3/greybox-layouts.json';
import cameraDecision from '../../docs/hall-v3/camera-decision.json';
import materialDecision from '../../docs/hall-v3/material-decision.json';
import './styles.css';

type Vec2 = [number, number];
type Vec3 = [number, number, number];
type WallSegment = [number, number, number, number];
type CameraWitness = {
  position: Vec3;
  target: Vec3;
  nextDestination: Vec3;
  note?: string;
};
type LayoutCandidate = {
  id: string;
  floorPolygon: Vec2[];
  walls: WallSegment[];
  route: Vec2[];
  cameras: Record<string, CameraWitness>;
  pushkin: {
    anchor: { center: Vec3; size: Vec3; rotationZ: number };
    documentCases: Array<{ name: string; center: Vec3; size: Vec3; rotationZ: number }>;
  };
};

type RuntimeMetrics = {
  firstFrameMs: number | null;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  pixelRatio: number;
  canvasWidth: number;
  canvasHeight: number;
};

type HallProofState = {
  ready: boolean;
  mode: 'webgl' | 'fallback';
  reason: string | null;
  authority: {
    topology: 'H3';
    layoutFingerprint: string;
    cameraRig: 'R1';
    lighting: 'L0-minimal-runtime';
    surfaceUv: 'UV0';
    documentaryMedia: 'excluded';
  };
  reducedMotion: boolean;
  currentCameraStop: string;
  cameraStops: string[];
  metrics: RuntimeMetrics;
};

declare global {
  interface Window {
    __HALL_WEB_PROOF__?: HallProofState;
  }
}

function asVec2(value: readonly number[], label: string): Vec2 {
  if (value.length !== 2 || value.some((entry) => !Number.isFinite(entry))) throw new Error(`${label} must contain exactly two finite numbers`);
  return [value[0], value[1]];
}

function asVec3(value: readonly number[], label: string): Vec3 {
  if (value.length !== 3 || value.some((entry) => !Number.isFinite(entry))) throw new Error(`${label} must contain exactly three finite numbers`);
  return [value[0], value[1], value[2]];
}

function asWall(value: readonly number[], label: string): WallSegment {
  if (value.length !== 4 || value.some((entry) => !Number.isFinite(entry))) throw new Error(`${label} must contain exactly four finite numbers`);
  return [value[0], value[1], value[2], value[3]];
}

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Hall proof DOM is missing ${selector}`);
  return element;
}

const rawLayout = layouts.candidates.find((candidate) => candidate.id === 'H3');
if (!rawLayout) throw new Error('H3 layout authority is missing');

const cameras: Record<string, CameraWitness> = {};
for (const [name, source] of Object.entries(rawLayout.cameras)) {
  cameras[name] = {
    position: asVec3(source.position, `H3 camera ${name}.position`),
    target: asVec3(source.target, `H3 camera ${name}.target`),
    nextDestination: asVec3(source.nextDestination, `H3 camera ${name}.nextDestination`),
    note: source.note,
  };
}

const layout: LayoutCandidate = {
  id: rawLayout.id,
  floorPolygon: rawLayout.floorPolygon.map((value, index) => asVec2(value, `H3 floorPolygon[${index}]`)),
  walls: rawLayout.walls.map((value, index) => asWall(value, `H3 walls[${index}]`)),
  route: rawLayout.route.map((value, index) => asVec2(value, `H3 route[${index}]`)),
  cameras,
  pushkin: {
    anchor: {
      center: asVec3(rawLayout.pushkin.anchor.center, 'H3 Pushkin anchor.center'),
      size: asVec3(rawLayout.pushkin.anchor.size, 'H3 Pushkin anchor.size'),
      rotationZ: rawLayout.pushkin.anchor.rotationZ,
    },
    documentCases: rawLayout.pushkin.documentCases.map((item, index) => ({
      name: item.name,
      center: asVec3(item.center, `H3 documentCases[${index}].center`),
      size: asVec3(item.size, `H3 documentCases[${index}].size`),
      rotationZ: item.rotationZ,
    })),
  },
};

const approvedCamera = cameraDecision.approvedCamera;
if (cameraDecision.selectedTopology !== 'H3' || cameraDecision.selectedRig !== 'R1' || approvedCamera.rigId !== 'R1') {
  throw new Error('R1 camera authority is not selected for H3');
}
if (materialDecision.lightingDecision.selected !== 'L0-minimal-runtime' || materialDecision.uvDecision.surfaceMaterialUv !== 'UV0') {
  throw new Error('L0/UV0 material authority drifted');
}

const canvasHost = requiredElement<HTMLElement>('#hall-proof-canvas');
const fallback = requiredElement<HTMLElement>('#hall-proof-fallback');
const status = requiredElement<HTMLElement>('#hall-proof-status');
const prev = requiredElement<HTMLButtonElement>('#hall-proof-prev');
const next = requiredElement<HTMLButtonElement>('#hall-proof-next');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(window.location.search);
const forceWebglFailure = params.get('forceWebglFailure') === '1';
const startedAt = performance.now();
const cameraStopNames = ['entryReveal', 'orientation', 'firstTransition', 'pushkinApproach', 'pushkinViewing', 'reverseExit'] as const;
let currentStopIndex = 0;
let renderer: THREE.WebGLRenderer | null = null;
let animationFrame = 0;
let firstFrameRecorded = false;
let cleanupRuntimeListeners = () => {};

const baseMetrics = (): RuntimeMetrics => ({
  firstFrameMs: null,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
  canvasWidth: canvasHost.clientWidth,
  canvasHeight: canvasHost.clientHeight,
});

const proofState: HallProofState = {
  ready: false,
  mode: 'fallback',
  reason: null,
  authority: {
    topology: 'H3',
    layoutFingerprint: '5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65',
    cameraRig: 'R1',
    lighting: 'L0-minimal-runtime',
    surfaceUv: 'UV0',
    documentaryMedia: 'excluded',
  },
  reducedMotion,
  currentCameraStop: cameraStopNames[0],
  cameraStops: [...cameraStopNames],
  metrics: baseMetrics(),
};
window.__HALL_WEB_PROOF__ = proofState;

function mapPosition([x, y, z]: Vec3): THREE.Vector3 {
  return new THREE.Vector3(x, z, y);
}

function mapPoint([x, y]: Vec2, height = 0): THREE.Vector3 {
  return new THREE.Vector3(x, height, y);
}

function setStatus(message: string) {
  status.textContent = message;
}

function enterFallback(reason: string) {
  cleanupRuntimeListeners();
  cleanupRuntimeListeners = () => {};
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  renderer?.dispose();
  renderer = null;
  canvasHost.replaceChildren();
  fallback.hidden = false;
  canvasHost.hidden = true;
  prev.disabled = true;
  next.disabled = true;
  proofState.ready = true;
  proofState.mode = 'fallback';
  proofState.reason = reason;
  proofState.metrics = baseMetrics();
  setStatus(`Fallback: ${reason}`);
  document.documentElement.dataset.hallProofState = 'fallback';
}

if (forceWebglFailure || typeof WebGLRenderingContext === 'undefined') {
  enterFallback(forceWebglFailure ? 'forced-webgl-unavailable' : 'webgl-unavailable');
} else {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch {
    enterFallback('webgl-construction-failed');
  }
}

if (renderer) {
  const activeRenderer = renderer;
  activeRenderer.setPixelRatio(proofState.metrics.pixelRatio);
  activeRenderer.outputColorSpace = THREE.SRGBColorSpace;
  activeRenderer.shadowMap.enabled = false;
  canvasHost.appendChild(activeRenderer.domElement);
  activeRenderer.domElement.setAttribute('data-hall-proof-canvas', 'true');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090909);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);
  camera.setFocalLength(28);

  scene.add(new THREE.HemisphereLight(0xf4ead7, 0x151515, 1.35));
  scene.add(new THREE.AmbientLight(0xffffff, 0.28));

  const architectureMaterial = new THREE.MeshStandardMaterial({ color: 0x706b63, roughness: 0.86, metalness: 0 });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x252321, roughness: 0.95, metalness: 0 });
  const exhibitMaterial = new THREE.MeshStandardMaterial({ color: 0x9b814d, roughness: 0.58, metalness: 0 });
  const caseMaterial = new THREE.MeshStandardMaterial({ color: 0x4b4438, roughness: 0.72, metalness: 0 });

  const floorShape = new THREE.Shape();
  layout.floorPolygon.forEach(([x, y], index) => {
    if (index === 0) floorShape.moveTo(x, -y);
    else floorShape.lineTo(x, -y);
  });
  floorShape.closePath();
  const floor = new THREE.Mesh(new THREE.ShapeGeometry(floorShape), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.name = 'H3_FLOOR';
  scene.add(floor);

  const wallThickness = 0.25;
  const wallHeight = 4.5;
  layout.walls.forEach(([x1, y1, x2, y2], index) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(length, wallHeight, wallThickness), architectureMaterial);
    wall.position.set((x1 + x2) / 2, wallHeight / 2, (y1 + y2) / 2);
    wall.rotation.y = -Math.atan2(dy, dx);
    wall.name = `H3_WALL_${String(index + 1).padStart(2, '0')}`;
    scene.add(wall);
  });

  const routeGeometry = new THREE.BufferGeometry().setFromPoints(layout.route.map((point) => mapPoint(point, 0.018)));
  const route = new THREE.Line(routeGeometry, new THREE.LineBasicMaterial({ color: 0xb99a58, transparent: true, opacity: 0.5 }));
  route.name = 'H3_GUIDED_ROUTE';
  scene.add(route);

  const anchor = layout.pushkin.anchor;
  const anchorMesh = new THREE.Mesh(new THREE.BoxGeometry(anchor.size[0], anchor.size[2], anchor.size[1]), exhibitMaterial);
  anchorMesh.position.copy(mapPosition(anchor.center));
  anchorMesh.rotation.y = -anchor.rotationZ;
  anchorMesh.name = 'EXHIBIT_alexander-pushkin_NEUTRAL_PROXY';
  anchorMesh.userData.documentaryMedia = 'excluded';
  scene.add(anchorMesh);

  for (const item of layout.pushkin.documentCases) {
    const caseMesh = new THREE.Mesh(new THREE.BoxGeometry(item.size[0], item.size[2], item.size[1]), caseMaterial);
    caseMesh.position.copy(mapPosition(item.center));
    caseMesh.rotation.y = -item.rotationZ;
    caseMesh.name = `${item.name}_NEUTRAL_PROXY`;
    caseMesh.userData.documentaryMedia = 'excluded';
    scene.add(caseMesh);
  }

  const cameraWitnesses = new Map<string, CameraWitness>();
  for (const name of cameraStopNames) {
    const source = layout.cameras[name];
    if (source) cameraWitnesses.set(name, source);
  }
  cameraWitnesses.set('pushkinViewing', {
    position: asVec3(approvedCamera.position, 'R1 approvedCamera.position'),
    target: asVec3(approvedCamera.target, 'R1 approvedCamera.target'),
    nextDestination: asVec3(approvedCamera.nextDestination, 'R1 approvedCamera.nextDestination'),
    note: 'R1 approved Pushkin viewing witness',
  });

  function witness(name: string) {
    const value = cameraWitnesses.get(name);
    if (!value) throw new Error(`Missing camera witness ${name}`);
    return value;
  }

  let targetLookAt = mapPosition(witness(cameraStopNames[0]).target);
  let transition: null | {
    start: number;
    duration: number;
    fromPosition: THREE.Vector3;
    toPosition: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
  } = null;

  function applyCameraStop(index: number, immediate = reducedMotion) {
    currentStopIndex = (index + cameraStopNames.length) % cameraStopNames.length;
    const name = cameraStopNames[currentStopIndex];
    const nextWitness = witness(name);
    const toPosition = mapPosition(nextWitness.position);
    const toTarget = mapPosition(nextWitness.target);
    proofState.currentCameraStop = name;
    setStatus(`${name}${reducedMotion ? ' · reduced-motion cut' : ''}`);

    if (immediate) {
      transition = null;
      camera.position.copy(toPosition);
      targetLookAt.copy(toTarget);
      camera.lookAt(targetLookAt);
      return;
    }

    transition = {
      start: performance.now(),
      duration: 900,
      fromPosition: camera.position.clone(),
      toPosition,
      fromTarget: targetLookAt.clone(),
      toTarget,
    };
  }

  const initialWitness = witness(cameraStopNames[0]);
  camera.position.copy(mapPosition(initialWitness.position));
  targetLookAt = mapPosition(initialWitness.target);
  camera.lookAt(targetLookAt);

  const onPrev = () => applyCameraStop(currentStopIndex - 1);
  const onNext = () => applyCameraStop(currentStopIndex + 1);
  const onResize = () => {
    if (renderer !== activeRenderer) return;
    const width = Math.max(1, canvasHost.clientWidth);
    const height = Math.max(1, canvasHost.clientHeight);
    activeRenderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    proofState.metrics.canvasWidth = width;
    proofState.metrics.canvasHeight = height;
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    enterFallback('webgl-context-lost');
  };

  prev.addEventListener('click', onPrev);
  next.addEventListener('click', onNext);
  window.addEventListener('resize', onResize, { passive: true });
  activeRenderer.domElement.addEventListener('webglcontextlost', onContextLost);
  cleanupRuntimeListeners = () => {
    prev.removeEventListener('click', onPrev);
    next.removeEventListener('click', onNext);
    window.removeEventListener('resize', onResize);
    activeRenderer.domElement.removeEventListener('webglcontextlost', onContextLost);
  };
  onResize();

  function frame(now: number) {
    if (renderer !== activeRenderer) return;
    if (transition) {
      const elapsed = Math.min(1, (now - transition.start) / transition.duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      camera.position.lerpVectors(transition.fromPosition, transition.toPosition, eased);
      targetLookAt.lerpVectors(transition.fromTarget, transition.toTarget, eased);
      camera.lookAt(targetLookAt);
      if (elapsed >= 1) transition = null;
    }

    activeRenderer.render(scene, camera);
    proofState.metrics.drawCalls = activeRenderer.info.render.calls;
    proofState.metrics.triangles = activeRenderer.info.render.triangles;
    proofState.metrics.geometries = activeRenderer.info.memory.geometries;
    proofState.metrics.textures = activeRenderer.info.memory.textures;

    if (!firstFrameRecorded) {
      firstFrameRecorded = true;
      proofState.metrics.firstFrameMs = Math.round((now - startedAt) * 100) / 100;
      proofState.ready = true;
      proofState.mode = 'webgl';
      proofState.reason = null;
      document.documentElement.dataset.hallProofState = 'webgl';
      setStatus(`${proofState.currentCameraStop} · WebGL ready`);
    }

    animationFrame = requestAnimationFrame(frame);
  }

  animationFrame = requestAnimationFrame(frame);
}
