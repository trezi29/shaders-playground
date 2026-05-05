'use client';

import { useState } from 'react';
import { REGISTRY, CATEGORIES, type PropDef, type PropValue } from './registry';
import type { SavedProject } from './storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Layer = {
  id: string;
  type: string;
  visible: boolean;
  props: Record<string, PropValue>;
  maskSource?: string;
  maskType?: 'alpha' | 'alphaInverted' | 'luminance' | 'luminanceInverted';
};

type EditorPanelProps = {
  layers: Layer[];
  selectedId: string | null;
  bgColor: string;
  projectName: string;
  savedProjects: SavedProject[];
  onAddLayer: (type: string) => void;
  onUpdateProp: (id: string, key: string, value: PropValue) => void;
  onToggleVisible: (id: string) => void;
  onRemoveLayer: (id: string) => void;
  onReorderLayer: (id: string, dir: -1 | 1) => void;
  onSelectLayer: (id: string | null) => void;
  onBgColorChange: (color: string) => void;
  onProjectNameChange: (name: string) => void;
  onSaveProject: (name: string) => void;
  onLoadProject: (project: SavedProject) => void;
  onDeleteProject: (id: string) => void;
  onUpdateMask: (id: string, maskSource: string | undefined, maskType: Layer['maskType']) => void;
};

// ─── Label formatter ──────────────────────────────────────────────────────────

function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^(.)/, c => c.toUpperCase())
    .trim();
}

// ─── Prop Controls ────────────────────────────────────────────────────────────

function formatNum(v: number, step: number): string {
  if (step < 0.01) return v.toFixed(3);
  if (step < 0.1) return v.toFixed(2);
  if (step < 1) return v.toFixed(1);
  return Math.round(v).toString();
}

function SliderRow({ label, min, max, step, value, onChange }: {
  label: string; min: number; max: number; step: number; value: number;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function commitDraft(raw: string) {
    const n = parseFloat(raw);
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-2 py-[3px]">
      <span className="text-[11px] text-white/40 w-[90px] shrink-0 truncate">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-px accent-white cursor-pointer"
      />
      {editing ? (
        <input
          autoFocus
          type="number" min={min} max={max} step={step}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={e => commitDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commitDraft((e.target as HTMLInputElement).value);
            if (e.key === 'Escape') setEditing(false);
          }}
          className="text-[11px] tabular-nums text-white/70 w-9 text-right shrink-0 bg-white/10 border border-white/20 rounded px-0.5 focus:outline-none focus:border-white/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
      ) : (
        <button
          onClick={() => { setDraft(formatNum(value, step)); setEditing(true); }}
          className="text-[11px] tabular-nums text-white/70 w-9 text-right shrink-0 hover:text-white hover:bg-white/8 rounded px-0.5 transition-colors"
        >
          {formatNum(value, step)}
        </button>
      )}
    </div>
  );
}

function ColorRow({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const hex = value.length > 7 ? value.slice(0, 7) : value;

  function commitDraft(raw: string) {
    const cleaned = raw.startsWith('#') ? raw : `#${raw}`;
    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) onChange(cleaned);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-2 py-[3px]">
      <span className="text-[11px] text-white/40 w-[90px] shrink-0 truncate">{label}</span>
      <label className="cursor-pointer shrink-0">
        <span
          className="w-4 h-4 rounded border border-white/20 block hover:border-white/50 transition-colors"
          style={{ background: hex }}
        />
        <input
          type="color" value={hex}
          onChange={e => onChange(e.target.value)}
          className="sr-only"
        />
      </label>
      {editing ? (
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={e => commitDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commitDraft((e.target as HTMLInputElement).value);
            if (e.key === 'Escape') setEditing(false);
          }}
          className="flex-1 text-[11px] font-mono text-white/70 bg-white/10 border border-white/20 rounded px-1.5 py-0.5 focus:outline-none focus:border-white/40"
        />
      ) : (
        <button
          onClick={() => { setDraft(hex); setEditing(true); }}
          className="flex-1 text-left text-[11px] font-mono text-white/70 hover:text-white hover:bg-white/8 rounded px-1.5 py-0.5 transition-colors"
        >
          {hex}
        </button>
      )}
    </div>
  );
}

