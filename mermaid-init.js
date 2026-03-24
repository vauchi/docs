// SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
// SPDX-License-Identifier: GPL-3.0-or-later

// Initialize mermaid with theme-aware dark/light mode.
// mermaid.min.js is loaded via additional-js in book.toml.
(() => {
    if (typeof mermaid === 'undefined') return;
    const darkThemes = ['ayu', 'navy', 'coal'];
    const classList = document.documentElement.classList;
    let isDark = false;
    for (const c of classList) {
        if (darkThemes.includes(c)) { isDark = true; break; }
    }
    mermaid.initialize({ startOnLoad: true, theme: isDark ? 'dark' : 'default' });
})();
