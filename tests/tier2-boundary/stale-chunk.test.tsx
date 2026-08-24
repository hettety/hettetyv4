import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { attempt } from '../../src/lib/lazyWithReload';
import { LoadErrorBoundary } from '../../src/components/LoadErrorBoundary';
import cfg from '../../vercel.json';

const chunkError = () =>
  new TypeError('Failed to fetch dynamically imported module: /assets/Property3DViewer-ChvvJEOd.js');

describe('Tier 2 — a deploy must not kill the page someone already has open', () => {
  beforeEach(() => sessionStorage.clear());

  it('reloads once when the chunk this page was built against is gone', async () => {
    const reload = vi.fn();
    const load = vi.fn().mockRejectedValue(chunkError());

    let settled = false;
    attempt(load, 'flag', reload).then(() => { settled = true; }, () => { settled = true; });
    await new Promise(r => setTimeout(r, 20));

    expect(reload).toHaveBeenCalledTimes(1);
    // Settling would swap the spinner for an empty viewer a moment before the
    // new document arrives.
    expect(settled).toBe(false);
  });

  it('surfaces the error instead of reloading a second time', async () => {
    const reload = vi.fn();
    const load = vi.fn().mockRejectedValue(chunkError());

    attempt(load, 'flag', reload);
    await new Promise(r => setTimeout(r, 20));
    expect(reload).toHaveBeenCalledTimes(1);

    // Second attempt in the same session: the reload already happened and did
    // not help, so looping would trap the reader in a refresh cycle.
    await expect(attempt(load, 'flag', reload)).rejects.toThrow(/dynamically imported/);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('clears the flag once the chunk loads, so a later deploy still gets its reload', async () => {
    const reload = vi.fn();
    // Not awaited: the first attempt deliberately never settles, because the
    // reload it just asked for is what ends the wait.
    attempt(() => Promise.reject(chunkError()), 'flag', reload);
    await new Promise(r => setTimeout(r, 20));
    expect(sessionStorage.getItem('flag')).toBe('1');

    await attempt(async () => 'the module', 'flag', reload);
    expect(sessionStorage.getItem('flag')).toBeNull();
  });

  it('reports the failure rather than reloading when storage is denied', async () => {
    const reload = vi.fn();
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    try {
      await expect(attempt(() => Promise.reject(chunkError()), 'flag', reload)).rejects.toThrow();
      expect(reload).not.toHaveBeenCalled();
    } finally {
      get.mockRestore();
    }
  });
});

describe('Tier 2 — a failed view says so instead of spinning forever', () => {
  const Boom = () => { throw chunkError(); };

  it('offers a refresh when the view cannot start', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(
        <LoadErrorBoundary onClose={() => {}} isRtl={false}>
          <Boom />
        </LoadErrorBoundary>
      );
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('The viewer could not start')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Refresh the page/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Close/ })).toBeInTheDocument();
    } finally {
      err.mockRestore();
    }
  });

  it('says it in Arabic too', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(
        <LoadErrorBoundary onClose={() => {}} isRtl={true}>
          <Boom />
        </LoadErrorBoundary>
      );
      expect(screen.getByRole('alertdialog')).toHaveAttribute('dir', 'rtl');
      expect(screen.getByText('تعذّر فتح العارض')).toBeInTheDocument();
    } finally {
      err.mockRestore();
    }
  });

  it('lets the children through when nothing is wrong', () => {
    render(
      <LoadErrorBoundary onClose={() => {}} isRtl={false}>
        <p>the viewer</p>
      </LoadErrorBoundary>
    );
    expect(screen.getByText('the viewer')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});

describe('Tier 2 — the host must let a missing asset be missing', () => {
  const source = cfg.rewrites[0].source;
  const matches = (path: string) => new RegExp('^' + source.replace(/^\//, '\\/') + '$').test(path);

  it('does not answer a vanished chunk with the index page', () => {
    // Returning index.html with a 200 is what made this silent: the browser got
    // HTML where it asked for a module, and no cache treated it as an error.
    expect(matches('/assets/Property3DViewer-ChvvJEOd.js')).toBe(false);
    expect(matches('/assets/index-DmIRJqaE.js')).toBe(false);
    expect(matches('/assets/logo-abc123.svg')).toBe(false);
  });

  it('still hands real routes to the single page app', () => {
    expect(matches('/property/6pb3Kjkx3vtsbIbOoeC1')).toBe(true);
    expect(matches('/listings')).toBe(true);
    expect(matches('/')).toBe(true);
  });

  it('still keeps the serverless functions to themselves', () => {
    expect(matches('/api/ai')).toBe(false);
  });
});
