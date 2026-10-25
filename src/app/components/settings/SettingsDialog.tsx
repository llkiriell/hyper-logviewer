import { useState } from 'react';
import type { ComponentType } from 'react';
import {
  IconAdjustmentsHorizontal,
  IconArrowDownCircle,
  IconCode,
  IconFolder,
  IconInfoCircle,
  IconKeyboard,
  IconPalette,
  IconX,
} from '@tabler/icons-react';
import { SUPPORTED_LOCALES, useTranslation } from '../../i18n/index.ts';
import type { SupportedLocale, TranslationKey } from '../../i18n/types.ts';
import {
  setPreferences,
  usePreferences,
} from '../../platform/preferences.ts';
import type { AccentColor, ThemePreference } from '../../platform/preferences.ts';
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
              {t(SECTIONS.find((s) => s.id === section)?.labelKey ?? 'settings.title')}
            </h2>
            <button
              type="button"
              className="dialog-close"
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close"
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
                    <div className="color-picker-wrapper" title={t('settings.appearance.separatorColor')}>
                      <input
                        type="color"
                        value={prefs.lineSeparatorColor}
                        onChange={(e) => setPreferences({ lineSeparatorColor: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </SettingRow>
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
