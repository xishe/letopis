"""Собирает web/src/data/demo.json из демо-CSV и группировки letopis.

Запуск (из корня letopis_prototype):  python web/scripts/build_demo_data.py

Шаг 1 — автоматическая группировка (letopis.grouping.group_items) даёт 15 кандидатов.
Шаг 2 — ручная курация (словарь CURATION ниже): человеческие названия, статусы,
короткие эффекты, подтверждения. Курация детерминирована: ключ — id кандидата Rn.
"""
from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from letopis.grouping import group_items  # noqa: E402
from letopis.importer import load_demo  # noqa: E402

OUT = ROOT / "web" / "src" / "data" / "demo.json"
PERIOD = (date(2026, 4, 1), date(2026, 9, 30))

# status: confirmed | needs_effect | suggested | hidden
CURATION: dict[str, dict] = {
    "R1": dict(
        title="Ускорение поиска по каталогу",
        summary="Кеш выдачи в Redis, пагинация по курсору и асинхронная подгрузка фасетов. Каталог перестал деградировать в часы пик.",
        status="confirmed", effect="p95 800 → 450 мс",
        evidence=[("Дашборд Grafana · p95 /catalog/search", "https://grafana.example.com/d/catalog-latency")],
    ),
    "R2": dict(
        title="Снижение стоимости облачной инфраструктуры",
        summary="Аудит неиспользуемых ресурсов, перенос холодных данных в объектное хранилище, автомасштабирование воркеров очередей.",
        status="confirmed", effect="−380 тыс. ₽ в месяц",
        evidence=[("Отчёт FinOps за июль", "https://confluence.example.com/display/FIN/2026-07")],
    ),
    "R3": dict(
        title="Выделение сервиса заказов из монолита",
        summary="Модуль скидок и статусы заказа вынесены в отдельные сервисы; трафик переключён по фиче-флагу без простоя.",
        status="confirmed", effect="Покрытие тестами модуля 91%",
        evidence=[("Отчёт о покрытии в CI", "https://gitlab.example.com/backend/orders/-/coverage")],
    ),
    "R4": dict(
        title="Интеграция платёжного шлюза PayLine",
        summary="Клиент API с ретраями, оплата картой и постепенное включение по проценту трафика.",
        status="confirmed", effect="Конверсия оплаты +3,5%",
        evidence=[("Дашборд конверсии оплаты", "https://grafana.example.com/d/payments-conversion"),
                  ("Отзыв руководителя продукта", "https://confluence.example.com/display/PAY/feedback")],
    ),
    "R5": dict(
        title="SLO и алерты для платёжного сервиса",
        summary="Согласованы целевые уровни, настроены алерты по burn rate бюджета ошибок и синтетические проверки платёжного флоу.",
        status="confirmed", effect="SLO: доступность 99,95%, p95 авторизации 700 мс",
        evidence=[("Дашборд SLO платежей", "https://grafana.example.com/d/payments-slo")],
    ),
    "R6": dict(
        title="Ускорение CI/CD",
        summary="Кеш зависимостей, параллельный прогон тестов, автодеплой на стейджинг и шаблон пайплайна для новых сервисов.",
        status="confirmed", effect="Время прогона тестов −60%",
        evidence=[("Статистика пайплайнов GitLab", "https://gitlab.example.com/backend/-/pipelines/charts")],
    ),
    "R7": dict(
        title="Покрытие тестами критичных сервисов",
        summary="Тесты платёжного сервиса, контрактные тесты внешних API и граничные случаи расчёта налогов.",
        status="confirmed", effect="Покрытие 52% → 78%",
        evidence=[("Отчёт о покрытии в CI", "https://gitlab.example.com/backend/payments/-/coverage")],
    ),
    "R8": dict(
        title="Онбординг новых сотрудников",
        summary="Чек-лист первых 30 дней, руководство «Первый день backend-разработчика» и песочница с обезличенными данными.",
        status="needs_effect", effect="",
    ),
    "R9": dict(
        title="Миграция на PostgreSQL 16",
        summary="План и репетиция миграции, переключение на логическую репликацию, выкатка на прод.",
        status="confirmed", effect="Раздувание таблицы заказов −35%",
        evidence=[("Дашборд Postgres · размер таблиц", "https://grafana.example.com/d/pg-bloat")],
    ),
    "R10": dict(
        title="Закрытие замечаний security-аудита",
        summary="Токены больше не хранятся в открытом виде, включён rate limiting на публичных эндпоинтах, обновлены зависимости с CVE.",
        status="needs_effect", effect="",
    ),
    "R11": dict(
        title="Многоязычные email-уведомления о заказе",
        summary="Письма о заказе уходят на языке клиента, шаблоны вынесены в общую библиотеку.",
        status="suggested", effect="", suggested="Жалоб на непонятные письма стало на 25% меньше",
        date="2026-10-16",
    ),
    "R12": dict(
        title="Наблюдаемость: единые логи и корреляция запросов",
        summary="Корреляционный идентификатор во всех сервисах, единый формат структурированных логов, удалены устаревшие метрики.",
        status="needs_effect", effect="",
    ),
    "R13": dict(
        title="Дедупликация клиентов при импорте из CRM",
        summary="Импорт больше не создаёт дубли клиентов при повторной загрузке выгрузки.",
        status="suggested", effect="",
        date="2026-10-09",
    ),
    "R14": dict(
        title="Экспорт отчёта о заказах в CSV для бухгалтерии",
        summary="Бухгалтерия выгружает отчёт о заказах сама, без запроса к разработке.",
        status="suggested", effect="",
        date="2026-10-14",
    ),
    "R15": dict(
        title="Поддержка и исправления",
        summary="Обновления зависимостей, мелкие исправления и правки шаблонов.",
        status="hidden", effect="", tail=True,
    ),
}


