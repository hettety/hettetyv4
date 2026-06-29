/**
 * Property3DViewer — a holographic "display unit" that showcases a property's
 * photos one at a time as a levitating, neon-framed specimen above a matte hex
 * pedestal on a polished reflective floor. The camera idly auto-orbits the
 * pedestal; the visitor can drag to look around, hover to brighten the neon,
 * and switch photos via the side catalog, the arrow controls, number keys or by
 * clicking the specimen. Used by the standalone 3D tour page, the property modal
 * and the AI assistant (when a user asks to "see the apartment in 3D").
 *
 * Note: the glow is faked with emissive / additive materials + toneMapped={false}
 * neon rather than a real bloom pass (no @react-three/postprocessing dependency).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, MeshReflectorMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { X, ChevronLeft, ChevronRight, Box, RotateCcw } from 'lucide-react';

// Neon palette — the app's logo orange on near-black navy (brand-950).
const ACCENT_BASE = new THREE.Color('#e67e22');
const ACCENT_HOVER = new THREE.Color('#ffb066');
const BG = '#06080f';

const SPECIMEN_HEIGHT = 2.3;   // tall side of the levitating photo
const SPECIMEN_Y = 2.05;       // float height above the floor
const PEDESTAL_R = 1.7;

/** Loads a texture imperatively so a failed image degrades to a placeholder instead of crashing the canvas. */
function useImageTexture(url: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [aspect, setAspect] = useState(1.5);

  useEffect(() => {
    let disposed = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        if (disposed) { tex.dispose(); return; }
        tex.colorSpace = THREE.SRGBColorSpace;
        if (tex.image?.width && tex.image?.height) {
          setAspect(tex.image.width / tex.image.height);
        }
        setTexture(tex);
      },
      undefined,
      () => { /* keep placeholder panel on load error */ }
    );
    return () => {
      disposed = true;
      setTexture((prev) => { prev?.dispose(); return null; });
    };
  }, [url]);

  return { texture, aspect };
}

