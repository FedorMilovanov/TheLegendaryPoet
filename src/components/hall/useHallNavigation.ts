import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { CAMERA } from './hallConfig'

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
    let dragging = false
    let lastX = 0

    const step = () => 4.2

    const modalOpen = () => Boolean((window as { __TLP_MODAL_OPEN?: boolean }).__TLP_MODAL_OPEN)
    const onWheel = (e: WheelEvent) => {
      if (modalOpen()) return // let the open palette/modal scroll, not the hall
      e.preventDefault()
      targetX.current = THREE.MathUtils.clamp(
        targetX.current + (e.deltaY > 0 ? 1 : -1) * 1.85,
        CAMERA.minX, CAMERA.maxX
      )
    }
    const onKey = (e: KeyboardEvent) => {
      if (modalOpen()) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      // F is handled globally for FPS toggle
      if (e.code === 'KeyF') return
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') targetX.current = Math.min(CAMERA.maxX, targetX.current + step())
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') targetX.current = Math.max(CAMERA.minX, targetX.current - step())
      if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key,10) -1
        if (idx < poetCount) {
          const pair = Math.floor(idx/2)
          targetX.current = -18 + pair * 5.8
        }
      }
      if (e.key === '0' && poetCount >= 10) {
        const pair = Math.floor(9/2)
        targetX.current = -18 + pair * 5.8
      }
    }
    const onDown = (e: PointerEvent) => { if (modalOpen()) return; dragging = true; lastX = e.clientX; (e.target as Element).setPointerCapture?.(e.pointerId) }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      lastX = e.clientX
      targetX.current = THREE.MathUtils.clamp(targetX.current - dx * 0.016, CAMERA.minX, CAMERA.maxX)
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
    }
  }, [gl, poetCount, enabled])

  useFrame((_, dt) => {
    if (!enabled) return
    currentX.current = THREE.MathUtils.damp(currentX.current, targetX.current, 1 / CAMERA.dollySmoothing, dt)
    camera.position.set(currentX.current, CAMERA.height, CAMERA.zOffset)
    const lookTarget = new THREE.Vector3(currentX.current + 5.5, 1.62, 0)
    lookAt.current.lerp(lookTarget, 1 - Math.pow(1 - CAMERA.lookAtSmoothing, dt * 60))
    camera.lookAt(lookAt.current)

    const now = performance.now()
    ;(useHallNavigation as any)._lastSave ||= 0
    if (now - (useHallNavigation as any)._lastSave > 400) {
      ;(useHallNavigation as any)._lastSave = now
      try { sessionStorage.setItem(STORAGE_X, String(currentX.current)) } catch {}
    }
  })

  useEffect(() => {
    if (!enabled || focusedPoetIndex == null) return
    const pair = Math.floor(focusedPoetIndex / 2)
    targetX.current = THREE.MathUtils.clamp(-18 + pair * 5.8, CAMERA.minX, CAMERA.maxX)
  }, [focusedPoetIndex, enabled])

  return { goTo: (x: number) => { targetX.current = THREE.MathUtils.clamp(x, CAMERA.minX, CAMERA.maxX) } }
}
