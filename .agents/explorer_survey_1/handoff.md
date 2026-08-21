# Requirement 1 (R1) Comprehensive Investigation & UI/UX Architecture Report

**Specialist Role**: Survey Explorer 1 (UI/UX Architecture, Theming & RTL Specialist)  
**Project**: Hettety Real Estate Platform  
**Target Requirement**: R1 (UI/UX Polish & Modern Design Enhancements, Theming & Bidirectional RTL/LTR Parity)  
**Date**: 2026-08-21  

---

## 1. Observations & Defect Inventory

This section details all directly observed defects, visual inconsistencies, directional bugs, and theme flaws across the codebase with exact file paths, line references, and verbatim snippets.

---

### Category A: Design System, Typography, Gradients & Palette Inconsistencies

#### [A1] Rogue Emerald Color Palette vs. Brand Identity Tokens
- **Files Affected**:
  - `src/components/PremiumHero.tsx`: Lines 28, 36, 37
  - `src/components/AboutPage.tsx`: Lines 17, 20, 24, 36, 37, 47, 48, 75, 76, 87, 88, 89, 97
  - `src/components/ServicePages.tsx`: Lines 18, 29, 40, 41
  - `src/components/TermsPage.tsx`: Lines 8, 13, 18, 23, 28, 39, 55, 58
  - `src/components/PrivacyPage.tsx`: Lines 14, 15
  - `src/components/CookiePolicyPage.tsx`: Lines 14, 15, 38, 39, 44, 45, 50, 51
  - `src/components/CookieConsent.tsx`: Lines 71, 72, 92, 99, 101, 106, 108, 121, 145, 163, 181, 198, 205, 207, 212, 214, 227
  - `src/App.tsx`: Lines 1172, 1202
- **Direct Code Evidence**:
  - `src/components/AboutPage.tsx:24`:
    ```tsx
    <h1 className="...">
      {t.about_title_start} <span className="text-brand-600 dark:text-emerald-500">{t.about_title_end}</span>
    </h1>
    ```
  - `src/components/AboutPage.tsx:97`:
    ```tsx
    <button className="relative z-10 bg-brand-600 dark:bg-emerald-500 hover:bg-brand-700 dark:hover:bg-emerald-600 text-white ...">
    ```
  - `src/components/CookieConsent.tsx:71-72`:
    ```tsx
    <div className="w-12 h-12 rounded-full bg-[#10B981]/20 flex items-center justify-center flex-shrink-0">
      <Shield className="w-6 h-6 text-[#10B981]" />
    </div>
    ```
- **Root Cause**: `src/index.css` defines a unified luxury palette with Navy Blue (`brand` `#1b2c4d`) and Orange (`accent` `#e67e22`). However, legacy pages and components use arbitrary hardcoded hex `#10B981` and Tailwind `emerald-400`/`emerald-500` classes in dark mode, causing an inconsistent brand experience (switching between orange, blue, and bright green).
- **Remediation**: Unify all interactive highlights, CTA buttons, badges, and glows across these 8 files to use `brand` (`brand-500`/`brand-600`) and `accent` (`accent-500`/`accent-600`) tokens.

---

#### [A2] Arabic Typography & Letter-Spacing (Tracking) Issues
- **Files Affected**:
  - `src/components/PremiumHero.tsx`: Lines 37, 43, 51, 60, 73
  - `src/components/AboutPage.tsx`: Lines 20, 23, 40, 51, 63, 64, 78, 91, 98
  - `src/components/ServicePages.tsx`: Lines 21, 29, 44
  - `src/components/TermsPage.tsx`: Lines 39, 42, 62, 75
  - `src/components/PrivacyPage.tsx`: Lines 17, 27, 41, 50
  - `src/components/CookiePolicyPage.tsx`: Lines 17, 27, 36, 39, 45, 51
  - `src/App.tsx`: Lines 153, 159, 172, 330, 363, 661, 708, 724, 755, 775, 1091, 1115, 1137, 1218, 1230, 1246, 1924, 1928, 1930, 1947, 1956, 2573, 2591, 2585, 2616, 2625, 2904, 2972, 3000, 3017, 3079, 3095, 3174, 3207, 3691, 3732, 3734, 3748, 3779, 3833-3855, 3876, 3937
