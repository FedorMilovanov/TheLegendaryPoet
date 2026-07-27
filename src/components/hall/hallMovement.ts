import type { Vector3 } from 'three'

/**
 * Resolve normalized local Hall input into world-space XZ velocity without
 * allocating temporary vectors. `directionZ` follows the existing controls:
 * forward input is -1 and backward input is +1.
 */
export function resolveHallVelocity(
  target: Vector3,
  directionX: number,
  directionZ: number,
  yaw: number,
  speed: number,
) {
  const directionLength = Math.hypot(directionX, directionZ)
  if (directionLength > 0) {
    directionX /= directionLength
    directionZ /= directionLength
  }

  const sinYaw = Math.sin(yaw)
  const cosYaw = Math.cos(yaw)
  return target.set(
    (-sinYaw * directionZ + cosYaw * directionX) * speed,
    0,
    (-cosYaw * directionZ - sinYaw * directionX) * speed,
  )
}
