/**
 * TourEmbed — full-screen overlay that embeds a real walkthrough tour from
 * Matterport or Polycam via an <iframe>. Used when a property has a
 * `digitalTwinUrl`. Normalises common share-link formats into their embeddable
 * equivalents so a pasted browser URL "just works".
 */
import React, { useEffect } from 'react';
import { X, Box, ExternalLink } from 'lucide-react';
import { toEmbedUrl } from './tourUrl';

interface TourEmbedProps {
  url: string;
  title?: string;
  onClose: () => void;
  isRtl?: boolean;
}

const TourEmbed: React.FC<TourEmbedProps> = ({ url, title, onClose, isRtl }) => {
  const embedUrl = toEmbedUrl(url);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col animate-fade-in" dir="ltr">
      <div className="absolute top-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none">
        <div className="text-white pointer-events-auto">
          <h3 className="font-bold text-lg flex items-center gap-2"><Box size={20} className="text-accent-500" /> {isRtl ? 'جولة ثلاثية الأبعاد حقيقية' : 'Real 3D Walkthrough'}</h3>
          {title && <p className="text-sm text-white/70">{title}</p>}
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur transition-colors"
            aria-label="Open tour in a new tab"
            title={isRtl ? 'افتح في تبويب جديد' : 'Open in new tab'}
          >
            <ExternalLink size={20} />
          </a>
          <button onClick={onClose} aria-label="Close tour" className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur cursor-pointer transition-colors"><X /></button>
        </div>
      </div>

      <iframe
        src={embedUrl}
        title={title || 'Property tour'}
        className="flex-1 w-full border-0"
        allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen; autoplay"
        allowFullScreen
      />
    </div>
  );
};

export default TourEmbed;
