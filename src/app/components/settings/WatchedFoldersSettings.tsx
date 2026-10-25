import {
  IconFolder,
  IconFolderPlus,
  IconTrash,
} from '@tabler/icons-react';
import { useTranslation } from '../../i18n/index.ts';
import { desktop } from '../../platform/desktop.ts';
import {
  setPreferences,
  usePreferences,
} from '../../platform/preferences.ts';
import { Switch } from '../primitives.tsx';
import { SettingRow, SettingsGroup } from './SettingsRows.tsx';

export function WatchedFoldersSettings() {
  const { t } = useTranslation();
  const prefs = usePreferences();

  const handleAddFolder = async () => {
    if (desktop?.selectFolderDialog) {
      const selected = await desktop.selectFolderDialog();
      if (selected && !prefs.watchedFolders.includes(selected)) {
        setPreferences({
          watchedFolders: [...prefs.watchedFolders, selected],
        });
      }
    }
  };

  const handleRemoveFolder = (folder: string) => {
    setPreferences({
      watchedFolders: prefs.watchedFolders.filter((f) => f !== folder),
    });
  };

  return (
    <div className="settings-section">
      <SettingsGroup>
        <SettingRow
          label={t('settings.folders.enableSidebar')}
          help={t('settings.folders.enableSidebarHelp')}
        >
          <Switch
            checked={prefs.sidebarEnabled}
            onChange={(sidebarEnabled) => setPreferences({ sidebarEnabled })}
            label={t('settings.folders.enableSidebar')}
          />
        </SettingRow>
      </SettingsGroup>

      {prefs.sidebarEnabled && (
        <div className="settings-group" style={{ marginTop: '16px' }}>
          <div className="settings-group-header">
            <div>
              <h3>{t('settings.folders.title')}</h3>
              <p className="settings-desc">{t('settings.folders.enableSidebarHelp')}</p>
            </div>
            <button
              type="button"
              className="button button-sm primary"
              onClick={handleAddFolder}
            >
              <IconFolderPlus size={14} stroke={1.5} />
              <span>{t('settings.folders.addFolder')}</span>
            </button>
          </div>

          <div className="watched-folders-list" style={{ marginTop: '14px' }}>
            {prefs.watchedFolders.length === 0 ? (
              <p className="empty-keywords-hint">{t('settings.folders.noFolders')}</p>
            ) : (
              prefs.watchedFolders.map((folder) => (
                <div key={folder} className="watched-folder-config-card">
                  <div className="watched-folder-card-info">
                    <IconFolder size={16} stroke={1.5} className="folder-icon" />
                    <span className="watched-folder-card-path">{folder}</span>
                  </div>
                  <button
                    type="button"
                    className="search-tool-btn"
                    onClick={() => handleRemoveFolder(folder)}
                    title={t('common.delete')}
                  >
                    <IconTrash size={14} stroke={1.5} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
