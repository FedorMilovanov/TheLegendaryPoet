// First-person walk controls for Hall of Poets
// WASD / Arrow keys + mouse look, PointerLock on click
// Press F to toggle FPS / Rail mode, Esc to release mouse
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { CAMERA, HALL } from './hallConfig'
import { isHallOverlayOpen, shouldIgnoreHallShortcut } from './hallInputGuard'

type MoveState = { f: number; b: number; l: number; r: number; run: boolean }

function createIdleMove(): MoveState {
  return { f: 0, b: 0, l: 0, r: 0, run: false }
}

function clearMove(move: MoveState) {
  move.f = 0
  move.b = 0
  move.l = 0
  move.r = 0
  move.run = false
}

export function FirstPersonControls({ enabled }: { enabled: boolean }) {
  const { camera, gl } = useThree()
  const move = useRef(createIdleMove())
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const velocity = useRef(new THREE.Vector3())

  useEffect(() => {
    if (!enabled) return
    const dom = gl.domElement

    const applyKey = (event: KeyboardEvent, down: boolean) => {
      if (down && shouldIgnoreHallShortcut(event)) return
      const value = down ? 1 : 0
      switch (event.code) {
        case 'KeyW': case 'ArrowUp': move.current.f = value; break
        case 'KeyS': case 'ArrowDown': move.current.b = value; break
        case 'KeyA': case 'ArrowLeft': move.current.l = value; break
        case 'KeyD': case 'ArrowRight': move.current.r = value; break
        case 'ShiftLeft': case 'ShiftRight': move.current.run = down; break
      }
    }
    const keyDown = (event: KeyboardEvent) => applyKey(event, true)
    // Keyup always clears state, even if focus moved into an overlay after the
    // corresponding keydown. Ignoring it would leave movement latched.
    const keyUp = (event: KeyboardEvent) => applyKey(event, false)

    const onMouseMove = (event: MouseEvent) => {
      if (isHallOverlayOpen() || document.pointerLockElement !== dom) return
      euler.current.y -= event.movementX * 0.0022
      euler.current.x -= event.movementY * 0.0022
      euler.current.x = THREE.MathUtils.clamp(euler.current.x, -Math.PI / 2.5, Math.PI / 2.5)
    }
    const onClick = () => {
      if (isHallOverlayOpen() || document.pointerLockElement === dom) return
      void dom.requestPointerLock()
    }

    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    document.addEventListener('mousemove', onMouseMove)
    dom.addEventListener('click', onClick)

    // init rotation from current camera
    euler.current.setFromQuaternion(camera.quaternion, 'YXZ')

    return () => {
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      document.removeEventListener('mousemove', onMouseMove)
      dom.removeEventListener('click', onClick)
      clearMove(move.current)
      if (document.pointerLockElement === dom) document.exitPointerLock()
    }
  }, [enabled, camera, gl])

  useFrame((_, dt) => {
    if (!enabled) return
    if (isHallOverlayOpen()) {
      clearMove(move.current)
      velocity.current.set(0, 0, 0)
      if (document.pointerLockElement === gl.domElement) document.exitPointerLock()
      return
    }

    let directionX = move.current.r - move.current.l
    let directionZ = move.current.b - move.current.f
    const directionLength = Math.hypot(directionX, directionZ)
    if (directionLength > 0) {
      directionX /= directionLength
      directionZ /= directionLength
    }

    const speed = (move.current.run ? 4.8 : 2.6) * dt
    const yaw = euler.current.y
    const sinYaw = Math.sin(yaw)
    const cosYaw = Math.cos(yaw)

    // Resolve local forward/right movement directly into world XZ. Keeping the
    // single velocity scratch vector avoids allocating direction, forward and
    // right Vector3 instances on every animation frame.
    velocity.current.set(
      (-sinYaw * directionZ + cosYaw * directionX) * speed,
      0,
      (-cosYaw * directionZ - sinYaw * directionX) * speed,
    )
    camera.position.add(velocity.current)

    // clamp to hall bounds
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -23, 20)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -HALL.width / 2 + 0.7, HALL.width / 2 - 0.7)
    camera.position.y = CAMERA.height

    camera.quaternion.setFromEuler(euler.current)
  })

  return null
}
