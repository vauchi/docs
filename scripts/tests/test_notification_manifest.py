# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
# SPDX-License-Identifier: GPL-3.0-or-later

import hashlib
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from xml.etree import ElementTree

SCRIPT = Path(__file__).resolve().parents[1] / "build-discovery.py"
SHA = "a" * 40


class NotificationManifestTests(unittest.TestCase):
    def test_manifest_tracks_final_html_inventory_and_is_reproducible(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "src").mkdir()
            (root / "book").mkdir()
            (root / "book.toml").write_text(
                '[book]\ntitle="Test"\n[output.html]\nsite-url="/docs/"\n'
            )
            for name in ("index", "topic"):
                (root / "src" / (name + ".md")).write_text("# Test\n")
                (root / "book" / (name + ".html")).write_text(
                    "<html><head><title>Test</title></head>"
                    "<body><main><h1>Test</h1><p>Public text.</p></main></body></html>"
                )
            (root / "book/print.html").write_text("<head></head>")

            def generate(sha=SHA):
                result = subprocess.run(
                    [sys.executable, str(SCRIPT), str(root)],
                    env={**os.environ, "CI_COMMIT_SHA": sha},
                    capture_output=True, text=True,
                )
                self.assertEqual(result.returncode, 0, result.stderr)
                return json.loads((root / "book/indexnow-manifest.json").read_text())

            first = generate()
            self.assertEqual(set(first), {"version", "source_sha", "page_count", "pages"})
            self.assertEqual(first["version"], 1)
            self.assertEqual(first["source_sha"], SHA)
            self.assertEqual(first["page_count"], 2)
            locations = [el.text for el in ElementTree.parse(
                root / "book/sitemap.xml").findall(".//{*}loc")]
            self.assertEqual(set(first["pages"]), set(locations))
            self.assertEqual(first["pages"]["https://vauchi.app/docs/topic.html"],
                             hashlib.sha256((root / "book/topic.html").read_bytes()).hexdigest())
            (root / "book/build-info.json").write_text('{"built":"different timestamp"}')
            self.assertEqual(generate(), first)
            self.assertEqual(generate("b" * 40)["pages"], first["pages"])
            page = root / "book/topic.html"
            page.write_text(page.read_text().replace("<title>Test", "<title>Updated"))
            edited = generate()
            self.assertNotEqual(edited["pages"]["https://vauchi.app/docs/topic.html"],
                                first["pages"]["https://vauchi.app/docs/topic.html"])
            self.assertEqual(edited["pages"]["https://vauchi.app/docs/"],
                             first["pages"]["https://vauchi.app/docs/"])
            result = subprocess.run(
                [sys.executable, str(SCRIPT), str(root)],
                env={**os.environ, "CI_COMMIT_SHA": "bad"}, capture_output=True, text=True,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("source SHA", result.stderr)


if __name__ == "__main__":
    unittest.main()
