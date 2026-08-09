import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

type ViewId = 'material-medium' | 'material-close';
type Variant = 'full' | 'normal-off' | 'roughness-flat';
type AxisIndex = 0 | 1 | 2;
type VisualMetrics = {
  view: ViewId;
  variant: Variant;
  target: string;
  loadComplete: boolean;
  drawCalls: number;
  triangles: number;
  programs: number;
  errors: string[];
  camera: {
    distanceMeters: number;
    lensMm: number;
    edgeBias: number;
    edgeRevealDegrees: number;
    faceNormalAxis: AxisIndex;
    verticalAxis: AxisIndex;
    tangentAxis: AxisIndex;
    position: [number, number, number];
    target: [number, number, number];
    surfaceNormal: [number, number, number];
  };
  material: {
    name: string;
    metallic: number;
    roughness: number;
    baseColorMap: boolean;
    normalMap: boolean;
    roughnessMap: boolean;
  };
  transport: {
    uv0: boolean;
    uv1: boolean;
    lookdevBevelMeters: number;
    lookdevBevelSegments: number;
    surfaceUvCubeSizeMeters: number;
    visualEvidenceOnly: boolean;
  };
  pixelHash: string;
  pixelSampleBase64: string;
  sampleGrid: [number, number];
  meanDisplayLuma: number;
  darkSampleRatio: number;
  lumaThreshold: number;
};

declare global {
  interface Window {
    __HALL_VISUAL__?: VisualMetrics;
  }
}

const params = new URLSearchParams(location.search);
const requestedView = params.get('view');
const requestedVariant = params.get('variant');
const view: ViewId = requestedView === 'material-close' ? 'material-close' : 'material-medium';
const variant: Variant = requestedVariant === 'normal-off' || requestedVariant === 'roughness-flat' ? requestedVariant : 'full';
const targetName = params.get('target') || 'ARCH_wall_016';
const distanceMeters = Number(params.get('distance') || (view === 'material-close' ? '0.85' : '2.2'));
const lensMm = Number(params.get('lens') || (view === 'material-close' ? '55' : '45'));
const edgeBias = Number(params.get('edgeBias') || (view === 'material-close' ? '0.82' : '0.72'));
const edgeRevealDegrees = view === 'material-close' ? 18 : 14;
const lumaThreshold = Number(params.get('lumaThreshold') || '0.08');
const sampleGrid: [number, number] = [64, 36];
const errors: string[] = [];

if (!Number.isFinite(distanceMeters) || distanceMeters <= 0 || !Number.isFinite(lensMm) || lensMm <= 0 || !Number.isFinite(edgeBias) || edgeBias <= 0 || edgeBias >= 1) {
  throw new Error('Invalid material inspection camera parameters');
}

window.addEventListener('error', (event) => errors.push(String(event.error ?? event.message)));
window.addEventListener('unhandledrejection', (event) => errors.push(String(event.reason)));

const mount = document.getElementById('app');
if (!mount) throw new Error('Missing #app mount');
const label = document.getElementById('label');
if (label) label.textContent = `Hall v3 ${view} / ${variant} — QA only`;

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
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

function addNeutralL0Lighting(): void {
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xfff6e8, 1.65);
  key.position.set(8.6, 4.2, 5.8);
  key.castShadow = false;
  scene.add(key);
}

function cloneTargetMaterial(target: THREE.Mesh): THREE.MeshStandardMaterial {
  if (Array.isArray(target.material)) throw new Error(`Unexpected material array on ${target.name}`);
  const material = target.material as THREE.MeshStandardMaterial;
  if (!material?.isMeshStandardMaterial) throw new Error(`${target.name} does not use MeshStandardMaterial`);
  const clone = material.clone();
  target.material = clone;
  if (variant === 'normal-off') clone.normalMap = null;
  if (variant === 'roughness-flat') {
    clone.roughnessMap = null;
    clone.roughness = 0.67;
  }
  clone.needsUpdate = true;
  return clone;
}

function axisComponent(vector: THREE.Vector3, axis: AxisIndex): number {
  return axis === 0 ? vector.x : axis === 1 ? vector.y : vector.z;
}

