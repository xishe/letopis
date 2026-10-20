"""Генератор демо-выгрузок Jira и GitLab для «Летописи».

Запуск: python data/make_demo.py  (детерминированный seed, перезаписывает CSV рядом).
Фейковый инженер «Иван Петров», backend, период 2026-04-01 … 2026-09-30, проект LET.
"""
from __future__ import annotations

import csv
import random
from datetime import date, datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
ME = "Иван Петров"
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
GENERIC_DESC = [
    "Реализация и проверка на стенде, ревью пройдено.",
    "Сделано по согласованному дизайну, добавлены тесты.",
    "Доработка выкачена на прод, регрессии не обнаружено.",
    "Изменения покрыты тестами, документация обновлена.",
]

# (название эпика, метки, [(тип, summary, description)])
EPICS = [
    ("Ускорение API каталога", "catalog performance", [
        ("Story", "Кеширование выдачи каталога в Redis", "Добавлен кеш выдачи с TTL 60 с; p95 /catalog/search снизился с 800 до 450 мс."),
        ("Task", "Индекс по (category_id, created_at) для списка товаров", "Запрос списка товаров ускорился с 1200 до 180 мс."),
        ("Story", "Пагинация по курсору вместо offset", "Глубокие страницы больше не деградируют, p99 на странице 500 упал в 6×."),
        ("Task", "Убрать N+1 в сериализации карточки товара", "Число SQL-запросов на карточку снижено на 40%."),
        ("Task", "Профилирование эндпоинта /catalog/search", ""),
        ("Story", "Асинхронная подгрузка фасетов фильтров", "Фасеты считаются параллельно, ответ поиска быстрее на 120 мс."),
        ("Task", "Сжатие ответов gzip для списков", ""),
        ("Task", "Нагрузочный тест каталога в k6", "Сценарий на 500 RPS добавлен в nightly."),
        ("Task", "Прогрев кеша после деплоя", ""),
        ("Bug", "Инвалидация кеша при обновлении цены", ""),
        ("Task", "Дашборд latency каталога в Grafana", ""),
    ]),
    ("Миграция на PostgreSQL 16", "postgres migration", [
        ("Story", "План и репетиция миграции PostgreSQL 14 → 16", "Репетиция на копии прода, простой при переключении 4 минуты."),
        ("Task", "Обновить расширения pg_trgm и pgcrypto", ""),
        ("Story", "Переход на логическую репликацию для переключения", "Переключение без потери данных, лаг репликации до 2 с."),
        ("Task", "Проверить совместимость миграций Alembic", ""),
        ("Task", "Скрипт сверки данных до и после миграции", "Сверено 48 таблиц, расхождений 0."),
        ("Bug", "Падение запроса отчёта из-за изменения планировщика", ""),
        ("Task", "Настроить autovacuum под новые объёмы", "Раздувание таблицы заказов уменьшено на 35%."),
        ("Task", "Обновить образы Postgres в docker-compose", ""),
        ("Story", "Выкатить PostgreSQL 16 на прод", "Миграция прошла в ночное окно, откат не потребовался."),
        ("Task", "Обновить runbook по восстановлению из бэкапа", ""),
    ]),
    ("Онбординг новых сотрудников", "onboarding docs", [
        ("Story", "Руководство «Первый день backend-разработчика»", "Время выхода нового сотрудника на первый MR сократилось с 10 до 4 дней."),
        ("Task", "Скрипт bootstrap локального окружения", "Развёртывание окружения: с 3 часов до 15 минут."),
        ("Task", "Список «хороших первых задач» в Jira", ""),
        ("Story", "Менторская программа: чек-лист на первые 30 дней", ""),
        ("Task", "Провести 3 воркшопа по архитектуре сервисов", "Прошли 11 новых сотрудников."),
        ("Task", "Описание доменной модели в wiki", ""),
        ("Task", "Шаблон ADR для архитектурных решений", ""),
        ("Task", "Собрать FAQ по доступам и инструментам", ""),
        ("Story", "Песочница с обезличенными данными для обучения", ""),
        ("Task", "Опрос новичков после 30 дней", "Удовлетворённость онбордингом 4,6 из 5."),
    ]),
    ("Алерты и SLO для платежей", "payments slo alerting", [
        ("Story", "Определить SLO платежного сервиса", "Согласованы SLO: доступность 99,95%, p95 авторизации 700 мс."),
        ("Task", "Метрики успешности платежей в Prometheus", ""),
        ("Story", "Алерты по burn rate бюджета ошибок", "Время обнаружения инцидентов сократилось с 25 до 5 минут."),
        ("Task", "Дашборд SLO платежей в Grafana", ""),
        ("Task", "Интеграция алертов с PagerDuty", ""),
        ("Bug", "Ложные срабатывания алерта по таймаутам", "Шум алертов уменьшился на 70%."),
        ("Task", "Runbook на падение платежного шлюза", ""),
        ("Story", "Синтетические проверки платежного флоу", ""),
        ("Task", "Ежемесячный отчёт по SLO", ""),
        ("Task", "Трассировка запросов платежей через OpenTelemetry", ""),
    ]),
    ("Снижение стоимости инфраструктуры", "cost infra", [
        ("Story", "Аудит неиспользуемых ресурсов в облаке", "Найдено и удалено ресурсов на 380 000 ₽ в месяц."),
        ("Task", "Перевести dev-окружения на spot-инстансы", "Затраты на dev снижены на 55%."),
        ("Story", "Автомасштабирование воркеров очередей", "Среднее число воркеров снизилось с 24 до 14."),
        ("Task", "Политика хранения логов 30 дней", "Объём хранимых логов уменьшен на 45%."),
        ("Task", "Right-sizing подов по данным профилирования", ""),
        ("Task", "Отключение ночью тестовых стендов", ""),
        ("Story", "Перенос холодных данных в объектное хранилище", "Экономия на хранении: −30% затрат."),
        ("Task", "Теги стоимости по командам", ""),
        ("Task", "Отчёт FinOps для руководителей", ""),
        ("Bug", "Утечка неиспользуемых томов после удаления подов", ""),
    ]),
    ("Декомпозиция сервиса заказов", "orders refactoring", [
        ("Story", "Выделить модуль расчёта скидок из монолита", "Покрытие модуля тестами 91%."),
        ("Story", "Отдельный сервис статусов заказа", ""),
        ("Task", "Контракты событий заказа в схему Avro", ""),
        ("Task", "Миграция чтения статусов на новый сервис", ""),
        ("Task", "Удалить мёртвый код в OrderManager", "Удалено 4200 строк."),
        ("Bug", "Дублирование события при повторной отправке заказа", ""),
        ("Task", "Идемпотентность создания заказа", ""),
        ("Task", "Контрактные тесты между сервисами", ""),
        ("Story", "Переключение трафика на новый сервис по фиче-флагу", "Задержка создания заказа упала с 900 до 520 мс."),
        ("Task", "Документация по границам сервисов", ""),
        ("Task", "Откат фиче-флага после проверки метрик", ""),
    ]),
    ("Ускорение CI/CD", "cicd pipeline", [
        ("Story", "Кеширование зависимостей в пайплайне", "Время сборки сокращено с 25 до 9 минут."),
        ("Task", "Параллельный запуск тестов по шардам", "Тесты идут в 4 потока, время прогона −60%."),
        ("Task", "Docker-слои: переупорядочить Dockerfile", ""),
        ("Story", "Автодеплой на стейджинг после merge", ""),
        ("Task", "Линтеры в pre-commit", ""),
        ("Task", "Канареечный выкат для backend", "Откат плохих релизов за 2 минуты вместо 20."),
        ("Bug", "Флейки в интеграционных тестах платежей", "Доля флейков с 8% до 1%."),
        ("Task", "Метрики DORA в дашборде", ""),
        ("Task", "Секреты из Vault в пайплайне", ""),
        ("Story", "Шаблон пайплайна для новых сервисов", ""),
    ]),
    ("Интеграция с платёжным шлюзом PayLine", "payline payments", [
        ("Story", "Клиент API PayLine с ретраями", ""),
        ("Story", "Оплата по карте через PayLine", "Конверсия оплаты выросла на 3,5% по сравнению с прежним шлюзом."),
        ("Task", "Обработка вебхуков PayLine", ""),
        ("Task", "Сверка транзакций PayLine с бухгалтерией", ""),
        ("Task", "Тестовый стенд и песочница PayLine", ""),
        ("Bug", "Некорректная сумма при возврате частичной оплаты", ""),
        ("Task", "Поддержка 3-D Secure 2", ""),
        ("Story", "Постепенное включение PayLine по процентам трафика", ""),
        ("Task", "Мониторинг успешности PayLine", ""),
        ("Task", "Документация по интеграции", ""),
    ]),
    ("Повышение покрытия тестами критичных сервисов", "testing quality", [
        ("Story", "Покрытие тестами сервиса платежей до 80%", "Покрытие выросло с 52% до 78%."),
        ("Task", "Фабрики тестовых данных", ""),
        ("Task", "Тесты на граничные случаи расчёта налогов", ""),
        ("Task", "Mutation testing для модуля скидок", ""),
        ("Story", "Контрактные тесты внешних API", ""),
        ("Task", "Разбор и починка нестабильных тестов", "Нестабильных тестов было 23, осталось 3."),
        ("Task", "Отчёт о покрытии в merge request", ""),
        ("Task", "Тесты миграций на копии схемы", ""),
        ("Bug", "Тест зависит от порядка выполнения", ""),
        ("Task", "Гайд по написанию тестов в команде", ""),
    ]),
]

