"""Общие структуры данных прототипа «Летопись».

Это контракт между модулями importer, grouping, store, draft и app.
Менять поля можно только согласованно во всех модулях.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date


@dataclass
class WorkItem:
    """Одна единица работы из внешнего источника: задача Jira или MR GitLab."""

    id: str                      # "LET-123" для Jira, "!45" для GitLab
    source: str                  # "jira" | "gitlab"
    title: str
    url: str
    closed_at: date | None       # дата решения задачи / merge MR
    item_type: str = ""          # Jira: Story / Task / Bug / Epic; GitLab: "MR"
    status: str = ""
    description: str = ""
    epic: str = ""               # ключ или название эпика (Jira)
    labels: list[str] = field(default_factory=list)
    author: str = ""
    linked_ids: list[str] = field(default_factory=list)  # для MR: ключи задач Jira из title/branch


@dataclass
class CandidateResult:
    """Кандидат в результат: группа связанных задач и MR."""

    id: str                      # "R1", "R2", ...
    title: str
    summary: str                 # 1–2 предложения, что сделано (собрано из задач)
    items: list[WorkItem] = field(default_factory=list)
    score: float = 0.0           # эвристическая значимость, больше = важнее
    selected: bool = False       # пользователь включил в отчёт
    effect: str = ""             # эффект, который дописал пользователь
    extra_links: list[str] = field(default_factory=list)  # доп. подтверждения от пользователя

    @property
    def evidence_links(self) -> list[str]:
        """Все ссылки-подтверждения: на задачи/MR и добавленные пользователем."""
        return [i.url for i in self.items if i.url] + list(self.extra_links)

    @property
    def is_confirmed(self) -> bool:
        """Есть и эффект, и хотя бы одно подтверждение."""
        return bool(self.effect.strip()) and bool(self.evidence_links)


@dataclass
class DraftClaim:
    """Одно утверждение черновика и ссылки на результаты, которые его подтверждают."""

    text: str
    result_ids: list[str]        # id CandidateResult, на которые ссылается утверждение


@dataclass
class Draft:
    """Черновик self-review."""

    person: str
    period_start: date
    period_end: date
    intro: str
    claims: list[DraftClaim]
    markdown: str                # готовый текст со сносками [1], [2] и списком источников
    mode: str = "template"       # "template" | "llm"
