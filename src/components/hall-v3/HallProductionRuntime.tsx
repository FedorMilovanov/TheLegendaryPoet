import { useEffect, useMemo, useRef, useState } from 'react';
import layouts from '../../../docs/hall-v3/greybox-layouts.json';
import cameraDecision from '../../../docs/hall-v3/camera-decision.json';
import materialDecision from '../../../docs/hall-v3/material-decision.json';

type Vec2 = [number, number];
type Vec3 = [number, number, number];
type WallSegment = [number, number, number, number];
type CameraWitness = { position: Vec3; target: Vec3; nextDestination: Vec3; note?: string };
type HallMode = 'loading' | 'webgl' | 'fallback';

type LayoutAuthority = {
  floorPolygon: Vec2[];
  walls: WallSegment[];
  route: Vec2[];
  cameras: Record<string, CameraWitness>;
  pushkin: {
    anchor: { center: Vec3; size: Vec3; rotationZ: number };
    documentCases: Array<{ name: string; center: Vec3; size: Vec3; rotationZ: number }>;
  };
};

const CAMERA_STOPS = ['entryReveal', 'orientation', 'firstTransition', 'pushkinApproach', 'pushkinViewing', 'reverseExit'] as const;

function asVec2(value: readonly number[], label: string): Vec2 {
  if (value.length !== 2 || value.some((entry) => !Number.isFinite(entry))) throw new Error(`${label} must contain two finite numbers`);
  return [value[0], value[1]];
}

function asVec3(value: readonly number[], label: string): Vec3 {
  if (value.length !== 3 || value.some((entry) => !Number.isFinite(entry))) throw new Error(`${label} must contain three finite numbers`);
  return [value[0], value[1], value[2]];
}

function asWall(value: readonly number[], label: string): WallSegment {
  if (value.length !== 4 || value.some((entry) => !Number.isFinite(entry))) throw new Error(`${label} must contain four finite numbers`);
  return [value[0], value[1], value[2], value[3]];
}

function readAuthority(): LayoutAuthority {
  const source = layouts.candidates.find((candidate) => candidate.id === 'H3');
  if (!source) throw new Error('H3 layout authority is missing');
  if (cameraDecision.selectedTopology !== 'H3' || cameraDecision.selectedRig !== 'R1' || cameraDecision.approvedCamera.rigId !== 'R1') {
    throw new Error('R1 camera authority is not selected for H3');
  }
  if (materialDecision.lightingDecision.selected !== 'L0-minimal-runtime' || materialDecision.uvDecision.surfaceMaterialUv !== 'UV0') {
    throw new Error('L0/UV0 material authority drifted');
  }

  const cameras: Record<string, CameraWitness> = {};
  for (const [name, camera] of Object.entries(source.cameras)) {
    cameras[name] = {
      position: asVec3(camera.position, `H3 camera ${name}.position`),
      target: asVec3(camera.target, `H3 camera ${name}.target`),
      nextDestination: asVec3(camera.nextDestination, `H3 camera ${name}.nextDestination`),
      note: camera.note,
    };
  }
  cameras.pushkinViewing = {
    position: asVec3(cameraDecision.approvedCamera.position, 'R1 approvedCamera.position'),
    target: asVec3(cameraDecision.approvedCamera.target, 'R1 approvedCamera.target'),
    nextDestination: asVec3(cameraDecision.approvedCamera.nextDestination, 'R1 approvedCamera.nextDestination'),
    note: 'R1 approved Pushkin viewing witness',
  };

  return {
    floorPolygon: source.floorPolygon.map((value, index) => asVec2(value, `H3 floorPolygon[${index}]`)),
    walls: source.walls.map((value, index) => asWall(value, `H3 walls[${index}]`)),
    route: source.route.map((value, index) => asVec2(value, `H3 route[${index}]`)),
    cameras,
    pushkin: {
      anchor: {
        center: asVec3(source.pushkin.anchor.center, 'H3 Pushkin anchor.center'),
        size: asVec3(source.pushkin.anchor.size, 'H3 Pushkin anchor.size'),
        rotationZ: source.pushkin.anchor.rotationZ,
      },
      documentCases: source.pushkin.documentCases.map((item, index) => ({
        name: item.name,
        center: asVec3(item.center, `H3 documentCases[${index}].center`),
        size: asVec3(item.size, `H3 documentCases[${index}].size`),
        rotationZ: item.rotationZ,
      })),
    },
  };
}

const authority = readAuthority();

