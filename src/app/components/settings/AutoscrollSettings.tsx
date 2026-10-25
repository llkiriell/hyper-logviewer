import { useTranslation } from '../../i18n/index.ts';
import {
  setPreferences,
  usePreferences,
} from '../../platform/preferences.ts';
import { Switch } from '../primitives.tsx';
import { SettingRow, SettingsGroup } from './SettingsRows.tsx';

export function AutoscrollSettings() {
  const { t } = useTranslation();
  const prefs = usePreferences();

  return (
    <div className="settings-section">
      <SettingsGroup>
        <SettingRow
          label={t('settings.autoscroll.defaultEnabled')}
          help={t('settings.autoscroll.defaultEnabledHelp')}
        >
          <Switch
            checked={prefs.autoScrollDefault}
            onChange={(autoScrollDefault) => setPreferences({ autoScrollDefault })}
            label={t('settings.autoscroll.defaultEnabled')}
          />
        </SettingRow>

        <SettingRow
          label={t('settings.autoscroll.smooth')}
          help={t('settings.autoscroll.smoothHelp')}
        >
          <Switch
            checked={prefs.autoScrollSmooth}
            onChange={(autoScrollSmooth) => setPreferences({ autoScrollSmooth })}
            label={t('settings.autoscroll.smooth')}
          />
        </SettingRow>

        <SettingRow
          label={t('settings.autoscroll.pauseOnScrollUp')}
          help={t('settings.autoscroll.pauseOnScrollUpHelp')}
        >
          <Switch
            checked={prefs.autoScrollPauseOnManualScroll}
            onChange={(autoScrollPauseOnManualScroll) =>
              setPreferences({ autoScrollPauseOnManualScroll })
            }
            label={t('settings.autoscroll.pauseOnScrollUp')}
          />
        </SettingRow>
      </SettingsGroup>
    </div>
  );
}
