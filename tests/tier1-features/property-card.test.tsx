import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../../src/App';
import { TRANSLATIONS } from '../../src/constants';
import * as firebase from '../../src/firebase';
import { MOCK_TEST_PROPERTIES } from '../helpers/fixtures';

describe('Tier 1 — PropertyCard Component Interactions & Visual Badges', () => {
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

  it('renders property title, formatted price, beds, baths, and area metrics', async () => {
    render(<App />);

    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    const cardTitle = await screen.findByText('Luxury Beachfront Villa');
    expect(cardTitle).toBeInTheDocument();

    // Verify price formatting (15,000,000 EGP)
    expect(screen.getByText(/15,000,000/)).toBeInTheDocument();

    // Verify stats
    expect(screen.getByText(/5 Beds/i)).toBeInTheDocument();
    expect(screen.getByText(/4 Baths/i)).toBeInTheDocument();
    expect(screen.getByText(/450 m²/i)).toBeInTheDocument();
  });

  it('labels every card with what was actually reviewed, reviewed or not', async () => {
    render(<App />);

    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    await screen.findByText('Luxury Beachfront Villa');

    // 3 fixtures are Verified, 2 are Pending. Absence of a badge used to be the
    // only signal for an unreviewed listing, which told a buyer nothing.
    expect(screen.getAllByText('Documents reviewed')).toHaveLength(3);
    expect(screen.getAllByText('Not reviewed')).toHaveLength(2);

    // The old copy claimed a legal guarantee the platform never established.
    expect(screen.queryByText('Verified Legal')).toBeNull();
    expect(screen.queryByText('أصلي + ثقة وقانون')).toBeNull();
  });

  it('toggles Compare button on PropertyCard and activates compare tray', async () => {
    render(<App />);

    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    await screen.findByText('Luxury Beachfront Villa');

    const compareButtons = screen.getAllByRole('button', { name: /Add to comparison/i });
    expect(compareButtons.length).toBeGreaterThan(0);

    // Click compare on first property
    fireEvent.click(compareButtons[0]);

    // Compare bar should pop up with count "Compare 1"
    expect(screen.getByText('Compare 1')).toBeInTheDocument();

    // Click compare on second property
    const nextCompareButtons = screen.getAllByRole('button', { name: /Add to comparison/i });
    fireEvent.click(nextCompareButtons[0]);
    expect(screen.getByText('Compare 2')).toBeInTheDocument();
  });

  it('triggers 3D View modal navigation when View 3D is clicked on card', async () => {
    render(<App />);

    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    await screen.findByText('Luxury Beachfront Villa');

    const view3dButtons = screen.getAllByRole('button', { name: /View property in 3D/i });
    expect(view3dButtons.length).toBeGreaterThan(0);

    // Click View 3D on first card
    fireEvent.click(view3dButtons[0]);

    // Hash should change to #3d
    expect(window.location.hash).toBe('#3d');
  });

  it('renders Sold and Reserved availability status overlay badges', async () => {
    render(<App />);

    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    await screen.findByText('Luxury Beachfront Villa');

    // Allegria Townhouse is Reserved
    expect(screen.getByText('Reserved')).toBeInTheDocument();

    // Downtown Office is Sold
    expect(screen.getByText('Sold')).toBeInTheDocument();
  });

  it('navigates to property detail page when property card is clicked', async () => {
    render(<App />);

    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    const cardTitle = await screen.findByText('Luxury Beachfront Villa');
    fireEvent.click(cardTitle);

    expect(window.location.hash).toBe('#property/prop-1');
  });
});
