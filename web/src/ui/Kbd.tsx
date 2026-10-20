import type { ReactNode } from 'react';
import { cx } from './cx';

export default function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cx(
        'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-border bg-surface px-1',
        'font-sans text-xs font-medium leading-none text-ink-2',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
export { Kbd };
