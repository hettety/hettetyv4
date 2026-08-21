import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import App from '../../src/App';
import { AddListingPage } from '../../src/components/add-listing-page';
import { useFocusTrap } from '../../src/hooks/useFocusTrap';
import { TRANSLATIONS } from '../../src/constants';
import * as firebase from '../../src/firebase';
import { MOCK_TEST_PROPERTIES } from '../helpers/fixtures';

// Helper component to test useFocusTrap with zero focusable elements
const EmptyFocusTrapContainer = ({ isActive, onEscape }: { isActive: boolean; onEscape?: () => void }) => {
  const containerRef = useFocusTrap<HTMLDivElement>(isActive, onEscape);
  if (!isActive) return null;
  return (
    <div ref={containerRef} role="dialog" aria-label="Empty Modal">
      <p>Static content with zero interactive focusable elements</p>
      <span>Just text</span>
    </div>
  );
};

// Helper component to test useFocusTrap with only disabled elements
const DisabledElementsFocusTrapContainer = ({ isActive, onEscape }: { isActive: boolean; onEscape?: () => void }) => {
  const containerRef = useFocusTrap<HTMLDivElement>(isActive, onEscape);
  if (!isActive) return null;
  return (
    <div ref={containerRef} role="dialog" aria-label="Disabled Modal">
      <button disabled data-testid="disabled-btn-1">Disabled 1</button>
      <input disabled data-testid="disabled-input" placeholder="Disabled input" />
      <button disabled data-testid="disabled-btn-2">Disabled 2</button>
    </div>
  );
};

