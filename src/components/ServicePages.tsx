import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, ShieldCheck, Building2, Box, Clock } from 'lucide-react';

interface ServicePageProps {
  title: string;
  description: string;
  features: { title: string; desc: string; icon: React.ReactNode }[];
  ctaText: string;
  onCta: () => void;
  isRtl: boolean;
}

const ServicePage: React.FC<ServicePageProps> = ({ title, description, features, ctaText, onCta, isRtl }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-sans animate-fade-in transition-colors duration-500" dir={isRtl ? "rtl" : "ltr"}>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-500/10 dark:from-emerald-500/10 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight text-slate-900 dark:text-white uppercase tracking-tighter">
            {title}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto mb-10 font-medium">
            {description}
          </p>
          <button 
            onClick={onCta}
            className="bg-brand-600 dark:bg-emerald-500 hover:bg-brand-700 dark:hover:bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-lg transition-all duration-300 shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 flex items-center gap-3 mx-auto uppercase tracking-widest"
          >
            {ctaText} {isRtl ? <ArrowLeft size={24} /> : <ArrowRight size={24} />}
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-brand-500/30 dark:hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-2xl group">
              <div className="w-16 h-16 bg-brand-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-brand-600 dark:text-emerald-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-black mb-3 text-slate-900 dark:text-white uppercase tracking-tight">{feature.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export const BuyPropertyPage = ({ onCta, t, isRtl }: { onCta: () => void, t: any, isRtl: boolean }) => (
  <ServicePage
    title={t.buy_title}
    description={t.buy_desc}
    ctaText={t.buy_cta}
    onCta={onCta}
    isRtl={isRtl}
    features={[
      { title: t.buy_feat_1_title, desc: t.buy_feat_1_desc, icon: <Building2 size={28} /> },
      { title: t.buy_feat_2_title, desc: t.buy_feat_2_desc, icon: <CheckCircle size={28} /> },
      { title: t.buy_feat_3_title, desc: t.buy_feat_3_desc, icon: <ShieldCheck size={28} /> }
    ]}
  />
);

export const VerificationPage = ({ onCta, t, isRtl }: { onCta: () => void, t: any, isRtl: boolean }) => (
  <ServicePage
    title={t.verify_title}
    description={t.verify_desc}
    ctaText={t.verify_cta}
    onCta={onCta}
    isRtl={isRtl}
    features={[
      { title: t.verify_feat_1_title, desc: t.verify_feat_1_desc, icon: <ShieldCheck size={28} /> },
      { title: t.verify_feat_2_title, desc: t.verify_feat_2_desc, icon: isRtl ? <ArrowLeft size={28} /> : <ArrowRight size={28} /> },
      { title: t.verify_feat_3_title, desc: t.verify_feat_3_desc, icon: <CheckCircle size={28} /> }
    ]}
  />
);

export const Tours3DPage = ({ onCta, t, isRtl }: { onCta: () => void, t: any, isRtl: boolean }) => (
  <ServicePage
    title={t.tours_title}
    description={t.tours_desc}
    ctaText={t.tours_cta}
    onCta={onCta}
    isRtl={isRtl}
    features={[
      { title: t.tours_feat_1_title, desc: t.tours_feat_1_desc, icon: <Box size={28} /> },
      { title: t.tours_feat_2_title, desc: t.tours_feat_2_desc, icon: <Building2 size={28} /> },
      { title: t.tours_feat_3_title, desc: t.tours_feat_3_desc, icon: <Clock size={28} /> }
    ]}
  />
);
