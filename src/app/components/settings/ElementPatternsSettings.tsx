import { useMemo, useState } from 'react';
import {
  IconCheck,
  IconPencil,
  IconPlus,
  IconRegex,
  IconSparkles,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import type { CustomLogEntityPattern } from '../../../core/types.ts';
import { useTranslation } from '../../i18n/index.ts';
import { setPreferences, usePreferences } from '../../platform/preferences.ts';
import { Switch } from '../primitives.tsx';

const DEFAULT_SAMPLE_LOG = '2026-10-29 12:45:00.123 [HTTP-Worker] [GET] /api/v1/orders/8821?status=pending HTTP/1.1';

export function ElementPatternsSettings() {
  const { t } = useTranslation();
  const prefs = usePreferences();

  // Add / Edit Pattern State
  const [patternEditingId, setPatternEditingId] = useState<string | null>(null);
  const [newPatternRegex, setNewPatternRegex] = useState('');
  const [newTransformRegex, setNewTransformRegex] = useState('');
  const [newPatternLabel, setNewPatternLabel] = useState('');
  const [sampleText, setSampleText] = useState(DEFAULT_SAMPLE_LOG);
  const [patternRegexError, setPatternRegexError] = useState(false);
  const [transformRegexError, setTransformRegexError] = useState(false);

  // Live Preview Calculation
  const preview = useMemo(() => {
    if (!newPatternRegex.trim() || patternRegexError || !sampleText.trim()) {
      return null;
    }
    try {
      const rx = new RegExp(newPatternRegex.trim(), 'i');
      const match = rx.exec(sampleText);
      if (!match) {
        return { matched: false };
      }
      const rawCaptured = match[0].trim();
      let extracted = rawCaptured;

      if (newTransformRegex.trim() && !transformRegexError) {
        try {
          const subRx = new RegExp(newTransformRegex.trim(), 'i');
          const subMatch = subRx.exec(rawCaptured);
          if (subMatch) {
            extracted = (subMatch[1] ?? subMatch[0]).trim();
          }
        } catch {
          // Keep raw captured if transform regex fails
        }
      }

      return {
        matched: true,
        captured: rawCaptured,
        extracted,
        label: newPatternLabel.trim() || 'Elemento',
      };
    } catch {
      return null;
    }
  }, [newPatternRegex, newTransformRegex, newPatternLabel, sampleText, patternRegexError, transformRegexError]);

  const handlePatternRegexChange = (val: string) => {
    setNewPatternRegex(val);
    if (!val.trim()) {
      setPatternRegexError(false);
      return;
    }
    try {
      new RegExp(val, 'gi');
      setPatternRegexError(false);
    } catch {
      setPatternRegexError(true);
    }
  };

  const handleTransformRegexChange = (val: string) => {
    setNewTransformRegex(val);
    if (!val.trim()) {
      setTransformRegexError(false);
      return;
    }
    try {
      new RegExp(val, 'i');
      setTransformRegexError(false);
    } catch {
      setTransformRegexError(true);
    }
  };

  const handleAddPattern = () => {
    if (!newPatternRegex.trim() || patternRegexError || transformRegexError) return;

    const newPat: CustomLogEntityPattern = {
      id: `pat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      pattern: newPatternRegex.trim(),
      transformPattern: newTransformRegex.trim() || undefined,
      label: newPatternLabel.trim() || 'Elemento',
      enabled: true,
    };

    setPreferences({
      customEntityPatterns: [...(prefs.customEntityPatterns ?? []), newPat],
    });

    setNewPatternRegex('');
    setNewTransformRegex('');
    setNewPatternLabel('');
  };

  const handleStartEditPattern = (pat: CustomLogEntityPattern) => {
    setPatternEditingId(pat.id);
    setNewPatternRegex(pat.pattern);
    setNewTransformRegex(pat.transformPattern ?? '');
    setNewPatternLabel(pat.label);
    setPatternRegexError(false);
    setTransformRegexError(false);
  };

  const handleCancelEditPattern = () => {
    setPatternEditingId(null);
    setNewPatternRegex('');
    setNewTransformRegex('');
    setNewPatternLabel('');
    setPatternRegexError(false);
    setTransformRegexError(false);
  };

  const handleSaveEditPattern = () => {
    if (!patternEditingId || !newPatternRegex.trim() || patternRegexError || transformRegexError) return;

    setPreferences({
      customEntityPatterns: (prefs.customEntityPatterns ?? []).map((p) =>
        p.id === patternEditingId
          ? {
              ...p,
              pattern: newPatternRegex.trim(),
              transformPattern: newTransformRegex.trim() || undefined,
              label: newPatternLabel.trim() || 'Elemento',
            }
          : p,
      ),
    });

    handleCancelEditPattern();
  };

  const handleDeletePattern = (id: string) => {
    if (patternEditingId === id) {
      handleCancelEditPattern();
    }
    setPreferences({
      customEntityPatterns: (prefs.customEntityPatterns ?? []).filter((p) => p.id !== id),
    });
  };

  const handleTogglePattern = (id: string, enabled: boolean) => {
    setPreferences({
      customEntityPatterns: (prefs.customEntityPatterns ?? []).map((p) =>
        p.id === id ? { ...p, enabled } : p,
      ),
    });
  };

  return (
    <div className="settings-section">
      <div className="settings-group">
        <h3>{t('settings.patterns.title')}</h3>
        <p className="settings-desc">{t('settings.patterns.desc')}</p>

        {/* Form Card */}
        <div className={`keyword-form-card ${patternEditingId ? 'is-editing' : ''}`}>
          {patternEditingId && (
            <div className="keyword-editing-header">
              <div className="keyword-editing-badge">
                <IconPencil size={12} stroke={1.5} />
                <span>{t('settings.parser.editingRule')}</span>
              </div>
              <button
                type="button"
                className="button button-sm button-ghost"
                onClick={handleCancelEditPattern}
                title={t('settings.parser.cancelEdit')}
              >
                <IconX size={14} stroke={1.5} />
                <span>{t('settings.parser.cancelEdit')}</span>
              </button>
            </div>
          )}

          {/* Row 1: Primary capture regex & Label */}
          <div className="keyword-form-row">
            <div className="keyword-input-wrapper">
              <input
                type="text"
                className={`keyword-input ${patternRegexError ? 'is-invalid' : ''}`}
                value={newPatternRegex}
                onChange={(e) => handlePatternRegexChange(e.target.value)}
                placeholder={t('settings.patterns.patternPlaceholder')}
                title="Regex de captura principal"
              />
              <span className="keyword-regex-toggle is-active" title="Regex">
                <IconRegex size={14} stroke={1.5} />
                <span>Regex</span>
              </span>
              {patternRegexError && (
                <span className="keyword-error-hint">{t('settings.parser.regexInvalid')}</span>
              )}
            </div>

            <div className="keyword-label-wrapper">
              <input
                type="text"
                className="keyword-label-input"
                value={newPatternLabel}
                onChange={(e) => setNewPatternLabel(e.target.value)}
                placeholder={t('settings.patterns.labelPlaceholder')}
              />
            </div>
          </div>

          {/* Row 2: Secondary extraction/transform regex */}
          <div className="keyword-form-row">
            <div className="keyword-input-wrapper" style={{ flex: 1 }}>
              <input
                type="text"
                className={`keyword-input ${transformRegexError ? 'is-invalid' : ''}`}
                value={newTransformRegex}
                onChange={(e) => handleTransformRegexChange(e.target.value)}
                placeholder={t('settings.patterns.transformPlaceholder')}
                title="Regex opcional para extraer o transformar el valor capturado"
              />
              <span className="keyword-regex-toggle is-active" title="Sub-regex">
                <IconSparkles size={14} stroke={1.5} />
                <span>Filtro</span>
              </span>
              {transformRegexError && (
                <span className="keyword-error-hint">{t('settings.parser.regexInvalid')}</span>
              )}
            </div>
          </div>

          {/* Row 3: Live Preview Test Workbench */}
          <div className="pattern-workbench-card">
            <div className="pattern-workbench-header">
              <IconSparkles size={14} stroke={1.5} style={{ color: 'var(--accent)' }} />
              <span>{t('settings.patterns.previewTitle')}</span>
            </div>

            <input
              type="text"
              className="pattern-sample-input"
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              placeholder={t('settings.patterns.sampleInputPlaceholder')}
              title="Línea de muestra para pruebas"
            />

            {preview && (
              <div className="pattern-preview-results">
                {preview.matched ? (
                  <div className="pattern-preview-flow">
                    <div className="pattern-step">
                      <span className="pattern-step-label">{t('settings.patterns.capturedValue')}:</span>
                      <code className="pattern-step-code">{preview.captured}</code>
                    </div>

                    <div className="pattern-step">
                      <span className="pattern-step-label">{t('settings.patterns.transformedValue')}:</span>
                      <code className="pattern-step-code is-final">{preview.extracted}</code>
                    </div>

                    <div className="pattern-step-chip-preview">
                      <span className="detail-meta-label">{preview.label}:</span>
                      <div className="detail-meta-value-container">
                        <span className="detail-meta-value">{preview.extracted}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="pattern-preview-nomatch">{t('settings.patterns.noMatchHint')}</p>
                )}
              </div>
            )}
          </div>

          {/* Row 4: Actions */}
          <div className="keyword-form-row keyword-controls-row">
            <div style={{ flex: 1 }} />
            <div className="keyword-action-buttons">
              {patternEditingId ? (
                <button
                  type="button"
                  className="button button-sm primary"
                  onClick={handleSaveEditPattern}
                  disabled={!newPatternRegex.trim() || patternRegexError || transformRegexError}
                  title={t('settings.parser.saveChanges')}
                >
                  <IconCheck size={15} stroke={1.5} />
                  <span>{t('settings.parser.saveChanges')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="button button-sm primary"
                  onClick={handleAddPattern}
                  disabled={!newPatternRegex.trim() || patternRegexError || transformRegexError}
                >
                  <IconPlus size={15} stroke={1.5} />
                  <span>{t('common.add')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List of configured patterns */}
        <div className="custom-patterns-list">
          {(!prefs.customEntityPatterns || prefs.customEntityPatterns.length === 0) ? (
            <p className="empty-keywords-hint">{t('settings.parser.noCustomPatterns')}</p>
          ) : (
            prefs.customEntityPatterns.map((pat) => {
              const isBeingEdited = patternEditingId === pat.id;
              return (
                <div
                  key={pat.id}
                  className={`pattern-chip-card ${isBeingEdited ? 'is-editing' : ''}`}
                >
                  <div className="pattern-chip-info">
                    <span className="pattern-chip-label">{pat.label}</span>
                    <span className="pattern-chip-regex" title={`Regex principal: ${pat.pattern}`}>
                      {pat.pattern}
                    </span>
                    {pat.transformPattern && (
                      <span className="pattern-chip-transform" title={`Regex de extracción: ${pat.transformPattern}`}>
                        &rarr; {pat.transformPattern}
                      </span>
                    )}
                  </div>

                  <div className="pattern-chip-actions">
                    <Switch
                      checked={pat.enabled}
                      onChange={(enabled) => handleTogglePattern(pat.id, enabled)}
                      label={pat.label}
                    />
                    <button
                      type="button"
                      className={`search-tool-btn ${isBeingEdited ? 'is-active' : ''}`}
                      onClick={() => handleStartEditPattern(pat)}
                      title={t('common.edit')}
                    >
                      <IconPencil size={13} stroke={1.5} />
                    </button>
                    <button
                      type="button"
                      className="search-tool-btn"
                      onClick={() => handleDeletePattern(pat.id)}
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
