// SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
// SPDX-License-Identifier: GPL-3.0-or-later

// Click-to-enlarge for ASCII diagrams emitted by mdbook-beautiful-mermaid.mjs.
//
// The diagrams run far wider than the content column (median 116 columns,
// widest 236, column fits ~89), so the inline block is scaled down to a
// legible-shape preview and the full-size diagram opens in an overlay.
// Everything degrades to a plain scrolling code block without JS.
(() => {
    'use strict';

    var MIN_PREVIEW_PX = 5.5;   // below this the shape stops reading at all
    var MAX_PREVIEW_PX = 13;    // never enlarge past a normal code block
    var OVERLAY_STEPS = [7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 22];
    var overlay = null;
    var lastFocused = null;

    function diagrams() {
        return Array.prototype.slice.call(
            document.querySelectorAll('pre > code.language-ascii-diagram')
        );
    }

    // The description the preprocessor emitted from accTitle/accDescr, if any.
    function describe(figure) {
        var prev = figure.previousElementSibling;
        if (prev && prev.classList.contains('ascii-diagram-desc')) {
            return {
                title: prev.getAttribute('data-ascii-title') || '',
                descr: prev.textContent || ''
            };
        }
        return { title: '', descr: '' };
    }

    function headingFor(figure) {
        var node = figure;
        while (node) {
            if (node.tagName && /^H[1-6]$/.test(node.tagName)) {
                return node.textContent.trim();
            }
            node = node.previousElementSibling;
        }
        return '';
    }

    function label(figure) {
        var meta = describe(figure);
        return meta.title || headingFor(figure) || 'Diagram';
    }

    // Scale the preview so the widest line fits the column. Measured rather
    // than computed from column count: the font's actual advance width is the
    // only thing that decides whether it fits.
    function fit(figure) {
        var code = figure.querySelector('code');
        var pre = figure.querySelector('pre');
        if (!code || !pre) return;

        figure.style.setProperty('--ascii-font-size', MAX_PREVIEW_PX + 'px');
        var style = window.getComputedStyle(pre);
        var available = pre.clientWidth
            - parseFloat(style.paddingLeft || 0)
            - parseFloat(style.paddingRight || 0);
        var natural = code.scrollWidth;
        if (available <= 0 || !natural) return;

        var size = MAX_PREVIEW_PX * (available / natural);
        size = Math.max(MIN_PREVIEW_PX, Math.min(MAX_PREVIEW_PX, size));
        figure.style.setProperty('--ascii-font-size', size.toFixed(2) + 'px');

        // The widest diagram here is 236 columns and does not fit even at the
        // minimum size. Clipping it with no scrollbar would silently drop the
        // right-hand side, so let that case scroll as it did before.
        figure.classList.toggle('is-overflowing', code.scrollWidth > available + 1);

        // A diagram can also be very tall (some run 170 rows); cap it and let
        // the mask signal the cut.
        figure.classList.toggle('is-clipped', code.scrollHeight > pre.clientHeight + 2);
    }

    function buildOverlay() {
        var el = document.createElement('div');
        el.className = 'ascii-overlay';
        el.hidden = true;
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.innerHTML =
            '<div class="ascii-overlay-panel">' +
            '<div class="ascii-overlay-bar">' +
            '<span class="ascii-overlay-title"></span>' +
            '<button type="button" data-act="out" aria-label="Zoom out">&minus;</button>' +
            '<button type="button" data-act="in" aria-label="Zoom in">+</button>' +
            '<button type="button" data-act="close" aria-label="Close diagram">&times;</button>' +
            '</div>' +
            '<div class="ascii-overlay-body"><pre><code></code></pre></div>' +
            '</div>';

        el.addEventListener('click', function (e) {
            var act = e.target.getAttribute && e.target.getAttribute('data-act');
            if (act === 'close' || e.target === el) return close();
            if (act === 'in') return zoom(1);
            if (act === 'out') return zoom(-1);
        });

        document.body.appendChild(el);
        return el;
    }

    function zoom(direction) {
        var body = overlay.querySelector('.ascii-overlay-body');
        var current = parseFloat(body.style.getPropertyValue('--ascii-overlay-font-size')) || 13;
        var i = OVERLAY_STEPS.indexOf(current);
        if (i === -1) {
            i = OVERLAY_STEPS.reduce(function (best, v, idx) {
                return Math.abs(v - current) < Math.abs(OVERLAY_STEPS[best] - current) ? idx : best;
            }, 0);
        }
        var next = OVERLAY_STEPS[Math.max(0, Math.min(OVERLAY_STEPS.length - 1, i + direction))];
        body.style.setProperty('--ascii-overlay-font-size', next + 'px');
    }

    // Pick the largest size that shows the whole diagram, so the overlay opens
    // fitted rather than at an arbitrary zoom the reader has to correct.
    function fitOverlay(columns) {
        var body = overlay.querySelector('.ascii-overlay-body');
        var available = body.clientWidth - 32;
        var chosen = OVERLAY_STEPS[0];
        for (var i = 0; i < OVERLAY_STEPS.length; i++) {
            // 0.6em is the advance width of the monospace stack in use.
            if (columns * OVERLAY_STEPS[i] * 0.6 <= available) chosen = OVERLAY_STEPS[i];
        }
        body.style.setProperty('--ascii-overlay-font-size', chosen + 'px');
    }

    function open(figure) {
        if (!overlay) overlay = buildOverlay();
        var text = figure.querySelector('code').textContent;
        var meta = describe(figure);

        overlay.querySelector('.ascii-overlay-title').textContent = label(figure);
        overlay.querySelector('.ascii-overlay-body code').textContent = text;
        overlay.setAttribute('aria-label', meta.descr || label(figure));

        lastFocused = document.activeElement;
        overlay.hidden = false;
        document.body.classList.add('ascii-overlay-open');

        var columns = text.split('\n').reduce(function (max, line) {
            return Math.max(max, line.length);
        }, 0);
        fitOverlay(columns);
        overlay.querySelector('[data-act="close"]').focus();
    }

    function close() {
        if (!overlay || overlay.hidden) return;
        overlay.hidden = true;
        document.body.classList.remove('ascii-overlay-open');
        if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function enhance(code) {
        var pre = code.parentElement;
        if (!pre || !pre.parentElement) return;

        var figure = document.createElement('figure');
        figure.className = 'ascii-diagram is-interactive';
        figure.setAttribute('tabindex', '0');
        figure.setAttribute('role', 'button');
        pre.parentElement.insertBefore(figure, pre);
        figure.appendChild(pre);

        var meta = describe(figure);
        var name = label(figure);
        figure.setAttribute('aria-label', 'Enlarge diagram: ' + name);
        // ASCII art read character by character is noise; the description
        // carries the meaning, so keep the art itself out of the a11y tree.
        pre.setAttribute('role', 'img');
        pre.setAttribute('aria-label', meta.descr || name);

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'ascii-diagram-expand';
        button.textContent = '⤢ Expand';
        button.setAttribute('aria-label', 'Enlarge diagram: ' + name);
        figure.appendChild(button);

        figure.addEventListener('click', function () { open(figure); });
        figure.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open(figure);
            }
        });

        fit(figure);
        return figure;
    }

    function init() {
        var figures = diagrams().map(enhance).filter(Boolean);
        if (!figures.length) return;

        // Web fonts change the advance width, so re-fit once they settle.
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { figures.forEach(fit); });
        }

        var timer;
        window.addEventListener('resize', function () {
            clearTimeout(timer);
            timer = setTimeout(function () { figures.forEach(fit); }, 120);
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') close();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
