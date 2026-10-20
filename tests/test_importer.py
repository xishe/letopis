import io
import unittest
from datetime import date

from letopis.importer import load_demo, load_gitlab_csv, load_jira_csv, parse_date


class ParseDateTests(unittest.TestCase):
    def test_formats(self):
        self.assertEqual(parse_date("12/Mar/26 3:45 PM"), date(2026, 3, 12))
        self.assertEqual(parse_date("12.03.2026 15:45"), date(2026, 3, 12))
        self.assertEqual(parse_date("2026-05-03T10:15:00.000Z"), date(2026, 5, 3))
        self.assertEqual(parse_date("2026-05-03"), date(2026, 5, 3))

    def test_garbage_gives_none(self):
        for s in ("", None, "вчера", "31.02.2026", "12/Xyz/26"):
            self.assertIsNone(parse_date(s))


class DemoTests(unittest.TestCase):
    def test_demo_loads(self):
        items = load_demo()
        jira = [i for i in items if i.source == "jira"]
        mrs = [i for i in items if i.source == "gitlab"]
        self.assertGreater(len(jira), 150)
        self.assertTrue(40 <= len(mrs) <= 70)
        self.assertTrue(all(i.id.startswith("!") and i.item_type == "MR" for i in mrs))
        self.assertTrue(any(i.closed_at is None for i in jira))
        self.assertTrue(any(i.linked_ids for i in mrs))
        self.assertTrue(all(i.url.startswith("https://") for i in items))


JIRA_CP1251 = (
    "Issue key;Summary;Issue Type;Status;Resolved;Assignee;Labels;Custom field (Epic Link);Description\n"
    "LET-1;Починить кеш;Story;Done;12/Mar/26 3:45 PM;Иван;perf catalog;LET-100;p95 с 800 до 450 мс\n"
    "LET-2;Мелочь;Bug;Done;12.03.2026 15:45;Иван;;;\n"
    "LET-3;Не закрыта;Task;Open;;Иван;;;\n"
    "LET-4;Кривая дата;Task;Done;не дата;Иван;a,b;;\n"
)

GITLAB_CP1251 = (
    "MR IID;Title;Description;URL;State;Author;Merged At;Source Branch;Labels\n"
    "45;LET-1 Кеш выдачи;;https://gitlab.example.com/x/-/merge_requests/45;merged;Иван;2026-03-12T10:00:00Z;feature/LET-2-cache;backend\n"
    "46;Черновик;;https://gitlab.example.com/x/-/merge_requests/46;closed;Иван;;feature/LET-3-x;\n"
    "47;Без связей;;https://gitlab.example.com/x/-/merge_requests/47;opened;Иван;;main;\n"
)


class CustomFileTests(unittest.TestCase):
    def test_jira_cp1251_semicolon(self):
        items = load_jira_csv(JIRA_CP1251.encode("cp1251"))
        self.assertEqual([i.id for i in items], ["LET-1", "LET-2", "LET-3", "LET-4"])
        self.assertEqual(items[0].title, "Починить кеш")
        self.assertEqual(items[0].closed_at, date(2026, 3, 12))
        self.assertEqual(items[1].closed_at, date(2026, 3, 12))
        self.assertIsNone(items[2].closed_at)
        self.assertIsNone(items[3].closed_at)  # ошибка разбора не падает
        self.assertEqual(items[0].epic, "LET-100")
        self.assertEqual(items[0].labels, ["perf", "catalog"])
        self.assertEqual(items[3].labels, ["a", "b"])
        self.assertTrue(items[0].url.endswith("/browse/LET-1"))

    def test_utf8_bom_comma_file_object(self):
        text = "﻿Key,Summary,Issue Type,Status,Resolved\nLET-9,Тест,Task,Done,2026-04-05\n"
        items = load_jira_csv(io.BytesIO(text.encode("utf-8")))
        self.assertEqual(items[0].id, "LET-9")
        self.assertEqual(items[0].closed_at, date(2026, 4, 5))

    def test_russian_headers(self):
        text = "Ключ задачи;Тема;Тип задачи;Статус;Дата решения;Метки\nLET-5;Задача;Story;Готово;05.04.2026 10:00;x y\n"
        items = load_jira_csv(text.encode("cp1251"))
        self.assertEqual(items[0].title, "Задача")
        self.assertEqual(items[0].item_type, "Story")
        self.assertEqual(items[0].closed_at, date(2026, 4, 5))
        self.assertEqual(items[0].labels, ["x", "y"])

    def test_gitlab_only_merged_and_links(self):
        items = load_gitlab_csv(GITLAB_CP1251.encode("cp1251"))
        self.assertEqual(len(items), 1)
        mr = items[0]
        self.assertEqual(mr.id, "!45")
        self.assertEqual(mr.item_type, "MR")
        self.assertEqual(mr.linked_ids, ["LET-1", "LET-2"])
        self.assertEqual(mr.closed_at, date(2026, 3, 12))

    def test_path_input(self):
        import tempfile, os
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "j.csv")
            with open(p, "wb") as f:
                f.write(JIRA_CP1251.encode("cp1251"))
            self.assertEqual(len(load_jira_csv(p)), 4)


if __name__ == "__main__":
    unittest.main()
