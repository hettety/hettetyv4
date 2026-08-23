import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TRANSLATIONS } from '../../src/constants';

const src = (rel: string) => readFileSync(resolve(__dirname, '../../src', rel), 'utf-8');

describe('Tier 5 — Copy the product can actually back up', () => {
  it('keeps every string in both languages', () => {
    // A key present in one language renders blank in the other. RTL work is where
    // this slips in, because the two objects are 200 lines apart.
    const en = Object.keys(TRANSLATIONS.en).sort();
    const ar = Object.keys(TRANSLATIONS.ar).sort();
    expect(en.filter(k => !ar.includes(k))).toEqual([]);
    expect(ar.filter(k => !en.includes(k))).toEqual([]);
  });

  it('does not claim properties are physically verified — nothing models a site visit', () => {
    const text = src('constants.ts');
    expect(text).not.toContain('Every property is physically verified');
    expect(text).not.toContain('يتم التحقق من كل عقار فعلياً');
  });

  it('does not claim AI verifies listings — no AI reads a listing\'s documents', () => {
    const text = src('constants.ts');
    expect(text).not.toContain('AI Verified Listings');
    expect(text).not.toContain('عقارات موثقة بالذكاء الاصطناعي');
  });

  it('does not promise a legal report that guarantees rights or prevents fraud', () => {
    const text = src('constants.ts');
    // "يضمن حقك ويحميك من الاحتيال" — a guarantee the platform has no way to make.
    expect(text).not.toContain('يضمن حقك');
    expect(text).not.toContain('يحميك من الاحتيال');
  });

  it('never labels a listing "Verified Legal"', () => {
    const text = src('App.tsx');
    expect(text).not.toContain('Verified Legal');
    expect(text).not.toContain('أصلي + ثقة وقانون');
  });

  it('does not badge a signed-in account as verified', () => {
    expect(src('App.tsx')).not.toContain('Verified Account');
  });

  it('attaches the الشهر العقاري caveat to both review claims', () => {
    // The caveat is what keeps "reviewed" from being read as "genuine".
    expect(TRANSLATIONS.ar.doc_status_checked_desc).toContain('الشهر العقاري');
    expect(TRANSLATIONS.en.doc_status_checked_desc).toContain('Real Estate Publicity Department');
    expect(TRANSLATIONS.ar.listing_review_note).toContain('الشهر العقاري');
    expect(TRANSLATIONS.en.listing_review_note).toContain('Real Estate Publicity Department');
  });

  it('does not claim a verified catalogue anywhere in the hero or the feature grid', () => {
    // The badge was rewritten once; the sentence under it and the heading beside
    // it kept the claim, which is how a "fixed" page still reads as verified.
    for (const lang of ['en', 'ar'] as const) {
      const t = TRANSLATIONS[lang] as Record<string, string>;
      for (const key of ['hero_desc', 'hero_subtitle', 'feat_1_title', 'feat_1_desc', 'about_feat_2', 'buy_desc', 'hero_verified_badge']) {
        expect(t[key]).not.toMatch(/verified|موثق/i);
      }
    }
  });

  it('does not promise there are no scams, or that reviews come from real guests', () => {
    // Nothing detects a scam, reverse-searches a photo, or ties a review to a stay.
    const text = src('App.tsx');
    expect(text).not.toContain('No scams');
    expect(text).not.toContain('لا نصب');
    expect(text).not.toContain('Ratings from real guests');
    expect(text).not.toContain('سكنت فعلاً');
    expect(text).not.toContain('CERTIFIED DATA');
    expect(text).not.toContain('بيانات معتمدة');
  });

  it('does not say the verification service checks violations or dues', () => {
    // No code queries any municipality, authority or registry.
    for (const lang of ['en', 'ar'] as const) {
      const t = TRANSLATIONS[lang] as Record<string, string>;
      expect(t.verify_feat_2_desc).not.toMatch(/Check for building violations|التحقق من عدم وجود مخالفات/);
    }
  });

  it('keeps the two languages making the same promises', () => {
    // The Arabic buy_desc used to add a best-price guarantee the English did not.
    expect(TRANSLATIONS.ar.buy_desc).not.toContain('ضمان أفضل سعر');
    expect(TRANSLATIONS.ar.about_mission_desc).not.toContain('توثيق موثوق');
  });

  it('has no mock that fabricates a verification verdict', () => {
    const text = src('mockApi.ts');
    expect(text).not.toContain('uploadDocument');
    expect(text).not.toContain('isValid');
  });
});
