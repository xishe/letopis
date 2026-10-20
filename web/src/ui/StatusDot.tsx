import type { ResultStatus } from '../types';

const LABEL: Record<ResultStatus, string> = {
  suggested: 'Предложено автосбором',
  needs_effect: 'Нужен эффект',
  confirmed: 'Подтверждено',
  hidden: 'Скрыто',
};

/** suggested — пунктир, needs_effect — наполовину заполнен, confirmed — зелёный с галочкой. */
export default function StatusDot({ status, size = 14 }: { status: ResultStatus; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      role="img"
      aria-label={LABEL[status]}
      className="shrink-0"
    >
      <title>{LABEL[status]}</title>
      {status === 'confirmed' && (
        <>
          <circle cx="7" cy="7" r="6" className="fill-ok" />
          <path
            d="M4.4 7.2 6.2 9 9.7 5.2"
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-white"
          />
        </>
      )}
      {status === 'needs_effect' && (
        <>
          <circle cx="7" cy="7" r="5.25" fill="none" strokeWidth="1.5" className="stroke-warn" />
          <path d="M7 3.5a3.5 3.5 0 0 1 0 7z" className="fill-warn" />
        </>
      )}
      {(status === 'suggested' || status === 'hidden') && (
        <circle
          cx="7"
          cy="7"
          r="5.25"
          fill="none"
          strokeWidth="1.5"
          strokeDasharray="2.2 2.2"
          strokeLinecap="round"
          className={status === 'suggested' ? 'stroke-ink-3' : 'stroke-border'}
        />
      )}
    </svg>
  );
}
export { StatusDot };
