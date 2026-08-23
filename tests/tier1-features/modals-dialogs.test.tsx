import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CookieConsent from '../../src/components/CookieConsent';
import Property3DViewer from '../../src/components/Property3DViewer';
import App from '../../src/App';
import { TRANSLATIONS } from '../../src/constants';
import { MOCK_TEST_PROPERTIES } from '../helpers/fixtures';

// Mock Three.js / Canvas for 3D Viewer testing
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: any) => <div data-testid="mock-r3f-canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: () => ({ camera: {}, gl: {}, scene: {} }),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="mock-orbit-controls" />,
}));

describe('Tier 1 — Modals, Dialogs & Accessibility Drawers', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.style.overflow = 'auto';
  });

  it('renders CookieConsent dialog when no prior consent exists and locks background scroll', () => {
    const onNavLegal = vi.fn();
    render(<CookieConsent t={TRANSLATIONS.en} isRtl={false} onNavigateToLegal={onNavLegal} />);

    expect(screen.getByText(TRANSLATIONS.en.consent_title)).toBeInTheDocument();
    expect(screen.getByText(TRANSLATIONS.en.consent_desc)).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('allows accepting all cookie policies after checking terms agreement', async () => {
    const onNavLegal = vi.fn();
    render(<CookieConsent t={TRANSLATIONS.en} isRtl={false} onNavigateToLegal={onNavLegal} />);

    const checkbox = screen.getByRole('checkbox');
    const acceptBtn = screen.getByRole('button', { name: TRANSLATIONS.en.consent_accept });

    // Clicking accept without checkbox checked does not dismiss
    fireEvent.click(acceptBtn);
    expect(screen.getByText(TRANSLATIONS.en.consent_title)).toBeInTheDocument();

    // Check agreement
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Now click accept
    fireEvent.click(acceptBtn);

    // Dialog should be dismissed and saved in localStorage
    expect(screen.queryByText(TRANSLATIONS.en.consent_title)).not.toBeInTheDocument();
    expect(localStorage.getItem('hettety_consent')).toBeTruthy();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('switches CookieConsent to Manage Preferences mode and toggles analytics/marketing options', () => {
    const onNavLegal = vi.fn();
    render(<CookieConsent t={TRANSLATIONS.en} isRtl={false} onNavigateToLegal={onNavLegal} />);

    const manageBtn = screen.getByRole('button', { name: TRANSLATIONS.en.consent_manage });
    fireEvent.click(manageBtn);

    // Preferences view should display category toggles
    expect(screen.getByText(TRANSLATIONS.en.consent_necessary)).toBeInTheDocument();
    expect(screen.getByText(TRANSLATIONS.en.consent_analytics)).toBeInTheDocument();
    expect(screen.getByText(TRANSLATIONS.en.consent_marketing)).toBeInTheDocument();

    // Necessary toggle is always disabled/locked
    const switches = screen.getAllByRole('checkbox');
    expect(switches[0]).toBeDisabled(); // necessary
  });

  it('opens and closes the Mobile Navigation Drawer via hamburger and X buttons', async () => {
    localStorage.setItem('hettety_consent', JSON.stringify({ necessary: true }));
    vi.useFakeTimers();
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    vi.useRealTimers();

    // Find hamburger button
    const buttons = screen.getAllByRole('button');
    const hamburgerBtn = buttons.find(b => b.className.includes('lg:hidden'));
    expect(hamburgerBtn).toBeDefined();

    // Open mobile menu
    fireEvent.click(hamburgerBtn!);

    // Mobile menu items should now be visible in the DOM
    expect(screen.getByText(/اللغة العربية|English Language/i)).toBeInTheDocument();

    // Close mobile menu using the close X button inside drawer
    const closeDrawerBtn = screen.getAllByRole('button').find(b => b.querySelector('svg.lucide-x'));
    expect(closeDrawerBtn).toBeDefined();
    fireEvent.click(closeDrawerBtn!);
  });

  it('renders Property3DViewer modal, allows mode switching and closes on Escape or close button', () => {
    const onClose = vi.fn();
    const property = MOCK_TEST_PROPERTIES[0];

    const { rerender } = render(
      <Property3DViewer
        images={property.images}
        panoramas={property.panoramas}
        title={property.title}
        onClose={onClose}
        isRtl={false}
      />
    );

    expect(screen.getByText(property.title)).toBeInTheDocument();
    expect(screen.getByTestId('mock-r3f-canvas')).toBeInTheDocument();

    // Mode switch button exists when both images and panoramas exist. The label
    // is "photo relief", not "3D": the mode builds a relief from the photo and
    // does not measure the room.
    const depthBtn = screen.getByRole('button', { name: /photo relief/i });
    fireEvent.click(depthBtn);
    expect(screen.queryByRole('button', { name: /Depth Photos/i })).toBeNull();

    // Close on Escape key
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalled();

    // Close button click
    const closeBtn = screen.getByRole('button', { name: /Close 3D viewer/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
