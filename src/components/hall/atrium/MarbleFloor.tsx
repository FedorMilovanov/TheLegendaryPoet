import { MeshReflectorMaterial } from '@react-three/drei';
import { ATRIUM, ATRIUM_LAYOUT } from './atriumTheme';

/** Dark polished marble disc — museum floor, warm reflection. */
export default function MarbleFloor() {
  const r = ATRIUM_LAYOUT.domeRadius + 0.4;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[r, 64]} />
        <MeshReflectorMaterial
          blur={[280, 80]}
          resolution={512}
          mixBlur={0.85}
          mixStrength={0.55}
          roughness={0.35}
          depthScale={0.6}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          color={ATRIUM.floor}
          metalness={0.15}
          mirror={0.35}
        />
      </mesh>
      {/* Brass compass ring inlaid in the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[1.35, 1.48, 64]} />
        <meshStandardMaterial
          color={ATRIUM.gold}
          metalness={0.85}
          roughness={0.28}
          emissive={ATRIUM.goldDim}
          emissiveIntensity={0.15}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 0]}>
        <circleGeometry args={[1.35, 48]} />
        <meshStandardMaterial color={ATRIUM.floorDark} metalness={0.2} roughness={0.45} />
      </mesh>
    </group>
  );
}
