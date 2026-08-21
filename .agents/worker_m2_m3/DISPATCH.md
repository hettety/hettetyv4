## 2026-08-21T11:38:48Z

You are the Senior Implementation Worker for Milestone 2 (Accessibility & WCAG 2.1 AA) and Milestone 3 (Responsive Layouts, RTL Parity & Page Bug Hunting).

Your Working Directory: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4\.agents\worker_m2_m3
Project Root: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4
Original Request: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4\.agents\ORIGINAL_REQUEST.md
Master Project Spec: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4\PROJECT.md
Survey 1 Report: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4\.agents\explorer_survey_1\handoff.md
Survey 2 Report: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4\.agents\explorer_survey_2\handoff.md
Survey 3 Report: C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4\.agents\explorer_survey_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
- `src/App.tsx`
- `src/components/add-listing-page.tsx`
- `src/components/Toast.tsx` / `src/components/EmptyState.tsx`

Scope of Work:
1. **Accessibility (WCAG 2.1 AA) in `src/App.tsx`**:
   - Focus Traps: Wire `useFocusTrap` on Mobile Navigation Drawer, Legal Document Viewer Modal, and Compare Properties Modal (`role="dialog"`, `aria-modal="true"`, `Escape` listener, focus restoration).
   - Accessible Names & Roles:
     - Mobile hamburger button: `aria-label={mobileMenuOpen ? (isRtl ? 'إغلاق القائمة' : 'Close menu') : (isRtl ? 'فتح القائمة' : 'Open menu')}`, `aria-expanded={mobileMenuOpen}`, `aria-controls="mobile-navigation"`.
     - Language button: `aria-label={isRtl ? 'Switch language to English' : 'تغيير اللغة إلى العربية'}`.
     - Favorite button on PropertyCard: `aria-label={isFavorited ? (isRtl ? 'إزالة من المفضلة' : 'Remove from favorites') : (isRtl ? 'إضافة إلى المفضلة' : 'Add to favorites')}`, `aria-pressed={isFavorited}`.
     - Footer social links: explicit `aria-label`s on TikTok, Instagram, Facebook, LinkedIn, YouTube links.
     - Custom clickable `<div>` (PropertyCard, step tabs, carousel dots): `role="button"`, `tabIndex={0}`, `onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}`.
     - Meaningful `alt` text on all `<img>` tags.
     - `aria-hidden="true"` on decorative icons.
     - Touch target sizes >= 48x48px on mobile interactive controls.
     - Contrast: ensure all text meets >= 4.5:1 ratio in both dark and light modes.

2. **Responsive Layouts & RTL Parity in `src/App.tsx`**:
   - PropertyCard RTL Badge Collision Fix: In Arabic mode (`isRtl = true`), ensure the Verified Badge is placed at `left-14` (or cleanly separated from the Favorite button at `left-4`), so they never overlap.
   - Listings Filter & Empty State: Wrap the 7 filter controls into a clean responsive flex/grid; render the new `EmptyState` component when `filteredProperties.length === 0` with a "Clear Filters" button.
   - Compare Modal: Add `sticky left-0 bg-white dark:bg-slate-900 z-10` to the first comparison attribute column for smooth horizontal scrolling on mobile.
   - AI Assistant (`ai-chat`): Update container to `h-[calc(100dvh-80px)]` to prevent mobile address bar overflow; fix quick suggestions flex container to `justify-start sm:justify-center` with smooth horizontal scroll.
   - Admin Dashboard: Tab navigation bar made responsive with `overflow-x-auto no-scrollbar`; table cell padding adapted on mobile.
   - Profile: Fix header button crowding and purchase image aspect ratio on mobile.

3. **Add Listing Wizard Polish in `src/components/add-listing-page.tsx`**:
   - RTL Step Progress Bar: Use logical `start-0` / `isRtl ? 'right-0' : 'left-0'` for the active progress line.
   - Select Dropdown Chevron: Update select CSS to `rtl:bg-[left_0.75rem_center] ltr:bg-[right_0.75rem_center]` with `rtl:ps-4 rtl:pe-10 ltr:ps-4 ltr:pe-10` so chevrons do not overlay Arabic text.
   - Unit Variants Table: Mobile responsive layout (`grid-cols-1 sm:grid-cols-2 md:grid-cols-6`).
   - Directional Navigation Arrows: In Arabic RTL, mirror Back (`ArrowRight` + 'السابق') and Next ('التالي' + `ArrowLeft`).
   - Add `aria-label` on all `X` delete buttons.

4. **Testing & Verification**:
   - Run `npm run test` (all 52 tests in `tests/`).
   - Run `npm run lint` (`tsc --noEmit`).
   - Run `npm run build` (`vite build`).
   - Ensure 0 errors across all verification commands.

Write comprehensive handoff report to `.agents/worker_m2_m3/handoff.md` and notify orchestrator when complete.
