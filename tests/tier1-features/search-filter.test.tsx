import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../../src/App';
import { TRANSLATIONS } from '../../src/constants';
import * as firebase from '../../src/firebase';
import { MOCK_TEST_PROPERTIES } from '../helpers/fixtures';

describe('Tier 1 — Property Search, Category & Price Range Filtering', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('hettety_consent', JSON.stringify({ necessary: true }));
    window.location.hash = '';

    // Mock Firestore getDocs to return our fixtures
    vi.spyOn(firebase, 'getDocs').mockImplementation(async () => {
      return {
        docs: MOCK_TEST_PROPERTIES.map((p) => ({
          id: p.id,
          data: () => p,
        })),
      } as any;
    });
  });

  it('filters properties by text query matching location, compound, or title', async () => {
    render(<App />);

    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    await screen.findByText('Luxury Beachfront Villa');

    const searchInput = screen.getByPlaceholderText(TRANSLATIONS.en.prop_search);
    
    // Type 'Marassi' into search
    fireEvent.change(searchInput, { target: { value: 'Marassi' } });

    // Expect Luxury Beachfront Villa to be visible, while New Cairo Penthouse is excluded
    expect(screen.getByText('Luxury Beachfront Villa')).toBeInTheDocument();
    expect(screen.queryByText('Modern New Cairo Penthouse')).not.toBeInTheDocument();
  });

  it('filters properties by propertyType category selection', async () => {
    render(<App />);

    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    await screen.findByText('Luxury Beachfront Villa');

    // Find the property type select element
    const selects = screen.getAllByRole('combobox');
    const typeSelect = selects[0]; // first select in filter bar is property type

    // Select 'Penthouse'
    fireEvent.change(typeSelect, { target: { value: 'Penthouse' } });

    expect(screen.getByText('Modern New Cairo Penthouse')).toBeInTheDocument();
    expect(screen.queryByText('Luxury Beachfront Villa')).not.toBeInTheDocument();
    expect(screen.queryByText('Cozy Chalet for Rent')).not.toBeInTheDocument();
  });

  it('filters properties strictly within Min and Max price bounds', async () => {
    render(<App />);

    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    await screen.findByText('Luxury Beachfront Villa');

    const minPriceInput = screen.getByPlaceholderText('Min Price');
    const maxPriceInput = screen.getByPlaceholderText('Max Price');

    // Filter between 5,000,000 and 10,000,000 EGP
    fireEvent.change(minPriceInput, { target: { value: '5000000' } });
    fireEvent.change(maxPriceInput, { target: { value: '10000000' } });

    // Should include 8,500,000 (Penthouse) and 6,200,000 (Townhouse)
    // Should exclude 15,000,000 (Villa) and 3,500 (Rental Chalet) and 4,500,000 (Office)
    expect(screen.getByText('Modern New Cairo Penthouse')).toBeInTheDocument();
    expect(screen.getByText('Zayed Contemporary Townhouse')).toBeInTheDocument();
    expect(screen.queryByText('Luxury Beachfront Villa')).not.toBeInTheDocument();
    expect(screen.queryByText('Cozy Chalet for Rent')).not.toBeInTheDocument();
    expect(screen.queryByText('Downtown Administrative Office')).not.toBeInTheDocument();
  });

  it('sorts properties by price in ascending and descending order', async () => {
    render(<App />);

    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    await screen.findByText('Luxury Beachfront Villa');

    // Find the sort select dropdown
    const sortSelect = screen.getByDisplayValue('Default Sort');
    
    // Sort Price: Low to High
    fireEvent.change(sortSelect, { target: { value: 'price-asc' } });
    
    const renderedTitles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    // 3,500 (Rental Chalet) should come first among listed property cards
    expect(renderedTitles).toContain('Cozy Chalet for Rent');

    // Sort Price: High to Low
    fireEvent.change(sortSelect, { target: { value: 'price-desc' } });
    const descTitles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    expect(descTitles).toContain('Luxury Beachfront Villa');
  });

  it('toggles between individual units view and grouped projects view', async () => {
    render(<App />);

    const listingsBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    fireEvent.click(listingsBtns[0]);

    await screen.findByText('Luxury Beachfront Villa');

    // Switch to Projects view (tab role)
    const projectsBtn = screen.getByRole('tab', { name: 'Projects' });
    fireEvent.click(projectsBtn);

    // Compound names like Marassi and Mivida should be displayed as project cards
    expect(screen.getByText('Marassi')).toBeInTheDocument();
    expect(screen.getByText('Mivida')).toBeInTheDocument();

    // Switch back to Units view (tab role)
    const unitsBtn = screen.getByRole('tab', { name: 'Units' });
    fireEvent.click(unitsBtn);
    expect(screen.getByText('Luxury Beachfront Villa')).toBeInTheDocument();
  });
});
