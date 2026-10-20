import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '../../store/demoStore';
import { Button, Chip, EffectPill, StatusDot } from '../../ui';
import type { Result } from '../../types';

function EmptyIllustration() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden className="text-ink-3">
      <rect x="14" y="10" width="92" height="76" rx="10" className="stroke-border" strokeWidth="1.5" />
      <path d="M38 66 43 30H62V42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="62" cy="52" r="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 2.5" />
      <circle cx="62" cy="64" r="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 2.5" />
      <circle cx="62" cy="76" r="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 2.5" />
      <path d="M78 34h14M78 46h10" className="stroke-border" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const sources = (r: Result) => Array.from(new Set(r.items.map((i) => (i.source === 'jira' ? 'Jira' : 'GitLab'))));

export default function TeamPage() {
  const navigate = useNavigate();
  const results = useDemo((s) => s.results);
  const meta = useDemo((s) => s.meta);
  const shared = useMemo(() => results.filter((r) => r.visibleToManager && r.status !== 'hidden'), [results]);

  return (
    <div className="mx-auto w-full max-w-[880px] px-8 py-8">
      <h1 className="text-xl font-semibold text-ink" style={{ letterSpacing: '-0.01em' }}>
        Результаты команды · {meta.team}
      </h1>
      <p className="mt-1 text-base text-ink-2">Только записи, которыми поделились авторы</p>

      {shared.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <EmptyIllustration />
          <div className="mt-4 text-md font-semibold text-ink">Сотрудники ещё не поделились результатами</div>
          <p className="mt-1 max-w-[380px] text-base text-ink-2">Включите «Видит руководитель» в карточке результата</p>
          <Button variant="secondary" className="mt-5" onClick={() => navigate('/app/chronicle')}>
            Открыть хронику
          </Button>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-1.5">
          {shared.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
              <StatusDot status={r.status} />
              <span className="w-10 shrink-0 text-sm text-ink-3 tnum">{r.id}</span>
              <span className="min-w-0 flex-1 truncate text-base font-medium text-ink">{r.title}</span>
              <span className="hidden w-28 shrink-0 truncate text-sm text-ink-2 md:block">{meta.person}</span>
              <span className="hidden gap-1 md:flex">
                {sources(r).map((s) => (
                  <Chip key={s}>{s}</Chip>
                ))}
              </span>
              <EffectPill effect={r.effect} className="max-w-[200px]" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
