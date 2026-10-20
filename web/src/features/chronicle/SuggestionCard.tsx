import { motion } from 'framer-motion';
import { Button, StatusDot } from '../../ui';
import type { Result } from '../../types';
import { suggestionHint } from './utils';

interface Props {
  result: Result;
  onConfirm(id: string): void;
  onAddEffect(id: string): void;
  onHide(id: string): void;
}

export default function SuggestionCard({ result: r, onConfirm, onAddEffect, onHide }: Props) {
  return (
    <motion.li
      layout="position"
      data-suggestion-card
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="rounded-lg border border-dashed border-border bg-surface/60 px-4 py-3"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="mt-[3px]">
          <StatusDot status="suggested" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-md font-medium text-ink" title={r.title}>
            Автосбор нашёл: {r.title}
          </p>
          <p className="mt-0.5 truncate text-base text-ink-3">{suggestionHint(r)}</p>
          {r.suggestedEffect && (
            <p className="mt-1 line-clamp-2 break-words text-base text-ink-2">
              Возможный эффект: <span className="font-medium text-ok">{r.suggestedEffect}</span>
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Button variant="primary" size="sm" onClick={() => onConfirm(r.id)}>
              Подтвердить
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onAddEffect(r.id)}>
              Добавить эффект
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onHide(r.id)}>
              Скрыть
            </Button>
          </div>
        </div>
      </div>
    </motion.li>
  );
}