function setAxisComponent(vector: THREE.Vector3, axis: AxisIndex, value: number): void {
  if (axis === 0) vector.x = value;
  else if (axis === 1) vector.y = value;
  else vector.z = value;
}

function localAxis(axis: AxisIndex): THREE.Vector3 {
  return axis === 0 ? new THREE.Vector3(1, 0, 0) : axis === 1 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
}

function configureInspectionCamera(root: THREE.Object3D, target: THREE.Mesh): {
  camera: THREE.PerspectiveCamera;
  targetPoint: THREE.Vector3;
  surfaceNormal: THREE.Vector3;
  faceNormalAxis: AxisIndex;
  verticalAxis: AxisIndex;
  tangentAxis: AxisIndex;
} {
  const r1 = root.getObjectByName('CAM_R1_pushkinViewing');
  if (!r1 || !(r1 as THREE.Camera).isCamera) throw new Error('Missing frozen R1 camera for inspection reference');
  root.updateMatrixWorld(true);
  const r1World = r1.getWorldPosition(new THREE.Vector3());
  const geometry = target.geometry as THREE.BufferGeometry;
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) throw new Error(`${target.name} has no geometry bounding box`);

  const size = box.getSize(new THREE.Vector3());
  const dimensions = [size.x, size.y, size.z];
  if (dimensions.some((dimension) => !Number.isFinite(dimension) || dimension <= 0)) throw new Error(`${target.name} has invalid local bounds`);
  const faceNormalAxis = dimensions.indexOf(Math.min(...dimensions)) as AxisIndex;

  const worldQuaternion = target.getWorldQuaternion(new THREE.Quaternion());
  const axisWorld = ([0, 1, 2] as AxisIndex[]).map((axis) => localAxis(axis).applyQuaternion(worldQuaternion).normalize());
  const worldUp = new THREE.Vector3(0, 1, 0);
  const remainingAxes = ([0, 1, 2] as AxisIndex[]).filter((axis) => axis !== faceNormalAxis);
  const verticalAxis = remainingAxes.reduce((best, axis) => Math.abs(axisWorld[axis].dot(worldUp)) > Math.abs(axisWorld[best].dot(worldUp)) ? axis : best);
  const tangentAxis = remainingAxes.find((axis) => axis !== verticalAxis);
  if (tangentAxis === undefined) throw new Error(`${target.name} cannot resolve surface tangent axis`);

  const center = box.getCenter(new THREE.Vector3());
  const r1Local = target.worldToLocal(r1World.clone());
  const normalSign = axisComponent(r1Local, faceNormalAxis) >= axisComponent(center, faceNormalAxis) ? 1 : -1;
  const tangentSign = axisComponent(r1Local, tangentAxis) >= axisComponent(center, tangentAxis) ? 1 : -1;
  const localTarget = center.clone();
  setAxisComponent(localTarget, faceNormalAxis, normalSign > 0 ? axisComponent(box.max, faceNormalAxis) : axisComponent(box.min, faceNormalAxis));
  const tangentCenter = axisComponent(center, tangentAxis);
  const tangentHalfExtent = axisComponent(size, tangentAxis) * 0.5;
  setAxisComponent(localTarget, tangentAxis, tangentCenter + tangentSign * tangentHalfExtent * edgeBias);

  const targetPoint = target.localToWorld(localTarget.clone());
  const surfaceNormal = axisWorld[faceNormalAxis].clone().multiplyScalar(normalSign).normalize();
  const surfaceTangent = axisWorld[tangentAxis].clone().multiplyScalar(tangentSign).normalize();
  const revealRadians = THREE.MathUtils.degToRad(edgeRevealDegrees);
  const cameraOffset = surfaceNormal.clone().multiplyScalar(Math.cos(revealRadians) * distanceMeters)
    .add(surfaceTangent.multiplyScalar(Math.sin(revealRadians) * distanceMeters));

  const camera = new THREE.PerspectiveCamera(lensMm, renderWidth / renderHeight, 0.03, 20);
  camera.position.copy(targetPoint).add(cameraOffset);
  camera.up.copy(worldUp);
  camera.lookAt(targetPoint);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return { camera, targetPoint, surfaceNormal, faceNormalAxis, verticalAxis, tangentAxis };
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
  for (let index = 0; index < bytes.length; index += chunk) binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  return btoa(binary);
}

