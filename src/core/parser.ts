import type { LogLevel, LogStats, ParsedLogLine } from './types.ts';

// Fast level detection regexes (case-insensitive for broad compatibility, but optimized)
const LEVEL_PATTERNS: Array<{ regex: RegExp; level: LogLevel }> = [
  { regex: /\b(FATAL|CRITICAL|EMERGENCY|ALERT)\b/i, level: 'fatal' },
  { regex: /\b(ERROR|ERR|FAIL|FAILURE|EXCEPTION)\b/i, level: 'error' },
  { regex: /\b(WARN|WARNING)\b/i, level: 'warn' },
  { regex: /\b(INFO|NOTICE|INFORMATION)\b/i, level: 'info' },
  { regex: /\b(DEBUG|DBG|FINE|FINER|FINEST)\b/i, level: 'debug' },
  { regex: /\b(TRACE|VERBOSE|SILLY)\b/i, level: 'trace' },
];

// ISO timestamp pattern (e.g., 2026-10-25T04:00:00.123Z or 2026-10-25 04:00:00)
const TIMESTAMP_REGEX =
  /(?:\d{4}[-/.]\d{2}[-/.]\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,6})?(?:Z|[+-]\d{2}:?\d{2})?)|(?:[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})/;

export function detectLogLevel(line: string): LogLevel {
  // Check for JSON log level attribute: "level": "error"
  const jsonLevelMatch = /"level"\s*:\s*"([a-zA-Z]+)"/i.exec(line);
  const matchedLevel = jsonLevelMatch?.[1];
  if (matchedLevel) {
    const rawVal = matchedLevel.toLowerCase();
    if (rawVal.includes('fatal') || rawVal.includes('crit')) return 'fatal';
    if (rawVal.includes('err') || rawVal.includes('fail')) return 'error';
    if (rawVal.includes('warn')) return 'warn';
    if (rawVal.includes('info')) return 'info';
    if (rawVal.includes('deb')) return 'debug';
    if (rawVal.includes('trace') || rawVal.includes('verb')) return 'trace';
  }

  for (const item of LEVEL_PATTERNS) {
    if (item.regex.test(line)) {
      return item.level;
    }
  }

  return 'unknown';
}

export function detectTimestamp(line: string): string | undefined {
  const match = TIMESTAMP_REGEX.exec(line);
  return match ? match[0] : undefined;
}

export function parseSingleLine(raw: string, rawIndex: number): ParsedLogLine {
  const level = detectLogLevel(raw);
  const timestamp = detectTimestamp(raw);

  return {
    rawIndex,
    lineNumber: rawIndex + 1,
    raw,
    timestamp,
    level,
    message: raw,
  };
}

export function parseLogContent(content: string): {
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
  };

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i] ?? '';
    const parsed = parseSingleLine(raw, i);
    lines[i] = parsed;

    switch (parsed.level) {
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

  return { lines, stats };
}
