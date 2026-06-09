/**
 * Property3DViewer — immersive 3D gallery that displays a property's photos
 * as floating panels arranged in a circular showroom. The visitor stands in
 * the middle and can orbit/zoom freely, or use the arrows to glide between
 * photos. Used by the standalone 3D tour page, the property modal and the
 * AI assistant (when a user asks to "see the apartment in 3D").
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { X, ChevronLeft, ChevronRight, Box, RotateCcw } from 'lucide-react';

const PANEL_HEIGHT = 2.4;

/** Loads a texture imperatively so a failed image degrades to a placeholder panel instead of crashing the canvas. */
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

const ImagePanel = ({ url, angle, radius, focused }: { url: string; angle: number; radius: number; focused: boolean }) => {
  const { texture, aspect } = useImageTexture(url);
  const frameRef = useRef<THREE.Group>(null);
  const width = PANEL_HEIGHT * Math.min(aspect, 2.2);
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;

  // Gentle scale-up + glow on the focused panel
  useFrame(() => {
    if (frameRef.current) {
      const target = focused ? 1.12 : 1;
      frameRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.08);
    }
  });

  return (
    <group ref={frameRef} position={[x, PANEL_HEIGHT / 2 + 0.4, z]} rotation={[0, angle + Math.PI, 0]}>
      {/* Frame */}
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[width + 0.14, PANEL_HEIGHT + 0.14, 0.05]} />
        <meshStandardMaterial color={focused ? '#c8a24a' : '#1e293b'} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Photo (or dark placeholder while loading / on error) */}
      <mesh>
        <planeGeometry args={[width, PANEL_HEIGHT]} />
        {texture
          ? <meshBasicMaterial map={texture} toneMapped={false} />
          : <meshStandardMaterial color="#334155" />}
      </mesh>
    </group>
  );
};

const Showroom = ({ images, focusedIndex }: { images: string[]; focusedIndex: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const radius = Math.max(4.5, (images.length * 3.6) / (2 * Math.PI));

  // Rotate the whole gallery so the focused photo faces the camera
  useFrame(() => {
    if (!groupRef.current) return;
    const targetRotation = -((2 * Math.PI) / images.length) * focusedIndex;
    const current = groupRef.current.rotation.y;
    let delta = targetRotation - current;
    // shortest path around the circle
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    groupRef.current.rotation.y = current + delta * 0.06;
  });

  const floorRadius = radius + 2.5;

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[0, 6, 0]} intensity={60} color="#fff7e6" />
      <pointLight position={[0, 2, 4]} intensity={25} color="#ffffff" />

      <group ref={groupRef}>
        {images.map((url, i) => (
          <ImagePanel
            key={`${i}-${url.slice(0, 64)}`}
            url={url}
            angle={(i * 2 * Math.PI) / images.length}
            radius={radius}
            focused={i === focusedIndex}
          />
        ))}
      </group>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[floorRadius, 64]} />
        <meshStandardMaterial color="#0b1220" metalness={0.4} roughness={0.7} />
      </mesh>
      <gridHelper args={[floorRadius * 2, 24, '#1e293b', '#13203a']} position={[0, 0.01, 0]} />
      {/* Ceiling glow disc */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 7, 0]}>
        <circleGeometry args={[floorRadius, 64]} />
        <meshBasicMaterial color="#070d1a" />
      </mesh>
    </>
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
  const controlsRef = useRef<any>(null);

  // Keyboard navigation + Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setFocusedIndex((i) => (i + 1) % validImages.length);
      if (e.key === 'ArrowLeft') setFocusedIndex((i) => (i === 0 ? validImages.length - 1 : i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [validImages.length, onClose]);

  if (validImages.length === 0) {
    return (
      <div className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center text-center p-6">
        <Box className="w-16 h-16 text-brand-500 mb-4 opacity-50" />
        <p className="text-slate-300 mb-6">{isRtl ? 'لا توجد صور متاحة لهذا العقار لعرضها بتقنية ثلاثية الأبعاد.' : 'No images are available for this property to display in 3D.'}</p>
        <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full border border-white/20 transition-colors cursor-pointer">
          {isRtl ? 'رجوع' : 'Back'}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col animate-fade-in" dir="ltr">
      {/* Toolbar */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none">
        <div className="text-white pointer-events-auto">
          <h3 className="font-bold text-lg flex items-center gap-2"><Box size={20} className="text-accent-500" /> {isRtl ? 'جولة ثلاثية الأبعاد' : '3D Virtual Tour'}</h3>
          {title && <p className="text-sm text-white/70">{title}</p>}
        </div>
        <button onClick={onClose} aria-label="Close 3D viewer" className="pointer-events-auto bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur cursor-pointer transition-colors"><X /></button>
      </div>

      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 1.7, 0.1], fov: 65 }} className="flex-1" gl={{ antialias: true }}>
        <color attach="background" args={['#05080f']} />
        <fog attach="fog" args={['#05080f', 10, 26]} />
        <Showroom images={validImages} focusedIndex={focusedIndex} />
        <OrbitControls
          ref={controlsRef}
          target={[0, 1.6, -0.001]}
          enablePan={false}
          enableZoom
          minDistance={0.1}
          maxDistance={6}
          rotateSpeed={-0.4}
        />
      </Canvas>

      {/* Bottom controls */}
      <div className="absolute bottom-0 w-full p-6 flex items-center justify-center gap-6 bg-gradient-to-t from-black/80 to-transparent z-10">
        <button
          onClick={() => setFocusedIndex((i) => (i === 0 ? validImages.length - 1 : i - 1))}
          aria-label="Previous image"
          className="bg-white/10 hover:bg-white/25 p-3 rounded-full text-white backdrop-blur border border-white/20 transition-colors cursor-pointer"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="text-white/80 text-sm font-bold tracking-widest min-w-[64px] text-center select-none">
          {focusedIndex + 1} / {validImages.length}
        </div>
        <button
          onClick={() => setFocusedIndex((i) => (i + 1) % validImages.length)}
          aria-label="Next image"
          className="bg-white/10 hover:bg-white/25 p-3 rounded-full text-white backdrop-blur border border-white/20 transition-colors cursor-pointer"
        >
          <ChevronRight size={22} />
        </button>
        <button
          onClick={() => controlsRef.current?.reset?.()}
          aria-label="Reset camera"
          className="bg-white/10 hover:bg-white/25 p-3 rounded-full text-white backdrop-blur border border-white/20 transition-colors cursor-pointer"
        >
          <RotateCcw size={20} />
        </button>
      </div>
      <p className="absolute bottom-24 w-full text-center text-white/40 text-xs pointer-events-none select-none">
        {isRtl ? 'اسحب للتحرك حول الصالة • عجلة الفأرة للتقريب' : 'Drag to look around • Scroll to zoom'}
      </p>
    </div>
  );
};

export default Property3DViewer;
