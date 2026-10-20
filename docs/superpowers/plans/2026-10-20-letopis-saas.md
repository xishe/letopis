# Летопись SaaS-прототип — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Светлое Linear-подобное SPA «Летопись» с кликабельным демо-путём до готового self-review, задеплоенное на Netlify.

**Architecture:** Статический фронтенд без бэкенда. Демо-данные — курированный JSON из существующей Python-группировки. Всё состояние — в одном zustand-сторе с сохранением в localStorage; экраны только вызывают его действия. Черновик self-review собирает чистая функция-генератор.

**Tech Stack:** Vite 6, React 18, TypeScript 5 (strict), Tailwind CSS 3, react-router-dom 6, zustand 4, framer-motion 11, lucide-react, @fontsource/inter, vitest 2.

**Spec:** `docs/superpowers/specs/2026-10-20-letopis-saas-design.md` (читать целиком перед любой задачей; исследование — `C:\Users\Kliment\Documents\ОПП\Летопись_контекст.md`).

## Global Constraints
- Корень приложения: `C:\Users\Kliment\Documents\ОПП\letopis_prototype\web\`. Windows, PowerShell, Node 24, npm. Путь содержит кириллицу — команды запускать из `web/` абсолютными путями.
- Только светлая тема. Палитра и типографика — строго из раздела «Фирменный стиль» спеки; цвета задаются токенами в `tailwind.config.ts` (`bg`, `sidebar`, `surface`, `border`, `border-soft`, `ink`, `ink-2`, `ink-3`, `accent` = `#5E5CE6`, `ok`/`ok-bg`, `warn`/`warn-bg`). Хардкод hex в компонентах запрещён.
- Весь UI-текст на русском. Без Lorem ipsum. Цифры исследования — только из спеки (раздел «Данные, тексты и интерактивность»).
- Никаких сетевых запросов в рантайме, кроме загрузки самой страницы. Шрифт — `@fontsource/inter`.
- Без UI-китов (MUI, Chakra, shadcn-генераторов). Свои примитивы из `src/ui/`.
- Ширина: корректно на 1280 и 1440 px.
- Коммиты в git-репозиторий `letopis_prototype` после каждой задачи, сообщение в стиле `feat(web): …`, последняя строка `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Готовность любой задачи: `npm run build` и `npm test` из `web/` без ошибок.

## Review Focus
1. Перезагрузка страницы посреди демо (в т.ч. на `/app/reports/:id`) — состояние восстанавливается из localStorage, несуществующий report id → редирект на `/app/reports/new` без белого экрана. Тест в Task 2 (`persist + unknown report`), проверка в Task 6.
2. Сборка отчёта без выбранных результатов — кнопка «Собрать черновик» disabled, генератор на пустом входе не падает. Тест в Task 4.
3. Повторный «Сбросить демо» после отправки отчёта — отчёты и таймер очищены, хроника в исходном виде. Тест в Task 2.
4. Горячие клавиши не срабатывают при вводе текста в поля (C, J, K внутри input/textarea). Тест в Task 3.
5. Длинный эффект/название (>120 символов) не ломает строку ленты и чипы — обрезка с многоточием. Проверка в Task 3 (тест рендера с длинной строкой).

---

### Task 1: Каркас, дизайн-токены, бренд, оболочка, демо-данные (агент «foundation»)

**Files:**
- Create: `web/` (Vite react-ts), `web/tailwind.config.ts`, `web/postcss.config.js`, `web/src/index.css`, `web/vitest.config.ts`
- Create: `web/src/types.ts`, `web/src/brand/Logo.tsx`, `web/public/favicon.svg`
- Create: `web/src/ui/{Button,Chip,StatusDot,EffectPill,Kbd,SidePanel,Modal,Toast}.tsx`
- Create: `web/src/app/AppShell.tsx`, `web/src/app/Sidebar.tsx`, `web/src/routes.tsx`, `web/src/main.tsx`
- Create: `web/src/features/{landing,onboarding,chronicle,reports,team}/index.tsx` (заглушки страниц)
- Create: `web/scripts/build_demo_data.py`, `web/src/data/demo.json`
- Create: `.gitignore` в `letopis_prototype` (node_modules, dist, .superpowers, data/letopis.db, __pycache__)

**Interfaces — Produces (неизменяемые для задач 3–5):**
```ts
// src/types.ts
export type ResultStatus = 'suggested' | 'needs_effect' | 'confirmed' | 'hidden';
export interface SourceItem { id: string; source: 'jira' | 'gitlab'; type: string; title: string; url: string; closedAt: string }
export interface Evidence { label: string; url: string }
export interface Result {
  id: string;            // "R-1"
  title: string; summary: string; status: ResultStatus;
  effect: string;        // '' если нет
  suggestedEffect?: string; // «Возможный эффект» из автосбора
  items: SourceItem[]; evidence: Evidence[];
  visibleToManager: boolean; date: string; // ISO, последняя дата закрытия
  isTail?: boolean;      // «Поддержка и исправления», скрыт по умолчанию
}
export type TemplateId = 'acme' | 'free';
export interface Report { id: string; templateId: TemplateId; resultIds: string[]; createdAt: string; sentTo?: string; sentAt?: string }
export interface DemoMeta { person: string; role: string; team: string; company: string; manager: string; periodStart: string; periodEnd: string; reviewName: string; jiraCount: number; mrCount: number }
```
- Страницы-заглушки: каждый `src/features/<x>/index.tsx` — `export default function <X>Page()`. Маршруты в `routes.tsx` (задачи 3–5 их НЕ правят): `/` → landing, `/app/onboarding` → onboarding, `/app/chronicle` → chronicle, `/app/reports/new` и `/app/reports/:id` → reports (`ReportsPage` сама разбирает параметр), `/app/team` → team; `/app` → редирект на `/app/onboarding`, если `session.chronicleBuiltAt` пуст, иначе на `/app/chronicle`.
- Примитивы `src/ui/*` с props: `Button {variant:'primary'|'secondary'|'ghost'; size?:'sm'|'md'; kbd?:string}`, `Chip {children}`, `StatusDot {status: ResultStatus}` (пунктир / половина / зелёный), `EffectPill {effect: string}` (пусто → оранжевое «нет цифры»), `Kbd`, `SidePanel {open; onClose; children}` (справа, framer-motion, Esc закрывает), `Modal`, `toast(text)` + `<Toaster/>`.
- `Logo {size?:number; withWordmark?:boolean}` — монограмма «Л» с нитью времени по спеке.
- `AppShell` = Sidebar + `<Outlet/>`. Sidebar: вордмарк, пункты Входящие (счётчик `inboxCount`), Хроника, Отчёты (кол-во), Инициативы (бейдж «скоро»), секция «Команда Backend»: Результаты команды, «{reviewName} · N дн.»; внизу «Сбросить демо» (вызывает `resetDemo` и переходит на `/app/onboarding`).

- [ ] **Step 1:** `npm create vite@latest web -- --template react-ts`, установить зависимости из Tech Stack, настроить Tailwind-токены, Inter, vitest (jsdom). `git init` в `letopis_prototype`, локально `git config user.name "Kliment"` и `user.email "djxishe@gmail.com"`.
- [ ] **Step 2:** `scripts/build_demo_data.py` (запуск: `python web/scripts/build_demo_data.py` из `letopis_prototype`) — импортирует `letopis.importer.load_demo` и `letopis.grouping.group_items(…, 2026-04-01, 2026-09-30)`, пишет `web/src/data/demo.json` = `{ meta: DemoMeta, results: Result[] }`. Затем ручная курация по спеке: человеческие названия групп по label, статусы 9 confirmed / 3 needs_effect / 3 suggested (даты suggested — 2026-10-07…2026-10-18), короткие эффекты, хвост `isTail: true, status: 'hidden'`. `meta`: Иван Петров, Backend-инженер, Backend, Acme, Анна Смирнова, «Ревью · осень 2026», jiraCount 164, mrCount 52.
- [ ] **Step 3:** тест `src/data/demo.test.ts`: 15 результатов; статусы ровно 9/3/3 среди не-хвостовых; у confirmed непустой effect и ≥1 item; id уникальны вида `R-\d+`; meta.jiraCount === 164.
- [ ] **Step 4:** примитивы, Logo, favicon, AppShell, Sidebar, routes, заглушки страниц. Стор подключается в Task 2 — до этого Sidebar берёт счётчики из demo.json.
- [ ] **Step 5:** `npm test` и `npm run build` — PASS. Коммит `feat(web): scaffold, design tokens, brand, shell, demo data`.

### Task 2: Стор демо (агент «foundation», сразу после Task 1)

**Files:** Create `web/src/store/demoStore.ts`, `web/src/store/demoStore.test.ts`; Modify `web/src/app/Sidebar.tsx` (счётчики из стора).

**Interfaces — Produces:**
```ts
export interface DemoState {
  meta: DemoMeta; results: Result[]; reports: Report[];
  session: { connected: string[]; startedAt?: string; chronicleBuiltAt?: string };
  connectSource(name: string): void;
  buildChronicle(): void;            // ставит startedAt (если пуст) и chronicleBuiltAt
  confirm(id: string): void;         // suggested → confirmed, если effect непуст, иначе → needs_effect
  setEffect(id: string, text: string): void; // непустой эффект у needs_effect → confirmed
  addEvidence(id: string, e: Evidence): void;
  setVisibility(id: string, visible: boolean): void;
  hide(id: string): void;
  createReport(templateId: TemplateId, resultIds: string[]): string; // возвращает id "rep-<n>"
  sendReport(id: string, to: string): void;
  resetDemo(): void;
}
export const useDemo: UseBoundStore<StoreApi<DemoState>>; // persist, key "letopis-demo-v1"
export const selectInboxCount: (s: DemoState) => number;  // кол-во suggested
export const selectVisibleResults: (s: DemoState) => Result[]; // без hidden, по date убыв.
```

- [ ] **Step 1: тесты** `demoStore.test.ts`: `confirm` suggested без эффекта → needs_effect; `setEffect('R-x','−20%')` у needs_effect → confirmed; `selectInboxCount` уменьшается после confirm/hide; `createReport` возвращает id и сохраняет resultIds; `sendReport` ставит sentTo/sentAt; `resetDemo` после createReport+sendReport → reports пуст, session пуст, results === исходные из demo.json; persist: после `useDemo.persist.rehydrate()` состояние совпадает.
- [ ] **Step 2:** реализовать, `npm test` PASS, Sidebar на сторе, `npm run build` PASS, коммит `feat(web): demo store`.

### Task 3: Хроника и карточка результата (агент «chronicle», параллельно с 4 и 5)

**Files:** только `web/src/features/chronicle/**` (index.tsx, ChronicleFeed, SuggestionCard, ResultRow, ResultPanel, CommandPalette, useHotkeys.ts, тесты).

**Consumes:** `useDemo`, селекторы, типы, примитивы `src/ui/*`, `SidePanel`.

- Страница: шапка «Хроника · {meta.person}», кнопки «Записать результат» (Kbd C; в демо открывает палитру команд с поиском по результатам — новые результаты не создаются, в сторе нет `addResult`) и primary «Собрать self-review» → `/app/reports/new`.
- Сверху секция «Новое от автосбора» — `SuggestionCard` для каждого suggested: «Подтвердить» (`confirm`), «Добавить эффект» (открывает `ResultPanel`), «Скрыть» (`hide`), анимация исчезновения.
- Лента: группы по месяцам (заголовок «Октябрь», «Сентябрь»…), карточки по макету варианта B: StatusDot, title, summary (2 строки, обрезка), EffectPill, чипы источников «Jira N», «MR N», плюс evidence-лейблы.
- `ResultPanel`: поля по спеке (эффект с кнопкой «Использовать» для suggestedEffect, список items со ссылками, «Добавить подтверждение» label+url, переключатель «Видит руководитель»).
- Палитра команд `Ctrl/⌘+K`: поиск по результатам и действиям («Собрать self-review», «Сбросить демо»). `J/K` — фокус по карточкам, `Enter` — открыть панель.
- [ ] **Step 1: тесты** (vitest + @testing-library/react, установить как devDependency, если нет): нажатие `c` внутри `<input>` не открывает палитру (Review Focus 4); «Подтвердить» на suggested с suggestedEffect уменьшает число карточек «Новое от автосбора»; рендер `ResultRow` с title длиной 150 символов содержит класс `truncate` (Review Focus 5).
- [ ] **Step 2:** реализовать; `npm test`, `npm run build` PASS; коммит `feat(web): chronicle feed and result panel`.

### Task 4: Подключение источников, сборка и черновик self-review (агент «reports», параллельно с 3 и 5)

**Files:** только `web/src/features/onboarding/**` и `web/src/features/reports/**` (+ `reports/draft.ts`, `reports/draft.test.ts`).

**Interfaces — Produces:**
```ts
// features/reports/draft.ts
export interface DraftClaim { text: string; resultIds: string[]; warning?: string }
export interface DraftSection { title: string; claims: DraftClaim[] }
export interface DraftDoc { title: string; intro: string; sections: DraftSection[]; markdown: string }
export function buildDraft(meta: DemoMeta, results: Result[], templateId: TemplateId): DraftDoc;
```
- Onboarding: 4 карточки источников (Jira, GitLab, Confluence, Контур.Толк) → `connectSource`, спиннер ~0.8 с; период (по умолчанию из meta); «Собрать хронику» активна при ≥2 подключённых → оверлей прогресса «Нашли {jiraCount} задач и {mrCount} MR → {результатов} результатов» ~2 с → `buildChronicle()` → `/app/chronicle`.
- `/app/reports/new`: выбор шаблона (2 карточки), список видимых результатов с чекбоксами (по умолчанию выбраны confirmed), индикатор «N из M выбранных подтверждены», кнопка «Собрать черновик» (disabled при 0) → `createReport` → `/app/reports/:id`.
- `/app/reports/:id`: неизвестный id → `<Navigate to="/app/reports/new"/>`. Документ печатается потоково (~3 с, кнопка «Показать сразу»), сноски-чипы `R-n` (hover подсвечивает, click открывает `SidePanel` с кратким видом результата). Справа чек-лист из трёх критериев спеки (первые два вычисляются: все пункты с эффектом и источником; третий — галочка после «Отправить руководителю»), метрики «Подготовка: N мин» (`now − session.startedAt`) и «Пункты с подтверждённым эффектом: N/M». «Отправить руководителю» → модалка (руководитель из meta) → `sendReport` → toast. «Скачать .md» — Blob из `markdown`.
- Шаблон «acme»: разделы «Ключевые результаты», «Личный вклад», «Влияние на команду и продукт», «Что дальше»; «free» — один раздел. Пункт без эффекта получает `warning: 'Добавьте эффект'`.
- [ ] **Step 1: тесты `draft.test.ts`:** acme даёт 4 раздела с указанными заголовками; каждый claim имеет ≥1 resultId из входа; результат без эффекта → claim с warning; пустой вход → не падает, sections пусты/без claims (Review Focus 2); markdown содержит `[R-1]` и раздел «Источники» со ссылками items.
- [ ] **Step 2:** тест страницы: неизвестный id рендерит редирект (Review Focus 1).
- [ ] **Step 3:** реализовать; `npm test`, `npm run build` PASS; коммит `feat(web): onboarding, report builder, draft`.

### Task 5: Лендинг, бренд-материалы, Netlify-конфиг (агент «brand», параллельно с 3 и 4)

**Files:** только `web/src/features/landing/**`, `web/src/features/team/**`, `web/public/og.png` (+ исходник `web/public/og.svg`), `web/index.html` (title, meta description, OG-теги, favicon), `web/netlify.toml`, `web/README.md`.

- Лендинг `/`: вордмарк, заголовок спеки, 3 тезиса спеки с подписью «опрос 5 инженеров, 2026», мини-превью интерфейса (статичная вёрстка хроники из `demo.json`, не скриншот), CTA «Открыть демо» → `/app`, футер «On-premise · SSO · LLM в контуре компании».
- Team `/app/team`: сводка тимлида — результаты с `visibleToManager` из стора; пустое состояние с иллюстрацией из линий «Сотрудники ещё не поделились результатами».
- `netlify.toml`: `[build] base="web"`, `command="npm run build"`, `publish="dist"`; `[[redirects]] from="/*" to="/index.html" status=200`.
- OG 1200×630: логотип, «Летопись», подзаголовок; png генерировать из svg любым локальным способом (например `npx @resvg/resvg-js-cli`) — если не выходит, оставить svg и указать в отчёте.
- [ ] **Step 1:** тест лендинга: рендер содержит три тезиса и ссылку на `/app`.
- [ ] **Step 2:** реализовать; `npm test`, `npm run build` PASS; коммит `feat(web): landing, team view, brand assets, netlify config`.

### Task 6: Интеграция, проверка, деплой (оркестратор Opus)
- [ ] `npm test`, `npm run build` из `web/` — PASS.
- [ ] `npm run preview`, пройти путь лендинг → onboarding → хроника (подтвердить 1, добавить эффект 1) → сборка → черновик → отправить → скачать; перезагрузка на черновике; «Сбросить демо». Консоль без ошибок, 1280 и 1440 px.
- [ ] Деплой `web/dist` на Netlify через коннектор; проверить прямую ссылку `/app/chronicle`.
- [ ] GitHub: после входа пользователя — создать репозиторий, push.
