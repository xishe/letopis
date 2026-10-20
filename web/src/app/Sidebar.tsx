import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CalendarClock, FileText, Inbox, ListTree, RotateCcw, Target, Users } from 'lucide-react';
import Logo from '../brand/Logo';
import { selectInboxCount, useDemo } from '../store/demoStore';
import { cx } from '../ui/cx';

/** Дней до конца цикла ревью — константа демо. */
const REVIEW_DAYS_LEFT = 12;

const itemBase =
  'group flex h-7 items-center gap-2 rounded-md px-2 text-base font-medium text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink';
const itemActive = 'bg-ink/[0.07] text-ink';

function Badge({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'soon' }) {
  return (
    <span
      className={cx(
        'ml-auto rounded px-1.5 text-xs font-medium leading-4 tnum',
        tone === 'soon' ? 'bg-border-soft text-ink-3' : 'bg-accent-soft text-accent',
      )}
    >
      {children}
    </span>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <div className="px-2 pb-1 pt-4 text-xs font-medium text-ink-3">{children}</div>;
}

export default function Sidebar() {
  const navigate = useNavigate();
  const demoMeta = useDemo((s) => s.meta);
  const inboxCount = useDemo(selectInboxCount);
  const reportsCount = useDemo((s) => s.reports.length);
  const resetDemo = useDemo((s) => s.resetDemo);

  const onReset = () => {
    resetDemo();
    navigate('/app/onboarding');
  };

  return (
    <aside className="flex h-full w-[232px] shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-12 items-center px-3.5">
        <Link to="/" aria-label="Летопись — на главную">
          <Logo size={22} withWordmark />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        <div className="flex flex-col gap-px">
          <Link to="/app/chronicle" className={itemBase}>
            <Inbox size={15} strokeWidth={1.75} />
            Входящие
            {inboxCount > 0 && <Badge>{inboxCount}</Badge>}
          </Link>
          <NavLink to="/app/chronicle" className={({ isActive }) => cx(itemBase, isActive && itemActive)}>
            <ListTree size={15} strokeWidth={1.75} />
            Хроника
          </NavLink>
          <NavLink to="/app/reports/new" className={({ isActive }) => cx(itemBase, isActive && itemActive)}>
            <FileText size={15} strokeWidth={1.75} />
            Отчёты
            {reportsCount > 0 && <Badge>{reportsCount}</Badge>}
          </NavLink>
          <div
            aria-disabled="true"
            className="flex h-7 cursor-default items-center gap-2 rounded-md px-2 text-base font-medium text-ink-3"
          >
            <Target size={15} strokeWidth={1.75} />
            Инициативы
            <Badge tone="soon">скоро</Badge>
          </div>
        </div>

        <Section>Команда {demoMeta.team}</Section>
        <div className="flex flex-col gap-px">
          <NavLink to="/app/team" className={({ isActive }) => cx(itemBase, isActive && itemActive)}>
            <Users size={15} strokeWidth={1.75} />
            Результаты команды
          </NavLink>
          <Link to="/app/reports/new" className={itemBase}>
            <CalendarClock size={15} strokeWidth={1.75} />
            <span className="truncate">{demoMeta.reviewName}</span>
            <span className="ml-auto shrink-0 text-xs text-ink-3 tnum">{REVIEW_DAYS_LEFT} дн.</span>
          </Link>
        </div>
      </nav>

      <div className="border-t border-border-soft p-2">
        <button type="button" onClick={onReset} className={cx(itemBase, 'w-full')}>
          <RotateCcw size={14} strokeWidth={1.75} />
          Сбросить демо
        </button>
        <div className="mt-1 flex items-center gap-2 px-2 py-1.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {demoMeta.person
              .split(' ')
              .map((w) => w[0])
              .join('')}
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-medium text-ink">{demoMeta.person}</div>
            <div className="truncate text-xs text-ink-3">
              {demoMeta.role} · {demoMeta.company}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

