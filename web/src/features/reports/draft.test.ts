import { describe, expect, it } from 'vitest';
import { demoMeta, demoResults } from '../../data/demo';
import { buildDraft } from './draft';

const visible = demoResults.filter((r) => r.status !== 'hidden');
const confirmed = visible.filter((r) => r.status === 'confirmed');

describe('buildDraft', () => {
  it('acme: 4 раздела с точными заголовками', () => {
    const doc = buildDraft(demoMeta, confirmed, 'acme');
    expect(doc.sections.map((s) => s.title)).toEqual([
      'Ключевые результаты',
      'Личный вклад',
      'Влияние на команду и продукт',
      'Что дальше',
    ]);
    expect(doc.sections.every((s) => s.claims.length > 0)).toBe(true);
  });

  it('каждый claim ссылается на результаты из входа', () => {
    const ids = new Set(visible.map((r) => r.id));
    for (const t of ['acme', 'free'] as const) {
      const doc = buildDraft(demoMeta, visible, t);
      for (const s of doc.sections) {
        for (const c of s.claims) {
          expect(c.resultIds.length).toBeGreaterThan(0);
          expect(c.resultIds.every((id) => ids.has(id))).toBe(true);
        }
      }
    }
  });

  it('результат без эффекта даёт claim с warning', () => {
    const noEffect = visible.find((r) => !r.effect.trim())!;
    const doc = buildDraft(demoMeta, [...confirmed, noEffect], 'free');
    const claim = doc.sections[0].claims.find((c) => c.resultIds.includes(noEffect.id))!;
    expect(claim.warning).toBe('Добавьте эффект');
    expect(doc.sections[0].claims.filter((c) => c.warning)).toHaveLength(1);
  });

  it('пустой вход не падает', () => {
    for (const t of ['acme', 'free'] as const) {
      const doc = buildDraft(demoMeta, [], t);
      expect(doc.sections.flatMap((s) => s.claims)).toHaveLength(0);
      expect(typeof doc.markdown).toBe('string');
    }
  });

  it('markdown содержит ссылки [R-1] и раздел «Источники» со ссылками на items', () => {
    const doc = buildDraft(demoMeta, confirmed, 'acme');
    expect(doc.markdown).toContain('[R-1]');
    expect(doc.markdown).toContain('## Источники');
    expect(doc.markdown).toContain('[LET-20](https://jira.example.com/browse/LET-20)');
  });

  it('детерминирован', () => {
    expect(buildDraft(demoMeta, visible, 'acme')).toEqual(buildDraft(demoMeta, visible, 'acme'));
  });
});
