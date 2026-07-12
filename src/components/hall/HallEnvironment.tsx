// HallEnvironment v1.2 — target: reference_hall_target_v2.jpg
// Nero Marquina high-gloss, golden frames, cyan floor uplights, end-wall "ВЕЛИКИЕ РУССКИЕ ПОЭТЫ"
import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial, Text } from '@react-three/drei'
import { HALL, PALETTE } from './hallConfig'

export function HallEnvironment() {
  const dust = useRef<THREE.Points>(null!)

  const dustPositions = useRef(
    Float32Array.from({ length: 900 * 3 }, (_, i) => {
      const a = i % 3
      if (a === 0) return THREE.MathUtils.randFloatSpread(HALL.length)
      if (a === 1) return THREE.MathUtils.randFloat(0.4, HALL.height - 0.4)
      return THREE.MathUtils.randFloatSpread(HALL.width - 1.2)
    })
  ).current

  useFrame((_state, dt) => {
    if (dust.current) {
      dust.current.rotation.y += dt * 0.008
    }
  })

  return (
    <group>
      <fog attach="fog" args={[PALETTE.fog, 11, 52]} />

      {/* --- FLOOR: Nero Marquina, ultra gloss, reference match --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[HALL.length + 8, HALL.width + 2]} />
        <MeshReflectorMaterial
          blur={[380, 60]}
          resolution={1536}
          mixBlur={6.5}
          mixStrength={52}
          roughness={0.06}
          depthScale={0.5}
          minDepthThreshold={0.9}
          maxDepthThreshold={1.35}
          color="#070a0e"
          metalness={0.85}
          mirror={0.82}
        />
      </mesh>

      {/* Floor cyan guide strips — like in reference */}
      {[-1, 1].map(side => (
        <mesh key={side} rotation={[-Math.PI/2,0,0]} position={[0, 0.012, side * (HALL.width/2 - 1.55)]}>
          <planeGeometry args={[HALL.length, 0.045]} />
          <meshBasicMaterial color={PALETTE.cyan} transparent opacity={0.55} toneMapped={false} />
        </mesh>
      ))}

      {/* Ceiling vault - darker marble, coffered */}
      <mesh position={[0, HALL.height, 0]} receiveShadow>
        <cylinderGeometry args={[HALL.width/2, HALL.width/2, HALL.length+6, 64, 1, true, Math.PI/2, Math.PI]} />
        <meshStandardMaterial color="#1c2228" roughness={0.78} metalness={0.15} side={THREE.BackSide} />
      </mesh>

      {/* Walls — dark veined marble */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, HALL.height/2, side * HALL.width/2]} receiveShadow>
          <planeGeometry args={[HALL.length+6, HALL.height]} />
          <meshStandardMaterial color="#1a1f25" roughness={0.72} metalness={0.2} />
        </mesh>
      ))}

      {/* Columns / pilasters between niches */}
      {Array.from({ length: 11 }).map((_, i) => {
        const x = -21 + i * 2.9
        return (
          <group key={i}>
            {[-1,1].map(side => (
              <mesh key={side} position={[x, HALL.height/2, side * (HALL.width/2 - 0.18)]}>
                <cylinderGeometry args={[0.18, 0.21, HALL.height, 24]} />
                <meshStandardMaterial color="#2a313a" roughness={0.55} metalness={0.35} />
              </mesh>
            ))}
          </group>
        )
      })}

      {/* Oculus god rays — 3 skylights, stronger */}
      {[-12, 0, 12].map((x, i) => (
        <group key={i} position={[x, HALL.height-0.05, 0]}>
          <mesh>
            <cylinderGeometry args={[0.62, 3.1, HALL.height, 48, 1, true]} />
            <meshBasicMaterial color="#bff7ff" transparent opacity={0.045} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {/* oculus rim */}
          <mesh position={[0, 0.02, 0]} rotation={[Math.PI/2,0,0]}>
            <ringGeometry args={[0.95, 1.28, 64]} />
            <meshStandardMaterial color={PALETTE.brass} metalness={0.92} roughness={0.32} emissive={PALETTE.cyan} emissiveIntensity={0.18} />
          </mesh>
          <pointLight intensity={3.4} distance={16} color="#eaffff" />
        </group>
      ))}

      {/* Pedestal cyan uplights under each niche — reference look */}
      {Array.from({length: 10}).map((_,i)=>{
        const side = i % 2 === 0 ? -1 : 1
        const pair = Math.floor(i/2)
        const x = -18 + pair * 5.8
        const z = side * (HALL.width/2 - 0.9)
        return (
          <pointLight key={i} position={[x, 0.28, z]} intensity={2.8} distance={2.6} color={PALETTE.cyan} decay={2.2} />
        )
      })}

      {/* End wall — ВЕЛИКИЕ РУССКИЕ ПОЭТЫ */}
      <group position={[HALL.length/2 + 0.05, 3.2, 0]} rotation={[0, -Math.PI/2, 0]}>
        <mesh position={[0,0,-0.05]}>
          <planeGeometry args={[5.5, 6.2]} />
          <meshStandardMaterial color="#12171d" roughness={0.8} metalness={0.1} />
        </mesh>
        <Text
          fontSize={0.34}
          color="#e8d9a6"
          anchorX="center"
          anchorY="middle"
          position={[0, 0.32, 0.01]}
          outlineWidth={0.004}
          outlineColor="#000"
          maxWidth={4.8}
          textAlign="center"
        >
          {`ВЕЛИКИЕ\nРУССКИЕ\nПОЭТЫ`}
        </Text>
        <pointLight position={[0,0,1.2]} intensity={2.6} color="#ffe8b6" distance={7} />
      </group>

      {/* Ambient */}
      <hemisphereLight args={['#9ddfff', '#02070d', 0.34]} />
      <ambientLight intensity={0.18} />

      {/* Main wash */}
      <directionalLight
        position={[8, 10, 0]}
        intensity={0.58}
        color="#d8f7ff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Floating dust */}
      <points ref={dust}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={dustPositions.length / 3}
            array={dustPositions}
            itemSize={3}
            args={[dustPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial size={0.032} color="#aeefff" transparent opacity={0.52} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  )
}
