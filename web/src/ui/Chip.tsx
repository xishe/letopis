import type { ReactNode } from 'react';
import { cx } from './cx';

export default function Chip({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <span
      title={title}
      className={cx(
        'inline-flex h-5 max-w-full items-center rounded border border-border-soft bg-sidebar px-1.5',
        'text-sm font-medium text-ink-2 tnum',
        className,
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}
export { Chip };
