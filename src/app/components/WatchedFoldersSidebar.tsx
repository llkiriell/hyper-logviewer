import { useEffect, useMemo, useState } from 'react';
import {
  IconChevronDown,
  IconChevronRight,
  IconFileText,
  IconFolder,
  IconFolderOpen,
  IconFolderPlus,
  IconRotate2,
  IconSearch,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from '../i18n/index.ts';
import { desktop } from '../platform/desktop.ts';
import { formatBytes, openFileByPath } from '../platform/fileLoader.ts';
import {
  setPreferences,
  usePreferences,
} from '../platform/preferences.ts';
import { activateTab, getTabsState } from '../tabs.ts';

interface LogFileInfo {
  name: string;
  fullPath: string;
  size: number;
  mtime: number;
}

export function WatchedFoldersSidebar() {
  const { t } = useTranslation();
  const prefs = usePreferences();
  const [folderFiles, setFolderFiles] = useState<Record<string, LogFileInfo[]>>({});
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load log files for all watched folders
  const refreshFolders = async () => {
    if (!desktop?.readDirLogs) return;
    setLoading(true);
    const result: Record<string, LogFileInfo[]> = {};

    for (const folder of prefs.watchedFolders) {
      try {
        const res = await desktop.readDirLogs(folder);
        if (res.ok && res.files) {
          result[folder] = res.files;
        } else {
          result[folder] = [];
        }
      } catch {
        result[folder] = [];
      }
    }

    setFolderFiles(result);
    setLoading(false);
  };

  useEffect(() => {
    void refreshFolders();
  }, [prefs.watchedFolders]);

  const toggleFolderCollapse = (folder: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folder]: !prev[folder],
    }));
  };

  const handleOpenFile = async (file: LogFileInfo) => {
    // Check if file is already open in a tab
    const tabsState = getTabsState();
    const existing = tabsState.tabs.find((t) => t.filePath === file.fullPath);
    if (existing) {
      activateTab(existing.id);
      return;
    }

    await openFileByPath(file.fullPath);
  };

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

  // Filtered files per folder based on search query
  const filteredFolderFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return folderFiles;

    const result: Record<string, LogFileInfo[]> = {};
    for (const [folder, files] of Object.entries(folderFiles)) {
      result[folder] = files.filter((f) => f.name.toLowerCase().includes(q));
    }
    return result;
  }, [folderFiles, searchQuery]);

  return (
    <aside className="watched-sidebar">
      {/* Sidebar Top Header */}
      <div className="watched-sidebar-header">
        <div className="watched-sidebar-title">
          <IconFolderOpen size={16} stroke={1.5} />
          <span>{t('sidebar.title')}</span>
        </div>

        <div className="watched-sidebar-actions">
          {/* Magnifying glass button to search files */}
          <button
            type="button"
            className={`sidebar-tool-btn ${searchOpen ? 'is-active' : ''}`}
            onClick={() => {
              setSearchOpen((prev) => !prev);
              if (searchOpen) setSearchQuery('');
            }}
            title={t('sidebar.searchPlaceholder')}
            aria-label="Buscar archivos"
          >
            <IconSearch size={15} stroke={1.5} />
          </button>

          <button
            type="button"
            className="sidebar-tool-btn"
            onClick={handleAddFolder}
            title={t('settings.folders.addFolder')}
            aria-label={t('settings.folders.addFolder')}
          >
            <IconFolderPlus size={15} stroke={1.5} />
          </button>

          <button
            type="button"
            className={`sidebar-tool-btn ${loading ? 'is-spinning' : ''}`}
            onClick={refreshFolders}
            title={t('sidebar.refresh')}
            aria-label={t('sidebar.refresh')}
          >
            <IconRotate2 size={15} stroke={1.5} />
          </button>
        </div>
      </div>

      {/* Inline File Search Bar */}
      {searchOpen && (
        <div className="sidebar-search-bar">
          <IconSearch size={13} stroke={1.5} className="sidebar-search-icon" />
          <input
            type="text"
            className="sidebar-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('sidebar.searchPlaceholder')}
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              className="sidebar-search-clear"
              onClick={() => setSearchQuery('')}
            >
              <IconX size={12} stroke={1.5} />
            </button>
          )}
        </div>
      )}

      {/* Folders & Files Tree List */}
      <div className="watched-sidebar-content">
        {prefs.watchedFolders.length === 0 ? (
          <div className="watched-sidebar-empty">
            <p>{t('sidebar.empty')}</p>
            <button
              type="button"
              className="button button-sm primary"
              onClick={handleAddFolder}
            >
              <IconFolderPlus size={14} stroke={1.5} />
              <span>{t('settings.folders.addFolder')}</span>
            </button>
          </div>
        ) : (
          <div className="watched-folder-tree">
            {prefs.watchedFolders.map((folder) => {
              const folderName = folder.split(/[/\\]/).filter(Boolean).pop() ?? folder;
              const files = filteredFolderFiles[folder] ?? [];
              const rawCount = folderFiles[folder]?.length ?? 0;
              // If searching, auto-expand folders that have matches
              const isCollapsed = searchQuery
                ? files.length === 0
                : Boolean(collapsedFolders[folder]);

              return (
                <div key={folder} className="watched-folder-item">
                  <div
                    className="watched-folder-header"
                    onClick={() => toggleFolderCollapse(folder)}
                    title={folder}
                  >
                    <span className="watched-folder-chevron">
                      {isCollapsed ? (
                        <IconChevronRight size={13} stroke={1.5} />
                      ) : (
                        <IconChevronDown size={13} stroke={1.5} />
                      )}
                    </span>
                    <IconFolder size={15} stroke={1.5} className="folder-icon" />
                    <span className="watched-folder-name">{folderName}</span>
                    <span className="watched-files-badge">
                      {searchQuery ? `${files.length}/${rawCount}` : files.length}
                    </span>
                  </div>

                  {!isCollapsed && (
                    <div className="watched-files-list">
                      {files.length === 0 ? (
                        <div className="watched-files-empty">
                          <span>{loading ? '...' : t('hero.noRecent')}</span>
                        </div>
                      ) : (
                        files.map((f) => (
                          <div
                            key={f.fullPath}
                            className="watched-file-row"
                            onClick={() => void handleOpenFile(f)}
                            title={f.fullPath}
                          >
                            <IconFileText size={14} stroke={1.5} className="file-icon" />
                            <span className="watched-file-name">{f.name}</span>
                            <span className="watched-file-size">
                              {formatBytes(f.size)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
