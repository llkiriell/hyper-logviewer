import type {
  CustomHighlightRule,
  CustomStandardLevel,
  DateRangeFilter,
  FilterOptions,
  LevelColorConfig,
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
  const { level, searchQuery, isRegex, caseSensitive, filterMatchesOnly, dateFilter } = options;
  const hasQuery = searchQuery.trim().length > 0;
  const shouldFilterBySearch = hasQuery && filterMatchesOnly === true;
  const hasLevelFilter = level !== 'all';
  const hasDateFilter = dateFilter?.enabled === true;

  if (!shouldFilterBySearch && !hasLevelFilter && !hasDateFilter) {
    return lines;
  }

  let regex: RegExp | null = null;
  let lowerQuery = '';

  if (shouldFilterBySearch) {
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
    if (!shouldFilterBySearch) return true;
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

export interface InlineSeverityConfig {
  enabled: boolean;
  levelColors: Record<LogLevel, LevelColorConfig>;
  customStandardLevels?: CustomStandardLevel[];
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const WORD_REGEX_CACHE = new Map<string, RegExp>();
function getWordRegex(word: string): RegExp {
  let re = WORD_REGEX_CACHE.get(word);
  if (!re) {
    re = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
    WORD_REGEX_CACHE.set(word, re);
  }
  re.lastIndex = 0;
  return re;
}

const GIT_DELIM_REGEX = /#############/g;
const GIT_BRANCH_REGEX = /\b(?:refs\/remotes\/origin\/|refs\/heads\/|origin\/)?((?:feature|hotfix|bugfix|release|fix)\/[a-zA-Z0-9_\-\.\/]+)\b/gi;
const GIT_KEYWORDS_REGEX = /\b(git\s+merge|git\s+checkout|git\s+fetch|git\s+branch|git|merge|checkout|fetch|commit|pull|push|rebase|CONFLICT|Automatic merge failed|Auto-merging)\b/gi;
const GIT_DIFF_STAT_REGEX = /([a-zA-Z0-9_\-\.\/]+(?:\.[a-zA-Z0-9_]+)?)\s*\|\s*(\d+)\s*([+\-]+)/;
const GIT_DIFF_SUM_REGEX = /(\d+)\s+(files?\s+changed)|(\d+)\s+(insertions?\(\+\))|(\d+)\s+(deletions?\(-\))/g;

export function splitTextWithSearchAndHighlights(
  text: string,
  searchRanges: SearchMatchRange[],
  activeMatchRange?: SearchMatchRange | null,
  customRules?: CustomHighlightRule[],
  inlineSeverityConfig?: InlineSeverityConfig,
  highlightGitPipeline?: boolean,
): FormattedTextChunk[] {
  const hasCustom = customRules && customRules.length > 0;
  const hasInline = inlineSeverityConfig && inlineSeverityConfig.enabled;
  const hasGit = highlightGitPipeline !== false;

  // If no search matches, no custom highlights, no inline severity, and no git, return plain text chunk
  if (searchRanges.length === 0 && !hasCustom && !hasInline && !hasGit) {
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

  // Add custom highlights only if they don't collide with search matches or earlier custom matches
  if (hasCustom) {
    const lowerText = text.toLowerCase();
    for (const rule of customRules) {
      if (!rule.keyword) continue;

      if (rule.isRegex) {
        try {
          const regex = new RegExp(rule.keyword, 'gi');
          let match: RegExpExecArray | null;
          while ((match = regex.exec(text)) !== null) {
            if (match[0].length === 0) {
              regex.lastIndex++;
              continue;
            }
            const start = match.index;
            const end = match.index + match[0].length;

            // Check collision with already placed spans (search matches or previous custom highlights)
            const collides = spans.some((s) => s.start < end && s.end > start);
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
        } catch {
          // Ignore invalid regex pattern silently during real-time rendering
        }
      } else {
        const term = rule.keyword.toLowerCase();
        let pos = 0;
        while ((pos = lowerText.indexOf(term, pos)) !== -1) {
          const start = pos;
          const end = pos + term.length;
          pos += term.length;

          // Check collision with already placed spans
          const collides = spans.some((s) => s.start < end && s.end > start);
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
  }

  // Priority 3: Inline severity standard words (FATAL, ERROR, WARN, INFO, DEBUG, TRACE, etc.)
  if (hasInline && inlineSeverityConfig) {
    const standardWords: Array<{ word: string; color: string }> = [
      { word: 'FATAL', color: inlineSeverityConfig.levelColors.fatal.textColor },
      { word: 'ERROR', color: inlineSeverityConfig.levelColors.error.textColor },
      { word: 'WARN', color: inlineSeverityConfig.levelColors.warn.textColor },
      { word: 'WARNING', color: inlineSeverityConfig.levelColors.warn.textColor },
      { word: 'INFO', color: inlineSeverityConfig.levelColors.info.textColor },
      { word: 'DEBUG', color: inlineSeverityConfig.levelColors.debug.textColor },
      { word: 'TRACE', color: inlineSeverityConfig.levelColors.trace.textColor },
    ];

    if (inlineSeverityConfig.customStandardLevels) {
      for (const c of inlineSeverityConfig.customStandardLevels) {
        if (c.word) {
          standardWords.push({ word: c.word.toUpperCase(), color: c.textColor });
        }
      }
    }

    for (const sw of standardWords) {
      if (!sw.word || sw.color === 'inherit' || sw.color === 'transparent') continue;
      const pattern = getWordRegex(sw.word);
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(text)) !== null) {
        const start = m.index;
        const end = m.index + m[0].length;
        const collides = spans.some((s) => s.start < end && s.end > start);
        if (!collides) {
          spans.push({
            start,
            end,
            isSearch: false,
            isActiveSearch: false,
            customStyle: {
              color: sw.color,
              bold: true,
              italic: false,
            },
          });
        }
      }
    }
  }

  // Priority 4: Git & Jenkins Pipeline (Branches, Merges, Delimiters, Keywords)
  if (hasGit) {
    // 4a. Merge Delimiter #############
    if (text.includes('#############')) {
      GIT_DELIM_REGEX.lastIndex = 0;
      let dm: RegExpExecArray | null;
      while ((dm = GIT_DELIM_REGEX.exec(text)) !== null) {
        const start = dm.index;
        const end = dm.index + dm[0].length;
        if (!spans.some((s) => s.start < end && s.end > start)) {
          spans.push({
            start,
            end,
            isSearch: false,
            isActiveSearch: false,
            customStyle: {
              color: '#818cf8',
              bold: true,
              italic: false,
            },
          });
        }
      }
    }

    // 4b. Git Branches (feature/..., hotfix/..., bugfix/..., release/..., fix/..., master/develop in context)
    if (text.includes('/') && /feature|hotfix|bugfix|release|fix/i.test(text)) {
      GIT_BRANCH_REGEX.lastIndex = 0;
      let bm: RegExpExecArray | null;
      while ((bm = GIT_BRANCH_REGEX.exec(text)) !== null) {
        const start = bm.index;
        const end = bm.index + bm[0].length;
        if (!spans.some((s) => s.start < end && s.end > start)) {
          spans.push({
            start,
            end,
            isSearch: false,
            isActiveSearch: false,
            customStyle: {
              color: '#0284c7', // Distinct cyan/teal for branches
              bold: true,
              italic: false,
            },
          });
        }
      }
    }

    // 4c. Git reserved keywords & operations
    if (/git|merge|checkout|fetch|commit|pull|push|rebase|conflict|failed|auto-merging/i.test(text)) {
      GIT_KEYWORDS_REGEX.lastIndex = 0;
      let km: RegExpExecArray | null;
      while ((km = GIT_KEYWORDS_REGEX.exec(text)) !== null) {
        const start = km.index;
        const end = km.index + km[0].length;
        if (!spans.some((s) => s.start < end && s.end > start)) {
          const isConflict = /conflict|failed/i.test(km[0]);
          spans.push({
            start,
            end,
            isSearch: false,
            isActiveSearch: false,
            customStyle: {
              color: isConflict ? '#dc2626' : '#9333ea', // Red for conflict, violet for git keywords
              bold: true,
              italic: false,
            },
          });
        }
      }
    }

    // 4d. Git Diff Stat Lines (e.g. scripts/sql/INV00003229.plsql | 12 ++++++++----)
    if (text.includes('|') && (text.includes('+') || text.includes('-'))) {
      const statMatch = text.match(GIT_DIFF_STAT_REGEX);
      if (statMatch && statMatch.index !== undefined) {
        const baseIdx = statMatch.index;
        const pathStr = statMatch[1];
        const numStr = statMatch[2];
        const barStr = statMatch[3];

        if (pathStr && numStr && barStr) {
          const pathIdx = text.indexOf(pathStr, baseIdx);
          if (pathIdx !== -1 && !spans.some((s) => s.start < pathIdx + pathStr.length && s.end > pathIdx)) {
            spans.push({
              start: pathIdx,
              end: pathIdx + pathStr.length,
              isSearch: false,
              isActiveSearch: false,
              customStyle: {
                color: 'inherit',
                bold: true, // Soft bold for diff path
                italic: false,
              },
            });
          }

          const numIdx = text.indexOf(numStr, pathIdx + pathStr.length);
          if (numIdx !== -1 && !spans.some((s) => s.start < numIdx + numStr.length && s.end > numIdx)) {
            spans.push({
              start: numIdx,
              end: numIdx + numStr.length,
              isSearch: false,
              isActiveSearch: false,
              customStyle: {
                color: '#0284c7', // Distinct color for change count
                bold: true,
                italic: false,
              },
            });
          }

          const barIdx = text.indexOf(barStr, numIdx + numStr.length);
          if (barIdx !== -1) {
            let currentIdx = barIdx;
            let i = 0;
            while (i < barStr.length) {
              const char = barStr[i];
              let j = i;
              while (j < barStr.length && barStr[j] === char) j++;
              const segment = barStr.substring(i, j);
              const segStart = currentIdx;
              const segEnd = currentIdx + segment.length;
              if (!spans.some((s) => s.start < segEnd && s.end > segStart)) {
                spans.push({
                  start: segStart,
                  end: segEnd,
                  isSearch: false,
                  isActiveSearch: false,
                  customStyle: {
                    color: char === '+' ? '#16a34a' : '#dc2626', // Green for +, Red for -
                    bold: true,
                    italic: false,
                  },
                });
              }
              currentIdx += segment.length;
              i = j;
            }
          }
        }
      }
    }

    // 4e. Git Diff Summary Lines (e.g. 5 files changed, 17 insertions(+), 1 deletion(-))
    if (text.includes('changed') || text.includes('insertions') || text.includes('deletions')) {
      GIT_DIFF_SUM_REGEX.lastIndex = 0;
      let sm: RegExpExecArray | null;
      while ((sm = GIT_DIFF_SUM_REGEX.exec(text)) !== null) {
      if (sm[1]) {
        const numStart = sm.index;
        const numEnd = numStart + sm[1].length;
        if (!spans.some((s) => s.start < numEnd && s.end > numStart)) {
          spans.push({
            start: numStart,
            end: numEnd,
            isSearch: false,
            isActiveSearch: false,
            customStyle: {
              color: '#0284c7',
              bold: true,
              italic: false,
            },
          });
        }
      }
      if (sm[3] && sm[4]) {
        const numStart = sm.index;
        const numEnd = numStart + sm[3].length;
        if (!spans.some((s) => s.start < numEnd && s.end > numStart)) {
          spans.push({
            start: numStart,
            end: numEnd,
            isSearch: false,
            isActiveSearch: false,
            customStyle: {
              color: '#0284c7',
              bold: true,
              italic: false,
            },
          });
        }
        const insText = sm[4];
        const insStart = sm.index + sm[0].indexOf(insText);
        const insEnd = insStart + insText.length;
        if (!spans.some((s) => s.start < insEnd && s.end > insStart)) {
          spans.push({
            start: insStart,
            end: insEnd,
            isSearch: false,
            isActiveSearch: false,
            customStyle: {
              color: '#16a34a', // Green for insertions(+)
              bold: true,
              italic: false,
            },
          });
        }
      }
      if (sm[5] && sm[6]) {
        const numStart = sm.index;
        const numEnd = numStart + sm[5].length;
        if (!spans.some((s) => s.start < numEnd && s.end > numStart)) {
          spans.push({
            start: numStart,
            end: numEnd,
            isSearch: false,
            isActiveSearch: false,
            customStyle: {
              color: '#0284c7',
              bold: true,
              italic: false,
            },
          });
        }
        const delText = sm[6];
        const delStart = sm.index + sm[0].indexOf(delText);
        const delEnd = delStart + delText.length;
        if (!spans.some((s) => s.start < delEnd && s.end > delStart)) {
          spans.push({
            start: delStart,
            end: delEnd,
            isSearch: false,
            isActiveSearch: false,
            customStyle: {
              color: '#dc2626', // Red for deletions(-)
              bold: true,
              italic: false,
            },
          });
        }
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
