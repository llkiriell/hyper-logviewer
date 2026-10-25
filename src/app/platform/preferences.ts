import { useSyncExternalStore } from 'react';
import type { CustomHighlightRule, LevelColorConfig, LogLevel } from '../../core/types.ts';
import type { SupportedLocale } from '../i18n/types.ts';

export type ThemePreference = 'system' | 'light' | 'dark';
export type AccentColor = 'ember' | 'ocean' | 'aqua' | 'violet';

export const DEFAULT_LEVEL_COLORS: Record<LogLevel, LevelColorConfig> = {
  fatal: { textColor: '#b3261e', bgColor: 'rgba(179, 38, 30, 0.12)' },
  error: { textColor: '#b3261e', bgColor: 'rgba(179, 38, 30, 0.08)' },
  warn: { textColor: '#d6a028', bgColor: 'rgba(214, 160, 40, 0.12)' },
  info: { textColor: '#1976d2', bgColor: 'rgba(25, 118, 210, 0.08)' },
  debug: { textColor: '#8c8c91', bgColor: 'transparent' },
  trace: { textColor: '#7b1fa2', bgColor: 'rgba(123, 31, 162, 0.06)' },
  unknown: { textColor: 'inherit', bgColor: 'transparent' },
};

export interface Preferences {
  theme: ThemePreference;
  accent: AccentColor;
  locale: SupportedLocale;
  fontSize: number;
  wordWrap: boolean;
  fontFamily: string;
  showLineSeparator: boolean;
  lineSeparatorColor: string;
  levelColors: Record<LogLevel, LevelColorConfig>;
  customHighlights: CustomHighlightRule[];
}

const STORAGE_KEY = 'hyper-logviewer.preferences';

const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  accent: 'ember',
  locale: 'en',
  fontSize: 13,
  wordWrap: false,
  fontFamily: 'JetBrains Mono, Consolas, monospace',
  showLineSeparator: false,
  lineSeparatorColor: '#e5e5e3',
  levelColors: DEFAULT_LEVEL_COLORS,
  customHighlights: [],
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
      showLineSeparator: typeof parsed.showLineSeparator === 'boolean' ? parsed.showLineSeparator : DEFAULT_PREFERENCES.showLineSeparator,
      lineSeparatorColor: parsed.lineSeparatorColor ?? DEFAULT_PREFERENCES.lineSeparatorColor,
      levelColors: { ...DEFAULT_LEVEL_COLORS, ...(parsed.levelColors ?? {}) },
      customHighlights: Array.isArray(parsed.customHighlights) ? parsed.customHighlights : DEFAULT_PREFERENCES.customHighlights,
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
