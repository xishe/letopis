import { ExternalLink } from 'lucide-react';
import type { Result, ResultStatus } from '../../types';
import { Chip, EffectPill, SidePanel, StatusDot } from '../../ui';

const STATUS_LABEL: Record<ResultStatus, string> = {
  suggested: 'Предложено автосбором',
  needs_effect: 'Нужен эффект',
  confirmed: 'Подтверждено',
  hidden: 'Скрыто',
};

const MAX_ITEMS = 8;

/** Краткий вид результата в боковой панели: статус, эффект, источники со ссылками. */
export default function ResultPeek({ result, onClose }: { result?: Result; onClose: () => void }) {
  return (
    <SidePanel open={!!result} onClose={onClose} title={result ? `${result.id} · Результат` : undefined}>
      {result && (
        <div className="px-5 py-5">
          <div className="flex items-center gap-2 text-sm text-ink-2">
            <StatusDot status={result.status} />
            {STATUS_LABEL[result.status]}
          </div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-ink">{result.title}</h2>
          <p className="mt-2 text-base text-ink-2">{result.summary}</p>

          <div className="mt-5">
            <div className="text-sm font-medium text-ink-3">Эффект</div>
            <div className="mt-1.5">
              <EffectPill effect={result.effect} />
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm font-medium text-ink-3">
              <span>Источники</span>
              <span className="tnum">{result.items.length}</span>
            </div>
            <ul className="mt-2 divide-y divide-border-soft rounded-lg border border-border-soft">
              {result.items.slice(0, MAX_ITEMS).map((i) => (
                <li key={i.id}>
                  <a
                    href={i.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-2.5 px-3 py-2 hover:bg-bg"
                  >
                    <span className="id-mono w-[58px] shrink-0 text-ink-2">{i.id}</span>
                    <span className="min-w-0 flex-1 truncate text-base text-ink">{i.title}</span>
                    <ExternalLink size={12} className="shrink-0 text-ink-3 opacity-0 group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
            {result.items.length > MAX_ITEMS && (
              <div className="mt-1.5 text-sm text-ink-3 tnum">и ещё {result.items.length - MAX_ITEMS}</div>
            )}
          </div>

          {result.evidence.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-medium text-ink-3">Подтверждения</div>
              <div className="mt-2 flex flex-col items-start gap-1.5">
                {result.evidence.map((e) => (
                  <a key={e.url} href={e.url} target="_blank" rel="noreferrer" className="max-w-full">
                    <Chip className="hover:border-ink-3/40">{e.label}</Chip>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </SidePanel>
  );
}
