/**
 * Firebase Cloud Function: email a subscriber when a NEW property matching their
 * saved-search alert is published. Requires the Blaze plan (Cloud Functions) and
 * an SMTP provider (Gmail app password, SendGrid, Mailgun, …).
 *
 * Deploy:
 *   1) cd functions && npm install
 *   2) Set secrets (or use environment config):
 *        firebase functions:secrets:set SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS SMTP_FROM
 *   3) firebase deploy --only functions
 */
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');

initializeApp();
// The app uses a NAMED Firestore database — must match firebase-applet-config.json.
const db = getFirestore('ai-studio-7dc9cb2d-ccba-48fa-8d31-f2b7a4759743');

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

/** Does a new property match a saved-search subscription? */
function matches(sub, p) {
  const q = (sub.q || '').toLowerCase();
  if (q) {
    const hay = `${p.title || ''} ${p.location || ''} ${p.compound || ''} ${p.developer || ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (sub.minPrice != null && Number(p.price) < Number(sub.minPrice)) return false;
  if (sub.maxPrice != null && Number(p.price) > Number(sub.maxPrice)) return false;
  if (sub.typeFilter && sub.typeFilter !== 'all' && p.propertyType !== sub.typeFilter) return false;
  return true;
}

/** Escape user text before putting it in email HTML / headers. */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const oneLine = (s) => String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').slice(0, 150);

exports.newListingAlerts = onDocumentCreated(
  { document: 'properties/{id}', database: 'ai-studio-7dc9cb2d-ccba-48fa-8d31-f2b7a4759743' },
  async (event) => {
    const p = event.data && event.data.data();
    if (!p) return;
    // Never alert about unverified / unmoderated listings.
    if (!p.isVerified || p.verificationStatus !== 'Verified') return;

    const subsSnap = await db.collection('alertSubscriptions').get();
    const mail = transporter();
    const jobs = [];

    subsSnap.forEach((doc) => {
      const sub = doc.data();
      if (!sub.email || !matches(sub, p)) return;
      const price = `${Number(p.price).toLocaleString()} ${esc(p.currency || 'EGP')}`;
      jobs.push(
        mail.sendMail({
          from: process.env.SMTP_FROM || 'HETTETY <no-reply@hettety.com>',
          to: sub.email,
          subject: `عقار جديد مطابق لبحثك: ${oneLine(p.title)}`,
          html: `
            <div style="font-family:sans-serif">
              <h2>${esc(p.title)}</h2>
              <p>${esc(p.location || '')}${p.compound ? ' — ' + esc(p.compound) : ''}</p>
              <p><strong>${price}</strong> · ${Number(p.bedrooms) || 0} beds · ${esc(p.area || '')} m²</p>
              <p>${esc(String(p.description || '').slice(0, 600))}</p>
              <a href="https://hettetyv4.vercel.app" style="background:#1b2c4d;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">شوف العقار</a>
            </div>`,
        }).catch((e) => console.error('mail failed for', sub.email, e))
      );
    });

    await Promise.all(jobs);
    console.log(`newListingAlerts: processed ${jobs.length} matching subscribers for "${oneLine(p.title)}".`);
  }
);
