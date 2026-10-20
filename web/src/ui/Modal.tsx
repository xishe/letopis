import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cx } from './cx';
import { useEscape } from './useEscape';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  useEscape(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[14vh]">
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
            className={cx(
              'relative w-full max-w-[440px] overflow-hidden rounded-xl border border-border bg-surface shadow-pop',
              className,
            )}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {title && <div className="px-5 pb-1 pt-4 text-md font-semibold text-ink">{title}</div>}
            <div className="px-5 pb-4 pt-2">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-border-soft bg-bg px-5 py-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export { Modal };
