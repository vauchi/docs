// SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
// SPDX-License-Identifier: GPL-3.0-or-later

// Vauchi docs theme switcher — mirrors the website theme picker.
// Fetches themes.json, builds dark/light grouped picker with swatches,
// light/dark quick toggle, GitLab link. Applies via CSS custom properties.
(function () {
  var THEME_KEY = "vauchi-docs-theme";
  var THEMES_URL = "https://cdn.vauchi.app/v1/themes/themes.json";
  var themes = [];
  var currentIdx = -1;

  var TOKEN_NAMES = [
    "bg-primary", "bg-secondary", "bg-tertiary",
    "text-primary", "text-secondary",
    "accent", "accent-dark",
    "success", "error", "warning", "border",
  ];

  // mdBook CSS variable mapping from our semantic tokens
  var MDBOOK_VARS = {
    "bg-primary":     ["--bg"],
    "text-primary":   ["--fg", "--sidebar-fg", "--searchbar-fg"],
    "bg-secondary":   ["--sidebar-bg", "--table-alternate-bg"],
    "bg-tertiary":    ["--theme-popup-bg", "--quote-bg", "--table-header-bg", "--searchbar-bg"],
    "accent":         ["--sidebar-active", "--links"],
    "error":          ["--inline-code-color"],
    "text-secondary": ["--sidebar-non-existant", "--icons", "--searchresults-header-fg"],
    "border":         ["--theme-popup-border", "--quote-border", "--table-border-color",
                       "--searchbar-border-color", "--searchresults-border-color"],
  };

  var THEME_PAIRS = {
    "default-dark": "default-light", "default-light": "default-dark",
    "catppuccin-mocha": "catppuccin-latte", "catppuccin-latte": "catppuccin-mocha",
    "catppuccin-frappe": "catppuccin-latte", "catppuccin-macchiato": "catppuccin-latte",
    "solarized-dark": "solarized-light", "solarized-light": "solarized-dark",
    "gruvbox-dark": "gruvbox-light", "gruvbox-light": "gruvbox-dark",
    "high-contrast": "high-contrast-light", "high-contrast-light": "high-contrast",
    "dracula": "default-light", "nord": "default-light",
  };

  function resolveColor(theme, token) {
    if (theme.colors) return theme.colors[token];
    if (theme.semantic && theme.primitives) {
      var ref = theme.semantic[token];
      if (!ref) return null;
      var m = ref.match(/^\{(.+)\}$/);
      return m ? theme.primitives[m[1]] : ref;
    }
    return null;
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    // Set our CSS custom properties
    for (var i = 0; i < TOKEN_NAMES.length; i++) {
      var val = resolveColor(theme, TOKEN_NAMES[i]);
      if (val) root.style.setProperty("--" + TOKEN_NAMES[i], val);
    }
    // Map to mdBook variables
    for (var token in MDBOOK_VARS) {
      var val = resolveColor(theme, token);
      if (val) {
        var vars = MDBOOK_VARS[token];
        for (var j = 0; j < vars.length; j++) {
          root.style.setProperty(vars[j], val);
        }
      }
    }
    // Also set --icons-hover
    var textPrimary = resolveColor(theme, "text-primary");
    if (textPrimary) root.style.setProperty("--icons-hover", textPrimary);

    // Set mdBook base class for code highlighting
    var mdClass = theme.mode === "dark" ? "coal" : "light";
    root.className = root.className.replace(/\b(coal|light|rust|navy|ayu)\b/g, "").trim();
    root.classList.add(mdClass);

    updateModeIcon(theme);
    updateActiveItem();
  }

  function updateModeIcon(theme) {
    var btn = document.getElementById("vauchi-mode-toggle");
    if (btn) {
      btn.textContent = theme.mode === "dark" ? "\uD83C\uDF19" : "\u2600\uFE0F";
      btn.title = theme.mode === "dark" ? "Switch to light mode" : "Switch to dark mode";
    }
  }

  function updateActiveItem() {
    var items = document.querySelectorAll("[data-theme-id]");
    for (var i = 0; i < items.length; i++) {
      var isActive = themes[currentIdx] &&
        items[i].getAttribute("data-theme-id") === themes[currentIdx].id;
      items[i].style.fontWeight = isActive ? "600" : "normal";
      items[i].style.background = isActive ? "var(--bg-tertiary)" : "transparent";
    }
  }

  function save(id) { try { localStorage.setItem(THEME_KEY, id); } catch(e) {} }
  function load() { try { return localStorage.getItem(THEME_KEY); } catch(e) { return null; } }
  function prefersDark() { return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; }

  function findById(id) {
    for (var i = 0; i < themes.length; i++) { if (themes[i].id === id) return i; }
    return -1;
  }

  function findDefault() {
    var mode = prefersDark() ? "dark" : "light";
    for (var i = 0; i < themes.length; i++) {
      if (themes[i].id === "default-" + mode) return i;
    }
    return 0;
  }

  function toggleDarkLight() {
    var cur = themes[currentIdx];
    var pairedId = (cur && THEME_PAIRS[cur.id]) || (cur && cur.mode === "dark" ? "default-light" : "default-dark");
    var idx = findById(pairedId);
    if (idx >= 0) { currentIdx = idx; applyTheme(themes[idx]); save(themes[idx].id); }
  }

  function createItem(theme, idx) {
    var btn = document.createElement("button");
    btn.setAttribute("data-theme-id", theme.id);
    btn.style.cssText = "display:flex;align-items:center;gap:8px;width:100%;padding:6px 12px;border:none;background:transparent;color:var(--fg);cursor:pointer;font-size:0.8rem;text-align:left;font-family:inherit";
    var swatch = document.createElement("span");
    swatch.style.cssText = "width:14px;height:14px;border-radius:50%;flex-shrink:0;border:1px solid var(--table-border-color)";
    swatch.style.background = resolveColor(theme, "accent") || "var(--links)";
    btn.appendChild(swatch);
    btn.appendChild(document.createTextNode(theme.name));
    btn.addEventListener("click", function () {
      currentIdx = idx; applyTheme(theme); save(theme.id); toggleMenu(false);
    });
    btn.addEventListener("mouseenter", function () {
      if (!themes[currentIdx] || theme.id !== themes[currentIdx].id)
        btn.style.background = "var(--bg-tertiary, var(--theme-popup-bg))";
    });
    btn.addEventListener("mouseleave", function () {
      var active = themes[currentIdx] && theme.id === themes[currentIdx].id;
      btn.style.background = active ? "var(--bg-tertiary)" : "transparent";
    });
    return btn;
  }

  // Build the popup menu (replaces mdBook's theme-list)
  function buildMenu() {
    var themeList = document.getElementById("theme-list");
    if (!themeList) return;
    while (themeList.firstChild) themeList.removeChild(themeList.firstChild);
    themeList.style.cssText = "min-width:200px;max-height:70vh;overflow-y:auto;padding:4px 0";

    // Dark section
    var darkLabel = document.createElement("div");
    darkLabel.style.cssText = "padding:4px 12px 4px;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--icons);opacity:0.7";
    darkLabel.textContent = "Dark";
    themeList.appendChild(darkLabel);

    for (var i = 0; i < themes.length; i++) {
      if (themes[i].mode === "dark") themeList.appendChild(createItem(themes[i], i));
    }

    // Light section
    var sep = document.createElement("div");
    sep.style.cssText = "margin:4px 0;border-top:1px solid var(--table-border-color)";
    themeList.appendChild(sep);
    var lightLabel = document.createElement("div");
    lightLabel.style.cssText = "padding:4px 12px 4px;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--icons);opacity:0.7";
    lightLabel.textContent = "Light";
    themeList.appendChild(lightLabel);

    for (var i = 0; i < themes.length; i++) {
      if (themes[i].mode === "light") themeList.appendChild(createItem(themes[i], i));
    }
  }

  var menuOpen = false;
  function toggleMenu(force) {
    menuOpen = typeof force === "boolean" ? force : !menuOpen;
    var themeList = document.getElementById("theme-list");
    if (themeList) themeList.style.display = menuOpen ? "block" : "none";
    var toggle = document.getElementById("theme-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", String(menuOpen));
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Rename theme toggle icon to palette
    var themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      var icon = themeToggle.querySelector("i");
      if (icon) { icon.className = ""; icon.style.fontStyle = "normal"; icon.textContent = "\uD83C\uDFA8"; }
    }

    // Add light/dark quick toggle
    var buttons = document.querySelector(".right-buttons");
    if (buttons) {
      var modeBtn = document.createElement("button");
      modeBtn.id = "vauchi-mode-toggle";
      modeBtn.type = "button";
      modeBtn.className = "icon-button";
      modeBtn.setAttribute("aria-label", "Toggle dark/light mode");
      modeBtn.title = "Toggle dark/light mode";
      modeBtn.style.cssText = "background:none;border:none;cursor:pointer;font-size:18px;padding:4px 8px;color:var(--icons)";
      modeBtn.textContent = "\uD83C\uDF19";
      modeBtn.addEventListener("click", function (e) { e.stopPropagation(); toggleDarkLight(); });
      if (themeToggle) buttons.insertBefore(modeBtn, themeToggle);
      else buttons.appendChild(modeBtn);
    }

    // Add GitLab link
    var gitBtn = document.getElementById("git-repository-button");
    if (gitBtn) {
      var gitLink = gitBtn.closest("a") || gitBtn.parentElement;
      if (gitLink && gitLink.parentElement) {
        var gl = document.createElement("a");
        gl.href = "https://gitlab.com/vauchi/docs";
        gl.target = "_blank"; gl.rel = "noopener";
        gl.className = "icon-button";
        gl.title = "GitLab"; gl.setAttribute("aria-label", "GitLab");
        gl.style.cssText = "display:inline-flex;align-items:center;color:var(--icons);text-decoration:none;padding:3px";
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.style.cssText = "width:20px;height:20px;fill:currentColor";
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "m23.6 9.593-.033-.086L20.3 1.01a.851.851 0 0 0-.336-.405.877.877 0 0 0-.994.03.882.882 0 0 0-.29.44l-2.204 6.748H7.538L5.334 1.075a.857.857 0 0 0-.29-.441.877.877 0 0 0-.994-.03.86.86 0 0 0-.336.405L.433 9.502l-.032.086a6.066 6.066 0 0 0 2.012 7.01l.012.009.03.022 4.982 3.73 2.464 1.865 1.5 1.134a1.01 1.01 0 0 0 1.22 0l1.5-1.134 2.465-1.865 5.012-3.752.013-.01a6.072 6.072 0 0 0 2.009-7.004");
        svg.appendChild(path); gl.appendChild(svg);
        gitLink.parentElement.insertBefore(gl, gitLink.nextSibling);
      }
    }

    // Close menu on outside click
    document.addEventListener("click", function (e) {
      var themeList = document.getElementById("theme-list");
      if (menuOpen && themeList && !themeList.contains(e.target) &&
          e.target !== themeToggle && e.target !== document.getElementById("vauchi-mode-toggle")) {
        toggleMenu(false);
      }
    });

    // Fetch themes and build picker
    var xhr = new XMLHttpRequest();
    xhr.open("GET", THEMES_URL, true);
    xhr.timeout = 3000;
    xhr.onload = function () {
      if (xhr.status === 200) {
        try { themes = JSON.parse(xhr.responseText); } catch (e) { return; }
        buildMenu();
        var saved = load();
        if (saved) currentIdx = findById(saved);
        if (currentIdx < 0) currentIdx = findDefault();
        if (currentIdx >= 0) { applyTheme(themes[currentIdx]); save(themes[currentIdx].id); }
      }
    };
    xhr.onerror = xhr.ontimeout = function () {};
    xhr.send();

    // System theme change
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
        if (!load()) { currentIdx = findDefault(); if (currentIdx >= 0) applyTheme(themes[currentIdx]); }
      });
    }
  });
})();
