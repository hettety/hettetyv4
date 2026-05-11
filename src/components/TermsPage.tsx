import React from 'react';
import { FileText, Shield, AlertCircle, Scale, RefreshCw } from 'lucide-react';

const TermsPage = ({ t, isRtl }: { t: any, isRtl: boolean }) => {
  const sections = [
    {
      title: t.terms_sec_1_title,
      icon: <FileText className="w-6 h-6 text-emerald-400" />,
      content: t.terms_sec_1_desc
    },
    {
      title: t.terms_sec_2_title,
      icon: <Shield className="w-6 h-6 text-emerald-400" />,
      content: t.terms_sec_2_desc
    },
    {
      title: t.terms_sec_3_title,
      icon: <Scale className="w-6 h-6 text-emerald-400" />,
      content: t.terms_sec_3_desc
    },
    {
      title: t.terms_sec_4_title,
      icon: <AlertCircle className="w-6 h-6 text-emerald-400" />,
      content: t.terms_sec_4_desc
    },
    {
      title: t.terms_sec_5_title,
      icon: <RefreshCw className="w-6 h-6 text-emerald-400" />,
      content: t.terms_sec_5_desc
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-sans animate-fade-in transition-colors duration-500" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto px-6 py-20">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block py-1 px-4 rounded-full bg-brand-500/10 dark:bg-emerald-500/10 text-brand-600 dark:text-emerald-400 text-xs font-black mb-6 border border-brand-500/20 dark:border-emerald-500/20 uppercase tracking-widest">
            {t.terms_badge}
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-6 text-slate-900 dark:text-white uppercase tracking-tighter">
            {t.terms_title}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            {t.terms_desc}
          </p>
        </div>

        {/* Sections Grid */}
        <div className="grid gap-8">
          {sections.map((section, index) => (
            <div 
              key={index}
              className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-brand-500/30 dark:hover:border-emerald-500/30 transition-all duration-300 shadow-sm hover:shadow-xl group"
            >
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="p-4 bg-brand-100 dark:bg-slate-800 rounded-2xl shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 text-brand-600 dark:text-emerald-400">
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-black mb-3 text-slate-900 dark:text-white uppercase tracking-tight">
                    {section.title}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {section.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-20 text-center text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest leading-loose max-w-xl mx-auto">
          {t.terms_footer}
        </div>

      </div>
    </div>
  );
};

export default TermsPage;
