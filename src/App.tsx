/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, MapPin, Users, Globe, ShieldCheck, 
  Sparkles, Code2, Menu, X, Home, Search, 
  MessageSquareText, FileText, Box, ArrowRight,
  CheckCircle, PlayCircle, Send, Upload, Clock,
  DollarSign, BedDouble, Bath, Maximize, Loader2,
  Check, FileCheck, Key, RefreshCw, LayoutTemplate,
  User, ArrowLeft, Phone, Target, CreditCard, PlusCircle, Edit2, Save, LogOut, Shield, Trash2, Bell, Lock as LockIcon,
  Plus, History, PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight, MessageSquare, Sun, Moon, Heart
} from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { AddListingPage } from './components/add-listing-page';
import { INITIAL_ENTITY_DATA, TRANSLATIONS } from './constants';
import { Property, ChatMessage, UserDocument, Page, Notification, ChatSession } from './types';
import imageCompression from 'browser-image-compression';
import { api } from './mockApi';
import { 
  auth, db, storage, googleProvider, signInWithPopup, signOut, onAuthStateChanged,
  doc, getDoc, setDoc, collection, getDocs, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc,
  ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject,
  handleFirestoreError, OperationType
} from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import AboutPage from './components/AboutPage';
import { BuyPropertyPage, VerificationPage, Tours3DPage } from './components/ServicePages';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import CookiePolicyPage from './components/CookiePolicyPage';
import CookieConsent from './components/CookieConsent';
import PremiumHero from './components/PremiumHero';

// --- Components ---

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
      className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex flex-col items-center justify-center overflow-hidden transition-colors duration-500"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative flex flex-col items-center gap-12"
      >
        <div className="relative">
          {/* Decorative Background Pulsing Glow */}
          <motion.div 
             animate={{ 
               scale: [1, 1.2, 1],
               opacity: [0.1, 0.3, 0.1]
             }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
             className="absolute inset-[-50%] bg-brand-500/20 blur-[100px] rounded-full"
          />
          <Logo className="h-44 md:h-56 w-auto relative z-10 text-brand-900 dark:text-white transition-colors" />
        </div>
        
        <div className="text-center space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-black text-brand-900 dark:text-white tracking-tighter mb-4 italic uppercase">
              HETTETY
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-0.5 w-12 bg-brand-200 dark:bg-slate-800"></div>
              <p className="text-brand-600 dark:text-brand-400 font-black uppercase tracking-[0.4em] text-xs md:text-sm">
                Real Estate Ecosystem
              </p>
              <div className="h-0.5 w-12 bg-brand-200 dark:bg-slate-800"></div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showButton ? 1 : 0 }}
            className="pt-10"
          >
            <button 
              onClick={onFinish}
              className="px-10 py-4 bg-brand-600 text-white font-black uppercase tracking-[0.2em] text-sm rounded-full hover:bg-brand-700 shadow-2xl shadow-brand-500/30 transform hover:-translate-y-1 active:scale-95 transition-all cursor-pointer border border-brand-500"
            >
              Enter HETTETY
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Loading Progress Bar */}
      {!showButton && (
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 3, ease: "linear" }}
          className="absolute bottom-0 left-0 right-0 h-2 bg-brand-600 origin-left"
        />
      )}
    </motion.div>
  );
};

const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'accent' | 'outline' | 'ghost' | 'white' | 'black'; 
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}> = ({ children, onClick, variant = 'primary', className = "", disabled = false, type = "button" }) => {
  const base = "px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-95 disabled:active:scale-100 cursor-pointer";
  const variants = {
    primary: "bg-brand-500 text-white hover:bg-brand-600 hover:shadow-lg shadow-brand-500/20",
    accent: "bg-accent-500 text-white hover:bg-accent-600 hover:shadow-lg shadow-accent-500/20",
    outline: "border-2 border-brand-500 text-brand-600 hover:bg-brand-50",
    ghost: "text-slate-600 hover:text-brand-600 hover:bg-slate-100",
    white: "bg-white text-brand-900 hover:bg-brand-50 hover:shadow-xl",
    black: "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl"
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );
};

const Logo: React.FC<{ color?: string; className?: string }> = ({ color = "currentColor", className = "h-12" }) => {
  const isWhite = color === "white" || color === "#ffffff";
  const isCurrent = color === "currentColor";
  const primaryColor = isCurrent ? "currentColor" : (isWhite ? "#ffffff" : color);
  const orangeColor = isWhite ? "#ffffff" : "#e67e22";

  const drawAnimation = {
    pathLength: [0, 1],
    opacity: [0, 1]
  };

  const drawTransition = {
    duration: 1.5,
    repeat: Infinity,
    repeatDelay: 8.5,
    ease: "easeInOut"
  };

  return (
    <motion.svg 
      viewBox="0 40 200 150" 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
      animate={{ 
        scale: [1, 1.05, 1],
      }}
      transition={{ 
        duration: 2, 
        repeat: Infinity, 
        repeatDelay: 8,
        ease: "easeInOut"
      }}
    >
      {/* Orange Roof */}
      <motion.path 
        d="M 25 110 L 100 45 L 175 110 L 155 110 L 100 62 L 45 110 Z" 
        fill={orangeColor}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={drawAnimation}
        transition={drawTransition as any}
      />
      
      {/* Window Panes */}
      <motion.g 
        transform="translate(93, 82)"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1] }}
        transition={{ ...drawTransition, delay: 0.5 } as any}
      >
        <rect x="0" y="0" width="6" height="6" fill={orangeColor} />
        <rect x="8" y="0" width="6" height="6" fill={orangeColor} />
        <rect x="0" y="8" width="6" height="6" fill={orangeColor} />
        <rect x="8" y="8" width="6" height="6" fill={orangeColor} />
      </motion.g>

      {/* Navy Stylized H / Logo mark */}
      <g>
        {/* Top bar of the H with angled edges */}
        <motion.path 
          d="M 68 110 L 132 110 L 122 124 L 78 124 Z" 
          fill={primaryColor}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={drawAnimation}
          transition={{ ...drawTransition, delay: 0.3 } as any}
        />
        
        {/* Left vertical with J hook */}
        <motion.path 
          d="M 83 124 L 93 124 L 93 160 C 93 182 66 182 67 160 L 78 160 C 78 170 83 170 83 160 Z" 
          fill={primaryColor}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={drawAnimation}
          transition={{ ...drawTransition, delay: 0.5 } as any}
        />
        
        {/* Right vertical component */}
        <motion.path 
          d="M 107 124 L 117 124 L 117 185 L 107 185 Z" 
          fill={primaryColor}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={drawAnimation}
          transition={{ ...drawTransition, delay: 0.7 } as any}
        />
        
        {/* Middle connector */}
        <motion.path 
          d="M 93 142 L 107 142 L 107 154 L 93 154 Z" 
          fill={primaryColor}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={drawAnimation}
          transition={{ ...drawTransition, delay: 0.9 } as any}
        />
      </g>
    </motion.svg>
  );
};

