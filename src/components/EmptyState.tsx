import React from 'react';
import { motion } from 'motion/react';
import { Search, RefreshCw, FolderOpen, Heart, Building2, Sparkles, AlertCircle } from 'lucide-react';

export type EmptyStateVariant = 'search' | 'favorites' | 'listings' | 'notifications' | 'general' | 'error';

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  isRtl?: boolean;
  className?: string;
}

const variantDefaultIcons: Record<EmptyStateVariant, React.ReactNode> = {
  search: <Search className="w-10 h-10 text-accent-500" />,
  favorites: <Heart className="w-10 h-10 text-rose-500" />,
  listings: <Building2 className="w-10 h-10 text-brand-500" />,
  notifications: <Sparkles className="w-10 h-10 text-amber-500" />,
  general: <FolderOpen className="w-10 h-10 text-brand-500" />,
  error: <AlertCircle className="w-10 h-10 text-rose-500" />,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'search',
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  isRtl = false,
  className = '',
}) => {
  const displayIcon = icon || variantDefaultIcons[variant] || variantDefaultIcons.general;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`w-full max-w-lg mx-auto py-16 px-6 text-center flex flex-col items-center justify-center ${className}`}
    >
      {/* Icon Capsule with Glow Effect */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-brand-50 dark:bg-slate-800/80 border border-brand-100 dark:border-slate-700/60 shadow-lg flex items-center justify-center relative z-10 transition-transform duration-300 hover:scale-105">
          {displayIcon}
        </div>
        <div className="absolute inset-0 bg-accent-500/15 dark:bg-accent-500/10 blur-xl rounded-full -z-0 pointer-events-none transform scale-125"></div>
      </div>

      {/* Title */}
      <h3 className={`text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3 ${isRtl ? 'font-cairo tracking-normal' : 'font-heading tracking-tight'}`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-md leading-relaxed font-medium mb-8">
          {description}
        </p>
      )}

      {/* Action Buttons */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white font-bold text-sm md:text-base transition-all duration-200 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/35 transform hover:-translate-y-0.5 ${isRtl ? 'font-cairo' : ''}`}
            >
              {actionIcon || <RefreshCw size={18} className="stroke-[2.2]" />}
              <span>{actionLabel}</span>
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-sm md:text-base transition-all duration-200 hover:-translate-y-0.5 ${isRtl ? 'font-cairo' : ''}`}
            >
              <span>{secondaryActionLabel}</span>
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default EmptyState;
