import { useSyncExternalStore } from 'react';
import type { SupportedLocale } from '../i18n/types.ts';

export type ThemePreference = 'system' | 'light' | 'dark';
export type AccentColor = 'ember' | 'ocean' | 'aqua' | 'violet';

export interface Preferences {
  theme: ThemePreference;
  accent: AccentColor;
  locale: SupportedLocale;
  fontSize: number;
  wordWrap: boolean;
  fontFamily: string;
}

const STORAGE_KEY = 'hyper-logviewer.preferences';

const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  accent: 'ember',
  locale: 'en',
  fontSize: 13,
  wordWrap: false,
  fontFamily: 'JetBrains Mono, Consolas, monospace',
};

const listeners = new Set<() => void>();

function load(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      theme: parsed.theme ?? DEFAULT_PREFERENCES.theme,
      accent: parsed.accent ?? DEFAULT_PREFERENCES.accent,
      locale: parsed.locale ?? DEFAULT_PREFERENCES.locale,
      fontSize: typeof parsed.fontSize === 'number' ? parsed.fontSize : DEFAULT_PREFERENCES.fontSize,
      wordWrap: typeof parsed.wordWrap === 'boolean' ? parsed.wordWrap : DEFAULT_PREFERENCES.wordWrap,
      fontFamily: parsed.fontFamily ?? DEFAULT_PREFERENCES.fontFamily,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

let currentPreferences: Preferences = load();

export function getPreferences(): Preferences {
  return currentPreferences;
}

export function setPreferences(patch: Partial<Preferences>): void {
  currentPreferences = { ...currentPreferences, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPreferences));
  } catch {
    // ignore quota errors
  }
  listeners.forEach((listener) => listener());
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    () => currentPreferences,
  );
}

export function resolvedTheme(theme: ThemePreference): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
}