LABEL_GROUPS = [
    ("security-audit", [
        ("Story", "Закрыть замечание аудита: хранение токенов в открытом виде", "Токены перенесены в Vault, закрыто 3 критичных замечания."),
        ("Task", "Обновить зависимости с уязвимостями CVE", "Закрыто 17 уязвимостей уровня high."),
        ("Task", "Ограничить права сервисных аккаунтов", ""),
        ("Task", "Включить rate limiting на публичных эндпоинтах", ""),
        ("Bug", "Утечка внутренних ошибок в ответе API", ""),
    ]),
    ("observability-cleanup", [
        ("Task", "Единый формат структурированных логов", ""),
        ("Task", "Удалить устаревшие метрики и дашборды", "Удалено 60 неиспользуемых дашбордов."),
        ("Task", "Корреляционный идентификатор запроса во всех сервисах", ""),
        ("Task", "Настроить ротацию логов приложений", ""),
    ]),
]

SINGLETONS = [
    ("Story", "Экспорт отчёта о заказах в CSV для бухгалтерии", "Бухгалтерия экономит около 6 часов в месяц на ручной сборке отчёта.", "reporting"),
    ("Story", "Многоязычные email-уведомления о заказе", "Поддержаны 3 языка, жалоб на непонятные письма стало на 25% меньше.", "i18n"),
    ("Story", "Дедупликация клиентов при импорте из CRM", "Найдено и объединено 1800 дублей клиентов.", "crm"),
]

