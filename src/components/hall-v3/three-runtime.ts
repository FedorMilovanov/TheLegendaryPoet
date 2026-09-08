// Narrow production Hall transport for Three.js.
// Vite aliases only the bare `three` specifier to this file for the production
// application build. Re-exporting the exact runtime surface lets Rollup remove
// unrelated Three.js subsystems while HallProductionRuntime keeps its secondary
// dynamic import and route isolation.
export {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  HemisphereLight,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three/src/Three.js';
