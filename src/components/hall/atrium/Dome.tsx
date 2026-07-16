import * as THREE from 'three';
import { ATRIUM, ATRIUM_LAYOUT } from './atriumTheme';

/**
 * Coffered glass dome approximation: warm hemisphere shell + skylight +
 * radial gold ribs. Spirit of the temple reference, not a photoreal scan.
 */
export default function Dome() {
  const R = ATRIUM_LAYOUT.domeRadius;
  const ribs = 12;

  return (
    <group position={[0, ATRIUM_LAYOUT.wallHeight * 0.12, 0]}>
      {/* Outer warm stone shell (inner face visible from below) */}
      <mesh>
        <sphereGeometry args={[R, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={ATRIUM.stone}
          side={THREE.BackSide}
          metalness={0.08}
          roughness={0.72}
        />
      </mesh>

      {/* Soft skylight wash */}
      <mesh position={[0, R * 0.12, 0]}>
        <sphereGeometry args={[R * 0.9, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
        <meshStandardMaterial
          color={ATRIUM.skylight}
          emissive={ATRIUM.skylightWarm}
          emissiveIntensity={0.5}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Meridian ribs */}
      {Array.from({ length: ribs }).map((_, i) => {
        const a = (i / ribs) * Math.PI * 2;
        return (
          <mesh key={i} rotation={[0, a, 0]} position={[0, 0, 0]}>
            {/* Thin band along the inner dome */}
            <sphereGeometry
              args={[R * 0.965, 8, 24, -0.03, 0.06, 0, Math.PI / 2]}
            />
            <meshStandardMaterial
              color={ATRIUM.goldSoft}
              metalness={0.8}
              roughness={0.32}
              emissive={ATRIUM.goldDim}
              emissiveIntensity={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* Horizontal coffer rings */}
      {[0.32, 0.52, 0.72].map((t) => {
        const elev = (1 - t) * (Math.PI / 2);
        const y = Math.sin(elev) * R * 0.9;
        const rr = Math.cos(elev) * R * 0.9;
        return (
          <mesh key={t} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[Math.max(rr, 0.2), 0.02, 8, 64]} />
            <meshStandardMaterial
              color={ATRIUM.goldDim}
              metalness={0.75}
              roughness={0.4}
            />
          </mesh>
        );
      })}

      <pointLight
        position={[0, R * 0.82, 0]}
        intensity={26}
        distance={20}
        decay={2}
        color={ATRIUM.skylightWarm}
      />
    </group>
  );
}
