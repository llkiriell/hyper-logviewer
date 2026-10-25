import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  IconClipboardText,
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
import { desktop } from '../platform/desktop.ts';
import { setPreferences, usePreferences } from '../platform/preferences.ts';
import { createTab, updateTab } from '../tabs.ts';
import type { TabItem } from '../tabs.ts';
import { ContextMenu } from './ContextMenu.tsx';
import type { ContextMenuEntry } from './ContextMenu.tsx';
import { DateFilterPopover } from './DateFilterPopover.tsx';
import { LogDetailModal } from './LogDetailModal.tsx';
import { LogSearchBar, LogToolbar } from './LogToolbar.tsx';
import { StatusBar } from './StatusBar.tsx';
import { VirtualLogRow } from './VirtualLogRow.tsx';

interface VirtualLogViewProps {
  tab: TabItem;
  onOpenSettings?: () => void;
}

export function VirtualLogView({ tab, onOpenSettings }: VirtualLogViewProps) {
  const { t } = useTranslation();
  const prefs = usePreferences();
  const parentRef = useRef<HTMLDivElement>(null);

  // Parse raw tab content into structured lines and summary metrics
  const { lines, stats } = useMemo(() => {
    return parseLogContent(tab.content, prefs.customStandardLevels);
  }, [tab.content, prefs.customStandardLevels]);

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
  const [scrollTop, setScrollTop] = useState(0);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    anchor: DOMRect;
    line: ParsedLogLine;
    selectedText?: string;
  } | null>(null);

  // Single line inspection modal state
  const [detailModalLine, setDetailModalLine] = useState<ParsedLogLine | null>(null);

  // Viewer options
  const [wordWrap, setWordWrap] = useState(prefs.wordWrap);
  const [autoScroll, setAutoScroll] = useState(prefs.autoScrollDefault);

  // Retain position when clearing search
  const lastActiveRawIndexRef = useRef<number | null>(null);
  const [highlightedRawIndex, setHighlightedRawIndex] = useState<number | null>(null);
  const [selectedRawIndex, setSelectedRawIndex] = useState<number | null>(null);

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

  // Virtualizer setup with per-item key tracking to avoid search overlapping
  const rowVirtualizer = useVirtualizer({
    count: filteredLines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 25,
    getItemKey: (index) => filteredLines[index]?.rawIndex ?? index,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Invalidate virtualizer cache when wordWrap, search or lines change so heights adapt immediately
  useEffect(() => {
    rowVirtualizer.measure();
  }, [wordWrap, searchQuery, filteredLines, rowVirtualizer]);

  // Search match navigation handlers
  const activeLocation = searchIndex.locations[currentMatchIndex];

  // Remember active line rawIndex during match navigation
  useEffect(() => {
    if (activeLocation) {
      const matchLine = filteredLines[activeLocation.lineIndex];
      if (matchLine) {
        lastActiveRawIndexRef.current = matchLine.rawIndex;
      }
    }
  }, [activeLocation, filteredLines]);

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

  // Search query change with position preservation on clear
  const handleSearchChange = useCallback(
    (newQuery: string) => {
      const wasSearching = searchQuery.trim().length > 0;
      const isClearing = wasSearching && newQuery.trim().length === 0;
      const targetRawIndex = lastActiveRawIndexRef.current;

      setSearchQuery(newQuery);

      if (isClearing && targetRawIndex !== null) {
        setHighlightedRawIndex(targetRawIndex);
        requestAnimationFrame(() => {
          const targetIndex = lines.findIndex((l) => l.rawIndex === targetRawIndex);
          if (targetIndex !== -1) {
            rowVirtualizer.scrollToIndex(targetIndex, { align: 'center' });
          }
        });
        setTimeout(() => setHighlightedRawIndex(null), 3000);
      }
    },
    [searchQuery, lines, rowVirtualizer],
  );

  // Jump to specific line number
  const handleGoToLine = useCallback(
    (lineNum: number) => {
      const targetIndex = lineNum - 1;
      if (targetIndex >= 0 && targetIndex < filteredLines.length) {
        const targetLine = filteredLines[targetIndex];
        if (targetLine) {
          setHighlightedRawIndex(targetLine.rawIndex);
          rowVirtualizer.scrollToIndex(targetIndex, { align: 'center' });
          setTimeout(() => setHighlightedRawIndex(null), 3000);
        }
      }
    },
    [filteredLines, rowVirtualizer],
  );

  // Continuous auto-scroll animation loop & tailing
  useEffect(() => {
    if (!autoScroll) return;

    if (prefs.autoScrollMode === 'continuous') {
      let animId: number;
      const speedMap = { slow: 0.72, medium: 1.8, fast: 4.2 };
      const pxPerFrame = speedMap[prefs.autoScrollSpeed] ?? 1.8;

      const step = () => {
        if (!parentRef.current) return;
        const el = parentRef.current;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
          animId = requestAnimationFrame(step);
          return;
        }
        el.scrollTop += pxPerFrame;
        animId = requestAnimationFrame(step);
      };

      animId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(animId);
    } else {
      // Live tail mode
      if (filteredLines.length > 0) {
        requestAnimationFrame(() => {
          rowVirtualizer.scrollToIndex(filteredLines.length - 1, {
            align: 'end',
            behavior: prefs.autoScrollSmooth ? 'smooth' : 'auto',
          });
        });
      }
    }
  }, [
    autoScroll,
    prefs.autoScrollMode,
    prefs.autoScrollSpeed,
    prefs.autoScrollSmooth,
    filteredLines.length,
    rowVirtualizer,
  ]);

  // Live file polling when autoScroll is active on a local file
  useEffect(() => {
    const filePath = tab.filePath;
    if (!autoScroll || !filePath || !desktop?.readFile) return;

    const readFileFn = desktop.readFile;
    const interval = setInterval(async () => {
      try {
        const res = await readFileFn(filePath);
        if (res.ok && res.content !== undefined && res.content !== tab.content) {
          updateTab(tab.id, {
            content: res.content,
            size: new Blob([res.content]).size,
            linesCount: res.content.split('\n').length,
          });
        }
      } catch {
        // ignore polling errors
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [autoScroll, tab.filePath, tab.content, tab.id]);

  // Toggle autoscroll
  const handleToggleAutoScroll = useCallback(() => {
    setAutoScroll((prev) => !prev);
  }, []);

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
      const rawSelection = window.getSelection()?.toString() ?? '';
      // Pure clean text without formatting, carriage returns, or metadata
      const selectedText = rawSelection.replace(/\r\n/g, '\n');
      setContextMenu({
        anchor: new DOMRect(event.clientX, event.clientY, 0, 0),
        line,
        selectedText: selectedText.length > 0 ? selectedText : undefined,
      });
    },
    [],
  );

  // Determine whether to show floating sticky pinned bar
  const pinnedInFilteredIndex = useMemo(() => {
    if (!pinnedLine) return -1;
    return filteredLines.findIndex((l) => l.rawIndex === pinnedLine.rawIndex);
  }, [pinnedLine, filteredLines]);

  const showFloatingStickyPin = useMemo(() => {
    if (!pinnedLine) return false;
    if (pinnedInFilteredIndex === -1) return true;
    const rowHeight = 24;
    const pinnedTop = pinnedInFilteredIndex * rowHeight;
    return scrollTop > pinnedTop;
  }, [pinnedLine, pinnedInFilteredIndex, scrollTop]);

  // Helper to resolve color config for a line
  const resolveLineColor = useCallback(
    (line: ParsedLogLine) => {
      if (line.customLevelTag && prefs.customStandardLevels) {
        const found = prefs.customStandardLevels.find(
          (c) => c.word.toLowerCase() === line.customLevelTag!.toLowerCase(),
        );
        if (found) {
          return { textColor: found.textColor, bgColor: found.bgColor };
        }
      }
      return prefs.levelColors[line.level];
    },
    [prefs.customStandardLevels, prefs.levelColors],
  );

  // Build context menu entries
  const contextMenuEntries: ContextMenuEntry[] = useMemo(() => {
    if (!contextMenu) return [];
    const line = contextMenu.line;
    const isPinned = pinnedLine?.rawIndex === line.rawIndex;
    const hasSelection = !!contextMenu.selectedText && contextMenu.selectedText.length > 0;

    const entries: ContextMenuEntry[] = [
      {
        label: t('contextMenu.copySelection'),
        icon: IconCopy,
        disabled: !hasSelection,
        onSelect: () => {
          if (contextMenu.selectedText) {
            void navigator.clipboard.writeText(contextMenu.selectedText);
          }
        },
      },
      {
        label: t('contextMenu.copyLine'),
        icon: IconClipboardText,
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

  const inlineSeverityConfig = useMemo(() => {
    if (!prefs.colorizeInlineSeverity) return undefined;
    return {
      enabled: true,
      levelColors: prefs.levelColors,
      customStandardLevels: prefs.customStandardLevels,
    };
  }, [prefs.colorizeInlineSeverity, prefs.levelColors, prefs.customStandardLevels]);

  return (
    <div className="viewer-container">
      {/* Top Toolbar (chips align to start if bottom search bar is enabled) */}
      <LogToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
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
        showLineSeparator={prefs.showLineSeparator}
        onToggleLineSeparator={() =>
          setPreferences({ showLineSeparator: !prefs.showLineSeparator })
        }
        onScrollToTop={handleScrollToTop}
        onScrollToBottom={handleScrollToBottom}
        hideSearchBar={prefs.bottomSearchBar}
      />

      {/* Viewport wrapper with relative positioning */}
      <div className="viewer-viewport-wrapper">
        {/* Floating Sticky Pinned Header */}
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
              inlineSeverityConfig={inlineSeverityConfig}
              levelColor={resolveLineColor(pinnedLine)}
              showSeparator={prefs.showLineSeparator}
              separatorColor={prefs.lineSeparatorColor}
              wordWrap={wordWrap}
              fontSize={prefs.fontSize}
              isPinned={true}
              isSelected={prefs.highlightActiveLine && selectedRawIndex === pinnedLine.rawIndex}
              rainbowBrackets={prefs.rainbowBrackets}
              highlightGitPipeline={prefs.highlightGitPipeline}
              onTogglePin={handleTogglePin}
              onContextMenu={handleContextMenu}
              onInspectLine={(l) => setDetailModalLine(l)}
              onSelectLine={(l) => setSelectedRawIndex(l.rawIndex)}
            />
          </div>
        )}

        {/* Main Virtualized Log Scroller */}
        <div
          ref={parentRef}
          onScroll={(e) => {
            const currentTop = e.currentTarget.scrollTop;
            if (
              autoScroll &&
              prefs.autoScrollPauseOnManualScroll &&
              currentTop < scrollTop - 20
            ) {
              setAutoScroll(false);
            }
            setScrollTop(currentTop);
          }}
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
                minWidth: wordWrap ? '0' : '100%',
                width: wordWrap ? '100%' : 'max-content',
                maxWidth: wordWrap ? '100%' : undefined,
                position: 'relative',
              }}
            >
              {virtualItems.map((virtualRow) => {
                const line = filteredLines[virtualRow.index];
                if (!line) return null;

                const isMatchOnThisLine =
                  activeLocation && activeLocation.lineIndex === virtualRow.index;
                const activeRange: SearchMatchRange | null = isMatchOnThisLine
                  ? { start: activeLocation.start, end: activeLocation.end }
                  : null;

                const isPinned = pinnedLine?.rawIndex === line.rawIndex;
                const isTarget = contextMenu?.line.rawIndex === line.rawIndex;
                const isHighlighted = highlightedRawIndex === line.rawIndex;

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
                      minWidth: wordWrap ? '0' : '100%',
                      width: wordWrap ? '100%' : 'max-content',
                      maxWidth: wordWrap ? '100%' : undefined,
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
                      inlineSeverityConfig={inlineSeverityConfig}
                      levelColor={resolveLineColor(line)}
                      showSeparator={prefs.showLineSeparator}
                      separatorColor={prefs.lineSeparatorColor}
                      wordWrap={wordWrap}
                      fontSize={prefs.fontSize}
                      isPinned={isPinned}
                      isContextMenuTarget={isTarget}
                      isHighlighted={isHighlighted}
                      isSelected={prefs.highlightActiveLine && selectedRawIndex === line.rawIndex}
                      rainbowBrackets={prefs.rainbowBrackets}
                      highlightGitPipeline={prefs.highlightGitPipeline}
                      onTogglePin={handleTogglePin}
                      onContextMenu={handleContextMenu}
                      onInspectLine={(l) => setDetailModalLine(l)}
                      onSelectLine={(l) => setSelectedRawIndex(l.rawIndex)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Optional Full-width Bottom Search Bar */}
      {prefs.bottomSearchBar && (
        <div className="bottom-search-wrapper">
          <LogSearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            isRegex={isRegex}
            onToggleRegex={() => setIsRegex((prev) => !prev)}
            caseSensitive={caseSensitive}
            onToggleCaseSensitive={() => setCaseSensitive((prev) => !prev)}
            totalMatches={searchIndex.totalMatches}
            currentMatchIndex={currentMatchIndex}
            onNextMatch={handleNextMatch}
            onPrevMatch={handlePrevMatch}
            isBottom={true}
          />
        </div>
      )}

      {/* Status Bar */}
      <StatusBar
        totalLines={lines.length}
        filteredLines={filteredLines.length}
        fileSize={tab.size}
        filePath={tab.filePath}
        encoding="UTF-8"
        wordWrap={wordWrap}
        onToggleWordWrap={() => setWordWrap((prev) => !prev)}
        autoScroll={autoScroll}
        onToggleAutoScroll={handleToggleAutoScroll}
        onGoToLine={handleGoToLine}
        onOpenSettings={onOpenSettings}
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
          allLines={lines}
          onClose={() => setDetailModalLine(null)}
        />
      )}
    </div>
  );
}
