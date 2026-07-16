import { ATRIUM } from './atriumTheme';

/** Quiet museum pedestal under the oculus — book stand, no gimmicks. */
export default function CentralPedestal() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.62, 0.24, 32]} />
        <meshStandardMaterial color={ATRIUM.stone} roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.32, 0.55, 24]} />
        <meshStandardMaterial color={ATRIUM.stoneLight} roughness={0.65} metalness={0.06} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.34, 0.08, 32]} />
        <meshStandardMaterial
          color={ATRIUM.goldSoft}
          metalness={0.8}
          roughness={0.3}
          emissive={ATRIUM.goldDim}
          emissiveIntensity={0.08}
        />
      </mesh>
      {/* Closed folio */}
      <mesh position={[0, 0.8, 0]} rotation={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.42, 0.06, 0.3]} />
        <meshStandardMaterial color="#2a1f14" roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.84, 0]} rotation={[0, 0.35, 0]}>
        <boxGeometry args={[0.4, 0.02, 0.28]} />
        <meshStandardMaterial
          color={ATRIUM.goldDim}
          metalness={0.5}
          roughness={0.45}
        />
      </mesh>
      <pointLight
        position={[0, 1.4, 0]}
        intensity={3.5}
        distance={5}
        decay={2}
        color={ATRIUM.skylightWarm}
      />
    </group>
  );
}
