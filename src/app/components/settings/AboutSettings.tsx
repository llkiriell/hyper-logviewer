import { IconBrandGithub, IconExternalLink } from '@tabler/icons-react';
import { useTranslation } from '../../i18n/index.ts';
import { desktop, openExternalUrl } from '../../platform/desktop.ts';
import { Logo } from '../primitives.tsx';
import { SettingRow, SettingsGroup } from './SettingsRows.tsx';

export function AboutSettings() {
  const { t } = useTranslation();
  const version = desktop?.version ?? '0.1.0-beta.1';

  return (
    <>
      <div className="about-hero">
        <Logo size={42} />
        <div className="about-info">
          <h3>Hyper LogViewer</h3>
          <p>
            {t('settings.about.version')} {version}
          </p>
        </div>
      </div>

      <div className="about-details">
        <p>{t('settings.about.description')}</p>
        <p>{t('settings.about.license')}</p>
      </div>

      <SettingsGroup>
        <SettingRow
          label={t('settings.about.github')}
          help={t('settings.about.githubHelp')}
        >
          <button
            type="button"
            className="button small"
            onClick={() => void openExternalUrl('https://github.com/llkiriell/hyper-logviewer')}
          >
            <IconBrandGithub size={15} stroke={1.5} />
            {t('settings.about.viewGitHub')}
            <IconExternalLink size={13} stroke={1.5} />
          </button>
        </SettingRow>
      </SettingsGroup>
    </>
  );
}
