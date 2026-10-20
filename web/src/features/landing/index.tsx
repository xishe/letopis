import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cable, CheckCheck, EyeOff, FileText, KeyRound, Lock, Server } from 'lucide-react';
import Logo from '../../brand/Logo';
import { Button } from '../../ui';
import Preview from './Preview';

const THESES = [
  { n: '4 из 5', text: 'не вели записей в течение периода' },
  { n: '3 из 5', text: 'назвали восстановление результатов самым трудным этапом' },
  {
    n: '5 из 5',
    text: 'потратили на подготовку время других задач; у 3 из 5 первая версия и правки заняли по 10+ часов',
  },
];

const STEPS = [
  { icon: Cable, title: 'Автосбор', text: 'Летопись читает Jira, GitLab, Confluence и встречи и группирует работу в результаты.' },
  { icon: CheckCheck, title: 'Подтверждение', text: 'Вы подтверждаете находку и добавляете эффект: цифру, дашборд или отзыв.' },
  {
    icon: FileText,
    title: 'Отчёты',
    text: 'Из записей собираются self-review, отчёты команд и план-факт. У каждого утверждения есть источник.',
  },
];

const SECURITY = [
  { icon: Server, title: 'On-premise', text: 'Развёртывание внутри инфраструктуры компании.' },
  { icon: KeyRound, title: 'SSO и роли', text: 'Вход через корпоративный SSO, доступ по ролям.' },
  { icon: Lock, title: 'LLM внутри контура', text: 'Модель работает в контуре компании, данные не уходят наружу.' },
  { icon: EyeOff, title: 'Приватность по умолчанию', text: 'Автор сам решает, какие записи видит руководитель.' },
];

const navLink =
  'hidden h-8 items-center rounded-md px-3 text-base font-medium text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink sm:inline-flex';

function Reveal({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function LandingPage() {
  return (
    <div className="h-full overflow-y-auto bg-bg text-ink">
      <header className="mx-auto flex h-14 max-w-[1080px] items-center justify-between px-6">
        <Logo size={26} withWordmark />
        <nav className="flex items-center gap-1">
          <a
            href="#how"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('how');
            }}
            className={navLink}
          >
            Как это работает
          </a>
          <a
            href="#security"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('security');
            }}
            className={navLink}
          >
            Безопасность
          </a>
          <Link to="/app" className="ml-1 rounded-md">
            <Button variant="primary" tabIndex={-1}>
              Открыть демо
            </Button>
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-[1080px] px-6 pb-14 pt-16 text-center">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="inline-flex h-6 items-center rounded-full border border-border bg-surface px-3 text-sm font-medium text-ink-2">
              Для инженерных команд с performance review
            </span>
            <h1
              className="mx-auto mt-5 max-w-[760px] text-3xl font-semibold text-ink"
              style={{ letterSpacing: '-0.02em', lineHeight: 1.12 }}
            >
              Один раз зафиксировали результат — используйте во всех отчётах
            </h1>
            <p className="mx-auto mt-4 max-w-[620px] text-md text-ink-2" style={{ lineHeight: 1.5 }}>
              Летопись собирает результаты из Jira, GitLab, Confluence и встреч, а сотрудник лишь подтверждает и добавляет
              эффект. Из записей собираются self-review, отчёты команд и план-факт.
            </p>
            <div className="mt-7 flex items-center justify-center gap-2">
              <Link to="/app" className="rounded-md">
                <Button variant="primary" tabIndex={-1}>
                  Открыть демо
                </Button>
              </Link>
              <Button variant="secondary" onClick={() => scrollTo('how')}>
                Как это работает
              </Button>
            </div>
          </motion.div>
        </section>

        <section className="px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Preview />
          </motion.div>
        </section>

        <section className="mx-auto max-w-[1080px] px-6 py-20">
          <Reveal>
            <h2 className="text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
              Почему сейчас
            </h2>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {THESES.map((t) => (
                <div key={t.n} className="border-t border-border pt-4">
                  <div className="text-3xl font-semibold text-accent tnum" style={{ letterSpacing: '-0.02em' }}>
                    {t.n}
                  </div>
                  <p className="mt-2 text-base text-ink-2" style={{ lineHeight: 1.5 }}>
                    {t.text}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-ink-3">Опрос 5 инженеров, 2026</p>
          </Reveal>
        </section>

        <section id="how" className="mx-auto max-w-[1080px] scroll-mt-4 px-6 pb-20">
          <Reveal>
            <h2 className="text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
              Как это работает
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.title} className="rounded-lg border border-border bg-surface p-5 shadow-[0_1px_1px_rgba(27,28,31,0.03)]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft text-accent">
                      <s.icon size={14} strokeWidth={1.75} />
                    </span>
                    <span className="text-sm text-ink-3 tnum">Шаг {i + 1}</span>
                  </div>
                  <div className="mt-3 text-md font-semibold">{s.title}</div>
                  <p className="mt-1 text-base text-ink-2" style={{ lineHeight: 1.5 }}>
                    {s.text}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="security" className="mx-auto max-w-[1080px] scroll-mt-4 px-6 pb-24">
          <Reveal>
            <h2 className="text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
              Безопасность
            </h2>
            <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              {SECURITY.map((s) => (
                <div key={s.title}>
                  <s.icon size={18} strokeWidth={1.5} className="text-accent" />
                  <div className="mt-2 text-base font-semibold">{s.title}</div>
                  <p className="mt-1 text-base text-ink-2" style={{ lineHeight: 1.5 }}>
                    {s.text}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border-soft">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-6 py-6">
          <Logo size={20} withWordmark />
          <span className="text-sm text-ink-3">Летопись · учебный проект ИТМО, 2026</span>
        </div>
      </footer>
    </div>
  );
}
