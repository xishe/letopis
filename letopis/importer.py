"""Разбор CSV-выгрузок Jira и GitLab в список WorkItem."""
from __future__ import annotations

import csv
import io
import re
from datetime import date
from pathlib import Path
from typing import Any

from .models import WorkItem

JIRA_BASE_URL = "https://jira.example.com/browse/"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"

_MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    "янв": 1, "фев": 2, "мар": 3, "апр": 4, "мая": 5, "июн": 6,
    "июл": 7, "авг": 8, "сен": 9, "окт": 10, "ноя": 11, "дек": 12,
}
_ISSUE_KEY_RE = re.compile(r"[A-Z][A-Z0-9]+-\d+")

_JIRA_COLS = {
    "key": ["issue key", "key", "ключ", "ключ задачи"],
    "summary": ["summary", "тема", "краткое описание"],
    "type": ["issue type", "issuetype", "type", "тип задачи", "тип"],
    "status": ["status", "статус"],
    "resolved": ["resolved", "resolution date", "дата решения", "решено"],
    "assignee": ["assignee", "исполнитель", "ответственный"],
    "labels": ["labels", "label", "метки"],
    "epic": ["custom field (epic link)", "epic link", "epic", "ссылка на эпик", "эпик"],
    "description": ["description", "описание"],
    "url": ["url", "ссылка"],
}
_GITLAB_COLS = {
    "iid": ["mr iid", "iid", "id", "номер"],
    "title": ["title", "название", "заголовок"],
    "description": ["description", "описание"],
    "url": ["url", "web url", "web_url", "ссылка"],
    "state": ["state", "статус", "состояние"],
    "author": ["author", "автор"],
    "merged": ["merged at", "merged_at", "дата слияния", "слит"],
    "branch": ["source branch", "source_branch", "ветка", "исходная ветка"],
    "labels": ["labels", "label", "метки"],
}


# ---------- низкоуровневые помощники ----------

def _read_bytes(file: Any) -> bytes:
    if isinstance(file, (bytes, bytearray)):
        return bytes(file)
    if isinstance(file, (str, Path)):
        return Path(file).read_bytes()
    if hasattr(file, "getvalue"):
        data = file.getvalue()
    elif hasattr(file, "read"):
        data = file.read()
    else:
        raise TypeError(f"Неподдерживаемый тип файла: {type(file)!r}")
    return data.encode("utf-8") if isinstance(data, str) else bytes(data)


def _decode(data: bytes) -> str:
    for enc in ("utf-8-sig", "cp1251"):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").replace("﻿", "").strip().lower().replace("ё", "е"))


def _read_rows(file: Any) -> list[list[str]]:
    text = _decode(_read_bytes(file))
    best: list[list[str]] = []
    for delim in (",", ";", "\t"):
        rows = list(csv.reader(io.StringIO(text, newline=""), delimiter=delim))
        if rows and (not best or len(rows[0]) > len(best[0])):
            best = rows
    return [r for r in best if any(c.strip() for c in r)]


class _Table:
    """Строки CSV с гибким доступом к колонкам по алиасам (допускает дубли заголовков)."""

    def __init__(self, rows: list[list[str]], aliases: dict[str, list[str]]):
        self.rows = rows[1:] if rows else []
        header = [_norm(h) for h in rows[0]] if rows else []
        self.idx: dict[str, list[int]] = {}
        for field, names in aliases.items():
            found: list[int] = []
            for name in names:  # порядок алиасов = приоритет
                found += [i for i, h in enumerate(header) if h == name and i not in found]
            self.idx[field] = found

    def get(self, row: list[str], field: str) -> str:
        for i in self.idx.get(field, []):
            if i < len(row) and row[i].strip():
                return row[i].strip()
        return ""

    def get_all(self, row: list[str], field: str) -> list[str]:
        return [row[i].strip() for i in self.idx.get(field, []) if i < len(row) and row[i].strip()]


def parse_date(value: str | None) -> date | None:
    """Толерантный разбор даты: Jira `12/Mar/26 3:45 PM`, `12.03.2026 15:45`, ISO. Ошибка → None."""
    s = (value or "").strip()
    if not s:
        return None
    try:
        m = re.match(r"^(\d{1,2})/([A-Za-zА-Яа-яЁё]{3,})\.?/(\d{2,4})", s)
        if m:
            mon = _MONTHS.get(m.group(2).lower()[:3])
            if mon is None:
                return None
            y = int(m.group(3))
            return date(y + 2000 if y < 100 else y, mon, int(m.group(1)))
        m = re.match(r"^(\d{1,2})[./](\d{1,2})[./](\d{2,4})", s)
        if m:
            y = int(m.group(3))
            return date(y + 2000 if y < 100 else y, int(m.group(2)), int(m.group(1)))
        m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", s)
        if m:
            return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    except ValueError:
        return None
    return None


def _split_labels(parts: list[str]) -> list[str]:
    out: list[str] = []
    for p in parts:
        for lab in re.split(r"[,;\s]+", p):
            if lab and lab not in out:
                out.append(lab)
    return out


# ---------- публичный API ----------

def load_jira_csv(file: Any, base_url: str = JIRA_BASE_URL) -> list[WorkItem]:
    """Задачи Jira. Epic-строки тоже возвращаются (item_type="Epic"), чтобы grouping мог
    сопоставить ключ эпика с его названием."""
    rows = _read_rows(file)
    if not rows:
        return []
    t = _Table(rows, _JIRA_COLS)
    items: list[WorkItem] = []
    for row in t.rows:
        key = t.get(row, "key")
        if not key:
            continue
        items.append(WorkItem(
            id=key,
            source="jira",
            title=t.get(row, "summary"),
            url=t.get(row, "url") or f"{base_url.rstrip('/')}/{key}",
            closed_at=parse_date(t.get(row, "resolved")),
            item_type=t.get(row, "type"),
            status=t.get(row, "status"),
            description=t.get(row, "description"),
            epic=t.get(row, "epic"),
            labels=_split_labels(t.get_all(row, "labels")),
            author=t.get(row, "assignee"),
        ))
    return items


def load_gitlab_csv(file: Any) -> list[WorkItem]:
    """Только merged MR. linked_ids — ключи задач из Title и Source Branch."""
    rows = _read_rows(file)
    if not rows:
        return []
    t = _Table(rows, _GITLAB_COLS)
    items: list[WorkItem] = []
    for row in t.rows:
        iid = t.get(row, "iid").lstrip("!#").strip()
        if not iid:
            continue
        state = _norm(t.get(row, "state"))
        if not (state.startswith("merge") or state.startswith("слит") or state.startswith("смерж")
                or state.startswith("влит")):
            continue
        title = t.get(row, "title")
        branch = t.get(row, "branch")
        linked: list[str] = []
        for k in _ISSUE_KEY_RE.findall(f"{title} {branch}"):
            if k not in linked:
                linked.append(k)
        items.append(WorkItem(
            id=f"!{iid}",
            source="gitlab",
            title=title,
            url=t.get(row, "url"),
            closed_at=parse_date(t.get(row, "merged")),
            item_type="MR",
            status="merged",
            description=t.get(row, "description"),
            labels=_split_labels(t.get_all(row, "labels")),
            author=t.get(row, "author"),
            linked_ids=linked,
        ))
    return items


def load_demo() -> list[WorkItem]:
    return load_jira_csv(DATA_DIR / "demo_jira.csv") + load_gitlab_csv(DATA_DIR / "demo_gitlab.csv")
