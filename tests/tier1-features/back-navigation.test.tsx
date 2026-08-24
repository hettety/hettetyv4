import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';
import * as firebase from '../../src/firebase';
import { Property } from '../../src/types';

const unit = (over: Partial<Property> = {}): Property => ({
  id: 'u1',
  title: 'TALALA — Type T-51B',
  price: 0,
  location: 'New Heliopolis',
  bedrooms: 1,
  bathrooms: 1,
  area: 85,
  propertyType: 'Apartment',
  compound: 'TALALA',
  status: 'For Sale',
  isVerified: false,
  verificationStatus: 'Pending',
  imageUrl: 'https://example.test/a.jpg',
  ...over,
});

const listings: Property[] = [
  unit(),
  unit({ id: 'u2', title: 'TALALA — Type T-52A', area: 114, bedrooms: 2 }),
  unit({ id: 'x1', title: 'Elsewhere Villa', compound: 'Other Compound', propertyType: 'Villa' }),
];

const back = () => screen.getByRole('button', { name: /^Back$/i });

describe('Tier 1 — Back returns to where you came from', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('hettety_consent', JSON.stringify({ necessary: true }));
    window.location.hash = '';
    vi.spyOn(firebase, 'getDocs').mockImplementation(
      async () => ({ docs: listings.map(p => ({ id: p.id, data: () => p })) }) as any
    );
  });

  it('goes back to the project page a unit was opened from', async () => {
    render(<App />);
    // listings -> projects -> TALALA -> a unit
    fireEvent.click(screen.getAllByRole('button', { name: /^Listings$/i })[0]);
    fireEvent.click(await screen.findByRole('tab', { name: /^Projects$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^TALALA, 2 units$/i }));
    await screen.findByRole('heading', { name: 'TALALA' });

    fireEvent.click(await screen.findByText('TALALA — Type T-51B'));
    await waitFor(() => expect(window.location.hash).toBe('#property/u1'));

    // Back used to be hard-coded to the listings grid, a page the reader may
    // never have visited.
    fireEvent.click(back());
    await waitFor(() => expect(window.location.hash).toBe('#project/TALALA'));
  });

  it('goes back to the listings grid when that is where the unit was opened from', async () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /^Listings$/i })[0]);
    fireEvent.click(await screen.findByText('Elsewhere Villa'));
    await waitFor(() => expect(window.location.hash).toBe('#property/x1'));

    fireEvent.click(back());
    await waitFor(() => expect(window.location.hash).toBe('#listings'));
  });

  it('goes back out of a project to whatever preceded it', async () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /^Listings$/i })[0]);
    fireEvent.click(await screen.findByRole('tab', { name: /^Projects$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^TALALA, 2 units$/i }));
    await screen.findByRole('heading', { name: 'TALALA' });

    fireEvent.click(back());
    await waitFor(() => expect(window.location.hash).toBe('#listings'));
  });

  it('sends a deep-link visitor somewhere sensible instead of off the site', async () => {
    // Nothing of ours is behind them, so history.back() would leave entirely.
    window.location.hash = '#property/u1';
    render(<App />);
    await screen.findByRole('heading', { name: 'TALALA — Type T-51B' });

    fireEvent.click(back());
    await waitFor(() => expect(window.location.hash).toBe('#listings'));
  });
});
