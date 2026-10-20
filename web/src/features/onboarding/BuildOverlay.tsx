import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Logo } from '../../brand/Logo';
import { cx } from '../../ui';

export interface BuildStage {
  label: string;
  count: number;
}

const STEP_MS = 650;
const TOTAL_MS = 2000;

/** Полноэкранный прогресс сборки хроники: этапы с галочками, ~2 с, затем onDone. */
export default function BuildOverlay({ stages, onDone }: { stages: BuildStage[]; onDone: () => void }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    const timers = stages.map((_, i) => window.setTimeout(() => setDone(i + 1), STEP_MS * (i + 1) - 150));
    const end = window.setTimeout(onDone, TOTAL_MS);
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(end);
    };
    // onDone вызывается один раз при монтировании
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Logo size={40} />
      <h2 className="mt-6 text-lg font-semibold tracking-tight text-ink">Собираем вашу хронику</h2>
      <p className="mt-1 text-base text-ink-2">Это займёт пару секунд</p>
      <ul className="mt-8 w-[360px] space-y-3">
        {stages.map((s, i) => {
          const finished = i < done;
          const active = i === done;
          return (
            <li
              key={s.label}
              className={cx(
                'flex items-center gap-3 text-base transition-opacity duration-200',
                finished || active ? 'opacity-100' : 'opacity-40',
              )}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                {finished ? (
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-ok"
                  >
                    <Check size={12} strokeWidth={3} className="text-white" />
                  </motion.span>
                ) : active ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-border" />
                )}
              </span>
              <span className="flex-1 text-ink">{s.label}…</span>
              <span className={cx('tnum font-medium', finished ? 'text-ink' : 'text-ink-3')}>
                {finished ? s.count : ''}
              </span>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
