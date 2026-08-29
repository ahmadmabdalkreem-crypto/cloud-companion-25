import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { drawFace, type FaceId } from "@/lib/watch-face";
import { useWatchScreen } from "@/lib/watch-screen";
import type { SizeId, StrapMaterialId } from "@/lib/watch-config";

export type StrapMaterial = StrapMaterialId | "metal";

export type Watch3DProps = {
  /** Live screen interface. */
  face: FaceId;
  material: StrapMaterial;
  strapHex: string;
  caseHex: string;
  caseFinish: "gloss" | "matte";
  size: SizeId;
  /** Slow showroom spin. */
  autoRotate?: boolean;
  /** Target Y rotation in radians when autoRotate is off. */
  spin?: number;
};


const MATERIAL_PROPS: Record<StrapMaterial, { roughness: number; metalness: number }> = {
  silicone: { roughness: 0.88, metalness: 0.02 },
  leather: { roughness: 0.7, metalness: 0.04 },
  metal: { roughness: 0.24, metalness: 1 },
};

/** جهاز ضعيف؟ نخفّض الدقّة ومعدّل الرسم للحفاظ على سلاسة الانتقالات. */
function useDeviceTier() {
  return useMemo(() => {
    if (typeof window === "undefined") return { low: false, reduced: false };
    const cores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency ?? 8;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    return { low: cores <= 4 || mem <= 4, reduced };
  }, []);
}

function useFaceTexture(face: FaceId) {
  const { screen } = useWatchScreen();
  const { low, reduced } = useDeviceTier();
  const fade = useRef(0);
  const acc = useRef(0);
  // إعادة الانتقال الناعم عند التحميل وعند تبديل الواجهة أو النمط
  useEffect(() => {
    fade.current = 0;
  }, [face, screen.themeId, screen.accentHex]);

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = low ? 512 : 1024;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = low ? 2 : 8;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    return tex;
  }, [low]);

  useEffect(() => () => texture.dispose(), [texture]);

  // رسم مُقيَّد بمعدّل إطارات ثابت بدل كل إطار WebGL
  const interval = reduced ? 1 / 6 : low ? 1 / 15 : 1 / 30;

  useFrame((_, delta) => {
    acc.current += delta;
    if (acc.current < interval) return;
    const step = acc.current;
    acc.current = 0;
    const ctx = (texture.image as HTMLCanvasElement).getContext("2d", {
      willReadFrequently: true,
    });
    if (!ctx) return;
    fade.current = Math.min(1, fade.current + step * 2.2);
    drawFace(ctx, face, new Date(), { screen, fade: fade.current });
    texture.needsUpdate = true;
  });

  return texture;
}



