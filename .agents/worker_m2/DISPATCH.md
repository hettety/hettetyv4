## 2026-08-21T11:02:29Z

You are Worker M2 for Milestone 2: Web Accessibility (WCAG 2.1 AA) & Focus Traps Remediation.

Your Working Directory: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4\.agents\worker_m2
Project Root: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4
Original Request: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4\.agents\ORIGINAL_REQUEST.md
Master Project Spec: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4\PROJECT.md
Survey 2 Handoff: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4\.agents\explorer_survey_2\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
- `src/hooks/useFocusTrap.ts` (create new)
- `src/components/CookieConsent.tsx`
- `src/components/Property3DViewer.tsx`
- `src/App.tsx`

Scope of Work (WCAG 2.1 AA Strict Compliance):
1. **Focus Trap Hook (`src/hooks/useFocusTrap.ts`)**:
   - Implement a reusable hook `useFocusTrap<T extends HTMLElement>(isActive: boolean, onEscape?: () => void)` that manages Tab/Shift+Tab cycling inside the referenced element, listens for Escape key, and restores focus to the previously active element upon closing.
2. **Modal Dialog & Drawer Hardening**:
   - `src/components/CookieConsent.tsx`:
     - Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby="consent-title"`, integrate `useFocusTrap`, add Escape key handling.
     - Fix invalid HTML nesting bug where `<button>` elements were embedded inside `<label>` wrapping inputs.
     - Make entire modal theme-adaptive for Dark AND Light modes with WCAG AA compliant text contrast (`text-[#047857] dark:text-[#10B981]`, `bg-white dark:bg-slate-900`, `text-slate-900 dark:text-white`).
   - `src/components/Property3DViewer.tsx`:
     - Add `role="dialog"`, `aria-modal="true"`, `aria-label="3D Property Tour Viewer"`, integrate `useFocusTrap`, accessible close button with `aria-label`.
     - Remove hardcoded `dir="ltr"` so it respects the active document direction.
     - Add responsive/orientation-aware styles preventing control overlap in mobile landscape mode (`landscape:top-2 landscape:bottom-16`).
   - `src/App.tsx` Modals & Overlays:
     - Mobile Navigation Drawer: `role="dialog"`, `aria-modal="true"`, `aria-label="Mobile Navigation Menu"`, focus trap, Escape to close, focus restoration to hamburger toggle.
     - Legal Document Viewer Modal: `role="dialog"`, `aria-modal="true"`, focus trap, Escape to close.
     - Compare Properties Modal: `role="dialog"`, `aria-modal="true"`, focus trap, Escape to close.
3. **Interactive ARIA Labels, Roles & Keyboard Navigation**:
   - Add explicit `aria-label`, `aria-expanded`, and `aria-controls` on mobile hamburger button (`Menu`/`X`).
   - Add explicit `aria-label` describing action on Language switcher button.
   - Add explicit `aria-label` and `aria-pressed={isFavorited}` on `PropertyCard` favorite heart button.
   - Add explicit `aria-label` on all footer social media links (`TikTok`, `Instagram`, `Facebook`, etc.).
   - Add explicit `aria-label` on all icon-only close/delete buttons.
   - For custom clickable `<div>` elements (`PropertyCard`, form step tabs, carousel dots), add `role="button"`, `tabIndex={0}`, and `onKeyDown` handlers supporting `Enter` and `Space`.
4. **Media & Decorative Icons**:
   - Ensure all `<img>` tags across `App.tsx` have meaningful `alt` text.
   - Ensure decorative SVG and Lucide icons have `aria-hidden="true"`.
5. **Touch Targets & Color Contrast**:
   - Ensure mobile interactive controls meet minimum 48x48px touch targets (`min-w-[48px] min-h-[48px]`).
   - Fix low contrast text (replace `text-slate-400` on light background with `text-slate-600 dark:text-slate-400`; ensure all dark mode text meets >= 4.5:1 ratio).
6. **Verification**:
   - Run `npm run lint` (`tsc --noEmit`) and `npm run build` to verify clean compilation with 0 errors.

Write handoff report to `.agents/worker_m2/handoff.md` and notify orchestrator when complete.
