import { Text } from '@react-three/drei';
import type { HallWing } from '../../../data/hall';
import { ATRIUM, ATRIUM_LAYOUT } from './atriumTheme';

interface ArchPortalProps {
  wing: HallWing;
  /** Angle on the atrium circle, radians. */
  angle: number;
}

/**
 * One of four wing portals around the rotunda — stone arch + gold numeral plaque.
 * No portraits yet (Pass 4). Click handling stays in DOM wings for now.
 */
export default function ArchPortal({ wing, angle }: ArchPortalProps) {
  const { radius, archWidth, archHeight } = ATRIUM_LAYOUT;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;
  // Face inward toward centre
  const rotY = angle + Math.PI;

  const w = archWidth;
  const h = archHeight;
  const depth = 0.55;
  const pillarW = 0.32;

  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Left pillar */}
      <mesh position={[-w / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[pillarW, h, depth]} />
        <meshStandardMaterial color={ATRIUM.stoneLight} roughness={0.65} metalness={0.05} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[w / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[pillarW, h, depth]} />
        <meshStandardMaterial color={ATRIUM.stoneLight} roughness={0.65} metalness={0.05} />
      </mesh>
      {/* Lintel */}
      <mesh position={[0, h + 0.12, 0]} castShadow>
        <boxGeometry args={[w + pillarW * 1.4, 0.28, depth + 0.08]} />
        <meshStandardMaterial
          color={ATRIUM.goldSoft}
          metalness={0.7}
          roughness={0.35}
          emissive={ATRIUM.goldDim}
          emissiveIntensity={0.08}
        />
      </mesh>
      {/* Arch curve (half-torus) */}
      <mesh position={[0, h, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[w / 2, 0.14, 10, 24, Math.PI]} />
        <meshStandardMaterial
          color={ATRIUM.gold}
          metalness={0.75}
          roughness={0.3}
          emissive={ATRIUM.goldDim}
          emissiveIntensity={0.1}
        />
      </mesh>
      {/* Dark passage void */}
      <mesh position={[0, h / 2 - 0.1, -depth * 0.2]}>
        <planeGeometry args={[w - pillarW * 0.6, h - 0.2]} />
        <meshStandardMaterial color="#050403" roughness={1} metalness={0} />
      </mesh>
      {/* Numeral + short title */}
      <Text
        position={[0, h + 0.55, depth * 0.35]}
        fontSize={0.28}
        color={ATRIUM.gold}
        anchorX="center"
        anchorY="middle"
        maxWidth={2.2}
        textAlign="center"
        outlineWidth={0.012}
        outlineColor="#1a1208"
      >
        {`${wing.numeral}  ·  ${wing.shortTitle.toUpperCase()}`}
      </Text>
      {/* Warm sconce left / right */}
      <pointLight
        position={[-w / 2 - 0.1, h * 0.55, depth * 0.6]}
        intensity={2.2}
        distance={4}
        decay={2}
        color={ATRIUM.skylightWarm}
      />
      <pointLight
        position={[w / 2 + 0.1, h * 0.55, depth * 0.6]}
        intensity={2.2}
        distance={4}
        decay={2}
        color={ATRIUM.skylightWarm}
      />
    </group>
  );
}
