// Poet whisper — 3D positional audio on hover
// Looks for /audio/poet-{id}.mp3 , /audio/{id}.mp3 , or poet.voiceClip
// Silent fail if file missing — no 404 spam in console
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

let audioCtx: AudioContext | null = null
const buffers = new Map<string, AudioBuffer>()

async function loadBuffer(url: string): Promise<AudioBuffer | null> {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (audioCtx.state === 'suspended') await audioCtx.resume()
    if (buffers.has(url)) return buffers.get(url)!
    const res = await fetch(url, { method: 'HEAD' })
    if (!res.ok) return null
    const ab = await fetch(url).then(r => r.arrayBuffer())
    const buf = await audioCtx.decodeAudioData(ab)
    buffers.set(url, buf)
    return buf
  } catch { return null }
}

export function usePoetWhisper(poetId: string, active: boolean, position: [number, number, number]) {
  const { camera } = useThree()
  const srcRef = useRef<PannerNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null)

  useEffect(() => {
    // global mute
    if ((window as any).__TLP_AUDIO_MUTED) return
    if (!active) {
      if (gainRef.current && audioCtx) {
        gainRef.current.gain.cancelScheduledValues(audioCtx.currentTime)
        gainRef.current.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.35)
      }
      setTimeout(() => {
        audioSourceRef.current?.stop()
        audioSourceRef.current = null
      }, 380)
      return
    }

    let cancelled = false
    ;(async () => {
      const candidates = [
        `/audio/poet-${poetId}.mp3`,
        `/audio/${poetId}.mp3`,
      ]
      let buf: AudioBuffer | null = null
      for (const url of candidates) {
        buf = await loadBuffer(url)
        if (buf) break
      }
      if (!buf || cancelled) return
      if (!audioCtx) return
      await audioCtx.resume()

      const panner = audioCtx.createPanner()
      panner.panningModel = 'HRTF'
      panner.distanceModel = 'inverse'
      panner.refDistance = 1.8
      panner.maxDistance = 12
      panner.rolloffFactor = 1.2
      panner.positionX.value = position[0]
      panner.positionY.value = position[1]
      panner.positionZ.value = position[2]

      const gain = audioCtx.createGain()
      gain.gain.value = 0
      gain.gain.linearRampToValueAtTime(0.72, audioCtx.currentTime + 0.6)

      const src = audioCtx.createBufferSource()
      src.buffer = buf
      src.loop = false
      src.connect(gain).connect(panner).connect(audioCtx.destination)
      src.start()

      srcRef.current = panner
      gainRef.current = gain
      audioSourceRef.current = src
    })()

    return () => { cancelled = true }
  }, [active, poetId, position])

  // update listener to camera
  useEffect(() => {
    if (!audioCtx || !audioCtx.listener.positionX) return
    const l = audioCtx.listener
    const p = camera.position
    if (l.positionX) {
      l.positionX.value = p.x; l.positionY.value = p.y; l.positionZ.value = p.z
      const dir = new THREE.Vector3()
      camera.getWorldDirection(dir)
      if (l.forwardX) {
        l.forwardX.value = dir.x; l.forwardY.value = dir.y; l.forwardZ.value = dir.z
      }
    }
  })
}
