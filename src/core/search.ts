import type {
  CustomHighlightRule,
  DateRangeFilter,
  FilterOptions,
  LogLevel,
  ParsedLogLine,
  SearchMatchLocation,
  SearchMatchRange,
} from './types.ts';

export function matchesDateFilter(
  line: ParsedLogLine,
  filter?: DateRangeFilter,
): boolean {
  if (!filter || !filter.enabled) return true;
  if (!line.dateKey) return false;

  if (filter.mode === 'range') {
    if (filter.startDate && line.dateKey < filter.startDate) {
      return false;
    }
    if (filter.endDate && line.dateKey > filter.endDate) {
      return false;
    }
    return true;
  }

  if (filter.mode === 'single') {
    if (filter.singleDate && line.dateKey !== filter.singleDate) {
      return false;
    }
    if (line.timeKey) {
      if (filter.startTime && line.timeKey < `${filter.startTime}:00`) {
        return false;
      }
      if (filter.endTime && line.timeKey > `${filter.endTime}:59`) {
        return false;
      }
    }
    return true;
  }

  return true;
}

export function filterLines(
  lines: ParsedLogLine[],
  options: FilterOptions,
): ParsedLogLine[] {
  const { level, searchQuery, isRegex, caseSensitive, dateFilter } = options;
  const hasQuery = searchQuery.trim().length > 0;
  const hasLevelFilter = level !== 'all';
  const hasDateFilter = dateFilter?.enabled === true;

  if (!hasQuery && !hasLevelFilter && !hasDateFilter) {
    return lines;
  }

  let regex: RegExp | null = null;
  let lowerQuery = '';

  if (hasQuery) {
    if (isRegex) {
      try {
        regex = new RegExp(searchQuery, caseSensitive ? '' : 'i');
      } catch {
        regex = null;
        lowerQuery = caseSensitive ? searchQuery : searchQuery.toLowerCase();
      }
    } else {
      lowerQuery = caseSensitive ? searchQuery : searchQuery.toLowerCase();
    }
  }

  const matchesLevel = (lineLevel: LogLevel): boolean => {
    if (level === 'all') return true;
    if (level === 'error') return lineLevel === 'error' || lineLevel === 'fatal';
    return lineLevel === level;
  };

  const matchesSearch = (raw: string): boolean => {
    if (!hasQuery) return true;
    if (regex) return regex.test(raw);
    const target = caseSensitive ? raw : raw.toLowerCase();
    return target.includes(lowerQuery);
  };

  return lines.filter((line) => {
    return (
      matchesLevel(line.level) &&
      matchesSearch(line.raw) &&
      matchesDateFilter(line, dateFilter)
    );
  });
}

export function findMatchRanges(
  text: string,
  query: string,
  isRegex: boolean,
  caseSensitive: boolean,
): SearchMatchRange[] {
  if (!query) return [];

  const ranges: SearchMatchRange[] = [];

  if (isRegex) {
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(query, flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        if (match[0].length === 0) {
          regex.lastIndex++;
          continue;
        }
        ranges.push({
          start: match.index,
          end: match.index + match[0].length,
        });
      }
      return ranges;
    } catch {
      // Fall through to plain text if regex is invalid
    }
  }

  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchPattern = caseSensitive ? query : query.toLowerCase();
  let pos = 0;

  while ((pos = searchText.indexOf(searchPattern, pos)) !== -1) {
    ranges.push({
      start: pos,
      end: pos + query.length,
    });
    pos += query.length;
  }

  return ranges;
}

export function indexSearchMatches(
  lines: ParsedLogLine[],
  query: string,
  isRegex: boolean,
  caseSensitive: boolean,
): {
  totalMatches: number;
  locations: SearchMatchLocation[];
} {
  if (!query || query.trim().length === 0) {
    return { totalMatches: 0, locations: [] };
  }

  const locations: SearchMatchLocation[] = [];
  let globalMatchIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const ranges = findMatchRanges(line.raw, query, isRegex, caseSensitive);
    for (const r of ranges) {
      locations.push({
        lineIndex: i,
        matchIndex: globalMatchIndex++,
        start: r.start,
        end: r.end,
      });
    }
  }

  return {
    totalMatches: locations.length,
    locations,
  };
}

export interface FormattedTextChunk {
  text: string;
  startIndex: number;
  isSearchMatch: boolean;
  isActiveMatch?: boolean;
  customStyle?: {
    color: string;
    bold: boolean;
    italic: boolean;
  };
}

export function splitTextWithSearchAndHighlights(
  text: string,
  searchRanges: SearchMatchRange[],
  activeMatchRange?: SearchMatchRange | null,
  customRules?: CustomHighlightRule[],
): FormattedTextChunk[] {
  // If no search matches and no custom highlights, return plain text chunk
  const hasCustom = customRules && customRules.length > 0;
  if (searchRanges.length === 0 && !hasCustom) {
    return [{ text, startIndex: 0, isSearchMatch: false }];
  }

  // Priority 1: Search matches take visual precedence
  interface Span {
    start: number;
    end: number;
    isSearch: boolean;
    isActiveSearch: boolean;
    customStyle?: {
      color: string;
      bold: boolean;
      italic: boolean;
    };
  }

  const spans: Span[] = [];

  for (const sr of searchRanges) {
    const isActive =
      !!activeMatchRange &&
      activeMatchRange.start === sr.start &&
      activeMatchRange.end === sr.end;
    spans.push({
      start: sr.start,
      end: sr.end,
      isSearch: true,
      isActiveSearch: isActive,
    });
  }

  // Add custom highlights only if they don't collide with search matches
  if (hasCustom) {
    const lowerText = text.toLowerCase();
    for (const rule of customRules) {
      if (!rule.keyword) continue;
      const term = rule.keyword.toLowerCase();
      let pos = 0;
      while ((pos = lowerText.indexOf(term, pos)) !== -1) {
        const start = pos;
        const end = pos + term.length;
        pos += term.length;

        // Check collision with search matches
        const collides = spans.some((s) => s.isSearch && s.start < end && s.end > start);
        if (!collides) {
          spans.push({
            start,
            end,
            isSearch: false,
            isActiveSearch: false,
            customStyle: {
              color: rule.color,
              bold: rule.bold,
              italic: rule.italic,
            },
          });
        }
      }
    }
  }

  // Sort spans by start position
  spans.sort((a, b) => a.start - b.start);

  const chunks: FormattedTextChunk[] = [];
  let lastIndex = 0;

  for (const span of spans) {
    if (span.start < lastIndex) continue; // safety against overlapping
    if (span.start > lastIndex) {
      chunks.push({
        text: text.slice(lastIndex, span.start),
        startIndex: lastIndex,
        isSearchMatch: false,
      });
    }

    chunks.push({
      text: text.slice(span.start, span.end),
      startIndex: span.start,
      isSearchMatch: span.isSearch,
      isActiveMatch: span.isActiveSearch,
      customStyle: span.customStyle,
    });

    lastIndex = span.end;
  }

  if (lastIndex < text.length) {
    chunks.push({
      text: text.slice(lastIndex),
      startIndex: lastIndex,
      isSearchMatch: false,
    });
  }

  return chunks;
}
