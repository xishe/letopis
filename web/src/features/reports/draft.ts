import type { DemoMeta, Result, TemplateId } from '../../types';
import { formatPeriod, plural } from './format';

export interface DraftClaim {
  text: string;
  resultIds: string[];
  warning?: string;
}
export interface DraftSection {
  title: string;
  claims: DraftClaim[];
}
export interface DraftDoc {
  title: string;
  intro: string;
  sections: DraftSection[];
  markdown: string;
}

export const WARNING_NO_EFFECT = 'Добавьте эффект';

/** Что сделал: ведущая фраза «ключевого результата» (от первого лица). */
const KEY_LEAD: Record<string, string> = {
  'R-1': 'Ускорил поиск по каталогу за счёт кеша выдачи в Redis, курсорной пагинации и асинхронных фасетов',
  'R-2': 'Снизил стоимость облака: аудит ресурсов, холодные данные в объектном хранилище и автомасштабирование воркеров',
  'R-3': 'Вынес сервис заказов из монолита; скидки и статусы переключили по фиче-флагу без простоя',
  'R-4': 'Подключил платёжный шлюз PayLine: клиент с ретраями, оплата картой и поэтапное включение по трафику',
  'R-5': 'Настроил SLO и алерты для платёжного сервиса: burn rate бюджета ошибок и синтетические проверки флоу',
  'R-6': 'Ускорил CI/CD: кеш зависимостей, параллельные тесты и автодеплой на стейджинг',
  'R-7': 'Подтянул тесты критичных сервисов: платежи, контрактные тесты внешних API и граничные случаи налогов',
  'R-8': 'Выстроил онбординг новичков: чек-лист первых 30 дней, руководство и песочница с обезличенными данными',
  'R-9': 'Перевёл базу на PostgreSQL 16: репетиция миграции, логическая репликация и выкатка на прод',
  'R-10': 'Закрыл замечания security-аудита: токены, rate limiting и зависимости с CVE',
  'R-11': 'Сделал многоязычные email-уведомления о заказе',
  'R-12': 'Навёл порядок в наблюдаемости: корреляция запросов и единый формат логов',
  'R-13': 'Убрал дубли клиентов при импорте из CRM',
  'R-14': 'Добавил экспорт отчёта о заказах в CSV, чтобы бухгалтерия выгружала его сама',
};

/** Личный вклад: чем именно занимался сам. */
const ROLE_LEAD: Record<string, string> = {
  'R-1': 'Сам профилировал эндпоинт, спроектировал кеш и перевёл выдачу на курсорную пагинацию',
  'R-2': 'Провёл аудит облака и сам перенёс нагрузку на дешёвые ресурсы',
  'R-3': 'Спроектировал границы сервисов и провёл переключение трафика под фиче-флагом',
  'R-4': 'Написал клиент PayLine и вёл поэтапное включение по проценту трафика',
  'R-5': 'Согласовал целевые уровни с продуктом и сам настроил алерты',
  'R-6': 'Переписал пайплайн: кеши, шарды тестов и шаблон для новых сервисов',
  'R-7': 'Написал тесты, починил нестабильные и собрал гайд для команды',
  'R-8': 'Написал руководство и собрал песочницу, провёл воркшопы по архитектуре',
  'R-9': 'Подготовил и отрепетировал миграцию, а затем выкатил её на прод',
  'R-10': 'Закрыл замечания аудита по очереди, от токенов до зависимостей',
  'R-11': 'Реализовал рассылку и вынес шаблоны в общую библиотеку',
  'R-12': 'Внедрил корреляционный идентификатор и единый формат логов',
  'R-13': 'Нашёл причину дублей и поправил импорт',
  'R-14': 'Сделал выгрузку под запрос бухгалтерии',
};

/** Влияние на команду и продукт. */
const TEAM_LEAD: Record<string, string> = {
  'R-5': 'Дал команде общий язык для разговора о надёжности: SLO и алерты, по которым видно, когда платежи деградируют',
  'R-6': 'Ускорил CI для всей команды: разработчики меньше ждут пайплайн',
  'R-7': 'Сделал тесты общей практикой команды: отчёт о покрытии в каждом merge request и гайд по тестам',
  'R-8': 'Новичкам стало проще войти в проект: у них есть чек-лист, руководство и безопасная песочница',
  'R-12': 'Команде легче разбирать инциденты: по одному идентификатору видно путь запроса через сервисы',
};

const TEAM_RE = /CI|онбординг|тест|наблюдаем|SLO/i;

const TEAM_HINT_DEFAULT = 'Результат полезен не только мне, но и всей команде';

function stripDot(s: string): string {
  return s.replace(/[.\s]+$/, '');
}

function firstSentence(s: string): string {
  const m = s.match(/^[^.!?]+/);
  return stripDot(m ? m[0] : s);
}

