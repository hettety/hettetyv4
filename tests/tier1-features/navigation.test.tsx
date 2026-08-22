import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import App from '../../src/App';
import AboutPage from '../../src/components/AboutPage';
import TermsPage from '../../src/components/TermsPage';
import PrivacyPage from '../../src/components/PrivacyPage';
import CookiePolicyPage from '../../src/components/CookiePolicyPage';
import { BuyPropertyPage, VerificationPage, Tours3DPage } from '../../src/components/ServicePages';
import { TRANSLATIONS } from '../../src/constants';

describe('Tier 1 — Navigation & View Switching', () => {
  beforeEach(() => {
    localStorage.setItem('hettety_consent', JSON.stringify({ necessary: true }));
    window.location.hash = '';
  });

  it('renders navigation links and switches view to Listings when clicked', () => {
    render(<App />);

    // Verify nav links exist
    const listingsNavBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_listings });
    expect(listingsNavBtns[0]).toBeInTheDocument();

    // Click Listings navigation
    fireEvent.click(listingsNavBtns[0]);

    // Verify hash changed and listings view elements are present
    expect(window.location.hash).toBe('#listings');
    expect(screen.getByPlaceholderText(TRANSLATIONS.en.prop_search)).toBeInTheDocument();
  });

  it('switches view to 3D Experience page when 3D Tours is clicked', () => {
    render(<App />);

    const toursNavBtns = screen.getAllByRole('button', { name: '3D Tours' });
    fireEvent.click(toursNavBtns[0]);

    expect(window.location.hash).toBe('#3d-experience');
    expect(screen.getByText(/Walk through the property before you visit/i)).toBeInTheDocument();
  });

  it('switches view to Legal Center and displays legal verification hub', () => {
    render(<App />);

    const legalNavBtns = screen.getAllByRole('button', { name: TRANSLATIONS.en.nav_trust });
    fireEvent.click(legalNavBtns[0]);

    expect(window.location.hash).toBe('#legal');
    expect(screen.getByText(TRANSLATIONS.en.legal_title)).toBeInTheDocument();
    expect(screen.getByText(/Securely manage your personal legal documents/i)).toBeInTheDocument();
  });

  it('switches view to Sahel Hettety coastal hub when 🌊 Sahel Hettety is clicked', () => {
    render(<App />);

    const sahelNavBtns = screen.getAllByRole('button', { name: /Sahel Hettety/i });
    fireEvent.click(sahelNavBtns[0]);

    expect(window.location.hash).toBe('#yalla-sahel');
    expect(screen.getByText('Sahel Hettety')).toBeInTheDocument();
    expect(screen.getByText(/North Coast chalets/i)).toBeInTheDocument();
  });

  it('navigates to About, Terms, Privacy, and Cookie Policy subpages', () => {
    const handleCta = vi.fn();
    
    // 1. About Page test
    const { unmount: unmountAbout } = render(
      <AboutPage onCta={handleCta} t={TRANSLATIONS.en} isRtl={false} />
    );
    expect(screen.getByText(TRANSLATIONS.en.about_mission_title)).toBeInTheDocument();
    expect(screen.getByText(TRANSLATIONS.en.about_vision_title)).toBeInTheDocument();
    const ctaBtn = screen.getByText(TRANSLATIONS.en.about_cta_btn);
    fireEvent.click(ctaBtn);
    expect(handleCta).toHaveBeenCalledTimes(1);
    unmountAbout();

    // 2. Terms Page test
    const { unmount: unmountTerms } = render(
      <TermsPage t={TRANSLATIONS.en} isRtl={false} />
    );
    expect(screen.getByText(TRANSLATIONS.en.terms_title)).toBeInTheDocument();
    expect(screen.getByText(TRANSLATIONS.en.terms_sec_1_title)).toBeInTheDocument();
    unmountTerms();

    // 3. Privacy Page test
    const { unmount: unmountPrivacy } = render(
      <PrivacyPage t={TRANSLATIONS.en} isRtl={false} />
    );
    expect(screen.getByText(TRANSLATIONS.en.nav_privacy)).toBeInTheDocument();
    unmountPrivacy();

    // 4. Cookie Policy Page test
    const { unmount: unmountCookie } = render(
      <CookiePolicyPage t={TRANSLATIONS.en} isRtl={false} />
    );
    expect(screen.getByText(TRANSLATIONS.en.nav_cookie)).toBeInTheDocument();
    unmountCookie();
  });

  it('navigates from Service Pages (Buy, Verification, Tours) triggering CTA callbacks', () => {
    const onBuyCta = vi.fn();
    const onVerifyCta = vi.fn();
    const onToursCta = vi.fn();

    // Buy Page
    const { unmount: unmountBuy } = render(
      <BuyPropertyPage onCta={onBuyCta} t={TRANSLATIONS.en} isRtl={false} />
    );
    expect(screen.getByText(TRANSLATIONS.en.buy_title)).toBeInTheDocument();
    fireEvent.click(screen.getByText(TRANSLATIONS.en.buy_cta));
    expect(onBuyCta).toHaveBeenCalled();
    unmountBuy();

    // Verification Page
    const { unmount: unmountVerify } = render(
      <VerificationPage onCta={onVerifyCta} t={TRANSLATIONS.en} isRtl={false} />
    );
    expect(screen.getByText(TRANSLATIONS.en.verify_title)).toBeInTheDocument();
    fireEvent.click(screen.getByText(TRANSLATIONS.en.verify_cta));
    expect(onVerifyCta).toHaveBeenCalled();
    unmountVerify();

    // Tours Page
    const { unmount: unmountTours } = render(
      <Tours3DPage onCta={onToursCta} t={TRANSLATIONS.en} isRtl={false} />
    );
    expect(screen.getByText(TRANSLATIONS.en.tours_title)).toBeInTheDocument();
    fireEvent.click(screen.getByText(TRANSLATIONS.en.tours_cta));
    expect(onToursCta).toHaveBeenCalled();
    unmountTours();
  });
});
