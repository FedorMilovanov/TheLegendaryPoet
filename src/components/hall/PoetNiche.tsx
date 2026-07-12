import * as THREE from 'three'
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, useTexture, RoundedBox } from '@react-three/drei'
import { PALETTE, HALL } from './hallConfig'
import { usePoetWhisper } from './usePoetWhisper'

type PoetLite = {
  id: string
  shortKey: string
  name: string
  years: string
  portrait: string
  quote?: string
}

// SVG автографы — замените на реальные сканы
const AUTOGRAPHS: Record<string, string> = {
  pushkin: 'А. Пушкин',
  lermontov: 'М. Лермонтов',
  tyutchev: 'Ѳ. Тютчевъ',
  fet: 'А. Фетъ',
  blok: 'А. Блок',
  gumilev: 'Н. Гумилёв',
  akhmatova: 'А. Ахматова',
  mayakovsky: 'В. Маяковский',
  yesenin: 'С. Есенин',
  pasternak: 'Б. Пастернак',
}

export function PoetNiche({
  poet,
  position,
  rotationY,
  active,
  onSelect,
  onFocus,
}: {
  poet: PoetLite
  position: [number, number, number]
  rotationY: number
  active: boolean
  onSelect: () => void
  onFocus: (id: string | null) => void
}) {
  const group = useRef<THREE.Group>(null!)
  const frameRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHover] = useState(false)

  const texture = useTexture(poet.portrait)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  // audio whisper — looks for /audio/poet-{shortKey}.mp3 (silent if absent)
  usePoetWhisper(poet.shortKey, hovered, position)

  useFrame((_, dt) => {
    if (!group.current) return
    const target = hovered || active ? 1 : 0
    const s = group.current.scale.x
    const ns = THREE.MathUtils.damp(s, 1 + target * 0.022, 6, dt)
    group.current.scale.setScalar(ns)
    if (frameRef.current?.material) {
      const mat = frameRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = THREE.MathUtils.damp(
        mat.emissiveIntensity,
        hovered ? 0.72 : 0.14,
        5, dt
      )
    }
  })

  const frameW = 1.58
  const frameH = 2.12
  const autograph = AUTOGRAPHS[poet.shortKey] || ''

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Niche back */}
      <mesh position={[0, HALL.nicheHeight/2 + 0.15, -HALL.nicheDepth/2 + 0.08]} receiveShadow>
        <planeGeometry args={[HALL.nicheWidth, HALL.nicheHeight]} />
        <meshStandardMaterial color="#151a20" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Marble pedestal */}
      <group position={[0, 0.55, 0.42]}>
        <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
          <boxGeometry args={[1.9, 0.72, 0.48]} />
          <meshStandardMaterial color="#14191f" roughness={0.48} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0.01, 0.251]}>
          <boxGeometry args={[1.9, 0.045, 0.012]} />
          <meshStandardMaterial color={PALETTE.cyan} emissive={PALETTE.cyan} emissiveIntensity={0.65} />
        </mesh>
        <Text fontSize={0.105} color="#f0e6c8" anchorX="center" anchorY="middle" position={[0, 0.38, 0.251]} maxWidth={1.7} textAlign="center">
          {poet.name}
        </Text>
        <Text fontSize={0.068} color="#9bdfff" anchorX="center" anchorY="middle" position={[0, 0.24, 0.251]}>
          {poet.years}
        </Text>
        <Text fontSize={0.048} color="#c7d8e2" anchorX="center" anchorY="middle" position={[0, 0.08, 0.251]} maxWidth={1.68} textAlign="center" lineHeight={1.25}>
          {poet.quote ? `«${poet.quote}»` : ''}
        </Text>
        {/* autograph */}
        {autograph && (
          <Text
            fontSize={0.052}
            color="#e8cf99"
            anchorX="center"
            anchorY="middle"
            position={[0, -0.09, 0.251]}
            fontStyle="italic"
            fillOpacity={hovered ? 0.95 : 0.72}
          >
            {autograph}
          </Text>
        )}
      </group>

      {/* Portrait frame — with data attribute for morph transition */}
      <group
        ref={group}
        position={[0, 1.78, 0.18]}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); onFocus(poet.id)}}
        onPointerOut={() => { setHover(false); onFocus(null)}}
        onClick={(e) => { e.stopPropagation(); onSelect() }}
        userData={{ poetTransitionId: `poet-portrait-${poet.id}` }}
      >
        <RoundedBox args={[frameW + 0.22, frameH + 0.22, 0.09]} radius={0.022} smoothness={4} castShadow>
          <meshStandardMaterial color="#b8892a" metalness={0.98} roughness={0.22} emissive={PALETTE.cyan} emissiveIntensity={0.1} />
        </RoundedBox>
        <RoundedBox ref={frameRef as any} args={[frameW, frameH, 0.075]} radius={0.018} smoothness={4}>
          <meshStandardMaterial color={PALETTE.brass} metalness={0.96} roughness={0.26} emissive={PALETTE.cyan} emissiveIntensity={0.14} />
        </RoundedBox>

        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[frameW - 0.16, frameH - 0.16]} />
          <meshStandardMaterial map={texture} roughness={0.48} metalness={0} />
        </mesh>
        <mesh position={[0, 0, 0.062]}>
          <planeGeometry args={[frameW - 0.16, frameH - 0.16]} />
          <meshPhysicalMaterial transparent opacity={0.10} roughness={0.05} transmission={0.18} thickness={0.35} ior={1.5} />
        </mesh>
      </group>

      <spotLight
        position={[0, 3.15, 1.35]}
        angle={0.40}
        penumbra={0.74}
        intensity={hovered ? 38 : 22}
        color={hovered ? '#ffffff' : '#d8f6ff'}
        distance={6.4}
        decay={1.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </group>
  )
}