/** Soft radial sprite used to fake a bloom halo behind the specimen. */
function makeGlowTexture() {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Drives the shared neon colour (base ⟷ hover) every frame so all neon parts stay in sync. */
const NeonDriver = ({ hovered, accentRef }: { hovered: boolean; accentRef: React.MutableRefObject<THREE.Color> }) => {
  useFrame(() => {
    accentRef.current.lerp(hovered ? ACCENT_HOVER : ACCENT_BASE, 0.08);
  });
  return null;
};

/** Concentric rings + radial spokes etched into the floor (display-area markings). */
const RadialGrid = ({ radius, accentRef }: { radius: number; accentRef: React.MutableRefObject<THREE.Color> }) => {
  const geo = useMemo(() => {
    const pts: number[] = [];
    // rings
    for (let r = 2.4; r <= radius; r += 1.8) {
      const seg = 96;
      for (let i = 0; i < seg; i++) {
        const a0 = (i / seg) * Math.PI * 2;
        const a1 = ((i + 1) / seg) * Math.PI * 2;
        pts.push(Math.cos(a0) * r, 0, Math.sin(a0) * r, Math.cos(a1) * r, 0, Math.sin(a1) * r);
      }
    }
    // spokes
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      pts.push(Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2, Math.cos(a) * radius, 0, Math.sin(a) * radius);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [radius]);

  const mat = useMemo(() => new THREE.LineBasicMaterial({ transparent: true, opacity: 0.16, toneMapped: false }), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  useFrame(() => { mat.color.copy(accentRef.current); });

  return <lineSegments geometry={geo} material={mat} position={[0, 0.012, 0]} />;
};

/** Polished reflective floor + radial grid + an expanding scan-ring pulse. */
const Floor = ({ radius, accentRef }: { radius: number; accentRef: React.MutableRefObject<THREE.Color> }) => {
  const scanRef = useRef<THREE.Mesh>(null);
  const scanMat = useMemo(
    () => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    []
  );
  useEffect(() => () => scanMat.dispose(), [scanMat]);

  useFrame((state) => {
    scanMat.color.copy(accentRef.current);
    const t = (state.clock.elapsedTime % 3.6) / 3.6;
    if (scanRef.current) {
      const s = 0.4 + t * (radius + 2);
      scanRef.current.scale.set(s, s, s);
      scanMat.opacity = (1 - t) * 0.4;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[radius + 4, 96]} />
        <MeshReflectorMaterial
          resolution={1024}
          blur={[400, 120]}
          mixBlur={1}
          mixStrength={36}
          roughness={0.85}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0a0d15"
          metalness={0.65}
        />
      </mesh>
      <RadialGrid radius={radius} accentRef={accentRef} />
      <mesh ref={scanRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={scanMat}>
        <ringGeometry args={[0.4, 0.46, 64]} />
      </mesh>
    </group>
  );
};

/** Matte black hex pedestal with neon accent rings, perimeter glow strip and a volumetric beam. */
const Pedestal = ({ accentRef }: { accentRef: React.MutableRefObject<THREE.Color> }) => {
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0.9, toneMapped: false }), []);
  const innerRingMat = useMemo(() => new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0.5, toneMapped: false }), []);
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0.55, toneMapped: false }), []);

  const beamUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uColor: { value: ACCENT_BASE.clone() } }),
    []
  );

  useEffect(() => () => { ringMat.dispose(); innerRingMat.dispose(); glowMat.dispose(); }, [ringMat, innerRingMat, glowMat]);

  useFrame((state) => {
    ringMat.color.copy(accentRef.current);
    innerRingMat.color.copy(accentRef.current);
    glowMat.color.copy(accentRef.current);
    beamUniforms.uTime.value = state.clock.elapsedTime;
    beamUniforms.uColor.value.copy(accentRef.current);
  });

  return (
    <group>
      {/* hex base */}
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[PEDESTAL_R * 0.92, PEDESTAL_R, 0.32, 6, 1]} />
        <meshStandardMaterial color="#06070a" roughness={0.6} metalness={0.55} />
      </mesh>
      {/* polished top inset */}
      <mesh position={[0, 0.328, 0]}>
        <cylinderGeometry args={[PEDESTAL_R * 0.72, PEDESTAL_R * 0.72, 0.025, 6]} />
        <meshStandardMaterial color="#0a0c12" roughness={0.25} metalness={0.85} />
      </mesh>
      {/* accent rings on top */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.343, 0]} material={ringMat}>
        <ringGeometry args={[PEDESTAL_R * 0.78, PEDESTAL_R * 0.82, 6]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.344, 0]} material={innerRingMat}>
        <ringGeometry args={[PEDESTAL_R * 0.4, PEDESTAL_R * 0.42, 6]} />
      </mesh>
      {/* perimeter glow strip */}
      <mesh position={[0, 0.16, 0]} material={glowMat}>
        <cylinderGeometry args={[PEDESTAL_R * 1.004, PEDESTAL_R * 1.004, 0.05, 6, 1, true]} />
      </mesh>
      {/* volumetric beam rising to the specimen */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.06, 1.4, 3.4, 36, 1, true]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          uniforms={beamUniforms}
          vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
          fragmentShader={`
            uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
            void main(){
              float vert = smoothstep(0.0,0.4,vUv.y) * (1.0 - smoothstep(0.55,1.0,vUv.y));
              float pulse = 0.7 + 0.3 * sin(uTime*2.0 + vUv.y*8.0);
              gl_FragColor = vec4(uColor*0.85, vert*pulse*0.16);
            }
          `}
        />
      </mesh>
    </group>
  );
};

