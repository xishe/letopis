import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { create } from 'zustand';

interface ToastItem {
  id: number;
  text: string;
}
interface ToastStore {
  items: ToastItem[];
  push(text: string): void;
  dismiss(id: number): void;
}

let seq = 0;

const useToasts = create<ToastStore>((set) => ({
  items: [],
  push: (text) => {
    const id = ++seq;
    set((s) => ({ items: [...s.items, { id, text }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 3200);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

/** Показать уведомление снизу по центру. Требует смонтированного <Toaster/>. */
export function toast(text: string): void {
  useToasts.getState().push(text);
}

export function Toaster() {
  const items = useToasts((s) => s.items);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex flex-col items-center gap-2">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            role="status"
            className="pointer-events-auto flex items-center gap-2 rounded-lg border border-border bg-surface py-2 pl-2.5 pr-3.5 text-base text-ink shadow-pop"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-ok text-white">
              <Check size={11} strokeWidth={3} />
            </span>
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default Toaster;
