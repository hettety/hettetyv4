import React, { useState } from 'react';
import {
  CheckCircle, Loader2, PlusCircle, Upload, PlayCircle, Shield, ArrowRight, ArrowLeft, Wand2, FileText, Image as ImageIcon, X, Box, Globe
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey, generateContentResilient, aiErrorMessage } from '../ai';
import { storage, ref, uploadBytes, getDownloadURL } from '../firebase';
import { Property } from '../types';

// Canonical payment-method values (stored in English) with bilingual labels.
export const PAYMENT_OPTIONS = [
  { value: 'Cash', ar: 'كاش', en: 'Cash' },
  { value: 'Installments', ar: 'تقسيط', en: 'Installments' },
  { value: 'Bank Transfer', ar: 'تحويل بنكي', en: 'Bank Transfer' },
  { value: 'Mortgage', ar: 'تمويل عقاري', en: 'Mortgage' },
];

export const PROPERTY_TYPES = [
  { value: 'Apartment', ar: 'شقة', en: 'Apartment' },
  { value: 'Villa', ar: 'فيلا', en: 'Villa' },
  { value: 'Duplex', ar: 'دوبلكس', en: 'Duplex' },
  { value: 'Penthouse', ar: 'بنتهاوس', en: 'Penthouse' },
  { value: 'Studio', ar: 'استوديو', en: 'Studio' },
  { value: 'Townhouse', ar: 'تاون هاوس', en: 'Townhouse' },
  { value: 'Chalet', ar: 'شاليه', en: 'Chalet' },
  { value: 'Office', ar: 'مكتب إداري', en: 'Office' },
  { value: 'Retail', ar: 'محل تجاري', en: 'Retail' },
  { value: 'Land', ar: 'أرض', en: 'Land' },
];

export const FINISHING_OPTIONS = [
  { value: '', ar: 'غير محدد', en: 'Unspecified' },
  { value: 'Not Finished', ar: 'على المحارة', en: 'Not Finished' },
  { value: 'Semi Finished', ar: 'نص تشطيب', en: 'Semi Finished' },
  { value: 'Finished', ar: 'تشطيب كامل', en: 'Finished' },
  { value: 'Fully Finished', ar: 'سوبر لوكس', en: 'Super Lux' },
];

/** Reads a File as a data URL, promisified so errors stay inside the caller's try/catch. */
const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
  reader.readAsDataURL(file);
});

/**
 * Uploads media to Firebase Storage and returns its public URL.
 * Media used to be stored as base64 data-URLs directly inside the Firestore
 * property document, which blows past Firestore's 1MB document limit as soon
 * as a few photos are attached — the listing save would simply fail.
 */
// On the free Spark plan Storage isn't enabled, and uploadBytes can hang for a
// long time before failing — which made uploads feel frozen. We race it against
// a short timeout so we bail to the base64 fallback fast.
const STORAGE_TIMEOUT_MS = 8000;

const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('storage-timeout')), ms)),
  ]);

const uploadToStorage = async (file: Blob, originalName: string) => {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
  const storageRef = ref(storage, `properties/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`);
  await withTimeout(uploadBytes(storageRef, file), STORAGE_TIMEOUT_MS);
  return getDownloadURL(storageRef);
};

// Firebase Storage requires the Blaze plan on newer projects. When it isn't
// enabled the upload fails, so we fall back to the legacy approach of storing
// heavily-compressed base64 data URLs inside the Firestore document itself.
// Remembered for the session so we don't pay a failed request per file.
let storageUnavailable = false;

const isDataUrl = (s: string) => s.startsWith('data:');

// ~110KB of base64 per image; capped so the property document (which also
// duplicates the first image in imageUrl) stays under Firestore's 1MB limit.
const FALLBACK_MAX_IMAGES = 6;
const FALLBACK_VIDEO_LIMIT = 500 * 1024;

// Storage hosts the file when available, so we can afford much better quality
// than the 0.08MB/800px settings needed to squeeze base64 into Firestore.
const STORAGE_COMPRESSION = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
const FIRESTORE_COMPRESSION = { maxSizeMB: 0.08, maxWidthOrHeight: 800, useWebWorker: true };

/** Compresses and stores an image, preferring Storage with a base64 fallback. */
const storeImage = async (file: File): Promise<string> => {
  if (!storageUnavailable) {
    try {
      const compressed = await imageCompression(file, STORAGE_COMPRESSION);
      return await uploadToStorage(compressed, file.name);
    } catch (err) {
      console.warn('Storage upload failed — falling back to inline base64 (Storage needs the Blaze plan)', err);
      storageUnavailable = true;
    }
  }
  const compressed = await imageCompression(file, FIRESTORE_COMPRESSION);
  return fileToDataUrl(compressed);
};

