import type { FilterOptions, LogLevel, ParsedLogLine, SearchMatchRange } from './types.ts';

export function filterLines(
  lines: ParsedLogLine[],
  options: FilterOptions,
): ParsedLogLine[] {
  const { level, searchQuery, isRegex, caseSensitive } = options;
  const hasQuery = searchQuery.trim().length > 0;
  const hasLevelFilter = level !== 'all';

  if (!hasQuery && !hasLevelFilter) {
    return lines;
  }

  let regex: RegExp | null = null;
  let lowerQuery = '';

  if (hasQuery) {
    if (isRegex) {
      try {
        regex = new RegExp(searchQuery, caseSensitive ? '' : 'i');
      } catch {
        // In case of invalid regex, treat as plain text search
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
    return matchesLevel(line.level) && matchesSearch(line.raw);
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

export interface HighlightPart {
  text: string;
  isMatch: boolean;
}

export function splitTextWithMatches(
  text: string,
  ranges: SearchMatchRange[],
): HighlightPart[] {
  if (ranges.length === 0) {
    return [{ text, isMatch: false }];
  }

  const parts: HighlightPart[] = [];
  let lastIndex = 0;

  for (const range of ranges) {
    if (range.start > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, range.start),
        isMatch: false,
      });
    }
    parts.push({
      text: text.slice(range.start, range.end),
      isMatch: true,
    });
    lastIndex = range.end;
  }

  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      isMatch: false,
    });
  }

  return parts;
}
