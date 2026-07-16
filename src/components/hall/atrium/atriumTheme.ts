/**
 * Warm pantheon palette — must match hallMuseum.css tokens.
 * No cyan-space language.
 */
export const ATRIUM = {
  bg: '#070605',
  fog: '#0c0a07',
  floor: '#1a1510',
  floorDark: '#0d0b08',
  stone: '#2a241c',
  stoneLight: '#3a3228',
  gold: '#d4af37',
  goldSoft: '#c4a35a',
  goldDim: '#8a7340',
  skylight: '#fff4d6',
  skylightWarm: '#ffe8b0',
  ink: '#f3ebe0',
} as const;

export const ATRIUM_CAMERA = {
  fov: 48,
  position: [0, 1.55, 7.2] as [number, number, number],
  near: 0.1,
  far: 80,
} as const;

/** Arch portals sit on a circle around the atrium centre. */
export const ATRIUM_LAYOUT = {
  radius: 5.4,
  archWidth: 2.4,
  archHeight: 3.6,
  wallHeight: 5.2,
  domeRadius: 6.2,
} as const;
