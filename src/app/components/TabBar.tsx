import { useEffect, useRef } from 'react';
import {
  IconClipboard,
  IconFileText,
  IconPlus,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from '../i18n/index.ts';
import { openFileObjects } from '../platform/fileLoader.ts';
import {
  activateTab,
  closeTab,
  moveTab,
  useTabs,
} from '../tabs.ts';
import type { TabItem } from '../tabs.ts';

export function TabBar({
  onNewTabClick,
}: {
  onNewTabClick?: () => void;
}) {
  const { t } = useTranslation();
  const { tabs, activeId } = useTabs();
  const stripRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      className={`tab-bar ${tabs.length <= 1 ? 'is-single' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={handleDropFilesOnBar}
    >
      <div
        ref={stripRef}
        className="tab-strip"
        role="tablist"
        aria-label="Open Log Tabs"
      >
        {tabs.map((tab: TabItem, index: number) => {
          const isActive = tab.id === activeId;
          const Icon = tab.kind === 'clipboard' ? IconClipboard : IconFileText;

          return (
            <div
              key={tab.id}
              role="tab"
              tabIndex={0}
              aria-selected={isActive}
              className={`tab ${isActive ? 'is-active' : ''}`}
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
              onClick={() => activateTab(tab.id)}
              onAuxClick={(event) => {
                if (event.button === 1) {
                  event.preventDefault();
                  closeTab(tab.id);
                }
              }}
            >
              <Icon size={14} stroke={1.5} style={{ flex: 'none' }} />
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
    </div>
  );
}
