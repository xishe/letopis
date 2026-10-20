"""Хранилище сессий в SQLite: результаты и подтверждения пользователя."""
from __future__ import annotations

import json
import sqlite3
from contextlib import closing
from datetime import date
from pathlib import Path

from .models import CandidateResult, WorkItem

DEFAULT_DB = Path(__file__).resolve().parent.parent / "data" / "letopis.db"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    person TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (person, period_start, period_end)
)
"""


def _connect(db_path: str | None) -> sqlite3.Connection:
    path = Path(db_path) if db_path else DEFAULT_DB
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.execute(_SCHEMA)
    return conn


def _item_to_dict(i: WorkItem) -> dict:
    return {
        "id": i.id, "source": i.source, "title": i.title, "url": i.url,
        "closed_at": i.closed_at.isoformat() if i.closed_at else None,
        "item_type": i.item_type, "status": i.status, "description": i.description,
        "epic": i.epic, "labels": list(i.labels), "author": i.author,
        "linked_ids": list(i.linked_ids),
    }


def _item_from_dict(d: dict) -> WorkItem:
    closed = d.get("closed_at")
    return WorkItem(
        id=d["id"], source=d["source"], title=d["title"], url=d["url"],
        closed_at=date.fromisoformat(closed) if closed else None,
        item_type=d.get("item_type", ""), status=d.get("status", ""),
        description=d.get("description", ""), epic=d.get("epic", ""),
        labels=list(d.get("labels", [])), author=d.get("author", ""),
        linked_ids=list(d.get("linked_ids", [])),
    )


def _result_to_dict(r: CandidateResult) -> dict:
    return {
        "id": r.id, "title": r.title, "summary": r.summary,
        "items": [_item_to_dict(i) for i in r.items], "score": r.score,
        "selected": r.selected, "effect": r.effect, "extra_links": list(r.extra_links),
    }


def _result_from_dict(d: dict) -> CandidateResult:
    return CandidateResult(
        id=d["id"], title=d["title"], summary=d.get("summary", ""),
        items=[_item_from_dict(i) for i in d.get("items", [])],
        score=float(d.get("score", 0.0)), selected=bool(d.get("selected", False)),
        effect=d.get("effect", ""), extra_links=list(d.get("extra_links", [])),
    )


def save_results(person: str, start: date, end: date, results: list[CandidateResult],
                 db_path: str | None = None) -> None:
    payload = json.dumps([_result_to_dict(r) for r in results], ensure_ascii=False)
    with closing(_connect(db_path)) as conn, conn:
        conn.execute(
            "INSERT OR REPLACE INTO sessions (person, period_start, period_end, payload, updated_at) "
            "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
            (person, start.isoformat(), end.isoformat(), payload),
        )


def load_results(person: str, start: date, end: date,
                 db_path: str | None = None) -> list[CandidateResult] | None:
    with closing(_connect(db_path)) as conn:
        row = conn.execute(
            "SELECT payload FROM sessions WHERE person = ? AND period_start = ? AND period_end = ?",
            (person, start.isoformat(), end.isoformat()),
        ).fetchone()
    if row is None:
        return None
    return [_result_from_dict(d) for d in json.loads(row[0])]
