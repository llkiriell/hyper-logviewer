import { memo, useMemo, useState } from 'react';
import {
  IconArrowRight,
  IconBookmarkFilled,
  IconCaretRightFilled,
  IconCheck,
  IconChevronRight,
  IconChevronsRight,
  IconCircleDot,
  IconCopy,
  IconEye,
  IconHandFingerRight,
  IconPin,
  IconPinFilled,
  IconStarFilled,
  IconTarget,
} from '@tabler/icons-react';
import { analyzeBrackets, type BracketInfo } from '../../core/brackets.ts';
import {
  findMatchRanges,
  type InlineSeverityConfig,
  splitTextWithSearchAndHighlights,
} from '../../core/search.ts';
import type {
  CustomHighlightRule,
  LevelColorConfig,
  ParsedLogLine,
  SearchMatchRange,
} from '../../core/types.ts';
import type { ActiveLineIconType, FocusBackgroundMode } from '../platform/preferences.ts';
import { useTranslation } from '../i18n/index.ts';

interface VirtualLogRowProps {
  line: ParsedLogLine;
  searchQuery: string;
  isRegex: boolean;
  caseSensitive: boolean;
  activeSearchRange?: SearchMatchRange | null;
  customRules?: CustomHighlightRule[];
  inlineSeverityConfig?: InlineSeverityConfig;
  levelColor?: LevelColorConfig;
  showSeparator?: boolean;
  separatorColor?: string;
  separatorWidth?: number;
  wordWrap: boolean;
  fontSize: number;
  isPinned: boolean;
  isContextMenuTarget?: boolean;
  isSelected?: boolean;
  selectionBlockPosition?: 'single' | 'top' | 'middle' | 'bottom' | null;
  activeLineIcon?: ActiveLineIconType;
  focusBackgroundMode?: FocusBackgroundMode;
  customFocusBackgroundColor?: string;
  rainbowBrackets?: boolean;
  highlightGitPipeline?: boolean;
  onTogglePin: (line: ParsedLogLine) => void;
  onContextMenu: (event: React.MouseEvent, line: ParsedLogLine) => void;
  onInspectLine?: (line: ParsedLogLine) => void;
  onSelectLine?: (line: ParsedLogLine, event?: React.MouseEvent) => void;
}

function renderContentWithBrackets(
  text: string,
  startOffset: number,
  bracketMap: Map<number, BracketInfo> | null,
  hoveredBracketPairId: number | null,
  onHoverBracket: (id: number | null) => void,
) {
  if (!bracketMap || bracketMap.size === 0) {
    return text;
  }

  const elements: React.ReactNode[] = [];
  let buffer = '';

  for (let i = 0; i < text.length; i++) {
    const globalIdx = startOffset + i;
    const bracket = bracketMap.get(globalIdx);

    if (bracket) {
      if (buffer) {
        elements.push(buffer);
        buffer = '';
      }
      const isMatched = hoveredBracketPairId === bracket.pairId;
      elements.push(
        <span
          key={`br-${globalIdx}`}
          className={`rainbow-bracket bracket-depth-${bracket.depth % 5} ${isMatched ? 'is-matched-bracket' : ''}`}
          onMouseEnter={(e) => {
            e.stopPropagation();
            onHoverBracket(bracket.pairId);
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
            onHoverBracket(null);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onHoverBracket(isMatched ? null : bracket.pairId);
          }}
        >
          {bracket.char}
        </span>,
      );
    } else {
      buffer += text[i];
    }
  }

  if (buffer) {
    elements.push(buffer);
  }

  return elements;
}