- **Direct Code Evidence**:
  - `src/components/PremiumHero.tsx:51`:
    ```tsx
    <p className="... uppercase tracking-tight">
    ```
  - `src/App.tsx:159`:
    ```tsx
    <p className="text-brand-600 dark:text-brand-400 font-black uppercase tracking-[0.4em] text-xs md:text-sm">
    ```
  - `src/App.tsx:363`:
    ```tsx
    <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white line-clamp-1">{property.title}</h3>
    ```
- **Root Cause**:
  1. In Arabic typography, cursive ligatures connect letters. Applying positive CSS `letter-spacing` (`tracking-widest`, `tracking-[0.4em]`, `tracking-wider`) fractures Arabic words into disconnected glyphs.
  2. `font-heading` (`Montserrat`) is applied to headers containing Arabic text. `Montserrat` contains no Arabic glyphs, triggering browser font fallback with unpredictable stroke weights.
  3. `uppercase` CSS transformation is applied indiscriminately to strings that might be rendered in Arabic.
- **Remediation**:
  1. In `src/index.css` or Tailwind utilities, ensure `font-cairo` is applied whenever `dir="rtl"` or `lang="ar"`, overriding `font-heading`.
  2. Add `ltr:tracking-widest rtl:tracking-normal` (or `tracking-normal` in Arabic mode) to prevent ligature disconnects.

---

### Category B: Dark/Light Theme Switching Consistency

#### [B1] Hardcoded Dark-Only Cookie Consent Dialog
- **File Affected**: `src/components/CookieConsent.tsx`
- **Lines**: 66–244
- **Direct Code Evidence**:
  - Line 66: `<div className="... bg-[#0F172A]/90 backdrop-blur-sm ...">`
  - Line 67: `<div className="bg-[#1E293B] border border-white/10 rounded-2xl shadow-2xl ...">`
  - Line 74: `<h2 className="text-2xl font-bold text-white">{t.consent_title}</h2>`
  - Line 80: `<p className="text-slate-300 leading-relaxed">{t.consent_desc}</p>`
  - Line 83: `<div className="bg-white/5 rounded-xl p-4 border border-white/10">`
  - Line 129: `<button className="... bg-white/5 hover:bg-white/10 text-white rounded-xl ... border border-white/10">`
- **Root Cause**: `CookieConsent` was implemented with static dark background hex codes (`#0F172A`, `#1E293B`, `text-white`, `border-white/10`) and does NOT respond to Light Mode. When a user switches to Light Theme, this modal remains dark and starkly clashes with the light page background.
- **Remediation**: Update container to `bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800`, inner boxes to `bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700`, and manage button to `bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white border-slate-200 dark:border-white/10`.

---

#### [B2] Broken Dark Mode on `#contact` Form
- **File Affected**: `src/App.tsx`
- **Lines**: 4320–4335
- **Direct Code Evidence**:
  ```tsx
  <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
    <div className="bg-slate-900 p-10 text-white md:w-2/5 flex flex-col justify-between">
      ...
    </div>
    <div className="p-10 md:w-3/5">
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.auth_email}</label>
          <input type="email" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none text-black" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.contact_msg}</label>
          <textarea rows={4} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none text-black" placeholder="I'm interested in..." />
        </div>
        <Button className="w-full">{t.contact_btn}</Button>
      </form>
    </div>
  </div>
  ```
- **Root Cause**: The contact card and inputs have no `dark:` classes (`bg-white`, `border-slate-300`, `text-slate-700`, `text-black`). In Dark Mode, the contact form renders as a glaring white box with unstyled inputs.
- **Remediation**: Add `dark:bg-slate-900 dark:border-slate-800`, labels `dark:text-slate-300`, inputs `dark:bg-slate-800 dark:border-slate-700 dark:text-white`.

---

