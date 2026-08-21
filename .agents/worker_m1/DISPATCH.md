## 2026-08-21T10:52:34Z
You are Worker M1 for Milestone 1 (Design System, Theming & UI Feedback).

Your Working Directory: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4\.agents\worker_m1
Project Root: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4
Original Request: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4\.agents\ORIGINAL_REQUEST.md
Master Project Spec: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4\PROJECT.md
Survey 1 Handoff: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4\.agents\explorer_survey_1\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
You own:
- `src/index.css`
- `index.html`
- `vite.config.ts`
- `src/components/PremiumHero.tsx`
- `src/components/AboutPage.tsx`
- `src/components/ServicePages.tsx`
- `src/components/TermsPage.tsx`
- `src/components/PrivacyPage.tsx`
- `src/components/CookiePolicyPage.tsx`
- `src/components/Toast.tsx` (create new)
- `src/components/EmptyState.tsx` (create new)

Task Scope:
1. **Palette Unification**: Replace all instances of rogue emerald (#10B981, emerald-400, emerald-500) across AboutPage, ServicePages, TermsPage, PrivacyPage, CookiePolicyPage, PremiumHero with luxury Navy (`brand-500`/`brand-600`) and Orange (`accent-500`/`accent-600`) tokens.
2. **Arabic Typography & Ligature Tracking**: Update `src/index.css` to enforce `font-cairo` and `tracking-normal` on RTL / Arabic contexts so Arabic letter connections are not broken by positive tracking.
3. **Document Root Synchronization**: Ensure `index.html` and root language synchronization hooks properly handle `dir="rtl"` / `dir="ltr"` and `lang="ar"` / `lang="en"`.
4. **Vite Manual Chunks Optimization**: Update `vite.config.ts` line 22 to reference `'motion'` / `'motion/react'` instead of legacy `'framer-motion'`, resolving chunk size inflation.
5. **Toast Notification System**: Implement `src/components/Toast.tsx` (and `useToast` hook or context/dispatcher) with animated glassmorphism pill, supporting `success`, `error`, `info`, `warning`, and accessible `role="alert"`.
6. **Reusable Empty State**: Implement `src/components/EmptyState.tsx` with customizable icon/illustration, localized title & description, and action CTA button (for zero search results, empty favorites, etc.).
7. **Verification**: Run `npm run lint` (`tsc --noEmit`) and `npm run build` to ensure 0 errors.

Write handoff to `.agents/worker_m1/handoff.md` and notify orchestrator when done.
