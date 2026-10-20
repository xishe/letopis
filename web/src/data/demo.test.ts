import { describe, expect, it } from 'vitest';
import { demoMeta, demoResults } from './demo';

describe('demo.json', () => {
  const visible = demoResults.filter((r) => !r.isTail);

  it('содержит 15 результатов: 14 видимых и хвост', () => {
    expect(demoResults).toHaveLength(15);
    expect(visible).toHaveLength(14);
    const tail = demoResults.filter((r) => r.isTail);
    expect(tail).toHaveLength(1);
    expect(tail[0].status).toBe('hidden');
  });

  it('статусы среди не-хвостовых: 8 подтверждено / 3 без цифры / 3 предложено', () => {
    const count = (s: string) => visible.filter((r) => r.status === s).length;
    expect(count('confirmed')).toBe(8);
    expect(count('needs_effect')).toBe(3);
    expect(count('suggested')).toBe(3);
  });

  it('у confirmed непустой эффект и хотя бы один источник', () => {
    for (const r of visible.filter((x) => x.status === 'confirmed')) {
      expect(r.effect.trim()).not.toBe('');
      expect(r.items.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('id уникальны и вида R-n', () => {
    const ids = demoResults.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^R-\d+$/);
  });

  it('свежие находки датированы 2026-10-07…2026-10-18', () => {
    for (const r of visible.filter((x) => x.status === 'suggested')) {
      expect(r.date >= '2026-10-07' && r.date <= '2026-10-18').toBe(true);
    }
  });

  it('meta согласована с данными', () => {
    expect(demoMeta.jiraCount).toBe(164);
    expect(demoMeta.mrCount).toBe(52);
    expect(demoMeta.person).toBe('Иван Петров');
    const jira = demoResults.flatMap((r) => r.items).filter((i) => i.source === 'jira').length;
    const mr = demoResults.flatMap((r) => r.items).filter((i) => i.source === 'gitlab').length;
    expect(jira).toBeLessThanOrEqual(demoMeta.jiraCount); // часть задач выгрузки вне периода
    expect(mr).toBeLessThanOrEqual(demoMeta.mrCount);
  });
});

