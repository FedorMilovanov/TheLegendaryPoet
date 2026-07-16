import { Text } from '@react-three/drei';
import { useState } from 'react';
import type { HallWing } from '../../../data/hall';
import { ATRIUM, ATRIUM_LAYOUT } from './atriumTheme';
import PortalPortrait, { type PortalPortraitData } from './PortalPortrait';

interface ArchPortalProps {
  wing: HallWing;
  /** Angle on the atrium circle, radians. */
  angle: number;
  /** Up to two poets to hang in the arch (curated from wing.poetIds). */
  portraits: PortalPortraitData[];
  focused?: boolean;
  onFocusWing: (wingId: HallWing['id']) => void;
  onOpenPoet: (poetId: string) => void;
  onEnterWing: (wingId: HallWing['id']) => void;
}

/**
 * Wing portal: stone pillars, gold arch, optional portrait pair or sealed door.
 * Router is never used here — callbacks come from outside the Canvas.
 */
export default function ArchPortal({
  wing,
  angle,
  portraits,
  focused,
  onFocusWing,
  onOpenPoet,
  onEnterWing,
}: ArchPortalProps) {
  const { radius, archWidth, archHeight } = ATRIUM_LAYOUT;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;
  const rotY = angle + Math.PI;

  const w = archWidth;
  const h = archHeight;
  const depth = 0.62;
  const pillarW = 0.34;
  const sealed = portraits.length === 0;
  const [archHover, setArchHover] = useState(false);

  const accent = wing.accent || ATRIUM.gold;

  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Left / right pillars */}
      <mesh position={[-w / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[pillarW, h, depth]} />
        <meshStandardMaterial color={ATRIUM.stoneLight} roughness={0.62} metalness={0.06} />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[pillarW, h, depth]} />
        <meshStandardMaterial color={ATRIUM.stoneLight} roughness={0.62} metalness={0.06} />
      </mesh>

      {/* Capital blocks */}
      {([-w / 2, w / 2] as const).map((px) => (
        <mesh key={px} position={[px, h + 0.08, 0]} castShadow>
          <boxGeometry args={[pillarW + 0.08, 0.16, depth + 0.06]} />
          <meshStandardMaterial
            color={ATRIUM.goldSoft}
            metalness={0.72}
            roughness={0.34}
            emissive={ATRIUM.goldDim}
            emissiveIntensity={focused || archHover ? 0.18 : 0.08}
          />
        </mesh>
      ))}

      {/* Lintel */}
      <mesh position={[0, h + 0.2, 0]} castShadow>
        <boxGeometry args={[w + pillarW * 1.5, 0.26, depth + 0.1]} />
        <meshStandardMaterial
          color={focused || archHover ? ATRIUM.gold : ATRIUM.goldSoft}
          metalness={0.74}
          roughness={0.32}
          emissive={ATRIUM.goldDim}
          emissiveIntensity={focused || archHover ? 0.22 : 0.09}
        />
      </mesh>

      {/* Arch curve */}
      <mesh position={[0, h, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[w / 2, 0.13, 10, 28, Math.PI]} />
        <meshStandardMaterial
          color={ATRIUM.gold}
          metalness={0.78}
          roughness={0.28}
          emissive={ATRIUM.goldDim}
          emissiveIntensity={focused || archHover ? 0.2 : 0.1}
        />
      </mesh>

      {/* Passage void — click focuses wing / scrolls DOM */}
      <mesh
        position={[0, h / 2 - 0.05, -depth * 0.15]}
        onClick={(e) => {
          e.stopPropagation();
          onFocusWing(wing.id);
          onEnterWing(wing.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setArchHover(true);
        }}
        onPointerOut={() => setArchHover(false)}
      >
        <planeGeometry args={[w - pillarW * 0.55, h - 0.15]} />
        <meshStandardMaterial
          color={sealed ? '#0a0806' : '#080604'}
          roughness={1}
          metalness={0}
          emissive={focused ? accent : '#000000'}
          emissiveIntensity={focused ? 0.06 : 0}
        />
      </mesh>

      {/* Sealed door for empty modern wing */}
      {sealed && (
        <group position={[0, h * 0.42, 0.02]}>
          <mesh>
            <planeGeometry args={[w * 0.55, h * 0.55]} />
            <meshStandardMaterial
              color="#1a1510"
              roughness={0.75}
              metalness={0.15}
              emissive={ATRIUM.goldDim}
              emissiveIntensity={0.05}
            />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <ringGeometry args={[0.18, 0.26, 32]} />
            <meshStandardMaterial
              color={ATRIUM.gold}
              metalness={0.85}
              roughness={0.25}
              emissive={ATRIUM.goldDim}
              emissiveIntensity={0.2}
            />
          </mesh>
          <Text
            position={[0, -0.55, 0.03]}
            fontSize={0.14}
            color={ATRIUM.gold}
            anchorX="center"
            maxWidth={1.6}
            textAlign="center"
            outlineWidth={0.008}
            outlineColor="#120e08"
          >
            ЗАПЕЧАТАНО
          </Text>
        </group>
      )}

      {/* Portrait pair (or single) inside open arches */}
      {!sealed &&
        portraits.map((poet, i) => {
          const n = portraits.length;
          const xOff = n === 1 ? 0 : i === 0 ? -0.42 : 0.42;
          return (
            <PortalPortrait
              key={poet.id}
              poet={poet}
              position={[xOff, h * 0.42, 0.04]}
              width={n === 1 ? 0.85 : 0.7}
              height={n === 1 ? 1.1 : 0.92}
              onOpen={onOpenPoet}
            />
          );
        })}

      {/* Numeral plaque above lintel */}
      <Text
        position={[0, h + 0.58, depth * 0.38]}
        fontSize={0.26}
        color={ATRIUM.gold}
        anchorX="center"
        anchorY="middle"
        maxWidth={2.4}
        textAlign="center"
        outlineWidth={0.01}
        outlineColor="#1a1208"
      >
        {`${wing.numeral}  ·  ${wing.shortTitle.toUpperCase()}`}
      </Text>

      {/* Warm sconces */}
      <pointLight
        position={[-w / 2 - 0.12, h * 0.55, depth * 0.55]}
        intensity={focused || archHover ? 3.2 : 2.0}
        distance={4.5}
        decay={2}
        color={ATRIUM.skylightWarm}
      />
      <pointLight
        position={[w / 2 + 0.12, h * 0.55, depth * 0.55]}
        intensity={focused || archHover ? 3.2 : 2.0}
        distance={4.5}
        decay={2}
        color={ATRIUM.skylightWarm}
      />
    </group>
  );
}
