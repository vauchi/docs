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

function attr(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function directive(lines, name) {
  const line = lines.find((l) => new RegExp(`^\\s*${name}\\s*:`).test(l));
  return line ? line.replace(new RegExp(`^\\s*${name}\\s*:\\s*`), "").trim() : "";
}

function processContent(content) {
  return content.replace(
    /```mermaid\r?\n([\s\S]*?)```/g,
    (match, diagram) => {
      try {
        const lines = diagram.trim().split("\n");
        // Strip Mermaid accessibility directives (accTitle, accDescr)
        // that beautiful-mermaid doesn't understand
        const cleaned = lines
          .filter(l => !/^\s*acc(Title|Descr)/.test(l))
          .join("\n")
          .trim();
        if (!cleaned) return match;
        const ascii = renderMermaidASCII(cleaned);
        // The `ascii-diagram` info string is the hook ascii-diagram.js and
        // .css key off. Without it a diagram is indistinguishable from a
        // shell transcript, and shrinking real code samples would be wrong.
        const fence = "```ascii-diagram\n" + ascii + "\n```";
        // accTitle/accDescr are dropped from the render above but carry the
        // only human description we have. Emitting them keeps the diagram
        // reachable to screen readers, which otherwise get box-drawing
        // characters read out one by one.
        const title = directive(lines, "accTitle");
        const descr = directive(lines, "accDescr");
        if (!title && !descr) return fence;
        return (
          `<p class="ascii-diagram-desc" data-ascii-title="${attr(title)}">` +
          `${attr(descr || title)}</p>\n\n${fence}`
        );
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