export function HallProductionRuntime() {
  const hostRef = useRef<HTMLDivElement>(null);
  const stopIndexRef = useRef(0);
  const applyStopRef = useRef<(index: number) => void>(() => {});
  const [mode, setMode] = useState<HallMode>('loading');
  const [reason, setReason] = useState<string | null>(null);
  const [currentStop, setCurrentStop] = useState<(typeof CAMERA_STOPS)[number]>(CAMERA_STOPS[0]);
  const reducedMotion = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let animationFrame = 0;
    let cleanupRuntime = () => {};

    const fallback = (fallbackReason: string) => {
      if (disposed) return;
      cleanupRuntime();
      cleanupRuntime = () => {};
      if (animationFrame) cancelAnimationFrame(animationFrame);
      host.replaceChildren();
      setReason(fallbackReason);
      setMode('fallback');
    };

    const start = async () => {
      if (typeof WebGLRenderingContext === 'undefined') {
        fallback('webgl-unavailable');
        return;
      }

      const THREE = await import('three');
      if (disposed) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
      } catch {
        fallback('webgl-construction-failed');
        return;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = false;
      renderer.domElement.setAttribute('data-hall-production-canvas', 'true');
      renderer.domElement.setAttribute('aria-label', 'Трёхмерное пространство Зала Поэтов');
      renderer.domElement.setAttribute('role', 'img');
      host.replaceChildren(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x090909);
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);
      camera.setFocalLength(28);
      scene.add(new THREE.HemisphereLight(0xf4ead7, 0x151515, 1.35));
      scene.add(new THREE.AmbientLight(0xffffff, 0.28));

      const architectureMaterial = new THREE.MeshStandardMaterial({ color: 0x706b63, roughness: 0.86, metalness: 0 });
      const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x252321, roughness: 0.95, metalness: 0 });
      const exhibitMaterial = new THREE.MeshStandardMaterial({ color: 0x9b814d, roughness: 0.58, metalness: 0 });
      const caseMaterial = new THREE.MeshStandardMaterial({ color: 0x4b4438, roughness: 0.72, metalness: 0 });
      const routeMaterial = new THREE.LineBasicMaterial({ color: 0xb99a58, transparent: true, opacity: 0.45 });

      const mapPosition = ([x, y, z]: Vec3) => new THREE.Vector3(x, z, y);
      const mapPoint = ([x, y]: Vec2, height = 0) => new THREE.Vector3(x, height, y);

      const floorShape = new THREE.Shape();
      authority.floorPolygon.forEach(([x, y], index) => {
        if (index === 0) floorShape.moveTo(x, -y);
        else floorShape.lineTo(x, -y);
      });
      floorShape.closePath();
      const floor = new THREE.Mesh(new THREE.ShapeGeometry(floorShape), floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.name = 'H3_FLOOR';
      scene.add(floor);

      const wallHeight = 4.5;
      const wallThickness = 0.25;
      authority.walls.forEach(([x1, y1, x2, y2], index) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const wall = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(dx, dy), wallHeight, wallThickness), architectureMaterial);
        wall.position.set((x1 + x2) / 2, wallHeight / 2, (y1 + y2) / 2);
        wall.rotation.y = -Math.atan2(dy, dx);
        wall.name = `H3_WALL_${String(index + 1).padStart(2, '0')}`;
        scene.add(wall);
      });

      const route = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(authority.route.map((point) => mapPoint(point, 0.018))),
        routeMaterial,
      );
      route.name = 'H3_GUIDED_ROUTE';
      scene.add(route);

      const anchor = authority.pushkin.anchor;
      const anchorMesh = new THREE.Mesh(new THREE.BoxGeometry(anchor.size[0], anchor.size[2], anchor.size[1]), exhibitMaterial);
      anchorMesh.position.copy(mapPosition(anchor.center));
      anchorMesh.rotation.y = -anchor.rotationZ;
      anchorMesh.name = 'EXHIBIT_alexander-pushkin_NEUTRAL_PROXY';
      anchorMesh.userData.documentaryMedia = 'excluded';
      scene.add(anchorMesh);

      for (const item of authority.pushkin.documentCases) {
        const caseMesh = new THREE.Mesh(new THREE.BoxGeometry(item.size[0], item.size[2], item.size[1]), caseMaterial);
        caseMesh.position.copy(mapPosition(item.center));
        caseMesh.rotation.y = -item.rotationZ;
        caseMesh.name = `${item.name}_NEUTRAL_PROXY`;
        caseMesh.userData.documentaryMedia = 'excluded';
        scene.add(caseMesh);
      }

      let targetLookAt = mapPosition(authority.cameras[CAMERA_STOPS[0]].target);
      let transition: null | {
        start: number;
        duration: number;
        fromPosition: InstanceType<typeof THREE.Vector3>;
        toPosition: InstanceType<typeof THREE.Vector3>;
        fromTarget: InstanceType<typeof THREE.Vector3>;
        toTarget: InstanceType<typeof THREE.Vector3>;
      } = null;

      const applyStop = (index: number) => {
        const normalized = (index + CAMERA_STOPS.length) % CAMERA_STOPS.length;
        stopIndexRef.current = normalized;
        const name = CAMERA_STOPS[normalized];
        const witness = authority.cameras[name];
        if (!witness) return;
        const toPosition = mapPosition(witness.position);
        const toTarget = mapPosition(witness.target);
        setCurrentStop(name);
        if (reducedMotion) {
          transition = null;
          camera.position.copy(toPosition);
          targetLookAt.copy(toTarget);
          camera.lookAt(targetLookAt);
          return;
        }
        transition = {
          start: performance.now(),
          duration: 900,
          fromPosition: camera.position.clone(),
          toPosition,
          fromTarget: targetLookAt.clone(),
          toTarget,
        };
      };
      applyStopRef.current = applyStop;

      const initial = authority.cameras[CAMERA_STOPS[0]];
      camera.position.copy(mapPosition(initial.position));
      camera.lookAt(targetLookAt);

      const onResize = () => {
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const onContextLost = (event: Event) => {
        event.preventDefault();
        fallback('webgl-context-lost');
      };
      window.addEventListener('resize', onResize, { passive: true });
      renderer.domElement.addEventListener('webglcontextlost', onContextLost);
      cleanupRuntime = () => {
        window.removeEventListener('resize', onResize);
        renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      };
      onResize();

      let firstFrame = true;
      const frame = (now: number) => {
        if (disposed) return;
        if (transition) {
          const elapsed = Math.min(1, (now - transition.start) / transition.duration);
          const eased = 1 - Math.pow(1 - elapsed, 3);
          camera.position.lerpVectors(transition.fromPosition, transition.toPosition, eased);
          targetLookAt.lerpVectors(transition.fromTarget, transition.toTarget, eased);
          camera.lookAt(targetLookAt);
          if (elapsed >= 1) transition = null;
        }
        renderer.render(scene, camera);
        if (firstFrame) {
          firstFrame = false;
          setReason(null);
          setMode('webgl');
        }
        animationFrame = requestAnimationFrame(frame);
      };
      animationFrame = requestAnimationFrame(frame);

      cleanupRuntime = (() => {
        const previous = cleanupRuntime;
        return () => {
          previous();
          if (animationFrame) cancelAnimationFrame(animationFrame);
          scene.traverse((object) => {
            if (object instanceof THREE.Mesh || object instanceof THREE.Line) object.geometry?.dispose();
          });
          architectureMaterial.dispose();
          floorMaterial.dispose();
          exhibitMaterial.dispose();
          caseMaterial.dispose();
          routeMaterial.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      })();
    };

    void start().catch(() => fallback('runtime-initialization-failed'));
    return () => {
      disposed = true;
      cleanupRuntime();
      applyStopRef.current = () => {};
    };
  }, [reducedMotion]);

  const move = (delta: number) => applyStopRef.current(stopIndexRef.current + delta);

  return (
    <section className="relative min-h-[calc(100svh-5rem)] overflow-hidden bg-[#090909]" data-hall-production-mode={mode}>
      <div ref={hostRef} className="absolute inset-0" aria-hidden={mode !== 'webgl'} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(212,175,55,0.11),transparent_34%),linear-gradient(to_bottom,rgba(0,0,0,0.05),rgba(0,0,0,0.72))]" aria-hidden="true" />

      <div className="relative z-10 flex min-h-[calc(100svh-5rem)] flex-col justify-between p-5 md:p-8">
        <div className="max-w-xl rounded-2xl border border-white/10 bg-black/55 p-5 backdrop-blur-md md:p-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.32em] text-luxury-gold">Hall v3 · H3 / R1 / L0 / UV0</p>
          <h1 className="font-serif text-3xl font-bold text-white md:text-5xl">Зал Поэтов</h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70 md:text-base">
            Пространство первого музейного среза работает прямо в браузере. Исторические изображения пока не подменяются: на их местах стоят нейтральные экспозиционные объекты до окончательного решения по источникам и атрибуции.
          </p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md rounded-2xl border border-white/10 bg-black/60 p-4 text-sm text-white/75 backdrop-blur-md">
            {mode === 'fallback' ? (
              <>
                <p className="font-semibold text-white">Доступная версия зала</p>
                <p className="mt-1">3D недоступен ({reason ?? 'unknown'}). Маршрут сохранён текстово: вход → ориентация → переход → подход к Пушкину → просмотр → выход.</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-white">Точка маршрута: {currentStop}</p>
                <p className="mt-1">Управление намеренно экскурсионное — без свободного FPS-перемещения.</p>
              </>
            )}
            <p className="sr-only" aria-live="polite">{mode === 'fallback' ? `3D недоступен: ${reason ?? 'unknown'}` : `Текущая точка маршрута: ${currentStop}`}</p>
          </div>

          {mode !== 'fallback' && (
            <div className="flex gap-2" aria-label="Навигация по залу">
              <button type="button" onClick={() => move(-1)} className="rounded-full border border-white/20 bg-black/60 px-5 py-3 text-sm font-semibold text-white transition hover:border-luxury-gold/60 hover:text-luxury-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-luxury-gold">
                Назад
              </button>
              <button type="button" onClick={() => move(1)} className="rounded-full bg-luxury-gold px-5 py-3 text-sm font-bold text-[#090909] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Дальше
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
