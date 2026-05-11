import React from 'react';
import { Settings } from 'lucide-react';

interface CookiePolicyPageProps {
  t: any;
  isRtl: boolean;
}

const CookiePolicyPage: React.FC<CookiePolicyPageProps> = ({ t, isRtl }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-24 transition-colors duration-500" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-500/10 dark:bg-emerald-500/20 mb-6 shadow-sm border border-brand-500/20 dark:border-emerald-500/20">
            <Settings className="w-10 h-10 text-brand-600 dark:text-emerald-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tighter">
            {t.nav_cookie}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
            {isRtl ? 'فهم كيفية استخدامنا لملفات تعريف الارتباط.' : 'Understanding how we use cookies.'}
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">{isRtl ? 'ما هي ملفات تعريف الارتباط؟' : 'What Are Cookies?'}</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {isRtl 
                ? 'ملفات تعريف الارتباط هي ملفات نصية صغيرة يتم وضعها على جهاز الكمبيوتر أو الهاتف المحمول الخاص بك عند زيارتك لموقع ويب. يتم استخدامها على نطاق واسع لتمكين المواقع من العمل، أو العمل بكفاءة أكبر، وكذلك لتوفير المعلومات لأصحاب الموقع.'
                : 'Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used in order to make websites work, or work more efficiently, as well as to provide information to the owners of the site.'}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tight">{isRtl ? 'كيف نستخدم ملفات تعريف الارتباط' : 'How We Use Cookies'}</h2>
            <div className="space-y-8">
              <div className="border-l-4 border-brand-500 dark:border-emerald-500 pl-6">
                <h3 className="text-lg font-black text-brand-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">{isRtl ? 'ملفات تعريف الارتباط الضرورية للغاية' : 'Strictly Necessary Cookies'}</h3>
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                  {isRtl ? 'هذه الملفات ضرورية لك لتصفح الموقع واستخدام ميزاته، مثل الوصول إلى المناطق الآمنة في الموقع.' : 'These cookies are essential for you to browse the website and use its features, such as accessing secure areas of the site.'}
                </p>
              </div>
              <div className="border-l-4 border-brand-500 dark:border-emerald-500 pl-6">
                <h3 className="text-lg font-black text-brand-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">{isRtl ? 'ملفات تعريف الارتباط التحليلية' : 'Analytics Cookies'}</h3>
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                  {isRtl ? 'تجمع هذه الملفات معلومات حول كيفية استخدامك لموقع الويب، مثل الصفحات التي زرتها والروابط التي نقرت عليها. لا يمكن استخدام أي من هذه المعلومات لتحديد هويتك.' : 'Also known as "performance cookies," these cookies collect information about how you use a website, like which pages you visited and which links you clicked on. None of this information can be used to identify you.'}
                </p>
              </div>
              <div className="border-l-4 border-brand-500 dark:border-emerald-500 pl-6">
                <h3 className="text-lg font-black text-brand-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">{isRtl ? 'ملفات تعريف الارتباط التسويقية' : 'Marketing Cookies'}</h3>
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                  {isRtl ? 'تتتبع هذه الملفات نشاطك عبر الإنترنت لمساعدة المعلنين على تقديم إعلانات أكثر صلة أو للحد من عدد المرات التي ترى فيها الإعلان.' : 'These cookies track your online activity to help advertisers deliver more relevant advertising or to limit how many times you see an ad.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyPage;
