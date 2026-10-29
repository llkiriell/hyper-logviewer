import { useSyncExternalStore } from 'react';
import type {
  CustomHighlightRule,
  CustomLogEntityPattern,
  CustomStandardLevel,
  JsonTheme,
  LevelColorConfig,
  LogLevel,
} from '../../core/types.ts';
import type { SupportedLocale } from '../i18n/types.ts';

export type ThemePreference = 'system' | 'light' | 'dark';
export type AccentColor = 'ember' | 'ocean' | 'aqua' | 'violet';
export type FocusBackgroundMode = 'transparent' | 'severity' | 'custom';
export type ActiveLineIconType =
  | 'hand'
  | 'arrow'
  | 'chevron'
  | 'caret'
  | 'chevrons'
  | 'target'
  | 'dot'
  | 'bookmark'
  | 'star';

export interface RecentFileItem {
  filePath: string;
  fileName: string;
  lastOpened: number;
  size?: number;
}

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
  lineSeparatorWidth: number;
  levelColors: Record<LogLevel, LevelColorConfig>;
  colorizeInlineSeverity: boolean;
  customHighlights: CustomHighlightRule[];
  customStandardLevels: CustomStandardLevel[];
  customEntityPatterns: CustomLogEntityPattern[];
  // JSON viewer theme
  jsonTheme: JsonTheme;
  // Search bar placement
  bottomSearchBar: boolean;
  // Auto-scroll configuration
  autoScrollDefault: boolean;
  autoScrollSmooth: boolean;
  autoScrollPauseOnManualScroll: boolean;
  autoScrollMode: 'continuous' | 'tail';
  autoScrollSpeed: 'slow' | 'medium' | 'fast';
  // Watched Folders & Sidebar configuration
  sidebarEnabled: boolean;
  sidebarCollapsed: boolean;
  watchedFolders: string[];
  // Rainbow Brackets & Active Line Highlight
  rainbowBrackets: boolean;
  highlightActiveLine: boolean;
  activeLineColor: string;
  activeLineIcon: ActiveLineIconType;
  focusBackgroundMode: FocusBackgroundMode;
  customFocusBackgroundColor: string;
  // Git & Pipeline Highlights (branches, merges, conflicts)
  highlightGitPipeline: boolean;
  // Log parsing filters
  showSeverityBackground: boolean;
  // Recent files
  recentFiles: RecentFileItem[];
}

