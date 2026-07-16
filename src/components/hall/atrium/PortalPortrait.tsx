import { useMemo, useState } from 'react';
import { useCursor, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ATRIUM } from './atriumTheme';
import { asset } from '../../../utils/asset';

export interface PortalPortraitData {
  id: string;
  name: string;
  photo: string;
  years: string;
  quote?: string;
}

interface PortalPortraitProps {
  poet: PortalPortraitData;
  /** Local position inside the arch group. */
  position: [number, number, number];
  width?: number;
  height?: number;
  onOpen: (poetId: string) => void;
}

/**
 * Gold-framed museum portrait hung inside an arch passage.
 * Texture path goes through asset() for GitHub Pages base.
 */
export default function PortalPortrait({
  poet,
  position,
  width = 0.72,
  height = 0.95,
  onOpen,
}: PortalPortraitProps) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const url = useMemo(() => asset(poet.photo), [poet.photo]);
  const texture = useTexture(url);
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);

  const frameW = width + 0.08;
  const frameH = height + 0.08;
  const frameD = 0.04;

  return (
    <group position={position}>
      {/* Outer gold frame */}
      <mesh position={[0, 0, -0.02]} castShadow>
        <boxGeometry args={[frameW, frameH, frameD]} />
        <meshStandardMaterial
          color={hovered ? ATRIUM.gold : ATRIUM.goldSoft}
          metalness={0.82}
          roughness={0.28}
          emissive={ATRIUM.goldDim}
          emissiveIntensity={hovered ? 0.28 : 0.1}
        />
      </mesh>
      {/* Inner dark mat */}
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[width + 0.03, height + 0.03]} />
        <meshStandardMaterial color="#120e0a" roughness={0.9} />
      </mesh>
      {/* Portrait plane — clickable */}
      <mesh
        position={[0, 0, 0.01]}
        onClick={(e) => {
          e.stopPropagation();
          onOpen(poet.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={texture} roughness={0.55} metalness={0.05} />
      </mesh>
    </group>
  );
}
