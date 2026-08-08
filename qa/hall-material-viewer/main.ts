import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

type Mode = 'L0-minimal-runtime' | 'L1-external-lightmap';
type SpikeMetrics = {
  mode: Mode;
  loadComplete: boolean;
  drawCalls: number;
  triangles: number;
  textures: number;
  programs: number;
  rawBytes: number;
  optimizedBytes: number;
  errors: string[];
  lightmapBindings: number;
};

declare global {
  interface Window {
    __HALL_SPIKE__?: SpikeMetrics;
  }
}

const params = new URLSearchParams(location.search);
const requested = params.get('mode');
const mode: Mode = requested === 'L1-external-lightmap' ? 'L1-external-lightmap' : 'L0-minimal-runtime';
const errors: string[] = [];
window.__HALL_SPIKE__ = {
  mode,
  loadComplete: false,
  drawCalls: 0,
  triangles: 0,
  textures: 0,
  programs: 0,
  rawBytes: 0,
  optimizedBytes: 0,
  errors,
  lightmapBindings: 0,
};

window.addEventListener('error', (event) => errors.push(String(event.error ?? event.message)));
window.addEventListener('unhandledrejection', (event) => errors.push(String(event.reason)));

const mount = document.getElementById('app');
if (!mount) throw new Error('Missing #app mount');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = false;
mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111317);

const fetchBytes = async (url: string) => (await (await fetch(url)).arrayBuffer()).byteLength;
const rawBytesPromise = fetchBytes('/generated/material-spike-raw.glb');
const optimizedBytesPromise = fetchBytes('/generated/material-spike-optimized.glb');

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const exrLoader = new EXRLoader();

async function applyExternalLightmaps(root: THREE.Object3D): Promise<number> {
  const response = await fetch('/generated/lightmap-bindings.json');
  if (!response.ok) throw new Error(`lightmap bindings fetch failed: ${response.status}`);
  const document = await response.json() as {
    bindings: Array<{ node: string; texture: string; uvChannel: number; runtimeColorSpace: string }>;
  };
  let applied = 0;
  for (const binding of document.bindings) {
    const object = root.getObjectByName(binding.node) as THREE.Mesh | undefined;
    if (!object?.isMesh) throw new Error(`Missing lightmap target ${binding.node}`);
    const sourceMaterial = object.material;
    if (Array.isArray(sourceMaterial)) throw new Error(`Unexpected material array on ${binding.node}`);
    const material = sourceMaterial.clone() as THREE.MeshStandardMaterial;
    const texture = await exrLoader.loadAsync(`/generated/lightmaps/${binding.texture}`);
    texture.colorSpace = THREE.LinearSRGBColorSpace;
    texture.channel = binding.uvChannel;
    texture.flipY = false;
    texture.needsUpdate = true;
    material.lightMap = texture;
    material.lightMapIntensity = 1;
    material.needsUpdate = true;
    object.material = material;
    applied += 1;
  }
  return applied;
}

function addMinimalRuntimeLighting(): void {
  const ambient = new THREE.AmbientLight(0xffffff, mode === 'L1-external-lightmap' ? 0.07 : 0.55);
  scene.add(ambient);
  if (mode === 'L0-minimal-runtime') {
    const key = new THREE.DirectionalLight(0xfff6e8, 1.65);
    key.position.set(8.6, 4.2, 5.8);
    key.castShadow = false;
    scene.add(key);
  }
}

function configureCamera(root: THREE.Object3D): THREE.PerspectiveCamera {
  const imported = root.getObjectByName('CAM_R1_pushkinViewing');
  if (!imported || !(imported as THREE.Camera).isCamera) throw new Error('Missing exported R1 camera');
  const camera = imported as THREE.PerspectiveCamera;
  camera.aspect = innerWidth / innerHeight;
  camera.near = 0.05;
  camera.far = 80;
  camera.updateProjectionMatrix();
  return camera;
}

async function boot(): Promise<void> {
  const gltf = await loader.loadAsync('/generated/material-spike-optimized.glb');
  scene.add(gltf.scene);
  addMinimalRuntimeLighting();
  const applied = mode === 'L1-external-lightmap' ? await applyExternalLightmaps(gltf.scene) : 0;
  const camera = configureCamera(gltf.scene);

  renderer.compile(scene, camera);
  renderer.render(scene, camera);
  await new Promise<void>((resolve) => requestAnimationFrame(() => {
    renderer.render(scene, camera);
    resolve();
  }));

  const [rawBytes, optimizedBytes] = await Promise.all([rawBytesPromise, optimizedBytesPromise]);
  const info = renderer.info;
  window.__HALL_SPIKE__ = {
    mode,
    loadComplete: true,
    drawCalls: info.render.calls,
    triangles: info.render.triangles,
    textures: info.memory.textures,
    programs: info.programs?.length ?? 0,
    rawBytes,
    optimizedBytes,
    errors,
    lightmapBindings: applied,
  };
}

boot().catch((error) => {
  errors.push(String(error?.stack ?? error));
  console.error(error);
});

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
});
