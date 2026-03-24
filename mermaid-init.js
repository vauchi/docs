// SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
// SPDX-License-Identifier: GPL-3.0-or-later

// Mermaid initialization with Vauchi theme colors and accessibility.
// Uses 'base' theme with themeVariables mapped from CSS custom properties.
(() => {
    if (typeof mermaid === 'undefined') return;

    // Read current Vauchi theme colors from CSS variables
    var root = getComputedStyle(document.documentElement);
    function v(name, fallback) {
        return (root.getPropertyValue(name) || fallback).trim();
    }

    var isDark = document.documentElement.classList.contains('coal') ||
                 document.documentElement.classList.contains('navy') ||
                 document.documentElement.classList.contains('ayu');

    // Map Vauchi theme tokens to mermaid themeVariables
    mermaid.initialize({
        startOnLoad: true,
        theme: 'base',
        themeVariables: {
            // Core colors from our theme
            background: v('--bg', isDark ? '#1a1a2e' : '#ffffff'),
            primaryColor: v('--sidebar-bg', isDark ? '#16213e' : '#f5f5f5'),
            primaryTextColor: v('--fg', isDark ? '#eeeeee' : '#212121'),
            primaryBorderColor: v('--table-border-color', isDark ? '#333333' : '#e0e0e0'),
            lineColor: v('--icons', isDark ? '#a0a0a0' : '#757575'),
            secondaryColor: v('--theme-popup-bg', isDark ? '#0f3460' : '#e0e0e0'),
            tertiaryColor: v('--quote-bg', isDark ? '#0f3460' : '#e0e0e0'),

            // Text
            textColor: v('--fg', isDark ? '#eeeeee' : '#212121'),
            secondaryTextColor: v('--icons', isDark ? '#a0a0a0' : '#757575'),

            // Notes
            noteBkgColor: v('--theme-popup-bg', isDark ? '#0f3460' : '#e0e0e0'),
            noteTextColor: v('--fg', isDark ? '#eeeeee' : '#212121'),
            noteBorderColor: v('--table-border-color', isDark ? '#333333' : '#e0e0e0'),

            // Actor (sequence diagram participants)
            actorBkg: v('--sidebar-bg', isDark ? '#16213e' : '#f5f5f5'),
            actorTextColor: v('--fg', isDark ? '#eeeeee' : '#212121'),
            actorBorder: v('--links', isDark ? '#4fc3f7' : '#1976d2'),
            actorLineColor: v('--icons', isDark ? '#a0a0a0' : '#757575'),

            // Signals / messages
            signalColor: v('--fg', isDark ? '#eeeeee' : '#212121'),
            signalTextColor: v('--fg', isDark ? '#eeeeee' : '#212121'),

            // Labels
            labelBoxBkgColor: v('--sidebar-bg', isDark ? '#16213e' : '#f5f5f5'),
            labelBoxBorderColor: v('--table-border-color', isDark ? '#333333' : '#e0e0e0'),
            labelTextColor: v('--fg', isDark ? '#eeeeee' : '#212121'),

            // Activation bars
            activationBkgColor: v('--links', isDark ? '#4fc3f7' : '#1976d2'),
            activationBorderColor: v('--table-border-color', isDark ? '#333333' : '#e0e0e0'),

            // Loop boxes
            loopTextColor: v('--fg', isDark ? '#eeeeee' : '#212121'),

            // Font
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
        },

        // Accessibility
        ariaRoleDescription: 'diagram',

        // Sequence diagram specific
        sequence: {
            actorMargin: 80,
            messageMargin: 40,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageAlign: 'center',
            mirrorActors: true,
            bottomMarginAdj: 2,
            useMaxWidth: true,
            rightAngles: false,
            showSequenceNumbers: true,
            wrap: true,
            wrapPadding: 10,
        },

        // Flowchart specific
        flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
            padding: 15,
        },
    });
})();
