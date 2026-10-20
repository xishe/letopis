import type { ReactNode } from 'react';
import { CheckCircle2, Inbox, ListTree, FileText, Users } from 'lucide-react';
import { LogoMark } from '../../brand/Logo';
import { demoMeta, demoResults } from '../../data/demo';
import { Chip, EffectPill, StatusDot, cx } from '../../ui';
import type { Result } from '../../types';

const pick = (ids: string[]): Result[] =>
  ids.map((id) => demoResults.find((r) => r.id === id)).filter((r): r is Result => Boolean(r));

const shown = pick(['R-1', 'R-2', 'R-8']);
const finds = pick(['R-11', 'R-13']);

const sourceLabel = (r: Result) => Array.from(new Set(r.items.map((i) => (i.source === 'jira' ? 'Jira' : 'GitLab'))));

function MiniNav({ icon, label, active }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <div
      className={cx(
        'flex h-7 items-center gap-2 rounded-md px-2 text-sm font-medium text-ink-2',
        active && 'bg-ink/[0.07] text-ink',
      )}
    >
      {icon}
      {label}
    </div>
  );
}

/** Статичная вёрстка окна приложения: не скриншот, а живые компоненты на данных демо. */
export default function Preview() {
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-[960px] select-none overflow-hidden rounded-t-xl border border-b-0 border-border bg-bg shadow-panel"
      style={{ height: 420 }}
    >
      <div className="flex h-9 items-center gap-1.5 border-b border-border-soft bg-surface px-3">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="ml-3 text-xs text-ink-3">Летопись · Хроника</span>
      </div>
      <div className="flex h-full">
        <div className="hidden w-[190px] shrink-0 border-r border-border bg-sidebar p-2 sm:block">
          <div className="flex h-9 items-center gap-2 px-1.5">
            <LogoMark size={18} />
            <span className="text-base font-semibold tracking-tight text-ink">Летопись</span>
          </div>
          <div className="mt-1 flex flex-col gap-px">
            <MiniNav icon={<Inbox size={14} strokeWidth={1.75} />} label="Входящие" />
            <MiniNav icon={<ListTree size={14} strokeWidth={1.75} />} label="Хроника" active />
            <MiniNav icon={<FileText size={14} strokeWidth={1.75} />} label="Отчёты" />
            <MiniNav icon={<Users size={14} strokeWidth={1.75} />} label="Команда Backend" />
          </div>
        </div>
        <div className="min-w-0 flex-1 p-5 text-left">
          <div className="flex items-baseline justify-between">
            <div className="text-md font-semibold text-ink">Хроника</div>
            <div className="text-sm text-ink-3">{demoMeta.reviewName}</div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {finds.map((r) => (
              <div key={r.id} className="rounded-lg border border-dashed border-ink-3/50 bg-surface/60 p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-accent">
                  <StatusDot status="suggested" size={12} />
                  Найдено автосбором
                </div>
                <div className="mt-1.5 truncate text-base font-medium text-ink">{r.title}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-md bg-accent px-2 py-0.5 text-sm font-medium text-white">Подтвердить</span>
                  <span className="text-sm text-ink-3">Скрыть</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-xs font-medium text-ink-3">Сентябрь 2026</div>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {shown.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 shadow-[0_1px_1px_rgba(27,28,31,0.03)]"
              >
                <StatusDot status={r.status} />
                <span className="w-9 shrink-0 text-sm text-ink-3 tnum">{r.id}</span>
                <span className="min-w-0 flex-1 truncate text-base font-medium text-ink">{r.title}</span>
                <span className="hidden gap-1 md:flex">
                  {sourceLabel(r).map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                </span>
                <EffectPill effect={r.effect} className="max-w-[170px]" />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-sm text-ok">
            <CheckCircle2 size={14} strokeWidth={1.75} />
            Подтверждённые результаты готовы для отчётов
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
    </div>
  );
}