const PropertyCard: React.FC<{ 
  property: Property; 
  onView3D: () => void; 
  onToggleFavorite?: () => void;
  isFavorited?: boolean;
  onClick?: () => void; 
  t: any; 
  isRtl: boolean 
}> = ({ property, onView3D, onToggleFavorite, isFavorited, onClick, t, isRtl }) => (
  <div onClick={onClick} className={`group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:shadow-none transition-all duration-300 overflow-hidden flex flex-col h-full animate-fade-in ${onClick ? 'cursor-pointer' : ''}`}>
    <div className="relative h-64 overflow-hidden">
      <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm`}>
        {property.status === 'For Sale' ? t.prop_forsale : t.prop_forrent}
      </div>
      {(property.isVerified || property.verificationStatus === 'Verified') && (
        <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-12'} bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm`}>
          <ShieldCheck size={12} /> {property.verificationStatus === 'Verified' ? (isRtl ? 'أصلي + ثقة وقانون' : 'Verified Legal') : t.prop_verified}
        </div>
      )}
      {onToggleFavorite && (
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} p-2 rounded-full backdrop-blur-md transition-all shadow-lg ${isFavorited ? 'bg-red-500 text-white' : 'bg-white/40 text-white hover:bg-white/60'}`}
        >
          <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end">
        <button onClick={(e) => { e.stopPropagation(); onView3D(); }} className="bg-white/20 hover:bg-white text-white hover:text-brand-900 backdrop-blur border border-white/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer">
          <Box size={16} /> {t.prop_view_3d}
        </button>
      </div>
    </div>
    <div className="p-6 flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white line-clamp-1">{property.title}</h3>
        <span className="text-brand-600 dark:text-brand-400 font-bold whitespace-nowrap">
          {property.price.toLocaleString()} EGP
        </span>
      </div>
      <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-3">
        <MapPin size={14} className={isRtl ? "ml-1" : "mr-1"} /> {property.location}
      </div>
      {property.unitCode && (
        <div className="text-xs text-slate-400 dark:text-slate-500 mb-3 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded inline-block w-fit">
          {isRtl ? 'كود الوحدة:' : 'Unit Code:'} {property.unitCode}
        </div>
      )}
      {property.paymentMethods && property.paymentMethods.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {property.paymentMethods.map(method => (
            <span key={method} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] uppercase tracking-wider font-bold rounded">
              {method}
            </span>
          ))}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 py-4 border-t border-slate-100 mt-auto">
        <div className="flex flex-col items-center text-slate-600">
          <BedDouble size={20} className="mb-1 text-brand-400" />
          <span className="text-xs font-medium">{property.bedrooms} {t.prop_beds}</span>
        </div>
        <div className="flex flex-col items-center text-slate-600">
          <Bath size={20} className="mb-1 text-brand-400" />
          <span className="text-xs font-medium">{property.bathrooms} {t.prop_baths}</span>
        </div>
        <div className="flex flex-col items-center text-slate-600">
          <Maximize size={20} className="mb-1 text-brand-400" />
          <span className="text-xs font-medium">{property.area} m²</span>
        </div>
      </div>
    </div>
  </div>
);

// --- Sections ---

const AuthForm = ({ type, onSwitch, onSubmit, t, isRtl }: { type: 'login' | 'register', onSwitch: () => void, onSubmit: (email: string) => void, t: any, isRtl: boolean }) => {
  const isLogin = type === 'login';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 0) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Za-z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score; // 0 to 4
  };

  const strength = calculateStrength(password);
  const strengthLabels = ['', t.auth_pass_weak || 'Weak', t.auth_pass_fair || 'Fair', t.auth_pass_good || 'Good', t.auth_pass_strong || 'Strong'];
  const strengthColors = ['bg-slate-200', 'bg-red-500', 'bg-yellow-500', 'bg-brand-400', 'bg-green-500'];

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        if (isLogin) {
          // If trying to login but doesn't exist, prompt to register
          await signOut(auth);
          setError(isRtl ? 'هذا الحساب غير موجود، يرجى التسجيل أولاً' : 'This account does not exist. Please register first.');
          setLoading(false);
          return;
        } else {
          // Create new user profile
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: user.displayName || '',
            email: user.email || '',
            role: (user.email === 'abdallahahmedpilot2426@gmail.com' || user.email === 'marwaneltaweel0@gmail.com' || user.email === 'pro.mahmoud.h@gmail.com') ? 'admin' : 'user',
            createdAt: new Date().toISOString()
          });
        }
      }
      
      onSubmit(user.email || '');
    } catch (err: any) {
      // Clear loading state immediately
      setLoading(false);
      
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User intentionally closed the popup or cancelled, no need to show a scary error
        setError('');
      } else {
        console.error("Google Sign In Error:", err);
        setError(err.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        try {
          const result = await signInWithEmailAndPassword(auth, email, password);
          const userDoc = await getDoc(doc(db, 'users', result.user.uid));
          if (!userDoc.exists()) {
            await signOut(auth);
            setError(isRtl ? 'هذا الحساب غير موجود، يرجى التسجيل أولاً' : 'This account does not exist. Please register first.');
            setLoading(false);
            return;
          }
          onSubmit(email);
        } catch (err: any) {
          if (err.code === 'auth/user-not-found') {
            setError(isRtl ? 'هذا الحساب غير موجود، يرجى التسجيل أولاً' : 'This account does not exist. Please register first.');
          } else if (err.code === 'auth/unauthorized-domain') {
            setError(isRtl ? 'نطاق غير مصرح به. يرجى إضافة هذا النطاق في إعدادات Firebase.' : 'Unauthorized domain. Please add this domain in Firebase settings.');
          } else {
            setError(err.message);
          }
        }
      } else {
        // Register
        if (password.length < 8 || !/[^A-Za-z0-9]/.test(password)) {
          setError(t.auth_pass_req || 'Password must be at least 8 characters and include a special character.');
          setLoading(false);
          return;
        }
        
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          name: name,
          email: email,
          role: (email === 'abdallahahmedpilot2426@gmail.com' || email === 'marwaneltaweel0@gmail.com' || email === 'pro.mahmoud.h@gmail.com') ? 'admin' : 'user',
          createdAt: new Date().toISOString()
        });
        onSubmit(email);
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError(isRtl ? 'يرجى تفعيل تسجيل الدخول بالبريد الإلكتروني في لوحة تحكم Firebase.' : 'Please enable Email/Password authentication in the Firebase Console.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(isRtl ? 'نطاق غير مصرح به. يرجى إضافة هذا النطاق في إعدادات Firebase.' : 'Unauthorized domain. Please add this domain in Firebase settings.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 animate-fade-in relative transition-colors duration-500">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 mb-4">
            <User size={24} />
          </div>
          <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
            {isLogin ? t.auth_welcome : t.auth_create}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            {isLogin ? t.auth_login_desc : t.auth_reg_desc}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
           {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.auth_name}</label>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-slate-900 dark:text-white" 
                  placeholder="John Doe" 
                />
              </div>
           )}
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.auth_email}</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-slate-900 dark:text-white" 
                placeholder="you@example.com" 
              />
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.auth_pass}</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-slate-900 dark:text-white" 
                placeholder="••••••••" 
              />
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div key={level} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${strength >= level ? strengthColors[strength] : 'bg-slate-100 dark:bg-slate-800'}`}></div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-medium ${strengthColors[strength].replace('bg-', 'text-')}`}>{strengthLabels[strength]}</span>
                    <span className="text-slate-400">{t.auth_pass_req}</span>
                  </div>
                </div>
              )}
           </div>

           {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

           <Button type="submit" disabled={loading} className="w-full mt-6">
             {loading ? <Loader2 className="animate-spin" /> : (isLogin ? t.auth_signin_btn : t.auth_signup_btn)}
           </Button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">{t.auth_or_continue || 'Or continue with'}</span>
            </div>
          </div>

          <div className="mt-6">
            <button 
              type="button" 
              onClick={handleGoogleSignIn} 
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 font-medium cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t.auth_google || 'Google'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {isLogin ? t.auth_no_account : t.auth_has_account}
          </span>
          <button onClick={onSwitch} className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 cursor-pointer ml-1">
            {isLogin ? t.nav_register : t.nav_login_short}
          </button>
        </div>
      </div>
    </div>
  )
};

const ComingSoon3D = ({ t, isRtl }: { t: any, isRtl: boolean }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 animate-fade-in transition-colors duration-500">
       {/* Text Section */}
       <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
             <Clock size={14} /> {t.tour_3d_badge}
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 dark:text-white mb-6 leading-tight">
             {t.tour_3d_title}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
             {t.tour_3d_desc}
          </p>
       </div>

       {/* Viewer Placeholder */}
       <div className="relative w-full aspect-video bg-slate-900 dark:bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 group cursor-not-allowed">
           {/* Background Grid/Image Effect */}
           <div className="absolute inset-0 opacity-20 dark:opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/50"></div>
           
           {/* Central content */}
           <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <div className="relative">
                 <div className="absolute inset-0 bg-brand-500 blur-3xl opacity-20 animate-pulse"></div>
                 <Box className="w-24 h-24 text-slate-700 dark:text-slate-800 relative z-10" strokeWidth={1} />
                 {/* Rotating ring */}
                 <div className="absolute inset-[-20px] border-2 border-slate-700/50 rounded-full animate-[spin_10s_linear_infinite]"></div>
                 <div className="absolute inset-[-40px] border border-slate-800/50 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
              </div>
              <p className="mt-8 font-mono text-brand-500 text-sm tracking-widest uppercase animate-pulse">
                {t.tour_3d_loading}
              </p>
           </div>
       </div>

       {/* Features Grid Teaser */}
       <div className="grid md:grid-cols-3 gap-8 mt-16">
          {[
            { icon: <Box />, title: t.tour_3d_feat_1, desc: t.tour_3d_feat_1_desc },
            { icon: <Maximize />, title: t.tour_3d_feat_2, desc: t.tour_3d_feat_2_desc },
            { icon: <LayoutTemplate />, title: t.tour_3d_feat_3, desc: t.tour_3d_feat_3_desc }
          ].map((item, i) => (
             <div key={i} className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center opacity-70">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">{item.icon}</div>
                <h3 className="font-bold text-slate-700 dark:text-slate-300">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
             </div>
          ))}
       </div>
    </div>
  )
}

const Hero = ({ onCta, t }: { onCta: () => void, t: any }) => (
  <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-900">
    <div className="absolute inset-0 opacity-40">
      <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000" alt="Modern Architecture" className="w-full h-full object-cover" />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
    <div className="relative z-10 max-w-7xl mx-auto px-4 text-center animate-fade-in">
      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 mb-6 animate-slide-up">
        <Sparkles className="text-accent-400 w-4 h-4" />
        <span className="text-accent-100 text-xs font-bold tracking-wider uppercase">{t.hero_verified_badge}</span>
      </div>
      <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6 leading-tight">
        {t.hero_title} <br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-500">{t.hero_span}</span>
      </h1>
      <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-light">
        {t.hero_desc}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={onCta} variant="accent" className="text-lg px-8">{t.hero_cta}</Button>
      </div>
    </div>
  </div>
);

const Features = ({ t }: { t: any }) => (
  <section className="py-20 bg-white dark:bg-slate-950 transition-colors duration-500">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-4 italic tracking-tight">{t.feat_title}</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">{t.feat_desc}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { icon: <ShieldCheck className="w-8 h-8" />, title: t.feat_1_title, desc: t.feat_1_desc },
          { icon: <FileCheck className="w-8 h-8" />, title: t.feat_2_title, desc: t.feat_2_desc },
          { icon: <Box className="w-8 h-8" />, title: t.feat_3_title, desc: t.feat_3_desc },
          { icon: <Users className="w-8 h-8" />, title: t.feat_4_title, desc: t.feat_4_desc },
        ].map((f, i) => (
          <div key={i} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-brand-100 dark:bg-brand-900/50 rounded-xl flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">{f.icon}</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{f.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const AIChat = ({ t, isRtl, properties, userName }: { t: any, isRtl: boolean, properties: Property[], userName?: string | null }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  // Fetch real sessions from Firestore
  useEffect(() => {
    if (!auth.currentUser) {
      setSessions([]);
      return;
    }
    const q = query(
      collection(db, 'chat_sessions'), 
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          ...d,
          id: doc.id,
          messages: (d.messages || []).map((m: any) => ({
            ...m,
            timestamp: m.timestamp?.toDate ? m.timestamp.toDate() : new Date(m.timestamp)
          }))
        } as ChatSession;
      });
      // Sort by last updated
      setSessions(data.sort((a, b) => {
        const timeA = a.lastUpdatedAt ? new Date(a.lastUpdatedAt).getTime() : 0;
        const timeB = b.lastUpdatedAt ? new Date(b.lastUpdatedAt).getTime() : 0;
        return timeB - timeA;
      }));
    });
    return () => unsubscribe();
  }, []);

  // Update messages when switching sessions
  useEffect(() => {
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
        setMessages(session.messages);
      }
    } else {
      setMessages([]);
    }
  }, [currentSessionId, sessions]);

  // Responsive sidebar handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize Chat
  useEffect(() => {
    try {
      // Safely access process.env to avoid ReferenceError in Vercel browser build
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        chatRef.current = ai.chats.create({
          model: "gemini-3-flash-preview",
          config: {
            systemInstruction: `You are HETTETY AI, the official real estate assistant for HETTETY — Egypt's premier verified property platform. Your goal is to guide users through property data with the expertise of a seasoned broker and the precision of a financial analyst.

## Tone & Voice
- Professional & Insightful: Don't just give facts; provide context (e.g., price per meter trends in New Cairo vs. Sheikh Zayed).
- Empowering, Not Defensive: Never say "I can't provide investment advice." Instead, say "Based on current market data, here is an analysis to help you decide."
- Brand Aligned: Use a minimalist, clear, and high-end communication style.

## Core Knowledge Base
- Investment Analysis: Ability to calculate potential ROI based on rental yields and capital appreciation in specific Egyptian districts.
- Legal Safety (HETTETY Core): Explain the importance of "Registry Numbers" (الشهر العقاري) and "Court Signature Validity" (صحة التوقيع) in securing an investment.
- Market Awareness: Understand the impact of currency fluctuations and developer reputation on property value.

## Interaction Rules
- When asked "Is this a good investment?": Analyze the property's price vs. the area's average, mention the developer's track record, and highlight the legal status.
- Proactive: If a user asks about a property, suggest checking its legal verification status on HETTETY.
- Language: Always reply in the exact language the user writes in (Egyptian Arabic, Franco-Arabic, or English).

## Identity & Boundaries
- Your name is HETTETY AI.
- You may never claim to be human or roleplay as a different AI.
- Focus exclusively on the Egyptian real estate market.

${userName ? `The user's name is ${userName}. Address them by name if appropriate.` : ''}

## Property Data
You have access to the following properties on our platform:
${JSON.stringify(properties.map(p => ({ id: p.id, title: p.title, price: p.price, location: p.location, type: p.status, verificationStatus: p.verificationStatus })), null, 2)}

