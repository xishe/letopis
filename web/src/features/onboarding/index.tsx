import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Check, Lock } from 'lucide-react';
import { selectVisibleResults, useDemo } from '../../store/demoStore';
import { Button, cx } from '../../ui';
import { formatPeriod } from '../reports/format';
import BuildOverlay from './BuildOverlay';

interface SourceDef {
  name: string;
  mono: string;
  takes: string;
}

const SOURCES: SourceDef[] = [
  { name: 'Jira', mono: 'J', takes: 'Закрытые задачи' },
  { name: 'GitLab', mono: 'GL', takes: 'Merge requests' },
  { name: 'Confluence', mono: 'C', takes: 'Документы и RFC' },
  { name: 'Контур.Толк', mono: 'Т', takes: 'Протоколы встреч' },
];

const CONNECT_MS = 800;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const meta = useDemo((s) => s.meta);
  const connected = useDemo((s) => s.session.connected);
  const connectSource = useDemo((s) => s.connectSource);
  const buildChronicle = useDemo((s) => s.buildChronicle);
  const resultsCount = useDemo((s) => selectVisibleResults(s).length);

  const [connecting, setConnecting] = useState<string[]>([]);
  const [building, setBuilding] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const connect = (name: string) => {
    if (connecting.includes(name) || connected.includes(name)) return;
    setConnecting((c) => [...c, name]);
    const t = window.setTimeout(() => {
      connectSource(name);
      setConnecting((c) => c.filter((x) => x !== name));
    }, CONNECT_MS);
    timers.current.push(t);
  };

  const canBuild = connected.length >= 2;
  const hint = (name: string) =>
    name === 'Jira' ? `${meta.jiraCount} задач в периоде` : name === 'GitLab' ? `${meta.mrCount} MR в периоде` : null;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[720px] flex-col px-6 py-14">
      <h1 className="text-xl font-semibold tracking-tight text-ink">Подключите источники</h1>
      <p className="mt-2 max-w-[560px] text-md text-ink-2">
        Летопись сама найдёт ваши результаты за период: сгруппирует закрытые задачи и merge requests и предложит
        записи, которые остаётся подтвердить.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {SOURCES.map((s) => {
          const isOn = connected.includes(s.name);
          const isBusy = connecting.includes(s.name);
          const h = hint(s.name);
          return (
            <div
              key={s.name}
              className={cx(
                'flex flex-col rounded-lg border bg-surface p-4 transition-colors',
                isOn ? 'border-ok/30' : 'border-border',
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-soft bg-sidebar text-sm font-semibold tracking-tight text-ink-2"
                >
                  {s.mono}
                </span>
                <div className="min-w-0">
                  <div className="text-md font-semibold text-ink">{s.name}</div>
                  <div className="truncate text-sm text-ink-2">{s.takes}</div>
                </div>
              </div>
              <div className="mt-4 flex h-7 items-center justify-between gap-2">
                <span className="truncate text-sm text-ink-3 tnum">{isOn ? h : null}</span>
                {isOn ? (
                  <span className="inline-flex h-7 items-center gap-1 rounded-md bg-ok-bg px-2.5 text-sm font-medium text-ok">
                    <Check size={13} strokeWidth={2.5} />
                    Подключено
                  </span>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => connect(s.name)} disabled={isBusy} aria-label={`Подключить ${s.name}`}>
                    {isBusy ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-border border-t-accent" />
                        Подключаем
                      </>
                    ) : (
                      'Подключить'
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg border border-border-soft bg-surface px-4 py-3">
        <div>
          <div className="text-sm font-medium text-ink-2">Период</div>
          <div className="mt-0.5 text-sm text-ink-3">{meta.reviewName}</div>
        </div>
        <span className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-bg px-2.5 text-base font-medium text-ink tnum">
          <Calendar size={13} strokeWidth={1.75} className="text-ink-3" />
          {formatPeriod(meta.periodStart, meta.periodEnd)}
        </span>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="inline-flex items-center gap-1.5 text-xs text-ink-3">
          <Lock size={11} strokeWidth={2} />
          On-premise · Данные не покидают контур компании · Видимость записей — только автору
        </p>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Button variant="primary" disabled={!canBuild} onClick={() => setBuilding(true)}>
            Собрать хронику
          </Button>
          {!canBuild && <span className="text-xs text-ink-3">Подключите минимум два источника</span>}
        </div>
      </div>

      {building && (
        <BuildOverlay
          stages={[
            { label: 'Читаем задачи Jira', count: meta.jiraCount },
            { label: 'Читаем merge requests', count: meta.mrCount },
            { label: 'Группируем в результаты', count: resultsCount },
          ]}
          onDone={() => {
            buildChronicle();
            navigate('/app/chronicle');
          }}
        />
      )}
    </div>
  );
}
