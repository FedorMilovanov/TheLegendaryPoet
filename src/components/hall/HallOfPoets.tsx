// Hall of Poets 2.0 — v1.3 — Morph + Audio + PBR
import * as THREE from 'three'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor, AdaptiveDpr, Preload, Environment, Lightformer, ContactShadows } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'

import { HallEnvironment } from './HallEnvironment'
import { PoetNiche } from './PoetNiche'
import { useHallNavigation } from './useHallNavigation'
import { FirstPersonControls } from './FirstPersonControls'
import { POET_ORDER, getNicheTransform, RENDER, PALETTE } from './hallConfig'

import { poets as allPoetsRaw } from '@/data/poets'
import { asset } from '@/utils/asset'

// Postprocessing is loaded lazily where enabled; kept off by default for stability.
const USE_POSTPROCESSING = false
const PostFX: any = null

type RawPoet = { id: string; name?: string; fullName?: string; birthYear?: number; deathYear?: number; photo?: string; epigraph?: string; poems?: { title: string }[] }
type NormPoet = { id: string; shortKey: string; name: string; years: string; portrait: string; quote: string }

const POET_QUOTES: Record<string, string> = {
  pushkin: 'Я памятник себе воздвиг нерукотворный',
  lermontov: 'Выхожу один я на дорогу',
  tyutchev: 'Умом Россию не понять',
  fet: 'Шёпот, робкое дыханье',
  blok: 'Ночь, улица, фонарь, аптека',
  gumilev: 'Ещё не раз вы вспомните меня',
  akhmatova: 'Я научила женщин говорить',
  mayakovsky: 'Светить всегда, светить везде',
  yesenin: 'Не жалею, не зову, не плачу',
  pasternak: 'Быть знаменитым некрасиво',
}

