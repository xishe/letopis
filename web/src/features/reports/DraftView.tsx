import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Check, ChevronRight, Download, Send } from 'lucide-react';
import { useDemo } from '../../store/demoStore';
import type { Report, Result } from '../../types';
import { Button, cx, Modal, toast } from '../../ui';
import { buildDraft } from './draft';
import { formatTime, slugify, toDative } from './format';
import ResultPeek from './ResultPeek';

const TYPING_MS = 3000;
const TICK_MS = 30;

/** Отчёты, текст которых уже «напечатан» в этой сессии: повторно не печатаем. */
const typedReports = new Set<string>();

function stripDot(s: string) {
  return s.replace(/[.\s]+$/, '');
}

export default function DraftView({ report }: { report: Report }) {
  const meta = useDemo((s) => s.meta);
  const allResults = useDemo((s) => s.results);
  const startedAt = useDemo((s) => s.session.startedAt);
  const sendReport = useDemo((s) => s.sendReport);

  const results = useMemo(() => {
    const byId = new Map(allResults.map((r) => [r.id, r]));
    return report.resultIds.map((id) => byId.get(id)).filter((r): r is Result => !!r);
  }, [allResults, report.resultIds]);

  const doc = useMemo(() => buildDraft(meta, results, report.templateId), [meta, results, report.templateId]);

  // --- потоковая печать ---
  const segments = useMemo(
    () => [doc.intro, ...doc.sections.flatMap((s) => s.claims.map((c) => stripDot(c.text) + '.'))],
    [doc],
  );
  const total = useMemo(() => segments.reduce((n, s) => n + s.length, 0), [segments]);
  const [chars, setChars] = useState(() => (typedReports.has(report.id) ? Number.POSITIVE_INFINITY : 0));
  const typing = chars < total;

  useEffect(() => {
    if (!typing) {
      typedReports.add(report.id);
      return;
    }
    const step = Math.max(1, Math.ceil(total / (TYPING_MS / TICK_MS)));
    const t = window.setInterval(() => setChars((c) => c + step), TICK_MS);
    return () => window.clearInterval(t);
  }, [typing, total, report.id]);

  // --- состояние UI ---
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [peekId, setPeekId] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(t);
  }, []);

  const peek = results.find((r) => r.id === peekId);
  const sent = !!report.sentAt;

  // --- чек-лист и метрики ---
  const claims = doc.sections.flatMap((s) => s.claims);
  const crit1 = results.length > 0 && results.every((r) => r.effect.trim() && r.items.length > 0);
  const crit2 = claims.length > 0 && claims.every((c) => c.text.trim() && !c.warning);
  const withEffect = results.filter((r) => r.effect.trim()).length;
  const missing = results.length - withEffect;
  const endTime = report.sentAt ? new Date(report.sentAt).getTime() : now;
  const prepMin = startedAt ? Math.max(0, Math.round((endTime - new Date(startedAt).getTime()) / 60000)) : null;

  const checklist = [
    {
      label: 'Есть подтверждения ключевых утверждений',
      ok: crit1,
      hint: crit1 ? 'У каждого пункта есть эффект и источники' : `Нет эффекта у пунктов: ${missing}`,
    },
    {
      label: 'Понятно описан личный вклад',
      ok: crit2,
      hint: crit2 ? 'Каждое утверждение с текстом и эффектом' : 'Есть утверждения без эффекта',
    },
    {
      label: 'Получена обратная связь руководителя',
      ok: sent,
      hint: sent ? `Отправлено: ${meta.manager}` : 'Отметится после отправки руководителю',
    },
  ];

  const download = () => {
    const blob = new Blob([doc.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `self-review-${slugify(meta.person)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const confirmSend = () => {
    sendReport(report.id, meta.manager);
    setSendOpen(false);
    toast(`Отправлено: ${meta.manager}`);
  };

  // --- рендер документа ---
  let offset = 0;
  const introLen = segments[0].length;
  const introShown = Math.min(Math.max(chars - offset, 0), introLen);
  offset += introLen;

  return (
    <div className="mx-auto w-full max-w-[1080px] px-8 py-8">
      <div className="mb-5 flex h-7 items-center justify-between">
        <nav className="flex items-center gap-1 text-base text-ink-3">
          <Link to="/app/reports/new" className="hover:text-ink">
            Отчёты
          </Link>
          <ChevronRight size={13} />
          <span className="text-ink-2">Черновик {report.id}</span>
        </nav>
        {typing && (
          <Button variant="ghost" size="sm" onClick={() => setChars(Number.POSITIVE_INFINITY)}>
            Показать сразу
          </Button>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_288px] items-start gap-8">
        <article className="min-w-0 rounded-xl border border-border bg-surface px-12 py-11 shadow-[0_1px_2px_rgba(27,28,31,0.04)]">
          <div className="mx-auto max-w-[720px]">
            <h1 className="text-xl font-semibold tracking-tight text-ink">{doc.title}</h1>
            <p className="mt-3 text-[14px] leading-[1.6] text-ink-2">{doc.intro.slice(0, introShown)}</p>

            {doc.sections.map((section) => {
              const start = offset;
              const shown = section.claims.map((c) => {
                const text = stripDot(c.text) + '.';
                const n = Math.min(Math.max(chars - offset, 0), text.length);
                offset += text.length;
                return { c, text, n };
              });
              if (!section.claims.length || shown[0].n === 0 || chars <= start) return null;
              return (
                <section key={section.title} className="mt-8">
                  <h2 className="text-md font-semibold tracking-tight text-ink">{section.title}</h2>
                  <ul className="mt-3 space-y-3">
                    {shown.map(({ c, text, n }, i) => {
                      if (n === 0) return null;
                      const full = n >= text.length;
                      const hot = hoverId !== null && c.resultIds.includes(hoverId);
                      return (
                        <li
                          key={i}
                          className={cx(
                            '-mx-2 rounded-md px-2 py-0.5 text-[14px] leading-[1.6] text-ink transition-colors duration-100',
                            hot && 'bg-accent-soft',
                          )}
                        >
                          {full ? (
                            <>
                              {stripDot(c.text)}
                              {c.resultIds.map((id) => (
                                <Fragment key={id}>
                                  {' '}
                                  <FootnoteChip
                                    id={id}
                                    active={hoverId === id}
                                    onHover={setHoverId}
                                    onOpen={() => setPeekId(id)}
                                  />
                                </Fragment>
                              ))}
                              .
                              {c.warning && (
                                <span className="ml-2 inline-flex items-center gap-1 rounded bg-warn-bg px-1.5 py-px align-[1px] text-sm font-medium text-warn">
                                  <AlertTriangle size={11} strokeWidth={2.25} />
                                  {c.warning}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {text.slice(0, n)}
                              <span className="ml-px inline-block h-[14px] w-px translate-y-[2px] animate-pulse bg-accent" />
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </article>

        <aside className="sticky top-6 space-y-4">
          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="text-sm font-medium uppercase tracking-wide text-ink-3">Готовность</div>
            <ul className="mt-3 space-y-3.5">
              {checklist.map((it) => (
                <li key={it.label} className="flex gap-2.5">
                  <span
                    aria-hidden
                    className={cx(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                      it.ok ? 'border-ok bg-ok' : 'border-border bg-surface',
                    )}
                  >
                    {it.ok && <Check size={10} strokeWidth={3} className="text-white" />}
                  </span>
                  <div>
                    <div className={cx('text-base', it.ok ? 'text-ink' : 'text-ink-2')}>{it.label}</div>
                    <div className="mt-0.5 text-sm text-ink-3">{it.hint}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <dl className="space-y-2.5 text-base">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-ink-2">Подготовка</dt>
                <dd className="font-medium text-ink tnum">
                  {prepMin === null ? '—' : prepMin < 1 ? '< 1 мин' : `${prepMin} мин`}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-ink-2">Пункты с подтверждённым эффектом</dt>
                <dd className="font-medium text-ink tnum">
                  {withEffect}/{results.length}
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-2">
            {sent ? (
              <div className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-ok-bg text-base font-medium text-ok tnum">
                <Check size={13} strokeWidth={2.5} />
                Отправлено · {formatTime(report.sentAt!)}
              </div>
            ) : (
              <Button variant="primary" className="w-full" onClick={() => setSendOpen(true)}>
                <Send size={13} strokeWidth={2} />
                Отправить руководителю
              </Button>
            )}
            <Button variant="secondary" className="w-full" onClick={download}>
              <Download size={13} strokeWidth={2} />
              Скачать .md
            </Button>
          </div>
        </aside>
      </div>

      <ResultPeek result={peek} onClose={() => setPeekId(null)} />

      <Modal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        title={`Отправить черновик ${toDative(meta.manager)}?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSendOpen(false)}>
              Отмена
            </Button>
            <Button variant="primary" onClick={confirmSend}>
              Отправить
            </Button>
          </>
        }
      >
        <div className="rounded-lg border border-border-soft bg-bg p-3">
          <div className="text-base font-medium text-ink">{doc.title}</div>
          <div className="mt-1 line-clamp-2 text-sm text-ink-2">{doc.intro}</div>
          <div className="mt-2 text-sm text-ink-3 tnum">
            Утверждений: {claims.length} · Источников: {results.reduce((n, r) => n + r.items.length, 0)}
          </div>
        </div>
        <label className="mt-3 block text-sm font-medium text-ink-2" htmlFor="send-comment">
          Комментарий
        </label>
        <textarea
          id="send-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Например: посмотрите, пожалуйста, раздел «Личный вклад»"
          className="mt-1.5 w-full resize-none rounded-md border border-border bg-surface px-2.5 py-2 text-base text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </Modal>
    </div>
  );
}

function FootnoteChip({
  id,
  active,
  onHover,
  onOpen,
}: {
  id: string;
  active: boolean;
  onHover: (id: string | null) => void;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(id)}
      onBlur={() => onHover(null)}
      onClick={onOpen}
      className={cx(
        'id-mono inline-flex h-[18px] items-center rounded px-1.5 align-[1px] text-accent transition-colors',
        active ? 'bg-accent text-white' : 'bg-accent-soft hover:bg-accent hover:text-white',
      )}
    >
      {id}
    </button>
  );
}
