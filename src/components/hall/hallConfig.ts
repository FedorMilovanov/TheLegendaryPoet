// Hall of Poets 2.0 — Production config
// THE LEGENDARY POET
// React 19 + R3F 9 + three 0.184

export const HALL = {
  length: 62,
  width: 9.2,
  height: 7.5,
  nicheSpacing: 5.8,
  nicheDepth: 1.15,
  nicheWidth: 2.6,
  nicheHeight: 3.4,
} as const

export const PALETTE = {
  bg: '#020811',
  marbleDark: '#0b0f14',
  travertine: '#ddd6c7',
  brass: '#c8a96a',
  brassEmissive: '#5b3a14',
  cyan: '#00d4ff',
  cyanSoft: '#7ee7ff',
  fog: '#06131c',
} as const

// 10 поэтов, порядок слева-направо, хронологически
// id должны совпадать с src/data/library/*
export const POET_ORDER = [
  'pushkin',
  'lermontov',
  'tyutchev',
  'fet',
  'blok',
  'gumilev',
  'akhmatova',
  'mayakovsky',
  'yesenin',
  'pasternak',
] as const

// Позиции ниш: 5 слева (z-), 5 справа (z+), чередуем
export function getNicheTransform(index: number) {
  const side = index % 2 === 0 ? -1 : 1 // -1 left, +1 right
  const pair = Math.floor(index / 2)
  const x = -18 + pair * HALL.nicheSpacing // вдоль нефа
  const z = side * (HALL.width / 2 - 0.45)
  // Portraits must face ACROSS the nave toward the centre (not along it), so both
  // walls show their fronts as you walk down. Plane normal is +z; left wall (z-)
  // faces +z → rot 0; right wall (z+) faces -z → rot π. (Was ±π/2 = facing down
  // the nave, which showed one wall's portraits and the other's dark backs.)
  const rotationY = side === -1 ? 0 : Math.PI
  return { position: [x, 0, z] as [number, number, number], rotationY }
}

// Камера rail
export const CAMERA = {
  fov: 42,
  height: 1.62,
  zOffset: 0, // центр нефа
  minX: -24, // вход в зал (до первой ниши на x=-18)
  maxX: 18,
  dollySmoothing: 0.085,
  lookAtSmoothing: 0.1,
}

export const RENDER = {
  dpr: [1, 1.75] as [number, number],
  shadows: true,
  toneMappingExposure: 1.05,
}
