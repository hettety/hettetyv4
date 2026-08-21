import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../../src/App';
import AboutPage from '../../src/components/AboutPage';
import TermsPage from '../../src/components/TermsPage';
import { TRANSLATIONS } from '../../src/constants';

describe('Tier 1 — Language Switcher & Bidirectional RTL/LTR Parity', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('hettety_consent', JSON.stringify({ necessary: true }));
  });

  it('renders in English LTR mode by default with English navigation labels', async () => {
    vi.useFakeTimers();
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    vi.useRealTimers();

    // Verify root container has dir="ltr"
    const rootContainer = document.querySelector('[dir="ltr"]');
    expect(rootContainer).toBeInTheDocument();

    expect(screen.getByRole('button', { name: TRANSLATIONS.en.nav_home })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: TRANSLATIONS.en.nav_listings })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: TRANSLATIONS.en.nav_trust })).toBeInTheDocument();
  });

  it('switches to Arabic RTL mode upon clicking language switch button', async () => {
    vi.useFakeTimers();
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    vi.useRealTimers();

    const langBtn = screen.getByText('AR');
    fireEvent.click(langBtn);

    // Root wrapper now sets dir="rtl" and font-cairo
    const rtlContainer = document.querySelector('[dir="rtl"]');
    expect(rtlContainer).toBeInTheDocument();
    expect(rtlContainer).toHaveClass('font-cairo');

    // Language button toggles label to EN
    expect(screen.getByText('EN')).toBeInTheDocument();

    // Navigation items update to Arabic
    expect(screen.getByRole('button', { name: TRANSLATIONS.ar.nav_home })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: TRANSLATIONS.ar.nav_listings })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: TRANSLATIONS.ar.nav_trust })).toBeInTheDocument();
  });

  it('switches back from Arabic to English when clicking EN button', async () => {
    vi.useFakeTimers();
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    vi.useRealTimers();

    // First toggle to Arabic
    fireEvent.click(screen.getByText('AR'));
    expect(document.querySelector('[dir="rtl"]')).toBeInTheDocument();

    // Second toggle back to English
    fireEvent.click(screen.getByText('EN'));
    expect(document.querySelector('[dir="ltr"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: TRANSLATIONS.en.nav_home })).toBeInTheDocument();
  });

  it('translates AboutPage and TermsPage components faithfully in Arabic mode', () => {
    const handleCta = vi.fn();
    
    // Test AboutPage in Arabic
    const { unmount: unmountAbout } = render(
      <AboutPage onCta={handleCta} t={TRANSLATIONS.ar} isRtl={true} />
    );
    expect(screen.getByText(TRANSLATIONS.ar.about_vision_title)).toBeInTheDocument();
    expect(screen.getByText(TRANSLATIONS.ar.about_mission_title)).toBeInTheDocument();
    expect(screen.getByText(TRANSLATIONS.ar.about_why_title)).toBeInTheDocument();
    unmountAbout();

    // Test TermsPage in Arabic
    const { unmount: unmountTerms } = render(
      <TermsPage t={TRANSLATIONS.ar} isRtl={true} />
    );
    expect(screen.getByText(TRANSLATIONS.ar.terms_title)).toBeInTheDocument();
    expect(screen.getByText(TRANSLATIONS.ar.terms_sec_1_title)).toBeInTheDocument();
    unmountTerms();
  });

  it('maintains language selection across page navigation', async () => {
    vi.useFakeTimers();
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    vi.useRealTimers();

    // Switch to Arabic
    fireEvent.click(screen.getByText('AR'));
    
    // Navigate to Legal page in Arabic
    const legalNavBtn = screen.getByRole('button', { name: TRANSLATIONS.ar.nav_trust });
    fireEvent.click(legalNavBtn);

    // Verify Arabic content on Legal page
    expect(screen.getByText(TRANSLATIONS.ar.legal_title)).toBeInTheDocument();
    expect(document.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});
