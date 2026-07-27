// Poet whisper — 3D positional audio on hover
// Looks for /audio/poet-{id}.mp3 or /audio/{id}.mp3 and fails silently when absent.
import { useCallback, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { asset } from '../../utils/asset'
import {
  createDeferredAudioStop,
  type DeferredAudioStopController,
} from '../../utils/deferredAudioStop'

let audioCtx: AudioContext | null = null
const buffers = new Map<string, AudioBuffer>()
const pendingBuffers = new Map<string, Promise<AudioBuffer | null>>()
const unavailableBuffers = new Set<string>()

type LegacyAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext
}

function ensureAudioContext(): AudioContext | null {
  if (audioCtx) return audioCtx
  const AudioContextCtor = window.AudioContext ?? (window as LegacyAudioWindow).webkitAudioContext
  if (!AudioContextCtor) return null
  audioCtx = new AudioContextCtor()
  return audioCtx
}

async function loadBuffer(url: string): Promise<AudioBuffer | null> {
  const cached = buffers.get(url)
  if (cached) return cached
  if (unavailableBuffers.has(url)) return null

  const pending = pendingBuffers.get(url)
  if (pending) return pending

  const request = (async () => {
    const context = ensureAudioContext()
    if (!context) return null

    try {
      if (context.state === 'suspended') await context.resume()
      const response = await fetch(url)
      if (!response.ok) {
        if (response.status === 404 || response.status === 410) unavailableBuffers.add(url)
        return null
      }
      const buffer = await context.decodeAudioData(await response.arrayBuffer())
      buffers.set(url, buffer)
      return buffer
    } catch {
      return null
    } finally {
      pendingBuffers.delete(url)
    }
  })()

  pendingBuffers.set(url, request)
  return request
}

function safeDisconnect(node: AudioNode | null) {
  if (!node) return
  try {
    node.disconnect()
  } catch {
    // A node may already be disconnected by its onended cleanup.
  }
}

