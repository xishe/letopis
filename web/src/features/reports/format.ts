const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { y, m: m - 1, d };
}

/** «1 апр – 30 сен 2026» */
export function formatPeriod(startIso: string, endIso: string): string {
  const a = parts(startIso);
  const b = parts(endIso);
  const left = `${a.d} ${MONTHS_SHORT[a.m]}${a.y === b.y ? '' : ` ${a.y}`}`;
  return `${left} – ${b.d} ${MONTHS_SHORT[b.m]} ${b.y}`;
}

export function plural(n: number, forms: [string, string, string]): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
}

/** «Анна Смирнова» → «Анне Смирновой» (для известных окончаний; иначе имя без изменений). */
export function toDative(fullName: string): string {
  return fullName
    .split(' ')
    .map((w) => {
      if (/(ова|ева|ёва|ина|ына)$/i.test(w)) return w.slice(0, -1) + 'ой';
      if (/ская$/i.test(w)) return w.slice(0, -2) + 'ой';
      if (/[ая]$/i.test(w) && !/ия$/i.test(w)) return w.slice(0, -1) + 'е';
      return w;
    })
    .join(' ');
}

const TR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .split('')
    .map((c) => (c in TR ? TR[c] : c))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