/** The levitating, neon-framed photo. Bobs, scales in on swap and brightens on hover. */
const Specimen = ({
  url,
  swapKey,
  accentRef,
  hovered,
  onPointerOver,
  onPointerOut,
  onClick,
}: {
  url: string;
  swapKey: number;
  accentRef: React.MutableRefObject<THREE.Color>;
  hovered: boolean;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onClick: () => void;
}) => {
  const { texture, aspect } = useImageTexture(url);
  const groupRef = useRef<THREE.Group>(null);
  const appearRef = useRef(0);

  const width = SPECIMEN_HEIGHT * Math.min(Math.max(aspect, 0.6), 2.0);
  const w = width + 0.16;
  const h = SPECIMEN_HEIGHT + 0.16;

  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, 0.3)), [w, h]);
  const edgeMat = useMemo(() => new THREE.LineBasicMaterial({ transparent: true, opacity: 0.95, toneMapped: false }), []);
  const cornerMat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  const glowTex = useMemo(() => makeGlowTexture(), []);
  const glowMat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    [glowTex]
  );

  // Restart the scale-in whenever the displayed photo changes.
  useEffect(() => { appearRef.current = 0; }, [swapKey]);

  useEffect(() => () => {
    edgeGeo.dispose(); edgeMat.dispose(); cornerMat.dispose(); glowMat.dispose(); glowTex.dispose();
  }, [edgeGeo, edgeMat, cornerMat, glowMat, glowTex]);

  const corners = useMemo(() => {
    const hw = w / 2, hh = h / 2, hd = 0.15;
    const out: [number, number, number][] = [];
    for (const x of [-hw, hw]) for (const y of [-hh, hh]) for (const z of [-hd, hd]) out.push([x, y, z]);
    return out;
  }, [w, h]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    edgeMat.color.copy(accentRef.current);
    cornerMat.color.copy(accentRef.current);
    glowMat.color.copy(accentRef.current);
    edgeMat.opacity = hovered ? 1 : 0.85 + Math.sin(t * 1.5) * 0.1;
    glowMat.opacity = hovered ? 0.85 : 0.5 + Math.sin(t * 1.5) * 0.08;

    if (groupRef.current) {
      // ease-out-quart scale-in
      appearRef.current = Math.min(1, appearRef.current + 0.03);
      const ease = 1 - Math.pow(1 - appearRef.current, 4);
      groupRef.current.scale.setScalar(ease);
      // levitation bob + gentle oscillating tilt (so the photo stays readable)
      groupRef.current.position.y = SPECIMEN_Y + Math.sin(t * 0.8) * 0.06;
      const sway = hovered ? 0.16 : 0.09;
      groupRef.current.rotation.y = Math.sin(t * 0.5) * sway;
      groupRef.current.rotation.z = Math.sin(t * 0.6 + 1) * 0.02;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0, SPECIMEN_Y, 0]}
      onPointerOver={(e) => { e.stopPropagation(); onPointerOver(); }}
      onPointerOut={(e) => { e.stopPropagation(); onPointerOut(); }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {/* glow halo behind the photo (fake bloom) */}
      <mesh position={[0, 0, -0.2]} material={glowMat}>
        <planeGeometry args={[w * 1.7, h * 1.7]} />
      </mesh>
      {/* backing panel */}
      <mesh position={[0, 0, -0.16]}>
        <boxGeometry args={[w, h, 0.12]} />
        <meshStandardMaterial color="#0b0e16" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* the photo */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[width, SPECIMEN_HEIGHT]} />
        {texture
          ? <meshBasicMaterial map={texture} toneMapped={false} />
          : <meshStandardMaterial color="#1e293b" />}
      </mesh>
      {/* neon edges */}
      <lineSegments geometry={edgeGeo} material={edgeMat} />
      {/* corner nodes */}
      {corners.map((p, i) => (
        <mesh key={i} position={p} material={cornerMat}>
          <sphereGeometry args={[0.035, 12, 12]} />
        </mesh>
      ))}
    </group>
  );
};

const Lights = () => (
  <>
    <ambientLight intensity={0.4} color="#2a2c34" />
    <spotLight position={[0, 9, 0]} angle={Math.PI / 5} penumbra={0.6} intensity={120} distance={20} color="#fff0d8" />
    <directionalLight position={[-3, 1.5, -4]} intensity={0.5} color="#e67e22" />
    <directionalLight position={[4, 2, 5]} intensity={0.4} color="#4a5060" />
    <pointLight position={[0, SPECIMEN_Y, 0]} intensity={6} distance={6} color="#e67e22" />
  </>
);

/** OrbitControls that idle-auto-rotate and pause for a few seconds after the user interacts. */
const Rig = ({ controlsRef, onAutoChange }: { controlsRef: React.MutableRefObject<any>; onAutoChange: (auto: boolean) => void }) => {
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    let timer: any;
    const onStart = () => { controls.autoRotate = false; onAutoChange(false); clearTimeout(timer); };
    const onEnd = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { controls.autoRotate = true; onAutoChange(true); }, 4000);
    };
    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);
    return () => {
      clearTimeout(timer);
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
    };
  }, [controlsRef, onAutoChange]);

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0, 1.9, 0]}
      enablePan={false}
      enableZoom
      minDistance={3.5}
      maxDistance={13}
      maxPolarAngle={Math.PI / 2 - 0.05}
      enableDamping
      dampingFactor={0.06}
      autoRotate
      autoRotateSpeed={0.4}
    />
  );
};

export interface Property3DViewerProps {
  images: string[];
  title?: string;
  onClose: () => void;
  isRtl?: boolean;
}