function shortKeyFromPhoto(photo?: string): string {
  return (photo || '').replace(/^.*\//, '').replace(/\.\w+$/, '')
}

function normalizePoet(p: RawPoet, shortKey: string): NormPoet {
  const name = p.name ?? p.fullName ?? ''
  const years = p.birthYear ? `${p.birthYear}—${p.deathYear ?? 'н.в.'}` : ''
  const portrait = asset(p.photo || `/images/${shortKey}.jpg`)
  const quote = POET_QUOTES[shortKey] || p.epigraph || p.poems?.[0]?.title || ''
  return { id: p.id, shortKey, name, years, portrait, quote }
}

function HallScene({ fpsMode, onOpenPoet }: { fpsMode: boolean; onOpenPoet: (id: string) => void }) {
  const [focused, setFocused] = useState<string | null>(null)

  // Resolve POET_ORDER (short keys = portrait basename) against the real poet
  // records (whose ids are like "alexander-pushkin" and portraits live in `photo`).
  const poets = useMemo(() => {
    const byKey = new Map<string, RawPoet>()
    for (const p of allPoetsRaw as unknown as RawPoet[]) {
      const key = shortKeyFromPhoto(p.photo)
      if (key) byKey.set(key, p)
    }
    return POET_ORDER
      .map(key => { const raw = byKey.get(key); return raw ? normalizePoet(raw, key) : null })
      .filter(Boolean) as NormPoet[]
  }, [])

  const focusedIndex = focused ? poets.findIndex(p => p.id === focused) : null
  useHallNavigation(focusedIndex, poets.length, !fpsMode)

  // FPS interact: E → открыть сфокусированную нишу
  useEffect(() => {
    if (!fpsMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE') return
      const id = focused || poets[0]?.id
      if (id) onOpenPoet(id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fpsMode, focused, onOpenPoet, poets])

  return (
    <>
      {fpsMode && <FirstPersonControls enabled={fpsMode} />}
      <HallEnvironment />
      {poets.map((poet, i) => {
        const t = getNicheTransform(i)
        return (
          <PoetNiche
            key={poet.id}
            poet={poet}
            position={t.position}
            rotationY={t.rotationY}
            active={focused === poet.id}
            onFocus={setFocused}
            onSelect={() => onOpenPoet(poet.id)}
          />
        )
      })}
      <ContactShadows position={[0, 0.01, 0]} opacity={0.52} scale={70} blur={2.4} far={18} color="#000814" />
      {/* Self-contained IBL via Lightformers — no external HDRI fetch (robust +
          art-directed cyan/warm reflections on the marble & brass). */}
      <Environment resolution={256} environmentIntensity={0.32}>
        <Lightformer intensity={2.4} color="#eaf6ff" position={[0, 7, 0]} scale={[12, 2.4, 1]} rotation={[Math.PI / 2, 0, 0]} />
        <Lightformer intensity={1.5} color="#00d4ff" position={[-9, 2.2, 7]} scale={[7, 4.5, 1]} rotation={[0, Math.PI / 2, 0]} />
        <Lightformer intensity={1.15} color="#ffd7a0" position={[9, 2.2, -7]} scale={[7, 4.5, 1]} rotation={[0, -Math.PI / 2, 0]} />
        <Lightformer intensity={0.8} color="#7ee7ff" position={[0, 1.2, -12]} scale={[10, 3, 1]} />
      </Environment>
    </>
  )
}

function PostProcessing() {
  if (!USE_POSTPROCESSING || !PostFX) return null
  const { EffectComposer, Bloom, SSAO, Vignette, DepthOfField } = PostFX
  return (
    <EffectComposer multisampling={0} enableNormalPass>
      <SSAO intensity={12} radius={0.28} luminanceInfluence={0.45} />
      <Bloom intensity={0.55} luminanceThreshold={0.82} mipmapBlur />
      <DepthOfField focusDistance={0.012} focalLength={0.065} bokehScale={2.2} />
      <Vignette offset={0.26} darkness={0.52} />
    </EffectComposer>
  )
}

export default function HallOfPoets() {
  // Router context does NOT cross the R3F <Canvas> reconciler boundary, so we
  // resolve navigation HERE (outside the Canvas) and pass a callback down.
  const navigate = useNavigate()
  const [dpr, setDpr] = useState(RENDER.dpr[1])
  const [fpsMode, setFpsMode] = useState(false)
  const [audioMuted, setAudioMuted] = useState(false)

  const onOpenPoet = useCallback((id: string) => {
    try {
      sessionStorage.setItem('tlp_hall_last_poet', id)
      sessionStorage.setItem('tlp_hall_transition', `poet-portrait-${id}`)
    } catch { /* storage blocked */ }
    navigate(`/poets/${id}`)
  }, [navigate])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'KeyF') setFpsMode(f => !f)
      if (e.code === 'KeyM') setAudioMuted(m => !m)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // global audio mute flag for usePoetWhisper
  useEffect(() => {
    try { (window as any).__TLP_AUDIO_MUTED = audioMuted } catch {}
  }, [audioMuted])

  return (
    <section className="relative h-[100vh] w-full overflow-hidden bg-[#020811]" aria-label="Зал Поэтов — 3D" data-lenis-prevent>
      <Canvas
        shadows={RENDER.shadows}
        dpr={dpr}
        camera={{ fov: 55, position: [-20, 1.62, 0], near: 0.15, far: 120 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: RENDER.toneMappingExposure,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <color attach="background" args={[PALETTE.bg]} />
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(RENDER.dpr[1])}>
          <Suspense fallback={null}>
            <HallScene fpsMode={fpsMode} onOpenPoet={onOpenPoet} />
            <Preload all />
            <PostProcessing />
          </Suspense>
          <AdaptiveDpr pixelated />
        </PerformanceMonitor>
      </Canvas>

      {/* UI Overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-20 z-20 text-center px-4">
        <div className="font-serif text-[11px] tracking-[0.38em] text-cyan-200/70">THE LEGENDARY POET</div>
        <h1 className="mt-3 font-serif text-5xl md:text-7xl font-bold tracking-tight text-[#e9faff]" style={{ textShadow: '0 0 32px rgba(0,212,255,0.28)' }}>
          Зал Поэтов
        </h1>
        <p className="mt-3 text-cyan-100/70 text-sm md:text-[15px]">
          {fpsMode 
            ? 'WASD + мышь — ходить · Shift бег · E — открыть · F — выйти · M — звук'
            : 'Скролл / drag / ← → — неф · F — FPS ходьба · Клик — досье · M — звук · K — поиск'
          }
        </p>
        <div className="mt-2 inline-flex items-center gap-3 rounded-full border border-cyan-400/25 bg-black/35 px-3 py-1 text-[11px] text-cyan-200/80 backdrop-blur pointer-events-auto">
          <span className={`h-1.5 w-1.5 rounded-full ${fpsMode ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
          <button onClick={() => setFpsMode(f => !f)} className="hover:text-white">
            {fpsMode ? 'FPS Walk' : 'Rail Dolly'}
          </button>
          <span className="opacity-30">|</span>
          <button onClick={() => setAudioMuted(m => !m)} className="hover:text-white">
            {audioMuted ? '🔇 Звук выкл' : '🔊 Звук вкл'}
          </button>
          <span className="opacity-60 hidden sm:inline">F / M</span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#020811] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#020811] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#020811] to-transparent" />
    </section>
  )
}
