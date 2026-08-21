## 2026-08-21T10:52:34Z
Mission:
Build a comprehensive, requirement-driven opaque-box test suite covering Tiers 1-4:
1. Test Infrastructure Setup:
   - Configure Vitest + jsdom + @testing-library/react + @testing-library/jest-dom in `package.json` and `vitest.config.ts` / `tests/setup.ts`.
   - Add `"test": "vitest run"` script to `package.json`.
2. Test Suite Creation (under `tests/`):
   - **Tier 1 (Feature Coverage)**: >=5 tests per core feature:
     - Navigation & View switching
     - Dark / Light theme toggle
     - Language switcher (English LTR <-> Arabic RTL)
     - Property search, category filtering & price range filtering
     - Modals & dialogs (Cookie Consent, Mobile Drawer, 3D viewer)
     - PropertyCard interaction (Favorite toggle, Verified badge render, click to view)
     - Add Listing form step progression
   - **Tier 2 (Boundary & Corner Cases)**: Empty search inputs, non-matching search results, maximum price limits, multi-step edge cases, mobile viewport event triggers.
   - **Tier 3 (Cross-Feature Combinations)**: Theme toggle + Language switch in tandem, Filter application + Sort + Theme change, Form navigation with invalid inputs.
   - **Tier 4 (Real-World Scenarios)**: Full user journey from landing page -> searching luxury villa in Arabic -> toggling dark mode -> opening property details -> checking legal center.
3. Test Execution & Publish:
   - Run `npm run test` and document results.
   - Write `TEST_INFRA.md` and `TEST_READY.md` in the project root.
4. Report completion to `.agents/test_writer_1/handoff.md` and send a message to orchestrator.
