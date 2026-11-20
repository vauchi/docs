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

    def page(self, body, name="topic", markdown="# Public chapter\n"):
        (self.root / f"src/{name}.md").write_text(markdown)
        destination = self.root / f"book/{name}.html"
        destination.write_text(
            '<html><head><title>Public chapter</title>'
            '<meta name="description" content="Curated book overview.">'
            f'</head><body>{body}</body></html>'
        )
        return destination

    def run_build(self):
        return subprocess.run(
            [sys.executable, str(SCRIPT), str(self.root)],
            capture_output=True, text=True,
        )

    def build(self):
        result = self.run_build()
        self.assertEqual(result.returncode, 0, result.stderr)

    def require_snippet_length(self):
        with (self.root / "book.toml").open("a") as config:
            config.write("[output.html.vauchi-discovery]\ndescription-length = [120, 160]\n")

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

    def test_version_prefixed_prose_is_not_a_metadata_only_paragraph(self):
        page = self.page(
            '<main><p>Last Updated: November 8, 2026</p>'
            '<p>Version 1.1 — 2026-11-01</p>'
            '<p>Version 2 keeps contact notes on your devices.</p>'
            '<p>Later details.</p></main>'
        )
        self.build()
        self.assert_descriptions(page, 'Version 2 keeps contact notes on your devices.')

    def test_an_authored_description_comment_wins_everywhere_the_page_is_described(self):
        authored = "Authored summary of this chapter."
        page = self.page(
            "<main><h1>Chapter</h1><p>First paragraph prose.</p></main>",
            markdown=f"<!-- description: {authored} -->\n# Public chapter\n\nFirst paragraph prose.\n",
        )
        self.build()
        self.assert_descriptions(page, authored)
        self.assertIn(f'"description": "{authored}"', page.read_text())

    def test_a_multi_line_authored_description_reads_as_one_line(self):
        page = self.page(
            "<main><p>Prose.</p></main>",
            markdown="<!--\n  description: Spread over\n  two lines.\n-->\n# Chapter\n",
        )
        self.build()
        self.assert_descriptions(page, "Spread over two lines.")

    def test_the_book_root_takes_its_authored_description_over_the_book_one(self):
        page = self.page(
            "<main><h1>Reference</h1></main>", "index",
            markdown="<!-- description: Root page summary. -->\n# Reference\n",
        )
        self.build()
        self.assert_descriptions(page, "Root page summary.")

    def test_a_book_that_asks_for_snippet_length_fails_on_each_page_outside_it(self):
        self.require_snippet_length()
        self.page("<main><p>Too short.</p></main>", "short")
        self.page("<main><p>" + "Far too long. " * 14 + "</p></main>", "long")
        self.page("<main><p>" + "x" * 140 + "</p></main>", "fits")
        result = self.run_build()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("short.html: description is 10 characters", result.stderr)
        self.assertIn("long.html: description is 195 characters", result.stderr)
        self.assertNotIn("fits.html", result.stderr)

    def test_a_book_that_asks_for_snippet_length_builds_when_every_page_fits(self):
        self.require_snippet_length()
        authored = "y" * 120
        page = self.page("<main><p>Short.</p></main>", markdown=f"<!-- description: {authored} -->\n# C\n")
        index = self.page("<main><h1>Reference</h1></main>", "index", markdown=f"<!-- description: {'z' * 160} -->\n# R\n")
        self.build()
        self.assert_descriptions(page, authored)
        self.assert_descriptions(index, "z" * 160)

    def test_an_included_fragment_cannot_lend_the_page_its_description(self):
        (self.root / "src/fragment.md").write_text("<!-- description: Belongs to the fragment, not the page. -->\nShared text.\n")
        page = self.page(
            "<main><h1>Chapter</h1><p>The page's own first paragraph.</p></main>",
            markdown="# Public chapter\n\n{{#include fragment.md}}\n",
        )
        self.build()
        self.assert_descriptions(page, "The page's own first paragraph.")

    def test_a_description_shown_in_a_code_example_is_not_the_pages(self):
        page = self.page(
            "<main><h1>Chapter</h1><p>How to describe a page.</p></main>",
            markdown="# Public chapter\n\n```markdown\n<!-- description: Only an example. -->\n```\n",
        )
        self.build()
        self.assert_descriptions(page, "How to describe a page.")
