# План прототипа «Летопись» (вариант 2: CSV → результаты → черновик)

## Цель
Рабочий веб-прототип, который за 2–3 минуты демо показывает основную ценность:
полгода задач и MR → список кандидатов-результатов → подтверждение (эффект + ссылка) → черновик self-review, где каждое утверждение ссылается на источник.

Без Telegram-бота, без Figma, без интеграций по API, SSO, on-premise, отчётов тимлида и план-факта.

## Стек
- Python 3.14, Streamlit 1.58, pandas, SQLite (stdlib).
- Тесты: `unittest` (stdlib).
- LLM опционально: если задан `ANTHROPIC_API_KEY`, черновик пишет Claude (`claude-sonnet-5-5`) через HTTP API; иначе работает шаблонный генератор. Демо не зависит от ключа.

## Структура
```
letopis_prototype/
  app.py                 # Streamlit UI, 4 шага
  letopis/
    __init__.py
    models.py            # общие dataclass-ы (контракт между модулями)
    importer.py          # разбор CSV Jira и GitLab → WorkItem
    grouping.py          # WorkItem → CandidateResult
    store.py             # SQLite: сохранение сессии и подтверждений
    draft.py             # черновик self-review (шаблон / LLM)
  data/
    demo_jira.csv        # фейковый инженер, ~6 мес., ~150–200 задач
    demo_gitlab.csv      # ~50–70 MR, часть связана с задачами по ключу
  tests/
    test_importer.py
    test_grouping.py
    test_store.py
    test_draft.py
  README.md
```

## API модулей (зафиксировано, менять нельзя)
Типы — из `letopis/models.py`. `FileLike` = путь (`str`/`Path`) **или** файловый объект/`bytes` (Streamlit `UploadedFile`).

```python
# letopis/importer.py
def load_jira_csv(file: FileLike) -> list[WorkItem]: ...
def load_gitlab_csv(file: FileLike) -> list[WorkItem]: ...
def load_demo() -> list[WorkItem]: ...          # Jira + GitLab из data/, вместе

# letopis/grouping.py
def group_items(items: list[WorkItem], start: date, end: date) -> list[CandidateResult]: ...
    # фильтр по closed_at в [start, end]; результат отсортирован по score убыв.; id = "R1", "R2", ...

# letopis/store.py   (SQLite, файл по умолчанию data/letopis.db)
def save_results(person: str, start: date, end: date, results: list[CandidateResult], db_path: str | None = None) -> None: ...
def load_results(person: str, start: date, end: date, db_path: str | None = None) -> list[CandidateResult] | None: ...

# letopis/draft.py
def build_draft(results: list[CandidateResult], person: str, start: date, end: date, use_llm: bool = False) -> Draft: ...
    # берёт только selected; каждое утверждение ссылается минимум на один selected result
```

## Демо-сценарий
1. «Иван Петров, backend-инженер, ревью через неделю». Нажать «Демо-данные» или загрузить свои CSV.
2. Экран кандидатов: «187 задач и 64 MR → 14 кандидатов-результатов», отсортированы по значимости.
3. Отметить 5–7 результатов, дописать эффект («p95 API −40%») и при желании ссылку на дашборд или отзыв.
4. «Собрать self-review» → черновик со сносками [1], [2]… на задачи и MR; индикатор качества (доля пунктов с эффектом и подтверждением); скачать .md.

## Этапы и исполнители
| # | Задача | Исполнитель | Зависит от |
|---|--------|-------------|------------|
| 0 | План, контракт `models.py`, каркас | Opus (оркестратор) | — |
| 1 | Демо-данные, `importer.py`, `grouping.py`, `store.py`, тесты | агент Sonnet «backend» | 0 |
| 2 | `draft.py`, `app.py`, тест черновика | агент Sonnet «frontend» | 0 |
| 3 | Интеграция, прогон тестов, запуск в браузере, ревью | Opus | 1, 2 |
| 4 | README, правки по ревью | Opus / агент Sonnet | 3 |

Агенты 1 и 2 работают параллельно и не трогают файлы друг друга. Общая точка — только `models.py` (не меняют).

## Критерии готовности
- `python -m unittest discover -s tests` проходит.
- `streamlit run app.py` открывается; сквозной сценарий на демо-данных проходит без ошибок.
- В черновике нет утверждений без ссылки на запись.
- Работает без интернета и без ключа LLM.

## Что прототип проверяет на тестах с пользователями
- Время подготовки self-review (сейчас 20–30+ ч по анкетам).
- Сколько результатов найдено «заново» по сравнению с подготовкой по памяти.
- Доля пунктов с эффектом и подтверждением.
