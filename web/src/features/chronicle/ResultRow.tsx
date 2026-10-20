import { motion } from 'framer-motion';
import { Chip, EffectPill, StatusDot, cx } from '../../ui';
import type { Result } from '../../types';
import { jiraCount, mrCount } from './utils';

interface Props {
  result: Result;
  onOpen(id: string): void;
}

/** Строка ленты: кликабельная карточка результата. Фокус — через J/K или Tab. */
export default function ResultRow({ result: r, onOpen }: Props) {
  const jira = jiraCount(r);
  const mr = mrCount(r);
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <div
        role="button"
        tabIndex={0}
        data-feed-card
        data-result-id={r.id}
        onClick={() => onOpen(r.id)}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onOpen(r.id);
          }
        }}
        className={cx(
          'group min-w-0 cursor-pointer rounded-lg border border-border-soft bg-surface px-4 py-3 outline-none',
          'transition-colors duration-100 hover:border-border hover:bg-bg',
          'focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <StatusDot status={r.status} />
          <h3 className="min-w-0 flex-1 truncate text-md font-medium text-ink" title={r.title}>
            {r.title}
          </h3>
          <span className="id-mono shrink-0 text-ink-3">{r.id}</span>
        </div>
        <p className="mt-1 line-clamp-2 break-words pl-6 text-base leading-snug text-ink-2">{r.summary}</p>
        <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-1.5 pl-6">
          <EffectPill effect={r.effect} className="max-w-[18rem]" />
          {jira > 0 && <Chip>Jira {jira}</Chip>}
          {mr > 0 && <Chip>MR {mr}</Chip>}
          {r.evidence.map((e, i) => (
            <Chip key={`${e.label}-${i}`} className="max-w-[12rem] bg-surface" title={e.label}>
              {e.label}
            </Chip>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
