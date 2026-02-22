// SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Theme picker for Vauchi docs.
 *
 * Loads themes.json, renders a dropdown in the header (replacing Material's
 * built-in 2-scheme palette toggle), and applies theme colors via CSS
 * custom properties + Material's data-md-color-scheme attribute.
 */
(function () {
  "use strict";

  var THEME_KEY = "vauchi-docs-theme";
  var THEMES_PATH = "data/themes.json";
  var TOKEN_NAMES = [
    "bg-primary", "bg-secondary", "bg-tertiary",
    "text-primary", "text-secondary",
    "accent", "accent-dark",
    "success", "error", "warning", "border"
  ];

  var container = document.getElementById("vauchi-theme-picker");
  if (!container) return;

  var themes = [];
  var currentIdx = -1;
  var menuOpen = false;

  // --- DOM creation ---

  var btn = document.createElement("button");
  btn.className = "md-header__button";
  btn.setAttribute("aria-label", "Choose theme");
  btn.title = "Choose theme";
  btn.style.cssText = "cursor:pointer;font-size:1.1rem;line-height:1";
  btn.textContent = "\uD83C\uDF19"; // moon
  container.appendChild(btn);

  var menu = document.createElement("div");
  menu.style.cssText = [
    "display:none",
    "position:absolute",
    "top:calc(100% + 8px)",
    "right:0",
    "background:var(--v-bg-secondary, var(--md-default-bg-color--light))",
    "border:1px solid var(--v-border, var(--md-default-fg-color--lightest))",
    "border-radius:8px",
    "padding:8px 0",
    "min-width:200px",
    "box-shadow:0 8px 24px rgba(0,0,0,0.3)",
    "z-index:100",
    "max-height:70vh",
    "overflow-y:auto"
  ].join(";");
  container.appendChild(menu);

  function makeLabel(text) {
    var el = document.createElement("div");
    el.style.cssText = "padding:4px 12px 6px;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.05em;opacity:0.6;color:var(--v-text-secondary, var(--md-default-fg-color--light))";
    el.textContent = text;
    return el;
  }

  function makeSeparator() {
    var el = document.createElement("div");
    el.style.cssText = "border-top:1px solid var(--v-border, var(--md-default-fg-color--lightest));margin:4px 0";
    return el;
  }

  function createItem(theme, idx) {
    var item = document.createElement("button");
    item.setAttribute("data-theme-id", theme.id);
    item.style.cssText = "display:flex;align-items:center;gap:8px;width:100%;padding:6px 12px;border:none;background:transparent;color:var(--v-text-primary, var(--md-default-fg-color));cursor:pointer;font-size:0.78rem;text-align:left;font-family:inherit";

    var swatch = document.createElement("span");
    swatch.style.cssText = "width:14px;height:14px;border-radius:50%;flex-shrink:0;border:1px solid var(--v-border, var(--md-default-fg-color--lightest))";
    swatch.style.background = theme.colors.accent;
    item.appendChild(swatch);
    item.appendChild(document.createTextNode(theme.name));

    item.addEventListener("click", function () {
      selectTheme(idx);
      toggleMenu(false);
    });
    item.addEventListener("mouseenter", function () {
      if (currentIdx !== idx) item.style.background = "var(--v-bg-tertiary, var(--md-default-bg-color--lighter))";
    });
    item.addEventListener("mouseleave", function () {
      item.style.background = currentIdx === idx ? "var(--v-bg-tertiary, var(--md-default-bg-color--lighter))" : "transparent";
    });

    return item;
  }

  // --- Theme application ---

  function applyTheme(theme) {
    var root = document.documentElement;

    // Set Material color scheme
    var scheme = theme.mode === "dark" ? "vauchi-dark" : "vauchi-light";
    root.setAttribute("data-md-color-scheme", scheme);

    // Override CSS custom properties with theme-specific values
    for (var i = 0; i < TOKEN_NAMES.length; i++) {
      var value = theme.colors[TOKEN_NAMES[i]];
      if (value) root.style.setProperty("--v-" + TOKEN_NAMES[i], value);
    }

    // Update button icon
    btn.textContent = theme.mode === "dark" ? "\uD83C\uDF19" : "\u2600\uFE0F";

    updateActiveItems();
  }

  function selectTheme(idx) {
    currentIdx = idx;
    applyTheme(themes[idx]);
    try { localStorage.setItem(THEME_KEY, themes[idx].id); } catch (e) {}
  }

  function updateActiveItems() {
    var items = menu.querySelectorAll("[data-theme-id]");
    for (var i = 0; i < items.length; i++) {
      var isActive = themes[currentIdx] && items[i].getAttribute("data-theme-id") === themes[currentIdx].id;
      items[i].style.fontWeight = isActive ? "600" : "normal";
      items[i].style.background = isActive ? "var(--v-bg-tertiary, var(--md-default-bg-color--lighter))" : "transparent";
    }
  }

  // --- Menu toggle ---

  function toggleMenu(force) {
    menuOpen = typeof force === "boolean" ? force : !menuOpen;
    menu.style.display = menuOpen ? "block" : "none";
  }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleMenu();
  });

  document.addEventListener("click", function (e) {
    if (menuOpen && !menu.contains(e.target)) toggleMenu(false);
  });

  // --- Helpers ---

  function findThemeById(id) {
    for (var i = 0; i < themes.length; i++) {
      if (themes[i].id === id) return i;
    }
    return -1;
  }

  function prefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function findDefaultTheme() {
    var defaultId = prefersDark() ? "catppuccin-mocha" : "catppuccin-latte";
    var idx = findThemeById(defaultId);
    if (idx >= 0) return idx;
    var mode = prefersDark() ? "dark" : "light";
    for (var i = 0; i < themes.length; i++) {
      if (themes[i].mode === mode) return i;
    }
    return 0;
  }

  // --- System preference listener ---

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", function () {
        var saved = null;
        try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
        if (!saved) {
          currentIdx = findDefaultTheme();
          if (currentIdx >= 0) applyTheme(themes[currentIdx]);
        }
      });
  }

  // --- Init: fetch themes and render ---

  // Resolve path relative to site root using mkdocs __config
  var configEl = document.getElementById("__config");
  var baseUrl = ".";
  if (configEl) {
    try { baseUrl = JSON.parse(configEl.textContent).base || "."; } catch (e) {}
  }
  var themesUrl = baseUrl + "/" + THEMES_PATH;

  var xhr = new XMLHttpRequest();
  xhr.open("GET", themesUrl, true);
  xhr.onload = function () {
    if (xhr.status !== 200) return;
    try { themes = JSON.parse(xhr.responseText); } catch (e) { return; }

    // Build menu
    var darkThemes = [];
    var lightThemes = [];
    for (var i = 0; i < themes.length; i++) {
      if (themes[i].mode === "dark") darkThemes.push(i);
      else lightThemes.push(i);
    }

    menu.appendChild(makeLabel("Dark"));
    for (var d = 0; d < darkThemes.length; d++) {
      menu.appendChild(createItem(themes[darkThemes[d]], darkThemes[d]));
    }
    menu.appendChild(makeSeparator());
    menu.appendChild(makeLabel("Light"));
    for (var l = 0; l < lightThemes.length; l++) {
      menu.appendChild(createItem(themes[lightThemes[l]], lightThemes[l]));
    }

    // Apply saved or default
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved) currentIdx = findThemeById(saved);
    if (currentIdx < 0) currentIdx = findDefaultTheme();
    if (currentIdx >= 0) applyTheme(themes[currentIdx]);
  };
  xhr.send();
})();
