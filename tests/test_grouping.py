import unittest
from datetime import date

from letopis.grouping import group_items
from letopis.importer import load_demo
from letopis.models import WorkItem

START, END = date(2026, 4, 1), date(2026, 9, 30)


def J(id, title, typ="Task", d=date(2026, 5, 10), epic="", labels=(), desc=""):
    return WorkItem(id=id, source="jira", title=title, url=f"https://j/{id}", closed_at=d,
                    item_type=typ, epic=epic, labels=list(labels), description=desc)


def M(iid, linked, d=date(2026, 5, 11)):
    return WorkItem(id=f"!{iid}", source="gitlab", title="mr", url=f"https://g/{iid}", closed_at=d,
                    item_type="MR", linked_ids=list(linked))


class GroupingTests(unittest.TestCase):
    def test_demo_range_and_order(self):
        res = group_items(load_demo(), START, END)
        self.assertTrue(10 <= len(res) <= 16, len(res))
        self.assertEqual([r.id for r in res], [f"R{i}" for i in range(1, len(res) + 1)])
        self.assertTrue(res[-1].title.startswith("Поддержка и исправления"))
        body = [r.score for r in res[:-1]]
        self.assertEqual(body, sorted(body, reverse=True))
        self.assertTrue(all(r.summary for r in res))

    def test_period_filter(self):
        items = [J("A-1", "в периоде", "Story", epic="E-1"),
                 J("A-2", "до периода", "Story", d=date(2026, 3, 1), epic="E-1"),
                 J("A-3", "без даты", "Story", d=None, epic="E-1")]
        res = group_items(items, START, END)
        ids = {i.id for r in res for i in r.items}
        self.assertEqual(ids, {"A-1"})

    def test_epic_group_with_name_and_mr_link(self):
        items = [
            J("E-1", "Ускорение API", "Epic", d=None),
            J("A-1", "один", "Story", epic="E-1"), J("A-2", "два", epic="E-1"),
            M(1, ["A-2"]), M(2, ["ZZ-9"]),
        ]
        res = group_items(items, START, END)
        epic = next(r for r in res if r.title == "Ускорение API")
        self.assertEqual({i.id for i in epic.items}, {"A-1", "A-2", "!1"})
        tail = res[-1]
        self.assertIn("!2", {i.id for i in tail.items})

    def test_label_group_single_story_and_tail(self):
        items = [J(f"L-{n}", f"label {n}", labels=["sec"]) for n in range(3)]
        items.append(J("S-1", "Большая фича", "Story", labels=["unique"]))
        items += [J(f"B-{n}", f"bug {n}", "Bug", labels=["bugfix"]) for n in range(5)]
        res = group_items(items, START, END)
        titles = [r.title for r in res]
        self.assertTrue(any("sec" in t for t in titles))
        self.assertIn("Большая фича", titles)
        self.assertEqual(len(res), 3)
        self.assertEqual(len(res[-1].items), 5)

    def test_effect_hint_in_summary(self):
        items = [J("A-1", "Кеш", "Story", epic="E-1", desc="Ускорили: p95 с 800 до 450 мс. Прочее.")]
        res = group_items(items, START, END)
        self.assertIn("450 мс", res[0].summary)


if __name__ == "__main__":
    unittest.main()
