export type LogLevel =
  | 'fatal'
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'trace'
  | 'unknown';

export interface ParsedLogLine {
  rawIndex: number;
  lineNumber: number;
  raw: string;
  timestamp?: string;
  level: LogLevel;
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
}

export interface FilterOptions {
  level: LogLevel | 'all';
  searchQuery: string;
  isRegex: boolean;
  caseSensitive: boolean;
}

export interface SearchMatchRange {
  start: number;
  end: number;
}