/** Stores a legal document (image or PDF) — Storage first, base64 fallback. */
const storeDocument = async (file: File): Promise<string> => {
  if (!storageUnavailable) {
    try { return await uploadToStorage(file, file.name); }
    catch (err) { console.warn('Storage document upload failed — base64 fallback', err); storageUnavailable = true; }
  }
  return fileToDataUrl(file);
};

/** Converts Arabic-Indic (٠-٩) and Persian (۰-۹) numerals to Latin 0-9. */
const toLatinDigits = (s: string) =>
  s.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
   .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0));

/** True for a recognised virtual-tour link (Matterport / Polycam / Kuula). */
const isLikelyTourUrl = (raw: string) => {
  try {
    const h = new URL((raw || '').trim()).hostname.replace(/^www\./, '');
    return h.endsWith('matterport.com') || h.endsWith('poly.cam') || h.endsWith('kuula.co');
  } catch { return false; }
};

export const AddListingPage = ({ onAdd, t, isRtl, isAdmin, isSuperAdmin }: { onAdd: (prop: Omit<Property, 'id'>) => Promise<void>, t: any, isRtl: boolean, isAdmin: boolean, isSuperAdmin: boolean }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', location: '', bedrooms: '1', bathrooms: '1', area: '',
    currency: 'EGP' as 'EGP' | 'USD',
    propertyType: 'Apartment', contactPhone: '',
    compound: '', developer: '', deliveryDate: '', finishing: '', floor: '', view: '', furnished: false,
    imageUrl: '', videoUrl: '', digitalTwinUrl: '', status: 'For Sale',
    availability: 'Available' as 'Available' | 'Sold' | 'Reserved',
    registrationNumber: '', courtSignatureValidity: false, isResale: false
  });
  // Payment methods the buyer can use; at least one is required before publishing.
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['Cash']);
  const togglePayment = (m: string) =>
    setPaymentMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  const [images, setImages] = useState<string[]>([]);
  const [panoramas, setPanoramas] = useState<string[]>([]);
  const [legalDocs, setLegalDocs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [extractingOCR, setExtractingOCR] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // The four fields the property can't be saved without (Firestore rules also
  // enforce title/price/location). Returns the list of missing labels.
  const missingBasics = () => {
    const missing: string[] = [];
    if (!formData.title.trim()) missing.push(isRtl ? 'عنوان العقار' : 'Title');
    if (!formData.price || Number(formData.price) <= 0) missing.push(isRtl ? 'السعر' : 'Price');
    if (!formData.location.trim()) missing.push(isRtl ? 'الموقع' : 'Location');
    if (!formData.area || Number(formData.area) <= 0) missing.push(isRtl ? 'المساحة' : 'Area');
    return missing;
  };
  const basicsComplete = missingBasics().length === 0;

  // Advance steps, but block leaving step 1 while required basics are missing.
  const goToStep = (target: number) => {
    if (target > 1 && step === 1) {
      const missing = missingBasics();
      if (missing.length) {
        setErrorMsg((isRtl ? 'من فضلك املأ: ' : 'Please fill in: ') + missing.join('، '));
        return;
      }
    }
    setErrorMsg('');
    setStep(target);
  };

  // Pretty-print the price with thousand separators so a long number is easy to verify.
  const formattedPrice = formData.price ? Number(formData.price).toLocaleString(isRtl ? 'ar-EG' : 'en-US') : '';

  const generateDescription = async () => {
    try {
      setGeneratingDesc(true);
      const apiKey = getGeminiApiKey();
      if (!apiKey) throw new Error("No API Key");
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Write a succinct, professional real estate description for a property in ${formData.location} with ${formData.bedrooms} bedrooms, ${formData.bathrooms} bathrooms, an area of ${formData.area} sqm, priced at ${formData.price} EGP. Status: ${formData.status}. ${isRtl ? 'Write it in Arabic.' : 'Write it in English.'}`;
      const response = await generateContentResilient(ai, { contents: prompt });
      setFormData(prev => ({ ...prev, description: response.text || "" }));
    } catch (e) {
      console.error("Description generation failed", e);
      alert(aiErrorMessage(e, isRtl));
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setExtractingOCR(true);
    // 1) Persist the document itself so it's never lost (was previously discarded).
    try {
      const url = await storeDocument(file);
      setLegalDocs(prev => [...prev, url]);
    } catch (docErr) {
      console.error('Failed to store legal document', docErr);
    }
    // 2) OCR the registry number from it.
    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey) throw new Error("No API Key");
      // await the read so any failure below is caught and the spinner always stops
      const base64 = (await fileToDataUrl(file)).split(',')[1];
      const ai = new GoogleGenAI({ apiKey });
      const response = await generateContentResilient(ai, {
        contents: [
          { role: 'user', parts: [
            { text: "Extract the official Registry Number (رقم المشهر او رقم الشهر العقاري) from this real estate deed/document. Return only the extracted number. If not found, return 'NOT_FOUND'." },
            { inlineData: { data: base64, mimeType: file.type } }
          ]}
        ]
      });
      const extracted = response.text?.trim();
      if(extracted && !extracted.includes('NOT_FOUND')) {
        setFormData(prev => ({ ...prev, registrationNumber: extracted }));
        alert(isRtl ? 'تم استخراج رقم الشهر العقاري بنجاح' : 'Registry Number extracted successfully');
      } else {
        alert(isRtl ? 'لم يتم العثور على رقم الشهر العقاري' : 'Registry Number not found');
      }
    } catch (err) {
      console.error("OCR failed", err);
      alert(aiErrorMessage(err, isRtl));
    } finally {
      setExtractingOCR(false);
    }
  };

  // Single pipeline for both the file picker and drag & drop:
  // compress → upload to Firebase Storage (or base64 fallback) → keep the URL.
  // Images are processed in parallel so a batch isn't bottlenecked one-by-one.
  const processImageFiles = async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) return;

    setUploading(true);
    setUploadProgress(5);

    let done = 0;
    const tick = () => {
      done++;
      setUploadProgress(5 + Math.round((done / imageFiles.length) * 90));
    };

    const results = await Promise.all(imageFiles.map(async (file) => {
      try {
        const url = await storeImage(file);
        tick();
        return { url };
      } catch (err) {
        console.error("Image upload failed", err);
        tick();
        return { url: null };
      }
    }));

    // Enforce the base64 cap *after* the parallel work, keeping the document small.
    let base64Count = images.filter(isDataUrl).length;
    const uploadedUrls: string[] = [];
    let failures = 0;
    let skippedForSize = 0;
    for (const r of results) {
      if (!r.url) { failures++; continue; }
      if (isDataUrl(r.url)) {
        if (base64Count >= FALLBACK_MAX_IMAGES) { skippedForSize++; continue; }
        base64Count++;
      }
      uploadedUrls.push(r.url);
    }

    if (uploadedUrls.length) {
      setImages(prev => [...prev, ...uploadedUrls]);
      setFormData(prev => (prev.imageUrl ? prev : { ...prev, imageUrl: uploadedUrls[0] }));
    }
    if (failures) {
      alert(isRtl ? `تعذر رفع ${failures} من الصور` : `${failures} image(s) failed to upload`);
    }
    if (skippedForSize) {
      alert(isRtl
        ? `الحد الأقصى ${FALLBACK_MAX_IMAGES} صور للعقار الواحد حاليًا (تم تخطي ${skippedForSize}). لرفع صور أكثر وبجودة أعلى فعّل خطة Blaze في Firebase.`
        : `Max ${FALLBACK_MAX_IMAGES} photos per listing for now (${skippedForSize} skipped). Enable the Firebase Blaze plan for more photos at higher quality.`);
    }
    setUploadProgress(100);
    setTimeout(() => setUploading(false), 400);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same files
    processImageFiles(files);
  };

  // 360° equirectangular panoramas, stored separately so the viewer knows to
  // render them inside a sphere (look-around) rather than as a flat photo.
  const handlePanoramaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setUploadProgress(5);
    const results: string[] = [];
    let failures = 0;
    let done = 0;
    await Promise.all(files.map(async (file) => {
      try { results.push(await storeImage(file)); }
      catch (err) { failures++; console.error('Panorama upload failed', err); }
      done++; setUploadProgress(5 + Math.round((done / files.length) * 90));
    }));
    // Same base64 cap as images so panoramas can't silently blow the 1MB doc limit.
    let base64Count = [...images, ...panoramas].filter(isDataUrl).length;
    const urls: string[] = [];
    let skippedForSize = 0;
    for (const url of results) {
      if (isDataUrl(url)) {
        if (base64Count >= FALLBACK_MAX_IMAGES) { skippedForSize++; continue; }
        base64Count++;
      }
      urls.push(url);
    }
    if (urls.length) setPanoramas(prev => [...prev, ...urls]);
    if (failures) alert(isRtl ? `تعذر رفع ${failures} من صور البانوراما` : `${failures} panorama(s) failed to upload`);
    if (skippedForSize) alert(isRtl
      ? `تم تخطي ${skippedForSize} بانوراما — فعّل خطة Blaze لرفع وسائط أكثر.`
      : `${skippedForSize} panorama(s) skipped — enable the Firebase Blaze plan for more media.`);
    setUploadProgress(100);
    setTimeout(() => setUploading(false), 400);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    processImageFiles(Array.from(e.dataTransfer.files));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    // Storage upload lifts the old 500KB ceiling that base64-in-Firestore imposed
    if (file.size > 50 * 1024 * 1024) {
      alert(isRtl ? 'حجم الفيديو يجب أن يكون أقل من 50 ميجابايت.' : 'Video must be under 50MB.');
      return;
    }
    setUploading(true);
    setUploadProgress(30);
    try {
      if (!storageUnavailable) {
        const url = await uploadToStorage(file, file.name);
        setFormData(prev => ({ ...prev, videoUrl: url }));
        setUploadProgress(100);
        return;
      }
      throw new Error('storage-unavailable');
    } catch (err) {
      if ((err as Error).message !== 'storage-unavailable') {
        console.warn('Storage video upload failed — trying base64 fallback', err);
        storageUnavailable = true;
      }
      // Without Storage the video has to live inside the Firestore document,
      // which only leaves room for very small clips.
      if (file.size <= FALLBACK_VIDEO_LIMIT) {
        try {
          const dataUrl = await fileToDataUrl(file);
          setFormData(prev => ({ ...prev, videoUrl: dataUrl }));
          setUploadProgress(100);
        } catch (readErr) {
          console.error("Video upload failed", readErr);
          alert(isRtl ? 'فشل رفع الفيديو' : 'Video upload failed');
        }
      } else {
        alert(isRtl
          ? 'رفع الفيديوهات الكبيرة يتطلب تفعيل خطة Blaze في Firebase. حاليًا الحد الأقصى 500 كيلوبايت للفيديو.'
          : 'Large video uploads require the Firebase Blaze plan. The current limit is 500KB per video.');
      }
    } finally {
      setTimeout(() => setUploading(false), 400);
    }
  };

  const handleSubmit = async () => {
    const missing = missingBasics();
    if (missing.length) {
      setStep(1);
      setErrorMsg((isRtl ? 'من فضلك املأ الحقول الأساسية: ' : 'Please fill in the required basics: ') + missing.join('، '));
      return;
    }
    if (uploading) {
      setErrorMsg(isRtl ? 'انتظر لحد ما يخلص رفع الصور/الفيديو.' : 'Please wait until media finishes uploading.');
      return;
    }
    if (paymentMethods.length === 0) {
      setErrorMsg(isRtl ? 'اختر طريقة دفع واحدة على الأقل.' : 'Select at least one payment method.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    
    const unitCode = `HET-${Math.floor(10000 + Math.random() * 90000)}`;
    const publishDate = new Date().toISOString().split('T')[0];

    const newProperty: any = {
      title: formData.title,
      description: formData.description,
      price: Number(formData.price),
      location: formData.location,
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      area: Number(formData.area),
      propertyType: formData.propertyType,
      currency: formData.currency,
      imageUrl: formData.imageUrl || images[0] || '',
      images: images,
      panoramas: panoramas,
      status: formData.status as 'For Sale' | 'For Rent',
      availability: formData.availability,
      isVerified: (isAdmin || isSuperAdmin),
      verificationStatus: (isAdmin || isSuperAdmin) ? 'Verified' : 'Pending',
      paymentMethods: paymentMethods,
      unitCode,
      publishDate,
      legalDocs: legalDocs,
      registrationNumber: formData.registrationNumber,
      courtSignatureValidity: formData.courtSignatureValidity,
      isResale: formData.isResale
    };

    if (formData.videoUrl) newProperty.videoUrl = formData.videoUrl;
    if (formData.digitalTwinUrl) newProperty.digitalTwinUrl = formData.digitalTwinUrl;
    if (formData.contactPhone.trim()) newProperty.contactPhone = formData.contactPhone.trim();
    if (formData.compound.trim()) newProperty.compound = formData.compound.trim();
    if (formData.developer.trim()) newProperty.developer = formData.developer.trim();
    if (formData.deliveryDate.trim()) newProperty.deliveryDate = formData.deliveryDate.trim();
    if (formData.finishing) newProperty.finishing = formData.finishing;
    if (formData.floor.trim()) newProperty.floor = formData.floor.trim();
    if (formData.view.trim()) newProperty.view = formData.view.trim();
    if (formData.furnished) newProperty.furnished = true;

    try {
      await onAdd(newProperty);
      setSuccessMessage(isRtl ? 'تم إضافة العقار بنجاح وتم نشره على المنصة.' : 'Property added successfully and published to the platform.');
      setFormData({
        title: '', description: '', price: '', location: '', bedrooms: '1', bathrooms: '1', area: '',
        currency: 'EGP',
        propertyType: 'Apartment', contactPhone: '',
        compound: '', developer: '', deliveryDate: '', finishing: '', floor: '', view: '', furnished: false,
        imageUrl: '', videoUrl: '', digitalTwinUrl: '', status: 'For Sale',
        availability: 'Available',
        registrationNumber: '', courtSignatureValidity: false, isResale: false
      });
      setPaymentMethods(['Cash']);
      setImages([]);
      setPanoramas([]);
      setLegalDocs([]);
      setStep(1);
    } catch (err) {
      console.error("Failed to publish property", err);
      alert(isRtl ? 'فشل نشر العقار، حاول مرة أخرى.' : 'Failed to publish the property. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center animate-fade-in">
        <div className="bg-green-50 text-green-800 p-8 rounded-2xl border border-green-200 shadow-lg">
          <CheckCircle className="mx-auto h-16 w-16 mb-4 text-green-500" />
          <h2 className="text-2xl font-heading font-black mb-2">{isRtl ? 'تم النشر' : 'Published'}</h2>
          <p className="text-lg font-medium">{successMessage}</p>
          <button onClick={() => setSuccessMessage('')} className="mt-8 px-6 py-3 bg-brand-600 text-white rounded-xl shadow-md font-bold">
            {isRtl ? 'إضافة عقار آخر' : 'Add Another Property'}
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, title: isRtl ? 'المعلومات الأساسية' : 'Basic Info', icon: FileText },
    { id: 2, title: isRtl ? 'الوسائط' : 'Media', icon: ImageIcon },
    { id: 3, title: isRtl ? 'الوثائق القانونية' : 'Legal Docs', icon: Shield }
  ];

  const labelCls = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2";
  const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all text-slate-900 dark:text-white";
  const selectCls = inputCls + " appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in transition-colors duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-slate-900 dark:bg-black rounded-xl flex items-center justify-center shadow-lg">
          <PlusCircle className="text-accent-500" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-black text-slate-900 dark:text-white tracking-tight">{isRtl ? 'إضافة عقار جديد' : 'Add New Listing'}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{isRtl ? 'إضافة العقار مجانية تماماً للمشرفين.' : 'Adding a property is completely free for admins.'}</p>
        </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between relative">
         <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800 -z-10 hidden md:block rounded-full"></div>
         <div className="absolute top-1/2 left-0 h-1 bg-brand-500 transition-all duration-500 -z-10 hidden md:block rounded-full" style={{ width: `${(step - 1) * 50}%`}}></div>
         {steps.map(s => (
             <div key={s.id} onClick={() => goToStep(s.id)} className={`flex items-center gap-3 px-6 py-3 rounded-full cursor-pointer transition-all ${step === s.id ? 'bg-brand-600 text-white shadow-lg scale-105' : step > s.id ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                 <s.icon size={18} />
                 <span className="font-bold text-sm">{s.title}</span>
                 {step > s.id && <CheckCircle size={16} className="ml-2" />}
             </div>
         ))}
      </div>

      {errorMsg && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-5 py-4 rounded-2xl animate-fade-in">
          <X size={18} className="mt-0.5 shrink-0" />
          <p className="text-sm font-bold">{errorMsg}</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl min-h-[400px]">
        {step === 1 && (
            <div className="space-y-6 animate-fade-in">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{isRtl ? 'عنوان العقار' : 'Property Title'} <span className="text-red-500">*</span></label>
                        <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all text-slate-900 dark:text-white" placeholder={isRtl ? 'مثال: شقة 150م بالتجمع الخامس' : 'e.g. Luxury Villa in New Cairo'} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{isRtl ? 'السعر' : 'Price'} <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                          <input required type="text" inputMode="numeric" value={formData.price} onChange={e => { const val = toLatinDigits(e.target.value).replace(/[^0-9]/g, ''); setFormData({...formData, price: val}); }} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all text-slate-900 dark:text-white" placeholder="0" />
                          <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value as 'EGP' | 'USD'})} className="px-3 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white font-bold">
                            <option value="EGP">{isRtl ? 'ج.م' : 'EGP'}</option>
                            <option value="USD">USD</option>
                          </select>
                        </div>
                        {formattedPrice && <p className="text-xs font-bold text-brand-600 dark:text-brand-400 mt-1.5">{formattedPrice} {formData.currency === 'USD' ? 'USD' : (isRtl ? 'جنيه' : 'EGP')}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{isRtl ? 'الموقع' : 'Location'} <span className="text-red-500">*</span></label>
                        <input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all text-slate-900 dark:text-white" placeholder={isRtl ? 'مثال: التجمع الخامس، القاهرة' : 'e.g. New Cairo, Cairo'} />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{isRtl ? 'الغرف' : 'Beds'}</label>
                        <input required type="number" min="0" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{isRtl ? 'الحمامات' : 'Baths'}</label>
                        <input required type="number" min="0" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{isRtl ? 'المساحة (م²)' : 'm²'} <span className="text-red-500">*</span></label>
                        <input required type="number" min="1" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white" />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                       <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{isRtl ? 'الحالة' : 'Status'}</label>
                       <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat text-slate-900 dark:text-white">
                         <option value="For Sale">{isRtl ? 'للبيع' : 'For Sale'}</option>
                         <option value="For Rent">{isRtl ? 'للإيجار' : 'For Rent'}</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{isRtl ? 'حالة التوفر' : 'Availability'}</label>
                       <select value={formData.availability} onChange={e => setFormData({...formData, availability: e.target.value as 'Available' | 'Sold' | 'Reserved'})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat text-slate-900 dark:text-white">
                         <option value="Available">{isRtl ? 'متاح' : 'Available'}</option>
                         <option value="Reserved">{isRtl ? 'محجوز' : 'Reserved'}</option>
                         <option value="Sold">{formData.status === 'For Rent' ? (isRtl ? 'مؤجَّر' : 'Rented') : (isRtl ? 'مباع' : 'Sold')}</option>
                       </select>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                       <label className={labelCls}>{isRtl ? 'نوع العقار' : 'Property Type'}</label>
                       <select value={formData.propertyType} onChange={e => setFormData({...formData, propertyType: e.target.value})} className={selectCls}>
                         {PROPERTY_TYPES.map(o => <option key={o.value} value={o.value}>{isRtl ? o.ar : o.en}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className={labelCls}>{isRtl ? 'رقم التواصل (اتصال + واتساب)' : 'Contact Phone (call + WhatsApp)'}</label>
                       <input type="tel" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: toLatinDigits(e.target.value)})} className={inputCls} placeholder="+20 1XX XXX XXXX" dir="ltr" />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{isRtl ? 'تفاصيل إضافية (اختياري)' : 'Extra details (optional)'}</p>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className={labelCls}>{isRtl ? 'الكمبوند / المشروع' : 'Compound / Project'}</label>
                        <input value={formData.compound} onChange={e => setFormData({...formData, compound: e.target.value})} className={inputCls} placeholder={isRtl ? 'مثال: ماونتن فيو iCity' : 'e.g. Mountain View iCity'} />
                      </div>
                      <div>
                        <label className={labelCls}>{isRtl ? 'المطوّر' : 'Developer'}</label>
                        <input value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})} className={inputCls} placeholder={isRtl ? 'مثال: ماونتن فيو' : 'e.g. Mountain View'} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className={labelCls}>{isRtl ? 'الاستلام' : 'Delivery'}</label>
                        <input value={formData.deliveryDate} onChange={e => setFormData({...formData, deliveryDate: e.target.value})} className={inputCls} placeholder={isRtl ? 'جاهز / 2027' : 'Ready / 2027'} />
                      </div>
                      <div>
                        <label className={labelCls}>{isRtl ? 'التشطيب' : 'Finishing'}</label>
                        <select value={formData.finishing} onChange={e => setFormData({...formData, finishing: e.target.value})} className={selectCls}>
                          {FINISHING_OPTIONS.map(o => <option key={o.value} value={o.value}>{isRtl ? o.ar : o.en}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>{isRtl ? 'الدور' : 'Floor'}</label>
                        <input value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} className={inputCls} placeholder={isRtl ? 'أرضي / 3' : 'Ground / 3'} />
                      </div>
                      <div>
                        <label className={labelCls}>{isRtl ? 'الفيو' : 'View'}</label>
                        <input value={formData.view} onChange={e => setFormData({...formData, view: e.target.value})} className={inputCls} placeholder={isRtl ? 'حديقة / بحر' : 'Garden / Sea'} />
                      </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer mt-4 w-fit">
                      <input type="checkbox" checked={formData.furnished} onChange={e => setFormData({...formData, furnished: e.target.checked})} className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-slate-300" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{isRtl ? 'مفروش' : 'Furnished'}</span>
                    </label>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{isRtl ? 'طرق الدفع المتاحة' : 'Accepted Payment Methods'} <span className="text-red-500">*</span></label>
                    <div className="flex flex-wrap gap-3">
                      {PAYMENT_OPTIONS.map(opt => {
                        const active = paymentMethods.includes(opt.value);
                        return (
                          <button
                            type="button"
                            key={opt.value}
                            onClick={() => togglePayment(opt.value)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${active ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400'}`}
                          >
                            {active && <CheckCircle size={15} />}
                            {isRtl ? opt.ar : opt.en}
                          </button>
                        );
                      })}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{isRtl ? 'الوصف' : 'Description'}</label>
                        <button type="button" onClick={generateDescription} disabled={generatingDesc} className="text-xs bg-brand-100 hover:bg-brand-200 text-brand-700 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 dark:text-brand-300 px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors">
                            {generatingDesc ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                            {isRtl ? 'ذكاء اصطناعي' : 'Auto AI'}
                        </button>
                    </div>
                    <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white" placeholder={isRtl ? 'وصف العقار...' : 'Property description...'}></textarea>
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{isRtl ? 'صور العقار' : 'Property Images'}</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{isRtl ? 'الصور بتظهر في الجولة ثلاثية الأبعاد 360° — كل ما ترفع صور أكتر للغرف، الجولة تبقى أحلى. أول صورة هي الرئيسية.' : 'Photos power the 360° 3D tour — the more rooms you add, the better the tour. The first photo is the cover.'}</p>
                  <div 
                     onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                     onDrop={handleDrop}
                     className={`relative group border-2 border-dashed rounded-3xl p-8 text-center transition-all ${uploading ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-300 dark:border-slate-700 hover:border-brand-500 hover:bg-white dark:hover:bg-slate-800'}`}
                  >
                     <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="multi-image-upload" disabled={uploading}/>
                     <label htmlFor="multi-image-upload" className="cursor-pointer block">
                         <Upload className="text-slate-400 mx-auto mb-4 group-hover:text-brand-500 transition-colors" size={40} />
                         <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">{isRtl ? 'اسحب ואفلت الصور هنا' : 'Drag & Drop Images here'}</h3>
                         <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{isRtl ? 'أو انقر للاستعراض' : 'or click to browse'}</p>
                     </label>
                     {uploading && (
                         <div className="absolute bottom-4 left-8 right-8">
                             <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                 <div className="h-full bg-brand-600 transition-all duration-300" style={{ width: `${uploadProgress}%`}}></div>
                             </div>
                             <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">{uploadProgress}%</p>
                         </div>
                     )}
                  </div>

                  {images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                          {images.map((img, i) => (
                              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm group">
                                  <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Preview"/>
                                  <button onClick={() => {
                                      const removed = images[i];
                                      const next = images.filter((_, idx) => idx !== i);
                                      setImages(next);
                                      // keep the main image in sync when it gets deleted
                                      if (formData.imageUrl === removed) {
                                        setFormData(prev => ({ ...prev, imageUrl: next[0] || '' }));
                                      }
                                  }} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600">
                                      <X size={12} />
                                      <span className="sr-only">Delete</span>
                                  </button>
                                  {i === 0 ? (
                                    <span className="absolute bottom-2 left-2 bg-brand-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow">{isRtl ? 'الرئيسية' : 'Main'}</span>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setImages(prev => { const arr = [...prev]; const [it] = arr.splice(i, 1); arr.unshift(it); return arr; });
                                        setFormData(prev => ({ ...prev, imageUrl: img }));
                                      }}
                                      className="absolute bottom-2 left-2 bg-black/70 hover:bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      {isRtl ? 'اجعلها الرئيسية' : 'Set as cover'}
                                    </button>
                                  )}
                              </div>
                          ))}
                      </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <PlayCircle size={18} className="text-accent-500" />
                      {isRtl ? 'فيديو العقار' : 'Property Video'}
                    </div>
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      id="video-upload"
                      disabled={uploading}
                    />
                    <label 
                      htmlFor="video-upload" 
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                        formData.videoUrl ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-300 dark:border-slate-700 hover:border-brand-500 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      {formData.videoUrl ? (
                         <div className="text-center">
                            <PlayCircle className="text-brand-500 mx-auto mb-2" size={32} />
                            <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{isRtl ? 'تم إرفاق الفيديو بنجاح (انقر لتغيير)' : 'Video Attached Successfully (Click to Change)'}</p>
                         </div>
                      ) : (
                         <div className="text-center p-4">
                            <Upload className="text-slate-400 mx-auto mb-2 group-hover:text-brand-500 transition-colors" size={32} />
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{isRtl ? 'انقر لرفع فيديو' : 'Click to Upload Video'}</p>
                            <p className="text-xs text-slate-500 mt-1">{isRtl ? 'الحد الأقصى 50 ميجابايت' : 'Max size 50MB'}</p>
                         </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* 360° panoramas */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <div className="flex items-center gap-2">
                      <Box size={18} className="text-brand-500" />
                      {isRtl ? 'صور بانوراما 360°' : '360° Panorama Photos'}
                    </div>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {isRtl
                      ? 'صور بزاوية 360 (من كاميرا 360 أو وضع البانوراما) — هتظهر كجولة تلف جواها 360 درجة.'
                      : 'Equirectangular 360° shots (from a 360 camera or panorama mode) — shown as a look-around tour.'}
                  </p>
                  <input type="file" multiple accept="image/*" onChange={handlePanoramaUpload} className="hidden" id="panorama-upload" disabled={uploading} />
                  <label htmlFor="panorama-upload" className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-2xl cursor-pointer transition-all bg-slate-50 dark:bg-slate-800/30 border-slate-300 dark:border-slate-700 hover:border-brand-500 hover:bg-white dark:hover:bg-slate-800 group">
                    <Box className="text-slate-400 mb-2 group-hover:text-brand-500 transition-colors" size={28} />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{isRtl ? 'انقر لرفع صور 360°' : 'Click to upload 360° photos'}</p>
                  </label>
                  {panoramas.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      {panoramas.map((img, i) => (
                        <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                          <img src={img} className="w-full h-full object-cover" alt="Panorama" />
                          <span className="absolute top-1.5 left-1.5 bg-brand-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">360°</span>
                          <button onClick={() => setPanoramas(panoramas.filter((_, idx) => idx !== i))} className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Real virtual tour link (Matterport / Polycam / Kuula …) */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <div className="flex items-center gap-2">
                      <Globe size={18} className="text-accent-500" />
                      {isRtl ? 'رابط الجولة الافتراضية الحقيقية' : 'Real Virtual Tour Link'}
                    </div>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {isRtl
                      ? 'صوّر الوحدة بتطبيق Matterport أو Polycam والصق اللينك هنا — هيظهر كجولة كاملة تتمشى جواها.'
                      : 'Scan the unit with Matterport or Polycam and paste the link — shown as a full walkthrough tour.'}
                  </p>
                  <input
                    type="url"
                    value={formData.digitalTwinUrl}
                    onChange={e => setFormData({ ...formData, digitalTwinUrl: e.target.value })}
                    placeholder="https://my.matterport.com/show/?m=... | https://poly.cam/capture/..."
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none transition-all text-slate-900 dark:text-white text-sm dark:bg-slate-800 ${
                      formData.digitalTwinUrl.trim() && !isLikelyTourUrl(formData.digitalTwinUrl)
                        ? 'border-amber-400 focus:ring-amber-400 dark:border-amber-500/60'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500'
                    }`}
                  />
                  {formData.digitalTwinUrl.trim() && !isLikelyTourUrl(formData.digitalTwinUrl) && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                      {isRtl ? '⚠️ اللينك لازم يكون من Matterport أو Polycam أو Kuula علشان الجولة تشتغل.' : '⚠️ Link should be a Matterport, Polycam or Kuula URL for the tour to load.'}
                    </p>
                  )}
                </div>
            </div>
        )}

        {step === 3 && (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 p-6 rounded-3xl mb-6">
                   <h3 className="text-orange-800 dark:text-orange-300 font-bold mb-2 flex items-center gap-2"><Shield size={18} /> {isRtl ? 'الوثائق القانونية' : 'Legal Documentation'}</h3>
                   <p className="text-sm text-orange-700 dark:text-orange-400/80 mb-4 tracking-wide leading-relaxed">
                       {isRtl ? 'ارفع صورة من العقد وسيقوم الذكاء الاصطناعي باستخراج رقم الشهر العقاري.' : 'Upload a contract image and AI will extract the Registry Number.'}
                   </p>
                   
                   <div className="relative group">
                       <input type="file" accept="image/*,application/pdf" onChange={handleDocumentUpload} className="hidden" id="legal-upload" disabled={extractingOCR}/>
                       <label htmlFor="legal-upload" className="inline-flex cursor-pointer items-center justify-center bg-white dark:bg-slate-800 px-6 py-3 rounded-xl border border-orange-200 dark:border-orange-500/30 hover:border-orange-400 text-orange-700 dark:text-orange-300 font-bold transition-all shadow-sm">
                           {extractingOCR ? <Loader2 size={18} className="animate-spin mr-2" /> : <Wand2 size={18} className="mr-2" />}
                           {isRtl ? 'استخراج ذكي (OCR)' : 'Smart OCR Extract'}
                       </label>
                   </div>
                   {legalDocs.length > 0 && (
                     <div className="mt-4 flex flex-wrap gap-2">
                       {legalDocs.map((_, i) => (
                         <span key={i} className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-300 text-xs font-bold px-3 py-1.5 rounded-lg">
                           <FileText size={14} /> {isRtl ? `مستند ${i + 1}` : `Document ${i + 1}`}
                           <button onClick={() => setLegalDocs(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-600"><X size={12} /></button>
                         </span>
                       ))}
                     </div>
                   )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{isRtl ? 'رقم الشهر العقاري' : 'Registry Number'}</label>
                        <input value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white" placeholder={isRtl ? 'اختياري' : 'Optional'} />
                    </div>
                </div>
                
                <div className="flex flex-col space-y-4 pt-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={formData.courtSignatureValidity} onChange={e => setFormData({...formData, courtSignatureValidity: e.target.checked})} className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-slate-300" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{isRtl ? 'صحة توقيع محكمة' : 'Court Signature Validity'}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={formData.isResale} onChange={e => setFormData({...formData, isResale: e.target.checked})} className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-slate-300" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{isRtl ? 'إعادة بيع (Resale)' : 'Resale Property'}</span>
                    </label>
                </div>
            </div>
        )}
      </div>

      <div className="mt-8 flex justify-between items-center">
         {step > 1 ? (
             <button onClick={() => goToStep(step - 1)} className="px-6 py-3 rounded-xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-all">
                 <ArrowLeft size={18} /> {isRtl ? 'السابق' : 'Back'}
             </button>
         ) : <div></div>}

         {step < 3 ? (
             <button onClick={() => goToStep(step + 1)} className="px-8 py-3 rounded-xl font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md hover:bg-black dark:hover:bg-white flex items-center gap-2 transition-all">
                 {isRtl ? 'التالي' : 'Next'} <ArrowRight size={18} />
             </button>
         ) : (
             <button onClick={handleSubmit} disabled={submitting || uploading || !basicsComplete} className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-accent-600 to-accent-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 transition-all">
                 {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                 {submitting ? (isRtl ? 'جاري النشر...' : 'Publishing...') : (isRtl ? 'نشر العقار' : 'Deploy Listing')}
             </button>
         )}
      </div>
    </div>
  );
};
