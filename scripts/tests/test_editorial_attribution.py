# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
# SPDX-License-Identifier: GPL-3.0-or-later

from html.parser import HTMLParser
from pathlib import Path
import unittest


DISCLOSURE = (
    "Drafted with AI assistance. Reviewed, fact-checked and published by "
    "Mattia Egloff, who is responsible for its content (hello@vauchi.app)."
)


class VisibleText(HTMLParser):
    def __init__(self, document):
        super().__init__()
        self.body = False
        self.ignored = None
        self.parts = []
        self.feed(document)

    def handle_starttag(self, tag, attrs):
        if tag == "body":
            self.body = True
        if tag in {"script", "style"}:
            self.ignored = tag

    def handle_endtag(self, tag):
        if tag == "body":
            self.body = False
        if tag == self.ignored:
            self.ignored = None

    def handle_data(self, data):
        if self.body and not self.ignored:
            self.parts.append(data)


class EditorialAttributionTests(unittest.TestCase):
    def test_rendered_articles_credit_editorial_responsibility(self):
        book = Path(__file__).resolve().parents[2] / "book"
        pages = [path for path in sorted(book.rglob("*.html"))
                 if path.name not in {"print.html", "toc.html", "404.html"}]
        self.assertNotEqual(pages, [], "Build the book before checking editorial attribution")
        for path in pages:
            text = " ".join("".join(VisibleText(path.read_text()).parts).split())
            if DISCLOSURE not in text:
                self.fail(f"Missing exact editorial disclosure in {path.relative_to(book)}")
