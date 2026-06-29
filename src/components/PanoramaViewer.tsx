/**
 * PanoramaViewer — immersive 360° viewer. Each panorama is an equirectangular
 * (2:1) photo mapped onto the inside of a sphere with the camera at its centre,
 * so the visitor can look around a room in every direction. A thumbnail strip
 * switches between rooms. Used when a property has `panoramas`.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { X, Compass, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

/** A true 360° panorama is equirectangular — width ≈ twice the height. */
const isEquirectangular = (w: number, h: number) => h > 0 && w / h >= 1.85 && w / h <= 2.15;

/** Loads an equirectangular texture imperatively, degrading gracefully on error. */
function usePanoramaTexture(url: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let disposed = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        if (disposed) { tex.dispose(); return; }
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
      },
      undefined,
      () => { /* keep the dark sphere on load error */ }
    );
    return () => {
      disposed = true;
      setTexture((prev) => { prev?.dispose(); return null; });
    };
  }, [url]);

  return texture;
}

const PanoSphere = ({ url }: { url: string }) => {
  const texture = usePanoramaTexture(url);
  // Render the inside of the sphere by flipping it inside-out.
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(50, 64, 40);
    g.scale(-1, 1, 1);
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      {texture
        ? <meshBasicMaterial map={texture} toneMapped={false} />
        : <meshBasicMaterial color="#0b0e16" side={THREE.BackSide} />}
    </mesh>
  );
};

export interface PanoramaViewerProps {
  panoramas: string[];
  title?: string;
  onClose: () => void;
  isRtl?: boolean;
}

const PanoramaViewer: React.FC<PanoramaViewerProps> = ({ panoramas, title, onClose, isRtl }) => {
  const valid = useMemo(() => panoramas.filter(Boolean), [panoramas]);
  const [index, setIndex] = useState(0);
  // Whether the current panorama is a full equirectangular 360°. Measured with
  // a plain Image (independent of the WebGL texture) for reliable dimensions.
  const [coversEveryAngle, setCoversEveryAngle] = useState(true);
  useEffect(() => {
    setCoversEveryAngle(true);
    const url = valid[index];
    if (!url) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) setCoversEveryAngle(isEquirectangular(img.naturalWidth, img.naturalHeight)); };
    img.src = url;
    return () => { cancelled = true; };
  }, [valid, index]);

  useEffect(() => {
    setIndex((i) => (valid.length ? Math.min(i, valid.length - 1) : 0));
  }, [valid.length]);

  const next = () => setIndex((i) => (i + 1) % valid.length);
  const prev = () => setIndex((i) => (i === 0 ? valid.length - 1 : i - 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [valid.length, onClose]);

  if (valid.length === 0) {
    return (
      <div className="fixed inset-0 z-[80] bg-black flex flex-col items-center justify-center text-center p-6">
        <Compass className="w-16 h-16 text-accent-500 mb-4 opacity-50" />
        <p className="text-slate-300 mb-6">{isRtl ? 'لا توجد صور بانوراما 360° لهذا العقار.' : 'No 360° panoramas are available for this property.'}</p>
        <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full border border-white/20 transition-colors cursor-pointer">
          {isRtl ? 'رجوع' : 'Back'}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col animate-fade-in" dir="ltr">
      {/* Toolbar */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none">
        <div className="text-white pointer-events-auto">
          <h3 className="font-bold text-lg flex items-center gap-2"><Compass size={20} className="text-accent-500" /> {isRtl ? 'جولة بانوراما 360°' : '360° Panorama Tour'}</h3>
          {title && <p className="text-sm text-white/70">{title}</p>}
        </div>
        <button onClick={onClose} aria-label="Close panorama viewer" className="pointer-events-auto bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur cursor-pointer transition-colors"><X /></button>
      </div>

      {/* 360 scene */}
      {/* Notice when the current photo isn't a full equirectangular 360° */}
      {!coversEveryAngle && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-amber-500/90 text-white text-xs font-medium px-3 py-2 rounded-full backdrop-blur shadow-lg pointer-events-none max-w-[90vw]">
          <AlertTriangle size={14} className="flex-shrink-0" />
          {isRtl ? 'الصورة دي مش بانوراما 360° كاملة — يمكن متشوفش كل الزوايا.' : "This image may not cover every angle (not a full 360°)."}
        </div>
      )}

      <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }} className="flex-1">
        <PanoSphere url={valid[index]} />
        <OrbitControls
          enablePan={false}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={-0.35}
          minDistance={0.1}
          maxDistance={0.1}
        />
      </Canvas>

      {/* Bottom controls + room thumbnails */}
      {valid.length > 1 && (
        <div className="absolute bottom-0 w-full p-5 flex flex-col items-center gap-4 bg-gradient-to-t from-black/80 to-transparent z-10">
          <div className="flex items-center gap-4">
            <button onClick={prev} aria-label="Previous panorama" className="bg-white/10 hover:bg-white/25 p-3 rounded-full text-white backdrop-blur border border-white/20 transition-colors cursor-pointer"><ChevronLeft size={22} /></button>
            <div className="text-white/80 text-sm font-bold tracking-widest min-w-[64px] text-center select-none">{index + 1} / {valid.length}</div>
            <button onClick={next} aria-label="Next panorama" className="bg-white/10 hover:bg-white/25 p-3 rounded-full text-white backdrop-blur border border-white/20 transition-colors cursor-pointer"><ChevronRight size={22} /></button>
          </div>
          <div className="flex gap-2 max-w-full overflow-x-auto pb-1">
            {valid.map((url, i) => (
              <button
                key={`${i}-${url.slice(0, 48)}`}
                onClick={() => setIndex(i)}
                className={`w-20 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${i === index ? 'border-accent-500 scale-105' : 'border-white/20 opacity-60 hover:opacity-100'}`}
                aria-label={`Panorama ${i + 1}`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="absolute bottom-28 w-full text-center text-white/40 text-xs pointer-events-none select-none">
        {isRtl ? 'اسحب للنظر حولك • عجلة الفأرة للتقريب' : 'Drag to look around • Scroll to zoom'}
      </p>
    </div>
  );
};

export default PanoramaViewer;
