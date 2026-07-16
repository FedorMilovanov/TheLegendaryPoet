import { useMemo, useState } from 'react';
import { Text, useCursor, useTexture } from '@react-three/drei';
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
  /** When true, frame glows a little more (wing focused). */
  emphasized?: boolean;
}

/**
 * Gold-framed museum portrait hung inside an arch passage.
 * Texture path goes through asset() for GitHub Pages base.
 * Optional plaque name/years under the frame (Pass 5).
 */
export default function PortalPortrait({
  poet,
  position,
  width = 0.72,
  height = 0.95,
  onOpen,
  emphasized = false,
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
  const frameD = 0.045;
  const lit = hovered || emphasized;

  return (
    <group position={position}>
      {/* Outer gold frame */}
      <mesh position={[0, 0, -0.02]} castShadow>
        <boxGeometry args={[frameW, frameH, frameD]} />
        <meshStandardMaterial
          color={lit ? ATRIUM.gold : ATRIUM.goldSoft}
          metalness={0.84}
          roughness={0.26}
          emissive={ATRIUM.goldDim}
          emissiveIntensity={lit ? 0.32 : 0.1}
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
        <meshStandardMaterial map={texture} roughness={0.52} metalness={0.04} />
      </mesh>
      {/* Bronze name plaque under the frame */}
      <mesh position={[0, -height / 2 - 0.14, 0.01]} castShadow>
        <boxGeometry args={[width + 0.06, 0.16, 0.03]} />
        <meshStandardMaterial
          color="#3a2e1c"
          metalness={0.55}
          roughness={0.4}
          emissive={ATRIUM.goldDim}
          emissiveIntensity={0.06}
        />
      </mesh>
      <Text
        position={[0, -height / 2 - 0.12, 0.03]}
        fontSize={0.075}
        color={ATRIUM.gold}
        anchorX="center"
        anchorY="middle"
        maxWidth={width + 0.02}
        textAlign="center"
        outlineWidth={0.004}
        outlineColor="#100c08"
      >
        {poet.name}
      </Text>
      <Text
        position={[0, -height / 2 - 0.185, 0.03]}
        fontSize={0.05}
        color={ATRIUM.goldSoft}
        anchorX="center"
        anchorY="middle"
        maxWidth={width}
        textAlign="center"
        outlineWidth={0.003}
        outlineColor="#100c08"
      >
        {poet.years}
      </Text>
    </group>
  );
}