function ToggleRow({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 py-[3px]">
      <span className="text-[11px] text-white/40 w-[90px] shrink-0 truncate">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`text-[11px] px-2.5 py-0.5 rounded-full transition-colors ${
          value ? 'bg-white text-black' : 'bg-white/10 text-white/50 hover:bg-white/15'
        }`}
      >
        {value ? 'On' : 'Off'}
      </button>
    </div>
  );
}

function SelectRow({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 py-[3px]">
      <span className="text-[11px] text-white/40 w-[90px] shrink-0 truncate">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 text-[11px] bg-white/8 border border-white/10 rounded px-1.5 py-0.5 text-white/70 focus:outline-none focus:border-white/30"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextRow({ label, value, placeholder, onChange }: {
  label: string; value: string; placeholder?: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 py-[3px]">
      <span className="text-[11px] text-white/40 w-[90px] shrink-0 truncate">{label}</span>
      <input
        type="text" value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="flex-1 text-[11px] bg-white/8 border border-white/10 rounded px-1.5 py-0.5 text-white/70 placeholder-white/20 focus:outline-none focus:border-white/30"
      />
    </div>
  );
}

function PositionRow({ label, value, onChange }: {
  label: string; value: { x: number; y: number }; onChange: (v: { x: number; y: number }) => void;
}) {
  return (
    <>
      <SliderRow label={`${label} X`} min={0} max={1} step={0.01} value={value.x}
        onChange={x => onChange({ ...value, x })} />
      <SliderRow label={`${label} Y`} min={0} max={1} step={0.01} value={value.y}
        onChange={y => onChange({ ...value, y })} />
    </>
  );
}

function TransformRow({ value, onChange }: {
  value: { scale: number; offsetX: number; offsetY: number };
  onChange: (v: { scale: number; offsetX: number; offsetY: number }) => void;
}) {
  return (
    <>
      <SliderRow label="Scale" min={0.1} max={3} step={0.01} value={value.scale}
        onChange={scale => onChange({ ...value, scale })} />
      <SliderRow label="Offset X" min={-1} max={1} step={0.01} value={value.offsetX}
        onChange={offsetX => onChange({ ...value, offsetX })} />
      <SliderRow label="Offset Y" min={-1} max={1} step={0.01} value={value.offsetY}
        onChange={offsetY => onChange({ ...value, offsetY })} />
    </>
  );
}

function PropControl({ propKey, schema, value, onChange }: {
  propKey: string; schema: PropDef; value: PropValue;
  onChange: (v: PropValue) => void;
}) {
  const label = toLabel(propKey);
  switch (schema.kind) {
    case 'number':
      return <SliderRow label={label} min={schema.min} max={schema.max} step={schema.step}
        value={value as number} onChange={onChange} />;
    case 'color':
      return <ColorRow label={label} value={value as string} onChange={onChange} />;
    case 'boolean':
      return <ToggleRow label={label} value={value as boolean} onChange={onChange} />;
    case 'select':
      return <SelectRow label={label} options={schema.options} value={value as string} onChange={onChange} />;
    case 'text':
      return <TextRow label={label} value={value as string} placeholder={schema.placeholder} onChange={onChange} />;
    case 'position':
      return <PositionRow label={label} value={value as { x: number; y: number }} onChange={onChange as (v: { x: number; y: number }) => void} />;
    case 'transform':
      return <TransformRow value={value as { scale: number; offsetX: number; offsetY: number }} onChange={onChange as (v: { scale: number; offsetX: number; offsetY: number }) => void} />;
    default:
      return null;
  }
}

// ─── Prop List ────────────────────────────────────────────────────────────────

