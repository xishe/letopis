import { useState, type FormEvent } from 'react';
import { ExternalLink, GitMerge, Plus } from 'lucide-react';
import { Button, SidePanel, StatusDot, cx } from '../../ui';
import { toast } from '../../ui';
import { useDemo } from '../../store/demoStore';
import type { Result, ResultStatus } from '../../types';
import { shortDate } from './utils';

const STATUS_TEXT: Record<ResultStatus, string> = {
  suggested: 'Предложено автосбором',
  needs_effect: 'Нужен эффект',
  confirmed: 'Подтверждено',
  hidden: 'Скрыто',
};

const inputCls =
  'h-8 w-full min-w-0 rounded-md border border-border bg-surface px-2.5 text-base text-ink outline-none transition-colors ' +
  'placeholder:text-ink-3 hover:border-ink-3/40 focus:border-accent focus:ring-2 focus:ring-accent/20';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border-soft px-5 py-4">
      <h3 className="mb-2 text-sm font-medium text-ink-3">{title}</h3>
      {children}
    </section>
  );
}

function PanelBody({ result: r }: { result: Result }) {
  const setEffect = useDemo((s) => s.setEffect);
  const addEvidence = useDemo((s) => s.addEvidence);
  const setVisibility = useDemo((s) => s.setVisibility);
  const confirm = useDemo((s) => s.confirm);

  const [draft, setDraft] = useState(r.effect);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');

  const commit = (value: string) => {
    if (value.trim() !== r.effect.trim()) setEffect(r.id, value);
  };

  const submitEvidence = (e: FormEvent) => {
    e.preventDefault();
    const l = label.trim();
    const u = url.trim();
    if (!l || !u) return;
    addEvidence(r.id, { label: l, url: u });
    setLabel('');
    setUrl('');
    toast('Подтверждение добавлено');
  };

  return (
    <div>
      <div className="px-5 pb-4 pt-5">
        <h2 className="break-words text-lg font-semibold leading-snug text-ink">{r.title}</h2>
        <div className="mt-2 flex items-center gap-2 text-base text-ink-2">
          <StatusDot status={r.status} />
          <span>{STATUS_TEXT[r.status]}</span>
          <span className="text-ink-3">·</span>
          <span className="text-ink-3">{shortDate(r.date)}</span>
          <span className="id-mono ml-auto text-ink-3">{r.id}</span>
        </div>
        <p className="mt-3 break-words text-base leading-relaxed text-ink-2">{r.summary}</p>
        {r.status === 'suggested' && (
          <Button variant="primary" size="md" className="mt-4" onClick={() => confirm(r.id)}>
            Подтвердить
          </Button>
        )}
      </div>

      <Section title="Эффект">
        <input
          aria-label="Эффект"
          className={inputCls}
          value={draft}
          placeholder="Например: p95 API с 800 до 450 мс"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commit(draft);
              e.currentTarget.blur();
            }
          }}
        />
        {r.suggestedEffect && r.suggestedEffect.trim() !== draft.trim() && (
          <div className="mt-2 flex items-center gap-2 rounded-md bg-accent-soft px-2.5 py-1.5 text-base text-ink-2">
            <span className="min-w-0 flex-1 truncate" title={r.suggestedEffect}>
              Возможный эффект: <span className="font-medium text-ink">{r.suggestedEffect}</span>
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDraft(r.suggestedEffect ?? '');
                setEffect(r.id, r.suggestedEffect ?? '');
              }}
            >
              Использовать
            </Button>
          </div>
        )}
      </Section>

      <Section title={`Источники · ${r.items.length}`}>
        {r.items.length === 0 ? (
          <p className="text-base text-ink-3">Источников нет</p>
        ) : (
          <ul className="-mx-2 space-y-px">
            {r.items.map((it) => (
              <li key={`${it.source}-${it.id}`}>
                <a
                  href={it.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 hover:bg-bg"
                >
                  <span
                    className={cx(
                      'inline-flex h-5 shrink-0 items-center gap-1 rounded px-1.5 text-xs font-medium',
                      it.source === 'jira' ? 'bg-accent-soft text-accent' : 'bg-sidebar text-ink-2',
                    )}
                  >
                    {it.source === 'gitlab' && <GitMerge size={11} strokeWidth={2} />}
                    {it.source === 'jira' ? 'Jira' : 'MR'}
                  </span>
                  <span className="id-mono w-16 shrink-0 truncate text-ink-3">{it.id}</span>
                  <span className="min-w-0 flex-1 truncate text-base text-ink" title={it.title}>
                    {it.title}
                  </span>
                  <span className="shrink-0 text-sm text-ink-3 tnum">{shortDate(it.closedAt)}</span>
                  <ExternalLink size={12} className="shrink-0 text-ink-3 opacity-0 group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Подтверждения">
        {r.evidence.length > 0 && (
          <ul className="mb-3 space-y-1">
            {r.evidence.map((e, i) => (
              <li key={`${e.url}-${i}`}>
                <a
                  href={e.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 text-base text-accent hover:underline"
                >
                  <span className="truncate">{e.label}</span>
                  <ExternalLink size={12} className="shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={submitEvidence} aria-label="Добавить подтверждение" className="space-y-2">
          <div className="text-base font-medium text-ink-2">Добавить подтверждение</div>
          <input
            aria-label="Подпись"
            className={inputCls}
            placeholder="Подпись, например: Дашборд Grafana"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              aria-label="Ссылка"
              className={inputCls}
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button variant="secondary" size="md" type="submit" disabled={!label.trim() || !url.trim()}>
              <Plus size={13} strokeWidth={2} />
              Добавить
            </Button>
          </div>
        </form>
      </Section>

      <Section title="Видимость">
        <label className="flex cursor-pointer items-start gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={r.visibleToManager}
            aria-label="Видит руководитель"
            onClick={() => setVisibility(r.id, !r.visibleToManager)}
            className={cx(
              'relative mt-0.5 h-[18px] w-8 shrink-0 rounded-full transition-colors duration-150',
              r.visibleToManager ? 'bg-accent' : 'bg-border',
            )}
          >
            <span
              className={cx(
                'absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-150',
                r.visibleToManager && 'translate-x-[14px]',
              )}
            />
          </button>
          <span className="min-w-0">
            <span className="block text-base font-medium text-ink">Видит руководитель</span>
            <span className="block text-sm text-ink-3">По умолчанию запись видите только вы</span>
          </span>
        </label>
      </Section>
    </div>
  );
}

export default function ResultPanel({ result, onClose }: { result: Result | undefined; onClose: () => void }) {
  return (
    <SidePanel open={!!result} onClose={onClose} title={result ? `Результат · ${result.id}` : undefined}>
      {result && <PanelBody key={result.id} result={result} />}
    </SidePanel>
  );
}
