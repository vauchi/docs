# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
# SPDX-License-Identifier: GPL-3.0-or-later

import subprocess
import sys
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "build-discovery.py"


class HeadMetadata(HTMLParser):
    def __init__(self, document):
        super().__init__()
        self.in_head = False
        self.descriptions = []
        self.robots = []
        self.owned_blocks = 0
        self.feed(document)

    def handle_starttag(self, tag, attrs):
        if tag == "head":
            self.in_head = True
        if self.in_head and tag == "meta":
            attrs = dict(attrs)
            if attrs.get("name") == "description":
                self.descriptions.append(attrs.get("content"))
            if attrs.get("name") == "robots":
                self.robots.append(attrs.get("content"))

    def handle_endtag(self, tag):
        if tag == "head":
            self.in_head = False

    def handle_comment(self, data):
        if self.in_head and data.strip() == "vauchi-discovery:start":
            self.owned_blocks += 1


class HeadPreservationTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        (self.root / "src").mkdir()
        (self.root / "book").mkdir()
        (self.root / "book.toml").write_text(
            '[book]\ntitle="Reference"\ndescription="Curated overview."\n'
            '[output.html]\nsite-url="/reference/"\n'
        )

    def page(self, name="index", head="", body=None):
        (self.root / f"src/{name}.md").write_text("# Reference\n")
        if body is None:
            body = '<body><main><h1>Reference</h1><p>Published text.</p></main></body>'
        tail = (body + "\r\n</html>\r\n").encode()
        destination = self.root / f"book/{name}.html"
        destination.write_bytes(
            ('<!doctype html>\r\n<html><head>\r\n<title>Reference</title>\r\n'
             + head + '</head>\r\n').encode() + tail
        )
        return destination, tail

    def build(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT), str(self.root)], capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def assert_stable(self, page, body):
        self.build()
        first = page.read_bytes()
        self.assertTrue(first.endswith(body), "body bytes changed")
        self.assertEqual(first.count(body), 1)
        self.build()
        self.assertEqual(page.read_bytes(), first)
        return HeadMetadata(first.decode())

    def test_body_markers_metadata_and_crlf_survive(self):
        page, body = self.page(body=(
            '<body><main><h1>Référence</h1>\r\n'
            '<!-- vauchi-discovery:start -->\r\n'
            '<p>This visible paragraph must remain.</p>\r\n'
            '<!-- vauchi-discovery:end -->\r\n'
            '<code>&lt;!-- vauchi-discovery:end --&gt;</code>\r\n'
            '<meta name="description" content="Body example">\r\n'
            '<script>const closing = "</head>";</script>\r\n'
            '</main></body>'
        ))
        metadata = self.assert_stable(page, body)
        self.assertEqual(metadata.descriptions, ["Curated overview."])
        self.assertEqual(metadata.owned_blocks, 1)

    def test_head_script_with_literal_closing_tag_is_preserved(self):
        script = '<script>const closing = "</head>";</script>\r\n'
        page, body = self.page(head=script)
        metadata = self.assert_stable(page, body)
        self.assertIn(script.encode(), page.read_bytes())
        self.assertEqual(metadata.owned_blocks, 1)

    def test_head_script_markers_are_data_not_owned_comments(self):
        script = (
            '<script>const start = "<!-- vauchi-discovery:start -->";'
            'const end = "<!-- vauchi-discovery:end -->";'
            'const example = \'<meta name="description" content="sample">\';</script>\r\n'
        )
        page, body = self.page(head=script)
        metadata = self.assert_stable(page, body)
        self.assertIn(script.encode(), page.read_bytes())
        self.assertEqual(metadata.descriptions, ["Curated overview."])
        self.assertEqual(metadata.owned_blocks, 1)

    def test_utility_noindex_is_added_only_in_the_head(self):
        self.page()
        pages = []
        for name in ("404", "print", "toc"):
            pages.append(self.page(name=name, body=(
                '<body><main><!-- vauchi-discovery:start -->'
                '<p>Utility body.</p><!-- vauchi-discovery:end -->'
                '<meta name="robots" content="index"></main></body>'
            )))
        for page, body in pages:
            with self.subTest(page=page.name):
                metadata = self.assert_stable(page, body)
                self.assertEqual(metadata.robots, ["noindex"])
                self.assertEqual(metadata.owned_blocks, 0)

    def test_unpaired_head_marker_fails_without_rewriting_html(self):
        for marker in ("start", "end"):
            with self.subTest(marker=marker):
                page, _body = self.page(head=f'<!-- vauchi-discovery:{marker} -->')
                before = page.read_bytes()
                result = subprocess.run(
                    [sys.executable, str(SCRIPT), str(self.root)], capture_output=True, text=True,
                )
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("unpaired discovery marker", result.stderr)
                self.assertEqual(page.read_bytes(), before)
