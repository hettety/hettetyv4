import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../../src/App';
import { AddListingPage } from '../../src/components/add-listing-page';
import { TRANSLATIONS } from '../../src/constants';
import * as firebase from '../../src/firebase';
import { MOCK_TEST_PROPERTIES } from '../helpers/fixtures';

describe('Tier 3 — Cross-Feature Combinations', () => {
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

  it('supports Theme toggle and Language switch in tandem (Arabic Dark Mode)', () => {
    render(<App />);

    // 1. Switch to Dark Mode
    const themeToggleBtn = screen.getByRole('button', { name: /تبديل المظهر|Toggle Theme/i });
    fireEvent.click(themeToggleBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // 2. Switch to Arabic (RTL)
    const langBtn = screen.getByText('AR');
    fireEvent.click(langBtn);

    // Verify both Dark Mode and Arabic RTL are active simultaneously
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    const rootDir = document.querySelector('[dir="rtl"]');
    expect(rootDir).toBeInTheDocument();
    expect(rootDir).toHaveClass('font-cairo');
    expect(screen.getByRole('button', { name: TRANSLATIONS.ar.nav_home })).toBeInTheDocument();
  });

  it('preserves search filters and sort order when toggling Dark/Light theme', async () => {
    render(<App />);

    // Navigate to Listings
    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    await screen.findByText('Luxury Beachfront Villa');

    // Apply text search
    const searchInput = screen.getByPlaceholderText(TRANSLATIONS.en.prop_search);
    fireEvent.change(searchInput, { target: { value: 'New Cairo' } });

    // Apply sort
    const sortSelect = screen.getByDisplayValue('Default Sort');
    fireEvent.change(sortSelect, { target: { value: 'price-asc' } });

    // Toggle Theme
    const themeBtn = screen.getByRole('button', { name: /تبديل المظهر|Toggle Theme/i });
    fireEvent.click(themeBtn);

    // Verify search input and sort selections persist
    expect(searchInput).toHaveValue('New Cairo');
    expect(sortSelect).toHaveValue('price-asc');
    expect(screen.getByText('Modern New Cairo Penthouse')).toBeInTheDocument();
  });

  it('formats validation errors in Arabic when form navigation fails in RTL mode', () => {
    const onAdd = vi.fn();
    render(
      <AddListingPage
        onAdd={onAdd}
        t={TRANSLATIONS.ar}
        isRtl={true}
        isAdmin={false}
        isSuperAdmin={false}
      />
    );

    // Click next without filling basic fields in Arabic mode
    const nextBtn = screen.getByRole('button', { name: /التالي|Next/i });
    fireEvent.click(nextBtn);

    // Should output Arabic error prompt
    expect(screen.getByText(/من فضلك املأ:/i)).toBeInTheDocument();
  });

  it('maintains active property detail view when switching language from English to Arabic', async () => {
    render(<App />);

    // Navigate to listings and open property details
    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    const propCardTitle = await screen.findByText('Luxury Beachfront Villa');
    fireEvent.click(propCardTitle);

    expect(window.location.hash).toBe('#property/prop-1');

    // Switch language to Arabic while on property detail page
    const langBtn = screen.getByText('AR');
    fireEvent.click(langBtn);

    // Details view should remain active with Arabic headings
    expect(screen.getByText(/الموقع على الخريطة/i)).toBeInTheDocument();
    expect(screen.getByText(/التفاصيل القانونية/i)).toBeInTheDocument();
  });

  it('maintains compare tray selections and translates compare modal to Arabic', async () => {
    render(<App />);

    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    await screen.findByText('Luxury Beachfront Villa');

    const compareButtons = screen.getAllByRole('button', { name: /Add to comparison/i });
    // Add two properties to compare
    fireEvent.click(compareButtons[0]);
    const nextCompareButtons = screen.getAllByRole('button', { name: /Add to comparison/i });
    fireEvent.click(nextCompareButtons[0]);

    expect(screen.getByText('Compare 2')).toBeInTheDocument();

    // Switch to Arabic
    fireEvent.click(screen.getByText('AR'));

    // Compare bar text should now read in Arabic
    expect(screen.getByText(/مقارنة 2/i)).toBeInTheDocument();

    // Click Compare Now button
    const compareNowBtn = screen.getByRole('button', { name: /قارن الآن/i });
    fireEvent.click(compareNowBtn);

    // Compare modal should display Arabic table headers
    expect(screen.getByText('مقارنة العقارات')).toBeInTheDocument();
    expect(screen.getByText('السعر')).toBeInTheDocument();
    expect(screen.getByText('المساحة')).toBeInTheDocument();
  });
});
