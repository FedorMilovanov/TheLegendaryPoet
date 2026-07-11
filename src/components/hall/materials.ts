// Hall of Poets — PBR Materials Library
// Phase 1: scan-based materials
// Drop KTX2 textures into /public/textures/hall/*
// then flip USE_SCANS = true

export const USE_SCANS = false

export const TEXTURE_SETS = {
  floor_marble_nero: {
    // https://ambientcg.com / https://polyhaven.com — Nero Marquina 4K
    map: '/textures/hall/floor_nero_albedo.ktx2',
    normalMap: '/textures/hall/floor_nero_nor_gl.ktx2',
    roughnessMap: '/textures/hall/floor_nero_rough.ktx2',
    aoMap: '/textures/hall/floor_nero_ao.ktx2',
    repeat: [6, 2] as [number, number],
    roughness: 0.06,
    metalness: 0.15,
  },
  wall_travertine: {
    map: '/textures/hall/wall_trav_albedo.ktx2',
    normalMap: '/textures/hall/wall_trav_nor_gl.ktx2',
    roughnessMap: '/textures/hall/wall_trav_rough.ktx2',
    repeat: [8, 1.2] as [number, number],
  },
  brass_brushed: {
    // brushed antique brass for frames
    color: '#c8a96a',
    metalness: 0.96,
    roughness: 0.28,
  }
}

// Usage in R3F:
// const { map, normalMap, ... } = useKTX2(TEXTURE_SETS.floor_marble_nero)
// <meshStandardMaterial map={map} normalMap={normalMap} ... />
//
// KTX2 loader is already in three/examples/jsm/loaders/KTX2Loader
// drei: <Suspense> + useKTX2 from @react-three/drei

// --- Bake list for Blender ---
// 1. Hall shell — lightmap 4096x4096, 256 samples, Cycles
//    Output: /public/textures/hall/bake_hall_lm.ktx2
// 2. Niches — 2048x2048
//    Output: /public/textures/hall/bake_niches_lm.ktx2
//
// In material: material.lightMap = bakedTexture; material.lightMapIntensity = 1.0
// Then you can disable SSAO on mobile.

export {}
