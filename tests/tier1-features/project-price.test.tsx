import { describe, it, expect } from 'vitest';
import { priceLabel, priceProvenance } from '../../src/App';
import { Property } from '../../src/types';

const unit = (over: Partial<Property> = {}): Property => ({
  id: 'p1',
  title: 'TALALA — Type T-41C',
  price: 0,
  location: 'New Heliopolis',
  bedrooms: 2,
  bathrooms: 2,
  area: 115,
  propertyType: 'Apartment',
  compound: 'TALALA',
  status: 'For Sale',
  isVerified: false,
  verificationStatus: 'Pending',
  imageUrl: 'x',
  ...over,
});

describe('Tier 1 — a listing with no price of its own', () => {
  it('says what the project starts at rather than nothing', () => {
    const p = unit({ projectPriceFrom: 4_500_000 });
    expect(priceLabel(p, false)).toBe('Project from 4,500,000 EGP');
    expect(priceLabel(p, true)).toBe('المشروع يبدأ من 4,500,000 EGP');
  });

  it('still says price on request when we know nothing', () => {
    expect(priceLabel(unit(), false)).toBe('Price on request');
    expect(priceLabel(unit(), true)).toBe('السعر عند الطلب');
  });

  it('never lets a project figure stand in for a real unit price', () => {
    // A unit that has its own price must show that, whatever the project says.
    const p = unit({ price: 12_000_000, projectPriceFrom: 4_500_000 });
    expect(priceLabel(p, false)).toBe('12,000,000 EGP');
    expect(priceLabel(p, false)).not.toContain('4,500,000');
  });

  it('honours the currency it was quoted in', () => {
    expect(priceLabel(unit({ projectPriceFrom: 250_000, currency: 'USD' }), false))
      .toBe('Project from 250,000 USD');
  });
});

describe('Tier 1 — the figure carries its source', () => {
  const sourced = unit({
    projectPriceFrom: 4_500_000,
    priceSource: 'قائمة أسعار منشورة',
    priceAsOf: '2026-08-23',
  });

  it('names the source and the date next to the number', () => {
    const en = priceProvenance(sourced, false)!;
    expect(en).toContain('قائمة أسعار منشورة');
    expect(en).toContain('2026-08-23');
  });

  it('says plainly that it is not this unit’s price', () => {
    expect(priceProvenance(sourced, false)).toMatch(/not this unit/i);
    expect(priceProvenance(sourced, true)).toContain('مش سعر الوحدة دي');
  });

  it('stays silent when the unit has its own price', () => {
    expect(priceProvenance({ ...sourced, price: 9_000_000 }, false)).toBeNull();
  });

  it('stays silent rather than show a figure it cannot attribute', () => {
    // An unsourced number on a page that sells itself on verification is worse
    // than no number.
    expect(priceProvenance(unit({ projectPriceFrom: 4_500_000 }), false)).toBeNull();
  });

  it('copes with a source that has no date', () => {
    const p = unit({ projectPriceFrom: 4_500_000, priceSource: 'المطوّر' });
    expect(priceProvenance(p, false)).toContain('المطوّر');
    expect(priceProvenance(p, false)).not.toContain('—');
  });
});