function lower1(s: string): string {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/** Строчная первая буква, но аббревиатуры (SLO, CI, p95) не трогаем. */
function softLower(s: string): string {
  if (s.length > 1 && s[1] === s[1].toUpperCase() && s[1] !== s[1].toLowerCase()) return s;
  return lower1(s);
}

function counts(r: Result) {
  const jira = r.items.filter((i) => i.source === 'jira').length;
  const mr = r.items.filter((i) => i.source === 'gitlab').length;
  return { jira, mr };
}

function keyText(r: Result): string {
  const lead = KEY_LEAD[r.id] ?? `Сделал «${r.title}»: ${lower1(firstSentence(r.summary))}`;
  return r.effect.trim() ? `${lead}. Итог: ${softLower(stripDot(r.effect.trim()))}.` : `${lead}.`;
}

function roleText(r: Result): string {
  const lead = ROLE_LEAD[r.id] ?? `Отвечал за «${r.title}» от первых задач до результата`;
  const { jira, mr } = counts(r);
  const bits: string[] = [];
  if (jira) bits.push(`${jira} ${plural(jira, ['задача', 'задачи', 'задач'])} в Jira`);
  if (mr) bits.push(`${mr} MR`);
  return bits.length ? `${lead} (${bits.join(' и ')}).` : `${lead}.`;
}

function teamText(r: Result): string {
  const lead = TEAM_LEAD[r.id] ?? `${TEAM_HINT_DEFAULT}: ${r.title}`;
  return r.effect.trim() ? `${lead} (${softLower(stripDot(r.effect.trim()))}).` : `${lead}.`;
}

function claimFor(r: Result, text: string): DraftClaim {
  const claim: DraftClaim = { text, resultIds: [r.id] };
  if (!r.effect.trim()) claim.warning = WARNING_NO_EFFECT;
  return claim;
}

function nextClaims(results: Result[], top: Result | undefined): DraftClaim[] {
  const open = results.filter((r) => !r.effect.trim()).slice(0, 2);
  if (open.length) {
    return open.map((r) => ({
      text: `Найду цифры и подтверждения по теме «${r.title}», чтобы показать результат так же убедительно, как остальные.`,
      resultIds: [r.id],
    }));
  }
  if (top) {
    return [
      {
        text: `Продолжу развивать направление «${top.title}» и в следующем периоде буду сразу фиксировать эффект в Летописи.`,
        resultIds: [top.id],
      },
    ];
  }
  return [];
}

function ref(ids: string[]): string {
  return ids.map((id) => `[${id}]`).join(' ');
}

function claimMarkdown(c: DraftClaim): string {
  const body = stripDot(c.text);
  const tail = c.warning ? ` ⚠ ${c.warning.toLowerCase()}` : '';
  return `${body} ${ref(c.resultIds)}.${tail}`;
}

function idNum(id: string): number {
  return Number(id.replace(/\D/g, '')) || 0;
}

function toMarkdown(title: string, intro: string, sections: DraftSection[], results: Result[]): string {
  const out: string[] = [`# ${title}`, '', intro, ''];
  for (const s of sections) {
    if (!s.claims.length) continue;
    out.push(`## ${s.title}`, '');
    for (const c of s.claims) out.push(`- ${claimMarkdown(c)}`);
    out.push('');
  }
  if (results.length) {
    out.push('## Источники', '');
    for (const r of [...results].sort((a, b) => idNum(a.id) - idNum(b.id))) {
      const links = r.items.map((i) => `[${i.id}](${i.url})`).join(', ');
      const ev = r.evidence.map((e) => `[${e.label}](${e.url})`).join(', ');
      const all = [links, ev].filter(Boolean).join('; ');
      out.push(`- [${r.id}] ${r.title}${all ? ` — ${all}` : ''}`);
    }
    out.push('');
  }
  return out.join('\n');
}

export function buildDraft(meta: DemoMeta, results: Result[], templateId: TemplateId): DraftDoc {
  const title = `Self-review · ${meta.company}`;
  const period = formatPeriod(meta.periodStart, meta.periodEnd);
  const jira = results.reduce((n, r) => n + counts(r).jira, 0);
  const mr = results.reduce((n, r) => n + counts(r).mr, 0);

  const intro = results.length
    ? `${meta.person}, ${meta.role.toLowerCase()}, команда ${meta.team}. Период: ${period}. ` +
      `Ниже ${results.length} ${plural(results.length, ['результат', 'результата', 'результатов'])}, ` +
      `каждый связан с записью и её подтверждениями: ${jira} ${plural(jira, ['задача', 'задачи', 'задач'])} Jira и ${mr} merge requests.`
    : `${meta.person}, ${meta.role.toLowerCase()}, команда ${meta.team}. Период: ${period}. Пока не выбрано ни одного результата.`;

  let sections: DraftSection[];
  if (templateId === 'free') {
    sections = [{ title: 'Результаты за период', claims: results.map((r) => claimFor(r, keyText(r))) }];
  } else {
    // Топ-3 по числу связанных элементов (при равенстве — в порядке входа).
    const ranked = results
      .map((r, i) => ({ r, i }))
      .sort((a, b) => b.r.items.length - a.r.items.length || a.i - b.i)
      .slice(0, 3)
      .map((x) => x.r);
    const keyIds = new Set(ranked.map((r) => r.id));
    const key = results.filter((r) => keyIds.has(r.id));
    const rest = results.filter((r) => !keyIds.has(r.id));
    const personal = rest.length ? rest : key;
    const team = results.filter((r) => TEAM_RE.test(r.title));

    sections = [
      { title: 'Ключевые результаты', claims: key.map((r) => claimFor(r, keyText(r))) },
      { title: 'Личный вклад', claims: personal.map((r) => claimFor(r, roleText(r))) },
      { title: 'Влияние на команду и продукт', claims: team.map((r) => claimFor(r, teamText(r))) },
      { title: 'Что дальше', claims: nextClaims(results, ranked[0]) },
    ];
  }

  return { title, intro, sections, markdown: toMarkdown(title, intro, sections, results) };
}
