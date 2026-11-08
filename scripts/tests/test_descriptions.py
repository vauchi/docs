# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
# SPDX-License-Identifier: GPL-3.0-or-later

import subprocess
import sys
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "build-discovery.py"
KEYS = ("description", "og:description", "twitter:description")


class Metadata(HTMLParser):
    def __init__(self, document):
        super().__init__()
        self.values = {key: [] for key in KEYS}
        self.head = False
        self.head_images = 0
        self.feed(document)

    def handle_starttag(self, tag, attrs):
        if tag == "head":
            self.head = True
        if self.head and tag == "img":
            self.head_images += 1
        if tag == "meta":
            attrs = dict(attrs)
            key = attrs.get("name", attrs.get("property"))
            if key in self.values:
                self.values[key].append(attrs.get("content"))

    def handle_endtag(self, tag):
        if tag == "head":
            self.head = False


class DescriptionTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        (self.root / "src").mkdir()
        (self.root / "book").mkdir()
        (self.root / "book.toml").write_text(
            '[book]\ntitle="Reference"\ndescription="Curated book overview."\n'
            '[output.html]\nsite-url="/reference/"\n'
        )

    def page(self, body, name="topic"):
        (self.root / f"src/{name}.md").write_text("# Public chapter\n")
        destination = self.root / f"book/{name}.html"
        destination.write_text(
            '<html><head><title>Public chapter</title>'
            '<meta name="description" content="Curated book overview.">'
            f'</head><body>{body}</body></html>'
        )
        return destination

    def build(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT), str(self.root)],
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def assert_descriptions(self, path, expected):
        metadata = Metadata(path.read_text())
        self.assertEqual(metadata.values, {key: [expected] for key in KEYS})
        self.assertEqual(metadata.head_images, 0)

    def test_summary_uses_authored_main_prose_and_skips_notices(self):
        page = self.page(
            '<nav><p>Navigation noise.</p></nav><main><h1>Chapter</h1>'
            '<blockquote><p>Status: draft.</p></blockquote>'
            '<div class="admonition warning"><p>Notice only.</p></div>'
            '<p><strong>Last Updated:</strong> November 2026</p>'
            '<p>Version 1.1 — November 2026</p>'
            '<p>Exchange <em>signed cards</em> &amp; keep labels private. '
            'This does not hide connection timing.</p>'
            '<p>Later chapter details.</p></main>'
        )
        self.build()
        self.assert_descriptions(
            page, 'Exchange signed cards & keep labels private. '
            'This does not hide connection timing.',
        )

    def test_no_suitable_paragraph_uses_the_curated_book_description(self):
        page = self.page(
            '<main><h1>Chapter</h1><p>Last Updated: November 2026</p>'
            '<table><tr><td><p>Table text.</p></td></tr></table>'
            '<pre>Example text.</pre><blockquote><p>Draft.</p></blockquote></main>'
        )
        self.build()
        self.assert_descriptions(page, 'Curated book overview.')

    def test_book_root_keeps_its_curated_overview_instead_of_a_slogan(self):
        page = self.page('<main><h1>Reference</h1><p>A short slogan.</p></main>', 'index')
        self.build()
        self.assert_descriptions(page, 'Curated book overview.')

    def test_regeneration_retains_one_description_per_surface(self):
        page = self.page('<main><h1>Chapter</h1><p>Understand contact updates.</p></main>')
        self.build()
        self.build()
        self.assert_descriptions(page, 'Understand contact updates.')

    def test_inline_entities_cannot_create_head_markup(self):
        page = self.page(
            '<main><h1>Chapter</h1><p>A &quot;quoted&quot; '
            '&lt;img src=x onerror=alert(1)&gt; &amp; concise guide.</p></main>'
        )
        self.build()
        self.assert_descriptions(
            page, 'A "quoted" <img src=x onerror=alert(1)> & concise guide.',
        )

    def test_boolean_attributes_and_line_breaks_preserve_readable_unicode(self):
        page = self.page('<main><div class><p>Échange<br>cards with cafés.</p></div></main>')
        self.build()
        self.assert_descriptions(page, 'Échange cards with cafés.')
