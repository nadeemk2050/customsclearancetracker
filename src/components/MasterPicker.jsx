import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Plus, X } from 'lucide-react';

const labelText = (label, required) => (
  <span>
    {label}
    {required ? <span className="req"> *</span> : null}
  </span>
);

/**
 * Master-aware input: behaves like a normal text field but opens a searchable
 * master list and can create a brand-new master record on the spot.
 */
export const MasterPicker = ({
  id,
  label,
  required,
  value,
  onChange,
  options = [],
  placeholder,
  hint,
  mono,
  addLabel = 'record',
  addFields = [],
  onSubmitNew,
  panelTitle
}) => {
  const wrapRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState(null);
  const [mode, setMode] = useState('list');
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [highlight, setHighlight] = useState(-1);

  const measure = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const compact = viewportW <= 560;
    const width = compact ? viewportW - 16 : Math.min(Math.max(rect.width, 260), viewportW - 24);
    const spaceBelow = viewportH - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const placeAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
    setPos({
      left: compact ? 8 : Math.min(rect.left, viewportW - width - 12),
      width,
      top: placeAbove ? undefined : rect.bottom + 6,
      bottom: placeAbove ? viewportH - rect.top + 6 : undefined,
      maxHeight: Math.max(160, Math.min(320, placeAbove ? spaceAbove - 8 : spaceBelow - 8))
    });
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
    setMode('list');
    setQuery('');
    setError('');
    setHighlight(-1);
  }, []);

  const openPanel = useCallback(() => {
    measure();
    setMode('list');
    setError('');
    setHighlight(-1);
    setOpen(true);
  }, [measure]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointer = (event) => {
      if (wrapRef.current?.contains(event.target)) return;
      if (panelRef.current?.contains(event.target)) return;
      closePanel();
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') closePanel();
    };
    const handleReposition = () => measure();

    document.addEventListener('mousedown', handlePointer, true);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('mousedown', handlePointer, true);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, measure, closePanel]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) =>
      `${option.label || ''} ${option.meta || ''}`.toLowerCase().includes(term)
    );
  }, [options, query]);

  const pick = (option) => {
    onChange(option.value, option.data);
    closePanel();
  };

  const startAdd = () => {
    setDraft({ name: query.trim() });
    setError('');
    setMode('add');
  };

  const handleAddSubmit = async (event) => {
    event.preventDefault();
    // The panel is portaled, but React still bubbles this submit through the
    // component tree — stop it so the parent BL form does not validate/submit.
    event.stopPropagation();
    const name = (draft.name || '').trim();
    if (!name) {
      setError('A name is required.');
      return;
    }
    if (!onSubmitNew) {
      setError('Adding master records is not available here.');
      return;
    }
    const { name: _name, ...extras } = draft;
    setSaving(true);
    try {
      const result = await onSubmitNew({ ...extras, name });
      if (result && result.ok === false) {
        setError(result.message || 'Could not save this record.');
        return;
      }
      closePanel();
    } catch (err) {
      setError(err?.message || 'Could not save this record.');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        openPanel();
        return;
      }
      setHighlight((prev) => Math.min(prev + 1, filtered.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((prev) => Math.max(prev - 1, -1));
      return;
    }
    if (event.key === 'Enter' && open && highlight >= 0 && filtered[highlight]) {
      event.preventDefault();
      pick(filtered[highlight]);
    }
  };

  const panel = open && pos ? createPortal(
    <div
      ref={panelRef}
      id={id + '-panel'}
      className={'mp-panel' + (mode === 'add' ? ' mp-panel-add' : '')}
      style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width, maxHeight: pos.maxHeight }}
    >
      {mode === 'list' ? (
        <>
          <div className="mp-head">
            <span>{panelTitle || 'Master data'}</span>
            <span className="mp-count">{filtered.length}</span>
          </div>
          <div className="mp-list" role="listbox">
            {query.trim() && filtered.length === 0 ? (
              <div className="mp-empty">No match for “{query.trim()}”.</div>
            ) : null}
            {filtered.map((option, index) => {
              const selected = option.value === value;
              return (
                <button
                  type="button"
                  key={(option.value || '') + index}
                  className={'mp-opt' + (selected ? ' is-selected' : '') + (index === highlight ? ' is-highlight' : '')}
                  onClick={() => pick(option)}
                  onMouseEnter={() => setHighlight(index)}
                  role="option"
                  aria-selected={selected}
                >
                  <span className="mp-opt-text">
                    <span className="mp-opt-label">{option.label}</span>
                    {option.meta ? <span className="mp-opt-meta">{option.meta}</span> : null}
                  </span>
                  {selected ? <Check size={14} className="mp-opt-check" /> : null}
                </button>
              );
            })}
            {!query.trim() && filtered.length === 0 ? (
              <div className="mp-empty">No master records yet — add the first one below.</div>
            ) : null}
          </div>
          <button type="button" className="mp-add" onClick={startAdd}>
            <Plus size={14} />
            <span>{query.trim() ? `Add “${query.trim()}” as new ${addLabel}` : `Add new ${addLabel}`}</span>
          </button>
        </>
      ) : (
        <form className="mp-add-form" onSubmit={handleAddSubmit}>
          <div className="mp-add-head">
            <Plus size={14} />
            <span>New {addLabel}</span>
            <button type="button" className="mp-add-close" onClick={() => { setMode('list'); setError(''); }} aria-label="Back to list">
              <X size={14} />
            </button>
          </div>
          <label className="mp-field">
            <span>Name *</span>
            <input
              autoFocus
              value={draft.name || ''}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={'Enter ' + addLabel + ' name'}
            />
          </label>
          {addFields.map((field) => (
            <label className="mp-field" key={field.key}>
              <span>{field.label}</span>
              {field.type === 'select' ? (
                <select
                  value={draft[field.key] || ''}
                  onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))}
                >
                  <option value="">- Select -</option>
                  {(field.options || []).map((option) => {
                    const optionValue = typeof option === 'string' ? option : option.value;
                    const optionLabel = typeof option === 'string' ? option : option.label;
                    return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
                  })}
                </select>
              ) : (
                <input
                  type={field.type || 'text'}
                  inputMode={field.inputMode}
                  value={draft[field.key] ?? ''}
                  onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))}
                  placeholder={field.placeholder}
                />
              )}
            </label>
          ))}
          {error ? <div className="mp-error">{error}</div> : null}
          <div className="mp-add-actions">
            <button type="button" className="mp-btn ghost" onClick={() => { setMode('list'); setError(''); }}>
              Back
            </button>
            <button type="submit" className="mp-btn primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save & select'}
            </button>
          </div>
          <div className="mp-add-note">Saved to master data and shared with your team instantly.</div>
        </form>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div className="mp-wrap" ref={wrapRef}>
      <label className="bl-label" htmlFor={id}>{labelText(label, required)}</label>
      <div className="mp-control">
        <input
          ref={inputRef}
          id={id}
          type="text"
          className={'bl-input mp-input' + (mono ? ' mono' : '')}
          autoComplete="off"
          placeholder={placeholder}
          value={value ?? ''}
          role="combobox"
          aria-expanded={open}
          aria-controls={id + '-panel'}
          aria-autocomplete="list"
          onChange={(event) => {
            const next = event.target.value;
            onChange(next, undefined);
            setQuery(next);
            setHighlight(-1);
            if (open) measure();
            else openPanel();
          }}
          onMouseDown={() => {
            if (!open) openPanel();
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="mp-toggle"
          tabIndex={-1}
          aria-label={'Show ' + (panelTitle || 'options')}
          onClick={() => (open ? closePanel() : openPanel())}
        >
          <ChevronDown size={15} />
        </button>
      </div>
      {hint ? <div className="bl-hint">{hint}</div> : null}
      {panel}
    </div>
  );
};

export default MasterPicker;
