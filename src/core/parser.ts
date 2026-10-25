import type { CustomStandardLevel, LogLevel, LogStats, ParsedLogLine } from './types.ts';

// Fast level detection regexes (case-insensitive for broad compatibility, but optimized)
const LEVEL_PATTERNS: Array<{ regex: RegExp; level: LogLevel }> = [
  { regex: /\b(FATAL|CRITICAL|EMERGENCY|ALERT)\b/i, level: 'fatal' },
  { regex: /\b(ERROR|ERR|FAIL|FAILURE|EXCEPTION)\b/i, level: 'error' },
  { regex: /\b(WARN|WARNING)\b/i, level: 'warn' },
  { regex: /\b(INFO|NOTICE|INFORMATION)\b/i, level: 'info' },
  { regex: /\b(DEBUG|DBG|FINE|FINER|FINEST)\b/i, level: 'debug' },
  { regex: /\b(TRACE|VERBOSE|SILLY)\b/i, level: 'trace' },
];

// ISO / Standard Timestamp pattern: e.g. [2026-08-10 14:18:44] or 2026-08-10T14:18:44.123Z
const TIMESTAMP_EXTRACTOR =
  /(\d{4})[-/.](\d{2})[-/.](\d{2})[T\s](\d{2}):(\d{2}):(\d{2})(?:[.,](\d{1,6}))?/;

export function detectLogLevel(
  line: string,
  customStandardLevels?: CustomStandardLevel[],
): { level: LogLevel; customLevelTag?: string } {
  // First check custom standard words if any
  if (customStandardLevels && customStandardLevels.length > 0) {
    for (const c of customStandardLevels) {
      if (!c.word) continue;
      const reg = new RegExp(`\\b${c.word}\\b`, 'i');
      if (reg.test(line)) {
        return { level: 'info', customLevelTag: c.word };
      }
    }
  }

  // Check for JSON log level attribute: "level": "error"
  const jsonLevelMatch = /"level"\s*:\s*"([a-zA-Z]+)"/i.exec(line);
  const matchedLevel = jsonLevelMatch?.[1];
  if (matchedLevel) {
    const rawVal = matchedLevel.toLowerCase();
    if (rawVal.includes('fatal') || rawVal.includes('crit')) return { level: 'fatal' };
    if (rawVal.includes('err') || rawVal.includes('fail')) return { level: 'error' };
    if (rawVal.includes('warn')) return { level: 'warn' };
    if (rawVal.includes('info')) return { level: 'info' };
    if (rawVal.includes('deb')) return { level: 'debug' };
    if (rawVal.includes('trace') || rawVal.includes('verb')) return { level: 'trace' };
  }

  for (const item of LEVEL_PATTERNS) {
    if (item.regex.test(line)) {
      return { level: item.level };
    }
  }

  return { level: 'unknown' };
}

export function parseLogTimestamp(line: string): {
  rawTimestamp?: string;
  parsedDate?: Date;
  dateKey?: string;
  timeKey?: string;
} {
  const match = TIMESTAMP_EXTRACTOR.exec(line);
  if (!match) {
    return {};
  }

  const rawTimestamp = match[0];
  const year = match[1] ?? '';
  const month = match[2] ?? '';
  const day = match[3] ?? '';
  const hours = match[4] ?? '';
  const minutes = match[5] ?? '';
  const seconds = match[6] ?? '';

  const dateKey = `${year}-${month}-${day}`;
  const timeKey = `${hours}:${minutes}:${seconds}`;

  const parsedDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds),
  );

  return {
    rawTimestamp,
    parsedDate: isNaN(parsedDate.getTime()) ? undefined : parsedDate,
    dateKey,
    timeKey,
  };
}

export function extractJsonPayloads(raw: string): string[] {
  const payloads: string[] = [];
  const firstBrace = raw.indexOf('{');
  if (firstBrace === -1) return payloads;

  // Balanced braces scanner
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;

  for (let i = firstBrace; i < raw.length; i++) {
    const char = raw[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (depth === 0) {
        start = i;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = raw.substring(start, i + 1);
        try {
          JSON.parse(candidate);
          payloads.push(candidate);
        } catch {
          // not valid JSON, ignore
        }
        start = -1;
      }
    }
  }

  return payloads;
}

