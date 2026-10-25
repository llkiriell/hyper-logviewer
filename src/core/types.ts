export type LogLevel =
  | 'fatal'
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'trace'
  | 'unknown';

export type JsonTheme = 'postman' | 'insomnia';

export interface ParsedLogLine {
  rawIndex: number;
  lineNumber: number;
  raw: string;
  timestamp?: string;
  parsedDate?: Date;
  dateKey?: string; // YYYY-MM-DD
  timeKey?: string; // HH:mm:ss
  jsonPayloads?: string[];
  level: LogLevel;
  customLevelTag?: string; // If matched a custom standard word
  message: string;
}

export interface LogStats {
  total: number;
  fatal: number;
  error: number;
  warn: number;
  info: number;
  debug: number;
  trace: number;
  unknown: number;
  hasTimestamps: boolean;
  minDate?: string;
  maxDate?: string;
}

export interface DateRangeFilter {
  enabled: boolean;
  mode: 'range' | 'single';
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  singleDate?: string;// YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
}

export interface CustomHighlightRule {
  id: string;
  keyword: string;
  color: string;
  bold: boolean;
  italic: boolean;
}

export interface LevelColorConfig {
  textColor: string;
  bgColor: string;
}

export interface CustomStandardLevel {
  id: string;
  word: string; // single word, e.g. "SUCCESS", "CRITICAL", "PANIC"
  textColor: string;
  bgColor: string;
}

export interface FilterOptions {
  level: LogLevel | 'all';
  searchQuery: string;
  isRegex: boolean;
  caseSensitive: boolean;
  dateFilter?: DateRangeFilter;
}

export interface SearchMatchRange {
  start: number;
  end: number;
}

export interface SearchMatchLocation {
  lineIndex: number; // Index within the filteredLines array
  matchIndex: number; // 0-based global match index
  start: number;
  end: number;
}