TAIL_TEMPLATES = [
    ("Bug", "Исправить опечатку в тексте {x}"),
    ("Bug", "Починить падение {x} при пустом ответе"),
    ("Task", "Обновить версию библиотеки для {x}"),
    ("Bug", "Исправить таймзону в {x}"),
    ("Task", "Добавить логирование в {x}"),
    ("Bug", "Некорректная валидация в {x}"),
    ("Task", "Мелкий рефакторинг {x}"),
    ("Bug", "Исправить 500 ошибку в {x}"),
]
TAIL_COMPONENTS = [
    "форме заказа", "API профиля", "выгрузке отчётов", "email-шаблоне", "админке",
    "сервисе уведомлений", "фильтре каталога", "модуле скидок", "корзине", "проверке адреса",
    "импорте товаров", "API статусов", "webhook-обработчике", "кабинете клиента", "поиске",
]
SLUGS = ["add-cache", "refactor", "fix-query", "update-config", "migrate", "metrics", "tests", "cleanup", "handler"]

P_START = date(2026, 4, 1)
P_END = date(2026, 9, 30)


def fmt_jira(rng: random.Random, d: date) -> str:
    h, m = rng.randint(9, 19), rng.randint(0, 59)
    if rng.random() < 0.2:
        return f"{d.day:02d}.{d.month:02d}.{d.year} {h:02d}:{m:02d}"
    h12 = h % 12 or 12
    return f"{d.day:02d}/{MONTHS[d.month - 1]}/{d.year % 100:02d} {h12}:{m:02d} {'AM' if h < 12 else 'PM'}"


def workday(rng: random.Random, lo: date, hi: date) -> date:
    for _ in range(20):
        d = lo + timedelta(days=rng.randint(0, max((hi - lo).days, 0)))
        if d.weekday() < 5:
            return d
    return d


