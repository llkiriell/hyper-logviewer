import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { parseLogContent } from '../../core/parser.ts';
import { filterLines } from '../../core/search.ts';
import type { LogLevel } from '../../core/types.ts';
import { useTranslation } from '../i18n/index.ts';
import { usePreferences } from '../platform/preferences.ts';
import type { TabItem } from '../tabs.ts';
import { LogToolbar } from './LogToolbar.tsx';
import { StatusBar } from './StatusBar.tsx';
import { VirtualLogRow } from './VirtualLogRow.tsx';

interface VirtualLogViewProps {
  tab: TabItem;
}

export function VirtualLogView({ tab }: VirtualLogViewProps) {
  const { t } = useTranslation();
  const prefs = usePreferences();
  const parentRef = useRef<HTMLDivElement>(null);

  // Parse raw tab content into structured lines and summary metrics
  const { lines, stats } = useMemo(() => {
    return parseLogContent(tab.content);
  }, [tab.content]);

  // Filtering & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');

  // Viewer options
  const [wordWrap, setWordWrap] = useState(prefs.wordWrap);
  const [autoScroll, setAutoScroll] = useState(false);

  // Compute filtered log lines
  const filteredLines = useMemo(() => {
    return filterLines(lines, {
      level: levelFilter,
      searchQuery,
      isRegex,
      caseSensitive,
    });
  }, [lines, levelFilter, searchQuery, isRegex, caseSensitive]);

  // Virtualizer setup
  const rowVirtualizer = useVirtualizer({
    count: filteredLines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 25,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Scroll to bottom when autoScroll is enabled
  useEffect(() => {
    if (autoScroll && filteredLines.length > 0) {
      rowVirtualizer.scrollToIndex(filteredLines.length - 1, { align: 'end' });
    }
  }, [autoScroll, filteredLines.length, rowVirtualizer]);

  // Scroll handlers
  const handleScrollToTop = useCallback(() => {
    setAutoScroll(false);
    rowVirtualizer.scrollToIndex(0, { align: 'start' });
  }, [rowVirtualizer]);

  const handleScrollToBottom = useCallback(() => {
    if (filteredLines.length > 0) {
      rowVirtualizer.scrollToIndex(filteredLines.length - 1, { align: 'end' });
    }
  }, [filteredLines.length, rowVirtualizer]);

  return (
    <div className="viewer-container">
      {/* Search, Filter Chips & Navigation Toolbar */}
      <LogToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isRegex={isRegex}
        onToggleRegex={() => setIsRegex((prev) => !prev)}
        caseSensitive={caseSensitive}
        onToggleCaseSensitive={() => setCaseSensitive((prev) => !prev)}
        levelFilter={levelFilter}
        onLevelFilterChange={setLevelFilter}
        stats={stats}
        wordWrap={wordWrap}
        onToggleWordWrap={() => setWordWrap((prev) => !prev)}
        autoScroll={autoScroll}
        onToggleAutoScroll={() => setAutoScroll((prev) => !prev)}
        onScrollToTop={handleScrollToTop}
        onScrollToBottom={handleScrollToBottom}
      />

      {/* Main Virtualized Log Scroller */}
      <div
        ref={parentRef}
        className={`viewer-scroller ${wordWrap ? 'is-wrapped' : 'is-nowrap'}`}
      >
        {filteredLines.length === 0 ? (
          <div className="viewer-empty">
            <p>
              {lines.length === 0
                ? t('viewer.emptyLog')
                : t('viewer.noMatches')}
            </p>
          </div>
        ) : (
          <div
            className="viewer-virtual-canvas"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualRow) => {
              const line = filteredLines[virtualRow.index];
              if (!line) return null;

              return (
                <div
                  key={line.rawIndex}
                  ref={wordWrap ? rowVirtualizer.measureElement : undefined}
                  data-index={virtualRow.index}
                  className="viewer-virtual-row-wrapper"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <VirtualLogRow
                    line={line}
                    searchQuery={searchQuery}
                    isRegex={isRegex}
                    caseSensitive={caseSensitive}
                    wordWrap={wordWrap}
                    fontSize={prefs.fontSize}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <StatusBar
        totalLines={lines.length}
        filteredLines={filteredLines.length}
        fileSize={tab.size}
        encoding="UTF-8"
        wordWrap={wordWrap}
        onToggleWordWrap={() => setWordWrap((prev) => !prev)}
        autoScroll={autoScroll}
        onToggleAutoScroll={() => setAutoScroll((prev) => !prev)}
      />
    </div>
  );
}
