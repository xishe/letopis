import type { Result } from '../../types';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function parts(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { y, m: m - 1, d };
}

export const monthTitle = (iso: string): string => {
  const { y, m } = parts(iso);
  return `${MONTHS[m] ?? ''} ${y}`;
};

export const shortDate = (iso: string): string => {
  const { m, d } = parts(iso);
  return `${d} ${MONTHS_GEN[m] ?? ''}`;
};

export const jiraCount = (r: Result): number => r.items.filter((i) => i.source === 'jira').length;
export const mrCount = (r: Result): number => r.items.filter((i) => i.source === 'gitlab').length;

/** «LET-212 закрыта, !58 смержен · был ли эффект?» */
export function suggestionHint(r: Result): string {
  const jira = r.items.filter((i) => i.source === 'jira');
  const mr = r.items.filter((i) => i.source === 'gitlab');
  const bits: string[] = [];
  if (jira[0]) bits.push(`${jira[0].id} закрыта`);
  if (mr[0]) bits.push(`${mr[0].id} смержен`);
  const rest = r.items.length - bits.length;
  const base = bits.join(', ') + (rest > 0 ? ` и ещё ${rest}` : '');
  return base ? `${base} · был ли эффект?` : 'Был ли эффект?';
}

export function groupByMonth(results: Result[]): { key: string; title: string; items: Result[] }[] {
  const groups: { key: string; title: string; items: Result[] }[] = [];
  for (const r of results) {
    const key = r.date.slice(0, 7);
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, title: monthTitle(r.date), items: [] };
      groups.push(g);
    }
    g.items.push(r);
  }
  return groups;
}
