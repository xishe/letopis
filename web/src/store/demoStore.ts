import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { demoMeta, demoResults } from '../data/demo';
import type { DemoMeta, Evidence, Report, Result, TemplateId } from '../types';

export interface DemoState {
  meta: DemoMeta;
  results: Result[];
  reports: Report[];
  session: { connected: string[]; startedAt?: string; chronicleBuiltAt?: string };
  connectSource(name: string): void;
  buildChronicle(): void; // ставит startedAt (если пуст) и chronicleBuiltAt
  confirm(id: string): void; // suggested → confirmed, если effect непуст, иначе → needs_effect
  setEffect(id: string, text: string): void; // непустой эффект у needs_effect → confirmed
  addEvidence(id: string, e: Evidence): void;
  setVisibility(id: string, visible: boolean): void;
  hide(id: string): void;
  createReport(templateId: TemplateId, resultIds: string[]): string; // возвращает id "rep-<n>"
  sendReport(id: string, to: string): void;
  resetDemo(): void;
}

export const STORAGE_KEY = 'letopis-demo-v1';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function initialData() {
  return {
    meta: clone(demoMeta),
    results: clone(demoResults),
    reports: [] as Report[],
    session: { connected: [] as string[] } as DemoState['session'],
  };
}

const patch = (results: Result[], id: string, fn: (r: Result) => Result): Result[] =>
  results.map((r) => (r.id === id ? fn(r) : r));

export const useDemo = create<DemoState>()(
  persist(
    (set, get) => ({
      ...initialData(),

      connectSource: (name) =>
        set((s) =>
          s.session.connected.includes(name)
            ? s
            : { session: { ...s.session, connected: [...s.session.connected, name] } },
        ),

      buildChronicle: () =>
        set((s) => {
          const now = new Date().toISOString();
          return { session: { ...s.session, startedAt: s.session.startedAt ?? now, chronicleBuiltAt: now } };
        }),

      confirm: (id) =>
        set((s) => ({
          results: patch(s.results, id, (r) =>
            {
              if (r.status !== 'suggested') return r;
              // Подтверждение находки автосбора принимает подсказанный эффект, если своего нет.
              const effect = r.effect.trim() || r.suggestedEffect?.trim() || '';
              return { ...r, effect, status: effect ? 'confirmed' : 'needs_effect' };
            },
          ),
        })),

      setEffect: (id, text) =>
        set((s) => ({
          results: patch(s.results, id, (r) => {
            const effect = text.trim();
            let status = r.status;
            if (effect && r.status === 'needs_effect') status = 'confirmed';
            else if (!effect && r.status === 'confirmed') status = 'needs_effect';
            return { ...r, effect, status };
          }),
        })),

      addEvidence: (id, e) =>
        set((s) => ({ results: patch(s.results, id, (r) => ({ ...r, evidence: [...r.evidence, e] })) })),

      setVisibility: (id, visible) =>
        set((s) => ({ results: patch(s.results, id, (r) => ({ ...r, visibleToManager: visible })) })),

      hide: (id) => set((s) => ({ results: patch(s.results, id, (r) => ({ ...r, status: 'hidden' })) })),

      createReport: (templateId, resultIds) => {
        const n = get().reports.reduce((max, r) => Math.max(max, Number(r.id.replace('rep-', '')) || 0), 0) + 1;
        const id = `rep-${n}`;
        set((s) => ({
          reports: [...s.reports, { id, templateId, resultIds: [...resultIds], createdAt: new Date().toISOString() }],
        }));
        return id;
      },

      sendReport: (id, to) =>
        set((s) => ({
          reports: s.reports.map((r) => (r.id === id ? { ...r, sentTo: to, sentAt: new Date().toISOString() } : r)),
        })),

      resetDemo: () => set(initialData()),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (s) => ({ meta: s.meta, results: s.results, reports: s.reports, session: s.session }),
    },
  ),
);

export const selectInboxCount = (s: DemoState): number => s.results.filter((r) => r.status === 'suggested').length;

// Результат мемоизирован по ссылке на s.results: селектор безопасно использовать как useDemo(selectVisibleResults).
let visibleSrc: Result[] | null = null;
let visibleOut: Result[] = [];
export const selectVisibleResults = (s: DemoState): Result[] => {
  if (visibleSrc !== s.results) {
    visibleSrc = s.results;
    visibleOut = s.results
      .filter((r) => r.status !== 'hidden')
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }
  return visibleOut;
};

export const selectReportById =
  (id: string | undefined) =>
  (s: DemoState): Report | undefined =>
    id ? s.reports.find((r) => r.id === id) : undefined;
