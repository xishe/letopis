"""Группировка WorkItem в кандидаты-результаты (CandidateResult)."""
from __future__ import annotations

import re
from collections import Counter
from datetime import date

from .models import CandidateResult, WorkItem

# метки, которые не считаются «общей темой»
GENERIC_LABELS = {"bugfix", "bug", "minor", "hotfix", "backend", "frontend", "fix", "chore", "task"}
MIN_LABEL_GROUP = 3
TYPE_WEIGHT = {"story": 3.0, "task": 1.5, "bug": 1.0, "mr": 1.0}
_EFFECT_RE = re.compile(r"\d+(?:[.,]\d+)?\s*(?:%|мс\b|ms\b|₽|×|раз\b|сек\b|мин\b)", re.I)


def _plural(n: int, forms: tuple[str, str, str]) -> str:
    n10, n100 = n % 10, n % 100
    if n10 == 1 and n100 != 11:
        return forms[0]
    if 2 <= n10 <= 4 and not 12 <= n100 <= 14:
        return forms[1]
    return forms[2]


def _has_metric(text: str) -> bool:
    return bool(_EFFECT_RE.search(text or ""))


def _effect_hint(items: list[WorkItem]) -> str:
    for it in items:
        if it.source != "jira":
            continue
        m = _EFFECT_RE.search(it.description or "")
        if m:
            sentences = re.split(r"(?<=[.!?])\s+|\n", it.description)
            for s in sentences:
                if _EFFECT_RE.search(s):
                    s = s.strip().rstrip(".")
                    return s if len(s) <= 140 else s[:137] + "..."
    return ""


def _item_weight(it: WorkItem) -> float:
    if it.source == "gitlab":
        return TYPE_WEIGHT["mr"]
    return TYPE_WEIGHT.get(it.item_type.lower(), 1.0)


def _score(items: list[WorkItem], epic: bool = False) -> float:
    s = sum(_item_weight(i) for i in items)
    s += 2.0 * sum(1 for i in items if i.source == "jira" and _has_metric(i.description))
    if epic:
        s += 3.0
    return s


def _summary(items: list[WorkItem]) -> str:
    jira = [i for i in items if i.source == "jira"]
    mrs = [i for i in items if i.source == "gitlab"]
    parts = []
    if jira:
        n = len(jira)
        parts.append(f"{n} {_plural(n, ('задача', 'задачи', 'задач'))}")
    if mrs:
        parts.append(f"{len(mrs)} MR")
    total = len(items)
    verb = "Сделана" if total == 1 and jira else "Сделано"
    text = f"{verb} {' и '.join(parts)}"
    base = jira or mrs
    # самые содержательные: Story первыми, затем длиннее
    top = sorted(base, key=lambda i: (-_item_weight(i), -len(i.title)))[:3]
    text += ": " + "; ".join(i.title.rstrip(".") for i in top) + "."
    hint = _effect_hint(items)
    if hint:
        text += f" Возможный эффект: {hint}."
    return text


def group_items(items: list[WorkItem], start: date, end: date) -> list[CandidateResult]:
    epic_names = {i.id: i.title for i in items if i.item_type.lower() == "epic"}
    in_period = [
        i for i in items
        if i.closed_at is not None and start <= i.closed_at <= end and i.item_type.lower() != "epic"
    ]
    jira = [i for i in in_period if i.source == "jira"]
    mrs = [i for i in in_period if i.source == "gitlab"]

    groups: dict[str, list[WorkItem]] = {}   # ключ группы -> задачи
    titles: dict[str, str] = {}
    is_epic: set[str] = set()
    owner: dict[str, str] = {}               # id задачи -> ключ группы
    tail: list[WorkItem] = []

    # 1) эпики
    no_epic: list[WorkItem] = []
    for it in jira:
        if it.epic:
            gk = f"epic:{it.epic}"
            groups.setdefault(gk, []).append(it)
            titles[gk] = epic_names.get(it.epic, it.epic)
            is_epic.add(gk)
            owner[it.id] = gk
        else:
            no_epic.append(it)

    # 2) общие метки среди задач без эпика
    counts = Counter(
        lab for it in no_epic for lab in set(it.labels) if lab.lower() not in GENERIC_LABELS
    )
    rest: list[WorkItem] = []
    for it in no_epic:
        cands = [(counts[l], l) for l in it.labels if counts.get(l, 0) >= MIN_LABEL_GROUP]
        if cands:
            label = sorted(cands, key=lambda c: (-c[0], c[1]))[0][1]
            gk = f"label:{label}"
            groups.setdefault(gk, []).append(it)
            titles[gk] = f"Работы по теме «{label}»"
            owner[it.id] = gk
        else:
            rest.append(it)

    # 3) одиночные Story, остальное в хвост
    for it in rest:
        if it.item_type.lower() == "story":
            gk = f"single:{it.id}"
            groups[gk] = [it]
            titles[gk] = it.title
            owner[it.id] = gk
        else:
            tail.append(it)

    # 4) MR
    for mr in mrs:
        gk = next((owner[k] for k in mr.linked_ids if k in owner), None)
        if gk:
            groups[gk].append(mr)
        else:
            tail.append(mr)

    candidates: list[CandidateResult] = []
    for gk, its in groups.items():
        candidates.append(CandidateResult(
            id="", title=titles[gk], summary=_summary(its), items=its,
            score=_score(its, epic=gk in is_epic),
        ))
    candidates.sort(key=lambda c: (-c.score, c.title))

    if tail:
        n = sum(1 for i in tail if i.source == "jira")
        label = f"{n} {_plural(n, ('задача', 'задачи', 'задач'))}" if n else f"{len(tail)} MR"
        candidates.append(CandidateResult(
            id="", title=f"Поддержка и исправления: {label}", summary=_summary(tail),
            items=tail, score=_score(tail),
        ))

    for n, c in enumerate(candidates, start=1):
        c.id = f"R{n}"
    return candidates
