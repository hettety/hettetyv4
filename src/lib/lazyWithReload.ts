import React from 'react';

const PREFIX = 'hettety_chunk_reload_';

/**
 * A deploy replaces every hashed chunk. A page that was already open was built
 * against the old names, so the first dynamic import after a deploy asks for a
 * file that no longer exists — and the feature dies behind its spinner with
 * nothing on screen to say why.
 *
 * One reload picks up the new manifest. The session flag makes that one reload
 * rather than a loop: if the chunk is still missing after reloading, the error
 * is real and belongs to the boundary above.
 */
export function lazyWithReload<T extends React.ComponentType<any>>(
  load: () => Promise<{ default: T }>,
  key: string,
): React.LazyExoticComponent<T> {
  return React.lazy(() => attempt(load, PREFIX + key));
}

/** Exported for the tests: the same logic without React.lazy's caching. */
export async function attempt<T>(
  load: () => Promise<T>,
  flag: string,
  reload: () => void = () => window.location.reload(),
): Promise<T> {
  try {
    const mod = await load();
    try { sessionStorage.removeItem(flag); } catch { /* storage unavailable */ }
    return mod;
  } catch (err) {
    // Default to "already tried" so a browser that denies us storage reports the
    // failure instead of reloading forever.
    let alreadyTried = true;
    try {
      alreadyTried = sessionStorage.getItem(flag) === '1';
      if (!alreadyTried) sessionStorage.setItem(flag, '1');
    } catch { /* storage unavailable */ }

    if (alreadyTried) throw err;

    reload();
    // The reload is on its way. Never settling keeps the spinner up until the
    // new document replaces this one; resolving would flash an empty viewer.
    return new Promise<T>(() => {});
  }
}
