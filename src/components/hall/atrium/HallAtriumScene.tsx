import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { hallWings, type HallWingId } from '../../../data/hall';
import { ATRIUM, ATRIUM_CAMERA, ATRIUM_LAYOUT } from './atriumTheme';
import MarbleFloor from './MarbleFloor';
import Dome from './Dome';
import ArchPortal from './ArchPortal';
import CentralPedestal from './CentralPedestal';
import type { PortalPortraitData } from './PortalPortrait';

/** N=silver, E=golden, S=soviet, W=modern — compass order around the rotunda. */
export const PORTAL_ORDER: HallWingId[] = ['silver', 'golden', 'soviet', 'modern'];

function portalAngle(index: number) {
  return (index / 4) * Math.PI * 2;
}

function CameraRig({
  enableDrift,
  focusWing,
}: {
  enableDrift: boolean;
  focusWing: HallWingId | null;
}) {
  const t = useRef(0);
  const target = useRef(new THREE.Vector3(0, 1.85, 0));
  const pos = useRef(new THREE.Vector3(...ATRIUM_CAMERA.position));

  useFrame((_, dt) => {
    t.current += dt * 0.07;

    let desired = new THREE.Vector3(...ATRIUM_CAMERA.position);
    let look = new THREE.Vector3(0, 1.85, 0);

    if (focusWing) {
      const idx = PORTAL_ORDER.indexOf(focusWing);
      if (idx >= 0) {
        const a = portalAngle(idx);
        const r = ATRIUM_LAYOUT.radius;
        desired = new THREE.Vector3(Math.sin(a) * r * 0.28, 1.68, Math.cos(a) * r * 0.28 + 5.2);
        // Blend rest position with approach so we never clip the wall
        desired.z = THREE.MathUtils.clamp(desired.z, 4.2, 7.4);
        look = new THREE.Vector3(Math.sin(a) * r * 0.9, 1.95, Math.cos(a) * r * 0.9);
      }
    } else if (enableDrift) {
      const a = t.current;
      desired = new THREE.Vector3(
        Math.sin(a) * 7.2 * 0.2,
        1.55 + Math.sin(a * 0.7) * 0.05,
        7.0 + Math.cos(a) * 0.32,
      );
    }

    pos.current.lerp(desired, 1 - Math.exp(-dt * 2.1));
    target.current.lerp(look, 1 - Math.exp(-dt * 2.3));
  });

  useFrame(({ camera }) => {
    camera.position.copy(pos.current);
    camera.lookAt(target.current);
  });

  return null;
}

function AtriumContent({
  enableDrift,
  focusWing,
  portraitsByWing,
  onFocusWing,
  onOpenPoet,
  onEnterWing,
}: {
  enableDrift: boolean;
  focusWing: HallWingId | null;
  portraitsByWing: Record<HallWingId, PortalPortraitData[]>;
  onFocusWing: (id: HallWingId | null) => void;
  onOpenPoet: (id: string) => void;
  onEnterWing: (id: HallWingId) => void;
}) {
  const wingById = useMemo(
    () => Object.fromEntries(hallWings.map((w) => [w.id, w])) as Record<string, (typeof hallWings)[0]>,
    [],
  );

  return (
    <>
      <color attach="background" args={[ATRIUM.bg]} />
      <fog attach="fog" args={[ATRIUM.fog, 14, 32]} />
      <ambientLight intensity={0.24} color="#f5e6c8" />
      <directionalLight
        castShadow
        position={[4, 10, 2]}
        intensity={1.2}
        color={ATRIUM.skylightWarm}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      <MarbleFloor />
      <Dome />
      <CentralPedestal />

      <mesh position={[0, ATRIUM_LAYOUT.wallHeight * 0.35, 0]}>
        <cylinderGeometry
          args={[
            ATRIUM_LAYOUT.radius + 0.18,
            ATRIUM_LAYOUT.radius + 0.18,
            ATRIUM_LAYOUT.wallHeight * 0.7,
            48,
            1,
            true,
          ]}
        />
        <meshStandardMaterial
          color={ATRIUM.stone}
          side={THREE.BackSide}
          roughness={0.78}
          metalness={0.04}
        />
      </mesh>

      {PORTAL_ORDER.map((_, i) => {
        const a = portalAngle(i) + Math.PI / 4;
        const r = ATRIUM_LAYOUT.radius + 0.05;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * r, ATRIUM_LAYOUT.wallHeight * 0.38, Math.cos(a) * r]}
            castShadow
          >
            <cylinderGeometry args={[0.22, 0.26, ATRIUM_LAYOUT.wallHeight * 0.75, 12]} />
            <meshStandardMaterial color={ATRIUM.stoneLight} roughness={0.6} metalness={0.08} />
          </mesh>
        );
      })}

      {PORTAL_ORDER.map((id, i) => {
        const wing = wingById[id];
        if (!wing) return null;
        return (
          <ArchPortal
            key={id}
            wing={wing}
            angle={portalAngle(i)}
            portraits={portraitsByWing[id] || []}
            focused={focusWing === id}
            onFocusWing={(wid) => onFocusWing(wid)}
            onOpenPoet={onOpenPoet}
            onEnterWing={onEnterWing}
          />
        );
      })}

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.48}
        scale={18}
        blur={2.2}
        far={8}
        color="#000000"
      />

      <Environment resolution={128} environmentIntensity={0.3}>
        <Lightformer
          intensity={1.9}
          color={ATRIUM.skylight}
          position={[0, 8, 0]}
          scale={[10, 2, 1]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Lightformer intensity={0.75} color={ATRIUM.goldSoft} position={[6, 2, 4]} scale={[5, 3, 1]} />
        <Lightformer intensity={0.55} color="#e8d5a8" position={[-6, 2, -3]} scale={[5, 3, 1]} />
      </Environment>

      <CameraRig enableDrift={enableDrift && !focusWing} focusWing={focusWing} />
    </>
  );
}

export interface HallAtriumSceneProps {
  enableDrift?: boolean;
  focusWing?: HallWingId | null;
  portraitsByWing: Record<HallWingId, PortalPortraitData[]>;
  onFocusWing: (id: HallWingId | null) => void;
  onOpenPoet: (id: string) => void;
  onEnterWing: (id: HallWingId) => void;
}

export default function HallAtriumScene({
  enableDrift = true,
  focusWing = null,
  portraitsByWing,
  onFocusWing,
  onOpenPoet,
  onEnterWing,
}: HallAtriumSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{
        fov: ATRIUM_CAMERA.fov,
        position: ATRIUM_CAMERA.position,
        near: ATRIUM_CAMERA.near,
        far: ATRIUM_CAMERA.far,
      }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      onPointerMissed={() => onFocusWing(null)}
      aria-label="Трёхмерный атриум Храма русской поэзии"
    >
      <Suspense fallback={null}>
        <AtriumContent
          enableDrift={enableDrift}
          focusWing={focusWing}
          portraitsByWing={portraitsByWing}
          onFocusWing={onFocusWing}
          onOpenPoet={onOpenPoet}
          onEnterWing={onEnterWing}
        />
      </Suspense>
    </Canvas>
  );
}