export function parseSingleLine(
  raw: string,
  rawIndex: number,
  customStandardLevels?: CustomStandardLevel[],
): ParsedLogLine {
  const { level, customLevelTag } = detectLogLevel(raw, customStandardLevels);
  const tsInfo = parseLogTimestamp(raw);
  const jsonPayloads = raw.includes('{') ? extractJsonPayloads(raw) : undefined;

  return {
    rawIndex,
    lineNumber: rawIndex + 1,
    raw,
    timestamp: tsInfo.rawTimestamp,
    parsedDate: tsInfo.parsedDate,
    dateKey: tsInfo.dateKey,
    timeKey: tsInfo.timeKey,
    jsonPayloads: jsonPayloads && jsonPayloads.length > 0 ? jsonPayloads : undefined,
    level,
    customLevelTag,
    message: raw,
  };
}

export function parseLogContent(
  content: string,
  customStandardLevels?: CustomStandardLevel[],
): {
  lines: ParsedLogLine[];
  stats: LogStats;
} {
  if (!content) {
    return {
      lines: [],
      stats: {
        total: 0,
        fatal: 0,
        error: 0,
        warn: 0,
        info: 0,
        debug: 0,
        trace: 0,
        unknown: 0,
        hasTimestamps: false,
      },
    };
  }

  const rawLines = content.split(/\r?\n/);
  // If the last line is empty due to trailing newline, remove it
  if (rawLines.length > 1 && rawLines[rawLines.length - 1] === '') {
    rawLines.pop();
  }

  const lines: ParsedLogLine[] = new Array(rawLines.length);
  const stats: LogStats = {
    total: rawLines.length,
    fatal: 0,
    error: 0,
    warn: 0,
    info: 0,
    debug: 0,
    trace: 0,
    unknown: 0,
    hasTimestamps: false,
  };

  let minDate: string | undefined;
  let maxDate: string | undefined;
  let timestampCount = 0;

  // Track active parent entry for multiline logs and stacktraces (e.g. Java exceptions)
  let currentParentLevel: LogLevel | undefined = undefined;
  let currentParentCustomTag: string | undefined = undefined;
  let currentParentDateKey: string | undefined = undefined;
  let currentParentTimeKey: string | undefined = undefined;
  let currentParentParsedDate: Date | undefined = undefined;

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i] ?? '';
    const parsed = parseSingleLine(raw, i, customStandardLevels);

    const hasNewTimestamp = !!parsed.dateKey;
    const hasExplicitLevel = parsed.level !== 'unknown' || !!parsed.customLevelTag;

    if (hasNewTimestamp || hasExplicitLevel) {
      // New primary log entry
      if (hasExplicitLevel) {
        currentParentLevel = parsed.level;
        currentParentCustomTag = parsed.customLevelTag;
      } else {
        // Standalone line with timestamp but unknown level
        currentParentLevel = undefined;
        currentParentCustomTag = undefined;
      }
      currentParentDateKey = parsed.dateKey;
      currentParentTimeKey = parsed.timeKey;
      currentParentParsedDate = parsed.parsedDate;
      parsed.isContinuation = false;
    } else if (currentParentLevel) {
      // Continuation line / multiline stacktrace belonging to the previous primary entry
      parsed.isContinuation = true;
      parsed.parentLevel = currentParentLevel;
      parsed.level = currentParentLevel;
      parsed.customLevelTag = currentParentCustomTag;
      parsed.dateKey = currentParentDateKey;
      parsed.timeKey = currentParentTimeKey;
      parsed.parsedDate = currentParentParsedDate;
    }

    lines[i] = parsed;

    if (hasNewTimestamp && parsed.dateKey) {
      timestampCount++;
      if (!minDate || parsed.dateKey < minDate) minDate = parsed.dateKey;
      if (!maxDate || parsed.dateKey > maxDate) maxDate = parsed.dateKey;
    }

    const effectiveStatLevel = parsed.isContinuation ? parsed.parentLevel : parsed.level;
    switch (effectiveStatLevel) {
      case 'fatal':
        stats.fatal++;
        break;
      case 'error':
        stats.error++;
        break;
      case 'warn':
        stats.warn++;
        break;
      case 'info':
        stats.info++;
        break;
      case 'debug':
        stats.debug++;
        break;
      case 'trace':
        stats.trace++;
        break;
      default:
        stats.unknown++;
        break;
    }
  }

  stats.hasTimestamps = timestampCount > 0;
  stats.minDate = minDate;
  stats.maxDate = maxDate;

  return { lines, stats };
}
