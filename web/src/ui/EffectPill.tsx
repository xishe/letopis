import { cx } from './cx';

export default function EffectPill({ effect, className }: { effect: string; className?: string }) {
  const has = effect.trim().length > 0;
  return (
    <span
      title={has ? effect : 'Эффект не указан'}
      className={cx(
        'inline-flex h-5 max-w-full items-center gap-1 rounded px-1.5 text-sm font-medium tnum',
        has ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-warn',
        className,
      )}
    >
      {!has && <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-warn" />}
      <span className="truncate">{has ? effect : 'нет цифры'}</span>
    </span>
  );
}
export { EffectPill };
