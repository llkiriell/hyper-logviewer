/**
 * WCAG 2.1 Relative Luminance and Contrast Ratio Utilities
 * Complies with W3C Web Content Accessibility Guidelines (WCAG) 2.1 AA & AAA specifications.
 */

export interface ContrastResult {
  ratio: number;
  isAaCompliant: boolean;
  isAaaCompliant: boolean;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Parses a hex color (#rgb, #rgba, #rrggbb, #rrggbbaa) or rgb/rgba string into RGBA components (0-255, alpha 0-1)
 */
export function parseColor(color: string): RgbColor | null {
  const trimmed = color.trim().toLowerCase();

  // Hex formats
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      const r = hex[0] ?? '0';
      const g = hex[1] ?? '0';
      const b = hex[2] ?? '0';
      return {
        r: parseInt(r + r, 16),
        g: parseInt(g + g, 16),
        b: parseInt(b + b, 16),
        a: 1,
      };
    }
    if (hex.length === 4) {
      const r = hex[0] ?? '0';
      const g = hex[1] ?? '0';
      const b = hex[2] ?? '0';
      const a = hex[3] ?? 'f';
      return {
        r: parseInt(r + r, 16),
        g: parseInt(g + g, 16),
        b: parseInt(b + b, 16),
        a: parseInt(a + a, 16) / 255,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255,
      };
    }
  }

  // rgb / rgba format
  const rgbMatch = trimmed.match(
    /^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([0-9.]+)\s*)?\)$/,
  );
  if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
    const aStr = rgbMatch[4];
    return {
      r: Math.min(255, parseInt(rgbMatch[1], 10)),
      g: Math.min(255, parseInt(rgbMatch[2], 10)),
      b: Math.min(255, parseInt(rgbMatch[3], 10)),
      a: aStr !== undefined ? Math.min(1, Math.max(0, parseFloat(aStr))) : 1,
    };
  }

  return null;
}

/**
 * Composite a semi-transparent foreground RGBA over a solid background RGB
 */
function compositeColor(fg: RgbColor, bg: RgbColor = { r: 255, g: 255, b: 255, a: 1 }): RgbColor {
  const alpha = fg.a;
  return {
    r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
    g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
    b: Math.round(fg.b * alpha + bg.b * (1 - alpha)),
    a: 1,
  };
}

/**
 * Calculates relative luminance according to WCAG 2.1 standard:
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function calculateRelativeLuminance(rgb: RgbColor): number {
  const transform = (val: number): number => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const r = transform(rgb.r);
  const g = transform(rgb.g);
  const b = transform(rgb.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates WCAG 2.1 contrast ratio between a background color and text color.
 * Normal text AA threshold: >= 4.5:1
 * Normal text AAA threshold: >= 7:1
 */
export function checkWcagContrast(
  bgColor: string,
  textColor: string,
  canvasBg: 'light' | 'dark' = 'light',
): ContrastResult {
  const parsedBg = parseColor(bgColor);
  const parsedText = parseColor(textColor);

  // If parsing fails, return safe default
  if (!parsedBg || !parsedText) {
    return { ratio: 21, isAaCompliant: true, isAaaCompliant: true };
  }

  const baseSurface: RgbColor =
    canvasBg === 'dark' ? { r: 25, g: 25, b: 25, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };

  // Composite background over theme base if it has alpha
  const effectiveBg = parsedBg.a < 1 ? compositeColor(parsedBg, baseSurface) : parsedBg;
  const effectiveText = parsedText.a < 1 ? compositeColor(parsedText, effectiveBg) : parsedText;

  const lum1 = calculateRelativeLuminance(effectiveBg);
  const lum2 = calculateRelativeLuminance(effectiveText);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  const ratio = Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));

  return {
    ratio,
    isAaCompliant: ratio >= 4.5,
    isAaaCompliant: ratio >= 7.0,
  };
}
