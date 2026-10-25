import { useEffect, useRef, useState } from 'react';
import {
  IconCalendar,
  IconClipboard,
  IconCopy,
  IconFileText,
  IconFolderOpen,
  IconHome,
  IconLayoutSidebar,
  IconLayoutSidebarLeftCollapse,
  IconPin,
  IconPinFilled,
  IconPlus,
  IconRotate2,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from '../i18n/index.ts';
import { desktop } from '../platform/desktop.ts';
import { openFileObjects } from '../platform/fileLoader.ts';
import {
  setPreferences,
  usePreferences,
} from '../platform/preferences.ts';
import {
  activateTab,
  closeOtherTabs,
  closeTab,
  duplicateTab,
  moveTab,
  reloadTab,
  togglePinTab,
  useTabs,
} from '../tabs.ts';
import type { TabItem } from '../tabs.ts';
import { ContextMenu } from './ContextMenu.tsx';
import type { ContextMenuEntry } from './ContextMenu.tsx';

export function TabBar({
  onNewTabClick,
  onGoHome,
  isHomeActive = false,
  onTabSelect,
}: {
  onNewTabClick?: () => void;
  onGoHome?: () => void;
  isHomeActive?: boolean;
  onTabSelect?: () => void;
}) {
  const { t } = useTranslation();
  const prefs = usePreferences();
  const { tabs, activeId } = useTabs();
  const stripRef = useRef<HTMLDivElement>(null);

  // Tab Context menu state
  const [tabContextMenu, setTabContextMenu] = useState<{
    anchor: DOMRect;
    tab: TabItem;
  } | null>(null);

  // Keep active tab in view
  useEffect(() => {
    stripRef.current
      ?.querySelector<HTMLElement>('.tab.is-active')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeId, tabs.length]);

  const handleDropFilesOnBar = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Check if dragging internal tab reorder
    const tabId = event.dataTransfer.getData('text/x-hyper-tab');
    if (tabId) return;

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      await openFileObjects(event.dataTransfer.files);
    }
  };

  const handleTabContextMenu = (e: React.MouseEvent, tab: TabItem) => {
    e.preventDefault();
    e.stopPropagation();
    setTabContextMenu({
      anchor: new DOMRect(e.clientX, e.clientY, 0, 0),
      tab,
    });
  };

  const contextMenuEntries: ContextMenuEntry[] = tabContextMenu
    ? [
        {
          label: tabContextMenu.tab.isPinned
            ? t('tabs.unpinTab')
            : t('tabs.pinTab'),
          icon: tabContextMenu.tab.isPinned ? IconPinFilled : IconPin,
          onSelect: () => togglePinTab(tabContextMenu.tab.id),
        },
        ...(tabContextMenu.tab.filePath
          ? [
              {
                label: t('tabs.showInExplorer'),
                icon: IconFolderOpen,
                onSelect: () => {
                  if (tabContextMenu.tab.filePath && desktop?.showItemInFolder) {
                    void desktop.showItemInFolder(tabContextMenu.tab.filePath);
                  }
                },
              },
              {
                label: t('tabs.reloadFile'),
                icon: IconRotate2,
                onSelect: () => void reloadTab(tabContextMenu.tab.id),
              },
            ]
          : []),
        {
          label: t('tabs.duplicateTab'),
          icon: IconCopy,
          onSelect: () => duplicateTab(tabContextMenu.tab.id),
        },
        { separator: true },
        {
          label: t('tabs.closeTab'),
          icon: IconX,
          onSelect: () => closeTab(tabContextMenu.tab.id),
        },
        {
          label: t('tabs.closeOthers'),
          icon: IconX,
          onSelect: () => closeOtherTabs(tabContextMenu.tab.id),
        },
      ]
    : [];

  return (
    <div
      className={`tab-bar ${tabs.length <= 1 ? 'is-single' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={handleDropFilesOnBar}
    >
      {/* Sidebar toggle button at the very start of the tabs bar */}
      {prefs.sidebarEnabled && (
        <button
          type="button"
          className="tab-sidebar-toggle-btn"
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
            <IconLayoutSidebar size={15} stroke={1.5} />
          ) : (
            <IconLayoutSidebarLeftCollapse size={15} stroke={1.5} />
          )}
        </button>
      )}

      {/* Home button to return to Hero screen */}
      {onGoHome && (
        <button
          type="button"
          className={`tab-home-btn ${isHomeActive ? 'is-active' : ''}`}
          onClick={onGoHome}
          title={t('common.home')}
          aria-label={t('common.home')}
        >
          <IconHome size={15} stroke={1.5} />
        </button>
      )}

      <div
        ref={stripRef}
        className="tab-strip"
        role="tablist"
        aria-label="Open Log Tabs"
      >
        {tabs.map((tab: TabItem, index: number) => {
          const isActive = tab.id === activeId;
          const Icon =
            tab.kind === 'clipboard'
              ? IconClipboard
              : tab.kind === 'segment'
                ? IconCalendar
                : IconFileText;

          return (
            <div
              key={tab.id}
              role="tab"
              tabIndex={0}
              aria-selected={isActive}
              className={`tab ${isActive ? 'is-active' : ''} ${tab.isPinned ? 'is-pinned' : ''}`}
              title={tab.filePath ?? tab.title}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('text/x-hyper-tab', tab.id);
              }}
              onDragOver={(event) => {
                if (event.dataTransfer.types.includes('text/x-hyper-tab')) {
                  event.preventDefault();
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const fromId = event.dataTransfer.getData('text/x-hyper-tab');
                if (fromId) moveTab(fromId, index);
              }}
              onClick={() => {
                activateTab(tab.id);
                onTabSelect?.();
              }}
              onContextMenu={(e) => handleTabContextMenu(e, tab)}
              onAuxClick={(event) => {
                if (event.button === 1) {
                  event.preventDefault();
                  closeTab(tab.id);
                }
              }}
            >
              {tab.isPinned ? (
                <IconPinFilled
                  size={12}
                  stroke={1.5}
                  style={{ flex: 'none', color: 'var(--accent)' }}
                />
              ) : (
                <Icon size={14} stroke={1.5} style={{ flex: 'none' }} />
              )}
              <span className="tab-title">{tab.title}</span>
              <button
                type="button"
                className="tab-close"
                title={t('tabs.closeTab')}
                aria-label={t('tabs.closeTab')}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <IconX size={13} stroke={1.5} />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          className="tab-new-button"
          title={t('tabs.newTab')}
          aria-label={t('tabs.newTab')}
          onClick={onNewTabClick}
        >
          <IconPlus size={15} stroke={1.5} />
        </button>
      </div>

      {tabContextMenu && (
        <ContextMenu
          anchor={tabContextMenu.anchor}
          entries={contextMenuEntries}
          onClose={() => setTabContextMenu(null)}
        />
      )}
    </div>
  );
}
