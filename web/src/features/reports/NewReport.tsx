import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Check } from 'lucide-react';
import { selectVisibleResults, useDemo } from '../../store/demoStore';
import type { TemplateId } from '../../types';
import { Button, EffectPill, StatusDot, cx } from '../../ui';

const ACME_SECTIONS = ['Ключевые результаты', 'Личный вклад', 'Влияние на команду и продукт', 'Что дальше'];

export default function NewReport() {
  const navigate = useNavigate();
  const meta = useDemo((s) => s.meta);
  const results = useDemo(selectVisibleResults);
  const createReport = useDemo((s) => s.createReport);

  const [template, setTemplate] = useState<TemplateId>('acme');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(results.filter((r) => r.status === 'confirmed').map((r) => r.id)),
  );

  const chosen = useMemo(() => results.filter((r) => selected.has(r.id)), [results, selected]);
  const confirmedCount = chosen.filter((r) => r.status === 'confirmed').length;
  const noEffect = chosen.filter((r) => !r.effect.trim()).length;
  const pct = chosen.length ? Math.round((confirmedCount / chosen.length) * 100) : 0;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const build = () => {
    if (!chosen.length) return;
    const id = createReport(
      template,
      chosen.map((r) => r.id),
    );
    navigate(`/app/reports/${id}`);
  };

  const templates: { id: TemplateId; title: string; body: ReactNode }[] = [
    {
      id: 'acme',
      title: `Self-review · ${meta.company}`,
      body: (
        <ol className="mt-2 space-y-0.5 text-sm text-ink-2">
          {ACME_SECTIONS.map((s, i) => (
            <li key={s} className="flex gap-1.5">
              <span className="tnum text-ink-3">{i + 1}.</span>
              {s}
            </li>
          ))}
        </ol>
      ),
    },
    {
      id: 'free',
      title: 'Свободный формат',
      body: <p className="mt-2 text-sm text-ink-2">Один плоский список результатов без разделов.</p>,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1040px] px-8 py-10">
      <h1 className="text-xl font-semibold tracking-tight text-ink">Сборка self-review</h1>
      <p className="mt-1.5 text-md text-ink-2">Выберите формат и результаты, которые войдут в черновик.</p>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)_288px] items-start gap-10">
        <div className="min-w-0">
          <section>
            <h2 className="text-sm font-medium uppercase tracking-wide text-ink-3">Формат</h2>
            <div role="radiogroup" aria-label="Формат" className="mt-3 grid grid-cols-2 gap-3">
              {templates.map((t) => {
                const on = template === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setTemplate(t.id)}
                    className={cx(
                      'rounded-lg border bg-surface p-4 text-left transition-colors',
                      on ? 'border-accent ring-1 ring-accent' : 'border-border hover:border-ink-3/50',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-md font-semibold text-ink">{t.title}</span>
                      <span
                        className={cx(
                          'flex h-4 w-4 items-center justify-center rounded-full border',
                          on ? 'border-accent bg-accent' : 'border-border',
                        )}
                      >
                        {on && <Check size={10} strokeWidth={3} className="text-white" />}
                      </span>
                    </div>
                    {t.body}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-9">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wide text-ink-3">Результаты</h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set(results.map((r) => r.id)))}>
                  Выбрать все
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                  Снять выбор
                </Button>
              </div>
            </div>
            <ul className="mt-2 divide-y divide-border-soft overflow-hidden rounded-lg border border-border bg-surface">
              {results.map((r) => {
                const on = selected.has(r.id);
                return (
                  <li key={r.id}>
                    <label
                      className={cx(
                        'flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg',
                        on && 'bg-accent-soft/40 hover:bg-accent-soft/60',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={on}
                        onChange={() => toggle(r.id)}
                        aria-label={r.title}
                      />
                      <span
                        aria-hidden
                        className={cx(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                          'peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40',
                          on ? 'border-accent bg-accent' : 'border-border bg-surface',
                        )}
                      >
                        {on && <Check size={11} strokeWidth={3} className="text-white" />}
                      </span>
                      <StatusDot status={r.status} />
                      <span className="id-mono shrink-0 text-ink-3">{r.id}</span>
                      <span className="min-w-0 flex-1 truncate text-base text-ink">{r.title}</span>
                      <span className="max-w-[220px] shrink-0">
                        <EffectPill effect={r.effect} />
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="sticky top-8 rounded-lg border border-border bg-surface p-5">
          <div className="text-sm font-medium uppercase tracking-wide text-ink-3">Сводка</div>
          <div className="mt-3 text-xl font-semibold tracking-tight text-ink tnum">Выбрано {chosen.length}</div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between text-base text-ink-2">
              <span className="tnum">
                {confirmedCount} из {chosen.length} выбранных подтверждены
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-soft">
              <div className="h-full rounded-full bg-ok transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {noEffect > 0 && (
            <div className="mt-4 flex gap-2 rounded-md bg-warn-bg p-2.5 text-sm text-warn">
              <AlertTriangle size={14} strokeWidth={2} className="mt-px shrink-0" />
              <span>
                Без эффекта: {noEffect}. В черновике у них появится пометка «Добавьте эффект», цифры можно дописать в хронике.
              </span>
            </div>
          )}
          <Button variant="primary" className="mt-5 w-full" disabled={chosen.length === 0} onClick={build}>
            Собрать черновик
          </Button>
        </aside>
      </div>
    </div>
  );
}
