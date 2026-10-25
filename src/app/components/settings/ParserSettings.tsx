import { useState } from 'react';
import {
  IconBold,
  IconItalic,
  IconPlus,
  IconRotate2,
  IconTrash,
} from '@tabler/icons-react';
import type { CustomHighlightRule, LogLevel } from '../../../core/types.ts';
import { useTranslation } from '../../i18n/index.ts';
import {
  DEFAULT_LEVEL_COLORS,
  setPreferences,
  usePreferences,
} from '../../platform/preferences.ts';

const STANDARD_LEVELS: LogLevel[] = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

// Helper to convert hex to rgba with safe, readable opacity for backgrounds
function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return 'transparent';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ParserSettings() {
  const { t } = useTranslation();
  const prefs = usePreferences();

  // Custom keyword input state
  const [newKeyword, setNewKeyword] = useState('');
  const [newColor, setNewColor] = useState('#e67e22');
  const [newBold, setNewBold] = useState(true);
  const [newItalic, setNewItalic] = useState(false);

  const handleUpdateLevelText = (level: LogLevel, textColor: string) => {
    const current = prefs.levelColors[level] ?? DEFAULT_LEVEL_COLORS[level];
    // Keep background calibrated and readable with low opacity tint
    const safeBg = current.bgColor === 'transparent' ? 'transparent' : hexToRgba(textColor, 0.1);
    setPreferences({
      levelColors: {
        ...prefs.levelColors,
        [level]: {
          textColor,
          bgColor: safeBg,
        },
      },
    });
  };

  const handleToggleLevelBg = (level: LogLevel, enabled: boolean) => {
    const current = prefs.levelColors[level] ?? DEFAULT_LEVEL_COLORS[level];
    const safeBg = enabled ? hexToRgba(current.textColor, 0.1) : 'transparent';
    setPreferences({
      levelColors: {
        ...prefs.levelColors,
        [level]: {
          ...current,
          bgColor: safeBg,
        },
      },
    });
  };

  const handleResetLevelColors = () => {
    setPreferences({ levelColors: DEFAULT_LEVEL_COLORS });
  };

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed) return;

    const newRule: CustomHighlightRule = {
      id: `kw-${Date.now()}`,
      keyword: trimmed,
      color: newColor,
      bold: newBold,
      italic: newItalic,
    };

    setPreferences({
      customHighlights: [...prefs.customHighlights, newRule],
    });

    setNewKeyword('');
  };

  const handleRemoveKeyword = (id: string) => {
    setPreferences({
      customHighlights: prefs.customHighlights.filter((r) => r.id !== id),
    });
  };

  return (
    <div className="settings-section">
      {/* 1. Standard Level Colors */}
      <div className="settings-group">
        <div className="settings-group-header">
          <div>
            <h3>{t('settings.parser.levelColorsTitle')}</h3>
            <p className="settings-desc">{t('settings.parser.levelColorsDesc')}</p>
          </div>
          <button
            type="button"
            className="button button-sm button-ghost"
            onClick={handleResetLevelColors}
            title={t('common.reset')}
          >
            <IconRotate2 size={14} stroke={1.5} />
            <span>{t('common.reset')}</span>
          </button>
        </div>

        <div className="level-colors-grid">
          {STANDARD_LEVELS.map((lvl) => {
            const cfg = prefs.levelColors[lvl] ?? DEFAULT_LEVEL_COLORS[lvl];
            const hasBg = cfg.bgColor !== 'transparent';

            return (
              <div key={lvl} className="level-color-row">
                <span
                  className="level-preview-badge"
                  style={{
                    color: cfg.textColor,
                    backgroundColor: cfg.bgColor,
                    border: `1px solid ${hasBg ? cfg.textColor : 'transparent'}`,
                  }}
                >
                  {lvl.toUpperCase()}
                </span>

                <div className="level-controls">
                  <div className="color-picker-wrapper">
                    <label>{t('settings.parser.textColor')}</label>
                    <input
                      type="color"
                      value={cfg.textColor.startsWith('#') ? cfg.textColor : '#b3261e'}
                      onChange={(e) => handleUpdateLevelText(lvl, e.target.value)}
                    />
                  </div>

                  <label className="bg-toggle-label">
                    <input
                      type="checkbox"
                      checked={hasBg}
                      onChange={(e) => handleToggleLevelBg(lvl, e.target.checked)}
                    />
                    <span>{t('settings.parser.softBg')}</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Custom Highlight Keywords */}
      <div className="settings-group">
        <h3>{t('settings.parser.customKeywordsTitle')}</h3>
        <p className="settings-desc">{t('settings.parser.customKeywordsDesc')}</p>

        {/* Add keyword form */}
        <div className="keyword-add-bar">
          <input
            type="text"
            className="keyword-input"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
            placeholder={t('settings.parser.keywordPlaceholder')}
          />

          <div className="color-picker-wrapper">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              title={t('settings.parser.textColor')}
            />
          </div>

          <button
            type="button"
            className={`button button-sm ${newBold ? 'primary' : 'button-ghost'}`}
            onClick={() => setNewBold((p) => !p)}
            title={t('settings.parser.bold')}
          >
            <IconBold size={15} stroke={2} />
          </button>

          <button
            type="button"
            className={`button button-sm ${newItalic ? 'primary' : 'button-ghost'}`}
            onClick={() => setNewItalic((p) => !p)}
            title={t('settings.parser.italic')}
          >
            <IconItalic size={15} stroke={2} />
          </button>

          <button
            type="button"
            className="button button-sm primary"
            onClick={handleAddKeyword}
            disabled={!newKeyword.trim()}
          >
            <IconPlus size={15} stroke={1.5} />
            <span>{t('common.add')}</span>
          </button>
        </div>

        {/* List of custom keywords */}
        <div className="custom-keywords-list">
          {prefs.customHighlights.length === 0 ? (
            <p className="empty-keywords-hint">{t('settings.parser.noKeywords')}</p>
          ) : (
            prefs.customHighlights.map((rule) => (
              <div key={rule.id} className="keyword-chip-card">
                <span
                  className="keyword-preview-text"
                  style={{
                    color: rule.color,
                    fontWeight: rule.bold ? 'bold' : 'normal',
                    fontStyle: rule.italic ? 'italic' : 'normal',
                  }}
                >
                  {rule.keyword}
                </span>

                <div className="keyword-flags">
                  {rule.bold && <span className="flag-tag">B</span>}
                  {rule.italic && <span className="flag-tag">I</span>}
                </div>

                <button
                  type="button"
                  className="search-tool-btn"
                  onClick={() => handleRemoveKeyword(rule.id)}
                  title={t('common.delete')}
                >
                  <IconTrash size={14} stroke={1.5} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
