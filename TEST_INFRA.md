# Hettety Platform — Test Infrastructure Documentation (`TEST_INFRA.md`)

## 1. Overview
This document outlines the architecture, configuration, mocking strategy, and execution instructions for the automated UI/UX and component test harness built for the **Hettety Platform Overhaul**.

---

## 2. Test Stack & Harness Architecture
- **Test Runner & Engine**: [Vitest](https://vitest.dev/) (v3.0.7) configured in native ESM mode.
- **DOM Environment**: [jsdom](https://github.com/jsdom/jsdom) (v26.0.0) providing simulated browser DOM APIs.
- **Component Testing**: [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) (v16.2.0) for accessible, user-centric queries.
- **Matchers & Assertions**: [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) (v6.6.3) for expressive DOM assertions (`toBeInTheDocument`, `toBeChecked`, `toHaveClass`, etc.).
- **User Interactions**: [@testing-library/user-event](https://testing-library.com/docs/user-event/intro) (v14.6.1).

---

## 3. Configuration Files

### `vitest.config.ts`
Configures Vitest to run in `jsdom` environment with global test APIs (`describe`, `it`, `expect`, `vi`), automated pre-test setup via `tests/setup.ts`, and path aliases matching `vite.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}', 'tests/**/*.spec.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### `tests/setup.ts`
Provides global polyfills and mocks for DOM and Web APIs not fully implemented in jsdom:
- **Automatic Lifecycle Cleanup**: Invokes `cleanup()`, clears `localStorage`/`sessionStorage`, and resets root `document.documentElement` attributes (`dir`, `lang`, `class`) between tests.
- **`window.matchMedia`**: Polyfilled for prefers-color-scheme theme testing.
- **`window.scrollTo`**: Polyfilled to prevent navigation crashes.
- **`ResizeObserver` & `IntersectionObserver`**: Polyfilled as mock classes.
- **`window.alert` & `window.confirm`**: Controlled spy mocks.
- **Firebase Mock Layer**: In-memory mocks for `auth`, `firestore` (`doc`, `getDoc`, `setDoc`, `getDocs`, `addDoc`, `updateDoc`, `deleteDoc`, `onSnapshot`), and `storage` (`uploadBytes`, `getDownloadURL`).

---

## 4. Test Suite Taxonomy (Tiers 1–4)

```
tests/
├── helpers/
│   └── fixtures.ts                      # Realistic bilingual Egyptian property dataset
├── setup.ts                             # Global Vitest + jsdom setup & polyfills
├── tier1-features/
│   ├── add-listing-wizard.test.tsx      # Step progression, validation, back/forward state
│   ├── language.test.tsx                # LTR/RTL sync, Cairo font, Arabic translation keys
│   ├── modals-dialogs.test.tsx          # CookieConsent, Mobile Drawer, 3D Viewer dialog
│   ├── navigation.test.tsx              # View switching, hash routing, service & legal pages
│   ├── property-card.test.tsx           # Badges, favorite toggle, compare tray, 3D triggers
│   ├── search-filter.test.tsx           # Text search, category dropdown, price ranges, sort
│   └── theming.test.tsx                 # Dark/Light toggle, localStorage sync, matchMedia
├── tier2-boundary/
│   └── boundary-corner-cases.test.tsx   # Empty inputs, 0-match searches, extreme prices, drawer churn
├── tier3-combinations/
│   └── cross-feature-combinations.test.tsx # Arabic + Dark theme, Filter + Theme, RTL form validation
└── tier4-scenarios/
    └── real-world-journeys.test.tsx     # Full buyer, seller, legal, and comparison journeys
```

---

## 5. Execution Commands

### Run Full Test Suite
```bash
npm run test
```
or
```bash
npx vitest run
```

### Run with Watch Mode (Development)
```bash
npx vitest
```

### Run Specific Test Tier
```bash
npx vitest run tests/tier1-features/
npx vitest run tests/tier2-boundary/
npx vitest run tests/tier3-combinations/
npx vitest run tests/tier4-scenarios/
```
