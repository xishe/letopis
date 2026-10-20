export type ResultStatus = 'suggested' | 'needs_effect' | 'confirmed' | 'hidden';
export interface SourceItem {
  id: string;
  source: 'jira' | 'gitlab';
  type: string;
  title: string;
  url: string;
  closedAt: string;
}
export interface Evidence {
  label: string;
  url: string;
}
export interface Result {
  id: string; // "R-1"
  title: string;
  summary: string;
  status: ResultStatus;
  effect: string; // '' если нет
  suggestedEffect?: string; // «Возможный эффект» из автосбора
  items: SourceItem[];
  evidence: Evidence[];
  visibleToManager: boolean;
  date: string; // ISO, последняя дата закрытия
  isTail?: boolean; // «Поддержка и исправления», скрыт по умолчанию
}
export type TemplateId = 'acme' | 'free';
export interface Report {
  id: string;
  templateId: TemplateId;
  resultIds: string[];
  createdAt: string;
  sentTo?: string;
  sentAt?: string;
}
export interface DemoMeta {
  person: string;
  role: string;
  team: string;
  company: string;
  manager: string;
  periodStart: string;
  periodEnd: string;
  reviewName: string;
  jiraCount: number;
  mrCount: number;
}
