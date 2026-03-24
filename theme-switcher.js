// SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
// SPDX-License-Identifier: GPL-3.0-or-later

// Vauchi docs: custom theme switcher, light/dark toggle, GitLab link.
// All 14 themes from themes.json mapped via data-vauchi-theme attribute.
(() => {
    var THEMES = [
        { id: 'default-dark',        name: 'Vauchi Dark',          mode: 'dark',  mdbook: 'coal'  },
        { id: 'default-light',       name: 'Vauchi Light',         mode: 'light', mdbook: 'light' },
        { id: 'catppuccin-mocha',    name: 'Catppuccin Mocha',     mode: 'dark',  mdbook: 'coal'  },
        { id: 'catppuccin-latte',    name: 'Catppuccin Latte',     mode: 'light', mdbook: 'light' },
        { id: 'catppuccin-frappe',   name: 'Catppuccin Frapp\u00e9', mode: 'dark', mdbook: 'coal' },
        { id: 'catppuccin-macchiato',name: 'Catppuccin Macchiato', mode: 'dark',  mdbook: 'coal'  },
        { id: 'dracula',            name: 'Dracula',               mode: 'dark',  mdbook: 'coal'  },
        { id: 'nord',               name: 'Nord',                  mode: 'dark',  mdbook: 'coal'  },
        { id: 'solarized-dark',     name: 'Solarized Dark',        mode: 'dark',  mdbook: 'coal'  },
        { id: 'solarized-light',    name: 'Solarized Light',       mode: 'light', mdbook: 'light' },
        { id: 'gruvbox-dark',       name: 'Gruvbox Dark',          mode: 'dark',  mdbook: 'coal'  },
        { id: 'gruvbox-light',      name: 'Gruvbox Light',         mode: 'light', mdbook: 'light' },
        { id: 'high-contrast',      name: 'High Contrast',         mode: 'dark',  mdbook: 'coal'  },
        { id: 'high-contrast-light',name: 'High Contrast Light',   mode: 'light', mdbook: 'light' },
    ];

    var STORAGE_KEY = 'vauchi-docs-theme';

    function getStored() {
        try { return localStorage.getItem(STORAGE_KEY); } catch(e) { return null; }
    }
    function setStored(id) {
        try { localStorage.setItem(STORAGE_KEY, id); } catch(e) {}
    }

    function findTheme(id) {
        for (var i = 0; i < THEMES.length; i++) {
            if (THEMES[i].id === id) return THEMES[i];
        }
        return THEMES[0];
    }

    function applyTheme(theme) {
        var html = document.documentElement;
        // Set mdBook base theme (controls code highlighting etc.)
        html.className = html.className.replace(/\b(coal|light|rust|navy|ayu)\b/g, '').trim();
        html.classList.add(theme.mdbook);
        // Set vauchi theme for our CSS overrides
        html.setAttribute('data-vauchi-theme', theme.id);
        setStored(theme.id);
        updateIcons(theme);
    }

    function updateIcons(theme) {
        var toggle = document.getElementById('vauchi-mode-toggle');
        if (toggle) {
            toggle.textContent = theme.mode === 'dark' ? '\u{1F319}' : '\u{2600}\u{FE0F}';
            toggle.title = theme.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
        }
    }

    function getOppositeMode(current) {
        // Find the light/dark counterpart of the current theme
        var cur = findTheme(current);
        var targetMode = cur.mode === 'dark' ? 'light' : 'dark';
        // Try to find the same family in opposite mode
        var base = current.replace(/-dark$|-light$/, '');
        var opposite = base + '-' + targetMode;
        for (var i = 0; i < THEMES.length; i++) {
            if (THEMES[i].id === opposite) return THEMES[i];
        }
        // Fallback: default dark/light
        return targetMode === 'dark' ? THEMES[0] : THEMES[1];
    }

    document.addEventListener('DOMContentLoaded', function() {
        // --- Apply stored theme ---
        var stored = getStored();
        if (stored) {
            applyTheme(findTheme(stored));
        } else {
            // Respect system preference
            var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(prefersDark ? THEMES[0] : THEMES[1]);
        }

        // --- Rebuild theme list ---
        var themeList = document.getElementById('theme-list');
        if (themeList) {
            while (themeList.firstChild) themeList.removeChild(themeList.firstChild);
            for (var i = 0; i < THEMES.length; i++) {
                (function(theme) {
                    var li = document.createElement('li');
                    li.setAttribute('role', 'none');
                    var btn = document.createElement('button');
                    btn.setAttribute('role', 'menuitem');
                    btn.className = 'theme';
                    btn.id = theme.id;
                    var icon = theme.mode === 'dark' ? '\u{1F319}' : '\u{2600}\u{FE0F}';
                    btn.textContent = icon + ' ' + theme.name;
                    btn.addEventListener('click', function() { applyTheme(theme); });
                    li.appendChild(btn);
                    themeList.appendChild(li);
                })(THEMES[i]);
            }
        }

        // --- Replace theme toggle icon ---
        var themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            var iconEl = themeToggle.querySelector('i');
            if (iconEl) {
                iconEl.className = '';
                iconEl.style.fontStyle = 'normal';
                iconEl.textContent = '\u{1F3A8}';
            }
        }

        // --- Add light/dark quick toggle ---
        var buttons = document.querySelector('.right-buttons');
        if (buttons) {
            var modeBtn = document.createElement('button');
            modeBtn.id = 'vauchi-mode-toggle';
            modeBtn.type = 'button';
            modeBtn.setAttribute('aria-label', 'Toggle dark/light mode');
            var currentTheme = findTheme(getStored() || 'default-dark');
            updateIcons(currentTheme);
            modeBtn.textContent = currentTheme.mode === 'dark' ? '\u{1F319}' : '\u{2600}\u{FE0F}';
            modeBtn.addEventListener('click', function() {
                var cur = getStored() || 'default-dark';
                var opp = getOppositeMode(cur);
                applyTheme(opp);
            });
            // Insert before the theme toggle
            if (themeToggle) {
                buttons.insertBefore(modeBtn, themeToggle);
            } else {
                buttons.appendChild(modeBtn);
            }
        }

        // --- Add GitLab link next to GitHub ---
        var gitBtn = document.getElementById('git-repository-button');
        if (gitBtn) {
            var gitLink = gitBtn.closest('a') || gitBtn.parentElement;
            if (gitLink) {
                var glLink = document.createElement('a');
                glLink.href = 'https://gitlab.com/vauchi/docs';
                glLink.target = '_blank';
                glLink.rel = 'noopener';
                glLink.className = 'gitlab-icon';
                glLink.title = 'GitLab Repository';
                glLink.setAttribute('aria-label', 'GitLab Repository');
                var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('viewBox', '0 0 24 24');
                var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'm23.6 9.593-.033-.086L20.3 1.01a.851.851 0 0 0-.336-.405.877.877 0 0 0-.994.03.882.882 0 0 0-.29.44l-2.204 6.748H7.538L5.334 1.075a.857.857 0 0 0-.29-.441.877.877 0 0 0-.994-.03.86.86 0 0 0-.336.405L.433 9.502l-.032.086a6.066 6.066 0 0 0 2.012 7.01l.012.009.03.022 4.982 3.73 2.464 1.865 1.5 1.134a1.01 1.01 0 0 0 1.22 0l1.5-1.134 2.465-1.865 5.012-3.752.013-.01a6.072 6.072 0 0 0 2.009-7.004');
                svg.appendChild(path);
                glLink.appendChild(svg);
                gitLink.parentElement.insertBefore(glLink, gitLink.nextSibling);
            }
        }
    });
})();
