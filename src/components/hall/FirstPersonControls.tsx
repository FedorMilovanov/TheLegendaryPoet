// First-person walk controls for Hall of Poets
// WASD / Arrow keys + mouse look, PointerLock on click
// Press F to toggle FPS / Rail mode, Esc to release mouse
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { CAMERA, HALL } from './hallConfig'

export function FirstPersonControls({ enabled }: { enabled: boolean }) {
  const { camera, gl } = useThree()
  const move = useRef({ f:0, b:0, l:0, r:0, run: false })
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const velocity = useRef(new THREE.Vector3())

  useEffect(() => {
    if (!enabled) return
    const dom = gl.domElement

    const onKey = (e: KeyboardEvent, down: boolean) => {
      const v = down ? 1 : 0
      switch(e.code) {
        case 'KeyW': case 'ArrowUp': move.current.f = v; break
        case 'KeyS': case 'ArrowDown': move.current.b = v; break
        case 'KeyA': case 'ArrowLeft': move.current.l = v; break
        case 'KeyD': case 'ArrowRight': move.current.r = v; break
        case 'ShiftLeft': case 'ShiftRight': move.current.run = down; break
      }
    }
    const kd = (e: KeyboardEvent) => onKey(e, true)
    const ku = (e: KeyboardEvent) => onKey(e, false)

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== dom) return
      euler.current.y -= e.movementX * 0.0022
      euler.current.x -= e.movementY * 0.0022
      euler.current.x = THREE.MathUtils.clamp(euler.current.x, -Math.PI/2.5, Math.PI/2.5)
    }
    const onClick = () => {
      if (document.pointerLockElement !== dom) dom.requestPointerLock()
    }

    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    document.addEventListener('mousemove', onMouseMove)
    dom.addEventListener('click', onClick)

    // init rotation from current camera
    euler.current.setFromQuaternion(camera.quaternion, 'YXZ')

    return () => {
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      document.removeEventListener('mousemove', onMouseMove)
      dom.removeEventListener('click', onClick)
      if (document.pointerLockElement === dom) document.exitPointerLock()
    }
  }, [enabled, camera, gl])

  useFrame((_, dt) => {
    if (!enabled) return
    const speed = (move.current.run ? 4.8 : 2.6) * dt
    const dir = new THREE.Vector3(
      move.current.r - move.current.l,
      0,
      move.current.b - move.current.f
    )
    if (dir.lengthSq() > 0) dir.normalize()

    // move in camera local XZ
    const yaw = euler.current.y
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw))
    velocity.current.copy(forward.multiplyScalar(dir.z * speed))
      .add(right.multiplyScalar(dir.x * speed))

    camera.position.add(velocity.current)

    // clamp to hall bounds
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -23, 20)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -HALL.width/2 + 0.7, HALL.width/2 - 0.7)
    camera.position.y = CAMERA.height

    camera.quaternion.setFromEuler(euler.current)
  })

  return null
}
