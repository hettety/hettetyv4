import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"]):not([disabled])'
].join(', ');

/**
 * useFocusTrap hook traps keyboard focus within a specified DOM node while isActive is true,
 * handles Escape key press to invoke onEscape callback, and restores focus to the previously
 * focused element when deactivated.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  isActive: boolean,
  onEscape?: () => void
): React.RefObject<T | null> {
  const containerRef = useRef<T | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!isActive) return;

    // Save previous active element before trapping focus
    if (document.activeElement instanceof HTMLElement) {
      previousActiveElementRef.current = document.activeElement;
    }

    const container = containerRef.current;
    if (!container) return;

    // Focus the first focusable element inside the container, or the container itself
    const focusInitialElement = () => {
      if (!containerRef.current) return;
      const focusable = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        // Fallback: make container focusable if not already
        if (!containerRef.current.hasAttribute('tabindex')) {
          containerRef.current.setAttribute('tabindex', '-1');
        }
        containerRef.current.focus();
      }
    };

    const frameId = requestAnimationFrame(focusInitialElement);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onEscapeRef.current?.();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusables = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => {
        // In JSDOM/testing environments, offsetParent is always null
        const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
        if (isJsdom) return true;
        // Ensure element is visible and not display:none or visibility:hidden
        return el.offsetParent !== null || el.getClientRects().length > 0;
      });

      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const firstFocusable = focusables[0];
      const lastFocusable = focusables[focusables.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: moving backwards
        if (
          document.activeElement === firstFocusable ||
          !containerRef.current.contains(document.activeElement)
        ) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab: moving forwards
        if (
          document.activeElement === lastFocusable ||
          !containerRef.current.contains(document.activeElement)
        ) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', handleKeyDown, true);

      // Restore focus to previous element when closing
      const prevElement = previousActiveElementRef.current;
      if (prevElement && typeof prevElement.focus === 'function' && document.body.contains(prevElement)) {
        prevElement.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

export default useFocusTrap;
