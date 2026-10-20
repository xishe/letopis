"""Генератор черновика self-review: шаблон или LLM (с тихим фолбэком на шаблон)."""
from __future__ import annotations

import json
import os
import re
import urllib.request
from datetime import date

from .models import CandidateResult, Draft, DraftClaim

API_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-sonnet-5-5"
NO_EFFECT_MARK = "⚠ эффект не указан"


def _fmt_date(d: date) -> str:
    return d.strftime("%d.%m.%Y")


def _compress(text: str, limit: int = 160) -> str:
    """Сжимает summary до одного короткого предложения без завершающей точки."""
    text = " ".join((text or "").split())
    m = re.search(r"[.!?](\s|$)", text)
    if m:
        text = text[: m.start()]
    text = text.strip().rstrip(".!?")
    if len(text) > limit:
        text = text[: limit - 1].rstrip() + "…"
    return text


def _plural(n: int, one: str, few: str, many: str) -> str:
    n10, n100 = n % 10, n % 100
    if n10 == 1 and n100 != 11:
        return one
    if 2 <= n10 <= 4 and not 12 <= n100 <= 14:
        return few
    return many


def _template_intro(selected: list[CandidateResult], person: str, start: date, end: date) -> str:
    period = f"{_fmt_date(start)} — {_fmt_date(end)}"
    if not selected:
        return (f"{person}, период {period}: в отчёт пока не включено ни одного результата. "
                "Выберите результаты на шаге «Результаты».")
    n = len(selected)
    c = sum(1 for r in selected if r.is_confirmed)
    return (f"{person}, период {period}: в отчёт включено {n} "
            f"{_plural(n, 'результат', 'результата', 'результатов')}, "
            f"из них с подтверждённым эффектом — {c}.")


def _template_claim(r: CandidateResult) -> DraftClaim:
    base = _compress(r.summary) or "работа выполнена"
    text = f"{r.title}: {base}."
    effect = r.effect.strip().rstrip(".")
    if effect:
        text += f" Эффект: {effect}."
    else:
        text += f" {NO_EFFECT_MARK}."
    return DraftClaim(text=text, result_ids=[r.id])


def _link(label: str, url: str) -> str:
    return f"[{label}]({url})" if url else label


def _sources_for(results: list[CandidateResult]) -> list[str]:
    links: list[str] = []
    seen: set[str] = set()
    for r in results:
        for it in r.items:
            key = f"{it.id}|{it.url}"
            if key in seen:
                continue
            seen.add(key)
            links.append(_link(it.id, it.url))
        for url in r.extra_links:
            if url and url not in seen:
                seen.add(url)
                links.append(_link(url, url))
    return links


def _render_markdown(person: str, start: date, end: date, intro: str,
                     claims: list[DraftClaim], by_id: dict[str, CandidateResult]) -> str:
    lines = [f"# Самооценка за период {_fmt_date(start)} — {_fmt_date(end)}", "",
             f"**Сотрудник:** {person}", "", intro, ""]
    if claims:
        lines += ["## Результаты", ""]
        for i, c in enumerate(claims, 1):
            lines.append(f"{i}. {c.text} [{i}]")
        lines += ["", "## Источники", ""]
        for i, c in enumerate(claims, 1):
            rs = [by_id[x] for x in c.result_ids if x in by_id]
            lines.append(f"**[{i}]** {'; '.join(r.title for r in rs)}")
            links = _sources_for(rs)
            for lk in links:
                lines.append(f"- {lk}")
            if not links:
                lines.append("- (ссылок нет)")
            lines.append("")
    return "\n".join(lines).rstrip() + "\n"


# ---------------------------------------------------------------- LLM

def _parse_llm_claims(text: str, allowed_ids: set[str] | list[str]) -> tuple[str, list[DraftClaim]]:
    """Разбирает ответ LLM. Возвращает (intro, claims) только с валидными ссылками.

    Невалидные claims отбрасываются; на мусоре возвращается ("", []).
    """
    allowed = set(allowed_ids)
    if not isinstance(text, str):
        return "", []
    s = text.strip()
    m = re.search(r"\{.*\}", s, re.DOTALL)
    if not m:
        return "", []
    try:
        data = json.loads(m.group(0))
    except (ValueError, TypeError):
        return "", []
    if not isinstance(data, dict):
        return "", []
    intro = data.get("intro")
    intro = intro.strip() if isinstance(intro, str) else ""
    raw = data.get("claims")
    claims: list[DraftClaim] = []
    if isinstance(raw, list):
        for c in raw:
            if not isinstance(c, dict):
                continue
            t = c.get("text")
            ids = c.get("result_ids")
            if not isinstance(t, str) or not t.strip():
                continue
            if not isinstance(ids, list) or not ids:
                continue
            if not all(isinstance(x, str) and x in allowed for x in ids):
                continue
            uniq = list(dict.fromkeys(ids))
            claims.append(DraftClaim(text=t.strip(), result_ids=uniq))
    return intro, claims


def _call_llm(selected: list[CandidateResult], person: str, start: date, end: date,
              api_key: str) -> str:
    payload_results = [{
        "id": r.id, "title": r.title, "summary": r.summary,
        "effect": r.effect, "items": [f"{i.id}: {i.title}" for i in r.items][:15],
    } for r in selected]
    prompt = (
        "Ты помогаешь инженеру написать self-review на русском языке. "
        f"Сотрудник: {person}. Период: {start.isoformat()} — {end.isoformat()}.\n"
        "Ниже результаты (JSON). Напиши краткое вступление и по одному утверждению на результат. "
        "Используй только факты из данных, ничего не выдумывай, эффект упоминай только если он указан. "
        "Верни ТОЛЬКО JSON вида "
        '{"intro": "...", "claims": [{"text": "...", "result_ids": ["R1"]}]}. '
        "result_ids — только id из переданных результатов, минимум один у каждого утверждения.\n\n"
        + json.dumps(payload_results, ensure_ascii=False)
    )
    body = json.dumps({
        "model": MODEL, "max_tokens": 2000,
        "messages": [{"role": "user", "content": prompt}],
    }).encode("utf-8")
    req = urllib.request.Request(API_URL, data=body, method="POST", headers={
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return "".join(b.get("text", "") for b in data.get("content", []) if isinstance(b, dict))


def _try_llm(selected: list[CandidateResult], person: str, start: date, end: date):
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not key or not selected:
        return None
    try:
        text = _call_llm(selected, person, start, end, key)
        intro, claims = _parse_llm_claims(text, {r.id for r in selected})
    except Exception:
        return None
    if not claims:
        return None
    return intro, claims


# ---------------------------------------------------------------- public

def build_draft(results: list[CandidateResult], person: str, start: date, end: date,
                use_llm: bool = False) -> Draft:
    selected = [r for r in results if r.selected]
    by_id = {r.id: r for r in selected}
    mode = "template"
    intro = _template_intro(selected, person, start, end)
    claims: list[DraftClaim] = [_template_claim(r) for r in selected]

    if use_llm:
        llm = _try_llm(selected, person, start, end)
        if llm is not None:
            llm_intro, llm_claims = llm
            intro = llm_intro or intro
            claims = llm_claims
            mode = "llm"

    markdown = _render_markdown(person, start, end, intro, claims, by_id)
    return Draft(person=person, period_start=start, period_end=end, intro=intro,
                 claims=claims, markdown=markdown, mode=mode)
