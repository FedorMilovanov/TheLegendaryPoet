import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

type Mode = 'L0-minimal-runtime' | 'L1-external-lightmap';
type Asset = 'raw' | 'optimized';
type GpuTextureWitness = {
  uuid: string;
  roles: string[];
  width: number;
  height: number;
  format: string;
  type: string;
  colorSpace: string;
  channel: number;
  generateMipmaps: boolean;
  minFilter: string;
  baseLevelBytes: number;
  estimatedResidentBytes: number;
};
type SpikeMetrics = {
  mode: Mode;
  asset: Asset;
  loadComplete: boolean;
  drawCalls: number;
  triangles: number;
  textures: number;
  programs: number;
  rawBytes: number;
  optimizedBytes: number;
  gpuTextureResidentBytes: number;
  gpuTextures: GpuTextureWitness[];
  errors: string[];
  lightmapBindings: number;
  pixelHash: string;
  pixelSampleBase64: string;
  sampleGrid: [number, number];
};

declare global {
  interface Window {
    __HALL_SPIKE__?: SpikeMetrics;
  }
}

const params = new URLSearchParams(location.search);
const requestedMode = params.get('mode');
const requestedAsset = params.get('asset');
const mode: Mode = requestedMode === 'L1-external-lightmap' ? 'L1-external-lightmap' : 'L0-minimal-runtime';
const asset: Asset = requestedAsset === 'raw' ? 'raw' : 'optimized';
const errors: string[] = [];
const sampleGrid: [number, number] = [64, 36];
window.__HALL_SPIKE__ = {
  mode,
  asset,
  loadComplete: false,
  drawCalls: 0,
  triangles: 0,
  textures: 0,
  programs: 0,
  rawBytes: 0,
  optimizedBytes: 0,
  gpuTextureResidentBytes: 0,
  gpuTextures: [],
  errors,
  lightmapBindings: 0,
  pixelHash: '',
  pixelSampleBase64: '',
  sampleGrid,
};

window.addEventListener('error', (event) => errors.push(String(event.error ?? event.message)));
window.addEventListener('unhandledrejection', (event) => errors.push(String(event.reason)));

const mount = document.getElementById('app');
if (!mount) throw new Error('Missing #app mount');

const renderWidth = 960;
const renderHeight = 540;
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(1);
renderer.setSize(renderWidth, renderHeight, false);
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
  scene.add(new THREE.AmbientLight(0xffffff, mode === 'L1-external-lightmap' ? 0.07 : 0.55));
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
  camera.aspect = renderWidth / renderHeight;
  camera.near = 0.05;
  camera.far = 80;
  camera.updateProjectionMatrix();
  return camera;
}

