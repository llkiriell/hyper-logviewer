export interface BracketInfo {
  pairId: number;
  depth: number;
  char: string;
  isOpening: boolean;
  partnerIndex: number;
}

const OPENING_BRACKETS: Record<string, string> = {
  '{': '}',
  '[': ']',
  '(': ')',
};

const CLOSING_BRACKETS: Record<string, string> = {
  '}': '{',
  ']': '[',
  ')': '(',
};

export const RAINBOW_COLORS = [
  '#e6a700', // Gold / Warm yellow (depth 0)
  '#b24dcb', // Purple / Magenta (depth 1)
  '#0288d1', // Sky Blue / Cyan (depth 2)
  '#e53935', // Coral Red (depth 3)
  '#2e7d32', // Emerald Green (depth 4)
];

export const RAINBOW_COLORS_DARK = [
  '#ffd700', // Bright Gold (depth 0)
  '#e07ce8', // Bright Orchid (depth 1)
  '#4fc3f7', // Bright Cyan (depth 2)
  '#ff7b72', // Bright Coral (depth 3)
  '#7ee787', // Bright Mint (depth 4)
];

/**
 * Parses all brackets in a string and maps their nesting depth and paired partner index.
 */
export function analyzeBrackets(text: string): Map<number, BracketInfo> {
  const map = new Map<number, BracketInfo>();
  const stack: Array<{ char: string; index: number; depth: number; pairId: number }> = [];
  let pairCounter = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (!char) continue;

    if (OPENING_BRACKETS[char]) {
      const depth = stack.length;
      const pairId = ++pairCounter;
      stack.push({ char, index: i, depth, pairId });
    } else if (CLOSING_BRACKETS[char]) {
      const expectedOpen = CLOSING_BRACKETS[char];
      // Search backwards in stack for matching opening bracket
      let matchIdx = -1;
      for (let s = stack.length - 1; s >= 0; s--) {
        if (stack[s]?.char === expectedOpen) {
          matchIdx = s;
          break;
        }
      }

      if (matchIdx !== -1) {
        const open = stack[matchIdx];
        if (open) {
          stack.splice(matchIdx, 1);
          // Register both opening and closing
          map.set(open.index, {
            pairId: open.pairId,
            depth: open.depth,
            char: open.char,
            isOpening: true,
            partnerIndex: i,
          });
          map.set(i, {
            pairId: open.pairId,
            depth: open.depth,
            char,
            isOpening: false,
            partnerIndex: open.index,
          });
        }
      }
    }
  }

  // Any unclosed brackets get single entry with depth
  for (const unclosed of stack) {
    map.set(unclosed.index, {
      pairId: unclosed.pairId,
      depth: unclosed.depth,
      char: unclosed.char,
      isOpening: true,
      partnerIndex: -1,
    });
  }

  return map;
}
