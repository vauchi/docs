# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
# SPDX-License-Identifier: GPL-3.0-or-later

"""Describe rendered articles without inferring authors or feature status."""

import json
import re
from datetime import datetime
from html.parser import HTMLParser

from source_dates import last_modified


class Heading(HTMLParser):
    def __init__(self, document):
        super().__init__()
        self.main = False
        self.active = False
        self.parts = []
        self.feed(document)

    def handle_starttag(self, tag, attrs):
        if tag == "main":
            self.main = True
        if self.main and tag == "h1" and not self.parts:
            self.active = True

    def handle_endtag(self, tag):
        if tag == "h1":
            self.active = False
        if tag == "main":
            self.main = False

    def handle_data(self, data):
        if self.active:
            self.parts.append(data)


def content_date(root, path, source, depth=0):
    if depth > 8 or not path.resolve().is_relative_to(source.resolve()):
        raise ValueError("invalid public source include")
    timestamp = last_modified(root, path)
    if timestamp is None:
        return None
    dates = [timestamp]
    for include in re.findall(r"\{\{#include\s+([^}]+)\}\}", path.read_text()):
        included = content_date(root, path.parent / include.strip(), source, depth + 1)
        if included is None:
            return None
        dates.append(included)
    return max(dates, key=datetime.fromisoformat)


def article_schema(root, markdown, source, document, canonical, description):
    headline = " ".join("".join(Heading(document).parts).split())
    if not headline:
        return ""
    relative = markdown.relative_to(source).as_posix()
    kind = "WebPage" if relative.startswith("legal/") else "TechArticle"
    if relative.startswith("about/"):
        kind = "AboutPage"
    entity = {
        "@context": "https://schema.org",
        "@type": kind,
        "headline": headline,
        "description": description,
        "mainEntityOfPage": canonical,
        "author": {
            "@type": "Person", "name": "Mattia Egloff",
            "url": "https://vauchi.app/#organization",
        },
        "publisher": {"@id": "https://vauchi.app/#organization"},
    }
    timestamp = content_date(root, markdown, source)
    if timestamp:
        entity["dateModified"] = timestamp
    serialized = json.dumps(entity, ensure_ascii=False).replace("<", "\\u003c")
    return '<script type="application/ld+json">' + serialized + '</script>'