def build() -> tuple[list[dict], list[dict]]:
    rng = random.Random(42)
    issues: list[dict] = []   # key, summary, type, status, resolved(date|None), labels, epic, desc
    counter = [0]

    def add(typ, summary, desc, resolved, labels="", epic="", status=None):
        counter[0] += 1
        key = f"LET-{counter[0]}"
        issues.append(dict(key=key, summary=summary, type=typ,
                           status=status or ("Done" if resolved else "In Progress"),
                           resolved=resolved, labels=labels, epic=epic,
                           desc=desc or rng.choice(GENERIC_DESC)))
        return key

    epic_keys = []
    for name, _, _ in EPICS:
        epic_keys.append(add("Epic", name, "", None, status="In Progress"))

    for i, (name, labels, tasks) in enumerate(EPICS):
        lo = P_START + timedelta(days=i * 14)
        hi = lo + timedelta(days=50)
        for typ, summary, desc in tasks:
            add(typ, summary, desc, workday(rng, lo, hi), labels, epic_keys[i])
    # вне периода и незакрытые (внутри эпиков)
    add("Task", "Разведка: сравнение стратегий кеширования", "", date(2026, 3, 24), "catalog", epic_keys[0])
    add("Task", "Подготовка стенда для нагрузочных тестов", "", date(2026, 3, 18), "catalog", epic_keys[0])
    add("Task", "Ретроспектива квартала по инфраструктуре", "", date(2026, 10, 6), "cost", epic_keys[4])
    add("Task", "Вторая волна оптимизации запросов каталога", "", None, "catalog", epic_keys[0], status="Open")
    add("Story", "Автоматическое удаление старых бэкапов", "", None, "cost", epic_keys[4], status="In Progress")

    for label, tasks in LABEL_GROUPS:
        lo = P_START + timedelta(days=rng.randint(10, 80))
        for typ, summary, desc in tasks:
            add(typ, summary, desc, workday(rng, lo, lo + timedelta(days=40)), label)
    for typ, summary, desc, label in SINGLETONS:
        add(typ, summary, desc, workday(rng, P_START + timedelta(days=20), P_END - timedelta(days=10)), label)

    combos = [(t, s.format(x=c)) for c in TAIL_COMPONENTS for t, s in TAIL_TEMPLATES]
    rng.shuffle(combos)
    for typ, summary in combos[:52]:
        add(typ, summary, "", workday(rng, P_START, P_END),
            rng.choice(["", "", "bugfix", "minor", "hotfix"]))
    add("Bug", "Исправление мелкой ошибки в старом отчёте", "", date(2026, 2, 12), "bugfix")
    add("Task", "Чистка устаревших веток", "", date(2026, 10, 14), "minor")
    add("Bug", "Ошибка округления в расчёте доставки", "", None, "bugfix", status="Open")

    # --- MR ---
    by_key = {x["key"]: x for x in issues}
    mrs: list[dict] = []
    for x in issues:
        if x["type"] == "Epic" or x["resolved"] is None:
            continue
        in_tail = not x["epic"] and x["labels"] in ("", "bugfix", "minor", "hotfix")
        if in_tail:
            p = 0.08
        elif x["type"] == "Story":
            p = 0.7
        else:
            p = 0.3
        if rng.random() < p:
            n = 2 if (x["type"] == "Story" and rng.random() < 0.3) else 1
            for _ in range(n):
                mrs.append(dict(key=x["key"], summary=x["summary"], merged=x["resolved"] - timedelta(days=rng.randint(0, 2)),
                                state="merged"))
    for t in ("Исправление гонки в консьюмере очереди", "Обновление зависимостей", "Правки конфигурации линтера", "Форматирование кода"):
        mrs.append(dict(key=None, summary=t, merged=workday(rng, P_START, P_END), state="merged"))
    linked = [m for m in mrs if m["key"]]
    for state in ["closed"] * 4 + ["opened"] * 4:
        base = rng.choice(linked)
        mrs.append(dict(key=base["key"], summary=base["summary"] + " (черновой вариант)",
                        merged=base["merged"], state=state))
    mrs.sort(key=lambda m: (m["merged"], m["summary"]))

    jira_rows = []
    for x in issues:
        jira_rows.append({
            "Issue key": x["key"], "Summary": x["summary"], "Issue Type": x["type"], "Status": x["status"],
            "Resolved": fmt_jira(rng, x["resolved"]) if x["resolved"] else "",
            "Assignee": ME, "Labels": x["labels"], "Custom field (Epic Link)": x["epic"],
            "Description": x["desc"],
        })
    gl_rows = []
    for iid, m in enumerate(mrs, start=1):
        key = m["key"]
        slug = rng.choice(SLUGS)
        if key and rng.random() < 0.15:
            title, branch = m["summary"], f"feature/{key}-{slug}"      # ключ только в ветке
        elif key and rng.random() < 0.15:
            title, branch = f"{key} {m['summary']}", f"feature/{slug}-{iid}"  # ключ только в заголовке
        elif key:
            title, branch = f"{key}: {m['summary']}", f"feature/{key}-{slug}"
        else:
            title, branch = m["summary"], f"chore/{slug}-{iid}"
        dt = datetime(m["merged"].year, m["merged"].month, m["merged"].day, rng.randint(9, 19), rng.randint(0, 59), 12)
        gl_rows.append({
            "MR IID": iid, "Title": title,
            "Description": (f"Closes {key}. " if key else "") + rng.choice(GENERIC_DESC),
            "URL": f"https://gitlab.example.com/backend/catalog/-/merge_requests/{iid}",
            "State": m["state"], "Author": ME,
            "Merged At": dt.strftime("%Y-%m-%dT%H:%M:%S.000Z") if m["state"] == "merged" else "",
            "Source Branch": branch, "Labels": "backend",
        })
    return jira_rows, gl_rows


def write(path: Path, rows: list[dict]) -> None:
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)


if __name__ == "__main__":
    jira, gl = build()
    write(HERE / "demo_jira.csv", jira)
    write(HERE / "demo_gitlab.csv", gl)
    print(len(jira), "jira rows;", len(gl), "MR rows")
