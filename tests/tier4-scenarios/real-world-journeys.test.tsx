import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import App from '../../src/App';
import { AddListingPage } from '../../src/components/add-listing-page';
import { TRANSLATIONS } from '../../src/constants';
import * as firebase from '../../src/firebase';
import { MOCK_TEST_PROPERTIES } from '../helpers/fixtures';

describe('Tier 4 — End-to-End Real-World User Scenarios', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    localStorage.setItem('hettety_consent', JSON.stringify({ necessary: true }));
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

  it('Scenario 1: Landing Page -> Switch to Arabic -> Search Luxury Villa -> Dark Mode -> Open Details -> Legal Center', async () => {
    render(<App />);

    // 1. Initial Home Page view
    expect(screen.getByText(TRANSLATIONS.en.feat_title)).toBeInTheDocument();

    // 2. Switch Language to Arabic
    const langBtn = screen.getByText('AR');
    fireEvent.click(langBtn);
    expect(document.querySelector('[dir="rtl"]')).toBeInTheDocument();

    // 3. Navigate to Listings in Arabic
    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.ar.nav_listings });
    fireEvent.click(listingsBtns[0]);
    expect(window.location.hash).toBe('#listings');

    await screen.findByText('Luxury Beachfront Villa');

    // 4. Search for Villa
    const searchInput = screen.getByPlaceholderText(TRANSLATIONS.ar.prop_search);
    fireEvent.change(searchInput, { target: { value: 'Marassi' } });
    expect(screen.getByText('Luxury Beachfront Villa')).toBeInTheDocument();

    // 5. Toggle Dark Mode
    const themeBtn = screen.getByRole('button', { name: /تبديل المظهر|Toggle Theme/i });
    fireEvent.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // 6. Open Property Details
    fireEvent.click(screen.getByText('Luxury Beachfront Villa'));
    expect(window.location.hash).toBe('#property/prop-1');
    expect(screen.getByText(/الموقع على الخريطة/i)).toBeInTheDocument();

    // 7. Navigate to Legal Center
    const legalBtns = screen.getAllByRole('button', { name: TRANSLATIONS.ar.nav_trust });
    fireEvent.click(legalBtns[0]);
    expect(window.location.hash).toBe('#legal');
    expect(screen.getByText(TRANSLATIONS.ar.legal_title)).toBeInTheDocument();
  });

  it('Scenario 2: Buyer Coastal Journey (Yalla Sahel -> Village Filter -> 3D Experience)', () => {
    render(<App />);

    // 1. Navigate to Yalla Sahel
    const sahelBtns = screen.getAllByRole('button', { name: /Yalla Sahel/i });
    fireEvent.click(sahelBtns[0]);
    expect(window.location.hash).toBe('#yalla-sahel');

    // 2. Check available chalets
    expect(screen.getByText(/Available chalets/i)).toBeInTheDocument();

    // 3. Navigate to 3D Experience
    const toursBtns = screen.getAllByRole('button', { name: '3D Tours' });
    fireEvent.click(toursBtns[0]);
    expect(window.location.hash).toBe('#3d-experience');
    expect(screen.getByText(/Walk through the property before you visit/i)).toBeInTheDocument();
  });

  it('Scenario 3: Cookie Policy Lifecycle (First Visit Consent -> Terms Check -> Preferences Save)', () => {
    localStorage.clear(); // Clear consent

    render(<App />);

    // Cookie consent dialog appears
    expect(screen.getByText(TRANSLATIONS.en.consent_title)).toBeInTheDocument();

    // Open Preferences
    const manageBtn = screen.getByRole('button', { name: TRANSLATIONS.en.consent_manage });
    fireEvent.click(manageBtn);

    expect(screen.getByText(TRANSLATIONS.en.consent_necessary)).toBeInTheDocument();

    // Check terms agreement checkbox
    const termsInput = document.getElementById('cookie-consent-terms-pref');
    if (termsInput) fireEvent.click(termsInput);

    // Save preferences
    const saveBtn = screen.getByRole('button', { name: TRANSLATIONS.en.consent_save });
    fireEvent.click(saveBtn);

    // Modal dismissed
    expect(screen.queryByText(TRANSLATIONS.en.consent_title)).not.toBeInTheDocument();
    expect(localStorage.getItem('hettety_consent')).toBeTruthy();
  });

  it('Scenario 4: Seller Full Listing Creation Journey across all 3 steps', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(
      <AddListingPage
        onAdd={onAdd}
        t={TRANSLATIONS.en}
        isRtl={false}
        isAdmin={true}
        isSuperAdmin={true}
      />
    );

    // --- Step 1: Basic Info ---
    fireEvent.change(screen.getByPlaceholderText(/Villa in New Cairo/i), {
      target: { value: 'Palm Hills Signature Penthouse' },
    });
    fireEvent.change(screen.getByPlaceholderText('0'), {
      target: { value: '9200000' },
    });
    fireEvent.change(screen.getByPlaceholderText(/New Cairo, Cairo/i), {
      target: { value: 'October City, Giza' },
    });
    const inputs = screen.getAllByRole('spinbutton');
    const areaInput = inputs.find(i => (i as HTMLInputElement).min === '1') || inputs[2];
    fireEvent.change(areaInput, {
      target: { value: '310' },
    });

    // Advance to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByText(/Property Images/i)).toBeInTheDocument();

    // --- Step 2: Media ---
    // Advance to Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByText(/Legal Documentation/i)).toBeInTheDocument();

    // --- Step 3: Legal & Payment Methods ---
    const regInput = screen.getByPlaceholderText(/Optional/i);
    fireEvent.change(regInput, { target: { value: 'REG-555888' } });

    // Submit Listing
    const submitBtn = screen.getByRole('button', { name: /Deploy Listing/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Palm Hills Signature Penthouse',
          price: 9200000,
          location: 'October City, Giza',
          area: 310,
          registrationNumber: 'REG-555888',
        })
      );
    });
  });

  it('Scenario 5: Multi-property side-by-side comparison workflow', async () => {
    render(<App />);

    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    await screen.findByText('Luxury Beachfront Villa');

    const compareButtons = screen.getAllByRole('button', { name: /Add to comparison/i });
    // Add two properties to compare
    fireEvent.click(compareButtons[0]);
    const nextCompareButtons = screen.getAllByRole('button', { name: /Add to comparison/i });
    fireEvent.click(nextCompareButtons[0]);

    const compareNowBtn = screen.getByRole('button', { name: 'Compare now' });
    fireEvent.click(compareNowBtn);

    // Modal is opened displaying comparison specs
    expect(screen.getByText('Compare Properties')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();

    // Remove one property from compare modal
    const removeButtons = screen.getAllByRole('button', { name: /Remove .* from comparison/i });
    fireEvent.click(removeButtons[0]);

    // Modal table updates
    expect(screen.getAllByRole('button', { name: /Remove .* from comparison/i })).toHaveLength(1);
  });
});
