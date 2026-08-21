import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddListingPage } from '../../src/components/add-listing-page';
import { TRANSLATIONS } from '../../src/constants';

describe('Tier 1 — Add Listing Multi-Step Wizard Progression', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders Step 1 (Basic Information) with required input fields', () => {
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

    // Verify Step 1 fields are present
    expect(screen.getByPlaceholderText(/Villa in New Cairo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/New Cairo, Cairo/i)).toBeInTheDocument();
  });

  it('blocks step progression from Step 1 to Step 2 when required basics are missing', () => {
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

    // Find and click the "Next" button on Step 1
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    // Error message should appear indicating missing fields
    expect(screen.getByText(/Please fill in:/i)).toBeInTheDocument();
  });

  it('advances from Step 1 to Step 2 when all required basic fields are populated', () => {
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

    // Fill Title, Price, Location, Area
    fireEvent.change(screen.getByPlaceholderText(/Villa in New Cairo/i), {
      target: { value: 'Spacious Family Villa' },
    });
    fireEvent.change(screen.getByPlaceholderText('0'), {
      target: { value: '7500000' },
    });
    fireEvent.change(screen.getByPlaceholderText(/New Cairo, Cairo/i), {
      target: { value: 'El Gouna, Red Sea' },
    });
    
    const inputs = screen.getAllByRole('spinbutton');
    const areaInput = inputs.find(i => (i as HTMLInputElement).min === '1') || inputs[2];
    fireEvent.change(areaInput, { target: { value: '320' } });

    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    // Step 2 elements (Media & 3D Tours) should now be in view
    expect(screen.getByText(/Property Images/i)).toBeInTheDocument();
  });

  it('navigates from Step 2 to Step 3 and back to Step 1 while preserving form inputs', () => {
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

    // Populate Step 1
    const titleInput = screen.getByPlaceholderText(/Villa in New Cairo/i);
    fireEvent.change(titleInput, { target: { value: 'Preserved Title Villa' } });
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '6000000' } });
    fireEvent.change(screen.getByPlaceholderText(/New Cairo, Cairo/i), { target: { value: 'Sheikh Zayed' } });
    
    const inputs = screen.getAllByRole('spinbutton');
    const areaInput = inputs.find(i => (i as HTMLInputElement).min === '1') || inputs[2];
    fireEvent.change(areaInput, { target: { value: '250' } });

    // Go to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByText(/Property Images/i)).toBeInTheDocument();

    // Go to Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByText(/Legal Documentation/i)).toBeInTheDocument();

    // Go back to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Back/i }));
    expect(screen.getByText(/Property Images/i)).toBeInTheDocument();

    // Go back to Step 1
    fireEvent.click(screen.getByRole('button', { name: /Back/i }));
    expect(screen.getByDisplayValue('Preserved Title Villa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('6000000')).toBeInTheDocument();
  });

  it('renders Step 3 legal & payment options and toggles payment methods', () => {
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

    // Fill Step 1
    fireEvent.change(screen.getByPlaceholderText(/Villa in New Cairo/i), { target: { value: 'Duplex Penthouse' } });
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '4500000' } });
    fireEvent.change(screen.getByPlaceholderText(/New Cairo, Cairo/i), { target: { value: 'New Capital' } });
    
    const inputs = screen.getAllByRole('spinbutton');
    const areaInput = inputs.find(i => (i as HTMLInputElement).min === '1') || inputs[2];
    fireEvent.change(areaInput, { target: { value: '180' } });

    // Toggle Payment Method buttons on Step 1
    const installmentsBtn = screen.getByRole('button', { name: /Installments/i });
    fireEvent.click(installmentsBtn);

    // Step 1 -> Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Verify legal documentation step 3
    expect(screen.getByText(/Legal Documentation/i)).toBeInTheDocument();

    // Verify checkbox on step 3
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();
  });
});