const STORAGE_KEY = 'hyper-logviewer.preferences';

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  accent: 'ember',
  locale: 'en',
  fontSize: 13,
  wordWrap: true,
  fontFamily: 'JetBrains Mono, Consolas, monospace',
  showLineSeparator: false,
  lineSeparatorColor: '#c4c4c2',
  lineSeparatorWidth: 0.10,
  levelColors: DEFAULT_LEVEL_COLORS,
  colorizeInlineSeverity: true,
  customHighlights: [],
  customStandardLevels: [],
  customEntityPatterns: [],
  jsonTheme: 'postman',
  bottomSearchBar: false,
  autoScrollDefault: false,
  autoScrollSmooth: false,
  autoScrollPauseOnManualScroll: true,
  autoScrollMode: 'continuous',
  autoScrollSpeed: 'medium',
  sidebarEnabled: false,
  sidebarCollapsed: false,
  watchedFolders: [],
  rainbowBrackets: true,
  highlightActiveLine: true,
  activeLineColor: '#0ea5e9',
  activeLineIcon: 'hand',
  focusBackgroundMode: 'transparent',
  customFocusBackgroundColor: 'rgba(14, 165, 233, 0.15)',
  highlightGitPipeline: true,
  showSeverityBackground: true,
  recentFiles: [],
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
      lineSeparatorWidth: typeof parsed.lineSeparatorWidth === 'number' && parsed.lineSeparatorWidth >= 0.10 ? parsed.lineSeparatorWidth : DEFAULT_PREFERENCES.lineSeparatorWidth,
      levelColors: { ...DEFAULT_LEVEL_COLORS, ...(parsed.levelColors ?? {}) },
      colorizeInlineSeverity: typeof parsed.colorizeInlineSeverity === 'boolean' ? parsed.colorizeInlineSeverity : DEFAULT_PREFERENCES.colorizeInlineSeverity,
      customHighlights: Array.isArray(parsed.customHighlights) ? parsed.customHighlights : DEFAULT_PREFERENCES.customHighlights,
      customStandardLevels: Array.isArray(parsed.customStandardLevels) ? parsed.customStandardLevels : DEFAULT_PREFERENCES.customStandardLevels,
      customEntityPatterns: Array.isArray(parsed.customEntityPatterns) ? parsed.customEntityPatterns : DEFAULT_PREFERENCES.customEntityPatterns,
      jsonTheme: parsed.jsonTheme === 'insomnia' ? 'insomnia' : 'postman',
      bottomSearchBar: typeof parsed.bottomSearchBar === 'boolean' ? parsed.bottomSearchBar : DEFAULT_PREFERENCES.bottomSearchBar,
      autoScrollDefault: typeof parsed.autoScrollDefault === 'boolean' ? parsed.autoScrollDefault : DEFAULT_PREFERENCES.autoScrollDefault,
      autoScrollSmooth: typeof parsed.autoScrollSmooth === 'boolean' ? parsed.autoScrollSmooth : DEFAULT_PREFERENCES.autoScrollSmooth,
      autoScrollPauseOnManualScroll: typeof parsed.autoScrollPauseOnManualScroll === 'boolean' ? parsed.autoScrollPauseOnManualScroll : DEFAULT_PREFERENCES.autoScrollPauseOnManualScroll,
      autoScrollMode: parsed.autoScrollMode === 'tail' ? 'tail' : 'continuous',
      autoScrollSpeed: parsed.autoScrollSpeed === 'slow' || parsed.autoScrollSpeed === 'fast' ? parsed.autoScrollSpeed : 'medium',
      sidebarEnabled: typeof parsed.sidebarEnabled === 'boolean' ? parsed.sidebarEnabled : DEFAULT_PREFERENCES.sidebarEnabled,
      sidebarCollapsed: typeof parsed.sidebarCollapsed === 'boolean' ? parsed.sidebarCollapsed : DEFAULT_PREFERENCES.sidebarCollapsed,
      watchedFolders: Array.isArray(parsed.watchedFolders) ? parsed.watchedFolders : DEFAULT_PREFERENCES.watchedFolders,
      rainbowBrackets: typeof parsed.rainbowBrackets === 'boolean' ? parsed.rainbowBrackets : DEFAULT_PREFERENCES.rainbowBrackets,
      highlightActiveLine: typeof parsed.highlightActiveLine === 'boolean' ? parsed.highlightActiveLine : DEFAULT_PREFERENCES.highlightActiveLine,
      activeLineColor: typeof parsed.activeLineColor === 'string' ? parsed.activeLineColor : DEFAULT_PREFERENCES.activeLineColor,
      activeLineIcon: ['hand', 'arrow', 'chevron', 'caret', 'chevrons', 'target', 'dot', 'bookmark', 'star'].includes(parsed.activeLineIcon as string)
        ? (parsed.activeLineIcon as ActiveLineIconType)
        : DEFAULT_PREFERENCES.activeLineIcon,
      focusBackgroundMode: ['transparent', 'severity', 'custom'].includes(parsed.focusBackgroundMode as string)
        ? (parsed.focusBackgroundMode as FocusBackgroundMode)
        : DEFAULT_PREFERENCES.focusBackgroundMode,
      customFocusBackgroundColor: typeof parsed.customFocusBackgroundColor === 'string'
        ? parsed.customFocusBackgroundColor
        : DEFAULT_PREFERENCES.customFocusBackgroundColor,
      highlightGitPipeline: typeof parsed.highlightGitPipeline === 'boolean' ? parsed.highlightGitPipeline : DEFAULT_PREFERENCES.highlightGitPipeline,
      showSeverityBackground: typeof parsed.showSeverityBackground === 'boolean' ? parsed.showSeverityBackground : DEFAULT_PREFERENCES.showSeverityBackground,
      recentFiles: Array.isArray(parsed.recentFiles) ? parsed.recentFiles : DEFAULT_PREFERENCES.recentFiles,
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

export function addRecentFile(item: RecentFileItem): void {
  const filtered = currentPreferences.recentFiles.filter(
    (f) => f.filePath !== item.filePath,
  );
  const updated = [item, ...filtered].slice(0, 15);
  setPreferences({ recentFiles: updated });
}

export function removeRecentFile(filePath: string): void {
  const updated = currentPreferences.recentFiles.filter(
    (f) => f.filePath !== filePath,
  );
  setPreferences({ recentFiles: updated });
}

export function clearRecentFiles(): void {
  setPreferences({ recentFiles: [] });
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
