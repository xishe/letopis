import json
import os
import unittest
from datetime import date
from unittest import mock

from letopis.draft import _parse_llm_claims, build_draft
from letopis.models import CandidateResult, WorkItem

START, END = date(2026, 4, 1), date(2026, 9, 30)


def _item(i, source="jira", url=None):
    return WorkItem(id=i, source=source, title=f"Задача {i}",
                    url=url if url is not None else f"https://example.com/{i}",
                    closed_at=date(2026, 5, 1))


def _results():
    return [
        CandidateResult(id="R1", title="Ускорение API", summary="Оптимизировали запросы. Добавили индекс.",
                        items=[_item("LET-1"), _item("!2", "gitlab")], score=9, selected=True,
                        effect="p95 с 800 до 450 мс", extra_links=["https://dash.example.com/p95"]),
        CandidateResult(id="R2", title="Миграция БД", summary="Перенесли данные.",
                        items=[_item("LET-3")], score=5, selected=True),
        CandidateResult(id="R3", title="Мелкие правки", summary="Багфиксы.",
                        items=[_item("LET-4")], score=1, selected=False),
    ]


class DraftTemplateTest(unittest.TestCase):
    def setUp(self):
        self._env = mock.patch.dict(os.environ, {}, clear=False)
        self._env.start()
        os.environ.pop("ANTHROPIC_API_KEY", None)

    def tearDown(self):
        self._env.stop()

    def test_only_selected(self):
        d = build_draft(_results(), "Иван Петров", START, END)
        self.assertEqual(len(d.claims), 2)
        self.assertNotIn("Мелкие правки", d.markdown)
        self.assertIn("Иван Петров", d.intro)

    def test_claims_reference_selected_ids(self):
        d = build_draft(_results(), "Иван", START, END)
        for c in d.claims:
            self.assertTrue(c.result_ids)
            for rid in c.result_ids:
                self.assertIn(rid, {"R1", "R2"})

    def test_markdown_has_footnotes_and_sources(self):
        d = build_draft(_results(), "Иван", START, END)
        self.assertIn("[1]", d.markdown)
        self.assertIn("[2]", d.markdown)
        self.assertIn("## Источники", d.markdown)
        self.assertIn("[LET-1](https://example.com/LET-1)", d.markdown)
        self.assertIn("https://dash.example.com/p95", d.markdown)
        self.assertIn("Эффект: p95 с 800 до 450 мс.", d.markdown)
        self.assertIn("⚠ эффект не указан", d.markdown)

    def test_no_selected(self):
        rs = _results()
        for r in rs:
            r.selected = False
        d = build_draft(rs, "Иван", START, END)
        self.assertEqual(d.claims, [])
        self.assertTrue(d.intro)
        self.assertEqual(d.mode, "template")
        self.assertEqual(build_draft([], "Иван", START, END).claims, [])

    def test_llm_without_key_falls_back(self):
        d = build_draft(_results(), "Иван", START, END, use_llm=True)
        self.assertEqual(d.mode, "template")
        self.assertEqual(len(d.claims), 2)

    def test_llm_network_error_falls_back(self):
        with mock.patch.dict(os.environ, {"ANTHROPIC_API_KEY": "x"}), \
                mock.patch("letopis.draft.urllib.request.urlopen", side_effect=OSError("down")):
            d = build_draft(_results(), "Иван", START, END, use_llm=True)
        self.assertEqual(d.mode, "template")

    def test_llm_success(self):
        payload = {"intro": "Вступление", "claims": [{"text": "Сделал X", "result_ids": ["R1"]}]}
        body = json.dumps({"content": [{"type": "text", "text": json.dumps(payload)}]}).encode()
        resp = mock.MagicMock()
        resp.__enter__.return_value.read.return_value = body
        with mock.patch.dict(os.environ, {"ANTHROPIC_API_KEY": "x"}), \
                mock.patch("letopis.draft.urllib.request.urlopen", return_value=resp):
            d = build_draft(_results(), "Иван", START, END, use_llm=True)
        self.assertEqual(d.mode, "llm")
        self.assertEqual(d.intro, "Вступление")
        self.assertIn("## Источники", d.markdown)


class ParseLlmTest(unittest.TestCase):
    def test_filters_invalid_ids(self):
        text = "Вот ответ:\n" + json.dumps({
            "intro": "Привет",
            "claims": [
                {"text": "ок", "result_ids": ["R1"]},
                {"text": "чужой id", "result_ids": ["R9"]},
                {"text": "смесь", "result_ids": ["R1", "R9"]},
                {"text": "без ссылок", "result_ids": []},
                {"text": "", "result_ids": ["R1"]},
                {"text": "нет поля"},
                "строка",
            ]})
        intro, claims = _parse_llm_claims(text, {"R1", "R2"})
        self.assertEqual(intro, "Привет")
        self.assertEqual([c.text for c in claims], ["ок"])

    def test_garbage(self):
        for t in ["", "не json", "{bad json}", "[1,2]", None, '{"claims": "x"}']:
            self.assertEqual(_parse_llm_claims(t, {"R1"})[1], [])


if __name__ == "__main__":
    unittest.main()