describe('Tier 5 — Adversarial, Boundary & Resilience Verification Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('dir');
    document.documentElement.removeAttribute('lang');
    localStorage.setItem('hettety_consent', JSON.stringify({ necessary: true, analytics: true }));
    window.location.hash = '';

    vi.spyOn(firebase, 'getDocs').mockImplementation(async () => {
      return {
        docs: MOCK_TEST_PROPERTIES.map((p) => ({
          id: p.id,
          data: () => p,
        })),
      } as any;
    });
  });

  /* =========================================================================
   * 1. Rapid Language & RTL/LTR State Toggling Under Active Search & Filters
   * ========================================================================= */
  describe('1. Rapid Language & RTL/LTR State Toggling', () => {
    it('survives rapid multi-cycle language toggling (EN <-> AR) while multi-field search filters are active', async () => {
      render(<App />);

      // Navigate to Listings
      const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
      fireEvent.click(listingsBtns[0]);

      await screen.findByText('Luxury Beachfront Villa');

      // Set active search filters
      const searchInput = screen.getByPlaceholderText(TRANSLATIONS.en.prop_search);
      fireEvent.change(searchInput, { target: { value: 'Marassi' } });

      const minPriceInput = screen.getByPlaceholderText('Min Price');
      const maxPriceInput = screen.getByPlaceholderText('Max Price');
      fireEvent.change(minPriceInput, { target: { value: '1000000' } });
      fireEvent.change(maxPriceInput, { target: { value: '25000000' } });

      // Verify filtered match exists
      expect(screen.getByText('Luxury Beachfront Villa')).toBeInTheDocument();
      expect(screen.queryByText('Modern New Cairo Penthouse')).not.toBeInTheDocument();

      // Rapidly toggle language 6 times consecutively
      for (let i = 0; i < 3; i++) {
        // EN -> AR
        const arBtn = screen.getByText('AR');
        fireEvent.click(arBtn);
        expect(document.querySelector('[dir="rtl"]')).toBeInTheDocument();
        expect(document.documentElement.dir).toBe('rtl');

        // AR -> EN
        const enBtn = screen.getByText('EN');
        fireEvent.click(enBtn);
        expect(document.querySelector('[dir="ltr"]')).toBeInTheDocument();
        expect(document.documentElement.dir).toBe('ltr');
      }

      // Final state: filters and matching items must still be intact
      expect(screen.getByText('Luxury Beachfront Villa')).toBeInTheDocument();
      expect(screen.queryByText('Modern New Cairo Penthouse')).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText(TRANSLATIONS.en.prop_search)).toHaveValue('Marassi');
    });

    it('maintains deep-link property detail view and RTL translation across rapid language switches', async () => {
      render(<App />);

      // Navigate to Listings and open first property details
      const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
      fireEvent.click(listingsBtns[0]);

      const cardTitle = await screen.findByText('Luxury Beachfront Villa');
      fireEvent.click(cardTitle);

      expect(window.location.hash).toBe('#property/prop-1');
      expect(screen.getByText('Location')).toBeInTheDocument();

      // Rapid switch to Arabic
      fireEvent.click(screen.getByText('AR'));
      expect(document.querySelector('[dir="rtl"]')).toBeInTheDocument();
      expect(screen.getByText(/الموقع على الخريطة/i)).toBeInTheDocument();

      // Rapid switch back to English
      fireEvent.click(screen.getByText('EN'));
      expect(document.querySelector('[dir="ltr"]')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(window.location.hash).toBe('#property/prop-1');
    });
  });

  /* =========================================================================
   * 2. Rapid Theme Toggling Under Active Modal Dialogs & Drawers
   * ========================================================================= */
  describe('2. Rapid Theme Toggling Under Active Modal Dialogs', () => {
    it('survives rapid dark/light mode toggling (10x) while cookie consent preferences dialog is open', () => {
      localStorage.clear(); // trigger cookie banner

      render(<App />);

      // Open preferences modal
      const manageBtn = screen.getByRole('button', { name: TRANSLATIONS.en.consent_manage });
      fireEvent.click(manageBtn);

      // Verify modal is open
      expect(screen.getByText(TRANSLATIONS.en.consent_necessary)).toBeInTheDocument();

      const themeToggleBtn = screen.getByRole('button', { name: /تبديل المظهر|Toggle Theme/i });

      // Rapidly toggle theme 10 times consecutively
      for (let i = 0; i < 10; i++) {
        fireEvent.click(themeToggleBtn);
        const expectedDark = (i % 2 === 0);
        expect(document.documentElement.classList.contains('dark')).toBe(expectedDark);
        expect(localStorage.getItem('theme')).toBe(expectedDark ? 'dark' : 'light');
      }

      // Dialog must remain open, interactive, and functional
      expect(screen.getByText(TRANSLATIONS.en.consent_necessary)).toBeInTheDocument();
      const termsInput = document.getElementById('cookie-consent-terms-pref');
      if (termsInput) fireEvent.click(termsInput);

      const saveBtn = screen.getByRole('button', { name: TRANSLATIONS.en.consent_save });
      expect(saveBtn).toBeInTheDocument();
      fireEvent.click(saveBtn);

      // Dialog dismisses cleanly
      expect(screen.queryByText(TRANSLATIONS.en.consent_title)).not.toBeInTheDocument();
    });

    it('retains mobile navigation drawer state during rapid theme toggling', () => {
      render(<App />);

      // Open mobile drawer
      const buttons = screen.getAllByRole('button');
      const hamburgerBtn = buttons.find(b => b.className.includes('lg:hidden'));
      expect(hamburgerBtn).toBeDefined();
      fireEvent.click(hamburgerBtn!);

      expect(screen.getByText(/اللغة العربية|English Language/i)).toBeInTheDocument();

      // Toggle theme 4 times
      const themeToggleBtns = screen.getAllByRole('button', { name: /تبديل المظهر|Toggle Theme/i });
      fireEvent.click(themeToggleBtns[0]);
      fireEvent.click(themeToggleBtns[0]);
      fireEvent.click(themeToggleBtns[0]);
      fireEvent.click(themeToggleBtns[0]);

      // Drawer is still open with accessible controls
      expect(screen.getByText(/اللغة العربية|English Language/i)).toBeInTheDocument();
    });
  });

  /* =========================================================================
   * 3. Malformed Search Queries (Regex, Injection, Unicode, Extreme Length)
   * ========================================================================= */
  describe('3. Adversarial Search Queries & Boundary Filtering', () => {
    it('handles special regex metacharacters without throwing RegExp errors', async () => {
      render(<App />);

      const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
      fireEvent.click(listingsBtns[0]);

      await screen.findByText('Luxury Beachfront Villa');

      const searchInput = screen.getByPlaceholderText(TRANSLATIONS.en.prop_search);

      // List of adversarial regex attack vectors
      const regexAttackVectors = [
        '.*+?^${}()|[]\\',
        '(a+)+$',
        '(?=.*[a-z])(?=.*[A-Z])',
        '([a-zA-Z0-9_.-]+)@([a-zA-Z0-9_.-]+)',
        '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}',
        '[[[(((***)))]]]',
        '\\',
        '?',
        '*',
        '+',
        '^(.*)$'
      ];

      for (const query of regexAttackVectors) {
        expect(() => {
          fireEvent.change(searchInput, { target: { value: query } });
        }).not.toThrow();

        // No uncaught error, empty results or exact match handled safely
        expect(screen.queryByText('Crash')).toBeNull();
      }

      // Restoring empty query displays listings again
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('Luxury Beachfront Villa')).toBeInTheDocument();
    });

    it('safely handles XSS and script injection strings without execution', async () => {
      render(<App />);

      const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
      fireEvent.click(listingsBtns[0]);

      await screen.findByText('Luxury Beachfront Villa');

      const searchInput = screen.getByPlaceholderText(TRANSLATIONS.en.prop_search);

      const xssVectors = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1) />',
        '"><svg onload=alert(document.domain)>',
        'javascript:void(0)',
        '<iframe src="https://evil.com"></iframe>',
        '\'><script>window.pwned=true</script>',
      ];

      for (const payload of xssVectors) {
        fireEvent.change(searchInput, { target: { value: payload } });
        expect(screen.queryByText('Luxury Beachfront Villa')).not.toBeInTheDocument();
      }
    });

    it('handles SQL/NoSQL injection tokens safely', async () => {
      render(<App />);

      const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
      fireEvent.click(listingsBtns[0]);

      await screen.findByText('Luxury Beachfront Villa');

      const searchInput = screen.getByPlaceholderText(TRANSLATIONS.en.prop_search);

      const sqlVectors = [
        "' OR '1'='1",
        "'; DROP TABLE properties; --",
        '" OR 1=1 --',
        'admin\' --',
        'UNION SELECT * FROM users',
        '{"$gt": ""}',
        '{"$where": "sleep(5000)"}',
      ];

      for (const vector of sqlVectors) {
        expect(() => {
          fireEvent.change(searchInput, { target: { value: vector } });
        }).not.toThrow();
      }
    });

    it('handles extreme Unicode, emojis, RTL marks, and null bytes', async () => {
      render(<App />);

      const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
      fireEvent.click(listingsBtns[0]);

      await screen.findByText('Luxury Beachfront Villa');

      const searchInput = screen.getByPlaceholderText(TRANSLATIONS.en.prop_search);

      const unicodeVectors = [
        '🏰🏝️🏊‍♂️☀️🌊',
        '\u200F\u200E\u202A\u202B\u202C', // Bidi override marks
        '\u0000\u0001\u0002', // Null bytes
        '𝕿𝖊𝖘𝖙 𝕌𝕟𝕚𝕔𝕠𝕕𝕖',
        'مصر الجديدة - القاهرة 🇪🇬',
        '   \n\t\r   ',
      ];

      for (const vector of unicodeVectors) {
        expect(() => {
          fireEvent.change(searchInput, { target: { value: vector } });
        }).not.toThrow();
      }
    });

    it('handles extremely long search strings (10,000 chars) without UI freeze', async () => {
      render(<App />);

      const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
      fireEvent.click(listingsBtns[0]);

      await screen.findByText('Luxury Beachfront Villa');

      const searchInput = screen.getByPlaceholderText(TRANSLATIONS.en.prop_search);

      const megaString = 'A'.repeat(10000);
      expect(() => {
        fireEvent.change(searchInput, { target: { value: megaString } });
      }).not.toThrow();

      expect(screen.queryByText('Luxury Beachfront Villa')).not.toBeInTheDocument();
    });
  });

  /* =========================================================================
   * 4. Form Submission Boundaries & Extreme Numerical Values
   * ========================================================================= */
  describe('4. Form Submission Edge Cases & Numerical Boundaries', () => {
    it('rejects negative, zero, and non-numeric price and area values in AddListingPage', () => {
      const onAdd = vi.fn();
      render(
        <AddListingPage
          onAdd={onAdd}
          t={TRANSLATIONS.en}
          isRtl={false}
          isAdmin={false}
          isSuperAdmin={false}
        />
      );

      const titleInput = screen.getByPlaceholderText(/Villa in New Cairo/i);
      const priceInput = screen.getByPlaceholderText('0');
      const locationInput = screen.getByPlaceholderText(/New Cairo, Cairo/i);
      const inputs = screen.getAllByRole('spinbutton');
      const areaInput = inputs.find(i => (i as HTMLInputElement).min === '1') || inputs[2];
      const nextBtn = screen.getByRole('button', { name: /Next/i });

      // Test zero price
      fireEvent.change(titleInput, { target: { value: 'Adversarial Villa' } });
      fireEvent.change(locationInput, { target: { value: 'Adversarial Location' } });
      fireEvent.change(areaInput, { target: { value: '200' } });
      fireEvent.change(priceInput, { target: { value: '0' } });

      fireEvent.click(nextBtn);
      // Rejects zero price and stays on step 1 with validation message
      expect(screen.getByText(/Please fill in:.*Price/i)).toBeInTheDocument();
      expect(onAdd).not.toHaveBeenCalled();

      // Test zero area
      fireEvent.change(priceInput, { target: { value: '5000000' } });
      fireEvent.change(areaInput, { target: { value: '0' } });
      fireEvent.click(nextBtn);
      expect(screen.getByText(/Please fill in:.*Area/i)).toBeInTheDocument();
    });

    it('rejects whitespace-only strings for required text inputs in AddListingPage', () => {
      const onAdd = vi.fn();
      render(
        <AddListingPage
          onAdd={onAdd}
          t={TRANSLATIONS.en}
          isRtl={false}
          isAdmin={false}
          isSuperAdmin={false}
        />
      );

      const titleInput = screen.getByPlaceholderText(/Villa in New Cairo/i);
      const priceInput = screen.getByPlaceholderText('0');
      const locationInput = screen.getByPlaceholderText(/New Cairo, Cairo/i);
      const inputs = screen.getAllByRole('spinbutton');
      const areaInput = inputs.find(i => (i as HTMLInputElement).min === '1') || inputs[2];
      const nextBtn = screen.getByRole('button', { name: /Next/i });

      // Only whitespace
      fireEvent.change(titleInput, { target: { value: '    \t   ' } });
      fireEvent.change(priceInput, { target: { value: '5000000' } });
      fireEvent.change(locationInput, { target: { value: '   \n   ' } });
      fireEvent.change(areaInput, { target: { value: '250' } });

      fireEvent.click(nextBtn);
      expect(screen.getByText(/Please fill in:.*Title/i)).toBeInTheDocument();
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('handles numeric overflow numbers in price calculations gracefully without NaN or Infinity', async () => {
      render(<App />);

      // Navigate to Listings -> Open detail page
      const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
      fireEvent.click(listingsBtns[0]);

      const cardTitle = await screen.findByText('Luxury Beachfront Villa');
      fireEvent.click(cardTitle);

      // Installment Calculator must calculate valid formatted integers
      expect(screen.getByText('Installment Estimate')).toBeInTheDocument();
      expect(screen.getAllByText('Down payment').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Monthly/i).length).toBeGreaterThan(0);

      // Slider changes (Down payment: 0% to 50%)
      const sliders = screen.getAllByRole('slider');
      expect(sliders.length).toBeGreaterThanOrEqual(2);

      const downSlider = sliders[0];
      const yearsSlider = sliders[1];

      // Set down payment to 0% and years to 15
      fireEvent.change(downSlider, { target: { value: '0' } });
      fireEvent.change(yearsSlider, { target: { value: '15' } });

      // Verify no NaN or Infinity is displayed in the DOM
      expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Infinity/)).not.toBeInTheDocument();
    });
  });

  /* =========================================================================
   * 5. Focus Trapping Resilience with Empty or Disabled Focusable Trees
   * ========================================================================= */
  describe('5. Focus Trapping Resilience & Edge Cases', () => {
    it('handles containers with zero focusable elements gracefully without crashing', () => {
      const onEscape = vi.fn();
      render(<EmptyFocusTrapContainer isActive={true} onEscape={onEscape} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Trigger Tab key
      expect(() => {
        fireEvent.keyDown(window, { key: 'Tab', code: 'Tab', shiftKey: false });
        fireEvent.keyDown(window, { key: 'Tab', code: 'Tab', shiftKey: true });
      }).not.toThrow();

      // Trigger Escape key
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it('handles containers with all disabled focusable elements safely', () => {
      const onEscape = vi.fn();
      render(<DisabledElementsFocusTrapContainer isActive={true} onEscape={onEscape} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      expect(() => {
        fireEvent.keyDown(window, { key: 'Tab', code: 'Tab', shiftKey: false });
        fireEvent.keyDown(window, { key: 'Tab', code: 'Tab', shiftKey: true });
      }).not.toThrow();

      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it('restores focus cleanly when previous active element is unmounted before modal closes', () => {
      const TestTriggerAndModal = () => {
        const [showTrigger, setShowTrigger] = useState(true);
        const [isOpen, setIsOpen] = useState(false);
        const containerRef = useFocusTrap<HTMLDivElement>(isOpen, () => setIsOpen(false));

        return (
          <div>
            {showTrigger && (
              <button
                data-testid="trigger-btn"
                onClick={() => {
                  setIsOpen(true);
                  setShowTrigger(false); // remove the trigger button from DOM
                }}
              >
                Open Modal & Remove Me
              </button>
            )}
            {isOpen && (
              <div ref={containerRef} role="dialog">
                <button data-testid="inside-btn" onClick={() => setIsOpen(false)}>
                  Close
                </button>
              </div>
            )}
          </div>
        );
      };

      render(<TestTriggerAndModal />);

      const triggerBtn = screen.getByTestId('trigger-btn');
      triggerBtn.focus();
      expect(document.activeElement).toBe(triggerBtn);

      // Open modal which unmounts trigger button
      fireEvent.click(triggerBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Close modal — must not crash when trying to restore focus to unmounted trigger
      const insideBtn = screen.getByTestId('inside-btn');
      expect(() => {
        fireEvent.click(insideBtn);
      }).not.toThrow();

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  /* =========================================================================
   * 6. Viewport Resize Events, Orientation Changes & Mobile Breakpoints
   * ========================================================================= */
  describe('6. Viewport Resize Events & Orientation Changes', () => {
    it('survives rapid consecutive window resize events across mobile, tablet, and desktop viewports', () => {
      render(<App />);

      const viewports = [
        { width: 320, height: 568 },   // Small mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1024, height: 768 },  // Desktop
        { width: 1920, height: 1080 }, // Full HD
        { width: 3840, height: 2160 }, // 4K Ultrawide
        { width: 375, height: 667 },   // Return to mobile
      ];

      for (const vp of viewports) {
        act(() => {
          window.innerWidth = vp.width;
          window.innerHeight = vp.height;
          window.dispatchEvent(new Event('resize'));
        });
      }

      // App should remain responsive and stable
      expect(screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_home })[0]).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings })[0]).toBeInTheDocument();
    });

    it('handles device orientationchange events seamlessly during property exploration', async () => {
      render(<App />);

      // Navigate to Listings
      const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
      fireEvent.click(listingsBtns[0]);

      await screen.findByText('Luxury Beachfront Villa');

      // Dispatch orientation change events
      act(() => {
        window.dispatchEvent(new Event('orientationchange'));
      });

      expect(screen.getByText('Luxury Beachfront Villa')).toBeInTheDocument();

      act(() => {
        window.dispatchEvent(new Event('orientationchange'));
      });

      expect(screen.getByText('Modern New Cairo Penthouse')).toBeInTheDocument();
    });

    it('synchronizes mobile hamburger drawer state correctly during breakpoint transitions', () => {
      render(<App />);

      // Set mobile width
      act(() => {
        window.innerWidth = 375;
        window.dispatchEvent(new Event('resize'));
      });

      // Open mobile drawer
      const buttons = screen.getAllByRole('button');
      const hamburgerBtn = buttons.find(b => b.className.includes('lg:hidden'));
      expect(hamburgerBtn).toBeDefined();
      fireEvent.click(hamburgerBtn!);

      expect(screen.getByText(/اللغة العربية|English Language/i)).toBeInTheDocument();

      // Resize to desktop breakpoint (>1024px)
      act(() => {
        window.innerWidth = 1280;
        window.dispatchEvent(new Event('resize'));
      });

      // Desktop navigation items remain visible
      expect(screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_home })[0]).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings })[0]).toBeInTheDocument();
    });
  });
});