#### [B3] Missing Dark Theme Styling on Profile Preferences Card
- **File Affected**: `src/App.tsx`
- **Lines**: 2408–2419
- **Direct Code Evidence**:
  ```tsx
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
  ```
- **Root Cause**: Missing dark mode classes. In Dark Mode, `bg-brand-50` produces high-contrast glare, while `text-brand-900` text is harsh against the background.
- **Remediation**: Add `dark:bg-brand-950/40 dark:border-brand-900/60`, title `dark:text-brand-300`, text `dark:text-brand-300/90`, textarea `dark:bg-slate-800 dark:border-slate-700 dark:text-white`.

---

#### [B4] Flash of Light Skeleton Placeholders in Dark Mode
- **File Affected**: `src/App.tsx`
- **Lines**: 3913, 4074
- **Direct Code Evidence**:
  - `src/App.tsx:3913`: `[1,2,3].map(i => <div key={i} className="h-96 bg-slate-200 rounded-2xl animate-pulse"></div>)`
  - `src/App.tsx:4074`: `[1,2,3,4,5,6].map(i => <div key={i} className="h-96 bg-slate-200 rounded-2xl animate-pulse"></div>)`
- **Root Cause**: Skeletons only specify `bg-slate-200`. In Dark Mode (`bg-slate-950`), a bright gray box flashes before property cards load.
- **Remediation**: Use `bg-slate-200 dark:bg-slate-800/80` with a realistic card skeleton (top image placeholder, title bar skeleton, stat chip skeletons).

---

### Category C: Arabic (RTL) vs English (LTR) Bidirectional Parity

