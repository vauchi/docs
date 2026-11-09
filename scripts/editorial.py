#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
# SPDX-License-Identifier: GPL-3.0-or-later

"""Render editorial provenance after chapter titles, before article prose."""

import json
import re
import sys
from pathlib import Path


def after_title(content, note):
    offset = 0
    fence = None
    comment = False
    for line in content.splitlines(keepends=True):
        offset += len(line)
        if fence:
            closing = re.fullmatch(r" {0,3}([`~]{3,})\s*", line)
            if closing and set(closing[1]) == {fence[0]} and len(closing[1]) >= fence[1]:
                fence = None
            continue
        if comment:
            comment = "-->" not in line
            continue
        if line.lstrip().startswith("<!--"):
            comment = "-->" not in line
            continue
        opening = re.match(r" {0,3}(`{3,}|~{3,})", line)
        if opening:
            fence = (opening[1][0], len(opening[1]))
        elif re.match(r" {0,3}#[\t ]+\S", line):
            return content[:offset] + "\n" + note.strip() + "\n\n" + content[offset:]
    raise ValueError("chapter needs an H1 before editorial attribution")


def annotate(book, note):
    def visit(sections):
        for section in sections:
            chapter = section.get("Chapter") if isinstance(section, dict) else None
            if chapter is not None:
                if chapter.get("source_path") is not None:
                    chapter["content"] = after_title(chapter["content"], note)
                visit(chapter.get("sub_items", []))
    visit(book.get("sections", book.get("items", [])))
    return book


def main():
    if len(sys.argv) > 1:
        return 0 if sys.argv[1:] == ["supports", "html"] else 1
    _context, book = json.load(sys.stdin)
    note = (Path(__file__).resolve().parents[1] / "theme/attribution.hbs").read_text()
    json.dump(annotate(book, note), sys.stdout)
    return 0


if __name__ == "__main__":
    sys.exit(main())