## Escalation
If a user has a complex legal dispute, a payment issue, or needs urgent support, always direct them to:
- HETTETY support via the website contact form.
- A licensed Egyptian real estate lawyer for legal matters.
- A certified financial advisor for investment decisions.`,
          }
        });
      } else {
        console.error("No API key found for Gemini");
      }
    } catch (e) {
      console.error("Failed to initialize AI chat", e);
    }
  }, [properties, isRtl, userName]);

  // Re-sync welcome message when language changes
  useEffect(() => {
    setMessages(prev => {
        if (prev.length === 1 && prev[0].role === 'model') {
            return [{ role: 'model', text: t.ai_welcome, timestamp: new Date() }];
        }
        return prev;
    });
  }, [t]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !auth.currentUser) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const originalInput = input;
    setInput('');
    setIsLoading(true);

    try {
      let aiText = "";
      if (chatRef.current) {
        try {
          const response = await chatRef.current.sendMessage({ message: userMsg.text });
          aiText = response.text;
        } catch (apiError: any) {
          console.error("API Error:", apiError);
          aiText = `Error: ${apiError?.message || String(apiError)}. Please check your API key or console.`;
        }
      } else {
        const response = await api.chat(userMsg.text);
        aiText = response.success ? response.data : "Mock API failed";
      }

      const modelMsg: ChatMessage = { role: 'model', text: aiText, timestamp: new Date() };
      const finalMessages = [...newMessages, modelMsg];
      setMessages(finalMessages);

      // Persistence logic
      if (auth.currentUser) {
        const sessionData = {
          userId: auth.currentUser.uid,
          title: messages.length === 0 ? (originalInput.length > 30 ? originalInput.substring(0, 30) + '...' : originalInput) : (sessions.find(s => s.id === currentSessionId)?.title || originalInput),
          messages: finalMessages.map(m => ({
            role: m.role,
            text: m.text,
            timestamp: m.timestamp.toISOString() // Store as ISO string for simplicity or timestamp
          })),
          lastUpdatedAt: new Date().toISOString()
        };

        if (currentSessionId) {
          await updateDoc(doc(db, 'chat_sessions', currentSessionId), sessionData);
        } else {
          const docRef = await addDoc(collection(db, 'chat_sessions'), sessionData);
          setCurrentSessionId(docRef.id);
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      handleFirestoreError(error, OperationType.WRITE, 'chat_sessions');
    }
    
    setIsLoading(false);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  return (
    <div className={`flex h-[calc(100vh-80px)] w-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden relative ${isRtl ? 'flex-row-reverse' : 'flex-row'} transition-colors duration-500`}>
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 transition-opacity" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 300 : 0,
          opacity: isSidebarOpen ? 1 : 0
        }}
        className={`bg-white dark:bg-slate-900 ${isRtl ? 'border-l' : 'border-r'} border-slate-100 dark:border-slate-800 flex flex-col z-40 h-full relative overflow-hidden shrink-0 shadow-sm transition-all duration-300 ease-in-out ${!isSidebarOpen && 'pointer-events-none'}`}
      >
        <div className="p-4 flex flex-col h-full w-[300px]">
          {/* New Chat Button */}
          <button 
            onClick={handleNewChat}
            className={`flex items-center gap-3 w-full p-4 mb-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-800 dark:text-slate-200 font-bold text-sm group shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
          >
            <div className="bg-brand-50 dark:bg-brand-900/30 p-2 rounded-xl group-hover:bg-brand-100 dark:group-hover:bg-brand-900 transition-colors">
              <Plus className="text-brand-600 dark:text-brand-400 w-5 h-5" />
            </div>
            {isRtl ? 'محادثة جديدة' : 'New Chat Session'}
          </button>

          {/* History Sections */}
          <div className="flex-1 overflow-y-auto space-y-6 px-1 custom-scrollbar">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-600 space-y-3 opacity-60">
                 <History size={32} strokeWidth={1.5} className="text-slate-300 dark:text-slate-700" />
                 <p className="text-xs font-medium tracking-tight uppercase">{isRtl ? 'لا يوجد سجل محادثات' : 'No history yet'}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {(() => {
                  const now = new Date();
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);
                  const sevenDaysAgo = new Date(today);
                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                  const groups = {
                    today: sessions.filter(s => new Date(s.lastUpdatedAt) >= today),
                    previous: sessions.filter(s => {
                      const d = new Date(s.lastUpdatedAt);
                      return d < today && d >= sevenDaysAgo;
                    }),
                    older: sessions.filter(s => new Date(s.lastUpdatedAt) < sevenDaysAgo)
                  };

                  return (
                    <>
                      {groups.today.length > 0 && (
                        <div>
                          <h3 className={`text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                            {isRtl ? 'اليوم' : 'Today'}
                          </h3>
                          <div className="space-y-1">
                            {groups.today.map(session => (
                              <button 
                                key={session.id}
                                onClick={() => {
                                  setCurrentSessionId(session.id);
                                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm transition-all group cursor-pointer border ${currentSessionId === session.id ? 'bg-brand-50/50 dark:bg-brand-900/20 border-brand-100 dark:border-brand-800 text-brand-800 dark:text-brand-200 font-bold' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'} ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                              >
                                <MessageSquare className={`w-4 h-4 shrink-0 shadow-sm ${currentSessionId === session.id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-300 dark:text-slate-600 group-hover:text-brand-500'}`} />
                                <span className="truncate flex-1 leading-tight tracking-tight">{session.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {groups.previous.length > 0 && (
                        <div>
                          <h3 className={`text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                            {isRtl ? 'آخر 7 أيام' : 'Previous 7 Days'}
                          </h3>
                          <div className="space-y-1">
                            {groups.previous.map(session => (
                              <button 
                                key={session.id}
                                onClick={() => {
                                  setCurrentSessionId(session.id);
                                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm transition-all group cursor-pointer border ${currentSessionId === session.id ? 'bg-brand-50/50 dark:bg-brand-900/20 border-brand-100 dark:border-brand-800 text-brand-800 dark:text-brand-200 font-bold' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'} ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                              >
                                <MessageSquare className={`w-4 h-4 shrink-0 ${currentSessionId === session.id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-300 dark:text-slate-600 group-hover:text-brand-500'}`} />
                                <span className="truncate flex-1 leading-tight tracking-tight">{session.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {groups.older.length > 0 && (
                        <div>
                          <h3 className={`text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                            {isRtl ? 'أقدم' : 'Older'}
                          </h3>
                          <div className="space-y-1">
                            {groups.older.map(session => (
                              <button 
                                key={session.id}
                                onClick={() => {
                                  setCurrentSessionId(session.id);
                                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm transition-all group cursor-pointer border ${currentSessionId === session.id ? 'bg-brand-50/50 dark:bg-brand-900/20 border-brand-100 dark:border-brand-800 text-brand-800 dark:text-brand-200 font-bold' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'} ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                              >
                                <MessageSquare className={`w-4 h-4 shrink-0 ${currentSessionId === session.id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-300 dark:text-slate-600 group-hover:text-brand-500'}`} />
                                <span className="truncate flex-1 leading-tight tracking-tight">{session.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-50 dark:border-slate-800 mt-auto">
             <div className={`flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg shadow-brand-100 shrink-0">
                   {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate tracking-tight">{userName || 'HETTETY Member'}</p>
                   <div className="flex items-center gap-1.5 opacity-60">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-black uppercase tracking-wider">Verified Account</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative h-full min-w-0 bg-white dark:bg-slate-950 transition-colors duration-500">
        {/* Header */}
        <header className={`h-16 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-white dark:bg-slate-900 z-20 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-all cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700 group"
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? <PanelLeftClose size={20} className="group-hover:text-brand-600" /> : <PanelLeftOpen size={20} className="group-hover:text-brand-600" />}
            </button>
            <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="w-9 h-9 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center shadow-inner">
                 <Sparkles className="text-brand-600 dark:text-brand-400 w-5.5 h-5.5 animate-pulse" />
              </div>
              <h1 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm sm:text-[15px] hidden sm:block tracking-tight italic uppercase">HETTETY AI</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-1.5 tracking-wider uppercase">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
               {isRtl ? 'بيانات معتمدة' : 'CERTIFIED DATA'}
             </div>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[#fcfdfe] dark:bg-slate-950 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-10 pb-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-8 animate-fade-in px-4">
                 <div className="w-24 h-24 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] flex items-center justify-center shadow-xl shadow-brand-50 transform -rotate-3 hover:rotate-0 transition-transform">
                    <Logo color="currentColor" className="h-12 w-auto text-slate-400" />
                 </div>
                 <div className="space-y-3">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{isRtl ? 'مساعدك العقاري' : 'Your Property Ally'}</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm text-[15px] font-medium leading-relaxed opacity-80">
                      {isRtl ? 'أهلاً بك في حتتي AI. كيف يمكنني مساعدتك اليوم في رحلتك العقارية؟' : 'Welcome to HETTETY AI. How can I assist you with your real estate journey today?'}
                    </p>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
                    {[t.ai_quick_1, t.ai_quick_2, t.ai_quick_3, isRtl ? 'خطوات التسجيل العقاري في مصر؟' : 'Legal property registration steps?'].map((q, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setInput(q)}
                        className={`p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-300 dark:hover:border-brand-800 hover:shadow-xl hover:shadow-brand-50/10 transition-all text-[13px] font-extrabold text-slate-700 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-400 active:scale-95 cursor-pointer flex flex-col gap-1 ${isRtl ? 'text-right' : 'text-left'}`}
                      >
                         <span className="text-[10px] text-brand-400 font-black uppercase tracking-widest block mb-1">PROMPT #{idx + 1}</span>
                         {q}
                      </button>
                    ))}
                 </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-4 sm:gap-6 ${m.role === 'user' ? 'flex-row-reverse' : ''} group animate-fade-in`}>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shrink-0 flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110 ${m.role === 'user' ? 'bg-brand-600 shadow-brand-100' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-slate-100'}`}>
                   {m.role === 'user' ? <User size={20} className="text-white" /> : <Logo color="currentColor" className="h-6 w-auto text-brand-600 dark:text-white" />}
                </div>
                <div className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-5 sm:p-6 rounded-[2rem] shadow-sm transform transition-all group-hover:shadow-md ${m.role === 'user' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'}`}>
                    <p className={`whitespace-pre-wrap leading-relaxed text-sm sm:text-[16px] font-medium ${isRtl ? 'font-cairo' : ''}`}>{m.text}</p>
                  </div>
                  <span className={`text-[10px] font-black text-slate-400 mt-3 px-2 uppercase tracking-widest opacity-60`}>
                    {m.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4 sm:gap-6 animate-pulse">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
                   <Sparkles className="text-slate-200 dark:text-slate-700 w-6 h-6" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-slate-50 dark:bg-slate-900 rounded-full w-1/4"></div>
                  <div className="h-20 bg-slate-50 dark:bg-slate-900 rounded-[2rem] w-3/4"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-8 bg-white dark:bg-slate-900 shrink-0 border-t border-slate-50 dark:border-slate-800">
          <div className="max-w-3xl mx-auto relative">
            <div className={`flex items-end gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-3 focus-within:border-brand-500 dark:focus-within:border-brand-600 focus-within:ring-8 focus-within:ring-brand-50 dark:focus-within:ring-brand-900/20 transition-all shadow-inner ${isRtl ? 'flex-row-reverse' : ''}`}>
              <textarea 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={t.ai_placeholder} 
                rows={1}
                className={`flex-1 max-h-48 bg-transparent border-0 rounded-2xl px-3 py-3 focus:ring-0 transition-all outline-none text-slate-800 dark:text-slate-200 text-[16px] font-bold resize-none ${isRtl ? 'text-right' : 'text-left'}`} 
              />
              <button 
                onClick={handleSend} 
                disabled={isLoading || !input.trim()} 
                className="bg-brand-600 text-white p-4 rounded-2xl hover:bg-brand-700 transition-all disabled:opacity-20 disabled:grayscale transform active:scale-90 cursor-pointer shadow-xl shadow-brand-200 group"
              >
                <Send size={20} className={`${isRtl ? "rotate-180" : ""} group-hover:translate-x-1 transition-transform`} />
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1 no-scrollbar justify-center">
              {[t.ai_quick_1, t.ai_quick_2, t.ai_quick_3].map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => setInput(s)} 
                  className="whitespace-nowrap px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:border-brand-500 hover:text-brand-600 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  {s}
                </button>
              ))}
            </div>
            
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-4">
              HETTETY AI may provide market analysis. Always verify legal information with our <span className="text-brand-600 dark:text-brand-400 font-bold underline cursor-pointer">Verification Service</span>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

const LegalCenter = ({ t, isRtl, userEmail }: { t: any, isRtl: boolean, userEmail: string | null }) => {
  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<UserDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setDocs([]);
      return;
    }

    const q = query(
      collection(db, 'user_documents'),
      where('ownerUid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserDocument[];
      setDocs(docsData);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'user_documents');
    });

    return () => unsubscribe();
  }, [userEmail]);

  const handleUploadClick = () => {
    setError(null);
    if (!auth.currentUser) {
      setError(isRtl ? 'يرجى تسجيل الدخول أولاً لرفع المستندات.' : 'Please sign in first to upload documents.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!auth.currentUser) {
      setError(isRtl ? 'يرجى تسجيل الدخول أولاً لرفع المستندات.' : 'Please sign in first to upload documents.');
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; 
    if (file.size > MAX_SIZE) {
      setError(isRtl ? 'حجم الملف يتجاوز الحد الأقصى (5 ميجابايت).' : 'File size exceeds the maximum limit (5MB).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError(isRtl ? 'نوع الملف غير مدعوم. يرجى رفع ملفات PDF أو صور أو مستندات.' : 'Unsupported file type. Please upload PDF, images, or documents.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setAnalyzing(true);
    const newDocName = file.name;
    
    try {
      let fileToUpload = file;
      if (file.type.includes('image')) {
        try {
          const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
          fileToUpload = await imageCompression(file, options);
        } catch (compressionError) {
          console.warn("Image compression failed, uploading original:", compressionError);
        }
      }

      const storagePath = `user_documents/${auth.currentUser.uid}/${Date.now()}_${fileToUpload.name}`;
      const fileRef = ref(storage, storagePath);
      const uploadResult = await uploadBytes(fileRef, fileToUpload);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      const response = await api.uploadDocument(newDocName, 'Document');
      
      const newDocData = {
          fileId: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
          name: newDocName,
          type: file.type.includes('image') ? 'Image' : file.type.includes('pdf') ? 'PDF' : 'Document',
          status: response.success && response.data?.isValid ? 'Verified' : 'Action Required',
          uploadDate: new Date().toISOString().split('T')[0],
          accessStatus: 'Granted',
          size: fileToUpload.size,
          content: downloadUrl,
          ownerUid: auth.currentUser!.uid,
          storagePath: storagePath
      };

      await addDoc(collection(db, 'user_documents'), newDocData);
    } catch (err) {
      setError(isRtl ? 'فشل رفع المستند. يرجى المحاولة مرة أخرى.' : 'Failed to upload document. Please try again.');
      console.error('Upload Error:', err);
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docData: UserDocument) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا المستند؟' : 'Are you sure you want to delete this document?')) return;
    try {
      if (docData.storagePath) {
        const fileRef = ref(storage, docData.storagePath);
        await deleteObject(fileRef).catch(err => console.warn('Storage delete failed:', err));
      }
      await deleteDoc(doc(db, 'user_documents', docData.id));
    } catch (err) {
      setError(isRtl ? 'فشل حذف المستند.' : 'Failed to delete document.');
      console.error('Delete Error:', err);
    }
  };

  const handleRequestAccess = (id: string) => {
    setError(null);
    updateDoc(doc(db, 'user_documents', id), { accessStatus: 'Requested' })
      .catch(err => {
        setError(isRtl ? 'فشل طلب الوصول.' : 'Failed to request access.');
        console.error('Firestore Error:', err);
      });
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const filteredDocs = docs.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.fileId && doc.fileId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in transition-colors duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white">{t.legal_title}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{isRtl ? 'إدارة المستندات القانونية الخاصة بك بأمان.' : 'Securely manage your personal legal documents.'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input 
              type="text" 
              placeholder={isRtl ? "البحث بالاسم أو المعرف..." : "Search by name or ID..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-700 dark:text-slate-200 ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
            />
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          <Button onClick={handleUploadClick} disabled={analyzing} className="w-full sm:w-auto whitespace-nowrap">
            {analyzing ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {analyzing ? t.legal_analyzing : t.legal_upload}
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
           {filteredDocs.length > 0 ? filteredDocs.map(doc => (
             <div key={doc.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm hover:shadow-md transition-shadow gap-4">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${doc.status === 'Verified' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}><FileText size={24} /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">{doc.fileId}</span>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{doc.name}</h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{doc.type} • {doc.uploadDate} {doc.size ? `• ${formatSize(doc.size)}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:ml-4 shrink-0 justify-between sm:justify-end">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border ${doc.status === 'Verified' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>{doc.status === 'Verified' ? t.prop_verified : doc.status}</div>
                  
                  {doc.accessStatus === 'Locked' && (
                    <button onClick={() => handleRequestAccess(doc.id)} className="text-xs font-medium bg-slate-900 dark:bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 dark:hover:bg-brand-700 transition-colors cursor-pointer">
                      {isRtl ? 'طلب وصول' : 'Request Access'}
                    </button>
                  )}
                  {doc.accessStatus === 'Requested' && (
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                      {isRtl ? 'قيد المراجعة' : 'Pending Approval'}
                    </span>
                  )}
                  {doc.accessStatus === 'Granted' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewingDoc(doc)} className="text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-3 py-1.5 rounded-lg border border-brand-200 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors cursor-pointer">
                        {isRtl ? 'عرض' : 'View'}
                      </button>
                      <button onClick={() => handleDelete(doc)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer" title={isRtl ? 'حذف' : 'Delete'}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400">
                {isRtl ? "لم يتم العثور على ملفات." : "No files found."}
              </div>
            )}
        </div>
        <div className="space-y-6">
           <div className="bg-slate-900 dark:bg-slate-800 text-white p-6 rounded-2xl border border-slate-800 overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Shield size={80} /></div>
             <h3 className="font-bold mb-4 flex items-center gap-2 relative z-10"><ShieldCheck className="text-brand-400" /> {t.legal_status}</h3>
             <div className="space-y-4 relative z-10">
               {[t.legal_stat_1, t.legal_stat_2, t.legal_stat_3].map((label: string, i) => (
                 <div key={i} className="flex justify-between text-sm"><span className="text-slate-400">{label}</span><CheckCircle className="text-green-400 w-4 h-4" /></div>
               ))}
             </div>
           </div>
           <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 p-6 rounded-2xl">
             <h3 className="font-bold text-brand-900 dark:text-brand-300 mb-2 text-sm">{isRtl ? 'مساحة العمل الخاصة بك' : 'Your Private Workspace'}</h3>
             <p className="text-xs text-brand-700 dark:text-brand-400 leading-relaxed">
               {isRtl 
                 ? 'هذه الملفات مشفرة ومخصصة لحسابك فقط. لا يمكن لأي مستخدم آخر رؤية مستنداتك. بعض الملفات الإدارية تتطلب طلب وصول من الإدارة.' 
                 : 'These files are encrypted and scoped to your account. No other users can see your documents. Some administrative files require an access request.'}
             </p>
           </div>
        </div>
      </div>

      {viewingDoc && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 p-2 rounded-lg">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{viewingDoc.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{viewingDoc.fileId} • {viewingDoc.type}</p>
                </div>
              </div>
              <button onClick={() => setViewingDoc(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-8 flex items-center justify-center overflow-y-auto">
              {viewingDoc.type === 'Image' || viewingDoc.name.match(/\.(jpg|jpeg|png)$/i) ? (
                <div className="max-w-full max-h-full flex flex-col items-center justify-center">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center overflow-hidden">
                    <img 
                      src={viewingDoc.content || `https://picsum.photos/seed/${viewingDoc.id}/800/600`} 
                      alt={viewingDoc.name} 
                      className="max-w-full max-h-[60vh] object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-sm font-medium mt-4 text-slate-600 dark:text-slate-400">{viewingDoc.name}</p>
                </div>
              ) : viewingDoc.type === 'PDF' && viewingDoc.content ? (
                <div className="w-full h-full min-h-[600px] bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <iframe 
                    src={viewingDoc.content} 
                    title={viewingDoc.name}
                    className="w-full h-full min-h-[600px] border-0"
                  />
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 w-full max-w-2xl min-h-[600px] shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl p-12">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
                    <div className="flex justify-between items-start mb-8">
                      <Logo color="currentColor" className="h-8 text-brand-600 dark:text-white" />
                      <div className="text-right">
                        <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">{viewingDoc.type}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{viewingDoc.fileId}</p>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">{viewingDoc.name.replace(/\.[^/.]+$/, "")}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{isRtl ? 'تاريخ الرفع:' : 'Upload Date:'} {viewingDoc.uploadDate}</p>
                  </div>
                  <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                    <p className="font-semibold mb-4 text-slate-900 dark:text-white">{isRtl ? 'محتوى المستند:' : 'Document Content:'}</p>
                    {viewingDoc.content && viewingDoc.content.startsWith('data:text') ? (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg whitespace-pre-wrap font-mono text-xs overflow-auto max-h-64">
                        {atob(viewingDoc.content.split(',')[1])}
                      </div>
                    ) : (
                      <>
                        <p>
                          {isRtl 
                            ? 'هذا المستند هو نسخة إلكترونية موثقة. يحتوي على تفاصيل الاتفاقية أو الهوية أو الملكية الخاصة بك.' 
                            : 'This document is a verified electronic copy. It contains the details of your agreement, identification, or property deed.'}
                        </p>
                        <p>
                          {isRtl 
                            ? 'تم التحقق من صحة هذا المستند وتشفيره بأمان على خوادمنا. لا يمكن لأي شخص آخر الوصول إليه بدون إذنك الصريح.' 
                            : 'This document has been validated and securely encrypted on our servers. No one else can access it without your explicit permission.'}
                        </p>
                      </>
                    )}
                    <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg">
                      <p className="text-xs text-slate-500 dark:text-slate-500 font-mono">
                        ID: {viewingDoc.fileId}<br/>
                        Name: {viewingDoc.name}<br/>
                        Type: {viewingDoc.type}<br/>
                        Size: {viewingDoc.size ? (viewingDoc.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      {isRtl ? 'وثيقة موثقة ومحمية' : 'Verified & Protected Document'}
                    </div>
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                      <ShieldCheck size={16} />
                      {isRtl ? 'تم التحقق' : 'Verified'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Viewer3D = ({ propertyId, onClose, t, isRtl }: { propertyId: string, onClose: () => void, t: any, isRtl: boolean }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-fade-in">
       {/* Toolbar */}
       <div className="absolute top-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
          <div className="text-white">
            <h3 className="font-bold text-lg">{t.nav_3d_exp || 'Virtual Tour'}</h3>
            <p className="text-sm text-white/70">Property #{propertyId}</p>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur cursor-pointer"><X /></button>
       </div>
       
       {/* Main Viewport */}
       <div className="flex-1 relative flex items-center justify-center bg-slate-900">
          <div className="text-center animate-slide-up">
             <Box className="w-16 h-16 text-brand-500 mx-auto mb-4 opacity-50" />
             <h2 className="text-3xl font-bold text-white mb-2">{isRtl ? 'قريباً' : 'Coming Soon'}</h2>
             <p className="text-slate-400 max-w-md mx-auto mb-8">
               {isRtl ? 'ميزة العرض ثلاثي الأبعاد قيد التطوير حالياً وسيتم إطلاقها قريباً.' : 'The 3D virtual tour feature is currently under development and will be available soon.'}
             </p>
             <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full backdrop-blur border border-white/20 transition-colors cursor-pointer">
               {isRtl ? 'العودة للعقارات' : 'Back to Listings'}
             </button>
          </div>
       </div>
    </div>
  );
};

const PropertyModal = ({ property, onClose, onPurchase, t, isRtl }: { property: Property, onClose: () => void, onPurchase: (id: string) => void, t: any, isRtl: boolean }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'ai'>('details');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const displayImages = property.images && property.images.length > 0 ? property.images : [property.imageUrl];

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: isRtl ? `أهلاً! أنا المساعد الذكي الخاص بهذا العقار (${property.title}). اسألني عن تفاصيل العقار، الأوراق القانونية، حالة إعادة البيع، أو رقم الشهر العقاري.` : `Hello! I'm the AI assistant for this property (${property.title}). Ask me about its details, legal documents, resale status, or registry number.`, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userText, timestamp: new Date() }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      if (apiKey) {
        const genAI = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are an expert broker and financial analyst for a specific real estate property on HETTETY — Egypt's premier verified property platform. Your goal is to guide users through this property's data with professional insight.

Answer questions ONLY about this property based on the following data:
Title: ${property.title}
Price: ${property.price} EGP
Location: ${property.location}
Area: ${property.area} sqm
Bedrooms: ${property.bedrooms}
Bathrooms: ${property.bathrooms}
Status: ${property.status}
Unit Code: ${property.unitCode || 'N/A'}
Registry Number (raqm el shahr el 3aqary): ${property.registrationNumber || 'Not available'}
Court Signature Validity (s7t tawqe3 el ma7kama): ${property.courtSignatureValidity ? 'Yes/Valid' : 'No/Pending'}
Resale: ${property.isResale ? 'Yes, this is a resale property.' : 'No, direct sale.'}
Images: ${property.images?.length ? property.images.join(', ') : property.imageUrl} (If the user asks to see the apartment / shape of the apartment / sor el shaqa, you MUST output ALL these images exactly in markdown format like this: ![Apartment](URL1) ![Apartment](URL2) etc.)

## Tone & Voice
- Professional & Insightful: Provide context like price per square meter analysis.
- Empowering, Not Defensive: Never say "I can't provide investment advice." Instead use "Based on current market data, here is an analysis to help you decide."
- Brand Aligned: Minimalist, clear, and high-end.

## Interaction Rules
- When asked "Is this a good investment?": Analyze the price vs. area average, and explicitly highlight the Legal Safety based on the Registry Number and Court Signature Validity status.
- Multi-Modal: Use data from images (like floor plans, if available) to explain spatial efficiency.
- Language: Keep your answers helpful and in the exact language the user speaks (English, Egyptian Arabic, Franco). Do not invent information not in the data provided.`;
        
        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: newMessages.map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] })),
          config: {
            systemInstruction: systemPrompt
          }
        });

        const aiText = response.text || "Sorry, I couldn't process that request.";
        setMessages([...newMessages, { role: 'model', text: aiText, timestamp: new Date() }]);
      } else {
        // Fallback mock
        setTimeout(() => {
          setMessages([...newMessages, { role: 'model', text: "API Key not found. Mock response: Property is great!", timestamp: new Date() }]);
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'model', text: "Error connecting to AI.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0 relative">
          <button onClick={() => setActiveTab('details')} className={`flex-1 py-4 font-bold text-center transition-colors ${activeTab === 'details' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>
            {isRtl ? 'تفاصيل العقار' : 'Property Details'}
          </button>
          <button onClick={() => setActiveTab('ai')} className={`flex-1 py-4 font-bold text-center transition-colors flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'text-accent-500 border-b-2 border-accent-500' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>
            <MessageSquare size={18} /> {isRtl ? 'المساعد الذكي للوحدة' : 'Unit AI Assistant'}
          </button>
          <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1 cursor-pointer"><X size={20}/></button>
        </div>

        <div className="overflow-y-auto flex-1">
          {activeTab === 'details' ? (
            <>
              <div className="relative h-72 group">
                {property.videoUrl && currentImageIndex === 0 ? (
                  <video src={property.videoUrl} className="w-full h-full object-cover" controls playsInline />
                ) : (
                  <img src={displayImages[currentImageIndex]} alt={property.title} className="w-full h-full object-cover" />
                )}
                {displayImages.length > 1 && !property.videoUrl && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => i === 0 ? displayImages.length - 1 : i - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 cursor-pointer transition-colors opacity-0 group-hover:opacity-100">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => (i + 1) % displayImages.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 cursor-pointer transition-colors opacity-0 group-hover:opacity-100">
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                       {displayImages.map((_, idx) => (
                          <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50 cursor-pointer'}`} onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }} />
                       ))}
                    </div>
                  </>
                )}
              </div>
              <div className="p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{property.title}</h2>
                {property.verificationStatus === 'Verified' && (
                  <span className="bg-green-500 text-white text-[10px] px-2 py-1 rounded-full font-black flex items-center gap-1 uppercase tracking-wider">
                    <ShieldCheck size={12}/> {isRtl ? 'أصلي + ثقة وقانون' : 'Verified Legal'}
                  </span>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2 font-medium"><MapPin size={16} className="text-brand-500"/> {property.location}</p>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {property.unitCode && <span>{isRtl ? 'كود الوحدة:' : 'Unit Code:'} {property.unitCode}</span>}
                {property.publishDate && <span>{isRtl ? 'تاريخ النشر:' : 'Published:'} {property.publishDate}</span>}
              </div>
            </div>
            <div className="text-right sm:bg-slate-50 sm:dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 self-stretch sm:self-auto flex sm:flex-col justify-between items-center sm:items-end">
              <div className="text-2xl font-black text-brand-600 dark:text-brand-400">{property.price.toLocaleString()} EGP</div>
              <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded sm:mt-1">{property.status}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-100 dark:border-slate-800 my-6">
            <div className="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <BedDouble className="text-brand-500 dark:text-brand-400 mb-2"/>
              <span className="font-bold text-slate-900 dark:text-white">{property.bedrooms}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{t.prop_beds}</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <Bath className="text-brand-500 dark:text-brand-400 mb-2"/>
              <span className="font-bold text-slate-900 dark:text-white">{property.bathrooms}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{t.prop_baths}</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <Maximize className="text-brand-500 dark:text-brand-400 mb-2"/>
              <span className="font-bold text-slate-900 dark:text-white">{property.area} m²</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{isRtl ? 'المساحة' : 'Area'}</span>
            </div>
          </div>

          {property.description && (
            <div className="mb-6">
               <h3 className="font-bold text-slate-900 dark:text-white mb-2">{isRtl ? 'الوصف' : 'Description'}</h3>
               <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">{property.description}</p>
            </div>
          )}

          <div className="mb-8">
            <h3 className="font-bold text-slate-900 dark:text-white mb-3">{isRtl ? 'طرق الدفع المتاحة' : 'Available Payment Methods'}</h3>
            <div className="flex flex-wrap gap-2">
              {property.paymentMethods?.map(m => (
                <span key={m} className="px-3 py-1.5 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-lg text-sm font-medium border border-brand-100 dark:border-brand-800">{m}</span>
              ))}
              {(!property.paymentMethods || property.paymentMethods.length === 0) && (
                <span className="text-slate-500 dark:text-slate-400 text-sm">{isRtl ? 'غير محدد' : 'Not specified'}</span>
              )}
            </div>
          </div>

          <Button onClick={() => onPurchase(property.id)} className="w-full py-4 text-lg">
            {isRtl ? 'المتابعة للدفع' : 'Proceed to Payment'}
          </Button>
        </div>
            </>
          ) : (
            <div className="flex flex-col h-[60vh] bg-slate-50 dark:bg-slate-900/50">
              <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'}`}>
                      {msg.text.match(/!\[.*?\]\((.*?)\)/) ? (
                        <>
                          <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.text.replace(/!\[.*?\]\((.*?)\)/g, '')}</p>
                          {msg.text.match(/!\[.*?\]\((.*?)\)/g)?.map((imgMatch, idx) => {
                            const url = imgMatch.match(/\((.*?)\)/)?.[1];
                            return url ? <img key={idx} src={url} alt="Property" className="mt-2 rounded-xl border border-slate-200 dark:border-slate-700 w-full object-cover" /> : null;
                          })}
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.text}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700">
                      <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isRtl ? 'اسأل المساعد الذكي عن أي شيء يخص هذا العقار...' : 'Ask about this property...'}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-accent-500 text-slate-900 dark:text-white"
                  />
                  <button type="submit" disabled={!input.trim() || isLoading} className="absolute right-2 p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg disabled:opacity-50 transition-colors cursor-pointer">
                    <Send size={18} className={isRtl ? 'rotate-180' : ''} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfilePage = ({ t, isRtl, onBrowse, onLogout, onLogin, userEmail, userFavorites, allProperties, onToggleFavorite, open3D }: { t: any, isRtl: boolean, onBrowse: () => void, onLogout: () => void, onLogin: () => void, userEmail: string | null, userFavorites: string[], allProperties: Property[], onToggleFavorite: (id: string) => void, open3D: (id: string) => void }) => {
  const [profile, setProfile] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'purchases' | 'favorites'>('purchases');

  const favoriteProperties = allProperties.filter(p => userFavorites.includes(p.id));
  const completedPurchases = purchases.filter(p => p.status?.toLowerCase() === 'completed' || p.status?.toLowerCase() === 'finished');
  const inProgressPurchases = purchases.filter(p => p.status?.toLowerCase() === 'processing' || p.status?.toLowerCase() === 'pending');

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
          setEditForm(userDoc.data());
        }
        
        // Fetch real purchases from Firestore
        const q = query(
          collection(db, 'purchases'), 
          where('userId', '==', auth.currentUser!.uid)
        );
        const querySnapshot = await getDocs(q);
        const purchaseData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          property: allProperties.find(p => p.id === (doc.data() as any).propertyId)
        }));
        setPurchases(purchaseData);
      } catch (err) {
        console.error("Error fetching purchases:", err);
        const res = await api.getProfile(userEmail);
        if (res.success && res.data) {
          setPurchases(res.data.purchases);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [userEmail, allProperties]);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), editForm);
      setProfile(editForm);
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-brand-500 w-8 h-8"/></div>;
  if (!profile) return (
    <div className="py-20 text-center">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">{isRtl ? 'يرجى تسجيل الدخول' : 'Please Sign In'}</h2>
      <p className="text-slate-500 mb-8">{isRtl ? 'يجب تسجيل الدخول لعرض الملف الشخصي.' : 'You must be signed in to view your profile.'}</p>
      <Button onClick={onLogin}>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</Button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in transition-colors duration-500">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{isRtl ? 'الملف الشخصي' : 'Personal Profile'}</h1>
        <div className="flex gap-2 flex-wrap justify-end">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
              <Edit2 size={16} /> {isRtl ? 'تعديل البيانات' : 'Edit Profile'}
            </Button>
          ) : (
            <>
              <Button onClick={() => { setIsEditing(false); setEditForm(profile); }} variant="outline" className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isRtl ? 'حفظ' : 'Save'}
              </Button>
            </>
          )}
          <Button onClick={onLogout} variant="outline" className="gap-2 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/50">
            <LogOut size={16} /> {isRtl ? 'تسجيل الخروج' : 'Sign Out'}
          </Button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-20 h-20 bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center text-2xl font-bold mb-4 relative">
              {profile.name.charAt(0)}
              {['abdallahahmedpilot2426@gmail.com', 'marwaneltaweel0@gmail.com', 'pro.mahmoud.h@gmail.com'].includes(userEmail || '') && (
                <div className="absolute -bottom-1 -right-1 bg-brand-600 text-white p-1 rounded-full border-2 border-white dark:border-slate-900" title="Admin">
                  <Shield size={14} />
                </div>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{isRtl ? 'الاسم' : 'Name'}</label>
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input 
                    type="email" 
                    value={editForm.email} 
                    onChange={e => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{isRtl ? 'رقم الهاتف' : 'Phone'}</label>
                  <input 
                    type="tel" 
                    value={editForm.phone} 
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile.name}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{profile.email}</p>
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400"><Phone size={16}/> {profile.phone}</div>
                </div>
              </>
            )}
          </div>

          <div className="bg-brand-50 p-6 rounded-2xl border border-brand-100">
            <h3 className="font-bold text-brand-900 flex items-center gap-2 mb-3"><Target size={18}/> {isRtl ? 'تفضيلاتك' : 'Your Preferences'}</h3>
            {isEditing ? (
              <textarea 
                value={editForm.preferences} 
                onChange={e => setEditForm({...editForm, preferences: e.target.value})}
                className="w-full px-3 py-2 border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none min-h-[100px] text-sm"
              />
            ) : (
              <p className="text-sm text-brand-700 leading-relaxed">{profile.preferences}</p>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          {/* Sub Navigation */}
          <div className="flex gap-4 mb-8 border-b border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setActiveSubTab('purchases')}
              className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider transition-all relative ${activeSubTab === 'purchases' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {t.prof_purchases}
              {activeSubTab === 'purchases' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 rounded-full" />}
            </button>
            <button 
              onClick={() => setActiveSubTab('favorites')}
              className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider transition-all relative ${activeSubTab === 'favorites' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {t.prof_favorites}
              {activeSubTab === 'favorites' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 rounded-full" />}
            </button>
          </div>

          {activeSubTab === 'purchases' && (
            <div className="space-y-12">
              {/* Completed Section */}
              <section>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg">
                    <CheckCircle size={18} />
                  </div>
                  {t.prof_completed} 
                  <span className="text-sm font-normal text-slate-400 font-sans">({completedPurchases.length})</span>
                </h2>
                {completedPurchases.length > 0 ? (
                  <div className="space-y-4">
                    {completedPurchases.map(p => (
                      <div key={p.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                        <img src={p.property?.imageUrl} className="w-full sm:w-32 h-24 rounded-xl object-cover" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">{p.property?.title}</h4>
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-black rounded-lg uppercase tracking-wider">{p.status}</span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3"><MapPin size={14}/> {p.property?.location}</p>
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-brand-600 dark:text-brand-400">{p.property?.price.toLocaleString()} EGP</span>
                            <span className="text-slate-400 text-xs flex items-center gap-1"><Clock size={12}/> {p.purchaseDate}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                    <History className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={40} />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{isRtl ? 'لا توجد مشتريات مكتملة بعد.' : 'No completed purchases yet.'}</p>
                  </div>
                )}
              </section>

              {/* In Progress Section */}
              <section>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg">
                    <RefreshCw size={18} className="animate-spin-slow" />
                  </div>
                  {t.prof_in_progress}
                  <span className="text-sm font-normal text-slate-400 font-sans">({inProgressPurchases.length})</span>
                </h2>
                {inProgressPurchases.length > 0 ? (
                  <div className="space-y-4">
                    {inProgressPurchases.map(p => (
                      <div key={p.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                        <img src={p.property?.imageUrl} className="w-full sm:w-32 h-24 rounded-xl object-cover" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">{p.property?.title}</h4>
                            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black rounded-lg uppercase tracking-wider animate-pulse">{p.status}</span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3"><MapPin size={14}/> {p.property?.location}</p>
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-brand-600 dark:text-brand-400">{p.property?.price.toLocaleString()} EGP</span>
                            <span className="text-slate-400 text-xs">{p.purchaseDate}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                    <Clock className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={40} />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{isRtl ? 'لا توجد طلبات قيد التنفيذ.' : 'No in-progress requests.'}</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeSubTab === 'favorites' && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg">
                  <Heart size={18} fill="currentColor" />
                </div>
                {t.prof_fav_title}
                <span className="text-sm font-normal text-slate-400 font-sans">({favoriteProperties.length})</span>
              </h2>
              {favoriteProperties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {favoriteProperties.map(p => (
                    <PropertyCard 
                      key={p.id} 
                      property={p} 
                      onView3D={() => open3D(p.id)} 
                      onToggleFavorite={() => onToggleFavorite(p.id)}
                      isFavorited={true}
                      t={t} 
                      isRtl={isRtl} 
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Heart size={40} className="text-slate-200 dark:text-slate-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t.prof_empty_fav}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">{t.prof_empty_fav_desc}</p>
                  <Button onClick={onBrowse} variant="primary" className="px-10">{t.prof_start_browsing}</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PaymentPage = ({ property, onConfirm, onCancel, t, isRtl }: { property: Property, onConfirm: () => void, onCancel: () => void, t: any, isRtl: boolean }) => {
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onConfirm();
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-fade-in transition-colors duration-500">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-8 tracking-tight uppercase">{isRtl ? 'بوابة الدفع الآمنة' : 'Secure Payment Gateway'}</h1>
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <CreditCard size={120} />
        </div>
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800 relative z-10">
          <img src={property.imageUrl} className="w-28 h-28 rounded-2xl object-cover shadow-md border border-white dark:border-slate-700" />
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-1">{property.title}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 text-sm"><MapPin size={14}/> {property.location}</p>
            <div className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-3 flex items-baseline gap-1">
              <span>{property.price.toLocaleString()}</span>
              <span className="text-sm uppercase tracking-widest">{isRtl ? 'ج.م' : 'EGP'}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 relative z-10">
          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2">
            <LockIcon size={14} className="text-brand-600" />
            {isRtl ? 'تفاصيل البطاقة البنكية' : 'Bank Card Details'}
          </h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{isRtl ? 'رقم البطاقة' : 'Card Number'}</label>
              <div className="relative">
                <CreditCard className={`absolute top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 ${isRtl ? 'right-4' : 'left-4'}`} />
                <input type="text" placeholder="0000 0000 0000 0000" className={`w-full py-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-slate-900 dark:text-white text-lg font-mono ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'}`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{isRtl ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                <input type="text" placeholder="MM/YY" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-slate-900 dark:text-white font-mono" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">CVC</label>
                <input type="text" placeholder="123" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-slate-900 dark:text-white font-mono" />
              </div>
            </div>
          </div>
          
          <div className="pt-8 flex flex-col sm:flex-row gap-4">
            <Button onClick={handlePay} disabled={processing} className="flex-1 py-4 text-xl font-black uppercase tracking-widest">
              {processing ? <Loader2 className="animate-spin mx-auto"/> : (isRtl ? 'تأكيد عملية الشراء' : 'Confirm Purchase')}
            </Button>
            <button onClick={onCancel} className="px-8 py-4 rounded-xl font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">
              {isRtl ? 'رجوع' : 'Cancel'}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 opacity-40">
             <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Secure SSL</div>
             <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">PCI DSS</div>
             <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">HETTETY Cloud</div>
          </div>
        </div>
      </div>
    </div>
  );
};



// Manage Users Page for Super Admin
// --- Super Admin Dashboard ---
const SuperAdminDashboard = ({ isRtl }: { isRtl: boolean }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'verifications' | 'stats'>('stats');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);

        const propsSnapshot = await getDocs(collection(db, 'properties'));
        const propsData = propsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        setPendingProperties(propsData.filter(p => p.verificationStatus === 'Pending'));
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleRole = async (userId: string, currentRole: string) => {
    setUpdating(userId);
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleVerifyProperty = async (propId: string, status: 'Verified' | 'Rejected') => {
    setUpdating(propId);
    try {
      await updateDoc(doc(db, 'properties', propId), { 
        verificationStatus: status,
        isVerified: status === 'Verified'
      });
      setPendingProperties(pendingProperties.filter(p => p.id !== propId));
      
      // Notify the owner (Simulated for now, would be a Cloud Function)
      // In a real app, we'd trigger a push/email notification here.
    } catch (error) {
      console.error("Error verifying property:", error);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-brand-600 mb-4" size={48} />
      <p className="text-slate-500 font-medium">Initializing HETTETY Command Center...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 animate-fade-in transition-colors duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 dark:bg-black rounded-2xl flex items-center justify-center shadow-lg border border-slate-800 dark:border-slate-700">
            <Shield className="text-accent-500" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
              {isRtl ? 'لوحة تحكم السوبر أدمن' : 'Super Admin Dashboard'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{isRtl ? 'مركز إدارة عمليات HETTETY' : 'HETTETY Operations Command Center'}</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          {[
            { id: 'stats', label: isRtl ? 'الإحصائيات' : 'Stats', icon: <Target size={16} /> },
            { id: 'verifications', label: isRtl ? 'التوثيقات' : 'Verifications', icon: <Shield size={16} />, badge: pendingProperties.length },
            { id: 'users', label: isRtl ? 'المستخدمين' : 'Users', icon: <Users size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-white dark:bg-slate-700 text-brand-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600 cursor-default' 
                : 'text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer'
              }`}
            >
              {tab.icon} {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="bg-accent-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: isRtl ? 'إجمالي المستخدمين' : 'Total Users', value: users.length, icon: <Users />, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
            { label: isRtl ? 'طلبات التوثيق' : 'Pending Verifications', value: pendingProperties.length, icon: <Clock />, color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
            { label: isRtl ? 'العقارات الموثقة' : 'Verified Units', value: users.length * 2, icon: <CheckCircle />, color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' }, // Mock stat for UI
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-500">
              <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
                {stat.icon}
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">{stat.label}</p>
              <h3 className="text-4xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'verifications' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl animate-scale-up">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ShieldCheck className="text-green-600 dark:text-green-400" />
              {isRtl ? 'طلبات التوثيق المعلقة' : 'Pending Verification Requests'}
            </h2>
          </div>
          {pendingProperties.length === 0 ? (
            <div className="p-20 text-center text-slate-400 dark:text-slate-600">
              <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">{isRtl ? 'لا توجد طلبات معلقة حالياً' : 'No pending requests at the moment.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">{isRtl ? 'العقار' : 'Property'}</th>
                    <th className="px-8 py-4">{isRtl ? 'الموقع' : 'Location'}</th>
                    <th className="px-8 py-4">{isRtl ? 'التاريخ' : 'Date'}</th>
                    <th className="px-8 py-4 text-right">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingProperties.map((prop) => (
                    <tr key={prop.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img src={prop.imageUrl} className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{prop.title}</div>
                            <div className="text-xs text-brand-600 dark:text-brand-400 font-medium">{prop.unitCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-slate-600 dark:text-slate-400 text-sm">{prop.location}</td>
                      <td className="px-8 py-6 text-slate-400 dark:text-slate-500 text-xs">{prop.publishDate}</td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleVerifyProperty(prop.id, 'Verified')}
                            className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-600 dark:hover:bg-green-600 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            {isRtl ? 'توثيق' : 'Verify'}
                          </button>
                          <button 
                            onClick={() => handleVerifyProperty(prop.id, 'Rejected')}
                            className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            {isRtl ? 'رفض' : 'Reject'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl animate-scale-up">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">
                 <tr>
                   <th className="px-8 py-4">{isRtl ? 'المستخدم' : 'User'}</th>
                   <th className="px-8 py-4">{isRtl ? 'البريد الإلكتروني' : 'Email'}</th>
                   <th className="px-8 py-4">{isRtl ? 'الدور' : 'Role'}</th>
                   <th className="px-8 py-4 text-right">{isRtl ? 'تغيير الامتيازات' : 'Permissions'}</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {users.map((user) => (
                   <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                     <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs uppercase">
                           {user.name?.charAt(0) || 'U'}
                         </div>
                         <div className="font-bold text-slate-900 dark:text-white">{user.name || 'Anonymous'}</div>
                       </div>
                     </td>
                     <td className="px-8 py-6 text-slate-600 dark:text-slate-400 text-sm">{user.email}</td>
                     <td className="px-8 py-6">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                         user.role === 'admin' ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                       }`}>
                         {user.role}
                       </span>
                     </td>
                     <td className="px-8 py-6 text-right">
                       {user.email !== 'marwaneltaweel0@gmail.com' && user.email !== 'abdallahahmedpilot2426@gmail.com' && user.email !== 'pro.mahmoud.h@gmail.com' ? (
                         <Button 
                           onClick={() => toggleRole(user.id, user.role)}
                           disabled={updating === user.id}
                           variant="outline"
                           className="text-xs py-1.5 px-4 rounded-lg font-bold"
                         >
                           {updating === user.id ? <Loader2 className="animate-spin" size={14} /> : (user.role === 'admin' ? (isRtl ? 'إزالة مشرف' : 'Demote') : (isRtl ? 'ترقية لمشرف' : 'Promote'))}
                         </Button>
                       ) : (
                         <div className="flex items-center justify-end gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase">
                            <Sparkles size={12} className="text-accent-500" />
                            <span>{isRtl ? 'سوبر أدمن' : 'Super Admin'}</span>
                         </div>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};


// --- Legal Sessions Page ---
// --- Main App ---

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [listingSearchQuery, setListingSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'>('default');
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [paymentProperty, setPaymentProperty] = useState<Property | null>(null);
  const [aiFilteredIds, setAiFilteredIds] = useState<string[] | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  // Hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setCurrentPage(hash as Page);
      } else {
        setCurrentPage('home');
      }
    };

    // Initial check on load
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // --- Theme Management ---
  useEffect(() => {
    let savedTheme = null;
    try {
      savedTheme = localStorage.getItem('theme');
    } catch (e) {
      // Ignore localStorage errors in iframes
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = (dark: boolean) => {
      if (dark) {
        document.documentElement.classList.add('dark');
        setIsDarkMode(true);
      } else {
        document.documentElement.classList.remove('dark');
        setIsDarkMode(false);
      }
    };

    if (savedTheme === 'dark') {
      applyTheme(true);
    } else if (savedTheme === 'light') {
      applyTheme(false);
    } else {
      applyTheme(mediaQuery.matches);
    }

    const handleChange = (e: MediaQueryListEvent) => {
      let currentStored = null;
      try { currentStored = localStorage.getItem('theme'); } catch(e) {}
      if (!currentStored) {
        applyTheme(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      try { localStorage.setItem('theme', 'dark'); } catch(e) {}
    } else {
      document.documentElement.classList.remove('dark');
      try { localStorage.setItem('theme', 'light'); } catch(e) {}
    }
  };

  // Firebase Auth Listener
  useEffect(() => {
    // Show splash for at least 3.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email);
        const superAdminEmails = ["marwaneltaweel0@gmail.com", "abdallahahmedpilot2426@gmail.com", "pro.mahmoud.h@gmail.com"];
        const isSuper = superAdminEmails.includes(user.email || "");
        setIsSuperAdmin(isSuper);

        // Fetch user data from Firestore to get role and name
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsAdmin(userData.role === 'admin' || isSuper);
            setUserName(userData.name || user.displayName);
            setUserFavorites(userData.favorites || []);
          } else {
            setIsAdmin(isSuper);
            setUserName(user.displayName);
            setUserFavorites([]);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setIsAdmin(isSuper);
          setUserName(user.displayName);
        }

        // Fetch notifications
        const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
        const unsubNotifications = onSnapshot(q, (snapshot) => {
          const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
          setNotifications(notifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }, (error) => {
          console.error('Error fetching notifications:', error);
        });
        
        // Store unsub function to cleanup later if needed
        (window as any).unsubNotifications = unsubNotifications;

      } else {
        setUserEmail(null);
        setUserName(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setNotifications([]);
        if ((window as any).unsubNotifications) {
          (window as any).unsubNotifications();
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserFavorites([]);
      handleNav('home');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!auth.currentUser) {
      handleNav('login');
      return;
    }

    const newFavorites = userFavorites.includes(propertyId)
      ? userFavorites.filter(id => id !== propertyId)
      : [...userFavorites, propertyId];

    setUserFavorites(newFavorites);

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        favorites: newFavorites
      });
    } catch (err) {
      console.error("Error updating favorites:", err);
    }
  };

  const handleAiSearch = async () => {
    if (!listingSearchQuery.trim()) {
      setAiFilteredIds(null);
      return;
    }
    
    setIsAiSearching(true);
    try {
      // Safely access process.env to avoid ReferenceError in Vercel browser build
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is missing. AI search will not work.");
        setAiFilteredIds(null);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        You are an AI real estate assistant. Return ONLY a JSON array of property IDs that match the user's search query.
        User Query: "${listingSearchQuery}"
        Available Properties:
        ${JSON.stringify(properties.map(p => ({ id: p.id, title: p.title, location: p.location, price: p.price, type: p.status })), null, 2)}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array of property IDs matching the search query"
          }
        }
      });

      const text = response.text;
      const ids = JSON.parse(text || "[]");
      setAiFilteredIds(ids);
    } catch (err: any) {
      console.error("AI Search Error:", err);
      alert(`AI Search Error: ${err?.message || String(err)}. Please check your API key.`);
      // Fallback to null if error
      setAiFilteredIds(null);
    } finally {
      setIsAiSearching(false);
    }
  };

  let filteredProperties = properties.filter(p => {
    const matchesPrice = (minPrice === '' || p.price >= Number(minPrice)) &&
                         (maxPrice === '' || p.price <= Number(maxPrice));
    
    if (aiFilteredIds !== null) {
      return aiFilteredIds.includes(p.id) && matchesPrice;
    }
    return (p.title.toLowerCase().includes(listingSearchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(listingSearchQuery.toLowerCase())) && matchesPrice;
  });

  if (sortBy === 'price-asc') {
    filteredProperties.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    filteredProperties.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'name-asc') {
    filteredProperties.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === 'name-desc') {
    filteredProperties.sort((a, b) => b.title.localeCompare(a.title));
  }

  // Initial Fetch from Firestore
  useEffect(() => {
    const fetchProps = async () => {
      setLoadingProps(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'properties'));
        let propsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Property[];
        
        // If no properties in Firestore yet, use mock data as fallback or initial seed
        if (propsData.length === 0) {
          const res = await api.getProperties();
          if (res.success && res.data) setProperties(res.data);
        } else {
          const res = await api.getProperties();
          const mockProps = res.success && res.data ? res.data : [];
          // Prepend ELAN Sarai and mock props to firestore ones so they are always visible
          const merged = [...mockProps, ...propsData].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
          setProperties(merged);
        }
      } catch (err) {
        console.error("Error fetching properties from Firestore:", err);
        // Fallback to mock API if Firestore fails
        const res = await api.getProperties();
        if (res.success && res.data) setProperties(res.data);
      } finally {
        setLoadingProps(false);
      }
    };
    fetchProps();
  }, []);

  // SEO Schema
  useEffect(() => {
    if (document.getElementById('schema-json-ld')) return;
    const script = document.createElement('script');
    script.id = 'schema-json-ld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      "name": "HETTETY",
      "image": "https://www.hettety.com/logo.png",
      "description": INITIAL_ENTITY_DATA.shortDescription,
      "address": { "@type": "PostalAddress", "addressCountry": "EG" }
    });
    document.head.appendChild(script);
  }, []);

  const handleNav = (page: Page) => {
    window.location.hash = page;
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo(0,0);
  };

  const open3D = (id: string) => {
    setSelectedPropertyId(id);
    handleNav('3d');
  };

  const NavLink = ({ page, label }: { page: Page, label: string }) => (
    <button 
      onClick={() => handleNav(page)} 
      className={`text-sm font-bold transition-all cursor-pointer relative group py-2
        ${currentPage === page ? 'text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400'}`}
    >
      {label}
    </button>
  );

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isRtl ? 'font-cairo' : ''} bg-[#f8fafc] dark:bg-slate-900 transition-colors duration-500`} dir={isRtl ? 'rtl' : 'ltr'}>
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : (
        <>
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-none text-slate-900 dark:text-white shadow-sm dark:shadow-slate-950 transition-all duration-500">
        <div className="w-full px-4 sm:px-10 h-20 flex items-center justify-between">
          {/* Logo Group - Left side */}
          <div className="flex items-center shrink-0">
            <div className="cursor-pointer transform hover:scale-105 transition-all duration-300" onClick={() => handleNav('home')}>
              <Logo className="h-14 w-auto text-brand-900 dark:text-white transition-colors" />
            </div>
          </div>

          {/* Menu & Actions Group - Right side (Opposite to logo) */}
          <div className="flex items-center gap-6 xl:gap-10">
            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-8 xl:gap-12">
              <NavLink page="home" label={t.nav_home} />
              <NavLink page="listings" label={t.nav_listings} />
              <NavLink page="legal" label={t.nav_trust} />
              <button 
                onClick={() => handleNav('ai-chat')} 
                className={`font-black text-xs transition-all flex items-center gap-2 cursor-pointer px-5 py-2.5 rounded-full uppercase tracking-[0.1em] shadow-sm ${currentPage === 'ai-chat' ? 'bg-brand-600 text-white shadow-brand-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600'}`}
              >
                <Sparkles size={16} className="animate-pulse" />
                {t.nav_ai}
              </button>
              <NavLink page="about" label={t.footer_about} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <div className="hidden md:flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => toggleDarkMode()} 
                  className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 shadow-sm active:scale-90"
                  aria-label="Toggle Theme"
                >
                  <div className="transform transition-transform duration-500 hover:rotate-12">
                    {isDarkMode ? <Sun size={24} className="text-amber-500" /> : <Moon size={24} className="text-slate-600" />}
                  </div>
                </button>
                <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="w-10 h-10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all flex items-center justify-center cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                  <span className="text-xs font-black tracking-widest leading-none">{lang === 'en' ? 'AR' : 'EN'}</span>
                </button>
              </div>
            
            {userEmail && (
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700" 
                  aria-label="Notifications"
                >
                  <Bell size={22} className="text-slate-500 dark:text-slate-400" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className={`absolute top-full mt-4 w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 ${isRtl ? 'left-0' : 'right-0'} animate-fade-in`}>
                    <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                      <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest italic">{isRtl ? 'الإشعارات' : 'Notifications'}</h3>
                      <span className="text-[10px] bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 px-3 py-1.5 rounded-full font-black tracking-widest">
                        {notifications.filter(n => !n.read).length} {isRtl ? 'جديد' : 'NEW'}
                      </span>
                    </div>
                    <div className="max-h-[30rem] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-16 text-center text-slate-400">
                          <Bell className="w-12 h-12 mx-auto mb-4 opacity-10" />
                          <p className="text-xs font-bold uppercase tracking-widest opacity-60">{isRtl ? 'لا توجد إشعارات حالياً' : 'Inbox is empty'}</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.id} className={`p-5 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${!notif.read ? 'bg-brand-50/20 dark:bg-brand-900/10' : ''}`}>
                            <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1.5 tracking-tight">{notif.title}</h4>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-3">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{new Date(notif.date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 mx-2 hidden sm:block"></div>
            
            <button className="lg:hidden cursor-pointer text-slate-900 dark:text-white p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>
      </nav>

      {/* Mobile Menu Overlay - Move out of nav for better compatibility */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-white dark:bg-slate-950 p-6 flex flex-col items-center justify-start overflow-y-auto animate-fade-in shadow-2xl">
          <div className="w-full flex justify-between items-center mb-10">
             <Logo className="h-10 w-auto text-brand-900 dark:text-white" />
             <button className="p-3 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-900 dark:text-white active:scale-90 transition-transform" onClick={() => setMobileMenuOpen(false)}>
                <X size={24} />
             </button>
          </div>
          
          <div className="w-full space-y-2 flex flex-col items-center text-center">
            <button onClick={() => handleNav('home')} className="w-full py-4 text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter hover:text-brand-600 transition-colors">
              {t.nav_home}
            </button>
            <button onClick={() => handleNav('listings')} className="w-full py-4 text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter hover:text-brand-600 transition-colors">
              {t.nav_listings}
            </button>
            <button onClick={() => handleNav('legal')} className="w-full py-4 text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter hover:text-brand-600 transition-colors">
              {t.nav_trust}
            </button>
            {userEmail && (
              <button onClick={() => handleNav('add-listing')} className="w-full py-4 text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter hover:text-brand-600 transition-colors">
                {isRtl ? 'إضافة عقار' : 'Add Listing'}
              </button>
            )}
            <button onClick={() => handleNav('ai-chat')} className="w-full py-6 mt-6 bg-brand-600 text-white rounded-[2rem] font-black text-2xl uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl shadow-brand-500/40 active:scale-95 transition-transform">
              <Sparkles size={24} /> {t.nav_ai}
            </button>
            <button onClick={() => handleNav('about')} className="w-full py-6 text-lg font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {t.footer_about}
            </button>

            <div className="w-full pt-10 mt-10 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4">
              <div className="flex gap-4">
                <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="flex-1 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs border border-slate-100 dark:border-slate-800">
                  {lang === 'en' ? 'اللغة العربية' : 'English Language'}
                </button>
                <button 
                  onClick={() => toggleDarkMode()}
                  className="w-20 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 py-4 active:scale-95 transition-transform"
                >
                  {isDarkMode ? <Sun size={28} className="text-amber-500" /> : <Moon size={28} />}
                </button>
              </div>
              <button 
                onClick={() => handleNav(userEmail ? 'profile' : 'login')} 
                className="w-full py-5 rounded-2xl bg-slate-900 dark:bg-brand-600 text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl active:scale-[0.98] transition-all"
              >
                 {userEmail ? (isRtl ? 'الملف الشخصي' : 'Go to Profile') : (isRtl ? 'تسجيل الدخول' : 'Sign In Now')}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
        {currentPage === 'home' && (
          <>
            <PremiumHero 
              onPrimaryCta={() => handleNav('register')} 
              onSecondaryCta={() => handleNav('listings')} 
              t={t}
              isRtl={isRtl}
            />
            <Features t={t} />
            <div className="bg-slate-100 dark:bg-slate-900/50 py-10">
               <ComingSoon3D t={t} isRtl={isRtl} />
            </div>
            <div className="py-20 max-w-7xl mx-auto px-4">
              <div className="flex justify-between items-end mb-10">
                <div><h2 className="text-3xl font-heading font-bold text-brand-900 dark:text-white mb-2">{t.prop_featured}</h2><p className="text-slate-600 dark:text-slate-400">{t.prop_subtitle}</p></div>
                <button onClick={() => handleNav('listings')} className="text-accent-600 dark:text-accent-400 font-bold flex items-center gap-1 hover:gap-2 transition-all cursor-pointer">{t.prop_view_all} {isRtl ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {loadingProps 
                  ? [1,2,3].map(i => <div key={i} className="h-96 bg-slate-200 rounded-2xl animate-pulse"></div>)
                  : properties.slice(0, 3).map(p => (
                    <PropertyCard 
                      key={p.id} 
                      property={p} 
                      onView3D={() => open3D(p.id)} 
                      onToggleFavorite={() => toggleFavorite(p.id)}
                      isFavorited={userFavorites.includes(p.id)}
                      onClick={() => setViewingProperty(p)} 
                      t={t} 
                      isRtl={isRtl} 
                    />
                  ))
                }
              </div>
            </div>
          </>
        )}

        {currentPage === 'listings' && (
          <div className="py-12 max-w-7xl mx-auto px-4">
            <div className="mb-8 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
               <h1 className="text-3xl lg:text-4xl font-heading font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.prop_avail}</h1>
               <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full lg:w-auto">
                 <div className="relative flex-1 min-w-[240px] flex gap-2">
                   <div className="relative flex-1">
                     <Search className={`absolute top-3 text-slate-400 w-4 h-4 ${isRtl ? 'right-3' : 'left-3'}`} />
                     <input 
                       placeholder={t.prop_search} 
                       value={listingSearchQuery}
                       onChange={(e) => {
                         setListingSearchQuery(e.target.value);
                         setAiFilteredIds(null);
                       }}
                       onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                       className={`w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none text-black dark:text-white ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'}`} 
                     />
                   </div>
                   <button 
                     onClick={handleAiSearch}
                     disabled={isAiSearching || !listingSearchQuery.trim()}
                     className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     title={isRtl ? 'بحث بالذكاء الاصطناعي' : 'AI Search'}
                   >
                     {isAiSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                   </button>
                 </div>
                 <div className="relative flex-1 md:w-32">
                   <DollarSign className={`absolute top-3 text-slate-400 w-4 h-4 ${isRtl ? 'right-3' : 'left-3'}`} />
                   <input 
                     type="number"
                     min="0"
                     placeholder={isRtl ? 'الحد الأدنى' : 'Min Price'} 
                     value={minPrice}
                     onChange={(e) => {
                       const val = e.target.value;
                       if (val === '') setMinPrice('');
                       else if (Number(val) >= 0) setMinPrice(Number(val));
                     }}
                     className={`w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none text-black dark:text-white ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'}`} 
                   />
                 </div>
                 <div className="relative flex-1 md:w-32">
                   <DollarSign className={`absolute top-3 text-slate-400 w-4 h-4 ${isRtl ? 'right-3' : 'left-3'}`} />
                   <input 
                     type="number"
                     min="0"
                     placeholder={isRtl ? 'الحد الأقصى' : 'Max Price'} 
                     value={maxPrice}
                     onChange={(e) => {
                       const val = e.target.value;
                       if (val === '') setMaxPrice('');
                       else if (Number(val) >= 0) setMaxPrice(Number(val));
                     }}
                     className={`w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none text-black dark:text-white ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'}`} 
                   />
                 </div>
                 <select 
                   value={sortBy}
                   onChange={(e) => setSortBy(e.target.value as any)}
                   className="py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none text-black dark:text-white flex-1 sm:flex-none sm:min-w-[180px]"
                 >
                   <option value="default">{isRtl ? 'الترتيب الافتراضي' : 'Default Sort'}</option>
                   <option value="price-asc">{isRtl ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                   <option value="price-desc">{isRtl ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                   <option value="name-asc">{isRtl ? 'الاسم: أ إلى ي' : 'Name: A to Z'}</option>
                   <option value="name-desc">{isRtl ? 'الاسم: ي إلى أ' : 'Name: Z to A'}</option>
                 </select>
               </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
               {loadingProps 
                  ? [1,2,3,4,5,6].map(i => <div key={i} className="h-96 bg-slate-200 rounded-2xl animate-pulse"></div>)
                  : filteredProperties.map(p => (
                    <PropertyCard 
                      key={p.id} 
                      property={p} 
                      onView3D={() => open3D(p.id)} 
                      onToggleFavorite={() => toggleFavorite(p.id)}
                      isFavorited={userFavorites.includes(p.id)}
                      onClick={() => setViewingProperty(p)} 
                      t={t} 
                      isRtl={isRtl} 
                    />
                  ))
               }
            </div>
          </div>
        )}

        {currentPage === 'manage-users' && isSuperAdmin && <SuperAdminDashboard isRtl={isRtl} />}
        {currentPage === 'ai-chat' && <div className="bg-slate-100 h-full py-8"><AIChat t={t} isRtl={isRtl} properties={properties} userName={userName} /></div>}
        {currentPage === 'legal' && <LegalCenter t={t} isRtl={isRtl} userEmail={userEmail} />}
        {currentPage === 'about' && <AboutPage onCta={() => handleNav('register')} t={t} isRtl={isRtl} />}
        {currentPage === 'terms' && <TermsPage t={t} isRtl={isRtl} />}
        {currentPage === 'privacy' && <PrivacyPage t={t} isRtl={isRtl} />}
        {currentPage === 'cookie-policy' && <CookiePolicyPage t={t} isRtl={isRtl} />}
        {currentPage === 'buy' && <BuyPropertyPage onCta={() => handleNav('listings')} t={t} isRtl={isRtl} />}
        {currentPage === 'verification' && <VerificationPage onCta={() => handleNav('legal')} t={t} isRtl={isRtl} />}
        {currentPage === 'tours' && <Tours3DPage onCta={() => handleNav('3d-experience')} t={t} isRtl={isRtl} />}
        {currentPage === '3d' && selectedPropertyId && <Viewer3D propertyId={selectedPropertyId} onClose={() => { setSelectedPropertyId(null); handleNav('listings'); }} t={t} isRtl={isRtl} />}
        {currentPage === '3d-experience' && <ComingSoon3D t={t} isRtl={isRtl} />}
        {currentPage === 'profile' && (
          <ProfilePage 
            t={t} 
            isRtl={isRtl} 
            onBrowse={() => handleNav('listings')} 
            onLogout={handleLogout} 
            onLogin={() => handleNav('login')} 
            userEmail={userEmail}
            userFavorites={userFavorites}
            allProperties={properties}
            onToggleFavorite={toggleFavorite}
            open3D={open3D}
          />
        )}
        {currentPage === 'payment' && paymentProperty && (
          <PaymentPage 
            property={paymentProperty} 
            onConfirm={async () => {
              try {
                if (auth.currentUser) {
                  await addDoc(collection(db, 'purchases'), {
                    userId: auth.currentUser.uid,
                    propertyId: paymentProperty.id,
                    status: 'processing',
                    createdAt: new Date().toISOString()
                  });
                  
                  // Add a notification
                  await addDoc(collection(db, 'notifications'), {
                    userId: auth.currentUser.uid,
                    title: isRtl ? 'طلب شراء قيد المراجعة' : 'Purchase Request Received',
                    message: isRtl 
                      ? `تم استلام طلبك للعقار ${paymentProperty.title}. سيقوم أحد خبرائنا بالتواصل معك قريباً.` 
                      : `Your request for ${paymentProperty.title} has been received. Our expert will contact you shortly.`,
                    date: new Date().toISOString(),
                    read: false
                  });
                }
                handleNav('profile');
                setPaymentProperty(null);
              } catch (err: any) {
                console.error("Purchase error:", err);
                alert(`Error: ${err?.message || String(err)}`);
              }
            }} 
            onCancel={() => {
              setPaymentProperty(null);
              handleNav('listings');
            }} 
            t={t} 
            isRtl={isRtl} 
          />
        )}
        {currentPage === 'add-listing' && (
          <AddListingPage 
            isAdmin={isAdmin}
            isSuperAdmin={isSuperAdmin}
            onAdd={async (prop) => {
              try {
                await addDoc(collection(db, 'properties'), {
                  ...prop,
                  authorUid: auth.currentUser?.uid || 'anonymous'
                });
                // Refresh properties
                const querySnapshot = await getDocs(collection(db, 'properties'));
                const propsData = querySnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                })) as Property[];
                setProperties(propsData);
                handleNav('listings');
              } catch (err) {
                console.error("Error adding property to Firestore:", err);
                // Fallback to mock API if Firestore fails
                const res = await api.addProperty(prop);
                if (res.success) {
                  const res2 = await api.getProperties();
                  if (res2.success && res2.data) setProperties(res2.data);
                  handleNav('listings');
                }
              }
            }} 
            t={t} 
            isRtl={isRtl} 
          />
        )}
        
        {currentPage === 'login' && <AuthForm type="login" onSwitch={() => handleNav('register')} onSubmit={(email) => { setUserEmail(email); handleNav('home'); }} t={t} isRtl={isRtl} />}
        {currentPage === 'register' && <AuthForm type="register" onSwitch={() => handleNav('login')} onSubmit={(email) => { setUserEmail(email); handleNav('home'); }} t={t} isRtl={isRtl} />}

        {currentPage === 'contact' && (
           <div className="max-w-4xl mx-auto px-4 py-16">
             <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
               <div className="bg-slate-900 p-10 text-white md:w-2/5 flex flex-col justify-between">
                  <div><h2 className="text-2xl font-heading font-bold mb-6">{t.contact_title}</h2><p className="text-slate-400 mb-8">{t.contact_desc}</p></div>
                  <div className="pt-10"><Logo color="white" className="h-10" /></div>
               </div>
               <div className="p-10 md:w-3/5">
                 <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                   <div><label className="block text-sm font-medium text-slate-700 mb-1">{t.auth_email}</label><input type="email" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none text-black" placeholder="you@example.com" /></div>
                   <div><label className="block text-sm font-medium text-slate-700 mb-1">{t.contact_msg}</label><textarea rows={4} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none text-black" placeholder="I'm interested in..." /></div>
                   <Button className="w-full">{t.contact_btn}</Button>
                 </form>
               </div>
             </div>
           </div>
        )}
      </main>

      {/* Cookie Consent Modal */}
      <CookieConsent t={t} isRtl={isRtl} onNavigateToLegal={handleNav} />

      {viewingProperty && (
        <PropertyModal
          property={viewingProperty}
          onClose={() => setViewingProperty(null)}
          onPurchase={(id) => {
            setViewingProperty(null);
            setPaymentProperty(viewingProperty);
            handleNav('payment');
          }}
          t={t}
          isRtl={isRtl}
        />
      )}

      <footer className="bg-slate-900 dark:bg-black text-slate-400 py-12 border-t border-slate-800 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          <div><div className="flex items-center gap-2 mb-4 text-white"><Logo color="white" className="h-8" /></div><p className="text-sm">{t.footer_desc}</p></div>
          <div>
            <h4 className="text-white font-bold mb-4">{t.footer_services}</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => handleNav('buy')} className="hover:text-white transition-colors">{t.footer_buy}</button></li>
              <li><button onClick={() => handleNav('verification')} className="hover:text-white transition-colors">{t.footer_verify}</button></li>
              <li><button onClick={() => handleNav('tours')} className="hover:text-white transition-colors">{t.footer_3d}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">{t.footer_company}</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => handleNav('about')} className="hover:text-white transition-colors">{t.footer_about}</button></li>
              <li><button onClick={() => handleNav('terms')} className="hover:text-white transition-colors">{t.footer_terms}</button></li>
              <li><button onClick={() => handleNav('privacy')} className="hover:text-white transition-colors">{t.nav_privacy}</button></li>
              <li><button onClick={() => handleNav('cookie-policy')} className="hover:text-white transition-colors">{t.nav_cookie}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">{t.footer_connect}</h4>
            <div className="flex gap-4">
              <a href="https://www.tiktok.com/@hettety5?_r=1&_t=ZS-95rJ2NUzN2b" target="_blank" rel="noreferrer" className="w-8 h-8 bg-slate-800 rounded-full hover:bg-brand-500 cursor-pointer flex items-center justify-center text-white transition-colors">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
              </a>
              <a href="https://www.instagram.com/hettety_realstate?igsh=Z3Y4NXB4ZHN3cXFu" target="_blank" rel="noreferrer" className="w-8 h-8 bg-slate-800 rounded-full hover:bg-brand-500 cursor-pointer flex items-center justify-center text-white transition-colors">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-8 h-8 bg-slate-800 rounded-full hover:bg-brand-500 cursor-pointer flex items-center justify-center text-white transition-colors">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
      </>
      )}
    </div>
  );
}
