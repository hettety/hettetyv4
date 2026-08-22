import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../src/App';
import * as firebase from '../../src/firebase';
import { Property } from '../../src/types';

const PROJECT = 'Hettety Heights';

// One compound holding both apartments and villas, so the split is observable.
// Prices and areas are deliberately far apart so a single filter isolates one unit.
const base = {
  location: 'New Cairo, Egypt',
  compound: PROJECT,
  developer: 'Hettety Developments',
  deliveryDate: '2027',
  currency: 'EGP' as const,
  status: 'For Sale' as const,
  availability: 'Available' as const,
  isVerified: true,
  imageUrl: 'https://example.test/unit.jpg',
};

const PROJECT_UNITS: Property[] = [
  { ...base, id: 'u-apt-small', title: 'Heights Apartment A', propertyType: 'Apartment', price: 3_000_000, area: 120, bedrooms: 2, bathrooms: 2 },
  { ...base, id: 'u-apt-large', title: 'Heights Apartment B', propertyType: 'Apartment', price: 9_000_000, area: 240, bedrooms: 4, bathrooms: 3 },
  { ...base, id: 'u-duplex', title: 'Heights Duplex', propertyType: 'Duplex', price: 12_000_000, area: 300, bedrooms: 4, bathrooms: 4 },
  { ...base, id: 'u-villa-a', title: 'Heights Villa A', propertyType: 'Villa', price: 20_000_000, area: 400, bedrooms: 5, bathrooms: 5 },
  { ...base, id: 'u-villa-b', title: 'Heights Villa B', propertyType: 'Villa', price: 30_000_000, area: 600, bedrooms: 6, bathrooms: 6 },
  // A unit outside the project — it must never leak onto the project page.
  { ...base, id: 'u-other', compound: 'Somewhere Else', title: 'Unrelated Apartment', propertyType: 'Apartment', price: 1_000_000, area: 90, bedrooms: 1, bathrooms: 1 },
];

/** Titles of the unit cards currently rendered, in DOM order. */
const shownUnits = () =>
  PROJECT_UNITS.map(u => u.title).filter(title => screen.queryByText(title) !== null);

describe('Tier 1 — Project page (compound split by unit category)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('hettety_consent', JSON.stringify({ necessary: true }));
    window.location.hash = `#project/${encodeURIComponent(PROJECT)}`;

    vi.spyOn(firebase, 'getDocs').mockImplementation(
      async () => ({ docs: PROJECT_UNITS.map(p => ({ id: p.id, data: () => p })) }) as any
    );
  });

  it('opens from #project/<name> and shows the compound header with its unit count', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: PROJECT })).toBeInTheDocument();
    expect(screen.getByText('Hettety Developments')).toBeInTheDocument();
    // 5 units in this compound; the sixth belongs to another one.
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Units available')).toBeInTheDocument();
    expect(screen.queryByText('Unrelated Apartment')).not.toBeInTheDocument();
  });

  it('splits the compound into an Apartments tab and a Villas tab with correct counts', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: PROJECT });

    const tabs = screen.getAllByRole('tab');
    expect(tabs.map(tab => tab.textContent)).toEqual(['Apartments (3)', 'Villas (2)']);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('shows only apartments on the Apartments tab and only villas on the Villas tab', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: PROJECT });

    // Apartments tab is selected by default — duplexes count as apartments.
    expect(shownUnits()).toEqual(['Heights Apartment A', 'Heights Apartment B', 'Heights Duplex']);

    fireEvent.click(screen.getByRole('tab', { name: /Villas/ }));
    expect(shownUnits()).toEqual(['Heights Villa A', 'Heights Villa B']);
  });

  it('narrows the visible units by max price', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: PROJECT });

    fireEvent.change(screen.getByLabelText('Max price'), { target: { value: '9000000' } });

    expect(shownUnits()).toEqual(['Heights Apartment A', 'Heights Apartment B']);
    expect(screen.getByText('Showing 2 of 3 units')).toBeInTheDocument();
  });

  it('narrows the visible units by min area and by bedrooms', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: PROJECT });

    fireEvent.change(screen.getByLabelText('Min area (m²)'), { target: { value: '250' } });
    expect(shownUnits()).toEqual(['Heights Duplex']);

    fireEvent.change(screen.getByLabelText('Min area (m²)'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Bedrooms'), { target: { value: '4' } });
    expect(shownUnits()).toEqual(['Heights Apartment B', 'Heights Duplex']);
  });

  it('offers a way out when a filter matches nothing, and clears it', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: PROJECT });

    fireEvent.change(screen.getByLabelText('Max price'), { target: { value: '1' } });
    expect(shownUnits()).toEqual([]);
    expect(screen.getByText('No units match these filters.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(shownUnits()).toEqual(['Heights Apartment A', 'Heights Apartment B', 'Heights Duplex']);
  });

  it('resets filters when switching tabs, so no tab opens looking empty', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: PROJECT });

    // 3M would exclude every villa in this project.
    fireEvent.change(screen.getByLabelText('Max price'), { target: { value: '3000000' } });
    fireEvent.click(screen.getByRole('tab', { name: /Villas/ }));

    expect(screen.getByLabelText('Max price')).toHaveValue(null);
    expect(shownUnits()).toEqual(['Heights Villa A', 'Heights Villa B']);
  });

  it('renders the whole page in Arabic when the language is switched', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: PROJECT });

    fireEvent.click(screen.getAllByRole('button', { name: /العربية|Arabic|AR/i })[0]);

    const tabs = screen.getAllByRole('tab');
    expect(tabs.map(tab => tab.textContent)).toEqual(['شقق (3)', 'فلل (2)']);
    expect(screen.getByText('وحدة متاحة')).toBeInTheDocument();
    expect(screen.getByLabelText('أقصى سعر')).toBeInTheDocument();
    expect(screen.getByLabelText('أقل مساحة (م²)')).toBeInTheDocument();
  });
});
