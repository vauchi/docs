// SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Theme picker for Vauchi docs.
 *
 * Loads themes.json, renders a dropdown in the header (replacing Material's
 * built-in 2-scheme palette toggle), and applies theme colors via an injected
 * <style> element that overrides the scheme defaults in extra.css.
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

  // Injected <style> element for theme overrides — beats the selectors in
  // extra.css by using higher specificity: body[data-md-color-scheme]
  var styleEl = document.createElement("style");
  styleEl.id = "vauchi-theme-override";
  document.head.appendChild(styleEl);

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
    var body = document.body;

    // Set Material color scheme on body (where mkdocs-material reads it)
    var scheme = theme.mode === "dark" ? "vauchi-dark" : "vauchi-light";
    body.setAttribute("data-md-color-scheme", scheme);

    // Build CSS that overrides BOTH the --v-* tokens AND the --md-*
    // Material variables, so we don't rely on var() re-resolution.
    var bg1 = theme.colors["bg-primary"] || "";
    var bg2 = theme.colors["bg-secondary"] || "";
    var bg3 = theme.colors["bg-tertiary"] || "";
    var fg1 = theme.colors["text-primary"] || "";
    var fg2 = theme.colors["text-secondary"] || "";
    var acc = theme.colors["accent"] || "";
    var acd = theme.colors["accent-dark"] || "";
    var suc = theme.colors["success"] || "";
    var err = theme.colors["error"] || "";
    var wrn = theme.colors["warning"] || "";
    var brd = theme.colors["border"] || "";

    var css = "body[data-md-color-scheme] {\n";
    // Core tokens
    css += "  --v-bg-primary: " + bg1 + ";\n";
    css += "  --v-bg-secondary: " + bg2 + ";\n";
    css += "  --v-bg-tertiary: " + bg3 + ";\n";
    css += "  --v-text-primary: " + fg1 + ";\n";
    css += "  --v-text-secondary: " + fg2 + ";\n";
    css += "  --v-accent: " + acc + ";\n";
    css += "  --v-accent-dark: " + acd + ";\n";
    css += "  --v-success: " + suc + ";\n";
    css += "  --v-error: " + err + ";\n";
    css += "  --v-warning: " + wrn + ";\n";
    css += "  --v-border: " + brd + ";\n";
    // Material overrides (duplicate what extra.css derives from --v-*)
    css += "  --md-default-bg-color: " + bg1 + ";\n";
    css += "  --md-default-bg-color--light: " + bg2 + ";\n";
    css += "  --md-default-bg-color--lighter: " + bg3 + ";\n";
    css += "  --md-default-bg-color--lightest: " + brd + ";\n";
    css += "  --md-default-fg-color: " + fg1 + ";\n";
    css += "  --md-default-fg-color--light: " + fg2 + ";\n";
    css += "  --md-primary-fg-color: " + (scheme === "vauchi-dark" ? acd : acc) + ";\n";
    css += "  --md-accent-fg-color: " + acc + ";\n";
    css += "  --md-typeset-color: " + fg1 + ";\n";
    css += "  --md-typeset-a-color: " + (scheme === "vauchi-dark" ? acd : acc) + ";\n";
    css += "  --md-code-fg-color: " + fg1 + ";\n";
    css += "  --md-code-bg-color: " + bg2 + ";\n";
    css += "  --md-admonition-fg-color: " + fg1 + ";\n";
    css += "  --md-admonition-bg-color: " + (scheme === "vauchi-dark" ? bg3 : bg2) + ";\n";
    css += "  --md-footer-fg-color: " + fg2 + ";\n";
    css += "  --md-footer-bg-color: " + bg2 + ";\n";
    css += "  color-scheme: " + (theme.mode === "dark" ? "dark" : "light") + ";\n";
    css += "}\n";
    // Header & tabs
    css += "[data-md-color-scheme] .md-header,\n";
    css += "[data-md-color-scheme] .md-tabs {\n";
    css += "  background-color: " + bg2 + ";\n";
    css += "}\n";
    styleEl.textContent = css;

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
