#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
# SPDX-License-Identifier: GPL-3.0-or-later

"""Publish search and agent discovery from the built public book."""

import html
import re
import sys
import tomllib
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote
from xml.etree import ElementTree as ET


ORIGIN = "https://vauchi.app"
NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"
MARKER = re.compile(r"<!-- vauchi-discovery:start -->.*?<!-- vauchi-discovery:end -->\n?", re.S)
DESCRIPTION = re.compile(r"<meta\b[^>]*\bname\s*=\s*(['\"])description\1[^>]*>\s*", re.I)
DATE_PATTERN = r"(?:\d{4}-\d{2}-\d{2}|[A-Za-z]+\s+(?:\d{1,2},?\s+)?\d{4})"
CHAPTER_METADATA = re.compile(
    rf"(?:Last\s+Updated:\s*{DATE_PATTERN}|"
    rf"Version\s+\d+(?:\.\d+)*(?:\s*[—–-]\s*{DATE_PATTERN})?)\.?",
    re.I,
)


class ChapterDescription(HTMLParser):
    def __init__(self):
        super().__init__()
        self.main = False
        self.ignored = []
        self.paragraph = None
        self.paragraphs = []

    def handle_starttag(self, tag, attrs):
        if self.ignored:
            if tag not in {"br", "hr", "img", "input", "source", "wbr"}:
                self.ignored.append(tag)
            return
        if tag == "main":
            self.main = True
        if not self.main:
            return
        if (
            tag in {"aside", "blockquote", "nav", "pre", "script", "style", "table"}
            or "admonition" in (dict(attrs).get("class") or "").split()
        ):
            self.ignored.append(tag)
        elif tag == "p":
            self.paragraph = []
        elif tag == "br" and self.paragraph is not None:
            self.paragraph.append(" ")

    def handle_endtag(self, tag):
        if self.ignored:
            if tag in self.ignored:
                del self.ignored[len(self.ignored) - 1 - self.ignored[::-1].index(tag):]
            return
        if tag == "p" and self.paragraph is not None:
            text = " ".join("".join(self.paragraph).split())
            if text and not CHAPTER_METADATA.fullmatch(text):
                self.paragraphs.append(text)
            self.paragraph = None
        elif tag == "main":
            self.main = False

    def handle_data(self, text):
        if self.main and not self.ignored and self.paragraph is not None:
            self.paragraph.append(text)


def public_markdown(path, source, depth=0):
    if not path.resolve().is_relative_to(source.resolve()):
        raise ValueError("include outside public source")
    if depth > 8:
        raise ValueError("too many nested public includes")
    text = path.read_text()
    return re.sub(
        r"\{\{#include\s+([^}]+)\}\}",
        lambda match: public_markdown(path.parent / match[1].strip(), source, depth + 1),
        text,
    )


def generate(root):
    config = tomllib.loads((root / "book.toml").read_text())
    book = root / config.get("build", {}).get("build-dir", "book")
    source = root / config["book"].get("src", "src")
    prefix = config["output"]["html"]["site-url"]
    if not prefix.startswith("/") or not prefix.endswith("/"):
        raise ValueError("site-url must be a mounted path with trailing slash")
    name = config["book"]["title"]
    description = config["book"].get("description", name)
    ET.register_namespace("", NAMESPACE)
    sitemap = ET.Element(f"{{{NAMESPACE}}}urlset")
    files = []
    for page in sorted(book.rglob("*.html")):
        relative = page.relative_to(book)
        document = MARKER.sub("", page.read_text())
        if relative.as_posix() in ("404.html", "print.html", "toc.html"):
            if 'name="robots"' not in document:
                document = document.replace("</head>", '<meta name="robots" content="noindex">\n</head>')
            page.write_text(document)
            continue
        markdown = source / relative.with_suffix(".md")
        if not markdown.is_file():
            continue
        body = public_markdown(markdown, source)
        (book / relative.with_suffix(".md")).write_text(body)
        path = relative.as_posix()
        canonical_path = path[:-10] if path.endswith("index.html") else path
        canonical = ORIGIN + prefix + quote(canonical_path)
        markdown_url = ORIGIN + prefix + quote(relative.with_suffix(".md").as_posix())
        title = html.unescape(re.search(r"<title>(.*?)</title>", document, re.S)[1])
        escaped_title = html.escape(title, quote=True)
        summary = ChapterDescription()
        summary.feed(document)
        chapter_description = description if path == "index.html" else next(iter(summary.paragraphs), description)
        escaped_description = html.escape(chapter_description, quote=True)
        document = DESCRIPTION.sub("", document)
        tags = [
            '<!-- vauchi-discovery:start -->',
            f'<meta name="description" content="{escaped_description}">',
            f'<link rel="canonical" href="{canonical}">',
            f'<link rel="alternate" type="text/markdown" href="{markdown_url}">',
            f'<link rel="describedby" href="{ORIGIN}{prefix}llms.txt">',
            f'<meta property="og:title" content="{escaped_title}">',
            f'<meta property="og:description" content="{escaped_description}">',
            f'<meta property="og:url" content="{canonical}">',
            '<meta property="og:type" content="website">',
            '<meta property="og:image" content="https://vauchi.app/social-preview.png">',
            '<meta name="twitter:card" content="summary_large_image">',
            f'<meta name="twitter:title" content="{escaped_title}">',
            f'<meta name="twitter:description" content="{escaped_description}">',
            '<meta name="twitter:image" content="https://vauchi.app/social-preview.png">',
            '<!-- vauchi-discovery:end -->',
        ]
        page.write_text(document.replace("</head>", "\n".join(tags) + "\n</head>"))
        url = ET.SubElement(sitemap, f"{{{NAMESPACE}}}url")
        ET.SubElement(url, f"{{{NAMESPACE}}}loc").text = canonical
        files.append((title, markdown_url))
    if not files:
        raise ValueError("no public book pages generated")
    ET.ElementTree(sitemap).write(book / "sitemap.xml", encoding="utf-8", xml_declaration=True)
    curated = source / "llms.txt"
    if curated.is_file():
        overview = re.sub(
            r"(" + re.escape(ORIGIN + prefix) + r"[^\s)]+)\.html",
            r"\1.md", curated.read_text(),
        )
    else:
        overview = f"# {name}\n\n> {description}\n\n## Pages\n\n"
        overview += "".join(f"- [{title}]({url})\n" for title, url in files)
    (book / "llms.txt").write_text(overview)
    print(f"Discovery: {len(files)} canonical pages and Markdown versions")


if __name__ == "__main__":
    generate(Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd())
