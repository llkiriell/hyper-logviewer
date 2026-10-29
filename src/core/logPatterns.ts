import type { CustomLogEntityPattern } from './types.ts';

export interface DetectedCurlRequest {
  raw: string;
  command: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  params?: Record<string, string>;
  body?: string;
  uuid?: string;
}

export interface DetectedJavaError {
  exceptionClass: string;
  simpleName: string;
  message: string;
  targetUrl?: string;
  nestedCauses: string[];
  stackTrace: string[];
  rawBlock: string;
}

/**
 * Detects and extracts a structured cURL command from a log line
 * Handles:
 * 1. ApiLoggerFilter Request pattern: Request:::: UUID (...) | Headers ([...]) | Params ([...]) | Body ([...])
 * 2. Raw curl commands: curl -X ...
 * 3. HTTP method + URL patterns: POST http://...
 */
export function detectCurlPattern(rawLine: string): DetectedCurlRequest | null {
  // 1. ApiLoggerFilter / Request pattern
  if (rawLine.includes('Request::::') || (rawLine.includes('Headers ([') && rawLine.includes('Params (['))) {
    const uuidMatch = rawLine.match(/UUID\s*\(([^)]+)\)/i);
    const uuid = uuidMatch ? uuidMatch[1]?.trim() : undefined;

    // Extract Headers ([ ... ])
    const headersMatch = rawLine.match(/Headers\s*\(\[([\s\S]*?)\]\)/);
    const headers: Record<string, string> = {};
    if (headersMatch && headersMatch[1]) {
      const headerPairs = headersMatch[1].match(/([a-zA-Z0-9_-]+)=\[([^\]]*)\]/g);
      if (headerPairs) {
        for (const pair of headerPairs) {
          const m = pair.match(/([a-zA-Z0-9_-]+)=\[([^\]]*)\]/);
          if (m && m[1]) {
            headers[m[1]] = m[2] ?? '';
          }
        }
      }
    }

    // Extract Params ([ ... ])
    const paramsMatch = rawLine.match(/Params\s*\(\[([\s\S]*?)\]\)/);
    const params: Record<string, string> = {};
    if (paramsMatch && paramsMatch[1]) {
      const paramPairs = paramsMatch[1].match(/([a-zA-Z0-9_-]+)=\[([^\]]*)\]/g);
      if (paramPairs) {
        for (const pair of paramPairs) {
          const m = pair.match(/([a-zA-Z0-9_-]+)=\[([^\]]*)\]/);
          if (m && m[1]) {
            params[m[1]] = m[2] ?? '';
          }
        }
      }
    }

    // Extract Body ([ ... ])
    const bodyMatch = rawLine.match(/Body\s*\(\[([\s\S]*?)\]\)/);
    let body = bodyMatch ? bodyMatch[1]?.trim() : undefined;
    if (body === '[]' || body === '') body = undefined;

    // Detect Method (POST, GET, etc.)
    let method = 'GET';
    const methodMatch = rawLine.match(/\b(POST|GET|PUT|DELETE|PATCH)\b/i);
    if (methodMatch && methodMatch[1]) {
      method = methodMatch[1].toUpperCase();
    } else if (body && body.length > 0) {
      method = 'POST';
    }

    // Detect Host / URL
    const host = headers['host'] || 'localhost';
    let url = host.startsWith('http://') || host.startsWith('https://')
      ? host
      : `http://${host}`;

    // Look for path in rawLine
    const uriMatch = rawLine.match(/(?:URI|path|endpoint|url|request for)\s*[:="']?\s*([/a-zA-Z0-9_.-]+(?:\?[^\s"'>]+)?)/i);
    if (uriMatch && uriMatch[1] && !uriMatch[1].startsWith('http')) {
      const path = uriMatch[1].startsWith('/') ? uriMatch[1] : `/${uriMatch[1]}`;
      url = `${url}${path}`;
    }

    // Construct cURL command
    const parts: string[] = [`curl -X ${method} "${url}"`];
    for (const [key, val] of Object.entries(headers)) {
      parts.push(`  -H "${key}: ${val}"`);
    }

    if (body) {
      // Escape inner quotes
      const escapedBody = body.replace(/"/g, '\\"');
      parts.push(`  -d "${escapedBody}"`);
    }

    const command = parts.join(' \\\n');

    return {
      raw: rawLine,
      command,
      method,
      url,
      headers,
      params: Object.keys(params).length > 0 ? params : undefined,
      body,
      uuid,
    };
  }

  // 2. Existing curl command in log
  const curlMatch = rawLine.match(/(curl\s+[\s\S]+)/);
  if (curlMatch && curlMatch[1]) {
    const rawCmd = curlMatch[1].trim();
    // Split on -H, -d, -X etc to format multi-line
    const formatted = rawCmd
      .replace(/\s+(-H|-d|-X|--data|--header)/g, ' \\\n  $1')
      .trim();

    const methodM = rawCmd.match(/-X\s+([A-Z]+)/);
    const method = methodM && methodM[1] ? methodM[1] : 'GET';
    const urlM = rawCmd.match(/["']?(https?:\/\/[^\s"']+)["']?/);
    const url = urlM && urlM[1] ? urlM[1] : '';

    return {
      raw: rawLine,
      command: formatted,
      method,
      url,
      headers: {},
    };
  }

  return null;
}

/**
 * Detects Java Exception and stack traces inside a log line or multi-line block.
 * Strictly verifies that a real Java Exception class or legitimate Java stacktrace frames exist.
 */
export function detectJavaErrorPattern(rawLine: string, nextLines?: string[]): DetectedJavaError | null {
  if (!rawLine) return null;

  // 1. Strict regex for Java exception class: e.g. java.lang.NullPointerException, java.nio.file.NoSuchFileException
  const exceptionRegex = /\b(([a-zA-Z_$][a-zA-Z0-9_$]*\.)+([a-zA-Z0-9_$]+(?:Exception|Error)))(?::\s*([^\n\r]*))?/;
  const match = rawLine.match(exceptionRegex);

  // 2. Strict regex for Java stack trace frame: \tat com.example.MyClass.method(MyClass.java:123)
  const atFrameRegex = /^\s*at\s+([a-zA-Z0-9_$./]+)\(([^)]+)\)/;
  const lineHasFrame = atFrameRegex.test(rawLine);

  // If the line neither contains a Java Exception class nor a Java stack frame,
  // we do NOT treat it as a Java error (prevents false positives on plain English words like "at").
  if (!match && !lineHasFrame) {
    return null;
  }

  const fullClass = match ? match[1] : (lineHasFrame ? 'StackFrame' : null);
  if (!fullClass) {
    return null;
  }

  const simpleName = match && match[3] ? match[3] : fullClass.split('.').pop() || fullClass;
  const message = match && match[4] ? match[4].trim() : '';

  // Extract target URL if present in error message
  const urlMatch = rawLine.match(/https?:\/\/[^\s"'<>]+/);
  const targetUrl = urlMatch ? urlMatch[0] : undefined;

  // Extract nested causes
  const nestedCauses: string[] = [];
  const causeRegex = /(?:sun|java|javax|org|com|[a-zA-Z_$][a-zA-Z0-9_$]*)\.[a-zA-Z0-9_$.]+(?:Exception|Error):[^\n\r;:]+/g;
  let causeMatch: RegExpExecArray | null;
  while ((causeMatch = causeRegex.exec(rawLine)) !== null) {
    const causeStr = causeMatch[0].trim();
    if (!causeStr.startsWith(fullClass) && !nestedCauses.includes(causeStr)) {
      nestedCauses.push(causeStr);
    }
  }

  // Extract stack trace frames from line or nextLines
  const stackTrace: string[] = [];
  const globalAtRegex = /^\s*at\s+([a-zA-Z0-9_$./]+)\(([^)]+)\)/gm;
  let atMatch: RegExpExecArray | null;
  while ((atMatch = globalAtRegex.exec(rawLine)) !== null) {
    stackTrace.push(`at ${atMatch[1]}(${atMatch[2]})`);
  }

  if (nextLines) {
    for (const line of nextLines) {
      const trimmed = line.trim();
      if (atFrameRegex.test(trimmed) || trimmed.startsWith('Caused by:') || trimmed.startsWith('... ')) {
        stackTrace.push(trimmed);
      } else {
        break; // Stop at end of stacktrace
      }
    }
  }

  // If there is no real exception class and no stack trace frames, it is NOT a Java error
  if (!match && stackTrace.length === 0) {
    return null;
  }

  // Build raw block for copying
  const rawParts: string[] = [
    `${fullClass}${message ? `: ${message}` : ''}`,
    ...nestedCauses.map((c) => `  Caused by: ${c}`),
    ...stackTrace.map((st) => `    ${st}`),
  ];

  return {
    exceptionClass: fullClass,
    simpleName,
    message,
    targetUrl,
    nestedCauses,
    stackTrace,
    rawBlock: rawParts.join('\n'),
  };
}

export interface ExtractedLogEntities {
  uuids: string[];
  filePaths: string[];
  urls: string[];
}

/**
 * Extracts key operational entities from a raw log line:
 * - UUIDs (e.g. 8-4-4-4-12 hex formats with or without parentheses)
 * - File paths (Windows: C:\... or C:/..., Unix: /var/log/...)
 * - URLs (http:// or https://)
 */
export function extractLogEntities(rawLine: string): ExtractedLogEntities {
  if (!rawLine) {
    return { uuids: [], filePaths: [], urls: [] };
  }

  // 1. UUIDs (8-4-4-4-12 hex format)
  const uuidRegex = /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g;
  const rawUuids = rawLine.match(uuidRegex) ?? [];
  const uuids = Array.from(new Set(rawUuids));

  // 2. URLs (http:// or https://)
  const urlRegex = /\bhttps?:\/\/[^\s"'<>)\]]+/g;
  const rawUrls = (rawLine.match(urlRegex) ?? []).map((u) => u.replace(/[,\.;:\)\]'"]+$/, ''));
  const urls = Array.from(new Set(rawUrls));

  // 3. File Paths (Windows: C:\... or C:/..., Unix: /var/log/...)
  const filePaths: string[] = [];

  // Windows absolute paths with drive letter (e.g., C:\Users\extanec/logs/wsrsctr/wsrsctr.log or D:\App\file.txt)
  const winPathRegex = /\b[a-zA-Z]:[\\/](?:[^\\/:*?"<>|\r\n\s]+[\\/])*[^\\/:*?"<>|\r\n\s,;:)\]]+/g;
  const rawWinPaths = rawLine.match(winPathRegex) ?? [];
  for (const wp of rawWinPaths) {
    const clean = wp.replace(/[,\.;:\)\]'"]+$/, '');
    if (clean.length > 3 && (clean.includes('\\') || clean.includes('/'))) {
      if (!filePaths.includes(clean)) {
        filePaths.push(clean);
      }
    }
  }

  // Unix absolute paths (/var/log/..., /home/user/..., etc.)
  const unixPathRegex = /(?:^|[\s"'(\[])(\/(?:[a-zA-Z0-9_.-]+[\\/])+[a-zA-Z0-9_.-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = unixPathRegex.exec(rawLine)) !== null) {
    const p = match[1];
    if (p) {
      const clean = p.replace(/[,\.;:\)\]'"]+$/, '');
      const isPartOfUrl = urls.some((u) => u.includes(clean));
      if (!isPartOfUrl && clean.length > 3 && !filePaths.includes(clean)) {
        filePaths.push(clean);
      }
    }
  }

  return {
    uuids: uuids.slice(0, 2),
    filePaths: filePaths.slice(0, 2),
    urls: urls.slice(0, 2),
  };
}

export interface DetectedGitPipeline {
  operation?: 'merge' | 'checkout' | 'fetch' | 'conflict' | 'commit' | 'branch';
  branch?: string;
  branches: string[];
  conflictFile?: string;
  isMergeDelimiter: boolean;
  strategy?: string;
  rawSummary?: string;
}

/**
 * Detects and extracts Git & Jenkins Pipeline operations, branches, and conflicts.
 */
export function detectGitPipeline(rawText: string): DetectedGitPipeline | null {
  if (!rawText) return null;

  // 1. Check for merge delimiter: ############# merge <branch>
  const delimMatch = rawText.match(/#############\s*merge\s+([^\s]+)/i);
  if (delimMatch && delimMatch[1]) {
    const rawBranch = delimMatch[1].replace(/^(?:refs\/remotes\/origin\/|origin\/)/, '');
    return {
      operation: 'merge',
      branch: rawBranch,
      branches: [rawBranch],
      isMergeDelimiter: true,
      rawSummary: `Merge delimiter: ${rawBranch}`,
    };
  }

  // 2. Conflict detection: CONFLICT (content): Merge conflict in <file>
  const conflictMatch = rawText.match(/CONFLICT\s*\([^)]*\):\s*Merge conflict in\s+([^\s\r\n]+)/i);
  const conflictFile = conflictMatch ? conflictMatch[1] : undefined;

  // 3. Strategy detection: Merge made by the 'ort' strategy.
  const stratMatch = rawText.match(/Merge made by the ['"]?([a-zA-Z0-9_-]+)['"]? strategy/i);
  const strategy = stratMatch ? stratMatch[1] : undefined;

  // 4. Branch detection regex: feature/..., hotfix/..., bugfix/..., release/..., fix/...
  const branchRegex = /\b(?:refs\/remotes\/origin\/|refs\/heads\/|origin\/)?((?:feature|hotfix|bugfix|release|fix)\/[a-zA-Z0-9_\-\.\/]+)\b/gi;
  const branches: string[] = [];
  let bm: RegExpExecArray | null;
  while ((bm = branchRegex.exec(rawText)) !== null) {
    const b = bm[1];
    if (b && !branches.includes(b)) {
      branches.push(b);
    }
  }

  // Common main branches in explicit git context
  const gitContextBranch = /(?:git\s+(?:merge|checkout|branch|fetch)|pull request.*from|into|Merged in)\s+(?:refs\/remotes\/origin\/|refs\/heads\/|origin\/)?(master|main|develop)\b/i;
  const mainM = rawText.match(gitContextBranch);
  if (mainM && mainM[1] && !branches.includes(mainM[1])) {
    branches.push(mainM[1]);
  }

  // 5. Detect operation
  let operation: DetectedGitPipeline['operation'] = undefined;
  if (conflictFile || /\b(?:CONFLICT|Automatic merge failed)\b/i.test(rawText)) {
    operation = 'conflict';
  } else if (/\b(?:git\s+merge|merge pull request|Auto-merging)\b/i.test(rawText)) {
    operation = 'merge';
  } else if (/\b(?:git\s+checkout|Checking out Revision|Checking out git)\b/i.test(rawText)) {
    operation = 'checkout';
  } else if (/\b(?:git\s+fetch|Fetching upstream|Fetching changes)\b/i.test(rawText)) {
    operation = 'fetch';
  } else if (/\b(?:git\s+branch)\b/i.test(rawText)) {
    operation = 'branch';
  } else if (/\bCommit message:\b/i.test(rawText)) {
    operation = 'commit';
  }

  if (branches.length > 0 || operation || conflictFile) {
    return {
      operation,
      branch: branches[0],
      branches,
      conflictFile,
      isMergeDelimiter: false,
      strategy,
      rawSummary: operation ? `Git ${operation}` : undefined,
    };
  }

  return null;
}

export interface ExtractedCustomEntity {
  id: string;
  label: string;
  value: string;
}

/**
 * Extracts matches for custom configured entity patterns (e.g. JPA procedures, tokens)
 */
export function extractCustomEntities(
  rawLine: string,
  patterns?: CustomLogEntityPattern[],
): ExtractedCustomEntity[] {
  if (!rawLine || !patterns || patterns.length === 0) return [];
  const results: ExtractedCustomEntity[] = [];

  for (const pat of patterns) {
    if (!pat.enabled || !pat.pattern.trim()) continue;
    try {
      const rx = new RegExp(pat.pattern, 'gi');
      let match: RegExpExecArray | null;
      let count = 0;
      while ((match = rx.exec(rawLine)) !== null) {
        let val = match[0].trim();
        if (val) {
          // Aplicar regex secundario de transformación / extracción si está definido
          if (pat.transformPattern && pat.transformPattern.trim()) {
            try {
              const subRx = new RegExp(pat.transformPattern.trim(), 'i');
              const subMatch = subRx.exec(val);
              if (subMatch) {
                val = (subMatch[1] ?? subMatch[0]).trim();
              }
            } catch {
              // si el regex secundario falla se conserva el valor capturado
            }
          }

          count++;
          results.push({
            id: pat.id,
            label: pat.label.trim()
              ? `${pat.label.trim()}${count > 1 ? ` ${count}` : ''}`
              : `Elemento ${count}`,
            value: val,
          });
        }
        if (rx.lastIndex === match.index) rx.lastIndex++;
        if (count >= 2) break; // Máximo 2 ocurrencias por patrón
      }
    } catch {
      // ignore invalid regex
    }
  }

  return results;
}
