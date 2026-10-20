import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui';
import { useDemo, selectVisibleResults } from '../../store/demoStore';
import ChronicleFeed from './ChronicleFeed';
import CommandPalette, { type PaletteAction } from './CommandPalette';
import ResultPanel from './ResultPanel';
import SuggestionCard from './SuggestionCard';
import { useHotkeys } from './useHotkeys';

export default function ChroniclePage() {
  const navigate = useNavigate();
  const person = useDemo((s) => s.meta.person);
  const visible = useDemo(selectVisibleResults);
  const confirm = useDemo((s) => s.confirm);
  const hide = useDemo((s) => s.hide);
  const resetDemo = useDemo((s) => s.resetDemo);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const suggested = useMemo(() => visible.filter((r) => r.status === 'suggested'), [visible]);
  const feed = useMemo(() => visible.filter((r) => r.status !== 'suggested'), [visible]);
  const selected = selectedId ? visible.find((r) => r.id === selectedId) : undefined;

  const move = useCallback((dir: 1 | -1) => {
    const cards = Array.from(feedRef.current?.querySelectorAll<HTMLElement>('[data-feed-card]') ?? []);
    if (!cards.length) return;
    const cur = cards.findIndex((c) => c === document.activeElement);
    const next = cur === -1 ? (dir === 1 ? 0 : cards.length - 1) : Math.min(Math.max(cur + dir, 0), cards.length - 1);
    cards[next].focus();
    cards[next].scrollIntoView?.({ block: 'nearest' });
  }, []);

  useHotkeys(
    { palette: () => setPaletteOpen(true), next: () => move(1), prev: () => move(-1) },
    !paletteOpen && !selectedId,
  );

  const actions = useMemo<PaletteAction[]>(
    () => [
      { id: 'report', label: 'Собрать self-review', run: () => navigate('/app/reports/new') },
      {
        id: 'reset',
        label: 'Сбросить демо',
        run: () => {
          resetDemo();
          navigate('/app/onboarding');
        },
      },
    ],
    [navigate, resetDemo],
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-8 pb-24 pt-8">
      <header className="mb-7 flex items-center justify-between gap-4">
        <h1 className="min-w-0 truncate text-xl font-semibold text-ink">Хроника · {person}</h1>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" kbd="C" onClick={() => setPaletteOpen(true)}>
            Записать результат
          </Button>
          <Button variant="primary" onClick={() => navigate('/app/reports/new')}>
            Собрать self-review
          </Button>
        </div>
      </header>

      {suggested.length > 0 && (
        <section aria-label="Новое от автосбора" className="mb-9">
          <h2 className="mb-2.5 text-sm font-medium text-ink-3">
            Новое от автосбора · <span data-testid="suggested-count">{suggested.length}</span>
          </h2>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {suggested.map((r) => (
                <SuggestionCard
                  key={r.id}
                  result={r}
                  onConfirm={confirm}
                  onAddEffect={setSelectedId}
                  onHide={hide}
                />
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      <div ref={feedRef}>
        <ChronicleFeed results={feed} onOpen={setSelectedId} />
      </div>

      <ResultPanel result={selected} onClose={() => setSelectedId(null)} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        results={visible}
        actions={actions}
        onPickResult={setSelectedId}
      />
    </div>
  );
}
