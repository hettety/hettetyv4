import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';
import * as firebase from '../../src/firebase';
import { UserDocument } from '../../src/types';

const UID = 'owner-uid-1';

/**
 * Sign a user in against the mocked firebase module. The Legal Center reads
 * auth.currentUser directly; driving onAuthStateChanged instead would make App
 * gate its whole tree on an async isAuthReady flag that never settles in a
 * synchronous render.
 */
const signIn = () => {
  (firebase.auth as any).currentUser = { uid: UID, email: 'owner@example.test' };
};

/** Feed the Legal Center a fixed set of documents through its onSnapshot listener. */
const withDocs = (docs: Partial<UserDocument>[]) => {
  vi.spyOn(firebase, 'onSnapshot').mockImplementation(((_q: any, cb: any) => {
    cb({ docs: docs.map((d, i) => ({ id: d.id || `doc-${i}`, data: () => d })) });
    return vi.fn();
  }) as any);
};

// Deep-link rather than clicking through the nav: the nav's shape isn't what
// these tests are about.
const openLegalCenter = () => { window.location.hash = '#legal'; };

describe('Tier 1 — Document review (no self-asserted verification)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('hettety_consent', JSON.stringify({ necessary: true }));
    window.location.hash = '#legal';
    signIn();
    withDocs([]);
  });

  afterEach(() => {
    (firebase.auth as any).currentUser = null;
  });

  it('never claims a freshly uploaded document is verified', async () => {
    const addDoc = vi.spyOn(firebase, 'addDoc').mockResolvedValue({ id: 'new-doc' } as any);
    vi.spyOn(firebase, 'uploadBytes').mockResolvedValue({ ref: {} } as any);
    vi.spyOn(firebase, 'getDownloadURL').mockResolvedValue('https://storage.test/deed.pdf');

    openLegalCenter();
    render(<App />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['%PDF-1.4'], 'deed.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(addDoc).toHaveBeenCalled());
    const payload = addDoc.mock.calls[0][1] as unknown as Record<string, unknown>;

    expect(payload.reviewStatus).toBe('Uploaded');
    // The old code stamped these on upload with nothing having looked at the file.
    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('accessStatus');
    expect(payload.ownerUid).toBe(UID);
  });

  it('says "Uploading", not "Analyzing" — nothing analyses the file', () => {
    openLegalCenter();
    render(<App />);

    expect(screen.queryByText('Analyzing...')).toBeNull();
    expect(screen.queryByText('جاري التحليل...')).toBeNull();
  });

  it('shows an unreviewed document as unreviewed, and offers View and Delete', () => {
    withDocs([{ id: 'd1', name: 'deed.pdf', type: 'PDF', uploadDate: '2026-01-01', ownerUid: UID, content: 'https://storage.test/d.pdf', reviewStatus: 'Uploaded' }]);
    openLegalCenter();
    render(<App />);

    expect(screen.getByText('Not reviewed yet')).toBeInTheDocument();
    // These used to be gated on accessStatus === 'Granted', a field nothing writes now.
    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('lets the owner put a legacy document into the review queue', async () => {
    const updateDoc = vi.spyOn(firebase, 'updateDoc').mockResolvedValue(undefined as any);
    // No reviewStatus: the admin queue query (where reviewStatus in [...]) cannot
    // see this document, so without an owner action it is stuck forever.
    withDocs([{ id: 'legacy', name: 'old.pdf', type: 'PDF', uploadDate: '2025-01-01', ownerUid: UID, content: 'https://storage.test/o.pdf', status: 'Verified' }]);
    openLegalCenter();
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Request review' }));
    await waitFor(() => expect(updateDoc).toHaveBeenCalled());
    expect(updateDoc.mock.calls[0][1]).toEqual({ reviewStatus: 'Uploaded' });
  });

  it('offers no review request for a document already in a state', () => {
    withDocs([{ id: 'd3', name: 'x.pdf', type: 'PDF', uploadDate: '2026-03-03', ownerUid: UID, content: 'x', reviewStatus: 'Uploaded' }]);
    openLegalCenter();
    render(<App />);

    expect(screen.queryByRole('button', { name: 'Request review' })).toBeNull();
  });

  it('still deletes a document whose file is already gone from Storage', async () => {
    const gone = Object.assign(new Error('not found'), { code: 'storage/object-not-found' });
    vi.spyOn(firebase, 'deleteObject').mockRejectedValue(gone);
    const deleteDoc = vi.spyOn(firebase, 'deleteDoc').mockResolvedValue(undefined as any);
    withDocs([{ id: 'orphan', name: 'gone.pdf', type: 'PDF', uploadDate: '2026-01-01', ownerUid: UID, content: 'x', storagePath: 'user_documents/o/gone.pdf', reviewStatus: 'Uploaded' }]);
    openLegalCenter();
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    // The row would otherwise be undeletable, because deleteObject throws.
    await waitFor(() => expect(deleteDoc).toHaveBeenCalled());
  });

  it('treats a legacy self-asserted status:"Verified" document as unreviewed', () => {
    withDocs([{ id: 'legacy', name: 'old.pdf', type: 'PDF', uploadDate: '2025-01-01', ownerUid: UID, content: 'https://storage.test/o.pdf', status: 'Verified' }]);
    openLegalCenter();
    render(<App />);

    expect(screen.getByText('Not reviewed yet')).toBeInTheDocument();
    expect(screen.queryByText('Reviewed by HETTETY')).toBeNull();
  });

  it('attaches the الشهر العقاري caveat to a document a reviewer has read', () => {
    withDocs([{ id: 'd2', name: 'contract.pdf', type: 'PDF', uploadDate: '2026-02-02', ownerUid: UID, content: 'https://storage.test/c.pdf', reviewStatus: 'Checked', reviewedBy: 'admin@hettety.test', reviewNote: 'Names match the ID.' }]);
    openLegalCenter();
    render(<App />);

    expect(screen.getByText('Reviewed by HETTETY')).toBeInTheDocument();
    expect(screen.getByText(/not proof that the document is genuine/i)).toBeInTheDocument();
    expect(screen.getByText(/الشهر العقاري/)).toBeInTheDocument();
    expect(screen.getByText('Names match the ID.')).toBeInTheDocument();
  });

  it('counts documents by real state instead of showing four green ticks', () => {
    withDocs([
      { id: 'a', name: 'a.pdf', type: 'PDF', uploadDate: '2026-01-01', ownerUid: UID, content: 'x', reviewStatus: 'Uploaded' },
      { id: 'b', name: 'b.pdf', type: 'PDF', uploadDate: '2026-01-02', ownerUid: UID, content: 'x', reviewStatus: 'NeedsAttention', reviewNote: 'Page 2 is unreadable.' },
      { id: 'c', name: 'c.pdf', type: 'PDF', uploadDate: '2026-01-03', ownerUid: UID, content: 'x', reviewStatus: 'Checked' },
    ]);
    openLegalCenter();
    render(<App />);

    const row = (label: string) => screen.getByText(label).parentElement?.textContent;
    expect(row('Not reviewed')).toContain('1');
    expect(row('Under review')).toContain('0');
    expect(row('Needs attention')).toContain('1');
    expect(row('Reviewed')).toContain('1');

    expect(screen.getByText('Needs your attention')).toBeInTheDocument();
    expect(screen.getByText('Page 2 is unreadable.')).toBeInTheDocument();
  });

  it('does not tell the user the files are beyond HETTETY\'s reach', () => {
    openLegalCenter();
    render(<App />);

    expect(screen.queryByText(/No other users can see your documents/i)).toBeNull();
    expect(screen.queryByText(/Only you and a HETTETY reviewer can open them/i)).toBeNull();
    // The stored URL is a bearer token that never expires — say so.
    expect(screen.getByText(/HETTETY staff can open them/i)).toBeInTheDocument();
    expect(screen.getByText(/anyone who obtains a file's direct link can too/i)).toBeInTheDocument();
  });
});
