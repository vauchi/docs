// SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
//
// SPDX-License-Identifier: GPL-3.0-or-later

// Lazy-load mermaid only when diagrams are present on the page.
// Avoids loading 2.6MB JS on pages without diagrams.
(() => {
    const hasDiagrams = document.querySelectorAll('.language-mermaid, pre > code.mermaid').length > 0;
    if (!hasDiagrams) return;

    const darkThemes = ['ayu', 'navy', 'coal'];
    const classList = document.documentElement.classList;
    let isDark = false;
    for (const c of classList) {
        if (darkThemes.includes(c)) { isDark = true; break; }
    }

    const script = document.createElement('script');
    script.src = 'mermaid.min.js';
    script.onload = () => {
        mermaid.initialize({ startOnLoad: true, theme: isDark ? 'dark' : 'default' });
    };
    document.head.appendChild(script);
})();