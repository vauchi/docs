# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
# SPDX-License-Identifier: GPL-3.0-or-later

from html.parser import HTMLParser
from pathlib import Path
import unittest


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.headings = 0
        self.unlabelled_images = []

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if tag == "h1":
            self.headings += 1
        if tag == "img" and "alt" not in attributes:
            self.unlabelled_images.append(attributes.get("src", ""))


class PageSemanticsTests(unittest.TestCase):
    def test_decorative_images_can_use_an_empty_alt_attribute(self):
        page = Page()
        page.feed('<h1>Guide</h1><img src="decoration.svg" alt="">')
        self.assertEqual(page.unlabelled_images, [])

    def test_images_without_an_alt_attribute_are_reported(self):
        page = Page()
        page.feed('<h1>Guide</h1><img src="contact-card.png">')
        self.assertEqual(page.unlabelled_images, ["contact-card.png"])

    def test_built_pages_have_one_heading_and_meaningful_image_alternatives(self):
        book = Path(__file__).resolve().parents[2] / "book"
        pages = sorted(
            page for page in book.rglob("*.html")
            if page.name not in ("print.html", "toc.html", "404.html")
        )
        self.assertNotEqual(pages, [], "Build the book before checking page semantics")
        for path in pages:
            with self.subTest(page=str(path.relative_to(book))):
                page = Page()
                page.feed(path.read_text())
                self.assertEqual(page.headings, 1)
                self.assertEqual(page.unlabelled_images, [])


if __name__ == "__main__":
    unittest.main()
