import os
import tempfile
import unittest
from datetime import date

from letopis.grouping import group_items
from letopis.importer import load_demo
from letopis.store import load_results, save_results

START, END = date(2026, 4, 1), date(2026, 9, 30)


class StoreTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = os.path.join(self.tmp.name, "t.db")

    def tearDown(self):
        self.tmp.cleanup()

    def test_missing_returns_none(self):
        self.assertIsNone(load_results("Иван Петров", START, END, db_path=self.db))

    def test_round_trip(self):
        res = group_items(load_demo(), START, END)
        res[0].selected = True
        res[0].effect = "p95 API −40%"
        res[0].extra_links = ["https://grafana.example.com/d/1"]
        save_results("Иван Петров", START, END, res, db_path=self.db)
        back = load_results("Иван Петров", START, END, db_path=self.db)
        self.assertEqual(back, res)
        self.assertTrue(back[0].is_confirmed)
        self.assertIsNone(load_results("Другой", START, END, db_path=self.db))

    def test_overwrite(self):
        res = group_items(load_demo(), START, END)
        save_results("Иван", START, END, res, db_path=self.db)
        save_results("Иван", START, END, res[:2], db_path=self.db)
        self.assertEqual(len(load_results("Иван", START, END, db_path=self.db)), 2)


if __name__ == "__main__":
    unittest.main()
