import { useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import {
  IconAdjustmentsHorizontal,
  IconAlertTriangle,
  IconArrowDownCircle,
  IconArrowRight,
  IconBookmarkFilled,
  IconCaretRightFilled,
  IconCheck,
  IconChevronRight,
  IconChevronsRight,
  IconCircleDot,
  IconCode,
  IconFolder,
  IconHandFingerRight,
  IconInfoCircle,
  IconKeyboard,
  IconPalette,
  IconRotate2,
  IconStarFilled,
  IconTarget,
  IconX,
} from '@tabler/icons-react';
import { checkWcagContrast } from '../../../core/accessibility.ts';
import { SUPPORTED_LOCALES, useTranslation } from '../../i18n/index.ts';
import type { SupportedLocale, TranslationKey } from '../../i18n/types.ts';
import {
  DEFAULT_PREFERENCES,
  resolvedTheme,
  setPreferences,
  usePreferences,
} from '../../platform/preferences.ts';
import type {
  AccentColor,
  ActiveLineIconType,
  FocusBackgroundMode,
  ThemePreference,
} from '../../platform/preferences.ts';
import { Dialog, Segmented, Select, Switch } from '../primitives.tsx';
import { AboutSettings } from './AboutSettings.tsx';
import { AutoscrollSettings } from './AutoscrollSettings.tsx';
import { ParserSettings } from './ParserSettings.tsx';
import { SettingRow, SettingsGroup } from './SettingsRows.tsx';
import { WatchedFoldersSettings } from './WatchedFoldersSettings.tsx';

type SettingsSection =
  | 'general'
  | 'appearance'
  | 'parser'
  | 'folders'
  | 'autoscroll'
  | 'shortcuts'
  | 'about';

interface SectionDef {
  id: SettingsSection;
  labelKey: TranslationKey;
  icon: ComponentType<{ size?: number; stroke?: number }>;
}

const SECTIONS: SectionDef[] = [
  { id: 'general', labelKey: 'settings.sections.general', icon: IconAdjustmentsHorizontal },
  { id: 'appearance', labelKey: 'settings.sections.appearance', icon: IconPalette },
  { id: 'parser', labelKey: 'settings.sections.parser', icon: IconCode },
  { id: 'folders', labelKey: 'settings.sections.folders', icon: IconFolder },
  { id: 'autoscroll', labelKey: 'settings.sections.autoscroll', icon: IconArrowDownCircle },
  { id: 'shortcuts', labelKey: 'settings.sections.shortcuts', icon: IconKeyboard },
  { id: 'about', labelKey: 'settings.sections.about', icon: IconInfoCircle },
];

const ACCENTS: AccentColor[] = ['ember', 'ocean', 'aqua', 'violet'];

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const prefs = usePreferences();
  const [section, setSection] = useState<SettingsSection>('general');

  const isDark = resolvedTheme(prefs.theme) === 'dark';
  const currentTextColor = isDark ? '#ececec' : '#1d1d1f';
  const wcagResult = useMemo(() => {
    return checkWcagContrast(
      prefs.customFocusBackgroundColor,
      currentTextColor,
      isDark ? 'dark' : 'light',
    );
  }, [prefs.customFocusBackgroundColor, currentTextColor, isDark]);

  return (
    <Dialog title={t('settings.title')} onClose={onClose} size="large" hideTitle>
      <div className="settings-layout">
        <aside className="settings-sidebar">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = section === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                className={`settings-nav-item ${isActive ? 'is-active' : ''}`}
                onClick={() => setSection(sec.id)}
              >
                <Icon size={16} stroke={1.5} />
                <span>{t(sec.labelKey)}</span>
              </button>
            );
          })}
        </aside>

        <section className="settings-content">
          <div className="settings-content-header">
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
              {t(SECTIONS.find((s) => s.id === section)?.labelKey ?? 'settings.title')}
            </h2>
            <button
              type="button"
              className="dialog-close"
              onClick={onClose}
              title={`${t('common.close')} (Esc)`}
              aria-label={t('common.close')}
            >
              <IconX size={18} stroke={1.5} />
            </button>
          </div>

          {section === 'general' && (
            <SettingsGroup>
              <SettingRow
                label={t('settings.general.language')}
                help={t('settings.general.languageHelp')}
              >
                <Select<SupportedLocale>
                  value={prefs.locale}
                  label={t('settings.general.language')}
                  options={SUPPORTED_LOCALES.map((l) => ({
                    value: l.id,
                    label: l.label,
                  }))}
                  onChange={(locale) => setPreferences({ locale })}
                />
              </SettingRow>

              <SettingRow
                label={t('settings.general.encoding')}
                help={t('settings.general.encodingHelp')}
              >
                <Select<string>
                  value="utf-8"
                  label={t('settings.general.encoding')}
                  options={[
                    { value: 'utf-8', label: 'UTF-8' },
                    { value: 'ascii', label: 'ASCII' },
                    { value: 'latin1', label: 'ISO-8859-1 (Latin1)' },
                  ]}
                  onChange={() => {}}
                />
              </SettingRow>
            </SettingsGroup>
          )}

          {section === 'appearance' && (
            <SettingsGroup>
              <SettingRow
                label={t('settings.appearance.theme')}
                help={t('settings.appearance.themeHelp')}
              >
                <Segmented<ThemePreference>
                  value={prefs.theme}
                  label={t('settings.appearance.theme')}
                  options={[
                    ['system', t('settings.appearance.themeSystem')],
                    ['light', t('settings.appearance.themeLight')],
                    ['dark', t('settings.appearance.themeDark')],
                  ]}
                  onChange={(theme) => setPreferences({ theme })}
                />
              </SettingRow>

              <SettingRow
                label={t('settings.appearance.accent')}
                help={t('settings.appearance.accentHelp')}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  {ACCENTS.map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      className={`accent-swatch accent-${acc} ${prefs.accent === acc ? 'is-selected' : ''}`}
                      onClick={() => setPreferences({ accent: acc })}
                      title={acc}
                      aria-label={acc}
                    />
                  ))}
                </div>
              </SettingRow>

              <SettingRow
                label={t('settings.appearance.fontSize')}
                help={t('settings.appearance.fontSizeHelp')}
              >
                <Select<number>
                  value={prefs.fontSize}
                  label={t('settings.appearance.fontSize')}
                  options={[11, 12, 13, 14, 15, 16, 18].map((size) => ({
                    value: size,
                    label: `${size}px`,
                  }))}
                  onChange={(fontSize) => setPreferences({ fontSize })}
                />
              </SettingRow>

              <SettingRow
                label={t('settings.appearance.wordWrap')}
                help={t('settings.appearance.wordWrapHelp')}
              >
                <Switch
                  checked={prefs.wordWrap}
                  onChange={(wordWrap) => setPreferences({ wordWrap })}
                  label={t('settings.appearance.wordWrap')}
                />
              </SettingRow>

              <SettingRow
                label={t('settings.appearance.lineSeparator')}
                help={t('settings.appearance.lineSeparatorHelp')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Switch
                    checked={prefs.showLineSeparator}
                    onChange={(showLineSeparator) => setPreferences({ showLineSeparator })}
                    label={t('settings.appearance.lineSeparator')}
                  />
                  {prefs.showLineSeparator && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="color-picker-wrapper" title={t('settings.appearance.separatorColor')}>
                        <input
                          type="color"
                          value={prefs.lineSeparatorColor}
                          onChange={(e) => setPreferences({ lineSeparatorColor: e.target.value })}
                        />
                      </div>
                      {prefs.lineSeparatorColor.toLowerCase() !==
                        DEFAULT_PREFERENCES.lineSeparatorColor.toLowerCase() && (
                        <button
                          type="button"
                          className="search-tool-btn"
                          onClick={() =>
                            setPreferences({ lineSeparatorColor: DEFAULT_PREFERENCES.lineSeparatorColor })
                          }
                          title={t('settings.appearance.resetSeparatorColor')}
                          aria-label={t('settings.appearance.resetSeparatorColor')}
                        >
                          <IconRotate2 size={14} stroke={1.5} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </SettingRow>

              <SettingRow
                label={t('settings.appearance.jsonTheme')}
                help={t('settings.appearance.jsonThemeHelp')}
              >
                <Segmented<'postman' | 'insomnia'>
                  value={prefs.jsonTheme}
                  label={t('settings.appearance.jsonTheme')}
                  options={[
                    ['postman', 'Postman'],
                    ['insomnia', 'Insomnia'],
                  ]}
                  onChange={(jsonTheme) => setPreferences({ jsonTheme })}
                />
              </SettingRow>

              <SettingRow
                label={t('settings.appearance.bottomSearchBar')}
                help={t('settings.appearance.bottomSearchBarHelp')}
              >
                <Switch
                  checked={prefs.bottomSearchBar}
                  onChange={(bottomSearchBar) => setPreferences({ bottomSearchBar })}
                  label={t('settings.appearance.bottomSearchBar')}
                />
              </SettingRow>

              <SettingRow
                label={t('settings.appearance.rainbowBrackets')}
                help={t('settings.appearance.rainbowBracketsHelp')}
              >
                <Switch
                  checked={prefs.rainbowBrackets}
                  onChange={(rainbowBrackets) => setPreferences({ rainbowBrackets })}
                  label={t('settings.appearance.rainbowBrackets')}
                />
              </SettingRow>

              <SettingRow
                label={t('settings.appearance.highlightActiveLine')}
                help={t('settings.appearance.highlightActiveLineHelp')}
              >
                <Switch
                  checked={prefs.highlightActiveLine}
                  onChange={(highlightActiveLine) => setPreferences({ highlightActiveLine })}
                  label={t('settings.appearance.highlightActiveLine')}
                />
              </SettingRow>

              {prefs.highlightActiveLine && (
                <>
                  <SettingRow
                  label={t('settings.appearance.activeLineIcon')}
                  help={t('settings.appearance.activeLineIconHelp')}
                >
                  <Select<ActiveLineIconType>
                    value={prefs.activeLineIcon || 'hand'}
                    label={t('settings.appearance.activeLineIcon')}
                    options={[
                      {
                        value: 'hand',
                        label: t('settings.appearance.icons.hand'),
                        icon: <IconHandFingerRight size={15} stroke={1.8} />,
                      },
                      {
                        value: 'arrow',
                        label: t('settings.appearance.icons.arrow'),
                        icon: <IconArrowRight size={15} stroke={1.8} />,
                      },
                      {
                        value: 'chevron',
                        label: t('settings.appearance.icons.chevron'),
                        icon: <IconChevronRight size={15} stroke={1.8} />,
                      },
                      {
                        value: 'caret',
                        label: t('settings.appearance.icons.caret'),
                        icon: <IconCaretRightFilled size={15} />,
                      },
                      {
                        value: 'chevrons',
                        label: t('settings.appearance.icons.chevrons'),
                        icon: <IconChevronsRight size={15} stroke={1.8} />,
                      },
                      {
                        value: 'target',
                        label: t('settings.appearance.icons.target'),
                        icon: <IconTarget size={15} stroke={1.8} />,
                      },
                      {
                        value: 'dot',
                        label: t('settings.appearance.icons.dot'),
                        icon: <IconCircleDot size={15} stroke={1.8} />,
                      },
                      {
                        value: 'bookmark',
                        label: t('settings.appearance.icons.bookmark'),
                        icon: <IconBookmarkFilled size={15} />,
                      },
                      {
                        value: 'star',
                        label: t('settings.appearance.icons.star'),
                        icon: <IconStarFilled size={15} />,
                      },
                    ]}
                    onChange={(activeLineIcon) => setPreferences({ activeLineIcon })}
                  />
                </SettingRow>

                <SettingRow
                  label={t('settings.appearance.focusBackground')}
                  help={t('settings.appearance.focusBackgroundHelp')}
                >
                  <Select<FocusBackgroundMode>
                    value={prefs.focusBackgroundMode || 'transparent'}
                    label={t('settings.appearance.focusBackground')}
                    options={[
                      {
                        value: 'transparent',
                        label: t('settings.appearance.focusBgTransparent'),
                      },
                      {
                        value: 'severity',
                        label: t('settings.appearance.focusBgSeverity'),
                      },
                      {
                        value: 'custom',
                        label: t('settings.appearance.focusBgCustom'),
                      },
                    ]}
                    onChange={(focusBackgroundMode) => setPreferences({ focusBackgroundMode })}
                  />
                </SettingRow>

                {prefs.focusBackgroundMode === 'custom' && (
                  <div className="custom-focus-bg-container">
                    <div className="custom-focus-bg-row">
                      <span className="setting-label">{t('settings.appearance.customFocusBgColor')}</span>
                      <div className="custom-focus-bg-controls">
                        <input
                          type="color"
                          className="custom-focus-color-input"
                          value={
                            prefs.customFocusBackgroundColor.startsWith('#') &&
                            prefs.customFocusBackgroundColor.length === 7
                              ? prefs.customFocusBackgroundColor
                              : '#2563eb'
                          }
                          onChange={(e) =>
                            setPreferences({ customFocusBackgroundColor: e.target.value })
                          }
                          title="Color"
                        />
                        <input
                          type="text"
                          className="input text-input custom-focus-text-input"
                          value={prefs.customFocusBackgroundColor}
                          onChange={(e) =>
                            setPreferences({ customFocusBackgroundColor: e.target.value })
                          }
                          placeholder="rgba(14, 165, 233, 0.15) / #2563eb"
                        />
                        <button
                          type="button"
                          className="button button-xs button-ghost"
                          onClick={() =>
                            setPreferences({
                              focusBackgroundMode: 'transparent',
                              customFocusBackgroundColor: DEFAULT_PREFERENCES.customFocusBackgroundColor,
                            })
                          }
                          title={t('settings.appearance.resetFocusBg')}
                        >
                          <IconRotate2 size={13} stroke={1.5} />
                          <span>{t('common.reset')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Visual Preview Box with Check / Warning Icon */}
                    <div className="custom-focus-preview-card">
                      <div className="preview-header-label">
                        <span>{t('settings.appearance.preview')}</span>
                        <span
                          className={`preview-status-pill ${
                            wcagResult.isAaCompliant ? 'is-compliant' : 'is-warning'
                          }`}
                        >
                          {wcagResult.isAaCompliant ? (
                            <>
                              <IconCheck size={13} stroke={2.5} />
                              <span>WCAG AA ({wcagResult.ratio}:1)</span>
                            </>
                          ) : (
                            <>
                              <IconAlertTriangle size={13} stroke={2.5} />
                              <span>
                                {t('settings.appearance.wcagWarningShort')} ({wcagResult.ratio}:1)
                              </span>
                            </>
                          )}
                        </span>
                      </div>
                      <div
                        className="custom-focus-mock-row"
                        style={{
                          backgroundColor: prefs.customFocusBackgroundColor,
                          borderLeft: '3px solid var(--accent)',
                        }}
                      >
                        <span className="mock-gutter">142</span>
                        <span className="mock-badge">INFO</span>
                        <span className="mock-text" style={{ color: currentTextColor }}>
                          2026-10-27 12:45:00 [Worker-3] Task processed successfully
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            </SettingsGroup>
          )}

          {section === 'parser' && <ParserSettings />}

          {section === 'folders' && <WatchedFoldersSettings />}

          {section === 'autoscroll' && <AutoscrollSettings />}

          {section === 'shortcuts' && (
            <SettingsGroup>
              <SettingRow label={t('settings.shortcuts.openFile')}>
                <kbd style={{ padding: '2px 6px', background: 'var(--code-bg)', border: '1px solid var(--border-strong)', borderRadius: '4px', fontSize: '11px' }}>Ctrl + O</kbd>
              </SettingRow>
              <SettingRow label={t('settings.shortcuts.pasteLog')}>
                <kbd style={{ padding: '2px 6px', background: 'var(--code-bg)', border: '1px solid var(--border-strong)', borderRadius: '4px', fontSize: '11px' }}>Ctrl + V</kbd>
              </SettingRow>
              <SettingRow label={t('settings.shortcuts.newTab')}>
                <kbd style={{ padding: '2px 6px', background: 'var(--code-bg)', border: '1px solid var(--border-strong)', borderRadius: '4px', fontSize: '11px' }}>Ctrl + T</kbd>
              </SettingRow>
              <SettingRow label={t('settings.shortcuts.closeTab')}>
                <kbd style={{ padding: '2px 6px', background: 'var(--code-bg)', border: '1px solid var(--border-strong)', borderRadius: '4px', fontSize: '11px' }}>Ctrl + W</kbd>
              </SettingRow>
              <SettingRow label={t('settings.shortcuts.toggleSettings')}>
                <kbd style={{ padding: '2px 6px', background: 'var(--code-bg)', border: '1px solid var(--border-strong)', borderRadius: '4px', fontSize: '11px' }}>Ctrl + ,</kbd>
              </SettingRow>
            </SettingsGroup>
          )}

          {section === 'about' && <AboutSettings />}
        </section>
      </div>
    </Dialog>
  );
}
