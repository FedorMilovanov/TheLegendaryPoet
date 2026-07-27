// Poet whisper — 3D positional audio on hover
// Looks for /audio/poet-{id}.mp3 or /audio/{id}.mp3.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import {
  createWhisperPlaybackController,
  type WhisperPlaybackController,
} from './whisperPlayback'

let audioCtx: AudioContext | null = null
const bufferRequests = new Map<string, Promise<AudioBuffer | null>>()

function getAudioContext() {
  if (audioCtx) return audioCtx
  const AudioContextConstructor = window.AudioContext || (window as Window & {
    webkitAudioContext?: typeof AudioContext
  }).webkitAudioContext
  if (!AudioContextConstructor) return null
  audioCtx = new AudioContextConstructor()
  return audioCtx
}

function loadBuffer(url: string): Promise<AudioBuffer | null> {
  const cached = bufferRequests.get(url)
  if (cached) return cached

  const request = (async () => {
    try {
      const context = getAudioContext()
      if (!context) return null
      if (context.state === 'suspended') await context.resume()
      const response = await fetch(url)
      if (!response.ok) return null
      return await context.decodeAudioData(await response.arrayBuffer())
    } catch {
      return null
    }
  })()

  // Successful buffers and missing assets are both cached for this page load,
  // preventing repeated HEAD + GET pairs and repeated 404s on every hover.
  bufferRequests.set(url, request)
  return request
}

function createPlaybackController(): WhisperPlaybackController | null {
  if (typeof window === 'undefined') return null
  return createWhisperPlaybackController({
    schedule: (callback, delayMs) => window.setTimeout(callback, delayMs),
    cancel: (handle) => window.clearTimeout(handle),
  })
}

export function usePoetWhisper(
  poetId: string,
  active: boolean,
  position: [number, number, number],
  muted: boolean,
) {
  const { camera } = useThree()
  const playbackRef = useRef<WhisperPlaybackController | null>(null)
  const [x, y, z] = position

  if (!playbackRef.current) playbackRef.current = createPlaybackController()

  useEffect(() => () => {
    playbackRef.current?.dispose()
    playbackRef.current = null
  }, [])

  useEffect(() => {
    const playback = playbackRef.current
    if (!playback) return

    if (!active || muted) {
      if (audioCtx) playback.fadeOut(audioCtx.currentTime)
      else playback.stop()
      return
    }

    let cancelled = false
    ;(async () => {
      const candidates = [
        `/audio/poet-${poetId}.mp3`,
        `/audio/${poetId}.mp3`,
      ]
      let buffer: AudioBuffer | null = null
      for (const url of candidates) {
        buffer = await loadBuffer(url)
        if (buffer) break
      }
      if (!buffer || cancelled) return

      const context = getAudioContext()
      if (!context) return
      if (context.state === 'suspended') await context.resume()
      if (cancelled) return

      const panner = context.createPanner()
      panner.panningModel = 'HRTF'
      panner.distanceModel = 'inverse'
      panner.refDistance = 1.8
      panner.maxDistance = 12
      panner.rolloffFactor = 1.2
      panner.positionX.value = x
      panner.positionY.value = y
      panner.positionZ.value = z

      const gain = context.createGain()
      gain.gain.value = 0
      gain.gain.linearRampToValueAtTime(0.72, context.currentTime + 0.6)

      const source = context.createBufferSource()
      source.buffer = buffer
      source.loop = false
      source.connect(gain).connect(panner).connect(context.destination)
      playback.replace({ source, gain, panner })
      source.onended = () => playback.complete(source)
      source.start()
    })()

    return () => {
      cancelled = true
      if (audioCtx) playback.fadeOut(audioCtx.currentTime)
      else playback.stop()
    }
  }, [active, muted, poetId, x, y, z])

  // Update listener to camera. This effect intentionally runs every frame-like
  // React render, but it does not restart or replace the audio source.
  useEffect(() => {
    if (!audioCtx || !audioCtx.listener.positionX) return
    const listener = audioCtx.listener
    const point = camera.position
    listener.positionX.value = point.x
    listener.positionY.value = point.y
    listener.positionZ.value = point.z
    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)
    if (listener.forwardX) {
      listener.forwardX.value = direction.x
      listener.forwardY.value = direction.y
      listener.forwardZ.value = direction.z
    }
  })
}
