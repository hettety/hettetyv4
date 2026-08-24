import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  onClose: () => void;
  isRtl: boolean;
}

/**
 * Anything loaded on demand can fail to arrive — a dropped connection, or a
 * deploy that replaced the file this page was built against. Without a boundary
 * React unwinds to the nearest one, and with none in the tree the reader is left
 * staring at a spinner that will never stop. This says what happened and offers
 * the one thing that fixes it.
 */
export class LoadErrorBoundary extends React.Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[hettety] a lazily loaded view failed to start', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const { isRtl, onClose } = this.props;

    return (
      <div
        role="alertdialog"
        aria-modal="true"
        dir={isRtl ? 'rtl' : 'ltr'}
        className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center gap-5 p-6 text-center"
      >
        <AlertTriangle className="w-10 h-10 text-amber-400" aria-hidden="true" />
        <p className="text-white text-lg font-bold">
          {isRtl ? 'تعذّر فتح العارض' : 'The viewer could not start'}
        </p>
        <p className="text-white/70 text-sm max-w-sm">
          {isRtl
            ? 'غالبًا الصفحة مفتوحة من قبل تحديث للموقع. حدّث الصفحة وهتشتغل.'
            : 'This page was most likely open from before the site was updated. Refreshing will fix it.'}
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[44px] px-5 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <RefreshCw size={16} aria-hidden="true" />
            {isRtl ? 'حدّث الصفحة' : 'Refresh the page'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <X size={16} aria-hidden="true" />
            {isRtl ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    );
  }
}

export default LoadErrorBoundary;
