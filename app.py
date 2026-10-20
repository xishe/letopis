"""Летопись: Streamlit-интерфейс (4 шага)."""
from __future__ import annotations

import os
import re
import time
from datetime import date

import streamlit as st

from letopis.draft import build_draft
from letopis.grouping import group_items
from letopis.importer import load_demo, load_gitlab_csv, load_jira_csv
from letopis.models import CandidateResult
from letopis.store import save_results

st.set_page_config(page_title="Летопись", layout="wide")

STEPS = ["1. Загрузка", "2. Результаты", "3. Подтверждение", "4. Черновик"]
TAIL_PREFIX = "Поддержка и исправления"
WIDGET_PREFIXES = ("sel_", "eff_", "lnk_")


# ------------------------------------------------------------------ состояние

def _ss():
    return st.session_state


def _results() -> list[CandidateResult]:
    return _ss().get("results") or []


def _by_id() -> dict[str, CandidateResult]:
    return {r.id: r for r in _results()}


def _is_tail(r: CandidateResult) -> bool:
    return r.title.startswith(TAIL_PREFIX)


def _reset_widgets():
    for k in list(_ss().keys()):
        if isinstance(k, str) and k.startswith(WIDGET_PREFIXES):
            del _ss()[k]
    _ss().pop("draft", None)


def _on_select(rid: str):
    r = _by_id().get(rid)
    if r is not None:
        r.selected = bool(_ss().get(f"sel_{rid}", False))
    _ss().pop("draft", None)


def _on_effect(rid: str):
    r = _by_id().get(rid)
    if r is not None:
        r.effect = _ss().get(f"eff_{rid}", "").strip()
    _ss().pop("draft", None)


def _on_link(rid: str):
    r = _by_id().get(rid)
    if r is not None:
        raw = _ss().get(f"lnk_{rid}", "")
        r.extra_links = [x for x in re.split(r"[\s,;]+", raw) if x]
    _ss().pop("draft", None)


def _goto(step: str):
    # Переключаем шаг на следующем прогоне, до создания виджета навигации.
    _ss()["_goto"] = step


def _load(items, person, start, end):
    """Явная загрузка: группировка ровно один раз, сброс прежнего состояния."""
    results = group_items(items, start, end)
    for r in results:
        if _is_tail(r):
            r.selected = False
    _reset_widgets()
    _ss().update(items=items, results=results, person=person,
                 start=start, end=end, started_at=time.time(), saved=False)


# ------------------------------------------------------------------ шаги

def step_upload():
    st.subheader("Шаг 1. Загрузка данных")
    person = st.text_input("Сотрудник", value=_ss().get("person", "Иван Петров"), key="in_person")
    c1, c2 = st.columns(2)
    start = c1.date_input("Начало периода", value=_ss().get("start", date(2026, 4, 1)), key="in_start")
    end = c2.date_input("Конец периода", value=_ss().get("end", date(2026, 9, 30)), key="in_end")
    f1, f2 = st.columns(2)
    jira_file = f1.file_uploader("CSV из Jira", type=["csv"], key="up_jira")
    gl_file = f2.file_uploader("CSV из GitLab (merge requests)", type=["csv"], key="up_gl")

    b1, b2 = st.columns(2)
    if b1.button("Загрузить файлы и собрать кандидатов", disabled=not (jira_file or gl_file)):
        try:
            items = []
            if jira_file:
                items += load_jira_csv(jira_file)
            if gl_file:
                items += load_gitlab_csv(gl_file)
            _load(items, person, start, end)
            _goto(STEPS[1])
            st.rerun()
        except Exception as e:  # noqa: BLE001
            st.error(f"Не удалось разобрать файлы: {e}")
    if b2.button("Демо-данные"):
        try:
            _load(load_demo(), person, start, end)
            _goto(STEPS[1])
            st.rerun()
        except Exception as e:  # noqa: BLE001
            st.error(f"Не удалось загрузить демо-данные: {e}")

    if _ss().get("results") is not None:
        items = _ss()["items"]
        n_jira = sum(1 for i in items if i.source == "jira" and i.item_type != "Epic")
        n_mr = sum(1 for i in items if i.source == "gitlab")
        st.divider()
        m1, m2, m3 = st.columns(3)
        m1.metric("Задач Jira", n_jira)
        m2.metric("Merge requests", n_mr)
        m3.metric("Кандидатов в результаты", len(_results()))
        st.success(f"{n_jira} задач и {n_mr} MR → {len(_results())} кандидатов "
                   f"за период {_ss()['start']:%d.%m.%Y} — {_ss()['end']:%d.%m.%Y}.")
        st.caption("Повторная загрузка сбросит выбор и введённые эффекты.")


def _need_data() -> bool:
    if _ss().get("results") is None:
        st.info("Сначала загрузите данные на шаге «Загрузка».")
        return False
    return True