function lumaStats(sample: Uint8Array): { meanDisplayLuma: number; darkSampleRatio: number } {
  let sum = 0;
  let dark = 0;
  const pixels = sample.length / 4;
  for (let index = 0; index < sample.length; index += 4) {
    const r = sample[index] / 255;
    const g = sample[index + 1] / 255;
    const b = sample[index + 2] / 255;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    sum += luma;
    if (luma < lumaThreshold) dark += 1;
  }
  return { meanDisplayLuma: sum / pixels, darkSampleRatio: dark / pixels };
}

async function pixelWitness(): Promise<{ hash: string; sample: Uint8Array }> {
  const gl = renderer.getContext();
  gl.finish();
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', pixels));
  const hash = Array.from(digest, (value) => value.toString(16).padStart(2, '0')).join('');
  return { hash, sample: samplePixels(pixels, width, height) };
}

async function boot(): Promise<void> {
  const gltf = await loader.loadAsync('/generated/material-spike-optimized.glb');
  scene.add(gltf.scene);
  addNeutralL0Lighting();

  const target = gltf.scene.getObjectByName(targetName) as THREE.Mesh | undefined;
  if (!target?.isMesh) throw new Error(`Missing material inspection target ${targetName}`);
  const material = cloneTargetMaterial(target);
  const configured = configureInspectionCamera(gltf.scene, target);

  const uv0 = Boolean((target.geometry as THREE.BufferGeometry).getAttribute('uv'));
  const uv1 = Boolean((target.geometry as THREE.BufferGeometry).getAttribute('uv1'));
  if (!uv0 || !uv1) throw new Error(`${targetName} must expose UV0/UV1 in Three geometry`);

  renderer.compile(scene, configured.camera);
  renderer.render(scene, configured.camera);
  await new Promise<void>((resolve) => requestAnimationFrame(() => {
    renderer.render(scene, configured.camera);
    resolve();
  }));

  const witness = await pixelWitness();
  const luma = lumaStats(witness.sample);
  const info = renderer.info;
  const position = configured.camera.position;
  const targetPoint = configured.targetPoint;
  const surfaceNormal = configured.surfaceNormal;
  window.__HALL_VISUAL__ = {
    view,
    variant,
    target: targetName,
    loadComplete: true,
    drawCalls: info.render.calls,
    triangles: info.render.triangles,
    programs: info.programs?.length ?? 0,
    errors,
    camera: {
      distanceMeters,
      lensMm,
      edgeBias,
      edgeRevealDegrees,
      faceNormalAxis: configured.faceNormalAxis,
      verticalAxis: configured.verticalAxis,
      tangentAxis: configured.tangentAxis,
      position: [position.x, position.y, position.z],
      target: [targetPoint.x, targetPoint.y, targetPoint.z],
      surfaceNormal: [surfaceNormal.x, surfaceNormal.y, surfaceNormal.z],
    },
    material: {
      name: material.name,
      metallic: material.metalness,
      roughness: material.roughness,
      baseColorMap: Boolean(material.map),
      normalMap: Boolean(material.normalMap),
      roughnessMap: Boolean(material.roughnessMap),
    },
    transport: {
      uv0,
      uv1,
      lookdevBevelMeters: Number(target.userData.lookdevBevelMeters ?? 0),
      lookdevBevelSegments: Number(target.userData.lookdevBevelSegments ?? 0),
      surfaceUvCubeSizeMeters: Number(target.userData.surfaceUvCubeSizeMeters ?? 0),
      visualEvidenceOnly: target.userData.visualEvidenceOnly === true,
    },
    pixelHash: witness.hash,
    pixelSampleBase64: bytesToBase64(witness.sample),
    sampleGrid,
    meanDisplayLuma: luma.meanDisplayLuma,
    darkSampleRatio: luma.darkSampleRatio,
    lumaThreshold,
  };
}

boot().catch((error) => {
  errors.push(String(error?.stack ?? error));
  console.error(error);
});