function PropList({ type, props, onPropChange }: {
  type: string;
  props: Record<string, PropValue>;
  onPropChange: (key: string, value: PropValue) => void;
}) {
  const def = REGISTRY[type];
  if (!def) return null;

  return (
    <div>
      {Object.entries(def.schema).map(([key, schema]) => (
        <PropControl
          key={key}
          propKey={key}
          schema={schema}
          value={props[key] ?? (schema.kind === 'position' ? { x: schema.defaultX, y: schema.defaultY } : schema.kind === 'transform' ? { scale: schema.defaultScale, offsetX: schema.defaultOffsetX, offsetY: schema.defaultOffsetY } : schema.default)}
          onChange={v => onPropChange(key, v)}
        />
      ))}
    </div>
  );
}

// ─── Mask Section ─────────────────────────────────────────────────────────────

const MASK_TYPES: Layer['maskType'][] = ['alpha', 'alphaInverted', 'luminance', 'luminanceInverted'];

function MaskSection({ layers, selected, onUpdateMask }: {
  layers: Layer[];
  selected: Layer;
  onUpdateMask: (id: string, maskSource: string | undefined, maskType: Layer['maskType']) => void;
}) {
  const otherLayers = layers.filter(l => l.id !== selected.id);

  return (
    <div className="pt-2 border-t border-white/8">
      <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5">Mask</p>
      <div className="flex items-center gap-2 py-[3px]">
        <span className="text-[11px] text-white/40 w-[90px] shrink-0">Source</span>
        <select
          value={selected.maskSource ?? ''}
          onChange={e => {
            const src = e.target.value || undefined;
            onUpdateMask(selected.id, src, src ? (selected.maskType ?? 'alpha') : undefined);
          }}
          className="flex-1 text-[11px] bg-white/8 border border-white/10 rounded px-1.5 py-0.5 text-white/70 focus:outline-none focus:border-white/30"
        >
          <option value="">None</option>
          {otherLayers.map(l => (
            <option key={l.id} value={l.id}>{REGISTRY[l.type]?.label ?? l.type}</option>
          ))}
        </select>
      </div>
      {selected.maskSource && (
        <div className="flex items-center gap-2 py-[3px]">
          <span className="text-[11px] text-white/40 w-[90px] shrink-0">Type</span>
          <select
            value={selected.maskType ?? 'alpha'}
            onChange={e => onUpdateMask(selected.id, selected.maskSource, e.target.value as Layer['maskType'])}
            className="flex-1 text-[11px] bg-white/8 border border-white/10 rounded px-1.5 py-0.5 text-white/70 focus:outline-none focus:border-white/30"
          >
            {MASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

// ─── Component Picker ─────────────────────────────────────────────────────────

function ComponentPicker({ onPick, onClose }: {
  onPick: (type: string) => void; onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const q = search.toLowerCase();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 shrink-0">
        <button onClick={onClose} className="text-white/40 hover:text-white text-[11px] transition-colors shrink-0">
          ←
        </button>
        <input
          autoFocus
          type="text" placeholder="Search…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-[11px] bg-transparent text-white placeholder-white/30 focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 min-h-0">
        {CATEGORIES.map(cat => {
          const items = Object.entries(REGISTRY).filter(
            ([, def]) => def.category === cat &&
              (!q || def.label.toLowerCase().includes(q))
          );
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5">{cat}</p>
              <div className="flex flex-wrap gap-1">
                {items.map(([type, def]) => (
                  <button
                    key={type}
                    onClick={() => onPick(type)}
                    className="text-[11px] px-2 py-1 rounded-md bg-white/8 hover:bg-white/18 text-white/70 hover:text-white transition-colors"
                  >
                    {def.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Layer Row ────────────────────────────────────────────────────────────────

function LayerRow({ layer, isSelected, isFirst, isLast, isMaskSource, onSelect, onToggleVisible, onRemove, onMoveUp, onMoveDown }: {
  layer: Layer; isSelected: boolean; isFirst: boolean; isLast: boolean; isMaskSource: boolean;
  onSelect: () => void; onToggleVisible: () => void; onRemove: () => void;
  onMoveUp: () => void; onMoveDown: () => void;
}) {
  const def = REGISTRY[layer.type];
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-white/15' : 'hover:bg-white/6'
      }`}
    >
      <span className="flex-1 text-[11px] truncate text-white/80">{def?.label ?? layer.type}</span>
      {isMaskSource && (
        <span className="text-[9px] text-white/30 shrink-0" title="Used as mask">◈</span>
      )}
      <div className="flex items-center shrink-0">
        <button
          onClick={e => { e.stopPropagation(); onToggleVisible(); }}
          className={`text-[11px] px-0.5 transition-colors ${layer.visible ? 'text-white/40 hover:text-white/80' : 'text-white/15 hover:text-white/50'}`}
          title={layer.visible ? 'Hide' : 'Show'}
        >
          {layer.visible ? '👁' : '👁'}
        </button>
        <button
          disabled={isLast} onClick={e => { e.stopPropagation(); onMoveUp(); }}
          className="text-white/25 hover:text-white/70 disabled:opacity-20 text-[10px] px-0.5 transition-colors"
        >↑</button>
        <button
          disabled={isFirst} onClick={e => { e.stopPropagation(); onMoveDown(); }}
          className="text-white/25 hover:text-white/70 disabled:opacity-20 text-[10px] px-0.5 transition-colors"
        >↓</button>
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="text-white/20 hover:text-red-400 text-[11px] px-0.5 ml-0.5 transition-colors"
        >×</button>
      </div>
    </div>
  );
}

// ─── Editor Panel ─────────────────────────────────────────────────────────────

export function EditorPanel({
  layers, selectedId, bgColor, projectName, savedProjects,
  onAddLayer, onUpdateProp, onToggleVisible, onRemoveLayer, onReorderLayer,
  onSelectLayer, onBgColorChange, onProjectNameChange, onSaveProject, onLoadProject, onDeleteProject,
  onUpdateMask,
}: EditorPanelProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const selectedLayer = layers.find(l => l.id === selectedId);
  const selectedDef = selectedLayer ? REGISTRY[selectedLayer.type] : null;

  function handlePick(type: string) {
    onAddLayer(type);
    setPickerOpen(false);
  }

  return (
    <>
      {/* Settings panel */}
      {settingsOpen && (
        <div className="fixed top-4 right-[21rem] w-56 max-h-[calc(100vh-2rem)] flex flex-col rounded-2xl bg-black/88 backdrop-blur-xl border border-white/10 text-white overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/8 shrink-0">
            <span className="text-[10px] font-medium tracking-widest text-white/40 uppercase">Settings</span>
            <button onClick={() => setSettingsOpen(false)} className="text-white/30 hover:text-white/70 text-xs transition-colors">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Background */}
            <div className="px-3 py-3 border-b border-white/8">
              <ColorRow label="Background" value={bgColor} onChange={onBgColorChange} />
            </div>
            {/* Projects */}
            <div className="px-3 py-3">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Projects</p>
              <div className="flex gap-1.5 mb-3">
                <input
                  type="text"
                  placeholder="Project name…"
                  value={projectName}
                  onChange={e => onProjectNameChange(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && projectName.trim()) onSaveProject(projectName.trim()); }}
                  className="flex-1 text-[11px] bg-white/8 border border-white/10 rounded px-1.5 py-1 text-white/70 placeholder-white/20 focus:outline-none focus:border-white/30 min-w-0"
                />
                <button
                  onClick={() => { if (projectName.trim()) onSaveProject(projectName.trim()); }}
                  disabled={!projectName.trim()}
                  className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                >Save</button>
              </div>
              {savedProjects.length === 0 ? (
                <p className="text-[11px] text-white/20 text-center py-3">No saved projects</p>
              ) : (
                <div className="space-y-1">
                  {savedProjects.slice().sort((a, b) => b.savedAt - a.savedAt).map(p => (
                    <div key={p.id} className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg hover:bg-white/6 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-white/70 truncate">{p.name}</p>
                        <p className="text-[10px] text-white/25">{new Date(p.savedAt).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => onLoadProject(p)}
                        className="text-[10px] text-white/30 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors shrink-0"
                      >Load</button>
                      <button
                        onClick={() => onDeleteProject(p.id)}
                        className="text-[10px] text-white/20 hover:text-red-400 px-0.5 transition-colors shrink-0"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {minimized ? (
        <button
          onClick={() => setMinimized(false)}
          className="fixed top-4 right-4 w-10 h-10 rounded-full bg-black/88 backdrop-blur-xl border border-white/10 text-white/50 hover:text-white shadow-2xl transition-colors flex items-center justify-center text-[13px]"
          title="Expand editor"
        >⚙</button>
      ) : (
    <div className="fixed top-4 right-4 w-80 max-h-[calc(100vh-2rem)] flex flex-col rounded-2xl bg-black/88 backdrop-blur-xl border border-white/10 text-white overflow-hidden shadow-2xl">

      {pickerOpen ? (
        <ComponentPicker onPick={handlePick} onClose={() => setPickerOpen(false)} />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-white/8">
            <h1 className="text-[11px] font-medium tracking-wide text-white/60 uppercase">Shader Editor</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettingsOpen(o => !o)}
                className={`text-[13px] transition-colors ${settingsOpen ? 'text-white' : 'text-white/30 hover:text-white/70'}`}
                title="Settings"
              >⚙</button>
              <button
                onClick={() => { setMinimized(true); setSettingsOpen(false); }}
                className="text-white/30 hover:text-white/70 text-[11px] transition-colors leading-none"
                title="Minimize"
              >—</button>
            </div>
          </div>

          {/* Layers */}
          <div className="shrink-0">
            <div className="max-h-52 overflow-y-auto px-1.5 pt-1.5">
              {layers.length === 0 ? (
                <p className="text-[11px] text-white/25 text-center py-5">No layers — add one below</p>
              ) : (
                layers.slice().reverse().map((layer, ri) => {
                  const i = layers.length - 1 - ri;
                  return (
                    <LayerRow
                      key={layer.id}
                      layer={layer}
                      isSelected={layer.id === selectedId}
                      isFirst={i === 0}
                      isLast={i === layers.length - 1}
                      isMaskSource={layers.some(l => l.maskSource === layer.id)}
                      onSelect={() => onSelectLayer(layer.id === selectedId ? null : layer.id)}
                      onToggleVisible={() => onToggleVisible(layer.id)}
                      onRemove={() => onRemoveLayer(layer.id)}
                      onMoveUp={() => onReorderLayer(layer.id, 1)}
                      onMoveDown={() => onReorderLayer(layer.id, -1)}
                    />
                  );
                })
              )}
            </div>
            <div className="px-2 pt-1 pb-2">
              <button
                onClick={() => setPickerOpen(true)}
                className="w-full text-[11px] text-white/40 hover:text-white/70 py-1.5 border border-dashed border-white/15 hover:border-white/30 rounded-lg transition-colors"
              >
                + Add Layer
              </button>
            </div>
          </div>

          {/* Props */}
          {selectedLayer && selectedDef && (
            <>
              <div className="border-t border-white/10 shrink-0" />
              <div className="flex items-center justify-between px-3 py-2 shrink-0">
                <span className="text-[11px] font-medium text-white/80">{selectedDef.label}</span>
                <button
                  onClick={() => onSelectLayer(null)}
                  className="text-white/30 hover:text-white/70 text-xs transition-colors"
                >✕</button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-4 min-h-0">
                <PropList
                  type={selectedLayer.type}
                  props={selectedLayer.props}
                  onPropChange={(key, value) => onUpdateProp(selectedLayer.id, key, value)}
                />
                <MaskSection
                  layers={layers}
                  selected={selectedLayer}
                  onUpdateMask={onUpdateMask}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
      )}
    </>
  );
}
