# Project: Hettety Platform Overhaul (UI/UX, a11y, Responsive, Testing & Audit)

## Architecture
- **Framework**: React 19 + TypeScript + Vite + Tailwind CSS 4 + Lucide Icons + Motion
- **Internationalization**: Dual LTR (English) / RTL (Arabic, Cairo font) with dynamic root document synchronization
- **Theming**: Dark/Light mode with unified Luxury Navy (`brand`) & Orange (`accent`) palette
- **Data & State**: Mock data layer, Firebase Auth & Firestore client SDKs, Gemini AI assistant SDK
- **Accessibility Target**: WCAG 2.1 AA Strict Compliance

---

## Feature Inventory
Every feature from the Survey phase is mapped to its assigned milestone:

| # | Feature / Issue Area | Description | Milestone | Source |
|---|----------------------|-------------|-----------|--------|
| 1 | E2E Test Harness & Suite | Vitest + React Testing Library harness, Tier 1-4 requirement-driven tests | T1 (E2E Track) | Survey R4 |
| 2 | Palette & Brand Token Unification | Eliminate rogue emerald (#10B981) in 8 files; standardize on `brand-*` & `accent-*` | M1 | Survey R1 |
| 3 | Dark/Light Theming Consistency | Adaptive theme styling for CookieConsent, Contact Form, Profile Preferences, Dark Skeletons | M1 | Survey R1 |
| 4 | Arabic Typography & Tracking | Prevent ligature breaks with `rtl:tracking-normal`, ensure `font-cairo` on RTL | M1 | Survey R1 |
| 5 | Document Root `lang`/`dir` Sync | Synchronize `document.documentElement` `lang` and `dir` on language toggle | M1 | Survey R1 |
| 6 | Toast & Notification System | Non-blocking animated toast component replacing native `window.alert`/`confirm` | M1 | Survey R1 |
| 7 | Listings Empty & Feedback States | Dedicated empty state with illustration and filter reset CTA | M1 | Survey R1 |
| 8 | Vite Chunk Optimization | Fix `vite.config.ts` manualChunks to reference `motion` instead of `framer-motion` | M1 | Survey R4 |
| 9 | Reusable Focus Trap Hook | `useFocusTrap` hook for modal dialogs, drawers, and lightboxes | M2 | Survey R2 |
| 10 | CookieConsent Dialog a11y | `role="dialog"`, `aria-modal="true"`, focus trap, Esc key, unnest button from label | M2 | Survey R2 |
| 11 | Mobile Navigation Drawer a11y | Focus trap, Esc to close, focus restoration to hamburger, 48x48px touch target | M2 | Survey R2 |
| 12 | 3D Viewer Dialog & Focus a11y | Focus trap, accessible close button, orientation adaptation for landscape mode | M2 | Survey R2, R3 |
| 13 | Interactive ARIA & Keyboard Support | Explicit `aria-label`, `aria-expanded`, `role="button"`, `tabIndex={0}`, keyboard handlers | M2 | Survey R2 |
| 14 | Media & Icons a11y | Meaningful `alt` text on all `<img>` tags; `aria-hidden="true"` on decorative icons | M2 | Survey R2 |
| 15 | Touch Targets & Color Contrast | Ensure >=48x48px touch targets and >=4.5:1 text contrast in both light and dark modes | M2 | Survey R2 |
| 16 | PropertyCard RTL Badge Collision | Offset Verified badge in RTL to avoid collision with Heart favorite button | M3 | Survey R1, R3 |
| 17 | Add Listing Wizard RTL & Layout | Directional chevrons, step progress bar (`start-0`), select chevron overlay, mobile grid | M3 | Survey R1, R3 |
| 18 | Logical CSS Properties Conversion | Replace physical `border-l-4`, `pl-6`, `ml-4` with `border-s-4`, `ps-6`, `ms-4` | M3 | Survey R1, R3 |
| 19 | AI Chat Viewport & Flex Alignment | Use `100dvh` for mobile address bar resilience; fix quick suggestions flex centering | M3 | Survey R3 |
| 20 | Page Responsive Layouts & Grids | Listings filter grid, Compare modal sticky column, Admin tabs scroll, Profile header | M3 | Survey R3 |
| 21 | Full Test Verification & Build Check | 100% passing E2E tests, `tsc --noEmit` (0 errors), `npm run build` (0 errors) | M4 | Survey R4 |
| 22 | Adversarial Hardening (Tier 5) | White-box edge-case tests, security validation, and boundary testing | M4 | Survey R4 |
| 23 | Independent Victory Audit Report | Comprehensive audit document in `docs/VICTORY_AUDIT.md` with before/after evidence | M4 | Survey R5 |

---

## Milestones

| # | Track | Milestone Name | Scope | Dependencies | Status |
|---|-------|----------------|-------|--------------|--------|
| T1 | Testing | E2E Test Suite Creation | Vitest test runner setup, Tier 1-4 tests (navigation, theme, language, filters, modals, a11y, RTL), publish `TEST_READY.md` | none | PLANNED |
| M1 | Impl | Design System, Theming & UI Feedback (R1) | Color tokens, dark theme parity, Arabic tracking, root dir sync, Toast system, empty states, Vite chunks | none | PLANNED |
| M2 | Impl | Web Accessibility (WCAG 2.1 AA) & Focus Traps (R2) | `useFocusTrap`, CookieConsent & Drawer a11y, 3D viewer dialog, ARIA labels, alt text, 48px tap targets, contrast | M1 | PLANNED |
| M3 | Impl | Responsive Layouts, RTL Parity & Component Bug Fixes (R3) | PropertyCard RTL collision, AddListing wizard RTL, AI Chat 100dvh, Compare sticky col, page grids | M1, M2 | PLANNED |
| M4 | Impl | Final Verification, Adversarial Hardening & Victory Audit (R4, R5) | 100% E2E test pass, adversarial Tier 5 tests, `tsc`/`npm run build` 0 errors, `docs/VICTORY_AUDIT.md` | T1, M3 | PLANNED |

---

## Interface Contracts

### Toast Notification System (`src/components/Toast.tsx` / `useToast`)
- Functions: `showToast({ type: 'success' | 'error' | 'info' | 'warning', message: string, duration?: number })`
- Visuals: Glassmorphism pill with theme-adaptive colors, animated enter/exit with `motion`, accessible with `role="alert"` / `aria-live="polite"`.

### Focus Trap Hook (`src/hooks/useFocusTrap.ts`)
- Signature: `useFocusTrap<T extends HTMLElement>(isActive: boolean, onEscape?: () => void): React.RefObject<T>`
- Behavior: Cycles Tab/Shift+Tab focus strictly within container; closes on `Escape`; restores focus to previous active element on unmount/close.

### PropertyCard RTL Coordinates
- In LTR: Status Badge (`top-4 left-4`), Verified Badge (`top-4 right-12`), Favorite Button (`top-4 right-4`).
- In RTL: Status Badge (`top-4 right-4`), Verified Badge (`top-4 left-14`), Favorite Button (`top-4 left-4`).

---

## Code Layout
- `src/index.css`: Global styles, Cairo & Montserrat font definitions, RTL rules, custom utilities
- `src/hooks/useFocusTrap.ts`: Accessibility focus management hook
- `src/components/Toast.tsx`: Toast container and dispatch hook
- `src/components/EmptyState.tsx`: Reusable empty state component
- `src/components/PremiumHero.tsx`, `AboutPage.tsx`, `ServicePages.tsx`, `TermsPage.tsx`, `PrivacyPage.tsx`, `CookiePolicyPage.tsx`: Static & informational pages
- `src/components/CookieConsent.tsx`: Cookie consent banner with WCAG AA compliance
- `src/components/Property3DViewer.tsx`: 3D WebGL tour viewer dialog
- `src/components/add-listing-page.tsx`: Add listing 3-step property wizard
- `src/App.tsx`: Navigation, Home, Listings, AI Assistant, Legal, Profile, Admin Panel, Compare Modal
- `docs/VICTORY_AUDIT.md`: Victory Audit deliverable
- `tests/`: Automated UI & component test suite (Vitest + RTL)
