import { useEffect, useRef, useState } from 'react';
import {
  IconClipboard,
  IconClock,
  IconFileText,
  IconFolderOpen,
  IconLayoutSidebar,
  IconLayoutSidebarLeftCollapse,
  IconMoon,
  IconSettings,
  IconSun,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from './i18n/index.ts';
import { desktop } from './platform/desktop.ts';
import {
  formatBytes,
  openFileByPath,
  openFileObjects,
  openNativeFileDialog,
  pasteClipboardAsTab,
} from './platform/fileLoader.ts';
import {
  clearRecentFiles,
  removeRecentFile,
  resolvedTheme,
  setPreferences,
  usePreferences,
} from './platform/preferences.ts';
import { getActiveTab, useTabs } from './tabs.ts';
import { DropZone } from './components/DropZone.tsx';
import { Logo } from './components/primitives.tsx';
import { SettingsDialog } from './components/settings/SettingsDialog.tsx';
import { TabBar } from './components/TabBar.tsx';
import { VirtualLogView } from './components/VirtualLogView.tsx';
import { WatchedFoldersSidebar } from './components/WatchedFoldersSidebar.tsx';

function useThemeManager() {
  const prefs = usePreferences();

  useEffect(() => {
    const apply = () => {
      const active = resolvedTheme(prefs.theme);
      document.documentElement.dataset.theme = active;
      document.documentElement.dataset.accent = prefs.accent;
      document.documentElement.style.colorScheme = active;
      if (desktop?.setTheme) {
        desktop.setTheme(active);
      }
    };

    apply();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [prefs.theme, prefs.accent]);
}

export function App() {
  const { t } = useTranslation();
  const prefs = usePreferences();
  const { tabs } = useTabs();
  const activeTab = getActiveTab();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useThemeManager();

  // Set desktop attribute on document for native titlebar spacing
  useEffect(() => {
    if (desktop) {
      document.documentElement.dataset.desktop = desktop.platform;
    }
  }, []);

  const handleOpenFile = async () => {
    if (desktop?.openFileDialog) {
      await openNativeFileDialog();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePasteLog = async () => {
    await pasteClipboardAsTab(t('common.pasteLog'));
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      await openFileObjects(event.target.files);
      event.target.value = '';
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        if (event.key === ',') {
          event.preventDefault();
          setSettingsOpen((prev) => !prev);
        } else if (event.key === 'o' || event.key === 'O') {
          event.preventDefault();
          void handleOpenFile();
        } else if (event.key === 'v' || event.key === 'V') {
          event.preventDefault();
          void handlePasteLog();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const next = resolvedTheme(prefs.theme) === 'dark' ? 'light' : 'dark';
    setPreferences({ theme: next });
  };

  return (
    <DropZone>
      <div className="app-container">
        {/* Hidden file input for web fallback and standard file chooser */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".log,.txt,.out,.err,.json,*"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />

        {/* Top Header / Bar */}
        <header className="app-header">
          <div className="app-brand">
            {/* Sidebar toggle button (only rendered if sidebar is enabled in settings) */}
            {prefs.sidebarEnabled && (
              <button
                type="button"
                className="button icon-only sidebar-toggle-btn"
                onClick={() =>
                  setPreferences({ sidebarCollapsed: !prefs.sidebarCollapsed })
                }
                title={
                  prefs.sidebarCollapsed
                    ? t('sidebar.expand')
                    : t('sidebar.collapse')
                }
                aria-label="Toggle sidebar"
              >
                {prefs.sidebarCollapsed ? (
                  <IconLayoutSidebar size={17} stroke={1.5} />
                ) : (
                  <IconLayoutSidebarLeftCollapse size={17} stroke={1.5} />
                )}
              </button>
            )}

            <Logo size={22} />
            <span>{t('appName')}</span>
          </div>

          <div className="app-actions">
            <button
              type="button"
              className="button"
              onClick={handleOpenFile}
              title={`${t('common.openFile')} (Ctrl+O)`}
            >
              <IconFolderOpen size={16} stroke={1.5} />
              <span>{t('common.openFile')}</span>
            </button>

            <button
              type="button"
              className="button"
              onClick={handlePasteLog}
              title={`${t('common.pasteLog')} (Ctrl+V)`}
            >
              <IconClipboard size={16} stroke={1.5} />
              <span>{t('common.pasteLog')}</span>
            </button>

            <button
              type="button"
              className="button icon-only"
              onClick={toggleTheme}
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {resolvedTheme(prefs.theme) === 'dark' ? (
                <IconSun size={17} stroke={1.5} />
              ) : (
                <IconMoon size={17} stroke={1.5} />
              )}
            </button>

            <button
              type="button"
              className="button icon-only"
              onClick={() => setSettingsOpen(true)}
              title={`${t('common.settings')} (Ctrl+,)`}
              aria-label={t('common.settings')}
            >
              <IconSettings size={17} stroke={1.5} />
            </button>
          </div>
        </header>

        {/* Main Body Layout with Optional Watched Folders Sidebar */}
        <div className="app-body-layout">
          {prefs.sidebarEnabled && !prefs.sidebarCollapsed && (
            <WatchedFoldersSidebar
              onCollapse={() => setPreferences({ sidebarCollapsed: true })}
            />
          )}

          <div className="app-main-pane">
            {/* Tabs Bar (displayed when tabs exist) */}
            {tabs.length > 0 && <TabBar onNewTabClick={handleOpenFile} />}

            {/* Main Content Area */}
            {activeTab ? (
              <VirtualLogView tab={activeTab} />
            ) : (
              <main className="app-content">
                <div className="hero-box">
                  <Logo size={48} />
                  <h2>{t('hero.title')}</h2>
                  <p>{t('hero.subtitle')}</p>

                  <div className="hero-actions">
                    <button
                      type="button"
                      className="button primary"
                      onClick={handleOpenFile}
                    >
                      <IconFolderOpen size={16} stroke={1.5} />
                      <span>{t('hero.openButton')}</span>
                    </button>

                    <button
                      type="button"
                      className="button"
                      onClick={handlePasteLog}
                    >
                      <IconClipboard size={16} stroke={1.5} />
                      <span>{t('hero.pasteButton')}</span>
                    </button>
                  </div>

                  {/* Recent Files List */}
                  {prefs.recentFiles.length > 0 && (
                    <div className="recent-files-container">
                      <div className="recent-files-header">
                        <div className="recent-files-title">
                          <IconClock size={16} stroke={1.5} />
                          <span>{t('hero.recentFiles')}</span>
                        </div>
                        <button
                          type="button"
                          className="button button-xs button-ghost"
                          onClick={clearRecentFiles}
                        >
                          <IconTrash size={13} stroke={1.5} />
                          <span>{t('hero.clearRecent')}</span>
                        </button>
                      </div>

                      <div className="recent-files-grid">
                        {prefs.recentFiles.map((item) => (
                          <div
                            key={item.filePath}
                            className="recent-file-card"
                            onClick={() => void openFileByPath(item.filePath)}
                            title={item.filePath}
                          >
                            <div className="recent-file-main">
                              <IconFileText
                                size={18}
                                stroke={1.5}
                                className="recent-file-icon"
                              />
                              <div className="recent-file-texts">
                                <span className="recent-file-name">
                                  {item.fileName}
                                </span>
                                <span className="recent-file-path">
                                  {item.filePath}
                                </span>
                              </div>
                            </div>
                            <div className="recent-file-meta">
                              {item.size !== undefined && (
                                <span className="recent-file-size">
                                  {formatBytes(item.size)}
                                </span>
                              )}
                              <button
                                type="button"
                                className="recent-file-remove"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRecentFile(item.filePath);
                                }}
                                title={t('common.delete')}
                              >
                                <IconX size={13} stroke={1.5} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </main>
            )}
          </div>
        </div>

        {/* Settings Dialog */}
        {settingsOpen && (
          <SettingsDialog onClose={() => setSettingsOpen(false)} />
        )}
      </div>
    </DropZone>
  );
}
