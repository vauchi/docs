# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
# SPDX-License-Identifier: GPL-3.0-or-later

import json
import subprocess
import sys
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "build-discovery.py"


class Schema(HTMLParser):
    def __init__(self, document):
        super().__init__()
        self.blocks = []
        self.active = False
        self.feed(document)

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            self.active = dict(attrs).get("type") == "application/ld+json"
            if self.active:
                self.blocks.append("")

    def handle_endtag(self, tag):
        if tag == "script":
            self.active = False

    def handle_data(self, data):
        if self.active:
            self.blocks[-1] += data


class PageSchemaTests(unittest.TestCase):
    def test_book_schema_uses_visible_heading_and_leaves_body_untouched(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "src/legal").mkdir(parents=True)
            (root / "book/legal").mkdir(parents=True)
            (root / "book.toml").write_text(
                '[book]\ntitle="Reference"\ndescription="Overview"\n'
                '[output.html]\nsite-url="/docs/"\n'
            )
            for relative in ("index", "topic", "legal/privacy"):
                (root / f"src/{relative}.md").write_text("# A title\n\nSource text.")
                body = '<body><main><h1>A &lt;/script&gt; &amp; café title</h1><p>Actual description.</p></main></body></html>'
                page = root / f"book/{relative}.html"
                page.write_text('<html><head><title>Title — Reference</title></head>' + body)
                result = subprocess.run([sys.executable, str(SCRIPT), str(root)], capture_output=True, text=True)
                self.assertEqual(result.returncode, 0, result.stderr)
                document = page.read_text()
                self.assertEqual(document[document.index('<body>'):], body)
                blocks = Schema(document).blocks
                self.assertEqual(len(blocks), 1)
                schema = json.loads(blocks[0])
                self.assertEqual(schema["@type"], "WebPage" if relative.startswith("legal/") else "TechArticle")
                self.assertEqual(schema["headline"], "A </script> & café title")
                self.assertEqual(schema["description"], "Overview" if relative == "index" else "Actual description.")
                self.assertEqual(schema["author"], {"@id": "https://vauchi.app/#organization"})
                self.assertEqual(schema["publisher"], schema["author"])
                self.assertNotIn("dateModified", schema)
                self.assertNotIn("<", blocks[0])
                again = subprocess.run([sys.executable, str(SCRIPT), str(root)], capture_output=True, text=True)
                self.assertEqual(again.returncode, 0, again.stderr)
                self.assertEqual(page.read_text(), document)
