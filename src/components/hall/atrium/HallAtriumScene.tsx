import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { hallWings } from '../../../data/hall';
import { ATRIUM, ATRIUM_CAMERA, ATRIUM_LAYOUT } from './atriumTheme';
import MarbleFloor from './MarbleFloor';
import Dome from './Dome';
import ArchPortal from './ArchPortal';

/**
 * Gentle museum gaze — slow orbit unless reduced-motion (parent gates that).
 */
function CameraRig({ enableDrift }: { enableDrift: boolean }) {
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!enableDrift) return;
    t.current += dt * 0.08;
  });
  useFrame(({ camera }) => {
    if (!enableDrift) {
      camera.position.set(...ATRIUM_CAMERA.position);
      camera.lookAt(0, 1.8, 0);
      return;
    }
    const a = t.current;
    const r = 7.2;
    camera.position.x = Math.sin(a) * r * 0.22;
    camera.position.z = 7.0 + Math.cos(a) * 0.35;
    camera.position.y = 1.55 + Math.sin(a * 0.7) * 0.06;
    camera.lookAt(0, 1.85, 0);
  });
  return null;
}

function AtriumContent({ enableDrift }: { enableDrift: boolean }) {
  // Four portals: N=silver, E=golden, S=soviet, W=modern — matches compass spirit
  const order = ['silver', 'golden', 'soviet', 'modern'] as const;
  const wingById = Object.fromEntries(hallWings.map((w) => [w.id, w]));

  return (
    <>
      <color attach="background" args={[ATRIUM.bg]} />
      <fog attach="fog" args={[ATRIUM.fog, 12, 28]} />
      <ambientLight intensity={0.22} color="#f5e6c8" />
      <directionalLight
        castShadow
        position={[4, 10, 2]}
        intensity={1.15}
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

      {/* Low rotunda wall ring between arches */}
      <mesh position={[0, ATRIUM_LAYOUT.wallHeight * 0.35, 0]}>
        <cylinderGeometry
          args={[
            ATRIUM_LAYOUT.radius + 0.15,
            ATRIUM_LAYOUT.radius + 0.15,
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

      {order.map((id, i) => {
        const wing = wingById[id];
        if (!wing) return null;
        const angle = (i / 4) * Math.PI * 2;
        return <ArchPortal key={id} wing={wing} angle={angle} />;
      })}

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.45}
        scale={18}
        blur={2.2}
        far={8}
        color="#000000"
      />

      <Environment resolution={128} environmentIntensity={0.28}>
        <Lightformer
          intensity={1.8}
          color={ATRIUM.skylight}
          position={[0, 8, 0]}
          scale={[10, 2, 1]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Lightformer
          intensity={0.7}
          color={ATRIUM.goldSoft}
          position={[6, 2, 4]}
          scale={[5, 3, 1]}
        />
        <Lightformer
          intensity={0.55}
          color="#e8d5a8"
          position={[-6, 2, -3]}
          scale={[5, 3, 1]}
        />
      </Environment>

      <CameraRig enableDrift={enableDrift} />
    </>
  );
}

export interface HallAtriumSceneProps {
  enableDrift?: boolean;
}

/**
 * R3F Canvas for the warm pantheon atrium (Pass 3).
 * Loaded only via lazy() from HallAtriumStage — never on the homepage shell.
 */
export default function HallAtriumScene({ enableDrift = true }: HallAtriumSceneProps) {
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
      aria-label="Трёхмерный атриум Храма русской поэзии"
    >
      <Suspense fallback={null}>
        <AtriumContent enableDrift={enableDrift} />
      </Suspense>
    </Canvas>
  );
}
