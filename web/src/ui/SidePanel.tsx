import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cx } from './cx';
import Kbd from './Kbd';
import { useEscape } from './useEscape';

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  className?: string;
}

/** Панель справа поверх страницы. Esc и клик по подложке закрывают. */
export default function SidePanel({ open, onClose, children, title, className }: SidePanelProps) {
  useEscape(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-ink/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            className={cx(
              'fixed inset-y-0 right-0 z-50 flex w-[480px] max-w-full flex-col border-l border-border bg-surface shadow-panel',
              className,
            )}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 42, mass: 0.8 }}
          >
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-border-soft px-4">
              <div className="min-w-0 truncate text-sm font-medium text-ink-2">{title}</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="flex h-7 items-center gap-1.5 rounded-md px-1.5 text-ink-3 hover:bg-ink/5 hover:text-ink"
              >
                <Kbd>Esc</Kbd>
                <X size={15} strokeWidth={1.75} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
export { SidePanel };
