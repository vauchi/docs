<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Design: Desktop ARIA Formal Audit

**Date**: 2026-02-25
**Parent**: SP-11 Accessibility Implementation (Track 3, Phase C)
**Problem record**: `_private/docs/problems/2026-02-01-accessibility-audit/`

## Goal

Execute the desktop portion of the SP-11 formal accessibility audit. Verify that the 443 ARIA attributes across 10 SolidJS component files meet WCAG 2.1 Level A and Level AA criteria, and that all desktop-relevant scenarios from `features/accessibility.feature` have backing implementation.

## Scope

- **In scope**: `desktop/ui/src/` SolidJS frontend — ARIA attributes, roles, landmarks, live regions, form validation, focus management, color contrast
- **Out of scope**: Manual screen reader testing (VoiceOver/NVDA walkthrough), keyboard navigation UX testing, Tauri backend accessibility, iOS/Android/TUI platforms

## Approach: Automated-first audit

### Step 1: Run axe-core Playwright tests

Execute the existing 7 accessibility test cases in `desktop/ui/e2e/tests/accessibility.spec.ts`. Capture all WCAG 2.1 A/AA violations per page (Setup, Home, Contacts, Settings, Exchange, High Contrast, Reduced Motion).

### Step 2: Static ARIA completeness scan

Analyze all component files for required ARIA attribute patterns:
- Landmarks: `role="navigation"`, `role="main"`, `role="banner"`
- Dialogs: `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- Forms: `aria-invalid`, `aria-describedby` for error association
- Live regions: `aria-live="polite"` for status updates, `aria-live="assertive"` for alerts
- Lists: `role="listbox"` + `role="option"` with `aria-label` count
- Focus: `tabindex` on interactive elements, `:focus-visible` styles

### Step 3: Scenario-to-code traceability

Map each desktop-relevant scenario from `accessibility.feature` to its ARIA implementation. Mark each as: pass (implemented correctly), partial (implemented but incomplete), or fail (missing).

### Step 4: ARIA pattern correctness

Review attribute usage against WAI-ARIA Authoring Practices. Check for incorrect patterns (e.g., `role="dialog"` without `aria-labelledby`, `aria-live` on wrong element, missing `aria-expanded` on toggles).

### Step 5: Write audit report

Document all findings in `_private/docs/problems/2026-02-01-accessibility-audit/audit-report.md`.

## Report Structure

```
# Desktop ARIA Accessibility Audit Report
## Date / Auditor / Scope
## Executive Summary (pass/fail/partial counts)
## axe-core Results (per-page violations with severity)
## Scenario Coverage Matrix (desktop scenarios x implementation status)
## Findings by Severity
  ### Critical — screen reader user cannot complete a core flow
  ### Major — significant difficulty for assistive technology users
  ### Minor — suboptimal but functional
## Recommendations (prioritized fix list)
## Next Steps (manual screen reader pass with VoiceOver/NVDA)
```

## Constraints

- No manual screen reader testing in this pass (requires interactive GUI session)
- axe-core tests require the desktop app to be running (`cargo tauri dev`)
- If the app cannot be launched, the audit falls back to static analysis only (Steps 2-4)

## Success Criteria

- All 7 existing axe-core tests run and results documented
- Every desktop-relevant accessibility scenario mapped to implementation
- Audit report written with actionable findings classified by severity
- Clear list of what needs manual screen reader verification in the next pass
