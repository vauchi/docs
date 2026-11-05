# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
# SPDX-License-Identifier: GPL-3.0-or-later

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from xml.etree import ElementTree


SCRIPT = Path(__file__).resolve().parents[1] / "build-discovery.py"


class DiscoveryTests(unittest.TestCase):
    def test_build_publishes_canonical_markdown_and_scoped_discovery(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "src/guide").mkdir(parents=True)
            (root / "book/guide").mkdir(parents=True)
            (root / "book.toml").write_text(
                '[book]\ntitle="Vauchi Reference"\ndescription="Public reference"\n'
                '[output.html]\nsite-url="/reference/"\n'
            )
            (root / "src/index.md").write_text('# Reference\n\nPublic overview.\n')
            (root / "src/guide/topic.md").write_text('# Topic\n\n{{#include data.json}}\n')
            (root / "src/guide/data.json").write_text('{"example": 1}')
            for path in ("index.html", "guide/topic.html", "toc.html", "print.html", "404.html"):
                (root / "book" / path).write_text(
                    '<html><head><title>Topic &amp; Reference</title></head>'
                    '<body><main><h1>Topic</h1><p>Readable reference.</p></main></body></html>'
                )
            result = subprocess.run([sys.executable, str(SCRIPT), str(root)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            page = (root / "book/guide/topic.html").read_text()
            self.assertIn('rel="canonical" href="https://vauchi.app/reference/guide/topic.html"', page)
            self.assertIn('property="og:title" content="Topic &amp; Reference"', page)
            self.assertIn('name="twitter:card" content="summary_large_image"', page)
            self.assertIn('rel="alternate" type="text/markdown"', page)
            self.assertIn('https://vauchi.app/reference/guide/topic.md', page)
            self.assertIn('rel="describedby" href="https://vauchi.app/reference/llms.txt"', page)
            self.assertEqual((root / "book/guide/topic.md").read_text(), '# Topic\n\n{"example": 1}\n')
            llms = (root / "book/llms.txt").read_text()
            self.assertTrue(llms.startswith('# Vauchi Reference\n'))
            self.assertIn('[Topic & Reference](https://vauchi.app/reference/guide/topic.md)', llms)
            xml = ElementTree.parse(root / "book/sitemap.xml")
            locations = [el.text for el in xml.findall('.//{*}loc')]
            self.assertEqual(locations, ['https://vauchi.app/reference/guide/topic.html', 'https://vauchi.app/reference/'])
            self.assertIn('name="robots" content="noindex"', (root / "book/toc.html").read_text())

    def test_include_cannot_publish_files_outside_public_source(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "src").mkdir()
            (root / "book").mkdir()
            (root / "book.toml").write_text('[book]\ntitle="Test"\n[output.html]\nsite-url="/test/"\n')
            (root / "secret.txt").write_text('private-value')
            (root / "src/index.md").write_text('{{#include ../secret.txt}}')
            (root / "book/index.html").write_text('<html><head><title>Test</title></head><body><h1>Test</h1></body></html>')
            result = subprocess.run([sys.executable, str(SCRIPT), str(root)], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('outside public source', result.stderr)
            self.assertFalse((root / "book/index.md").exists())


if __name__ == "__main__":
    unittest.main()
