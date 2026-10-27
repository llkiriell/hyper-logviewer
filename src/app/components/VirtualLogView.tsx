import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  IconClipboardText,
  IconCopy,
  IconEye,
  IconFileExport,
  IconFilter,
  IconPin,
  IconPinFilled,
  IconSearch,
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
  const [filterMatchesOnly, setFilterMatchesOnly] = useState(false);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [hideSeverityBgTemporary, setHideSeverityBgTemporary] = useState(false);
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

  // Retain position and active focus across filters and search
  const lastActiveRawIndexRef = useRef<number | null>(null);
  const [selectedRawIndex, setSelectedRawIndex] = useState<number | null>(null);
  const [selectedRawIndices, setSelectedRawIndices] = useState<Set<number>>(new Set());
  const pendingFunnelToggleRef = useRef<{ activeRawIndex: number | null } | null>(null);
  const pendingSearchClearRef = useRef<{ targetRawIndex: number | null } | null>(null);

  // Compute filtered log lines
  const filteredLines = useMemo(() => {
    return filterLines(lines, {
      level: levelFilter,
      searchQuery,
      isRegex,
      caseSensitive,
      filterMatchesOnly,
      dateFilter,
    });
  }, [lines, levelFilter, searchQuery, isRegex, caseSensitive, filterMatchesOnly, dateFilter]);

  // Index search matches across filtered lines for navigation
  const searchIndex = useMemo(() => {
    return indexSearchMatches(filteredLines, searchQuery, isRegex, caseSensitive);
  }, [filteredLines, searchQuery, isRegex, caseSensitive]);

  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  // Reset match index when query or filtered lines change
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery, isRegex, caseSensitive, filterMatchesOnly, levelFilter, dateFilter]);

  // Virtualizer setup with per-item key tracking and real DOM measurements
  const rowVirtualizer = useVirtualizer({
    count: filteredLines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: filteredLines.length > 1500 ? 50 : 35,
    getItemKey: (index) => {
      const line = filteredLines[index];
      return `${line?.rawIndex ?? index}-${wordWrap ? 'w' : 'nw'}`;
    },
    measureElement: (element, entry) => {
      if (!element) return 24;
      if (entry?.borderBoxSize?.[0]) {
        const size = Math.round(entry.borderBoxSize[0].blockSize);
        if (size > 0) return size;
      }
      const rectHeight = Math.ceil(element.getBoundingClientRect().height);
      if (rectHeight > 0) return rectHeight;
      return (element as HTMLElement).offsetHeight || 24;
    },
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Invalidate virtualizer cache ONLY when wordWrap or font size changes (never on search or line filtering)
  useLayoutEffect(() => {
    rowVirtualizer.measure();
  }, [wordWrap, prefs.fontSize, rowVirtualizer]);

  // Recalculate heights on scroller width resize when word wrap is enabled
  useEffect(() => {
    if (!wordWrap || !parentRef.current) return;
    const observer = new ResizeObserver(() => {
      rowVirtualizer.measure();
    });
    observer.observe(parentRef.current);
    return () => observer.disconnect();
  }, [wordWrap, rowVirtualizer]);

  // Auto-focus on first match when searching without funnel filter
  const prevSearchTriggerRef = useRef<{
    query: string;
    filterOnly: boolean;
    isRegex: boolean;
    caseSensitive: boolean;
  }>({
    query: '',
    filterOnly: false,
    isRegex: false,
    caseSensitive: false,
  });

  useEffect(() => {
    const prev = prevSearchTriggerRef.current;
    const queryChanged = prev.query !== searchQuery;
    const filterChanged = prev.filterOnly !== filterMatchesOnly;
    const regexChanged = prev.isRegex !== isRegex;
    const caseChanged = prev.caseSensitive !== caseSensitive;

    prevSearchTriggerRef.current = {
      query: searchQuery,
      filterOnly: filterMatchesOnly,
      isRegex,
      caseSensitive,
    };

    if (
      (queryChanged || filterChanged || regexChanged || caseChanged) &&
      searchQuery.trim().length > 0 &&
      !filterMatchesOnly
    ) {
      if (searchIndex.totalMatches > 0 && searchIndex.locations[0]) {
        const firstLoc = searchIndex.locations[0];
        const targetLine = filteredLines[firstLoc.lineIndex];
        if (targetLine) {
          setSelectedRawIndex(targetLine.rawIndex);
          setSelectedRawIndices(new Set([targetLine.rawIndex]));
          setCurrentMatchIndex(0);
          rowVirtualizer.scrollToIndex(firstLoc.lineIndex, { align: 'center' });
        }
      }
    }
  }, [searchQuery, filterMatchesOnly, isRegex, caseSensitive, searchIndex, filteredLines, rowVirtualizer]);

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
      const targetLine = filteredLines[loc.lineIndex];
      if (targetLine) {
        setSelectedRawIndex(targetLine.rawIndex);
        setSelectedRawIndices(new Set([targetLine.rawIndex]));
        lastActiveRawIndexRef.current = targetLine.rawIndex;
      }
    }
  }, [currentMatchIndex, searchIndex, filteredLines, rowVirtualizer]);

  const handlePrevMatch = useCallback(() => {
    if (searchIndex.totalMatches === 0) return;
    const prev =
      (currentMatchIndex - 1 + searchIndex.totalMatches) % searchIndex.totalMatches;
    setCurrentMatchIndex(prev);
    const loc = searchIndex.locations[prev];
    if (loc) {
      rowVirtualizer.scrollToIndex(loc.lineIndex, { align: 'center' });
      const targetLine = filteredLines[loc.lineIndex];
      if (targetLine) {
        setSelectedRawIndex(targetLine.rawIndex);
        setSelectedRawIndices(new Set([targetLine.rawIndex]));
        lastActiveRawIndexRef.current = targetLine.rawIndex;
      }
    }
  }, [currentMatchIndex, searchIndex, filteredLines, rowVirtualizer]);

  // Search query change with focus and scroll preservation on clear (prioritizes focused selected line)
  const handleSearchChange = useCallback(
    (newQuery: string) => {
      const wasSearching = searchQuery.trim().length > 0;
      const isClearing = wasSearching && newQuery.trim().length === 0;
      const targetRawIndex = selectedRawIndex ?? lastActiveRawIndexRef.current;

      setSearchQuery(newQuery);

      if (isClearing && targetRawIndex !== null) {
        pendingSearchClearRef.current = { targetRawIndex };
      }
    },
    [searchQuery, selectedRawIndex],
  );

  // Synchronize focus and scroll when search query is cleared
  useEffect(() => {
    if (!pendingSearchClearRef.current) return;
    const { targetRawIndex } = pendingSearchClearRef.current;
    pendingSearchClearRef.current = null;

    if (targetRawIndex !== null && filteredLines.length > 0) {
      let targetIdx = filteredLines.findIndex((l) => l.rawIndex === targetRawIndex);
      if (targetIdx === -1) targetIdx = 0;
      const targetLine = filteredLines[targetIdx];
      if (targetLine) {
        setSelectedRawIndex(targetLine.rawIndex);
        setSelectedRawIndices(new Set([targetLine.rawIndex]));
        lastActiveRawIndexRef.current = targetLine.rawIndex;
        rowVirtualizer.scrollToIndex(targetIdx, { align: 'center', behavior: 'auto' });
        requestAnimationFrame(() => {
          rowVirtualizer.scrollToIndex(targetIdx, { align: 'center', behavior: 'auto' });
        });
      }
    }
  }, [searchQuery, filteredLines, rowVirtualizer]);

  // Toggle filterMatchesOnly (embudo) preserving active match focus and scrolling directly to it
  const handleToggleFilterMatchesOnly = useCallback(() => {
    const targetRawIndex =
      selectedRawIndex ??
      (activeLocation ? filteredLines[activeLocation.lineIndex]?.rawIndex : null) ??
      lastActiveRawIndexRef.current;

    pendingFunnelToggleRef.current = {
      activeRawIndex: targetRawIndex,
    };

    setFilterMatchesOnly((prev) => !prev);
  }, [selectedRawIndex, activeLocation, filteredLines]);

  // Synchronize focus and scroll when filterMatchesOnly toggles (using fresh filteredLines)
  useEffect(() => {
    if (!pendingFunnelToggleRef.current) return;
    const { activeRawIndex } = pendingFunnelToggleRef.current;
    pendingFunnelToggleRef.current = null;

    if (filteredLines.length === 0) return;

    let targetIdx = -1;
    if (activeRawIndex !== null) {
      targetIdx = filteredLines.findIndex((l) => l.rawIndex === activeRawIndex);
    }
    if (targetIdx === -1) {
      targetIdx = 0;
    }

    const targetLine = filteredLines[targetIdx];
    if (targetLine) {
      setSelectedRawIndex(targetLine.rawIndex);
      setSelectedRawIndices(new Set([targetLine.rawIndex]));
      lastActiveRawIndexRef.current = targetLine.rawIndex;

      rowVirtualizer.scrollToIndex(targetIdx, { align: 'center', behavior: 'auto' });
      requestAnimationFrame(() => {
        rowVirtualizer.scrollToIndex(targetIdx, { align: 'center', behavior: 'auto' });
      });
    }
  }, [filterMatchesOnly, filteredLines, rowVirtualizer]);

  // Toggle word wrap preserving focused or geometrical center line on screen and re-measuring accurately
  const handleToggleWordWrap = useCallback(() => {
    let targetIndex = -1;

    // 1. Prioritize line currently selected with focus
    if (selectedRawIndex !== null) {
      targetIndex = filteredLines.findIndex((l) => l.rawIndex === selectedRawIndex);
    }

    // 2. Otherwise use the geometrical center line currently in the viewport
    if (targetIndex === -1 && parentRef.current) {
      const scroller = parentRef.current;
      const centerY = scroller.scrollTop + scroller.clientHeight / 2;
      const items = rowVirtualizer.getVirtualItems();
      const centerItem =
        items.find((v) => centerY >= v.start && centerY <= v.start + v.size) ??
        items[Math.floor(items.length / 2)];
      if (centerItem) {
        targetIndex = centerItem.index;
      }
    }

    if (targetIndex === -1 && filteredLines.length > 0) {
      targetIndex = 0;
    }

    setWordWrap((prev) => !prev);

    requestAnimationFrame(() => {
      rowVirtualizer.measure();
      if (targetIndex !== -1) {
        rowVirtualizer.scrollToIndex(targetIndex, { align: 'center', behavior: 'auto' });
        requestAnimationFrame(() => {
          rowVirtualizer.scrollToIndex(targetIndex, { align: 'center', behavior: 'auto' });
        });
      }
    });
  }, [selectedRawIndex, filteredLines, rowVirtualizer]);

  // Multi-selection line handler supporting Ctrl/Cmd key
  const handleSelectLine = useCallback(
    (line: ParsedLogLine, event?: React.MouseEvent) => {
      if (event?.ctrlKey || event?.metaKey) {
        setSelectedRawIndices((prev) => {
          const next = new Set(prev);
          if (next.has(line.rawIndex)) {
            next.delete(line.rawIndex);
            if (selectedRawIndex === line.rawIndex) {
              const remaining = Array.from(next);
              setSelectedRawIndex(remaining[remaining.length - 1] ?? null);
            }
          } else {
            next.add(line.rawIndex);
            setSelectedRawIndex(line.rawIndex);
            lastActiveRawIndexRef.current = line.rawIndex;
          }
          return next;
        });
      } else {
        setSelectedRawIndices(new Set([line.rawIndex]));
        setSelectedRawIndex(line.rawIndex);
        lastActiveRawIndexRef.current = line.rawIndex;
      }
    },
    [selectedRawIndex],
  );

  // Jump to specific line number
  const handleGoToLine = useCallback(
    (lineNum: number) => {
      const targetIndex = lineNum - 1;
      if (targetIndex >= 0 && targetIndex < filteredLines.length) {
        const targetLine = filteredLines[targetIndex];
        if (targetLine) {
          setSelectedRawIndex(targetLine.rawIndex);
          setSelectedRawIndices(new Set([targetLine.rawIndex]));
          lastActiveRawIndexRef.current = targetLine.rawIndex;
          rowVirtualizer.scrollToIndex(targetIndex, { align: 'center', behavior: 'auto' });
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
    if (filteredLines.length > 0 && filteredLines[0]) {
      setSelectedRawIndex(filteredLines[0].rawIndex);
      setSelectedRawIndices(new Set([filteredLines[0].rawIndex]));
      rowVirtualizer.scrollToIndex(0, { align: 'start' });
    }
  }, [filteredLines, rowVirtualizer]);

  const handleScrollToBottom = useCallback(() => {
    if (filteredLines.length > 0) {
      const lastLine = filteredLines[filteredLines.length - 1];
      if (lastLine) {
        setSelectedRawIndex(lastLine.rawIndex);
        setSelectedRawIndices(new Set([lastLine.rawIndex]));
        rowVirtualizer.scrollToIndex(filteredLines.length - 1, { align: 'end' });
      }
    }
  }, [filteredLines, rowVirtualizer]);

  // Physical keyboard arrow navigation (line by line without browser window scroll)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('.dialog-scrim'))
      ) {
        return;
      }

      // Copy multi-selected lines on Ctrl+C / Cmd+C when no browser text selection exists
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const nativeSel = window.getSelection()?.toString();
        if (!nativeSel && selectedRawIndices.size > 0) {
          const selectedText = filteredLines
            .filter((l) => selectedRawIndices.has(l.rawIndex))
            .map((l) => l.raw)
            .join('\n');
          if (selectedText) {
            e.preventDefault();
            void navigator.clipboard.writeText(selectedText);
          }
        }
        return;
      }

      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

      if (detailModalLine !== null || filteredLines.length === 0) return;

      e.preventDefault();

      const scroller = parentRef.current;
      const vItems = rowVirtualizer.getVirtualItems();
      const visible =
        scroller && vItems.length > 0
          ? vItems.filter(
              (v) =>
                v.start + v.size > scroller.scrollTop &&
                v.start < scroller.scrollTop + scroller.clientHeight,
            )
          : [];

      if (selectedRawIndex === null) {
        if (e.key === 'ArrowUp') {
          // Focus on the second visible line (just below the toolbar and severity tags)
          const second = visible[1];
          const first = visible[0];
          const chosen = second ?? first;
          if (chosen) {
            const line = filteredLines[chosen.index];
            if (line) {
              setSelectedRawIndex(line.rawIndex);
              setSelectedRawIndices(new Set([line.rawIndex]));
              rowVirtualizer.scrollToIndex(chosen.index, { align: 'auto' });
            }
          }
        } else if (e.key === 'ArrowDown') {
          // Focus starts from the penultimate visible line
          const penultimate = visible.length >= 2 ? visible[visible.length - 2] : undefined;
          const last = visible[visible.length - 1];
          const first = visible[0];
          const chosen = penultimate ?? last ?? first;
          if (chosen) {
            const line = filteredLines[chosen.index];
            if (line) {
              setSelectedRawIndex(line.rawIndex);
              setSelectedRawIndices(new Set([line.rawIndex]));
              rowVirtualizer.scrollToIndex(chosen.index, { align: 'auto' });
            }
          }
        }
      } else {
        const curIdx = filteredLines.findIndex((l) => l.rawIndex === selectedRawIndex);
        if (e.key === 'ArrowUp') {
          const targetIdx = curIdx > 0 ? curIdx - 1 : 0;
          if (filteredLines[targetIdx]) {
            setSelectedRawIndex(filteredLines[targetIdx].rawIndex);
            setSelectedRawIndices(new Set([filteredLines[targetIdx].rawIndex]));
            rowVirtualizer.scrollToIndex(targetIdx, { align: 'auto' });
          }
        } else if (e.key === 'ArrowDown') {
          const targetIdx =
            curIdx >= 0 && curIdx < filteredLines.length - 1
              ? curIdx + 1
              : filteredLines.length - 1;
          if (filteredLines[targetIdx]) {
            setSelectedRawIndex(filteredLines[targetIdx].rawIndex);
            setSelectedRawIndices(new Set([filteredLines[targetIdx].rawIndex]));
            rowVirtualizer.scrollToIndex(targetIdx, { align: 'auto' });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailModalLine, filteredLines, selectedRawIndex, selectedRawIndices, rowVirtualizer]);

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

  // Jump/scroll to pinned line position in the virtualized log list
  const handleScrollToPinnedLine = useCallback(() => {
    if (!pinnedLine) return;
    const targetIdx = filteredLines.findIndex((l) => l.rawIndex === pinnedLine.rawIndex);
    if (targetIdx !== -1) {
      rowVirtualizer.scrollToIndex(targetIdx, { align: 'center' });
      setSelectedRawIndex(pinnedLine.rawIndex);
    }
  }, [pinnedLine, filteredLines, rowVirtualizer]);

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

  const effectiveShowSeverityBg = prefs.showSeverityBackground && !hideSeverityBgTemporary;

  // Helper to resolve color config for a line
  const resolveLineColor = useCallback(
    (line: ParsedLogLine) => {
      if (!effectiveShowSeverityBg) {
        if (line.customLevelTag && prefs.customStandardLevels) {
          const found = prefs.customStandardLevels.find(
            (c) => c.word.toLowerCase() === line.customLevelTag!.toLowerCase(),
          );
          if (found) {
            return { textColor: found.textColor, bgColor: 'transparent' };
          }
        }
        const baseColor = prefs.levelColors[line.level];
        return { ...baseColor, bgColor: 'transparent' };
      }

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
    [prefs.customStandardLevels, prefs.levelColors, effectiveShowSeverityBg],
  );

  // Build context menu entries
  const contextMenuEntries: ContextMenuEntry[] = useMemo(() => {
    if (!contextMenu) return [];
    const line = contextMenu.line;
    const isPinned = pinnedLine?.rawIndex === line.rawIndex;
    const hasSelection = !!contextMenu.selectedText && contextMenu.selectedText.length > 0;
    const isMultiple = selectedRawIndices.size > 1;

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
        label: t('contextMenu.searchSelection'),
        icon: IconSearch,
        disabled: !hasSelection,
        onSelect: () => {
          if (contextMenu.selectedText) {
            handleSearchChange(contextMenu.selectedText);
          }
        },
      },
      isMultiple
        ? {
            label: t('contextMenu.copySelectedLines', { count: selectedRawIndices.size }),
            icon: IconClipboardText,
            shortcut: 'Ctrl+C',
            onSelect: () => {
              const selectedText = filteredLines
                .filter((l) => selectedRawIndices.has(l.rawIndex))
                .map((l) => l.raw)
                .join('\n');
              void navigator.clipboard.writeText(selectedText);
            },
          }
        : {
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
  }, [
    contextMenu,
    pinnedLine,
    selectedRawIndices,
    filteredLines,
    t,
    handleTogglePin,
    handleExtractDateToTab,
    handleSearchChange,
  ]);

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
        filterMatchesOnly={filterMatchesOnly}
        onToggleFilterMatchesOnly={handleToggleFilterMatchesOnly}
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
        onToggleWordWrap={handleToggleWordWrap}
        showSeverityBg={effectiveShowSeverityBg}
        onToggleSeverityBg={() => setHideSeverityBgTemporary((prev) => !prev)}
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
          <div
            className="sticky-pinned-bar"
            onDoubleClick={handleScrollToPinnedLine}
          >
            <div
              className="sticky-pinned-header"
              onDoubleClick={handleScrollToPinnedLine}
              title={t('viewer.jumpToPinned')}
            >
              <span className="sticky-pinned-title">
                <IconPinFilled size={13} stroke={1.5} />
                <span>{t('viewer.pinnedHeader')}</span>
                <span className="sticky-pinned-badge">#{pinnedLine.lineNumber}</span>
              </span>
              <button
                type="button"
                className="sticky-unpin-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setPinnedLine(null);
                }}
                title={t('viewer.unpinLine')}
              >
                <IconX size={14} stroke={1.5} />
              </button>
            </div>
            <div onDoubleClick={handleScrollToPinnedLine}>
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
                separatorWidth={prefs.lineSeparatorWidth}
                wordWrap={wordWrap}
                fontSize={prefs.fontSize}
                isPinned={true}
                isSelected={prefs.highlightActiveLine && selectedRawIndices.has(pinnedLine.rawIndex)}
                activeLineIcon={prefs.activeLineIcon}
                focusBackgroundMode={prefs.focusBackgroundMode}
                customFocusBackgroundColor={prefs.customFocusBackgroundColor}
                rainbowBrackets={prefs.rainbowBrackets}
                highlightGitPipeline={prefs.highlightGitPipeline}
                onTogglePin={handleTogglePin}
                onContextMenu={handleContextMenu}
                onInspectLine={(l) => setDetailModalLine(l)}
                onSelectLine={handleSelectLine}
              />
            </div>
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
          className={`viewer-scroller ${wordWrap ? 'is-wrapped' : 'is-nowrap'} ${!effectiveShowSeverityBg ? 'hide-severity-bg' : ''}`}
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
                const isSelected = prefs.highlightActiveLine && selectedRawIndices.has(line.rawIndex);

                let selectionBlockPosition: 'single' | 'top' | 'middle' | 'bottom' | null = null;
                if (isSelected) {
                  const prevLine = filteredLines[virtualRow.index - 1];
                  const nextLine = filteredLines[virtualRow.index + 1];
                  const isPrevSelected = prevLine ? selectedRawIndices.has(prevLine.rawIndex) : false;
                  const isNextSelected = nextLine ? selectedRawIndices.has(nextLine.rawIndex) : false;

                  if (!isPrevSelected && !isNextSelected) {
                    selectionBlockPosition = 'single';
                  } else if (!isPrevSelected && isNextSelected) {
                    selectionBlockPosition = 'top';
                  } else if (isPrevSelected && isNextSelected) {
                    selectionBlockPosition = 'middle';
                  } else {
                    selectionBlockPosition = 'bottom';
                  }
                }

                return (
                  <div
                    key={`${line.rawIndex}-${virtualRow.index}-${wordWrap ? 'w' : 'nw'}`}
                    ref={rowVirtualizer.measureElement}
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
                      separatorWidth={prefs.lineSeparatorWidth}
                      wordWrap={wordWrap}
                      fontSize={prefs.fontSize}
                      isPinned={isPinned}
                      isContextMenuTarget={isTarget}
                      isSelected={isSelected}
                      selectionBlockPosition={selectionBlockPosition}
                      activeLineIcon={prefs.activeLineIcon}
                      focusBackgroundMode={prefs.focusBackgroundMode}
                      customFocusBackgroundColor={prefs.customFocusBackgroundColor}
                      rainbowBrackets={prefs.rainbowBrackets}
                      highlightGitPipeline={prefs.highlightGitPipeline}
                      onTogglePin={handleTogglePin}
                      onContextMenu={handleContextMenu}
                      onInspectLine={(l) => setDetailModalLine(l)}
                      onSelectLine={handleSelectLine}
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
            filterMatchesOnly={filterMatchesOnly}
            onToggleFilterMatchesOnly={handleToggleFilterMatchesOnly}
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
        onToggleWordWrap={handleToggleWordWrap}
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
