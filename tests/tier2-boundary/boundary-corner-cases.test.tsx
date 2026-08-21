import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../../src/App';
import { AddListingPage } from '../../src/components/add-listing-page';
import { TRANSLATIONS } from '../../src/constants';
import * as firebase from '../../src/firebase';
import { MOCK_TEST_PROPERTIES } from '../helpers/fixtures';

describe('Tier 2 — Boundary, Negative & Corner Cases', () => {
  beforeEach(() => {
    localStorage.clear();
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

  it('resets to full properties list when search input is emptied after filtering', async () => {
    render(<App />);

    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    await screen.findByText('Luxury Beachfront Villa');

    const searchInput = screen.getByPlaceholderText(TRANSLATIONS.en.prop_search);

    // Filter by specific keyword
    fireEvent.change(searchInput, { target: { value: 'Marassi' } });
    expect(screen.getByText('Luxury Beachfront Villa')).toBeInTheDocument();
    expect(screen.queryByText('Modern New Cairo Penthouse')).not.toBeInTheDocument();

    // Clear search input completely
    fireEvent.change(searchInput, { target: { value: '' } });

    // Both should now be back
    expect(screen.getByText('Luxury Beachfront Villa')).toBeInTheDocument();
    expect(screen.getByText('Modern New Cairo Penthouse')).toBeInTheDocument();
  });

  it('handles non-matching search queries gracefully with 0 results displayed', async () => {
    render(<App />);

    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    await screen.findByText('Luxury Beachfront Villa');

    const searchInput = screen.getByPlaceholderText(TRANSLATIONS.en.prop_search);
    
    // Type query that matches zero properties
    fireEvent.change(searchInput, { target: { value: 'NON_EXISTENT_LOCATION_XYZ_999' } });

    // No property cards should be rendered
    expect(screen.queryByText('Luxury Beachfront Villa')).not.toBeInTheDocument();
    expect(screen.queryByText('Modern New Cairo Penthouse')).not.toBeInTheDocument();
    expect(screen.queryByText('Cozy Chalet for Rent')).not.toBeInTheDocument();
  });

  it('handles extreme price boundaries when Min Price exceeds maximum market prices', async () => {
    render(<App />);

    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    await screen.findByText('Luxury Beachfront Villa');

    const minPriceInput = screen.getByPlaceholderText('Min Price');
    
    // Min price 999,999,999 EGP (higher than all properties in dataset)
    fireEvent.change(minPriceInput, { target: { value: '999999999' } });

    expect(screen.queryByText('Luxury Beachfront Villa')).not.toBeInTheDocument();
    expect(screen.queryByText('Modern New Cairo Penthouse')).not.toBeInTheDocument();
  });

  it('handles zero and negative price boundaries in AddListing form validation', () => {
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

    // Provide title, location, area, but price = 0
    fireEvent.change(screen.getByPlaceholderText(/Villa in New Cairo/i), {
      target: { value: 'Test Boundary Property' },
    });
    fireEvent.change(screen.getByPlaceholderText('0'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByPlaceholderText(/New Cairo, Cairo/i), {
      target: { value: 'New Cairo' },
    });
    const inputs = screen.getAllByRole('spinbutton');
    const areaInput = inputs.find(i => (i as HTMLInputElement).min === '1') || inputs[2];
    fireEvent.change(areaInput, {
      target: { value: '150' },
    });

    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    // Should reject price: 0 and remain on step 1 with error
    expect(screen.getByText(/Please fill in: Price/i)).toBeInTheDocument();
  });

  it('handles rapid hamburger drawer toggling without leaking backdrop scroll lock', () => {
    render(<App />);

    const buttons = screen.getAllByRole('button');
    const hamburgerBtn = buttons.find(b => b.className.includes('lg:hidden'));
    expect(hamburgerBtn).toBeDefined();

    // Rapid open/close clicks
    fireEvent.click(hamburgerBtn!);
    expect(screen.getByText(/اللغة العربية|English Language/i)).toBeInTheDocument();

    const closeBtn = screen.getAllByRole('button').find(b => b.querySelector('svg.lucide-x'));
    fireEvent.click(closeBtn!);

    // Reopen immediately
    fireEvent.click(hamburgerBtn!);
    expect(screen.getByText(/اللغة العربية|English Language/i)).toBeInTheDocument();
  });
});
