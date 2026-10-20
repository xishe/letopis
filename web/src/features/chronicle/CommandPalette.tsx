import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownLeft, FileText, RotateCcw, Search } from 'lucide-react';
import { Kbd, StatusDot, cx } from '../../ui';
import type { Result } from '../../types';

export interface PaletteAction {
  id: string;
  label: string;
  run(): void;
}

interface Entry {
  key: string;
  label: string;
  hint?: string;
  result?: Result;
  action?: PaletteAction;
}

interface Props {
  open: boolean;
  onClose(): void;
  results: Result[];
  actions: PaletteAction[];
  onPickResult(id: string): void;
}

export default function CommandPalette({ open, onClose, results, actions, onPickResult }: Props) {
  return (
    <AnimatePresence>
      {open && <PaletteInner onClose={onClose} results={results} actions={actions} onPickResult={onPickResult} />}
    </AnimatePresence>
  );
}

function PaletteInner({ onClose, results, actions, onPickResult }: Omit<Props, 'open'>) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const entries = useMemo<Entry[]>(() => {
    const q = query.trim().toLowerCase();
    const acts: Entry[] = actions
      .filter((a) => !q || a.label.toLowerCase().includes(q))
      .map((a) => ({ key: `a-${a.id}`, label: a.label, action: a }));
    const res: Entry[] = results
      .filter((r) => !q || r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q))
      .slice(0, 30)
      .map((r) => ({ key: r.id, label: r.title, hint: r.id, result: r }));
    return q ? [...res, ...acts] : [...acts, ...res];
  }, [query, results, actions]);

  const active = Math.min(index, Math.max(entries.length - 1, 0));

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  const run = (e: Entry | undefined) => {
    if (!e) return;
    onClose();
    if (e.action) e.action.run();
    else if (e.result) onPickResult(e.result.id);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[14vh]">
      <motion.div
        className="absolute inset-0 bg-ink/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Палитра команд"
        className="relative w-full max-w-[560px] overflow-hidden rounded-xl border border-border bg-surface shadow-pop"
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.99 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-2.5 border-b border-border-soft px-4">
          <Search size={15} className="shrink-0 text-ink-3" strokeWidth={1.75} />
          <input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-label="Поиск по результатам и действиям"
            className="h-12 min-w-0 flex-1 bg-transparent text-md text-ink outline-none placeholder:text-ink-3"
            placeholder="Найти результат или действие…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setIndex(entries.length ? (active + 1) % entries.length : 0);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setIndex(entries.length ? (active - 1 + entries.length) % entries.length : 0);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                run(entries[active]);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
          />
          <Kbd>Esc</Kbd>
        </div>
        <ul id="palette-list" ref={listRef} role="listbox" className="max-h-[340px] overflow-y-auto p-1.5">
          {entries.length === 0 && <li className="px-3 py-6 text-center text-base text-ink-3">Ничего не найдено</li>}
          {entries.map((e, i) => (
            <li
              key={e.key}
              role="option"
              aria-selected={i === active}
              data-idx={i}
              onMouseMove={() => i !== active && setIndex(i)}
              onClick={() => run(e)}
              className={cx(
                'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-base',
                i === active ? 'bg-accent-soft text-ink' : 'text-ink-2',
              )}
            >
              {e.result ? (
                <StatusDot status={e.result.status} />
              ) : e.action?.id === 'reset' ? (
                <RotateCcw size={14} className="shrink-0 text-ink-3" strokeWidth={1.75} />
              ) : (
                <FileText size={14} className="shrink-0 text-ink-3" strokeWidth={1.75} />
              )}
              <span className="min-w-0 flex-1 truncate">{e.label}</span>
              {e.hint && <span className="id-mono shrink-0 text-ink-3">{e.hint}</span>}
              {i === active && <CornerDownLeft size={12} className="shrink-0 text-ink-3" />}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