// Computes a softer background tint for continuation lines (e.g. multiline stacktrace lines)
function getContinuationBg(bgColor?: string): string | undefined {
  if (!bgColor || bgColor === 'transparent') return undefined;
  const match = bgColor.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/i);
  if (match && match[1] && match[2] && match[3] && match[4]) {
    const reducedAlpha = Math.max(0.02, parseFloat(match[4]) * 0.4);
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${reducedAlpha.toFixed(3)})`;
  }
  return bgColor;
}

function renderActiveLineIcon(iconType: ActiveLineIconType = 'hand', color: string) {
  const size = 13;
  const stroke = 1.8;
  switch (iconType) {
    case 'arrow':
      return <IconArrowRight size={size} stroke={stroke} style={{ color }} />;
    case 'chevron':
      return <IconChevronRight size={size} stroke={stroke} style={{ color }} />;
    case 'caret':
      return <IconCaretRightFilled size={size} style={{ color }} />;
    case 'chevrons':
      return <IconChevronsRight size={size} stroke={stroke} style={{ color }} />;
    case 'target':
      return <IconTarget size={size} stroke={stroke} style={{ color }} />;
    case 'dot':
      return <IconCircleDot size={size} stroke={stroke} style={{ color }} />;
    case 'bookmark':
      return <IconBookmarkFilled size={size} style={{ color }} />;
    case 'star':
      return <IconStarFilled size={size} style={{ color }} />;
    case 'hand':
    default:
      return <IconHandFingerRight size={size} stroke={stroke} style={{ color }} />;
  }
}

export const VirtualLogRow = memo(function VirtualLogRow({
  line,
  searchQuery,
  isRegex,
  caseSensitive,
  activeSearchRange,
  customRules,
  inlineSeverityConfig,
  levelColor,
  showSeparator = false,
  separatorColor = '#c4c4c2',
  separatorWidth = 0.75,
  wordWrap,
  fontSize,
  isPinned,
  isContextMenuTarget = false,
  isSelected = false,
  selectionBlockPosition = null,
  activeLineIcon = 'hand',
  focusBackgroundMode = 'transparent',
  customFocusBackgroundColor = 'rgba(14, 165, 233, 0.15)',
  rainbowBrackets = true,
  highlightGitPipeline = true,
  onTogglePin,
  onContextMenu,
  onInspectLine,
  onSelectLine,
}: VirtualLogRowProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [hoveredBracketPairId, setHoveredBracketPairId] = useState<number | null>(null);

  const bracketMap = useMemo(() => {
    if (!rainbowBrackets) return null;
    return analyzeBrackets(line.raw);
  }, [line.raw, rainbowBrackets]);

  const searchRanges = useMemo(() => {
    if (!searchQuery) return [];
    return findMatchRanges(line.raw, searchQuery, isRegex, caseSensitive);
  }, [line.raw, searchQuery, isRegex, caseSensitive]);

  const chunks = useMemo(() => {
    return splitTextWithSearchAndHighlights(
      line.raw,
      searchRanges,
      activeSearchRange,
      customRules,
      inlineSeverityConfig,
      highlightGitPipeline,
    );
  }, [
    line.raw,
    searchRanges,
    activeSearchRange,
    customRules,
    inlineSeverityConfig,
    highlightGitPipeline,
  ]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(line.raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy line:', err);
    }
  };

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin(line);
  };

  // Safe background color from level configuration, softened if it is a continuation line
  const rowBg = useMemo(() => {
    if (!levelColor || levelColor.bgColor === 'transparent') return undefined;
    if (line.isContinuation) {
      return getContinuationBg(levelColor.bgColor);
    }
    return levelColor.bgColor;
  }, [levelColor, line.isContinuation]);

  // Effective row background considering focus customization
  const effectiveRowBg = useMemo(() => {
    if (isSelected) {
      if (focusBackgroundMode === 'transparent') {
        return undefined;
      }
      if (focusBackgroundMode === 'severity') {
        return levelColor?.bgColor && levelColor.bgColor !== 'transparent'
          ? levelColor.bgColor
          : undefined;
      }
      if (focusBackgroundMode === 'custom') {
        return customFocusBackgroundColor;
      }
    }
    return rowBg;
  }, [isSelected, focusBackgroundMode, customFocusBackgroundColor, levelColor, rowBg]);

  // Effective line separator color: uses user custom color, or theme-aware var(--line-separator-default) if default
  const effectiveSeparatorColor = useMemo(() => {
    if (!showSeparator || isSelected) return undefined;
    if (separatorColor && separatorColor.toLowerCase() !== '#c4c4c2') {
      return separatorColor;
    }
    return 'var(--line-separator-default, #c4c4c2)';
  }, [showSeparator, isSelected, separatorColor]);

  const effectiveSeparatorWidth = separatorWidth && separatorWidth > 0 ? separatorWidth : 0.75;

  // Fully opaque solid composite background for sticky columns (prevents any bleed-through on horizontal scroll)
  const stickySolidStyle = useMemo(() => {
    const separatorShadow = effectiveSeparatorColor
      ? `inset 0 -${effectiveSeparatorWidth}px 0 0 ${effectiveSeparatorColor}`
      : undefined;

    if (isSelected) {
      return {
        backgroundColor: 'var(--bg)',
        backgroundImage: effectiveRowBg
          ? `linear-gradient(${effectiveRowBg}, ${effectiveRowBg})`
          : undefined,
        boxShadow: separatorShadow,
      };
    }
    if (rowBg) {
      return {
        backgroundColor: 'var(--bg)',
        backgroundImage: `linear-gradient(${rowBg}, ${rowBg})`,
        boxShadow: separatorShadow,
      };
    }
    return {
      backgroundColor: 'var(--bg)',
      boxShadow: separatorShadow,
    };
  }, [isSelected, effectiveRowBg, rowBg, effectiveSeparatorColor, effectiveSeparatorWidth]);

  const rowBorderBottom = effectiveSeparatorColor
    ? `${effectiveSeparatorWidth}px solid ${effectiveSeparatorColor}`
    : undefined;

  const badgeText = line.customLevelTag
    ? line.customLevelTag.toUpperCase()
    : line.level.toUpperCase();

  // Dynamic focus color matching the log level / custom tag
  const activeBorderColor = useMemo(() => {
    if (line.customLevelTag) {
      const tag = line.customLevelTag.toLowerCase();
      if (tag === 'conflict') return '#ef4444';
      if (tag === 'merge') return '#9333ea';
      if (tag === 'pipeline') return '#0ea5e9';
    }
    if (levelColor?.textColor && levelColor.textColor !== 'inherit') {
      return levelColor.textColor;
    }
    switch (line.level) {
      case 'fatal':
      case 'error':
        return 'var(--danger)';
      case 'warn':
        return 'var(--mark)';
      case 'info':
        return 'var(--accent)';
      case 'debug':
        return '#8c8c91';
      case 'trace':
        return '#7b1fa2';
      default:
        return 'var(--accent)';
    }
  }, [line.level, line.customLevelTag, levelColor]);

  return (
    <div
      className={`log-row log-row-${line.level} ${line.isContinuation ? 'is-continuation' : ''} ${wordWrap ? 'is-wrapped' : ''} ${isPinned ? 'is-pinned-row' : ''} ${isContextMenuTarget ? 'is-context-target' : ''} ${isSelected ? 'is-selected-line' : ''} ${isSelected && selectionBlockPosition ? `selection-block-${selectionBlockPosition}` : ''} ${isSelected && !effectiveRowBg ? 'is-focus-transparent' : ''}`}
      style={{
        fontSize: `${fontSize}px`,
        backgroundColor: effectiveRowBg,
        borderBottom: rowBorderBottom,
        boxShadow: effectiveSeparatorColor
          ? `inset 0 -${effectiveSeparatorWidth}px 0 0 ${effectiveSeparatorColor}`
          : undefined,
        ...(isSelected
          ? ({
              '--selected-line-border': activeBorderColor,
              '--selected-line-bg': effectiveRowBg || 'transparent',
            } as React.CSSProperties)
          : {}),
      }}
      onClick={(e) => onSelectLine?.(line, e)}
      onContextMenu={(e) => onContextMenu(e, line)}
    >
      {/* Sticky Pin Button (Always 100% solid background) */}
      <button
        type="button"
        className={`log-pin-btn ${isPinned ? 'is-active' : ''}`}
        style={stickySolidStyle}
        onClick={handlePinClick}
        title={isPinned ? t('viewer.unpinLine') : t('viewer.pinLine')}
      >
        {isPinned ? (
          <IconPinFilled size={13} stroke={1.5} />
        ) : (
          <IconPin size={13} stroke={1.5} />
        )}
      </button>

      {/* Sticky Pointer Indicator Cell (Shows pointing hand or selected icon when line has focus) */}
      <span
        className={`log-pointer-cell ${isSelected ? 'is-active' : ''}`}
        style={stickySolidStyle}
        aria-hidden={!isSelected}
      >
        {isSelected && renderActiveLineIcon(activeLineIcon, activeBorderColor)}
      </span>

      {/* Sticky Line Number Gutter (Always 100% solid background) */}
      <span
        className="log-gutter"
        style={stickySolidStyle}
        title={`Line ${line.lineNumber}`}
      >
        {line.lineNumber}
      </span>

      {/* Sticky Log Level Indicator (Always 100% solid background, empty if continuation) */}
      <span
        className={`log-level-badge log-level-${line.level} ${line.customLevelTag ? `log-level-tag-${line.customLevelTag.toLowerCase()}` : ''} ${line.isContinuation ? 'is-continuation-badge' : ''}`}
        style={{
          color: levelColor ? levelColor.textColor : undefined,
          ...stickySolidStyle,
        }}
      >
        {line.isContinuation ? '' : badgeText}
      </span>

      {/* Log Line Text Content */}
      <div className="log-content">
        {chunks.map((chunk, idx) => {
          const renderedText = renderContentWithBrackets(
            chunk.text,
            chunk.startIndex,
            bracketMap,
            hoveredBracketPairId,
            setHoveredBracketPairId,
          );

          if (chunk.isSearchMatch) {
            return (
              <mark
                key={idx}
                className={`log-match ${chunk.isActiveMatch ? 'is-active-match' : ''}`}
              >
                {renderedText}
              </mark>
            );
          }

          if (chunk.customStyle) {
            return (
              <span
                key={idx}
                style={{
                  color: chunk.customStyle.color,
                  fontWeight: chunk.customStyle.bold ? 700 : undefined,
                  fontStyle: chunk.customStyle.italic ? 'italic' : undefined,
                }}
              >
                {renderedText}
              </span>
            );
          }

          return <span key={idx}>{renderedText}</span>;
        })}
      </div>

      {/* Sticky Right-aligned Hover Actions (Zero layout shift on text; hidden on continuation lines) */}
      {!line.isContinuation && (
        <div className="log-row-actions">
          <button
            type="button"
            className="log-action-btn"
            onClick={handleCopy}
            title={t('viewer.copyLine')}
          >
            {copied ? (
              <IconCheck size={13} stroke={1.5} className="copy-success-icon" />
            ) : (
              <IconCopy size={13} stroke={1.5} />
            )}
          </button>

          {onInspectLine && (
            <button
              type="button"
              className="log-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onInspectLine(line);
              }}
              title={t('contextMenu.inspectLine')}
            >
              <IconEye size={13} stroke={1.5} />
            </button>
          )}
        </div>
      )}
    </div>
  );
});
