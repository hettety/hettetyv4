import React from 'react';
import { Shield } from 'lucide-react';

interface PrivacyPageProps {
  t: any;
  isRtl: boolean;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ t, isRtl }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-24 transition-colors duration-500" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-500/10 dark:bg-emerald-500/20 mb-6 shadow-sm border border-brand-500/20 dark:border-emerald-500/20">
            <Shield className="w-10 h-10 text-brand-600 dark:text-emerald-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tighter">
            {t.nav_privacy}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
            {isRtl ? 'كيف نقوم بجمع واستخدام وحماية بياناتك.' : 'How we collect, use, and protect your data.'}
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">1. {isRtl ? 'المعلومات التي نجمعها' : 'Information We Collect'}</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-medium">
              {isRtl 
                ? 'نجمع المعلومات التي تقدمها لنا مباشرة، كما هو الحال عند إنشاء حسابك أو تعديله، أو طلب خدمات عند الطلب، أو الاتصال بدعم العملاء، أو التواصل معنا بأي طريقة أخرى.'
                : 'We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.'}
            </p>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-3 ml-4 font-medium">
              <li>{isRtl ? 'الاسم، البريد الإلكتروني، ورقم الهاتف.' : 'Name, email, and phone number.'}</li>
              <li>{isRtl ? 'تفضيلات العقارات وتاريخ البحث.' : 'Property preferences and search history.'}</li>
              <li>{isRtl ? 'معلومات الجهاز والمتصفح.' : 'Device and browser information.'}</li>
            </ul>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">2. {isRtl ? 'كيف نستخدم معلوماتك' : 'How We Use Your Information'}</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {isRtl
                ? 'نستخدم المعلومات التي نجمعها عنك لتقديم خدماتنا وصيانتها وتحسينها، بما في ذلك تسهيل المدفوعات، وإرسال الإيصالات، وتقديم المنتجات والخدمات التي تطلبها، وتطوير ميزات جديدة، وتقديم دعم العملاء، وتطوير ميزات الأمان، والمصادقة على المستخدمين.'
                : 'We use the information we collect about you to provide, maintain, and improve our services, including to facilitate payments, send receipts, provide products and services you request (and send related information), develop new features, provide customer support to Users and Agents, develop safety features, authenticate users, and send product updates and administrative messages.'}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">3. {isRtl ? 'أمن البيانات' : 'Data Security'}</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {isRtl
                ? 'نحن نتخذ تدابير معقولة للمساعدة في حماية المعلومات المتعلقة بك من الفقدان والسرقة وسوء الاستخدام والوصول غير المصرح به والكشف والتغيير والتدمير.'
                : 'We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
