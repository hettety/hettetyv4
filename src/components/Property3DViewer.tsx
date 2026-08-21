/**
 * Property3DViewer — turns a flat property photo into an explorable 3D scene.
 *
 * Each photo is mapped onto a finely-subdivided plane and displaced along its
 * depth cues (the image's own luminance drives a height map), so brighter/closer
 * parts of the room pop forward. The visitor can then orbit the photo to view it
 * from other angles, with real parallax between near and far surfaces — instead
 * of just staring at a flat picture. Arrows switch between the property's photos.
 *
 * Used by the standalone 3D tour page, the property detail page and the AI
 * assistant (when a user asks to "see the apartment in 3D").
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { X, ChevronLeft, ChevronRight, Box, RotateCcw, Move3d, Layers } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

/** Loads a texture imperatively so a failed image degrades gracefully instead of crashing the canvas. */
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
        tex.anisotropy = 8;
        if (tex.image?.width && tex.image?.height) {
          setAspect(tex.image.width / tex.image.height);
        }
        setTexture(tex);
      },
      undefined,
      () => { /* keep placeholder on load error */ }
    );
    return () => {
      disposed = true;
      setTexture((prev) => { prev?.dispose(); return null; });
    };
  }, [url]);

  return { texture, aspect };
}

const PLANE_HEIGHT = 3;
const DEPTH_SCALE = 0.55;

/**
 * The photo as a displaced 3D relief. The same texture is used both as the
 * colour map and as the displacement (height) map, so the picture's lighter
 * regions are pushed toward the viewer — giving genuine parallax when orbited.
 */
const DepthPhoto = ({ url }: { url: string }) => {
  const { texture, aspect } = useImageTexture(url);
  const groupRef = useRef<THREE.Group>(null);
  const width = PLANE_HEIGHT * Math.min(Math.max(aspect, 0.6), 2.4);

  // Subtle "breathing" sway so the depth reads even before the user interacts.
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.06;
      groupRef.current.rotation.x = Math.cos(t * 0.22) * 0.025;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Soft frame behind the relief */}
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[width + 0.12, PLANE_HEIGHT + 0.12, 0.08]} />
        <meshStandardMaterial color="#0b1220" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Displaced photo */}
      <mesh>
        <planeGeometry args={[width, PLANE_HEIGHT, 220, 220]} />
        {texture ? (
          <meshStandardMaterial
            map={texture}
            displacementMap={texture}
            displacementScale={DEPTH_SCALE}
            displacementBias={-DEPTH_SCALE / 2}
            roughness={0.85}
            metalness={0.0}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshStandardMaterial color="#334155" />
        )}
      </mesh>
    </group>
  );
};

/** Immersive 360° look-around: the panorama is painted on the inside of a sphere with the camera at its centre. */
const PanoramaSphere = ({ url }: { url: string }) => {
  const { texture } = useImageTexture(url);
  const meshRef = useRef<THREE.Mesh>(null);
  // Slow idle spin so it's obviously interactive
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.0006;
  });
  if (!texture) return null;
  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[10, 64, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
    </mesh>
  );
};

const PanoramaScene = ({ url }: { url: string }) => {
  const { camera } = useThree();
  useEffect(() => { camera?.position?.set?.(0, 0, 0.1); }, [url, camera]);
  return (
    <>
      <PanoramaSphere key={url} url={url} />
      <OrbitControls enablePan={false} enableZoom rotateSpeed={-0.35} minDistance={0.1} maxDistance={8} />
    </>
  );
};

const Scene = ({ url, autoRotate }: { url: string; autoRotate: boolean }) => {
  const { camera } = useThree();
  useEffect(() => {
    camera?.position?.set?.(0, 0, 4);
  }, [url, camera]);

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 3, 4]} intensity={1.1} />
      <directionalLight position={[-3, -1, 2]} intensity={0.4} color="#cbd5e1" />
      <DepthPhoto key={url} url={url} />
      <OrbitControls
        enablePan={false}
        enableZoom
        autoRotate={autoRotate}
        autoRotateSpeed={1.2}
        minDistance={2.2}
        maxDistance={6}
        minPolarAngle={Math.PI / 2 - 0.7}
        maxPolarAngle={Math.PI / 2 + 0.7}
        minAzimuthAngle={-0.9}
        maxAzimuthAngle={0.9}
      />
    </>
  );
};

export interface Property3DViewerProps {
  images: string[];
  panoramas?: string[];
  title?: string;
  onClose: () => void;
  isRtl?: boolean;
}

