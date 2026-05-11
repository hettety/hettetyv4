import React from 'react';
import { ArrowLeft, ArrowRight, Sparkles, PlayCircle } from 'lucide-react';

interface PremiumHeroProps {
  onPrimaryCta?: () => void;
  onSecondaryCta?: () => void;
  t: any;
  isRtl: boolean;
}

const PremiumHero: React.FC<PremiumHeroProps> = ({ 
  onPrimaryCta = () => {}, 
  onSecondaryCta = () => {},
  t,
  isRtl
}) => {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-white dark:bg-[#0F172A] font-sans transition-colors duration-500" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000" 
          alt="Modern Architecture" 
          className="w-full h-full object-cover opacity-20 dark:opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-[#0F172A] dark:via-[#0F172A]/80 to-transparent dark:to-[#0F172A]/40"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-500/10 dark:from-[#10B981]/10 via-transparent to-transparent"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-slate-900/5 dark:bg-white/5 backdrop-blur-md border border-slate-900/10 dark:border-white/10 rounded-full px-5 py-2 mb-8 animate-slide-up shadow-sm">
          <Sparkles className="w-4 h-4 text-brand-600 dark:text-[#10B981]" />
          <span className="text-brand-600 dark:text-[#10B981] text-xs font-black tracking-widest uppercase">
            {t.hero_badge}
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl lg:text-9xl font-black text-[#1b2c4d] dark:text-white mb-8 leading-[0.9] tracking-tighter animate-fade-in uppercase">
          {t.hero_title_start} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1b2c4d] to-[#e67e22] dark:from-white dark:via-orange-200 dark:to-orange-400">
            {t.hero_title_end}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed font-bold animate-slide-up opacity-90 uppercase tracking-tight">
          {t.hero_subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
          
          <button 
            onClick={onPrimaryCta}
            className="group relative px-10 py-5 bg-accent-500 dark:bg-accent-500 hover:bg-accent-600 dark:hover:bg-accent-600 text-white text-xl font-black rounded-2xl transition-all duration-300 shadow-2xl shadow-accent-500/20 hover:shadow-accent-500/40 transform hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2 overflow-hidden uppercase tracking-widest"
          >
            <span className="relative z-10">{t.hero_cta_primary}</span>
            {isRtl ? (
              <ArrowLeft className="w-6 h-6 relative z-10 group-hover:-translate-x-1 transition-transform" />
            ) : (
              <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
            )}
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>

          <button 
            onClick={onSecondaryCta}
            className="group px-10 py-5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[#1b2c4d] dark:text-white text-xl font-black rounded-2xl border border-slate-200 dark:border-white/10 backdrop-blur-sm transition-all duration-300 hover:border-slate-300 dark:hover:border-white/20 w-full sm:w-auto flex items-center justify-center gap-3 uppercase tracking-widest transform hover:-translate-y-1"
          >
            <PlayCircle className="w-6 h-6 text-accent-500 dark:text-slate-300 group-hover:text-accent-600 dark:group-hover:text-white transition-colors" />
            <span>{t.hero_cta_secondary}</span>
          </button>

        </div>

      </div>
    </div>
  );
};

export default PremiumHero;
