#!/bin/sh
# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
# SPDX-License-Identifier: GPL-3.0-or-later
#
# Generate book/sitemap.xml from the actual mdBook output, replacing the
# old hand-maintained src/sitemap.xml (which drifted and emitted broken
# ".html/" trailing-slash URLs that 404). Run AFTER `mdbook build`.
#
# URL mapping mirrors how mdBook names files:
#   book/index.html          -> https://docs.vauchi.app/
#   book/<dir>/index.html    -> https://docs.vauchi.app/<dir>/   (README.md)
#   book/<path>.html         -> https://docs.vauchi.app/<path>.html
#
# print.html (a full-content duplicate) and 404.html are not indexable
# and are excluded on purpose.

set -eu

BOOK_DIR="${1:-book}"
BASE_URL="https://docs.vauchi.app"
OUT="$BOOK_DIR/sitemap.xml"

if [ ! -d "$BOOK_DIR" ]; then
    echo "gen-sitemap: '$BOOK_DIR' not found — run 'mdbook build' first" >&2
    exit 1
fi

tmp="$OUT.tmp"
{
    echo '<?xml version="1.0" encoding="UTF-8"?>'
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
} > "$tmp"

# find | sort keeps the output deterministic across runners.
find "$BOOK_DIR" -type f -name '*.html' | sort | while IFS= read -r f; do
    rel=${f#"$BOOK_DIR"/}
    case "$rel" in
        404.html | print.html) continue ;;
    esac
    case "$rel" in
        index.html)   loc="$BASE_URL/" ;;
        */index.html) loc="$BASE_URL/${rel%index.html}" ;;
        *)            loc="$BASE_URL/$rel" ;;
    esac
    if [ "$loc" = "$BASE_URL/" ]; then
        priority="1.0"
    else
        priority="0.8"
    fi
    {
        echo '  <url>'
        echo "    <loc>$loc</loc>"
        echo '    <changefreq>weekly</changefreq>'
        echo "    <priority>$priority</priority>"
        echo '  </url>'
    } >> "$tmp"
done

echo '</urlset>' >> "$tmp"

# A near-empty sitemap means the build produced nothing — fail loud
# rather than shipping a sitemap that de-indexes the whole site.
urls=$(grep -c '<loc>' "$tmp" || true)
if [ "$urls" -lt 5 ]; then
    echo "gen-sitemap: only $urls URLs found — build likely broken" >&2
    rm -f "$tmp"
    exit 1
fi

mv "$tmp" "$OUT"
echo "gen-sitemap: wrote $OUT ($urls URLs)"
