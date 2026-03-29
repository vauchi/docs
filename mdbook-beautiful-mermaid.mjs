#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
// SPDX-License-Identifier: GPL-3.0-or-later
import { renderMermaidASCII } from "beautiful-mermaid";

const args = process.argv.slice(2);
if (args[0] === "supports") {
  process.exit(0);
}

let input = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) {
  input += chunk;
}

const [_context, book] = JSON.parse(input);

function processContent(content) {
  return content.replace(
    /```mermaid\r?\n([\s\S]*?)```/g,
    (match, diagram) => {
      try {
        // Strip Mermaid accessibility directives (accTitle, accDescr)
        // that beautiful-mermaid doesn't understand
        const cleaned = diagram.trim()
          .split("\n")
          .filter(l => !/^\s*acc(Title|Descr)/.test(l))
          .join("\n")
          .trim();
        if (!cleaned) return match;
        const ascii = renderMermaidASCII(cleaned);
        return "```\n" + ascii + "\n```";
      } catch (err) {
        process.stderr.write(
          `[beautiful-mermaid] Failed to render diagram: ${err.message}\n`
        );
        return match;
      }
    }
  );
}

function processSection(section) {
  if (section.Chapter) {
    section.Chapter.content = processContent(section.Chapter.content);
    for (const sub of section.Chapter.sub_items ?? []) {
      processSection(sub);
    }
  }
}

const sections = book.sections ?? book.items ?? [];
for (const section of sections) {
  processSection(section);
}

process.stdout.write(JSON.stringify(book));