def main() -> None:
    items = load_demo()
    jira_count = sum(1 for i in items if i.source == "jira" and i.item_type.lower() != "epic")
    mr_count = sum(1 for i in items if i.source == "gitlab")
    cands = group_items(items, *PERIOD)
    assert len(cands) == 15, len(cands)

    results = []
    for c in cands:
        cur = CURATION[c.id]
        override = cur.get("date")
        last = max(i.closed_at for i in c.items)
        day = override or last.isoformat()
        src_items = []
        for i in sorted(c.items, key=lambda x: (x.closed_at, x.id), reverse=True):
            src_items.append({
                "id": i.id,
                "source": i.source,
                "type": i.item_type or ("MR" if i.source == "gitlab" else ""),
                "title": i.title,
                "url": i.url,
                # у свежих находок даты сдвинуты в последние две недели
                "closedAt": day if override else i.closed_at.isoformat(),
            })
        r = {
            "id": f"R-{c.id[1:]}",
            "title": cur["title"],
            "summary": cur["summary"],
            "status": cur["status"],
            "effect": cur["effect"],
            "items": src_items,
            "evidence": [{"label": l, "url": u} for l, u in cur.get("evidence", [])],
            "visibleToManager": False,
            "date": day,
        }
        if cur.get("suggested"):
            r["suggestedEffect"] = cur["suggested"]
        if cur.get("tail"):
            r["isTail"] = True
        results.append(r)

    data = {
        "meta": {
            "person": "Иван Петров",
            "role": "Backend-инженер",
            "team": "Backend",
            "company": "Acme",
            "manager": "Анна Смирнова",
            "periodStart": PERIOD[0].isoformat(),
            "periodEnd": PERIOD[1].isoformat(),
            "reviewName": "Ревью · осень 2026",
            "jiraCount": jira_count,
            "mrCount": mr_count,
        },
        "results": results,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK: {len(results)} результатов, Jira {jira_count}, MR {mr_count} -> {OUT}")


if __name__ == "__main__":
    main()