const Property3DViewer: React.FC<Property3DViewerProps> = ({ images, panoramas, title, onClose, isRtl }) => {
  const validImages = useMemo(() => images.filter(Boolean), [images]);
  const validPanoramas = useMemo(() => (panoramas || []).filter(Boolean), [panoramas]);
  // Prefer the immersive 360° look-around when panoramas are available.
  const [mode, setMode] = useState<'pano' | 'depth'>(validPanoramas.length ? 'pano' : 'depth');
  const list = mode === 'pano' ? validPanoramas : validImages;
  const [index, setIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  const containerRef = useFocusTrap<HTMLDivElement>(true, onClose);

  const next = () => { setIndex((i) => (i + 1) % list.length); setAutoRotate(true); };
  const prev = () => { setIndex((i) => (i === 0 ? list.length - 1 : i - 1)); setAutoRotate(true); };

  const switchMode = (m: 'pano' | 'depth') => { setMode(m); setIndex(0); setAutoRotate(true); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length, onClose]);

  if (validImages.length === 0 && validPanoramas.length === 0) {
    return (
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={isRtl ? 'عرض العقار ثلاثي الأبعاد' : '3D Property Tour Viewer'}
        className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center text-center p-6"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <Box className="w-16 h-16 text-brand-500 mb-4 opacity-50" aria-hidden="true" />
        <p className="text-slate-300 mb-6">
          {isRtl ? 'لا توجد صور متاحة لهذا العقار لعرضها بتقنية ثلاثية الأبعاد.' : 'No images are available for this property to display in 3D.'}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label={isRtl ? 'رجوع وإغلاق المعاينة' : 'Back and close viewer'}
          className="min-w-[48px] min-h-[48px] bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full border border-white/20 transition-colors cursor-pointer flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          {isRtl ? 'رجوع' : 'Back'}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={isRtl ? 'عرض العقار ثلاثي الأبعاد' : '3D Property Tour Viewer'}
      className="fixed inset-0 z-[70] bg-black flex flex-col animate-fade-in"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Toolbar */}
      <div className="absolute top-0 w-full p-4 landscape:p-2 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none">
        <div className="text-white pointer-events-auto">
          <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
            <Box size={20} className="text-accent-500" aria-hidden="true" />
            {mode === 'pano' ? (isRtl ? 'جولة 360°' : '360° Tour') : (isRtl ? 'عرض ثلاثي الأبعاد' : '3D Depth View')}
          </h3>
          {title && <p className="text-xs sm:text-sm text-white/80">{title}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={isRtl ? 'إغلاق العرض ثلاثي الأبعاد' : 'Close 3D viewer'}
          className="pointer-events-auto min-w-[48px] min-h-[48px] bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur cursor-pointer transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </div>

      {/* Mode switch (only when both panoramas and photos exist) */}
      {validPanoramas.length > 0 && validImages.length > 0 && (
        <div className="absolute top-20 landscape:top-14 left-1/2 -translate-x-1/2 z-10 flex bg-white/10 backdrop-blur border border-white/20 rounded-full p-1 shadow-lg">
          <button
            type="button"
            onClick={() => switchMode('pano')}
            aria-pressed={mode === 'pano'}
            aria-label={isRtl ? 'التبديل إلى جولة 360°' : 'Switch to 360° Tour'}
            className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400 ${
              mode === 'pano' ? 'bg-brand-600 text-white' : 'text-white/80 hover:text-white'
            }`}
          >
            <Box size={14} aria-hidden="true" /> {isRtl ? 'جولة 360°' : '360° Tour'}
          </button>
          <button
            type="button"
            onClick={() => switchMode('depth')}
            aria-pressed={mode === 'depth'}
            aria-label={isRtl ? 'التبديل إلى صور بعمق' : 'Switch to Depth Photos'}
            className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400 ${
              mode === 'depth' ? 'bg-brand-600 text-white' : 'text-white/80 hover:text-white'
            }`}
          >
            <Layers size={14} aria-hidden="true" /> {isRtl ? 'صور بعمق' : 'Depth Photos'}
          </button>
        </div>
      )}

      {/* 3D Scene */}
      {mode === 'pano' ? (
        <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }} className="flex-1" gl={{ antialias: true }}>
          <color attach="background" args={['#05080f']} />
          <PanoramaScene url={list[index]} />
        </Canvas>
      ) : (
        <Canvas
          camera={{ position: [0, 0, 4], fov: 50 }}
          className="flex-1"
          gl={{ antialias: true }}
          onPointerDown={() => setAutoRotate(false)}
        >
          <color attach="background" args={['#05080f']} />
          <fog attach="fog" args={['#05080f', 6, 16]} />
          <Scene url={list[index]} autoRotate={autoRotate} />
        </Canvas>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 w-full p-4 sm:p-6 landscape:p-2 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent z-10">
        {list.length > 1 && (
          <button
            type="button"
            onClick={prev}
            aria-label={isRtl ? 'الصورة السابقة' : 'Previous image'}
            className="min-w-[48px] min-h-[48px] bg-white/10 hover:bg-white/25 p-3 rounded-full text-white backdrop-blur border border-white/20 transition-colors cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
        )}
        <div className="text-white text-sm font-bold tracking-widest min-w-[64px] text-center select-none" aria-live="polite">
          {index + 1} / {list.length}
        </div>
        {list.length > 1 && (
          <button
            type="button"
            onClick={next}
            aria-label={isRtl ? 'الصورة التالية' : 'Next image'}
            className="min-w-[48px] min-h-[48px] bg-white/10 hover:bg-white/25 p-3 rounded-full text-white backdrop-blur border border-white/20 transition-colors cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        )}
        {mode === 'depth' && (
          <button
            type="button"
            onClick={() => setAutoRotate((a) => !a)}
            aria-label={isRtl ? 'تبديل التدوير التلقائي' : 'Toggle auto-rotate'}
            aria-pressed={autoRotate}
            className={`min-w-[48px] min-h-[48px] p-3 rounded-full backdrop-blur border transition-colors cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-400 ${
              autoRotate ? 'bg-brand-600 border-brand-500 text-white' : 'bg-white/10 hover:bg-white/25 border-white/20 text-white'
            }`}
          >
            <RotateCcw size={20} aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="absolute bottom-24 landscape:bottom-14 w-full text-center text-white/80 text-xs pointer-events-none select-none flex items-center justify-center gap-2 px-4">
        <Move3d size={14} aria-hidden="true" />
        <span>
          {mode === 'pano'
            ? (isRtl ? 'اسحب للالتفاف 360° داخل الغرفة • عجلة الفأرة للتقريب' : 'Drag to look around 360° • Scroll to zoom')
            : (isRtl ? 'اسحب لرؤية الصورة من زوايا مختلفة • عجلة الفأرة للتقريب' : 'Drag to view from different angles • Scroll to zoom')}
        </span>
      </p>
    </div>
  );
};

export default Property3DViewer;
