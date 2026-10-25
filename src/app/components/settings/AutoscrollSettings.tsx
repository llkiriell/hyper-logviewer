import { useTranslation } from '../../i18n/index.ts';
import {
  setPreferences,
  usePreferences,
} from '../../platform/preferences.ts';
import { Segmented, Switch } from '../primitives.tsx';
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
          label={t('settings.autoscroll.mode')}
          help={t('settings.autoscroll.modeHelp')}
        >
          <Segmented<'continuous' | 'tail'>
            value={prefs.autoScrollMode}
            label={t('settings.autoscroll.mode')}
            options={[
              ['continuous', t('settings.autoscroll.modeContinuous')],
              ['tail', t('settings.autoscroll.modeTail')],
            ]}
            onChange={(autoScrollMode) => setPreferences({ autoScrollMode })}
          />
        </SettingRow>

        {prefs.autoScrollMode === 'continuous' && (
          <SettingRow
            label={t('settings.autoscroll.speed')}
            help={t('settings.autoscroll.modeHelp')}
          >
            <Segmented<'slow' | 'medium' | 'fast'>
              value={prefs.autoScrollSpeed}
              label={t('settings.autoscroll.speed')}
              options={[
                ['slow', t('settings.autoscroll.speedSlow')],
                ['medium', t('settings.autoscroll.speedMedium')],
                ['fast', t('settings.autoscroll.speedFast')],
              ]}
              onChange={(autoScrollSpeed) => setPreferences({ autoScrollSpeed })}
            />
          </SettingRow>
        )}

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
