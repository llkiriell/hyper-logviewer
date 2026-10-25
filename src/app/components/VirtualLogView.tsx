import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  IconCopy,
  IconEye,
  IconFileExport,
  IconFilter,
  IconPin,
  IconPinFilled,
  IconX,
} from '@tabler/icons-react';
import { parseLogContent } from '../../core/parser.ts';
import { filterLines, indexSearchMatches } from '../../core/search.ts';
import type {
  DateRangeFilter,
  LogLevel,
  ParsedLogLine,
  SearchMatchRange,
} from '../../core/types.ts';
import { useTranslation } from '../i18n/index.ts';
import { usePreferences } from '../platform/preferences.ts';
import { createTab } from '../tabs.ts';
import type { TabItem } from '../tabs.ts';
import { ContextMenu } from './ContextMenu.tsx';
import type { ContextMenuEntry } from './ContextMenu.tsx';
import { DateFilterPopover } from './DateFilterPopover.tsx';
import { LogDetailModal } from './LogDetailModal.tsx';
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
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({
    enabled: false,
    mode: 'range',
  });

  // Date Filter Popover anchor
  const [dateAnchor, setDateAnchor] = useState<HTMLElement | null>(null);

  // Pinned line state
  const [pinnedLine, setPinnedLine] = useState<ParsedLogLine | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    anchor: DOMRect;
    line: ParsedLogLine;
  } | null>(null);

  // Single line inspection modal state
  const [detailModalLine, setDetailModalLine] = useState<ParsedLogLine | null>(null);

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
      dateFilter,
    });
  }, [lines, levelFilter, searchQuery, isRegex, caseSensitive, dateFilter]);

  // Index search matches across filtered lines for navigation
  const searchIndex = useMemo(() => {
    return indexSearchMatches(filteredLines, searchQuery, isRegex, caseSensitive);
  }, [filteredLines, searchQuery, isRegex, caseSensitive]);

  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  // Reset match index when query or filtered lines change
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery, isRegex, caseSensitive, levelFilter, dateFilter]);

  // Virtualizer setup
  const rowVirtualizer = useVirtualizer({
    count: filteredLines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 25,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Search match navigation handlers
  const activeLocation = searchIndex.locations[currentMatchIndex];

  const handleNextMatch = useCallback(() => {
    if (searchIndex.totalMatches === 0) return;
    const next = (currentMatchIndex + 1) % searchIndex.totalMatches;
    setCurrentMatchIndex(next);
    const loc = searchIndex.locations[next];
    if (loc) {
      rowVirtualizer.scrollToIndex(loc.lineIndex, { align: 'center' });
    }
  }, [currentMatchIndex, searchIndex, rowVirtualizer]);

  const handlePrevMatch = useCallback(() => {
    if (searchIndex.totalMatches === 0) return;
    const prev =
      (currentMatchIndex - 1 + searchIndex.totalMatches) % searchIndex.totalMatches;
    setCurrentMatchIndex(prev);
    const loc = searchIndex.locations[prev];
    if (loc) {
      rowVirtualizer.scrollToIndex(loc.lineIndex, { align: 'center' });
    }
  }, [currentMatchIndex, searchIndex, rowVirtualizer]);

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

  // Extract by date to a brand new tab
  const handleExtractDateToTab = useCallback(
    (targetDate: string) => {
      const matching = lines.filter((l) => l.dateKey === targetDate);
      if (matching.length === 0) return;

      const newContent = matching.map((l) => l.raw).join('\n');
      const baseTitle = tab.title.replace(/\s\(\d{4}-\d{2}-\d{2}\)$/, '');
      createTab({
        title: `${baseTitle} (${targetDate})`,
        content: newContent,
        kind: 'segment',
      });
    },
    [lines, tab.title],
  );

  // Pin toggle
  const handleTogglePin = useCallback((line: ParsedLogLine) => {
    setPinnedLine((prev) => (prev?.rawIndex === line.rawIndex ? null : line));
  }, []);

  // Context menu trigger
  const handleContextMenu = useCallback(
    (event: React.MouseEvent, line: ParsedLogLine) => {
      event.preventDefault();
      setContextMenu({
        anchor: new DOMRect(event.clientX, event.clientY, 0, 0),
        line,
      });
    },
    [],
  );

  // Determine whether to show floating sticky pinned bar
  // Pinned line only floats when the user scrolls down past its original position
  const pinnedInFilteredIndex = useMemo(() => {
    if (!pinnedLine) return -1;
    return filteredLines.findIndex((l) => l.rawIndex === pinnedLine.rawIndex);
  }, [pinnedLine, filteredLines]);

  const showFloatingStickyPin = useMemo(() => {
    if (!pinnedLine || pinnedInFilteredIndex === -1) return false;
    const firstVisible = virtualItems[0];
    if (!firstVisible) return false;
    return firstVisible.index > pinnedInFilteredIndex;
  }, [pinnedLine, pinnedInFilteredIndex, virtualItems]);

  // Build context menu entries
  const contextMenuEntries: ContextMenuEntry[] = useMemo(() => {
    if (!contextMenu) return [];
    const line = contextMenu.line;
    const isPinned = pinnedLine?.rawIndex === line.rawIndex;

    const entries: ContextMenuEntry[] = [
      {
        label: t('contextMenu.copyLine'),
        icon: IconCopy,
        shortcut: 'Ctrl+C',
        onSelect: () => void navigator.clipboard.writeText(line.raw),
      },
      {
        label: isPinned ? t('contextMenu.unpinLine') : t('contextMenu.pinLine'),
        icon: isPinned ? IconPinFilled : IconPin,
        onSelect: () => handleTogglePin(line),
      },
      { separator: true },
      {
        label: t('contextMenu.inspectLine'),
        icon: IconEye,
        onSelect: () => setDetailModalLine(line),
      },
    ];

    if (line.dateKey) {
      entries.push({ separator: true });
      entries.push({
        label: t('contextMenu.filterByDate', { date: line.dateKey }),
        icon: IconFilter,
        onSelect: () => {
          setDateFilter({
            enabled: true,
            mode: 'single',
            singleDate: line.dateKey,
          });
        },
      });
      entries.push({
        label: t('contextMenu.extractByDate', { date: line.dateKey }),
        icon: IconFileExport,
        onSelect: () => {
          if (line.dateKey) handleExtractDateToTab(line.dateKey);
        },
      });
    }

    return entries;
  }, [contextMenu, pinnedLine, t, handleTogglePin, handleExtractDateToTab]);

  return (
    <div className="viewer-container">
      {/* Search, Filter Chips, Date Filter & Navigation Toolbar */}
      <LogToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isRegex={isRegex}
        onToggleRegex={() => setIsRegex((prev) => !prev)}
        caseSensitive={caseSensitive}
        onToggleCaseSensitive={() => setCaseSensitive((prev) => !prev)}
        totalMatches={searchIndex.totalMatches}
        currentMatchIndex={currentMatchIndex}
        onNextMatch={handleNextMatch}
        onPrevMatch={handlePrevMatch}
        levelFilter={levelFilter}
        onLevelFilterChange={setLevelFilter}
        stats={stats}
        isDateFilterActive={dateFilter.enabled}
        onOpenDateFilter={(anchor) => setDateAnchor(anchor)}
        wordWrap={wordWrap}
        onToggleWordWrap={() => setWordWrap((prev) => !prev)}
        autoScroll={autoScroll}
        onToggleAutoScroll={() => setAutoScroll((prev) => !prev)}
        onScrollToTop={handleScrollToTop}
        onScrollToBottom={handleScrollToBottom}
      />

      {/* Floating Sticky Pinned Header (appears when scrolled past pinned line) */}
      {showFloatingStickyPin && pinnedLine && (
        <div className="sticky-pinned-bar">
          <div className="sticky-pinned-header">
            <span className="sticky-pinned-title">
              <IconPinFilled size={13} stroke={1.5} />
              <span>{t('viewer.pinnedHeader')}</span>
            </span>
            <button
              type="button"
              className="sticky-unpin-btn"
              onClick={() => setPinnedLine(null)}
              title={t('viewer.unpinLine')}
            >
              <IconX size={14} stroke={1.5} />
            </button>
          </div>
          <VirtualLogRow
            line={pinnedLine}
            searchQuery={searchQuery}
            isRegex={isRegex}
            caseSensitive={caseSensitive}
            customRules={prefs.customHighlights}
            levelColor={prefs.levelColors[pinnedLine.level]}
            showSeparator={prefs.showLineSeparator}
            separatorColor={prefs.lineSeparatorColor}
            wordWrap={wordWrap}
            fontSize={prefs.fontSize}
            isPinned={true}
            onTogglePin={handleTogglePin}
            onContextMenu={handleContextMenu}
          />
        </div>
      )}

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

              // Check if active match is on this line
              const isMatchOnThisLine =
                activeLocation && activeLocation.lineIndex === virtualRow.index;
              const activeRange: SearchMatchRange | null = isMatchOnThisLine
                ? { start: activeLocation.start, end: activeLocation.end }
                : null;

              const isPinned = pinnedLine?.rawIndex === line.rawIndex;

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
                    activeSearchRange={activeRange}
                    customRules={prefs.customHighlights}
                    levelColor={prefs.levelColors[line.level]}
                    showSeparator={prefs.showLineSeparator}
                    separatorColor={prefs.lineSeparatorColor}
                    wordWrap={wordWrap}
                    fontSize={prefs.fontSize}
                    isPinned={isPinned}
                    onTogglePin={handleTogglePin}
                    onContextMenu={handleContextMenu}
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

      {/* Date Filter Popover */}
      {dateAnchor && (
        <DateFilterPopover
          anchor={dateAnchor}
          onClose={() => setDateAnchor(null)}
          filter={dateFilter}
          onChange={setDateFilter}
          minDate={stats.minDate}
          maxDate={stats.maxDate}
          onExtractDateToTab={handleExtractDateToTab}
        />
      )}

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <ContextMenu
          anchor={contextMenu.anchor}
          entries={contextMenuEntries}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Single Line Detail & Formatted JSON Modal */}
      {detailModalLine && (
        <LogDetailModal
          line={detailModalLine}
          onClose={() => setDetailModalLine(null)}
        />
      )}
    </div>
  );
}
