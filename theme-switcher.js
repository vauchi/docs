// SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
// SPDX-License-Identifier: GPL-3.0-or-later

// Vauchi docs theme switcher — mirrors the website's theme-picker.js.
// Fetches themes.json from CDN, builds grouped picker with swatches,
// adds light/dark quick toggle and GitLab link.
//
// Works WITH mdBook's theme system by setting localStorage['mdbook-theme']
// and re-applying CSS vars after mdBook's dynamic page navigation.
(function () {
  var THEME_KEY = "vauchi-docs-theme";
  var MDBOOK_KEY = "mdbook-theme";
  var THEMES_URL = "https://cdn.vauchi.app/v1/themes/themes.json";
  var themes = [];
  var currentIdx = -1;

  var TOKEN_NAMES = [
    "bg-primary", "bg-secondary", "bg-tertiary",
    "text-primary", "text-secondary",
    "accent", "accent-dark", "success", "error", "warning", "border",
  ];

  var MDBOOK_MAP = {
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

    // 1. Set CSS custom properties (our tokens)
    for (var i = 0; i < TOKEN_NAMES.length; i++) {
      var val = resolveColor(theme, TOKEN_NAMES[i]);
      if (val) root.style.setProperty("--" + TOKEN_NAMES[i], val);
    }

    // 2. Map to mdBook's CSS variables
    for (var token in MDBOOK_MAP) {
      var val = resolveColor(theme, token);
      if (val) {
        var vars = MDBOOK_MAP[token];
        for (var j = 0; j < vars.length; j++) root.style.setProperty(vars[j], val);
      }
    }
    var tp = resolveColor(theme, "text-primary");
    if (tp) root.style.setProperty("--icons-hover", tp);

    // 3. Tell mdBook which base theme to use (prevents it from overriding us)
    var mdTheme = theme.mode === "dark" ? "coal" : "light";
    try { localStorage.setItem(MDBOOK_KEY, mdTheme); } catch (e) {}

    // 4. Update mdBook's class (for code highlighting CSS)
    root.className = root.className.replace(/\b(coal|light|rust|navy|ayu)\b/g, "").trim();
    root.classList.add(mdTheme);

    updateUI(theme);
  }

  function updateUI(theme) {
    // Mode toggle icon
    var modeBtn = document.getElementById("vauchi-mode-toggle");
    if (modeBtn) {
      modeBtn.textContent = theme.mode === "dark" ? "\uD83C\uDF19" : "\u2600\uFE0F";
      modeBtn.title = theme.mode === "dark" ? "Switch to light" : "Switch to dark";
    }
    // Active item highlight
    var items = document.querySelectorAll("[data-theme-id]");
    for (var i = 0; i < items.length; i++) {
      var active = themes[currentIdx] && items[i].getAttribute("data-theme-id") === themes[currentIdx].id;
      items[i].style.fontWeight = active ? "600" : "normal";
      items[i].style.background = active ? "var(--bg-tertiary, var(--theme-popup-bg))" : "transparent";
    }
  }

  function save(id) { try { localStorage.setItem(THEME_KEY, id); } catch (e) {} }
  function load() { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } }
  function prefersDark() { return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; }

  function findById(id) {
    for (var i = 0; i < themes.length; i++) if (themes[i].id === id) return i;
    return -1;
  }

  function findDefault() {
    var mode = prefersDark() ? "dark" : "light";
    for (var i = 0; i < themes.length; i++) if (themes[i].id === "default-" + mode) return i;
    return 0;
  }

  function selectTheme(idx) {
    currentIdx = idx;
    applyTheme(themes[idx]);
    save(themes[idx].id);
  }

  function toggleDarkLight() {
    var cur = themes[currentIdx];
    var pid = (cur && THEME_PAIRS[cur.id]) || (cur && cur.mode === "dark" ? "default-light" : "default-dark");
    var idx = findById(pid);
    if (idx >= 0) selectTheme(idx);
  }

  // --- Build UI (matches website: moon/sun toggle + palette dropdown) ---

  function createItem(theme, idx) {
    var btn = document.createElement("button");
    btn.setAttribute("data-theme-id", theme.id);
    btn.style.cssText = "display:flex;align-items:center;gap:8px;width:100%;padding:6px 12px;border:none;background:transparent;color:var(--fg,var(--text-primary));cursor:pointer;font-size:0.8rem;text-align:left;font-family:inherit";
    var swatch = document.createElement("span");
    swatch.style.cssText = "width:14px;height:14px;border-radius:50%;flex-shrink:0;border:1px solid var(--table-border-color, #333)";
    swatch.style.background = resolveColor(theme, "accent") || "#4fc3f7";
    btn.appendChild(swatch);
    btn.appendChild(document.createTextNode(theme.name));
    btn.addEventListener("click", function () { selectTheme(idx); togglePopup(false); });
    btn.addEventListener("mouseenter", function () {
      if (!themes[currentIdx] || theme.id !== themes[currentIdx].id) btn.style.background = "var(--bg-tertiary, var(--theme-popup-bg))";
    });
    btn.addEventListener("mouseleave", function () {
      var a = themes[currentIdx] && theme.id === themes[currentIdx].id;
      btn.style.background = a ? "var(--bg-tertiary)" : "transparent";
    });
    return btn;
  }

  function buildPopup() {
    var list = document.getElementById("theme-list");
    if (!list) return;

    // Clear mdBook's default buttons
    while (list.firstChild) list.removeChild(list.firstChild);
    list.style.cssText = "min-width:200px;max-height:70vh;overflow-y:auto;padding:4px 0";

    // Dark section header
    var dh = document.createElement("div");
    dh.style.cssText = "padding:4px 12px;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--icons,#999);opacity:0.7";
    dh.textContent = "Dark";
    list.appendChild(dh);

    for (var i = 0; i < themes.length; i++) {
      if (themes[i].mode === "dark") list.appendChild(createItem(themes[i], i));
    }

    // Separator + Light header
    var sep = document.createElement("div");
    sep.style.cssText = "margin:4px 0;border-top:1px solid var(--table-border-color, #333)";
    list.appendChild(sep);
    var lh = document.createElement("div");
    lh.style.cssText = "padding:4px 12px;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--icons,#999);opacity:0.7";
    lh.textContent = "Light";
    list.appendChild(lh);

    for (var i = 0; i < themes.length; i++) {
      if (themes[i].mode === "light") list.appendChild(createItem(themes[i], i));
    }
  }

  var popupOpen = false;
  function togglePopup(force) {
    popupOpen = typeof force === "boolean" ? force : !popupOpen;
    var list = document.getElementById("theme-list");
    if (list) list.style.display = popupOpen ? "block" : "none";
    var btn = document.getElementById("theme-toggle");
    if (btn) btn.setAttribute("aria-expanded", String(popupOpen));
  }

  function setupUI() {
    var buttons = document.querySelector(".right-buttons");
    if (!buttons) return;

    // Replace paint-brush with palette emoji
    var themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      var icon = themeToggle.querySelector("i");
      if (icon) { icon.className = ""; icon.style.fontStyle = "normal"; icon.textContent = "\uD83C\uDFA8"; }
    }

    // Add moon/sun toggle next to theme toggle (in its actual parent)
    if (!document.getElementById("vauchi-mode-toggle")) {
      var modeBtn = document.createElement("button");
      modeBtn.id = "vauchi-mode-toggle";
      modeBtn.type = "button";
      modeBtn.className = "icon-button";
      modeBtn.setAttribute("aria-label", "Toggle dark/light mode");
      modeBtn.style.cssText = "background:none;border:none;cursor:pointer;font-size:18px;padding:4px 8px;color:var(--icons,#999)";
      modeBtn.textContent = "\uD83C\uDF19";
      modeBtn.addEventListener("click", function (e) { e.stopPropagation(); toggleDarkLight(); });
      // Insert in the same parent as theme-toggle (may be left-buttons or right-buttons)
      var toggleParent = themeToggle ? themeToggle.parentElement : buttons;
      try { toggleParent.insertBefore(modeBtn, themeToggle); } catch (e) { toggleParent.appendChild(modeBtn); }
    }

    // Add GitLab link (if not already added)
    if (!document.getElementById("vauchi-gitlab-link")) {
      var gitBtn = document.getElementById("git-repository-button");
      if (gitBtn) {
        var gitLink = gitBtn.closest("a") || gitBtn.parentElement;
        if (gitLink && gitLink.parentElement) {
          var gl = document.createElement("a");
          gl.id = "vauchi-gitlab-link";
          gl.href = "https://gitlab.com/vauchi/docs";
          gl.target = "_blank"; gl.rel = "noopener";
          gl.className = "icon-button";
          gl.title = "GitLab"; gl.setAttribute("aria-label", "GitLab");
          gl.style.cssText = "color:var(--icons);text-decoration:none";
          var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("viewBox", "0 0 24 24");
          svg.style.cssText = "width:15px;height:15px;fill:currentColor;vertical-align:middle";
          var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", "m23.6 9.593-.033-.086L20.3 1.01a.851.851 0 0 0-.336-.405.877.877 0 0 0-.994.03.882.882 0 0 0-.29.44l-2.204 6.748H7.538L5.334 1.075a.857.857 0 0 0-.29-.441.877.877 0 0 0-.994-.03.86.86 0 0 0-.336.405L.433 9.502l-.032.086a6.066 6.066 0 0 0 2.012 7.01l.012.009.03.022 4.982 3.73 2.464 1.865 1.5 1.134a1.01 1.01 0 0 0 1.22 0l1.5-1.134 2.465-1.865 5.012-3.752.013-.01a6.072 6.072 0 0 0 2.009-7.004");
          svg.appendChild(path); gl.appendChild(svg);
          try { gitLink.parentElement.insertBefore(gl, gitLink.nextSibling); } catch (e) { gitLink.parentElement.appendChild(gl); }
        }
      }
    }

    // Close popup on outside click
    document.removeEventListener("click", outsideClick);
    document.addEventListener("click", outsideClick);
  }

  function outsideClick(e) {
    if (!popupOpen) return;
    var list = document.getElementById("theme-list");
    var toggle = document.getElementById("theme-toggle");
    if (list && !list.contains(e.target) && e.target !== toggle) togglePopup(false);
  }

  // --- Re-apply after mdBook's dynamic page navigation ---
  function reapplyCurrentTheme() {
    if (currentIdx >= 0 && themes[currentIdx]) applyTheme(themes[currentIdx]);
  }

  // mdBook swaps page content dynamically; hook into its URL change
  var lastUrl = location.href;
  new MutationObserver(function () {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      // Small delay: let mdBook finish its DOM update first
      setTimeout(reapplyCurrentTheme, 50);
    }
  }).observe(document, { subtree: true, childList: true });

  // --- System theme change ---
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if (!load()) { currentIdx = findDefault(); if (currentIdx >= 0) selectTheme(currentIdx); }
    });
  }

  // --- Init ---
  function init() {
    setupUI();

    var xhr = new XMLHttpRequest();
    xhr.open("GET", THEMES_URL, true);
    xhr.timeout = 3000;
    xhr.onload = function () {
      if (xhr.status !== 200) return;
      try { themes = JSON.parse(xhr.responseText); } catch (e) { return; }
      buildPopup();
      var saved = load();
      if (saved) currentIdx = findById(saved);
      if (currentIdx < 0) currentIdx = findDefault();
      if (currentIdx >= 0) selectTheme(currentIdx);
    };
    xhr.onerror = xhr.ontimeout = function () {};
    xhr.send();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
