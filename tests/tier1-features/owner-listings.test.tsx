import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';
import * as firebase from '../../src/firebase';
import { Property } from '../../src/types';
import { MATERIAL_LISTING_FIELDS, normalizeField } from '../../src/components/add-listing-page';

/** The wizard opens on step 1; Save lives on the last step. */
const gotoLastStep = async () => {
  fireEvent.click(screen.getByRole('tab', { name: /Legal Docs/i }));
  return screen.findByTestId('listing-submit');
};

const UID = 'seller-uid-1';

const mine = (over: Partial<Property> = {}): Property => ({
  id: 'mine-1',
  title: 'My Nasr City Apartment',
  description: 'Third floor, quiet street.',
  price: 2_500_000,
  location: 'Nasr City, Cairo',
  bedrooms: 3,
  bathrooms: 2,
  area: 150,
  propertyType: 'Apartment',
  currency: 'EGP',
  contactPhone: '+201000000009',
  status: 'For Sale',
  availability: 'Available',
  isVerified: true,
  verificationStatus: 'Verified',
  imageUrl: 'https://example.test/a.jpg',
  authorUid: UID,
  paymentMethods: ['Cash'],
  ...over,
});

const theirs: Property = {
  id: 'theirs-1',
  title: 'Someone Else Villa',
  price: 9_000_000,
  location: 'Zayed',
  bedrooms: 4,
  bathrooms: 3,
  area: 300,
  propertyType: 'Villa',
  status: 'For Sale',
  isVerified: false,
  verificationStatus: 'Pending',
  imageUrl: 'https://example.test/b.jpg',
  authorUid: 'other-uid',
};

const withProperties = (props: Property[]) => {
  vi.spyOn(firebase, 'getDocs').mockImplementation(
    async () => ({ docs: props.map(p => ({ id: p.id, data: () => p })) }) as any
  );
};

