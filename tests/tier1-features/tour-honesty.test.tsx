import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App, { tourKind } from '../../src/App';
import * as firebase from '../../src/firebase';
import { Property } from '../../src/types';

const base: Property = {
  id: 'p1',
  title: 'Nasr City Apartment',
  price: 2_000_000,
  location: 'Nasr City',
  bedrooms: 2,
  bathrooms: 1,
  area: 120,
  propertyType: 'Apartment',
  status: 'For Sale',
  isVerified: false,
  verificationStatus: 'Pending',
  imageUrl: 'https://example.test/a.jpg',
};

const withProperties = (props: Property[]) => {
  vi.spyOn(firebase, 'getDocs').mockImplementation(
    async () => ({ docs: props.map(p => ({ id: p.id, data: () => p })) }) as any
  );
};

describe('Tier 1 — The tour button says what the listing holds', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('hettety_consent', JSON.stringify({ necessary: true }));
    window.location.hash = '#listings';
  });

  it('classifies a listing by what actually shows the property', () => {
    // Descending order of how much of the property each really conveys.
    expect(tourKind({ ...base, digitalTwinUrl: 'https://my.matterport.com/show/?m=abc' })).toBe('walkthrough');
    expect(tourKind({ ...base, panoramas: ['https://example.test/p.jpg'] })).toBe('pano');
    expect(tourKind({ ...base, images: ['a', 'b', 'c'] })).toBe('gallery');
    expect(tourKind(base)).toBe('single');
    expect(tourKind({ ...base, images: ['only-one'] })).toBe('single');
  });

  it('ignores a tour link the URL allowlist rejects', () => {
    // safeTourUrl only admits known viewers; anything else must not be advertised
    // as a walkthrough.
    expect(tourKind({ ...base, digitalTwinUrl: 'https://evil.example.com/x' })).not.toBe('walkthrough');
    expect(tourKind({ ...base, digitalTwinUrl: 'javascript:alert(1)' })).not.toBe('walkthrough');
  });

  it('offers no tour on a listing that is one flat photo', async () => {
    // 23 of the 29 live listings are exactly this, and every one of them used to
    // carry a "View in 3D" button that delivered a single photo tilting.
    withProperties([base]);
    render(<App />);
    await screen.findByText('Nasr City Apartment');

    expect(screen.queryByRole('button', { name: /360|walk through|photo preview/i })).toBeNull();
  });

  it('calls a 360 photo a 360 tour, and several photos a photo preview', async () => {
    withProperties([
      { ...base, id: 'pano', title: 'Has A Panorama', panoramas: ['https://example.test/p.jpg'] },
      { ...base, id: 'many', title: 'Has Several Photos', images: ['a', 'b', 'c'] },
    ]);
    render(<App />);
    await screen.findByText('Has A Panorama');

    expect(screen.getByRole('button', { name: /360° tour — Has A Panorama/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Photo preview — Has Several Photos/i })).toBeInTheDocument();
  });

  it('promises a walk through the unit only when there is a scan to walk', async () => {
    withProperties([{ ...base, id: 'twin', title: 'Has A Scan', digitalTwinUrl: 'https://my.matterport.com/show/?m=abc' }]);
    render(<App />);
    await screen.findByText('Has A Scan');

    expect(screen.getByRole('button', { name: /Walk through it — Has A Scan/i })).toBeInTheDocument();
  });

  it('says the same thing in Arabic', async () => {
    withProperties([{ ...base, id: 'pano', title: 'Has A Panorama', panoramas: ['https://example.test/p.jpg'] }]);
    render(<App />);
    await screen.findByText('Has A Panorama');

    fireEvent.click(screen.getAllByRole('button', { name: /العربية|Arabic|^AR$/i })[0]);
    expect(await screen.findByRole('button', { name: /جولة 360°/ })).toBeInTheDocument();
  });
});
