import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { CAMERA } from './hallConfig'
import { isHallOverlayOpen, shouldIgnoreHallShortcut } from './hallInputGuard'

const STORAGE_X = 'tlp_hall_cam_x'

export function useHallNavigation(
  focusedPoetIndex: number | null,
  poetCount: number,
  enabled = true // false when FPS mode is on
) {
  const { camera, gl } = useThree()
  // Start at the entrance (CAMERA.minX), NOT the middle. targetX previously
  // defaulted to 0, so on load the camera glided straight to the hall centre.
  const targetX = useRef(CAMERA.minX)
  const currentX = useRef(CAMERA.minX)
  const lookAt = useRef(new THREE.Vector3(0, 1.62, 0))
  const lookTarget = useRef(new THREE.Vector3())
  const lastSaveAt = useRef(0)

  // restore camera position
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_X)
      if (saved) {
        const x = parseFloat(saved)
        if (Number.isFinite(x)) {
          targetX.current = THREE.MathUtils.clamp(x, CAMERA.minX, CAMERA.maxX)
          currentX.current = targetX.current
        }
      }
    } catch {}
  }, [])

  // keyboard / wheel / drag — only in rail mode
  useEffect(() => {
    if (!enabled) return
    const el = gl.domElement
    const previousTouchAction = el.style.touchAction
    let dragging = false
    let lastX = 0

    const step = () => 4.2

    const onWheel = (event: WheelEvent) => {
      if (isHallOverlayOpen()) return // let the open palette/modal scroll, not the hall
      event.preventDefault()
      targetX.current = THREE.MathUtils.clamp(
        targetX.current + (event.deltaY > 0 ? 1 : -1) * 1.85,
        CAMERA.minX, CAMERA.maxX
      )
    }
    const onKey = (event: KeyboardEvent) => {
      if (shouldIgnoreHallShortcut(event)) return
      // F is handled globally for FPS toggle
      if (event.code === 'KeyF') return
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') targetX.current = Math.min(CAMERA.maxX, targetX.current + step())
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') targetX.current = Math.max(CAMERA.minX, targetX.current - step())
      if (event.key >= '1' && event.key <= '9') {
        const index = parseInt(event.key, 10) - 1
        if (index < poetCount) {
          const pair = Math.floor(index / 2)
          targetX.current = -18 + pair * 5.8
        }
      }
      if (event.key === '0' && poetCount >= 10) {
        const pair = Math.floor(9 / 2)
        targetX.current = -18 + pair * 5.8
      }
    }
    const onDown = (event: PointerEvent) => {
      if (isHallOverlayOpen()) return
      dragging = true
      lastX = event.clientX
      ;(event.target as Element).setPointerCapture?.(event.pointerId)
    }
    const onMove = (event: PointerEvent) => {
      if (isHallOverlayOpen()) {
        dragging = false
        return
      }
      if (!dragging) return
      const deltaX = event.clientX - lastX
      lastX = event.clientX
      targetX.current = THREE.MathUtils.clamp(targetX.current - deltaX * 0.016, CAMERA.minX, CAMERA.maxX)
    }
    const onUp = () => { dragging = false }

    el.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    el.style.touchAction = 'none'

    return () => {
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      el.style.touchAction = previousTouchAction
    }
  }, [gl, poetCount, enabled])

  useFrame((_, dt) => {
    if (!enabled || isHallOverlayOpen()) return
    currentX.current = THREE.MathUtils.damp(currentX.current, targetX.current, 1 / CAMERA.dollySmoothing, dt)
    camera.position.set(currentX.current, CAMERA.height, CAMERA.zOffset)
    lookTarget.current.set(currentX.current + 5.5, 1.62, 0)
    lookAt.current.lerp(lookTarget.current, 1 - Math.pow(1 - CAMERA.lookAtSmoothing, dt * 60))
    camera.lookAt(lookAt.current)

    const now = performance.now()
    if (now - lastSaveAt.current > 400) {
      lastSaveAt.current = now
      try { sessionStorage.setItem(STORAGE_X, String(currentX.current)) } catch {}
    }
  })

  useEffect(() => {
    if (!enabled || focusedPoetIndex == null || isHallOverlayOpen()) return
    const pair = Math.floor(focusedPoetIndex / 2)
    targetX.current = THREE.MathUtils.clamp(-18 + pair * 5.8, CAMERA.minX, CAMERA.maxX)
  }, [focusedPoetIndex, enabled])

  return { goTo: (x: number) => { targetX.current = THREE.MathUtils.clamp(x, CAMERA.minX, CAMERA.maxX) } }
}
