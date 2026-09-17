'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * DESIGN.md §3. Theme is stored in localStorage under `hirs-theme` and applied
 * to <html data-theme> by a blocking inline script so there is no flash.
 * Default falls back to prefers-color-scheme.
 *
 * The `data-theme` attribute is the single source of truth — not React state.
 * The inline script sets it before hydration, so mirroring it into useState
 * would mean a render pass spent catching up. `useSyncExternalStore` reads the
 * attribute directly instead, which is what it exists for.
 *
 * Dark mode is a token swap — nothing here belongs in a component.
 */

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'hirs-theme';

/**
 * Runs before first paint, so the correct theme is on <html> by the time any
 * pixels land. Kept in sync with the helpers below by hand — it cannot import
 * anything, and it must stay small.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}})()`;

const listeners = new Set<() => void>();

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme, persist: boolean): void {
  document.documentElement.setAttribute('data-theme', theme);
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private mode or blocked storage: the theme still applies for this page.
    }
  }
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);

  // Follow the OS only while the user has made no explicit choice.
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onMediaChange = () => {
    if (readStoredTheme()) return;
    applyTheme(systemTheme(), false);
  };
  media.addEventListener('change', onMediaChange);

  return () => {
    listeners.delete(onChange);
    media.removeEventListener('change', onMediaChange);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/** The server cannot know the viewer's theme; the inline script corrects it. */
function getServerSnapshot(): Theme {
  return 'light';
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => applyTheme(next, true), []);

  const toggleTheme = useCallback(() => {
    applyTheme(getSnapshot() === 'dark' ? 'light' : 'dark', true);
  }, []);

  return { theme, setTheme, toggleTheme };
}
