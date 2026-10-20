import { beforeEach, describe, expect, it } from 'vitest';
import { demoResults } from '../data/demo';
import { STORAGE_KEY, selectInboxCount, selectReportById, selectVisibleResults, useDemo } from './demoStore';

const st = () => useDemo.getState();
const byId = (id: string) => st().results.find((r) => r.id === id)!;

beforeEach(() => {
  localStorage.clear();
  st().resetDemo();
});

describe('demoStore', () => {
  it('confirm: suggested без эффекта → needs_effect', () => {
    expect(byId('R-13').status).toBe('suggested');
    st().confirm('R-13');
    expect(byId('R-13').status).toBe('needs_effect');
  });

  it('confirm: suggested с эффектом → confirmed; confirmed не меняется', () => {
    st().setEffect('R-14', '−2 ч работы в месяц'); // у suggested эффект просто записывается
    expect(byId('R-14').status).toBe('suggested');
    st().confirm('R-14');
    expect(byId('R-14').status).toBe('confirmed');
    st().confirm('R-1');
    expect(byId('R-1').status).toBe('confirmed');
  });

  it('confirm: suggested с подсказкой автосбора берёт suggestedEffect', () => {
    const hint = byId('R-11').suggestedEffect;
    expect(hint).toBeTruthy();
    st().confirm('R-11');
    expect(byId('R-11').status).toBe('confirmed');
    expect(byId('R-11').effect).toBe(hint);
  });

  it('setEffect: needs_effect → confirmed, пустой эффект возвращает needs_effect', () => {
    st().setEffect('R-8', '−20%');
    expect(byId('R-8').status).toBe('confirmed');
    expect(byId('R-8').effect).toBe('−20%');
    st().setEffect('R-8', '  ');
    expect(byId('R-8').status).toBe('needs_effect');
  });

  it('selectInboxCount уменьшается после confirm/hide', () => {
    expect(selectInboxCount(st())).toBe(3);
    st().confirm('R-11');
    expect(selectInboxCount(st())).toBe(2);
    st().hide('R-13');
    expect(selectInboxCount(st())).toBe(1);
  });

  it('selectVisibleResults: без hidden, по дате убыванию, стабильная ссылка', () => {
    const v = selectVisibleResults(st());
    expect(v).toHaveLength(14);
    expect(v.every((r) => r.status !== 'hidden')).toBe(true);
    for (let i = 1; i < v.length; i++) expect(v[i - 1].date >= v[i].date).toBe(true);
    expect(selectVisibleResults(st())).toBe(v);
    st().hide(v[0].id);
    expect(selectVisibleResults(st())).toHaveLength(13);
  });

  it('addEvidence и setVisibility', () => {
    st().addEvidence('R-8', { label: 'Отзыв HR', url: 'https://example.com/x' });
    expect(byId('R-8').evidence).toHaveLength(1);
    expect(byId('R-8').visibleToManager).toBe(false);
    st().setVisibility('R-8', true);
    expect(byId('R-8').visibleToManager).toBe(true);
  });

  it('createReport возвращает id и сохраняет resultIds; id не повторяются', () => {
    const a = st().createReport('acme', ['R-1', 'R-2']);
    const b = st().createReport('free', ['R-3']);
    expect(a).toBe('rep-1');
    expect(b).toBe('rep-2');
    expect(st().reports.find((r) => r.id === a)?.resultIds).toEqual(['R-1', 'R-2']);
    expect(st().reports.find((r) => r.id === a)?.templateId).toBe('acme');
  });

  it('sendReport ставит sentTo/sentAt', () => {
    const id = st().createReport('acme', ['R-1']);
    st().sendReport(id, 'Анна Смирнова');
    const r = st().reports.find((x) => x.id === id)!;
    expect(r.sentTo).toBe('Анна Смирнова');
    expect(r.sentAt).toBeTruthy();
  });

  it('buildChronicle ставит startedAt один раз и chronicleBuiltAt', () => {
    st().connectSource('Jira');
    st().connectSource('Jira');
    expect(st().session.connected).toEqual(['Jira']);
    st().buildChronicle();
    const first = st().session.startedAt;
    expect(first).toBeTruthy();
    expect(st().session.chronicleBuiltAt).toBeTruthy();
    st().buildChronicle();
    expect(st().session.startedAt).toBe(first);
  });

  it('resetDemo после createReport+sendReport: отчёты и сессия очищены, результаты исходные', () => {
    st().connectSource('Jira');
    st().buildChronicle();
    st().confirm('R-11');
    st().hide('R-13');
    const id = st().createReport('acme', ['R-1']);
    st().sendReport(id, 'Анна Смирнова');
    st().resetDemo();
    expect(st().reports).toEqual([]);
    expect(st().session).toEqual({ connected: [] });
    expect(st().results).toEqual(demoResults);
    expect(selectInboxCount(st())).toBe(3);
  });

  it('persist: после rehydrate состояние восстанавливается из localStorage', async () => {
    st().confirm('R-11');
    const id = st().createReport('acme', ['R-1', 'R-2']);
    const raw = localStorage.getItem(STORAGE_KEY)!;
    expect(raw).toBeTruthy();
    // «перезагрузка страницы»: память сброшена, localStorage остался
    useDemo.setState({ results: demoResults.map((r) => ({ ...r })), reports: [] });
    localStorage.setItem(STORAGE_KEY, raw);
    await useDemo.persist.rehydrate();
    expect(byId('R-11').status).toBe('confirmed');
    expect(selectReportById(id)(st())?.resultIds).toEqual(['R-1', 'R-2']);
  });

  it('несуществующий report id → selectReportById даёт undefined', () => {
    expect(selectReportById('rep-999')(st())).toBeUndefined();
    expect(selectReportById(undefined)(st())).toBeUndefined();
  });
});
