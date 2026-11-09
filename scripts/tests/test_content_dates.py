# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
# SPDX-License-Identifier: GPL-3.0-or-later

import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from page_schema import content_date


class ContentDateTests(unittest.TestCase):
    def test_included_content_uses_latest_verified_source_and_omits_dirty_history(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "src"
            source.mkdir()

            def git(*args, timestamp=None):
                environment = dict(os.environ)
                if timestamp:
                    environment.update(GIT_AUTHOR_DATE=timestamp, GIT_COMMITTER_DATE=timestamp)
                return subprocess.run(["git", "-C", str(root), *args], env=environment,
                                      check=True, capture_output=True, text=True)

            git("init", "-q")
            git("config", "user.name", "Fixture")
            git("config", "user.email", "fixture@example.test")
            chapter = source / "chapter.md"
            chapter.write_text("# Vectors\n\n{{#include data.json}}")
            included = source / "data.json"
            included.write_text('{"version":1}')
            git("add", "src")
            git("commit", "-qm", "Original", timestamp="2026-01-02T10:00:00+00:00")
            included.write_text('{"version":2}')
            git("add", "src/data.json")
            git("commit", "-qm", "Vectors", timestamp="2026-02-03T10:00:00+00:00")
            self.assertEqual(content_date(root, chapter, source), "2026-02-03T10:00:00+00:00")
            (root / "unrelated.txt").write_text("No freshness change")
            git("add", "unrelated.txt")
            git("commit", "-qm", "Unrelated", timestamp="2026-03-04T10:00:00+00:00")
            self.assertEqual(content_date(root, chapter, source), "2026-02-03T10:00:00+00:00")
            included.write_text('{"version":3}')
            self.assertIsNone(content_date(root, chapter, source))
            with self.assertRaisesRegex(ValueError, "invalid public source include"):
                content_date(root, root / "unrelated.txt", source)
