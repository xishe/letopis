import { AnimatePresence } from 'framer-motion';
import type { Result } from '../../types';
import ResultRow from './ResultRow';
import { groupByMonth } from './utils';

export default function ChronicleFeed({ results, onOpen }: { results: Result[]; onOpen(id: string): void }) {
  const groups = groupByMonth(results);
  return (
    <div className="space-y-7" data-testid="feed">
      {groups.map((g) => (
        <section key={g.key} aria-label={g.title}>
          <h2 className="mb-2.5 text-sm font-medium text-ink-3">{g.title}</h2>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {g.items.map((r) => (
                <ResultRow key={r.id} result={r} onOpen={onOpen} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      ))}
    </div>
  );
}