const Property3DViewer: React.FC<Property3DViewerProps> = ({ images, title, onClose, isRtl }) => {
  const validImages = useMemo(() => images.filter(Boolean), [images]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [orbitAuto, setOrbitAuto] = useState(true);
  const controlsRef = useRef<any>(null);
  const accentRef = useRef<THREE.Color>(ACCENT_BASE.clone());

  // Keep the focused index in range if the image set shrinks.
  useEffect(() => {
    setFocusedIndex((i) => (validImages.length ? Math.min(i, validImages.length - 1) : 0));
  }, [validImages.length]);

  const next = () => setFocusedIndex((i) => (i + 1) % validImages.length);
  const prev = () => setFocusedIndex((i) => (i === 0 ? validImages.length - 1 : i - 1));

  // Keyboard navigation + Escape to close + number keys for direct select.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else {
        const n = parseInt(e.key, 10);
        if (!Number.isNaN(n) && n >= 1 && n <= validImages.length) setFocusedIndex(n - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [validImages.length, onClose]);

  if (validImages.length === 0) {
    return (
      <div className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center text-center p-6">
        <Box className="w-16 h-16 text-accent-500 mb-4 opacity-50" />
        <p className="text-slate-300 mb-6">{isRtl ? 'لا توجد صور متاحة لهذا العقار لعرضها بتقنية ثلاثية الأبعاد.' : 'No images are available for this property to display in 3D.'}</p>
        <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full border border-white/20 transition-colors cursor-pointer">
          {isRtl ? 'رجوع' : 'Back'}
        </button>
      </div>
    );
  }

  const code = `#${String(focusedIndex + 1).padStart(3, '0')}`;

  return (
    <div className={`fixed inset-0 z-[70] overflow-hidden animate-fade-in font-mono ${hovered ? 'hovering' : ''}`} dir="ltr" style={{ background: BG }}>
      {/* 3D Scene */}
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true }}
        camera={{ position: [4.8, 2.8, 5.4], fov: 42 }}
        onCreated={({ gl }) => { gl.toneMappingExposure = 1.1; }}
      >
        <color attach="background" args={[BG]} />
        <fogExp2 attach="fog" args={[BG, 0.045]} />

        <NeonDriver hovered={hovered} accentRef={accentRef} />
        <Lights />
        <Floor radius={9} accentRef={accentRef} />
        <Pedestal accentRef={accentRef} />
        <Specimen
          url={validImages[focusedIndex]}
          swapKey={focusedIndex}
          accentRef={accentRef}
          hovered={hovered}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={next}
        />
        <Sparkles count={120} scale={[16, 9, 16]} position={[0, 4.5, 0]} size={2.4} speed={0.3} opacity={0.5} color="#e67e22" />

        <Rig controlsRef={controlsRef} onAutoChange={setOrbitAuto} />
      </Canvas>

      {/* ===== HUD overlay ===== */}
      <div className="pointer-events-none absolute inset-0 select-none">
        {/* corner brackets */}
        <span className="absolute top-5 left-5 w-6 h-6 border-t border-l border-accent-500/60" />
        <span className="absolute top-5 right-5 w-6 h-6 border-t border-r border-accent-500/60" />
        <span className="absolute bottom-5 left-5 w-6 h-6 border-b border-l border-accent-500/60" />
        <span className="absolute bottom-5 right-5 w-6 h-6 border-b border-r border-accent-500/60" />

        {/* top bar: brand + status */}
        <div className="absolute top-8 left-10 right-10 flex justify-between items-start">
          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="relative w-8 h-8 flex-shrink-0">
              <span className="absolute inset-0 border border-accent-500 rotate-45" />
              <span className="absolute inset-[9px] bg-accent-500 rotate-45 shadow-[0_0_12px_#e67e22]" />
            </div>
            <div>
              <div className="text-white font-bold text-xl tracking-[0.2em] leading-none flex items-center gap-2">
                <Box size={18} className="text-accent-500" /> {isRtl ? 'جولة ثلاثية الأبعاد' : '3D VIRTUAL TOUR'}
              </div>
              {title && <div className="text-[10px] text-white/50 mt-2 tracking-[0.25em] uppercase truncate max-w-[60vw]">{title}</div>}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-right text-[10px] text-white/55 tracking-[0.18em]">
            <div className="flex items-center justify-end gap-2"><span>HOLO-FIELD STABLE</span><span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" /></div>
            <div className="flex items-center justify-end gap-2"><span>FRAMES {validImages.length}</span><span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" /></div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close 3D viewer"
            className="pointer-events-auto bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur cursor-pointer transition-colors ml-4"
          >
            <X />
          </button>
        </div>

        {/* right catalog */}
        {validImages.length > 1 && (
          <aside className="pointer-events-auto absolute right-10 top-1/2 -translate-y-1/2 w-56 bg-[#0d0e13]/60 backdrop-blur-md border border-white/10 p-4 max-h-[60vh] overflow-y-auto hidden md:block">
            <div className="text-[9.5px] text-white/40 tracking-[0.35em] mb-4">{isRtl ? 'الصور' : 'SPECIMEN CATALOG'}</div>
            <div className="flex flex-col gap-1.5">
              {validImages.map((url, i) => (
                <button
                  key={`${i}-${url.slice(0, 48)}`}
                  onClick={() => setFocusedIndex(i)}
                  className={`grid grid-cols-[36px_1fr_auto] items-center gap-3 px-2 py-2 border text-left transition-colors cursor-pointer ${
                    i === focusedIndex
                      ? 'border-accent-500 bg-accent-500/10 text-accent-400'
                      : 'border-white/10 text-white/55 hover:text-white hover:border-accent-500/40 hover:bg-accent-500/5'
                  }`}
                >
                  <span className="w-8 h-8 rounded overflow-hidden bg-white/5 flex-shrink-0">
                    <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </span>
                  <span className="text-[11px] font-medium tracking-[0.12em]">{isRtl ? 'صورة' : 'PHOTO'} {String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[9px] text-white/30">#{String(i + 1).padStart(3, '0')}</span>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* bottom: controls + readout */}
        <div className="absolute bottom-8 left-10 right-10 flex items-end justify-between gap-6">
          <div className="hidden md:flex gap-5 text-[10px] text-white/35 tracking-[0.18em]">
            <div className="flex items-center gap-2"><span className="px-2 py-1 bg-white/5 border border-white/10 text-white text-[9.5px]">DRAG</span>{isRtl ? 'تدوير' : 'rotate'}</div>
            <div className="flex items-center gap-2"><span className="px-2 py-1 bg-white/5 border border-white/10 text-white text-[9.5px]">1–{validImages.length > 9 ? 9 : validImages.length}</span>{isRtl ? 'اختيار' : 'select'}</div>
            <div className="flex items-center gap-2"><span className="px-2 py-1 bg-white/5 border border-white/10 text-white text-[9.5px]">CLICK</span>{isRtl ? 'التالي' : 'next'}</div>
          </div>

          <div className="pointer-events-auto flex items-center gap-4">
            <button onClick={prev} aria-label="Previous image" className="bg-white/10 hover:bg-white/25 p-3 rounded-full text-white backdrop-blur border border-white/20 transition-colors cursor-pointer">
              <ChevronLeft size={22} />
            </button>
            <div className="text-white/80 text-sm font-bold tracking-widest min-w-[64px] text-center">{focusedIndex + 1} / {validImages.length}</div>
            <button onClick={next} aria-label="Next image" className="bg-white/10 hover:bg-white/25 p-3 rounded-full text-white backdrop-blur border border-white/20 transition-colors cursor-pointer">
              <ChevronRight size={22} />
            </button>
            <button onClick={() => controlsRef.current?.reset?.()} aria-label="Reset camera" className="bg-white/10 hover:bg-white/25 p-3 rounded-full text-white backdrop-blur border border-white/20 transition-colors cursor-pointer">
              <RotateCcw size={20} />
            </button>
          </div>

          <div className="hidden md:flex gap-7 bg-[#0d0e13]/55 backdrop-blur border border-white/10 px-5 py-3">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-white/35 tracking-[0.25em]">ORBIT</span>
              <span className="text-[11px] text-accent-500 tracking-[0.1em]">{orbitAuto ? 'AUTO' : 'MANUAL'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-white/35 tracking-[0.25em]">FRAME</span>
              <span className="text-[11px] text-accent-500 tracking-[0.1em]">{code}</span>
            </div>
          </div>
        </div>
      </div>

      {/* vignette + grain (matches the cinematic reference look) */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 75% 65% at center, transparent 30%, rgba(0,0,0,0.72) 100%)' }} />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045] mix-blend-overlay"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
      />
    </div>
  );
};

export default Property3DViewer;
