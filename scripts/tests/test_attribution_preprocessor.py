# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
# SPDX-License-Identifier: GPL-3.0-or-later

import json
import subprocess
import sys
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "editorial.py"


class AttributionPreprocessorTests(unittest.TestCase):
    def run_book(self, content):
        chapter = {"name": "Article", "content": content, "source_path": "article.md", "sub_items": []}
        payload = [{"renderer": "html"}, {"sections": [{"Chapter": chapter}]}]
        return subprocess.run([sys.executable, str(SCRIPT)], input=json.dumps(payload),
                              capture_output=True, text=True)

    def test_disclosure_follows_real_title_before_article_prose(self):
        for prefix in ["", "```markdown\n# Literal example\n```\n\n", "<!--\n# Comment\n-->\n\n"]:
            with self.subTest(prefix=prefix):
                result = self.run_book(prefix + "# Actual title\n\nOriginal first paragraph.\n")
                self.assertEqual(result.returncode, 0, result.stderr)
                content = json.loads(result.stdout)["sections"][0]["Chapter"]["content"]
                self.assertTrue(content.startswith(prefix + "# Actual title\n"))
                self.assertLess(content.index("# Actual title"), content.index('<aside'))
                self.assertLess(content.index('</aside>'), content.index("Original first paragraph."))
                self.assertEqual(content.count("Drafted with AI assistance."), 1)
                self.assertTrue(content.endswith("Original first paragraph.\n"))

    def test_missing_title_fails_without_emitting_a_partially_changed_book(self):
        result = self.run_book("Original prose without a heading.")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")
        self.assertIn("chapter needs an H1", result.stderr)

    def test_renderer_support_is_explicit(self):
        supported = subprocess.run([sys.executable, str(SCRIPT), "supports", "html"])
        unsupported = subprocess.run([sys.executable, str(SCRIPT), "supports", "markdown"])
        self.assertEqual(supported.returncode, 0)
        self.assertEqual(unsupported.returncode, 1)