def _render_card(r: CandidateResult):
    n_jira = sum(1 for i in r.items if i.source == "jira")
    n_mr = sum(1 for i in r.items if i.source == "gitlab")
    with st.container(border=True):
        top = st.columns([6, 2])
        top[0].markdown(f"**{r.title}**")
        top[1].caption(f"{n_jira} задач, {n_mr} MR · score {r.score:.1f}")
        st.write(r.summary)
        st.checkbox("Включить в отчёт", value=r.selected, key=f"sel_{r.id}",
                    on_change=_on_select, args=(r.id,))
        with st.expander("Задачи и MR"):
            for it in r.items:
                label = f"[{it.id}]({it.url})" if it.url else it.id
                when = f" · {it.closed_at:%d.%m.%Y}" if it.closed_at else ""
                st.markdown(f"- {label} — {it.title}{when}")


def step_results():
    st.subheader("Шаг 2. Результаты")
    if not _need_data():
        return
    main = [r for r in _results() if not _is_tail(r)]
    tail = [r for r in _results() if _is_tail(r)]
    st.metric("Выбрано для отчёта", sum(1 for r in _results() if r.selected))
    for r in main:
        _render_card(r)
    if tail:
        st.markdown("##### Хвост")
        for r in tail:
            _render_card(r)
    st.button("Далее: подтверждение", on_click=_goto, args=(STEPS[2],))


def step_confirm():
    st.subheader("Шаг 3. Подтверждение")
    if not _need_data():
        return
    sel = [r for r in _results() if r.selected]
    if not sel:
        st.info("Не выбрано ни одного результата. Вернитесь на шаг «Результаты».")
        return
    confirmed = sum(1 for r in sel if r.is_confirmed)
    st.progress(confirmed / len(sel), text=f"С эффектом и подтверждением: {confirmed} из {len(sel)} "
                                           f"({round(100 * confirmed / len(sel))}%)")
    for r in sel:
        with st.container(border=True):
            st.markdown(f"**{r.id}. {r.title}**")
            st.caption(r.summary)
            c1, c2 = st.columns(2)
            c1.text_input("Эффект", value=r.effect, key=f"eff_{r.id}",
                          placeholder="p95 API с 800 до 450 мс", on_change=_on_effect, args=(r.id,))
            c2.text_input("Доп. ссылка-подтверждение (дашборд, отзыв)",
                          value=" ".join(r.extra_links), key=f"lnk_{r.id}",
                          placeholder="https://...", on_change=_on_link, args=(r.id,))
            # Значения берём из session_state, чтобы индикатор не отставал на один rerun.
            _on_effect(r.id)
            _on_link(r.id)
            if not r.effect.strip():
                st.warning("Не указан эффект.")
            elif not r.is_confirmed:
                st.warning("Нет ссылок-подтверждений.")
    if st.button("Сохранить"):
        try:
            save_results(_ss()["person"], _ss()["start"], _ss()["end"], _results())
            _ss()["saved"] = True
            st.success("Сохранено.")
        except Exception as e:  # noqa: BLE001
            st.error(f"Не удалось сохранить: {e}")
    st.button("Далее: черновик", on_click=_goto, args=(STEPS[3],))


def step_draft():
    st.subheader("Шаг 4. Черновик self-review")
    if not _need_data():
        return
    has_key = bool(os.environ.get("ANTHROPIC_API_KEY", "").strip())
    use_llm = st.toggle("Использовать LLM", value=False, disabled=not has_key, key="use_llm")
    if not has_key:
        st.caption("Ключ ANTHROPIC_API_KEY не задан — используется шаблонный генератор.")

    if st.button("Собрать self-review", type="primary"):
        _ss()["draft"] = build_draft(_results(), _ss()["person"], _ss()["start"], _ss()["end"],
                                     use_llm=use_llm and has_key)
        _ss()["draft_at"] = time.time()

    d = _ss().get("draft")
    if d is None:
        return
    by_id = _by_id()
    n = len(d.claims)
    confirmed = sum(1 for c in d.claims
                    if c.result_ids and all(by_id.get(x) and by_id[x].is_confirmed for x in c.result_ids))
    linked = all(c.result_ids and all(by_id.get(x) and by_id[x].evidence_links for x in c.result_ids)
                 for c in d.claims)
    minutes = (_ss().get("draft_at", time.time()) - _ss().get("started_at", time.time())) / 60
    m = st.columns(4)
    m[0].metric("Время подготовки", f"{minutes:.1f} мин")
    m[1].metric("Пунктов", n)
    m[2].metric("С подтверждённым эффектом", f"{round(100 * confirmed / n) if n else 0}%")
    m[3].metric("Все утверждения со ссылками", "да" if n and linked else "нет")
    st.caption(f"Режим: {'LLM' if d.mode == 'llm' else 'шаблон'}")
    st.markdown(d.markdown)
    st.download_button("Скачать .md", data=d.markdown.encode("utf-8"),
                       file_name="self-review.md", mime="text/markdown")


# ------------------------------------------------------------------ каркас

st.title("Летопись")
st.caption("Один раз зафиксировали результат — используйте во всех отчётах")

if "nav" not in st.session_state:
    st.session_state["nav"] = STEPS[0]
if "_goto" in st.session_state:
    st.session_state["nav"] = st.session_state.pop("_goto")
st.sidebar.radio("Шаги", STEPS, key="nav")

{STEPS[0]: step_upload, STEPS[1]: step_results,
 STEPS[2]: step_confirm, STEPS[3]: step_draft}[st.session_state["nav"]]()
