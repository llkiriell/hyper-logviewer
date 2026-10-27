import { useState } from 'react';
import {
  IconBold,
  IconCheck,
  IconItalic,
  IconPencil,
  IconPlus,
  IconRegex,
  IconRotate2,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import type {
  CustomHighlightRule,
  CustomStandardLevel,
  LogLevel,
} from '../../../core/types.ts';
import { useTranslation } from '../../i18n/index.ts';
import {
  DEFAULT_LEVEL_COLORS,
  setPreferences,
  usePreferences,
} from '../../platform/preferences.ts';
import { Switch } from '../primitives.tsx';
import { SettingRow } from './SettingsRows.tsx';

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

  // Custom standard single-word input state
  const [newStdWord, setNewStdWord] = useState('');
  const [newStdColor, setNewStdColor] = useState('#0284c7');
  const [newStdHasBg, setNewStdHasBg] = useState(true);

  // Custom keyword input / editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#e67e22');
  const [newBold, setNewBold] = useState(true);
  const [newItalic, setNewItalic] = useState(false);
  const [newIsRegex, setNewIsRegex] = useState(false);
  const [regexError, setRegexError] = useState(false);

  const handleUpdateLevelText = (level: LogLevel, textColor: string) => {
    const current = prefs.levelColors[level] ?? DEFAULT_LEVEL_COLORS[level];
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

  // Add custom standard detection word (strict single word validation)
  const handleAddStandardWord = () => {
    // Only take single word, stripped of any whitespace
    const singleWord = newStdWord.trim().split(/\s+/)[0]?.toUpperCase();
    if (!singleWord) return;

    // Check if word already exists
    const exists = (prefs.customStandardLevels ?? []).some(
      (c) => c.word.toUpperCase() === singleWord,
    );
    if (exists) return;

    const newStd: CustomStandardLevel = {
      id: `std-${Date.now()}`,
      word: singleWord,
      textColor: newStdColor,
      bgColor: newStdHasBg ? hexToRgba(newStdColor, 0.1) : 'transparent',
    };

    setPreferences({
      customStandardLevels: [...(prefs.customStandardLevels ?? []), newStd],
    });

    setNewStdWord('');
  };

  const handleUpdateStdWordText = (id: string, textColor: string) => {
    const updated = (prefs.customStandardLevels ?? []).map((item) => {
      if (item.id !== id) return item;
      const safeBg = item.bgColor === 'transparent' ? 'transparent' : hexToRgba(textColor, 0.1);
      return { ...item, textColor, bgColor: safeBg };
    });
    setPreferences({ customStandardLevels: updated });
  };

  const handleToggleStdWordBg = (id: string, enabled: boolean) => {
    const updated = (prefs.customStandardLevels ?? []).map((item) => {
      if (item.id !== id) return item;
      const safeBg = enabled ? hexToRgba(item.textColor, 0.1) : 'transparent';
      return { ...item, bgColor: safeBg };
    });
    setPreferences({ customStandardLevels: updated });
  };

  const handleRemoveStandardWord = (id: string) => {
    setPreferences({
      customStandardLevels: (prefs.customStandardLevels ?? []).filter((w) => w.id !== id),
    });
  };

  const handleKeywordChange = (val: string) => {
    setNewKeyword(val);
    if (newIsRegex && val.trim()) {
      try {
        new RegExp(val.trim());
        setRegexError(false);
      } catch {
        setRegexError(true);
      }
    } else {
      setRegexError(false);
    }
  };

  const handleToggleRegex = () => {
    const nextRegex = !newIsRegex;
    setNewIsRegex(nextRegex);
    if (nextRegex && newKeyword.trim()) {
      try {
        new RegExp(newKeyword.trim());
        setRegexError(false);
      } catch {
        setRegexError(true);
      }
    } else {
      setRegexError(false);
    }
  };

  const handleStartEdit = (rule: CustomHighlightRule) => {
    setEditingId(rule.id);
    setNewKeyword(rule.keyword);
    setNewLabel(rule.label ?? '');
    setNewColor(rule.color);
    setNewBold(rule.bold);
    setNewItalic(rule.italic);
    setNewIsRegex(!!rule.isRegex);
    setRegexError(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewKeyword('');
    setNewLabel('');
    setNewColor('#e67e22');
    setNewBold(true);
    setNewItalic(false);
    setNewIsRegex(false);
    setRegexError(false);
  };

  const handleSaveEdit = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed || !editingId) return;

    if (newIsRegex) {
      try {
        new RegExp(trimmed);
      } catch {
        setRegexError(true);
        return;
      }
    }

    const updated = prefs.customHighlights.map((r) =>
      r.id === editingId
        ? {
            ...r,
            keyword: trimmed,
            label: newLabel.trim() || undefined,
            color: newColor,
            bold: newBold,
            italic: newItalic,
            isRegex: newIsRegex,
          }
        : r,
    );

    setPreferences({
      customHighlights: updated,
    });

    handleCancelEdit();
  };

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed) return;

    if (newIsRegex) {
      try {
        new RegExp(trimmed);
      } catch {
        setRegexError(true);
        return;
      }
    }

    const newRule: CustomHighlightRule = {
      id: `kw-${Date.now()}`,
      keyword: trimmed,
      label: newLabel.trim() || undefined,
      color: newColor,
      bold: newBold,
      italic: newItalic,
      isRegex: newIsRegex,
    };

    setPreferences({
      customHighlights: [...prefs.customHighlights, newRule],
    });

    setNewKeyword('');
    setNewLabel('');
    setNewIsRegex(false);
    setRegexError(false);
  };

  const handleRemoveKeyword = (id: string) => {
    if (editingId === id) {
      handleCancelEdit();
    }
    setPreferences({
      customHighlights: prefs.customHighlights.filter((r) => r.id !== id),
    });
  };

  return (
    <div className="settings-section">
      {/* 0. Colorize Inline Severity & Git Pipeline in Log Body */}
      <div className="settings-group" style={{ marginBottom: '16px' }}>
        <SettingRow
          label={t('settings.parser.colorizeInlineSeverity')}
          help={t('settings.parser.colorizeInlineSeverityHelp')}
        >
          <Switch
            checked={prefs.colorizeInlineSeverity}
            onChange={(colorizeInlineSeverity) => setPreferences({ colorizeInlineSeverity })}
            label={t('settings.parser.colorizeInlineSeverity')}
          />
        </SettingRow>

        <SettingRow
          label={t('settings.parser.showSeverityBg')}
          help={t('settings.parser.showSeverityBgHelp')}
        >
          <Switch
            checked={prefs.showSeverityBackground}
            onChange={(showSeverityBackground) => setPreferences({ showSeverityBackground })}
            label={t('settings.parser.showSeverityBg')}
          />
        </SettingRow>

        <SettingRow
          label={t('settings.parser.highlightGitPipeline')}
          help={t('settings.parser.highlightGitPipelineHelp')}
        >
          <Switch
            checked={prefs.highlightGitPipeline}
            onChange={(highlightGitPipeline) => setPreferences({ highlightGitPipeline })}
            label={t('settings.parser.highlightGitPipeline')}
          />
        </SettingRow>
      </div>

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

      {/* 2. Custom Standard Words (Single Word Only) */}
      <div className="settings-group">
        <h3>{t('settings.parser.customStandardTitle')}</h3>
        <p className="settings-desc">{t('settings.parser.customStandardDesc')}</p>

        {/* Add standard word form card */}
        <div className="std-word-form-card">
          <input
            type="text"
            className="std-word-input"
            value={newStdWord}
            onChange={(e) => setNewStdWord(e.target.value.replace(/\s+/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleAddStandardWord()}
            placeholder={t('settings.parser.standardWordPlaceholder')}
          />

          <div className="std-word-controls">
            <div className="color-picker-wrapper" title={t('settings.parser.textColor')}>
              <span className="keyword-style-label">{t('settings.parser.textColor')}</span>
              <input
                type="color"
                value={newStdColor}
                onChange={(e) => setNewStdColor(e.target.value)}
              />
            </div>

            <label className="bg-toggle-label">
              <input
                type="checkbox"
                checked={newStdHasBg}
                onChange={(e) => setNewStdHasBg(e.target.checked)}
              />
              <span>{t('settings.parser.softBg')}</span>
            </label>

            {newStdWord.trim() && (
              <div className="std-word-preview" title="Vista previa en vivo del badge">
                <span
                  className="level-preview-badge"
                  style={{
                    color: newStdColor,
                    backgroundColor: newStdHasBg ? hexToRgba(newStdColor, 0.1) : 'transparent',
                    border: `1px solid ${newStdHasBg ? newStdColor : 'transparent'}`,
                  }}
                >
                  {newStdWord.trim().toUpperCase()}
                </span>
              </div>
            )}

            <button
              type="button"
              className="button button-sm primary"
              onClick={handleAddStandardWord}
              disabled={!newStdWord.trim()}
            >
              <IconPlus size={15} stroke={1.5} />
              <span>{t('common.add')}</span>
            </button>
          </div>
        </div>

        {/* List of custom standard words */}
        {(prefs.customStandardLevels ?? []).length > 0 && (
          <div className="level-colors-grid" style={{ marginTop: '12px' }}>
            {(prefs.customStandardLevels ?? []).map((std) => {
              const hasBg = std.bgColor !== 'transparent';
              return (
                <div key={std.id} className="level-color-row">
                  <span
                    className="level-preview-badge"
                    style={{
                      color: std.textColor,
                      backgroundColor: std.bgColor,
                      border: `1px solid ${hasBg ? std.textColor : 'transparent'}`,
                    }}
                  >
                    {std.word}
                  </span>

                  <div className="level-controls">
                    <div className="color-picker-wrapper">
                      <label>{t('settings.parser.textColor')}</label>
                      <input
                        type="color"
                        value={std.textColor}
                        onChange={(e) => handleUpdateStdWordText(std.id, e.target.value)}
                      />
                    </div>

                    <label className="bg-toggle-label">
                      <input
                        type="checkbox"
                        checked={hasBg}
                        onChange={(e) => handleToggleStdWordBg(std.id, e.target.checked)}
                      />
                      <span>{t('settings.parser.softBg')}</span>
                    </label>

                    <button
                      type="button"
                      className="search-tool-btn"
                      onClick={() => handleRemoveStandardWord(std.id)}
                      title={t('common.delete')}
                    >
                      <IconTrash size={14} stroke={1.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Custom Highlight Keywords */}
      <div className="settings-group">
        <h3>{t('settings.parser.customKeywordsTitle')}</h3>
        <p className="settings-desc">{t('settings.parser.customKeywordsDesc')}</p>

        {/* Add / Edit keyword form - Clean 2-row layout */}
        <div className={`keyword-form-card ${editingId ? 'is-editing' : ''}`}>
          {editingId && (
            <div className="keyword-editing-header">
              <div className="keyword-editing-badge">
                <IconPencil size={12} stroke={1.5} />
                <span>{t('settings.parser.editingRule')}</span>
              </div>
              <button
                type="button"
                className="button button-sm button-ghost"
                onClick={handleCancelEdit}
                title={t('settings.parser.cancelEdit')}
              >
                <IconX size={14} stroke={1.5} />
                <span>{t('settings.parser.cancelEdit')}</span>
              </button>
            </div>
          )}

          {/* Row 1: Main input fields (Keyword / Regex + Optional Label) */}
          <div className="keyword-form-row">
            <div className="keyword-input-wrapper">
              <input
                type="text"
                className={`keyword-input ${regexError ? 'is-invalid' : ''}`}
                value={newKeyword}
                onChange={(e) => handleKeywordChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (editingId) handleSaveEdit();
                    else handleAddKeyword();
                  } else if (e.key === 'Escape' && editingId) {
                    handleCancelEdit();
                  }
                }}
                placeholder={
                  newIsRegex
                    ? t('settings.parser.regexPlaceholder')
                    : t('settings.parser.keywordPlaceholder')
                }
              />
              <button
                type="button"
                className={`keyword-regex-toggle ${newIsRegex ? 'is-active' : ''}`}
                onClick={handleToggleRegex}
                title={t('settings.parser.isRegex')}
              >
                <IconRegex size={14} stroke={1.5} />
                <span>Regex</span>
              </button>
              {regexError && (
                <span className="keyword-error-hint">{t('settings.parser.regexInvalid')}</span>
              )}
            </div>

            <div className="keyword-label-wrapper">
              <input
                type="text"
                className="keyword-label-input"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (editingId) handleSaveEdit();
                    else handleAddKeyword();
                  } else if (e.key === 'Escape' && editingId) {
                    handleCancelEdit();
                  }
                }}
                placeholder={t('settings.parser.labelPlaceholder')}
                title={t('settings.parser.labelTitle')}
              />
            </div>
          </div>

          {/* Row 2: Format controls, Live preview & Action button */}
          <div className="keyword-form-row keyword-controls-row">
            <div className="keyword-style-group">
              <div className="color-picker-wrapper" title={t('settings.parser.textColor')}>
                <span className="keyword-style-label">{t('settings.parser.textColor')}</span>
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                />
              </div>

              <div className="keyword-format-buttons">
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
              </div>

              {/* Live Preview */}
              {newKeyword.trim() && !regexError && (
                <div className="keyword-live-preview" title="Vista previa en vivo">
                  <span
                    className="keyword-preview-chip"
                    style={{
                      color: newColor,
                      fontWeight: newBold ? 700 : 400,
                      fontStyle: newItalic ? 'italic' : 'normal',
                    }}
                  >
                    {newLabel.trim() ? `[${newLabel.trim()}] ` : ''}
                    {newKeyword.trim()}
                  </span>
                </div>
              )}
            </div>

            <div className="keyword-action-buttons">
              {editingId ? (
                <button
                  type="button"
                  className="button button-sm primary"
                  onClick={handleSaveEdit}
                  disabled={!newKeyword.trim() || regexError}
                  title={t('settings.parser.saveChanges')}
                >
                  <IconCheck size={15} stroke={1.5} />
                  <span>{t('settings.parser.saveChanges')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="button button-sm primary"
                  onClick={handleAddKeyword}
                  disabled={!newKeyword.trim() || regexError}
                >
                  <IconPlus size={15} stroke={1.5} />
                  <span>{t('common.add')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List of custom keywords */}
        <div className="custom-keywords-list">
          {prefs.customHighlights.length === 0 ? (
            <p className="empty-keywords-hint">{t('settings.parser.noKeywords')}</p>
          ) : (
            prefs.customHighlights.map((rule) => {
              const isBeingEdited = editingId === rule.id;
              return (
                <div
                  key={rule.id}
                  className={`keyword-chip-card ${isBeingEdited ? 'is-editing' : ''}`}
                >
                  {rule.label && (
                    <span className="keyword-chip-label" title={rule.label}>
                      {rule.label}
                    </span>
                  )}
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
                    {rule.isRegex && <span className="flag-tag regex-tag">.*</span>}
                    {rule.bold && <span className="flag-tag">B</span>}
                    {rule.italic && <span className="flag-tag">I</span>}
                  </div>

                  <div className="keyword-chip-actions">
                    <button
                      type="button"
                      className={`search-tool-btn ${isBeingEdited ? 'is-active' : ''}`}
                      onClick={() => handleStartEdit(rule)}
                      title={t('common.edit')}
                    >
                      <IconPencil size={13} stroke={1.5} />
                    </button>
                    <button
                      type="button"
                      className="search-tool-btn"
                      onClick={() => handleRemoveKeyword(rule.id)}
                      title={t('common.delete')}
                    >
                      <IconTrash size={13} stroke={1.5} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