describe('Tier 1 — Owner listing management', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('hettety_consent', JSON.stringify({ necessary: true }));
    window.location.hash = '';
    (firebase.auth as any).currentUser = { uid: UID, email: 'seller@example.test' };
    // ProfilePage keys off userEmail, which only App's auth listener sets. This
    // makes isAuthReady settle asynchronously, so every assertion below awaits.
    vi.spyOn(firebase, 'onAuthStateChanged').mockImplementation(((_a: any, cb: any) => {
      cb({ uid: UID, email: 'seller@example.test', displayName: 'Seller' });
      return vi.fn();
    }) as any);
    withProperties([mine(), theirs]);
  });

  afterEach(() => {
    (firebase.auth as any).currentUser = null;
  });

  it('lists only the listings this user posted, under My Listings', async () => {
    window.location.hash = '#profile';
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /My Listings/i }));

    expect(await screen.findByText('My Nasr City Apartment')).toBeInTheDocument();
    expect(screen.queryByText('Someone Else Villa')).toBeNull();
    // Actions that did not exist at all before.
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete permanently' })).toBeInTheDocument();
  });

  it('hides a Removed listing from the public grid but keeps it in My Listings', async () => {
    withProperties([mine({ listingState: 'Removed' }), theirs]);
    window.location.hash = '#listings';
    render(<App />);

    await screen.findByText('Someone Else Villa');
    expect(screen.queryByText('My Nasr City Apartment')).toBeNull();

    window.location.hash = '#profile';
    fireEvent(window, new HashChangeEvent('hashchange'));
    fireEvent.click(await screen.findByRole('button', { name: /My Listings/i }));
    expect(await screen.findByText('My Nasr City Apartment')).toBeInTheDocument();
    expect(screen.getByText('Removed')).toBeInTheDocument();
  });

  it('hides a Rejected listing from the public grid and shows the owner why', async () => {
    withProperties([mine({ verificationStatus: 'Rejected', isVerified: false, reviewNote: 'The deed photo is cut off.' }), theirs]);
    window.location.hash = '#listings';
    render(<App />);

    await screen.findByText('Someone Else Villa');
    expect(screen.queryByText('My Nasr City Apartment')).toBeNull();

    window.location.hash = '#profile';
    fireEvent(window, new HashChangeEvent('hashchange'));
    fireEvent.click(await screen.findByRole('button', { name: /My Listings/i }));
    expect(await screen.findByText('The deed photo is cut off.')).toBeInTheDocument();
    expect(screen.getByText('Needs changes')).toBeInTheDocument();
  });

  it('opens the wizard in edit mode with the listing already filled in', async () => {
    window.location.hash = '#edit-listing/mine-1';
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Edit listing' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('My Nasr City Apartment')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2500000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Nasr City, Cairo')).toBeInTheDocument();
    // Creating several units from one form must not be reachable while editing one.
    expect(screen.queryByRole('button', { name: /Add Another Property/i })).toBeNull();
  });

  it('refuses to open the editor for a listing someone else posted', async () => {
    window.location.hash = '#edit-listing/theirs-1';
    render(<App />);

    expect(await screen.findByText(/isn't yours to edit/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Edit listing' })).toBeNull();
  });

  it('keeps the review badge when only the description changes', async () => {
    const updateDoc = vi.spyOn(firebase, 'updateDoc').mockResolvedValue(undefined as any);
    window.location.hash = '#edit-listing/mine-1';
    render(<App />);
    await screen.findByRole('heading', { name: 'Edit listing' });

    const desc = screen.getByDisplayValue('Third floor, quiet street.');
    fireEvent.change(desc, { target: { value: 'Third floor, quiet street. Newly painted.' } });
    fireEvent.click(await gotoLastStep());

    await waitFor(() => expect(updateDoc).toHaveBeenCalled());
    const patch = updateDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
    expect(patch.description).toBe('Third floor, quiet street. Newly painted.');
    expect(patch).not.toHaveProperty('verificationStatus');
    expect(patch).not.toHaveProperty('isVerified');
  });

  it('drops the review back to Pending when the price changes', async () => {
    const updateDoc = vi.spyOn(firebase, 'updateDoc').mockResolvedValue(undefined as any);
    window.location.hash = '#edit-listing/mine-1';
    render(<App />);
    await screen.findByRole('heading', { name: 'Edit listing' });

    fireEvent.change(screen.getByDisplayValue('2500000'), { target: { value: '3100000' } });
    fireEvent.click(await gotoLastStep());

    await waitFor(() => expect(updateDoc).toHaveBeenCalled());
    const patch = updateDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
    expect(patch.price).toBe(3100000);
    expect(patch.verificationStatus).toBe('Pending');
    expect(patch.isVerified).toBe(false);
    // Identity fields belong to the platform and are refused by the rules anyway.
    expect(patch).not.toHaveProperty('unitCode');
    expect(patch).not.toHaveProperty('publishDate');
    expect(patch).not.toHaveProperty('authorUid');
  });

  it('lets the owner clear an optional field instead of silently keeping it', async () => {
    const updateDoc = vi.spyOn(firebase, 'updateDoc').mockResolvedValue(undefined as any);
    window.location.hash = '#edit-listing/mine-1';
    render(<App />);
    await screen.findByRole('heading', { name: 'Edit listing' });

    fireEvent.change(screen.getByDisplayValue('+201000000009'), { target: { value: '' } });
    fireEvent.click(await gotoLastStep());

    await waitFor(() => expect(updateDoc).toHaveBeenCalled());
    const patch = updateDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
    // updateDoc merges, so omitting the key would leave the old number in place.
    expect(patch.contactPhone).toBe('');
    // contactPhone is material: swapping the number on a reviewed listing is the
    // classic bait-and-switch.
    expect(patch.verificationStatus).toBe('Pending');
  });

  it('requires an account before letting anyone fill in the whole wizard', async () => {
    (firebase.auth as any).currentUser = null;
    window.location.hash = '#add-listing';
    render(<App />);

    expect(await screen.findByRole('heading', { name: /Sign in to post a listing/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Add New Listing' })).toBeNull();
  });
});

describe('Tier 1 — Material-field contract (client and rules must agree)', () => {
  it('treats every representation of "empty" as the same value', () => {
    ['', 0, false, undefined, null, []].forEach(v => expect(normalizeField(v)).toBe(''));
    expect(normalizeField('Cairo')).toBe('Cairo');
    expect(normalizeField(150)).toBe('150');
    expect(normalizeField(['a'])).toBe('["a"]');
  });

  it('lists exactly the fields firestore.rules calls material', () => {
    // Drift here shows up in production as a bare permission-denied on an edit.
    expect([...MATERIAL_LISTING_FIELDS]).toEqual([
      'title', 'price', 'currency', 'location', 'area', 'areaTo', 'status',
      'propertyType', 'compound', 'developer', 'contactPhone', 'legalDocs',
      'registrationNumber', 'courtSignatureValidity', 'isResale',
    ]);
  });
});
