// Hall of Poets — PBR Materials Library v1.3
// KTX2 / WebP with graceful fallback to procedural
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'

export const USE_SCANS = false // поставь true когда положишь текстуры в /public/textures/hall/

export const TEXTURE_SETS = {
  floor_marble_nero: {
    map: '/textures/hall/floor_nero_albedo.webp',
    normalMap: '/textures/hall/floor_nero_nor_gl.webp',
    roughnessMap: '/textures/hall/floor_nero_rough.webp',
    aoMap: '/textures/hall/floor_nero_ao.webp',
    repeat: [6, 2] as [number, number],
  },
  wall_travertine: {
    map: '/textures/hall/wall_trav_albedo.webp',
    normalMap: '/textures/hall/wall_trav_nor_gl.webp',
    roughnessMap: '/textures/hall/wall_trav_rough.webp',
    repeat: [8, 1.2] as [number, number],
  },
} as const

function configure(t: THREE.Texture, repeat?: [number, number]) {
  t.colorSpace = t === undefined ? THREE.NoColorSpace : THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  if (repeat) t.repeat.set(...repeat)
  t.anisotropy = 8
  return t
}

/** PBR floor — Nero Marquina. Falls back to procedural if textures missing */
export function useFloorMaterial() {
  let maps: any = {}
  try {
    if (USE_SCANS) {
      const tx = useTexture(TEXTURE_SETS.floor_marble_nero as any)
      Object.entries(tx).forEach(([k, v]) => {
        if (v instanceof THREE.Texture) configure(v, TEXTURE_SETS.floor_marble_nero.repeat)
      })
      maps = tx
    }
  } catch {}
  return maps
}

/** Travertine walls */
export function useWallMaterial() {
  let maps: any = {}
  try {
    if (USE_SCANS) {
      const tx = useTexture(TEXTURE_SETS.wall_travertine as any)
      Object.entries(tx).forEach(([k, v]) => {
        if (v instanceof THREE.Texture) configure(v, TEXTURE_SETS.wall_travertine.repeat)
      })
      maps = tx
    }
  } catch {}
  return maps
}

// Bake targets (Blender Cycles):
//  hall_lm_4k.ktx2  – GI for shell
//  niches_lm_2k.ktx2
// material.lightMap = baked; material.lightMapIntensity = 1.0