function WatchModel({
  face,
  material,
  strapHex,
  caseHex,
  caseFinish,
  size,
  autoRotate = false,
  spin = 0,
}: Watch3DProps) {
  const crownRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const texture = useFaceTexture(face);
  const { screen } = useWatchScreen();
  const screenBrightness = screen.brightness;
  const caseTarget = useMemo(() => new THREE.Color(caseHex), [caseHex]);
  const strapTarget = useMemo(() => new THREE.Color(strapHex), [strapHex]);
  const m = MATERIAL_PROPS[material];
  const targetScale = size === 46 ? 1 : 0.9;

  // انتقال ناعم عند أول تحميل
  useEffect(() => {
    groupRef.current?.scale.setScalar(0.55);
  }, []);

  useFrame((_, delta) => {
    // ease case + strap tints together (well under 0.3s)
    const t = 1 - Math.exp(-22 * delta);
    groupRef.current?.traverse((o) => {
      const mesh = o as THREE.Mesh;
      const tint = mesh.userData?.["tint"] as string | undefined;
      if (!tint) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.color.lerp(tint === "case" ? caseTarget : strapTarget, t);
    });
    
    if (groupRef.current) {
      const t = 1 - Math.exp(-14 * delta);
      const s = groupRef.current.scale.x + (targetScale - groupRef.current.scale.x) * t;
      groupRef.current.scale.setScalar(s);
      groupRef.current.rotation.y = 0;
    }
  });


  return (
    <group ref={groupRef} rotation-x={Math.PI / 2 - 0.06}>
      {/* outer case body */}
      <mesh castShadow receiveShadow userData={{ tint: "case" }}>
        <cylinderGeometry args={[1.02, 0.98, 0.32, 128]} />
        <meshPhysicalMaterial
          color={caseHex}
          metalness={caseFinish === "gloss" ? 0.95 : 0.55}
          roughness={caseFinish === "gloss" ? 0.14 : 0.55}
          clearcoat={caseFinish === "gloss" ? 0.8 : 0.15}
          clearcoatRoughness={0.12}
        />
      </mesh>
      {/* brushed mid-ring */}
      <mesh position-y={0.02} userData={{ tint: "case" }}>
        <cylinderGeometry args={[1.03, 1.03, 0.06, 128]} />
        <meshStandardMaterial color={caseHex} metalness={1} roughness={0.42} />
      </mesh>
      {/* raised screen bezel */}
      <mesh position-y={0.163} castShadow>
        <cylinderGeometry args={[0.99, 0.99, 0.05, 128]} />
        <meshStandardMaterial color="#0d1114" metalness={0.5} roughness={0.55} />
      </mesh>
      {/* recessed screen well */}
      <mesh position-y={0.19} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.9, 0.965, 96]} />
        <meshStandardMaterial color="#050708" metalness={0.2} roughness={0.9} />
      </mesh>
      {/* digital display */}
      <mesh position-y={0.196} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.9, 96]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.22}
          metalness={0}
          toneMapped={false}
          emissive="#ffffff"
          emissiveMap={texture}
          emissiveIntensity={0.35 + screenBrightness * 0.45}
        />
      </mesh>
      {/* sapphire glass reflection (kept subtle so the screen stays readable) */}
      <mesh position-y={0.215} rotation-x={-Math.PI / 2} renderOrder={2}>
        <circleGeometry args={[0.94, 96]} />
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.04}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.02}
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>

      {/* rotating crown with grip */}
      <mesh
        ref={crownRef}
        position={[1.05, 0.05, 0.22]}
        rotation-z={Math.PI / 2}
        castShadow
        userData={{ tint: "case" }}
      >
        <cylinderGeometry args={[0.095, 0.095, 0.13, 32]} />
        <meshStandardMaterial color={caseHex} metalness={0.98} roughness={0.24} />
      </mesh>
      <mesh position={[1.11, 0.05, 0.22]} rotation-z={Math.PI / 2} userData={{ tint: "case" }}>
        <cylinderGeometry args={[0.088, 0.088, 0.03, 32]} />
        <meshStandardMaterial color={caseHex} metalness={1} roughness={0.5} />
      </mesh>
      {/* side action button */}
      <mesh
        position={[1.04, 0.0, -0.28]}
        rotation-z={Math.PI / 2}
        castShadow
        userData={{ tint: "case" }}
      >
        <boxGeometry args={[0.06, 0.12, 0.28]} />
        <meshStandardMaterial color={caseHex} metalness={0.9} roughness={0.32} />
      </mesh>
      {/* speaker grille (opposite side) */}
      <mesh position={[-1.03, 0, 0]} rotation-z={Math.PI / 2}>
        <boxGeometry args={[0.02, 0.06, 0.5]} />
        <meshStandardMaterial color="#0a0c0d" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* strap: lug + tapered band per side */}
      {[1, -1].map((dir) => (
        <group key={dir}>
          {/* lug connector */}
          <mesh position={[0, 0.02, dir * 0.7]} userData={{ tint: "case" }}>
            <boxGeometry args={[0.86, 0.14, 0.18]} />
            <meshStandardMaterial color={caseHex} metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh
            position={[0, -0.02, dir * 0.9]}
            castShadow
            receiveShadow
            userData={{ tint: "strap" }}
          >
            <boxGeometry args={[0.78, 0.14, 0.5]} />
            <meshStandardMaterial
              color={strapHex}
              roughness={m.roughness}
              metalness={m.metalness}
            />
          </mesh>
          <mesh
            position={[0, -0.3, dir * 1.6]}
            rotation-x={dir * 0.42}
            castShadow
            receiveShadow
            userData={{ tint: "strap" }}
          >
            <boxGeometry args={[0.66, 0.1, 1.1]} />
            <meshStandardMaterial
              color={strapHex}
              roughness={m.roughness}
              metalness={m.metalness}
            />
          </mesh>
          {/* silicone sport perforations */}
          {material === "silicone" &&
            [-0.16, 0.16].map((off) =>
              [0, 1, 2].map((i) => (
                <mesh
                  key={`${off}-${i}`}
                  position={[off, -0.26 - i * 0.09, dir * (1.28 + i * 0.3)]}
                  rotation-x={dir * 0.42}
                >
                  <cylinderGeometry args={[0.032, 0.032, 0.12, 16]} />
                  <meshStandardMaterial color="#080a0b" roughness={0.95} metalness={0} />
                </mesh>
              )),
            )}
          {/* leather stitching hint */}
          {material === "leather" &&
            [-0.24, 0.24].map((off) => (
              <mesh
                key={off}
                position={[off, -0.24, dir * 1.6]}
                rotation-x={dir * 0.42}
              >
                <boxGeometry args={[0.015, 0.02, 1]} />
                <meshStandardMaterial color="#e6dcc8" roughness={0.9} metalness={0} />
              </mesh>
            ))}
        </group>
      ))}
    </group>
  );
}

/** Gold key light that follows the pointer. */
function PointerLight() {
  const ref = useRef<THREE.PointLight>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = 1 - Math.exp(-6 * delta);
    ref.current.position.x += (state.pointer.x * 5 - ref.current.position.x) * t;
    ref.current.position.y += (state.pointer.y * 3 + 3 - ref.current.position.y) * t;
  });
  return <pointLight ref={ref} position={[0, 3, 4]} intensity={26} color="#ffd27a" castShadow />;
}

export function Watch3D(props: Watch3DProps) {
  const { low } = useDeviceTier();
  return (
    <Canvas
      shadows={!low}
      dpr={low ? 1 : [1, 1.75]}
      camera={{ position: [0, 0.35, 5.2], fov: 38 }}
      gl={{ antialias: !low, toneMappingExposure: 1.05, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none", touchAction: "none" }}
    >

      <color attach="background" args={["#f6f1e6"]} />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[3, 6, 5]}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} color="#cfe6ff" />
      <PointerLight />
      <Environment>
        <Lightformer intensity={2.4} position={[0, 4, 3]} scale={[9, 9, 1]} />
        <Lightformer
          intensity={1.2}
          color="#fff3dc"
          position={[-4, 1, -2]}
          rotation-y={Math.PI / 2}
          scale={[12, 2, 1]}
        />
        <Lightformer
          intensity={0.9}
          color="#ffffff"
          position={[4, 2, 2]}
          rotation-y={-Math.PI / 2}
          scale={[8, 3, 1]}
        />
      </Environment>
      <WatchModel {...props} />
      <ContactShadows position={[0, -1.15, 0]} opacity={0.35} blur={2.6} scale={9} far={4} />
    </Canvas>
  );
}