function samplePixels(pixels: Uint8Array, width: number, height: number): Uint8Array {
  const [gridWidth, gridHeight] = sampleGrid;
  const sample = new Uint8Array(gridWidth * gridHeight * 4);
  let offset = 0;
  for (let gy = 0; gy < gridHeight; gy += 1) {
    const y = Math.min(height - 1, Math.floor(((gy + 0.5) / gridHeight) * height));
    for (let gx = 0; gx < gridWidth; gx += 1) {
      const x = Math.min(width - 1, Math.floor(((gx + 0.5) / gridWidth) * width));
      const source = (y * width + x) * 4;
      sample[offset++] = pixels[source];
      sample[offset++] = pixels[source + 1];
      sample[offset++] = pixels[source + 2];
      sample[offset++] = pixels[source + 3];
    }
  }
  return sample;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

async function pixelWitness(): Promise<{ hash: string; sample: string }> {
  const gl = renderer.getContext();
  gl.finish();
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', pixels));
  const hash = Array.from(digest, (value) => value.toString(16).padStart(2, '0')).join('');
  return { hash, sample: bytesToBase64(samplePixels(pixels, width, height)) };
}

function enumName(value: number): string {
  const known: Array<[number, string]> = [
    [THREE.RedFormat, 'RedFormat'],
    [THREE.RGFormat, 'RGFormat'],
    [THREE.RGBAFormat, 'RGBAFormat'],
    [THREE.UnsignedByteType, 'UnsignedByteType'],
    [THREE.ByteType, 'ByteType'],
    [THREE.UnsignedShortType, 'UnsignedShortType'],
    [THREE.ShortType, 'ShortType'],
    [THREE.UnsignedIntType, 'UnsignedIntType'],
    [THREE.IntType, 'IntType'],
    [THREE.FloatType, 'FloatType'],
    [THREE.HalfFloatType, 'HalfFloatType'],
    [THREE.NearestFilter, 'NearestFilter'],
    [THREE.LinearFilter, 'LinearFilter'],
    [THREE.NearestMipmapNearestFilter, 'NearestMipmapNearestFilter'],
    [THREE.NearestMipmapLinearFilter, 'NearestMipmapLinearFilter'],
    [THREE.LinearMipmapNearestFilter, 'LinearMipmapNearestFilter'],
    [THREE.LinearMipmapLinearFilter, 'LinearMipmapLinearFilter'],
  ];
  return known.find(([candidate]) => candidate === value)?.[1] ?? String(value);
}

function componentCount(format: number): number {
  if (format === THREE.RedFormat) return 1;
  if (format === THREE.RGFormat) return 2;
  return 4;
}

function componentBytes(type: number): number {
  if (type === THREE.ByteType || type === THREE.UnsignedByteType) return 1;
  if (type === THREE.ShortType || type === THREE.UnsignedShortType || type === THREE.HalfFloatType) return 2;
  if (type === THREE.IntType || type === THREE.UnsignedIntType || type === THREE.FloatType) return 4;
  throw new Error(`Unsupported texture type for resident-memory witness: ${enumName(type)}`);
}

function usesMipmaps(texture: THREE.Texture): boolean {
  if (!texture.generateMipmaps) return false;
  return texture.minFilter === THREE.NearestMipmapNearestFilter
    || texture.minFilter === THREE.NearestMipmapLinearFilter
    || texture.minFilter === THREE.LinearMipmapNearestFilter
    || texture.minFilter === THREE.LinearMipmapLinearFilter;
}

function estimateResidentBytes(texture: THREE.Texture): { width: number; height: number; baseLevelBytes: number; estimatedResidentBytes: number } {
  const image = texture.image as { width?: number; height?: number; data?: ArrayBufferView } | undefined;
  const width = Number(image?.width ?? 0);
  const height = Number(image?.height ?? 0);
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    throw new Error(`Texture ${texture.uuid} has no inspectable 2D dimensions`);
  }
  const typedBytes = image?.data && ArrayBuffer.isView(image.data) ? image.data.byteLength : 0;
  const baseLevelBytes = typedBytes > 0
    ? typedBytes
    : width * height * componentCount(texture.format) * componentBytes(texture.type);
  if (!usesMipmaps(texture)) return { width, height, baseLevelBytes, estimatedResidentBytes: baseLevelBytes };

  const bytesPerPixel = baseLevelBytes / (width * height);
  let mipWidth = width;
  let mipHeight = height;
  let estimatedResidentBytes = 0;
  while (true) {
    estimatedResidentBytes += Math.ceil(mipWidth * mipHeight * bytesPerPixel);
    if (mipWidth === 1 && mipHeight === 1) break;
    mipWidth = Math.max(1, Math.floor(mipWidth / 2));
    mipHeight = Math.max(1, Math.floor(mipHeight / 2));
  }
  return { width, height, baseLevelBytes, estimatedResidentBytes };
}

function gpuTextureWitness(root: THREE.Object3D): { textures: GpuTextureWitness[]; total: number } {
  const roles = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'lightMap'] as const;
  const found = new Map<string, { texture: THREE.Texture; roles: Set<string> }>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (!material) continue;
      const candidate = material as THREE.MeshStandardMaterial;
      for (const role of roles) {
        const texture = candidate[role] as THREE.Texture | null | undefined;
        if (!texture?.isTexture) continue;
        const entry = found.get(texture.uuid) ?? { texture, roles: new Set<string>() };
        entry.roles.add(role);
        found.set(texture.uuid, entry);
      }
    }
  });

  const textures = [...found.values()].map(({ texture, roles: textureRoles }) => {
    const estimate = estimateResidentBytes(texture);
    return {
      uuid: texture.uuid,
      roles: [...textureRoles].sort(),
      width: estimate.width,
      height: estimate.height,
      format: enumName(texture.format),
      type: enumName(texture.type),
      colorSpace: texture.colorSpace,
      channel: texture.channel,
      generateMipmaps: texture.generateMipmaps,
      minFilter: enumName(texture.minFilter),
      baseLevelBytes: estimate.baseLevelBytes,
      estimatedResidentBytes: estimate.estimatedResidentBytes,
    };
  }).sort((a, b) => a.uuid.localeCompare(b.uuid));

  return {
    textures,
    total: textures.reduce((sum, texture) => sum + texture.estimatedResidentBytes, 0),
  };
}

async function boot(): Promise<void> {
  const assetUrl = asset === 'raw' ? '/generated/material-spike-raw.glb' : '/generated/material-spike-optimized.glb';
  const gltf = await loader.loadAsync(assetUrl);
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

  const witness = await pixelWitness();
  const gpu = gpuTextureWitness(gltf.scene);
  const [rawBytes, optimizedBytes] = await Promise.all([rawBytesPromise, optimizedBytesPromise]);
  const info = renderer.info;
  window.__HALL_SPIKE__ = {
    mode,
    asset,
    loadComplete: true,
    drawCalls: info.render.calls,
    triangles: info.render.triangles,
    textures: info.memory.textures,
    programs: info.programs?.length ?? 0,
    rawBytes,
    optimizedBytes,
    gpuTextureResidentBytes: gpu.total,
    gpuTextures: gpu.textures,
    errors,
    lightmapBindings: applied,
    pixelHash: witness.hash,
    pixelSampleBase64: witness.sample,
    sampleGrid,
  };
}

boot().catch((error) => {
  errors.push(String(error?.stack ?? error));
  console.error(error);
});