export function usePoetWhisper(
  poetId: string,
  active: boolean,
  position: readonly [number, number, number],
  muted: boolean,
) {
  const { camera } = useThree()
  const pannerRef = useRef<PannerNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const currentPoetRef = useRef<string | null>(null)
  const latestPositionRef = useRef(position)
  const directionRef = useRef(new THREE.Vector3())
  const upRef = useRef(new THREE.Vector3())
  const stopControllerRef = useRef<DeferredAudioStopController<AudioBufferSourceNode> | null>(null)

  latestPositionRef.current = position
  if (!stopControllerRef.current) {
    stopControllerRef.current = createDeferredAudioStop<AudioBufferSourceNode>()
  }

  const clearCapturedNodes = useCallback((
    source: AudioBufferSourceNode,
    gain: GainNode | null,
    panner: PannerNode | null,
  ) => {
    safeDisconnect(source)
    safeDisconnect(gain)
    safeDisconnect(panner)
    if (audioSourceRef.current !== source) return
    audioSourceRef.current = null
    gainRef.current = null
    pannerRef.current = null
    currentPoetRef.current = null
  }, [])

  const stopCurrentImmediately = useCallback(() => {
    stopControllerRef.current?.cancel()
    const source = audioSourceRef.current
    const gain = gainRef.current
    const panner = pannerRef.current
    if (!source) {
      safeDisconnect(gain)
      safeDisconnect(panner)
      gainRef.current = null
      pannerRef.current = null
      currentPoetRef.current = null
      return
    }
    try {
      source.stop()
    } catch {
      // Stopping an already-ended source is harmless for lifecycle cleanup.
    }
    clearCapturedNodes(source, gain, panner)
  }, [clearCapturedNodes])

  const fadeOutCurrent = useCallback(() => {
    const context = audioCtx
    const source = audioSourceRef.current
    const gain = gainRef.current
    const panner = pannerRef.current
    if (!context || !source || !gain) {
      stopCurrentImmediately()
      return
    }

    stopControllerRef.current?.cancel()
    const now = context.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(0, now + 0.35)
    stopControllerRef.current?.schedule(source, 380, (stoppedSource) => {
      clearCapturedNodes(stoppedSource, gain, panner)
    })
  }, [clearCapturedNodes, stopCurrentImmediately])

  const resumeCurrent = useCallback((requestedPoetId: string) => {
    const context = audioCtx
    const source = audioSourceRef.current
    const gain = gainRef.current
    if (!context || !source || !gain || currentPoetRef.current !== requestedPoetId) return false

    stopControllerRef.current?.cancel()
    const now = context.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(0.72, now + 0.18)
    return true
  }, [])

  useEffect(() => {
    if (!active || muted) {
      fadeOutCurrent()
      return
    }

    if (audioSourceRef.current && currentPoetRef.current !== poetId) {
      stopCurrentImmediately()
    }
    if (resumeCurrent(poetId)) return

    let cancelled = false
    void (async () => {
      const candidates = [
        asset(`/audio/poet-${poetId}.mp3`),
        asset(`/audio/${poetId}.mp3`),
      ]
      let buffer: AudioBuffer | null = null
      for (const url of candidates) {
        buffer = await loadBuffer(url)
        if (buffer || cancelled) break
      }

      const context = audioCtx
      if (!buffer || !context || cancelled) return
      try {
        if (context.state === 'suspended') await context.resume()
      } catch {
        return
      }
      if (cancelled) return

      stopCurrentImmediately()
      const panner = context.createPanner()
      panner.panningModel = 'HRTF'
      panner.distanceModel = 'inverse'
      panner.refDistance = 1.8
      panner.maxDistance = 12
      panner.rolloffFactor = 1.2
      const [sourceX, sourceY, sourceZ] = latestPositionRef.current
      panner.positionX.setValueAtTime(sourceX, context.currentTime)
      panner.positionY.setValueAtTime(sourceY, context.currentTime)
      panner.positionZ.setValueAtTime(sourceZ, context.currentTime)

      const gain = context.createGain()
      gain.gain.setValueAtTime(0, context.currentTime)
      gain.gain.linearRampToValueAtTime(0.72, context.currentTime + 0.6)

      const source = context.createBufferSource()
      source.buffer = buffer
      source.loop = false
      source.connect(gain).connect(panner).connect(context.destination)
      source.onended = () => {
        if (audioSourceRef.current === source) stopControllerRef.current?.cancel()
        clearCapturedNodes(source, gain, panner)
      }

      pannerRef.current = panner
      gainRef.current = gain
      audioSourceRef.current = source
      currentPoetRef.current = poetId
      source.start()
    })()

    return () => {
      cancelled = true
    }
  }, [active, fadeOutCurrent, muted, poetId, resumeCurrent, stopCurrentImmediately])

  const x = position[0]
  const y = position[1]
  const z = position[2]
  useEffect(() => {
    const context = audioCtx
    const panner = pannerRef.current
    if (!context || !panner) return
    panner.positionX.setValueAtTime(x, context.currentTime)
    panner.positionY.setValueAtTime(y, context.currentTime)
    panner.positionZ.setValueAtTime(z, context.currentTime)
  }, [x, y, z])

  useFrame(() => {
    const context = audioCtx
    if (!context) return
    const listener = context.listener
    const now = context.currentTime
    const cameraPosition = camera.position
    const direction = camera.getWorldDirection(directionRef.current)
    const up = upRef.current.set(0, 1, 0).applyQuaternion(camera.quaternion)

    listener.positionX.setValueAtTime(cameraPosition.x, now)
    listener.positionY.setValueAtTime(cameraPosition.y, now)
    listener.positionZ.setValueAtTime(cameraPosition.z, now)
    listener.forwardX.setValueAtTime(direction.x, now)
    listener.forwardY.setValueAtTime(direction.y, now)
    listener.forwardZ.setValueAtTime(direction.z, now)
    listener.upX.setValueAtTime(up.x, now)
    listener.upY.setValueAtTime(up.y, now)
    listener.upZ.setValueAtTime(up.z, now)
  })

  useEffect(() => () => stopCurrentImmediately(), [stopCurrentImmediately])
}
