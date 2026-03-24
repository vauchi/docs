// SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
// SPDX-License-Identifier: GPL-3.0-or-later

// Custom theme switcher for Vauchi docs.
// Replaces mdBook's 5-theme dropdown with Vauchi theme names + light/dark toggle.
//
// mdBook internal themes mapped to Vauchi:
//   coal  = Vauchi Dark (default dark)
//   light = Vauchi Light (default light)
//   ayu   = Catppuccin Mocha
//   rust  = Catppuccin Latte
(() => {
    const VAUCHI_THEMES = [
        { id: 'coal',  name: 'Vauchi Dark',       icon: '\u{1F319}' },
        { id: 'light', name: 'Vauchi Light',      icon: '\u{2600}\u{FE0F}' },
        { id: 'ayu',   name: 'Catppuccin Mocha',  icon: '\u{1F431}' },
        { id: 'rust',  name: 'Catppuccin Latte',  icon: '\u{1F338}' },
    ];

    document.addEventListener('DOMContentLoaded', function() {
        var themeList = document.getElementById('theme-list');
        var themeToggle = document.getElementById('theme-toggle');
        if (!themeList || !themeToggle) return;

        // Clear existing theme buttons and rebuild with our names
        while (themeList.firstChild) {
            themeList.removeChild(themeList.firstChild);
        }
        for (var i = 0; i < VAUCHI_THEMES.length; i++) {
            var theme = VAUCHI_THEMES[i];
            var li = document.createElement('li');
            li.setAttribute('role', 'none');
            var btn = document.createElement('button');
            btn.setAttribute('role', 'menuitem');
            btn.className = 'theme';
            btn.id = theme.id;
            btn.textContent = theme.icon + ' ' + theme.name;
            li.appendChild(btn);
            themeList.appendChild(li);
        }

        // Hide the navy theme button (duplicate of coal)
        var navyBtn = document.getElementById('navy');
        if (navyBtn && navyBtn.parentElement) {
            navyBtn.parentElement.style.display = 'none';
        }

        // Replace paint-brush icon with light/dark emoji
        var icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = '';
            icon.style.fontStyle = 'normal';
            updateToggleIcon(icon);
        }

        // Update icon when theme changes
        var observer = new MutationObserver(function() {
            if (icon) updateToggleIcon(icon);
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        function updateToggleIcon(el) {
            var cls = document.documentElement.className;
            var isDark = cls.indexOf('coal') !== -1 ||
                         cls.indexOf('navy') !== -1 ||
                         cls.indexOf('ayu') !== -1;
            el.textContent = isDark ? '\u{1F319}' : '\u{2600}\u{FE0F}';
        }
    });
})();