#### [C1] Critical Badge Collision on Property Cards in Arabic Mode
- **File Affected**: `src/App.tsx`
- **Lines**: 333–348
- **Direct Code Evidence**:
  ```tsx
  {/* Status Badge */}
  <div className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm`}>
    {property.status === 'For Sale' ? t.prop_forsale : t.prop_forrent}
  </div>

  {/* Verified Badge */}
  {(property.isVerified || property.verificationStatus === 'Verified') && (
    <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-12'} bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm`}>
      <ShieldCheck size={12} /> {property.verificationStatus === 'Verified' ? (isRtl ? 'أصلي + ثقة وقانون' : 'Verified Legal') : t.prop_verified}
    </div>
  )}

  {/* Favorite Button */}
  {onToggleFavorite && (
    <button 
      onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
      className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} p-2 rounded-full backdrop-blur-md transition-all shadow-lg ${isFavorited ? 'bg-red-500 text-white' : 'bg-white/40 text-white hover:bg-white/60'}`}
    >
      <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
    </button>
  )}
  ```
- **Root Cause**:
  - In LTR mode (`isRtl = false`), the Verified Badge is at `right-12` (48px from right) and Favorite is at `right-4` (16px from right) — they sit cleanly side-by-side.
  - In RTL mode (`isRtl = true`), the Verified Badge is at `left-4` AND the Favorite Button is ALSO at `left-4`! They directly overlay and collide with each other, obscuring the heart button and clipping the verified text.
- **Remediation**:
  - In RTL, position the Verified Badge at `left-14` (`isRtl ? 'left-14' : 'right-12'`) or wrap the top-left/top-right controls into structured flex rows (`flex items-center gap-2`).

---

#### [C2] Inverted Navigation Arrows on Multi-Step Form
- **File Affected**: `src/components/add-listing-page.tsx`
- **Lines**: 1209–1224
- **Direct Code Evidence**:
  ```tsx
  {step > 1 ? (
    <button onClick={() => goToStep(step - 1)} className="...">
      <ArrowLeft size={18} /> {isRtl ? 'السابق' : 'Back'}
    </button>
  ) : <div></div>}

  {step < 3 ? (
    <button onClick={() => goToStep(step + 1)} className="...">
      {isRtl ? 'التالي' : 'Next'} <ArrowRight size={18} />
    </button>
  ) : (
  ```
- **Root Cause**:
  - In Arabic RTL layout, reading order is Right-to-Left. Moving "Next" advances to the LEFT (`<--`), and moving "Back/Previous" returns to the RIGHT (`-->`).
  - Currently, "السابق" (Back) uses `<ArrowLeft />` (points forward/left in RTL!), and "التالي" (Next) uses `<ArrowRight />` (points backward/right in RTL!).
- **Remediation**:
  - Back button: `{isRtl ? <ArrowRight size={18} /> : <ArrowLeft size={18} />} {isRtl ? 'السابق' : 'Back'}`
  - Next button: `{isRtl ? 'التالي' : 'Next'} {isRtl ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}`

---

#### [C3] Select Dropdown Arrow Overlaying Arabic Text
- **File Affected**: `src/components/add-listing-page.tsx`
- **Lines**: 693, 838, 845
- **Direct Code Evidence**:
  ```tsx
  const selectCls = inputCls + " appearance-none bg-[url('data:image/svg+xml;...')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat";
  ```
- **Root Cause**: The custom dropdown chevron is hardcoded to `bg-[right_0.75rem_center]`. In RTL mode, text starts from the right edge, so the SVG dropdown chevron icon renders directly on top of the first 2-3 Arabic letters of the selected option!
- **Remediation**: Use `rtl:bg-[left_0.75rem_center] ltr:bg-[right_0.75rem_center]` with `rtl:ps-4 rtl:pe-10 ltr:ps-4 ltr:pe-10`.

---

#### [C4] Hardcoded Physical Borders & Margins Breaking RTL Alignment
- **Files Affected**:
  - `src/components/CookiePolicyPage.tsx`: Lines 38, 44, 50 (`border-l-4 ... pl-6`)
  - `src/components/PrivacyPage.tsx`: Line 33 (`ml-4`)
  - `src/components/add-listing-page.tsx`: Line 714 (`ml-2`), Line 1171 (`mr-2`)
  - `src/App.tsx`: Line 634 (`ml-1`), Line 1506 (`sm:ml-4`), Line 2492 (`left-0 w-1 h-full`)
- **Direct Code Evidence**:
  - `src/components/CookiePolicyPage.tsx:38`:
    ```tsx
    <div className="border-l-4 border-brand-500 dark:border-emerald-500 pl-6">
      <h3 className="...">{isRtl ? 'ملفات تعريف الارتباط الضرورية للغاية' : 'Strictly Necessary Cookies'}</h3>
    ```
- **Root Cause**: Use of physical directional properties (`border-l-4`, `pl-6`, `ml-4`, `mr-2`, `left-0`) instead of CSS logical properties (`border-s-4`, `ps-6`, `ms-4`, `me-2`, `start-0`). In Arabic, the accent border is pinned to the left edge while the text is aligned right.
- **Remediation**: Replace all physical properties with logical properties (`border-s-4`, `ps-6`, `ms-4`, `me-2`, `start-0`).

---

#### [C5] Inverted Chat Speech Bubble Tails in AIChat
- **File Affected**: `src/App.tsx`
- **Lines**: 1238–1244
- **Direct Code Evidence**:
  ```tsx
  <div className={`p-5 sm:p-6 rounded-[2rem] shadow-sm ... ${m.role === 'user' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 ... rounded-tl-none'}`}>
  ```
- **Root Cause**:
  - Line 1238 applies `flex-row-reverse` in RTL so the User message is on the left and Model is on the right.
  - However, the corner radius remains `rounded-tr-none` (top-right corner flattened) for user and `rounded-tl-none` (top-left flattened) for model. In RTL, the speech tail points away from the avatar!
- **Remediation**: Use `isRtl ? (m.role === 'user' ? 'rounded-tl-none' : 'rounded-tr-none') : (m.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none')`.

---

#### [C6] Document Root `lang` & `dir` Desynchronization
- **File Affected**: `src/App.tsx` & `index.html`
- **Lines**: `src/App.tsx:3263, 3319, 3665`, `index.html:2`
- **Direct Code Evidence**:
  - `index.html:2`: `<html lang="ar" dir="rtl">` (static HTML).
  - `src/App.tsx:3263`: `const [lang, setLang] = useState<'en' | 'ar'>('en');`
  - `src/App.tsx:3665`: `<div ... dir={isRtl ? 'rtl' : 'ltr'}>`
- **Root Cause**: Language starts at `'en'` in React state while `<html>` has `lang="ar" dir="rtl"`. When toggling `lang`, `document.documentElement` is never updated. This causes native scrollbars, tooltips, and browser extensions to miscalculate layout direction.
- **Remediation**: Add a `useEffect` on `lang` to synchronize `document.documentElement.lang = lang` and `document.documentElement.dir = isRtl ? 'rtl' : 'ltr'`.

---

### Category D: Feedback States, Loading Skeletons, Empty States & Notifications

#### [D1] Missing Search Empty State in Listings Page
- **File Affected**: `src/App.tsx`
- **Lines**: 4072–4091
- **Direct Code Evidence**:
  ```tsx
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
    {loadingProps
      ? [1,2,3,4,5,6].map(i => <div key={i} className="..."></div>)
      : filteredProperties.map(p => (
        <PropertyCard key={p.id} ... />
      ))
    }
  </div>
  ```
- **Root Cause**: When `filteredProperties` is empty (e.g. searching for a non-existent compound or impossible price range), the grid renders 0 cards and displays a completely blank page with no message or reset button.
- **Remediation**: Add a dedicated Empty State with a search illustration/icon, "No properties found matching your criteria / لم يتم العثور على عقارات مطابقة للبحث", and a "Clear Filters / إعادة ضبط الفلاتر" button.

---

#### [D2] Ubiquitous Native `window.alert()` and `window.confirm()` Calls
- **Files Affected**:
  - `src/components/add-listing-page.tsx`: Lines 222, 336, 345, 383, 389, 515, 542, 545, 664
  - `src/App.tsx`: Lines 1832, 1850, 1855, 1856, 1866, 1869, 2743, 2753, 2766, 2791, 2798, 3279, 3283, 3294, 3295, 4258
- **Root Cause**: 24+ critical user feedback paths rely on browser-native blocking `alert()`, `confirm()`, and `prompt()`, which look unpolished, halt script execution, cannot be styled for dark mode, and break UX flow.
- **Remediation**: Replace with a non-blocking modern Toast / Feedback Banner system with animated entering/exiting alerts supporting Success, Error, Info, and Warning types.

---

## 2. Logic Chain & Root Cause Analysis

```
[Observation: Inconsistent color tokens (#10B981, emerald vs brand-600/accent-500)]
  └──> Root Cause: Legacy pages created before Tailwind @theme tokens were established
  └──> Impact: Visual dissonance and inconsistent branding across light and dark modes

[Observation: PropertyCard badge collision in RTL mode (both at top-4 left-4)]
  └──> Root Cause: Hardcoded left/right ternary positioning without offset accounting for the favorite button
  └──> Impact: Verified badge and heart button overlap completely in Arabic mode

[Observation: add-listing-page.tsx directional arrow inversion]
  └──> Root Cause: LTR icon assumptions (<ArrowLeft> for Back, <ArrowRight> for Next)
  └──> Impact: In Arabic, the Next button points backwards and Back button points forwards

[Observation: Select dropdown chevron overlays Arabic text]
  └──> Root Cause: Static background position bg-[right_0.75rem_center]
  └──> Impact: The dropdown arrow renders directly on top of Arabic text starting from right

[Observation: Hardcoded dark styling in CookieConsent & unstyled #contact in Dark Mode]
  └──> Root Cause: Components developed in isolation without dark: variant coverage
  └──> Impact: Harsh contrast breaks and unreadable text when switching themes

[Observation: Blank grid when search returns 0 results]
  └──> Root Cause: Lack of conditional empty state render in Listings component
  └──> Impact: User gets no feedback if their query returned 0 items
```

---

## 3. Caveats & Scoping

1. **Accessibility (a11y) Overlap**: Focus traps, `aria-label`, keyboard listeners, and color contrast compliance fall primarily under Requirement 2 (R2 specialist), though the UI fixes identified here directly support WCAG AA compliance.
2. **Backend & Firestore Rules**: This investigation is strictly read-only and confined to the frontend presentation layer (`src/`). Backend Firestore security rules and Cloud Storage bucket configurations were not modified.
3. **No Code Modification in Source**: In accordance with explorer rules, all changes are proposed as concrete remediation designs.

---

## 4. Prioritized Remediation Proposal

| Priority | Defect Item | Target File(s) | Proposed Solution Summary |
|:---|:---|:---|:---|
| **P0** | RTL Badge Collision on PropertyCard | `src/App.tsx:336-348` | Mirror Verified badge offset to `left-14` in RTL (`isRtl ? 'left-14' : 'right-12'`) |
| **P0** | Multi-step Form Directional Chevrons | `src/components/add-listing-page.tsx:1209-1224` | Flip `ArrowLeft`/`ArrowRight` according to `isRtl` |
| **P0** | Select Chevron Overlapping Arabic Text | `src/components/add-listing-page.tsx:693` | Add `rtl:bg-[left_0.75rem_center] ltr:bg-[right_0.75rem_center]` & padding |
| **P1** | Rogue Emerald Palette Unification | 8 component files | Replace `#10B981` / `emerald-*` with `brand-*` & `accent-*` |
| **P1** | CookieConsent & Contact Form Dark Mode | `CookieConsent.tsx`, `App.tsx:4320` | Add full Dark/Light adaptive styling |
| **P1** | Arabic Typography Ligature & Tracking Fix | `src/index.css`, `App.tsx`, Components | Use `ltr:tracking-widest rtl:tracking-normal`, ensure `font-cairo` |
| **P1** | Document Root `lang` & `dir` Sync | `src/App.tsx:3356` | Add `useEffect` to sync `document.documentElement.dir/lang` |
| **P2** | Listings Search Empty State | `src/App.tsx:4072` | Render dedicated empty state with "Clear Filters" CTA |
| **P2** | Dark Mode Skeleton Loader Styling | `src/App.tsx:3913, 4074` | Add `dark:bg-slate-800` and multi-element card skeleton |
| **P2** | Logical CSS Properties (`ms-`, `ps-`, `border-s-`) | `CookiePolicyPage.tsx`, `PrivacyPage.tsx` | Replace physical `ml-`, `pl-`, `border-l-` with logical ones |
| **P2** | Modern Toast / Alert Notification System | `App.tsx`, `add-listing-page.tsx` | Implement non-blocking animated toast component |

---

## 5. Verification Method

### 5.1 Automated Quality & Build Verification
Execute from project root (`C:\Users\Tie\.gemini\antigravity\scratch\hettetyv4`):
```bash
# 1. Type-check all TypeScript files
npm run lint

# 2. Production build verification
npm run build
```
*Expected Result*: `tsc --noEmit` and `vite build` complete with 0 errors and 0 warnings.

### 5.2 Interactive & Visual Parity Checklist
1. **Theme Switching**:
   - Toggle theme using the Nav Sun/Moon icon on all pages (`home`, `listings`, `yalla-sahel`, `3d-experience`, `legal`, `ai-chat`, `profile`, `add-listing`, `contact`, `about`, `terms`, `privacy`, `cookie-policy`, `manage-users`).
   - Verify `CookieConsent` dialog, `#contact` form, and Profile preferences card render with crisp contrast in both Light and Dark themes.
2. **Arabic (RTL) Bidirectional Testing**:
   - Switch language to Arabic (`AR`).
   - Open Listings page: Verify `PropertyCard` badges (Verified badge and Heart button) are cleanly separated and do not collide.
   - Open Add Listing page: Verify Select dropdown arrows appear on the far left without overlapping Arabic text; verify "Next" / "Previous" buttons display correct directional arrows.
   - Open AI Assistant (`ai-chat`): Verify user and model speech bubble tails point toward their respective avatars.
3. **Empty State & Loading Verification**:
   - In Listings page, enter a non-matching query (e.g. `xyz999`): verify the empty state illustration and "Clear Filters" button appear.
   - Throttle network to Slow 3G in DevTools: verify skeleton loaders in Dark mode appear as dark slate pulsing cards rather than bright white boxes.
