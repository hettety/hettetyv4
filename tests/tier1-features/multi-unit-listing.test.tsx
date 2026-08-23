import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddListingPage } from '../../src/components/add-listing-page';
import { TRANSLATIONS } from '../../src/constants';
import * as firebase from '../../src/firebase';

const t = TRANSLATIONS.en;

const renderWizard = (props: Record<string, unknown> = {}) =>
  render(<AddListingPage onAdd={vi.fn()} isAdmin={false} isSuperAdmin={false} t={t} isRtl={false} {...props} />);

const fillBasics = (over: { compound?: string } = {}) => {
  fireEvent.change(screen.getByLabelText(/Property Title/i), { target: { value: 'Badya Palm Hills' } });
  fireEvent.change(screen.getByLabelText(/^Price/i), { target: { value: '3000000' } });
  fireEvent.change(screen.getByLabelText(/^Location/i), { target: { value: '6th of October' } });
  fireEvent.change(screen.getByLabelText(/Area from/i), { target: { value: '120' } });
  if (over.compound !== undefined) {
    fireEvent.change(screen.getByLabelText(/Compound/i), { target: { value: over.compound } });
  }
};

const addUnitType = (n = 1) => {
  for (let i = 0; i < n; i++) fireEvent.click(screen.getByRole('button', { name: /^Add$/ }));
};

describe('Tier 1 — Building a project by hand', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('hettety_consent', JSON.stringify({ necessary: true }));
    (firebase.auth as any).currentUser = { uid: 'seller-1', email: 'seller@example.test' };
  });

  afterEach(() => { (firebase.auth as any).currentUser = null; });

  it('offers the unit-types panel before any unit exists', () => {
    renderWizard();
    // The Add button used to live inside `unitVariants.length > 0`, so there was
    // no way to create the first row without the AI brochure import.
    expect(screen.getByText(/Unit Types \(0\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Add$/ })).toBeInTheDocument();
    expect(screen.getByText(/Project with several sizes or unit types/i)).toBeInTheDocument();
  });

  it('lets a seller enter several sizes and publishes one listing per type', async () => {
    const onAddMany = vi.fn().mockResolvedValue(undefined);
    renderWizard({ onAddMany });

    fillBasics({ compound: 'Badya' });
    addUnitType(2);

    const areasFrom = screen.getAllByLabelText(/^Area from \d+$/);
    const prices = screen.getAllByLabelText(/^Price \d+$/);
    const labels = screen.getAllByLabelText(/^Unit label \d+$/);
    fireEvent.change(labels[0], { target: { value: '2 Bedroom' } });
    fireEvent.change(areasFrom[0], { target: { value: '120' } });
    fireEvent.change(prices[0], { target: { value: '3000000' } });
    fireEvent.change(labels[1], { target: { value: '3 Bedroom' } });
    fireEvent.change(areasFrom[1], { target: { value: '164' } });
    fireEvent.change(prices[1], { target: { value: '4200000' } });

    fireEvent.click(screen.getByRole('tab', { name: /Legal Docs/i }));
    fireEvent.click(await screen.findByTestId('listing-submit'));

    await waitFor(() => expect(onAddMany).toHaveBeenCalled());
    const list = onAddMany.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(list).toHaveLength(2);
    expect(list.map(u => u.title)).toEqual(['Badya Palm Hills — 2 Bedroom', 'Badya Palm Hills — 3 Bedroom']);
    expect(list.map(u => u.area)).toEqual([120, 164]);
    expect(list.map(u => u.price)).toEqual([3000000, 4200000]);
    // Every unit carries the compound — that is what groups them on one page.
    expect(new Set(list.map(u => u.compound))).toEqual(new Set(['Badya']));
    // Each is its own listing with its own code.
    expect(new Set(list.map(u => u.unitCode)).size).toBe(2);
  });

  it('refuses to publish unit types with no project to group them under', async () => {
    const onAddMany = vi.fn().mockResolvedValue(undefined);
    renderWizard({ onAddMany });

    fillBasics();               // no compound
    addUnitType(1);
    fireEvent.change(screen.getAllByLabelText(/^Area from \d+$/)[0], { target: { value: '120' } });

    fireEvent.click(screen.getByRole('tab', { name: /Legal Docs/i }));
    fireEvent.click(await screen.findByTestId('listing-submit'));

    // Publishing them compound-less scatters them as unrelated listings, which is
    // the opposite of what the panel is for.
    await screen.findByText(/Fill in the Compound \/ Project name first/i);
    expect(onAddMany).not.toHaveBeenCalled();
  });

  it('hides the panel while editing a single listing', () => {
    renderWizard({
      mode: 'edit',
      initialProperty: { id: 'p1', title: 'One unit', price: 1, location: 'Cairo', bedrooms: 1, bathrooms: 1, area: 90, status: 'For Sale', isVerified: false, imageUrl: '' },
      onUpdate: vi.fn(),
    });
    expect(screen.queryByText(/Unit Types/)).toBeNull();
  });
});
