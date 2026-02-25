<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Desktop ARIA Formal Audit — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Execute the desktop portion of the SP-11 formal accessibility audit — verify ARIA implementation against WCAG 2.1 AA and the 25 desktop-relevant scenarios from `features/accessibility.feature`.

**Architecture:** Automated-first audit. Run axe-core Playwright tests for WCAG violations, then static analysis of all component files, then map every desktop scenario to its implementation, then review ARIA pattern correctness. All findings written to a severity-classified audit report.

**Tech Stack:** Playwright 1.58.1, @axe-core/playwright 4.11.0, SolidJS/TypeScript, grep/analysis tooling.

---

## Desktop-Relevant Scenarios (25 of 38)

These are the scenarios from `features/accessibility.feature` that apply to the desktop platform. The remaining 13 are iOS-only, Android-only, or mobile-specific.

| # | Scenario | Tags | Feature Line |
|---|----------|------|-------------|
| S1 | Screen reader announces app structure on desktop | `@screen-reader @desktop` | 36 |
| S2 | Contact list is navigable with screen reader | `@screen-reader` | 44 |
| S3 | Contact details are fully announced | `@screen-reader` | 52 |
| S4 | QR code exchange is accessible | `@screen-reader` | 60 |
| S5 | Form fields announce validation errors | `@screen-reader` | 68 |
| S6 | Dialogs and modals are announced | `@screen-reader` | 77 |
| S7 | Loading states are announced | `@screen-reader` | 85 |
| S8 | Notifications are announced | `@screen-reader` | 93 |
| S9 | Full keyboard navigation on desktop | `@keyboard @desktop` | 104 |
| S10 | Keyboard shortcuts for common actions | `@keyboard @desktop` | 112 |
| S11 | Arrow key navigation in lists | `@keyboard @desktop` | 120 |
| S12 | Focus management during navigation | `@keyboard @desktop` | 128 |
| S13 | Sufficient color contrast | `@visual @contrast` | 148 |
| S14 | High contrast mode support | `@visual @contrast` | 154 |
| S15 | Information not conveyed by color alone | `@visual @color` | 162 |
| S16 | Text zoom support on desktop | `@visual @text-size` | 186 |
| S17 | No time-limited interactions | `@motor @timing` | 203 |
| S18 | Clear and simple language | `@cognitive @clarity` | 238 |
| S19 | Consistent navigation and layout | `@cognitive @consistency` | 244 |
| S20 | Helpful error messages | `@cognitive @errors` | 251 |
| S21 | Confirmation for destructive actions | `@cognitive @confirmation` | 258 |
| S22 | Reduced motion support | `@cognitive @focus` | 265 |
| S23 | In-app accessibility settings | `@settings` | 298 |
| S24 | Accessibility preferences persist | `@settings` | 309 |
| S25 | WCAG 2.1 AA compliance on desktop | `@desktop @requirement` | 334 |

---

## Component Files Under Audit

| File | Path | Landmarks | Labels | Live | Forms | Dialog | Interactive | Focus CSS |
|------|------|-----------|--------|------|-------|--------|-------------|-----------|
| App.tsx | `desktop/ui/src/App.tsx` | 0 | 0 | 0 | 0 | 0 | 0 | - |
| Home.tsx | `desktop/ui/src/pages/Home.tsx` | 2 | 8 | 3 | 3 | 3 | 7 | yes |
| Setup.tsx | `desktop/ui/src/pages/Setup.tsx` | 1 | 2 | 1 | 3 | 0 | 0 | yes |
| Contacts.tsx | `desktop/ui/src/pages/Contacts.tsx` | 2 | 9 | 4 | 0 | 3 | 11 | yes |
| Exchange.tsx | `desktop/ui/src/pages/Exchange.tsx` | 2 | 6 | 4 | 1 | 0 | 4 | yes |
| Settings.tsx | `desktop/ui/src/pages/Settings.tsx` | 1 | 12 | 2 | 4 | 3 | 6 | yes |
| Recovery.tsx | `desktop/ui/src/pages/Recovery.tsx` | 1 | 12 | 4 | 1 | 0 | 10 | yes |
| Devices.tsx | `desktop/ui/src/pages/Devices.tsx` | 1 | 8 | 2 | 0 | 2 | 5 | yes |
| Help.tsx | `desktop/ui/src/pages/Help.tsx` | 1 | 5 | 1 | 0 | 0 | 4 | yes |
| SupportUs.tsx | `desktop/ui/src/pages/SupportUs.tsx` | 0 | 2 | 0 | 0 | 0 | 0 | yes |
| ValidationBadge.tsx | `desktop/ui/src/components/ValidationBadge.tsx` | 0 | 3 | 0 | 0 | 0 | 2 | yes |
| **TOTAL** | | **11** | **67** | **21** | **12** | **11** | **49** | **45 rules** |

---

### Task 1: Run axe-core Playwright Tests

Run the existing 7 automated accessibility tests against the Tauri mock frontend. Capture all WCAG 2.1 violations per page.

**Files:**
- Read: `desktop/ui/e2e/tests/accessibility.spec.ts`
- Read: `desktop/ui/playwright.config.ts`

**Step 1: Install Playwright browsers if needed**

```bash
cd /Users/megloff1/Workspace/vauchi-3/desktop/ui && npx playwright install chromium
```

Expected: Browser installed or already present.

**Step 2: Run the accessibility test suite**

```bash
cd /Users/megloff1/Workspace/vauchi-3/desktop/ui && npx playwright test e2e/tests/accessibility.spec.ts --reporter=json 2>&1 | tee /tmp/axe-audit-results.json
```

Expected: 7 tests run. Capture pass/fail status and any violation details. The tests use `tauriMockScript()` to inject IPC mocks, so no Tauri backend is needed.

**Step 3: If JSON reporter doesn't capture violation details, run with verbose output**

```bash
cd /Users/megloff1/Workspace/vauchi-3/desktop/ui && npx playwright test e2e/tests/accessibility.spec.ts --reporter=list 2>&1 | tee /tmp/axe-audit-verbose.txt
```

**Step 4: Record findings**

Create a working notes file at `/tmp/audit-task1-axe-results.md` with:
- Per-page pass/fail status (Setup, Home, Contacts, Settings, Exchange)
- Any violations with axe rule ID, impact level, affected nodes
- High contrast and reduce motion test results
- Note any test infrastructure issues (timeouts, mock failures)

**Important:** The existing tests only check for `critical` impact violations (`.filter((v) => v.impact === 'critical')`). This means `serious`, `moderate`, and `minor` violations pass silently. Note this as a finding — the audit should capture ALL violation levels.

---

### Task 2: Static ARIA Completeness Scan

Systematically check each component file for required ARIA patterns. This catches gaps that axe-core cannot detect (e.g., missing live regions for dynamic content, absent keyboard handlers).

**Files:**
- Read: All 11 component files listed in the table above
- Read: `desktop/ui/src/styles/app.css` (for focus styles)

**Step 1: Check landmark coverage**

Verify each page component has these minimum landmarks:
- `role="main"` with `aria-labelledby` — **required on every page**
- `role="navigation"` on nav bars
- `role="banner"` on headers (where present)

Grep for landmark roles across all page files:

```bash
cd /Users/megloff1/Workspace/vauchi-3/desktop/ui/src && grep -n 'role="main"\|role="navigation"\|role="banner"\|role="region"\|role="complementary"\|role="contentinfo"' pages/*.tsx App.tsx
```

**Expected findings from prior inventory:**
- App.tsx: no landmarks (delegates to children) — acceptable
- SupportUs.tsx: no `role="main"` — **gap**
- main.tsx: no landmarks — acceptable (entry point only)

Record which pages have complete landmark sets and which are missing.

**Step 2: Check dialog pattern completeness**

Every dialog must have ALL of: `role="dialog"` (or `role="alertdialog"`), `aria-modal="true"`, `aria-labelledby`, `tabIndex={-1}`.

```bash
grep -n 'role="dialog"\|role="alertdialog"' pages/*.tsx | head -20
```

Cross-reference with the inventory: Home (3 dialogs), Contacts (2+1 alertdialog), Settings (3 dialogs), Devices (1 alertdialog). Verify each has all 4 required attributes.

**Step 3: Check form validation pattern**

Every text input that can show an error must have: `aria-invalid`, `aria-describedby` pointing to the error message element.

```bash
grep -n 'aria-invalid\|aria-describedby' pages/*.tsx components/*.tsx
```

Check: Home (edit field, add field), Setup (name input), Settings (name, relay URL), Exchange (scan input), Recovery (pk, vouch inputs).

**Step 4: Check live region coverage**

Every dynamic status update, error message, and loading state needs a live region (`aria-live` or `role="status"` / `role="alert"`).

```bash
grep -n 'aria-live\|role="status"\|role="alert"\|role="timer"' pages/*.tsx
```

Verify: error messages use `aria-live="assertive"` or `role="alert"`, status updates use `aria-live="polite"` or `role="status"`.

**Step 5: Check focus-visible CSS coverage**

```bash
grep -c ':focus-visible' /Users/megloff1/Workspace/vauchi-3/desktop/ui/src/styles/app.css
```

Verify high-contrast mode has enhanced focus rings:

```bash
grep -A2 'high-contrast.*focus\|focus.*high-contrast' /Users/megloff1/Workspace/vauchi-3/desktop/ui/src/styles/app.css
```

**Step 6: Record findings**

Create `/tmp/audit-task2-static-scan.md` with:
- Landmark coverage table (page × landmark type)
- Dialog completeness table (dialog × required attribute)
- Form validation coverage (input × aria-invalid × aria-describedby)
- Live region coverage (dynamic content × live region type)
- Focus style coverage (element type × :focus-visible rule)
- Gaps identified with severity classification

---

### Task 3: Scenario-to-Code Traceability

Map each of the 25 desktop-relevant scenarios to its concrete ARIA implementation. This is the core of the audit — does the code actually satisfy each feature requirement?

**Files:**
- Read: `features/accessibility.feature` (already read — use line numbers above)
- Read: All component files from Task 2
- Write: `/tmp/audit-task3-traceability.md`

**Step 1: Evaluate screen reader scenarios (S1–S8)**

For each scenario, check the specific "Then" clauses against the implementation:

**S1: Screen reader announces app structure on desktop** (line 36)
- "ARIA landmarks should identify regions" → Check `role="main"`, `role="navigation"`, `role="banner"` across all pages
- "navigate by landmarks" → Landmarks must be present and correctly nested

**S2: Contact list is navigable with screen reader** (line 44)
- "each contact announced with their name" → Check `Contacts.tsx` for `aria-label` on contact items
- "list count announced" → Check for `aria-label` with count on the list container
- "navigate between contacts" → Check `role="listitem"` and keyboard support

**S3: Contact details are fully announced** (line 52)
- "field label announced before value" → Check contact detail view for `aria-label` on fields
- "actionable fields indicate actions" → Check for `role="button"` or button elements
- "card structure logical" → Check heading hierarchy and landmark nesting

**S4: QR code exchange is accessible** (line 60)
- "QR code has accessible description" → Check `Exchange.tsx` for `aria-describedby` on QR container
- "Scan QR button clearly labeled" → Check button `aria-label`
- "instructions announced" → Check for descriptive text or `aria-describedby`

**S5: Form fields announce validation errors** (line 68)
- "error announced immediately" → Check `aria-live` or `role="alert"` on error containers
- "focus moves to first error" → Check focus management code on form submit
- "error associated with field" → Check `aria-describedby` linking input to error

**S6: Dialogs and modals are announced** (line 77)
- "dialog title announced" → Check `aria-labelledby` on all dialogs
- "dialog content read" → Check dialog has readable content structure
- "focus trapped" → Check `aria-modal="true"` and `tabIndex={-1}` + keyboard Escape handler
- "actions announced" → Check buttons inside dialogs have labels

**S7: Loading states are announced** (line 85)
- "loading state announced" → Check for `role="status" aria-live="polite"` on loading indicators
- "progress updates announced" → Check `aria-busy` usage
- "completion announced" → Check state transitions update live regions

**S8: Notifications are announced** (line 93)
- "live region" → Check `role="alert"` or `aria-live` for notification content
- "not interrupt current reading" → Should use `polite` not `assertive` (unless critical)

**Step 2: Evaluate keyboard scenarios (S9–S12)**

**S9: Full keyboard navigation** (line 104)
- "reach all interactive elements" → Check `tabindex` on custom interactive elements
- "focus visible at all times" → Check `:focus-visible` CSS rules (45 rules found)
- "tab order logical" → Check DOM order matches visual layout

**S10: Keyboard shortcuts** (line 112)
- "Ctrl+N opens exchange" → Check for keyboard shortcut handler in App.tsx or pages
- "Escape closes dialogs" → Check `onKeyDown` Escape handlers (found in Home, Contacts, Settings, Devices)
- "shortcuts documented in help" → Check Help.tsx for keyboard shortcut section

**S11: Arrow key navigation in lists** (line 120)
- "Up/Down move between contacts" → Check `onKeyDown` for ArrowUp/ArrowDown in Contacts.tsx
- "Enter opens selected" → Check Enter handler on contact items
- "Escape clears selection" → Check Escape handler

**S12: Focus management** (line 128)
- "focus moves to detail view" → Check focus management when opening contact detail
- "focus returns on close" → Check focus restore pattern (save + restore previous focus)

**Step 3: Evaluate visual scenarios (S13–S16)**

**S13: Sufficient color contrast** → Verified by axe-core (Task 1). Note any violations.

**S14: High contrast mode** → Test in Task 1 checks `data-high-contrast` attribute. Verify CSS has high-contrast overrides.

**S15: Information not by color alone** → Manual review: check status indicators, error states for icon/text alongside color.

**S16: Text zoom 200%** → Check CSS for responsive layout (`max-width`, `overflow`, no `px` on text). Note: no automated test for this currently.

**Step 4: Evaluate remaining scenarios (S17–S25)**

**S17: No time-limited interactions** → Check for any `setTimeout` on user input, session timeouts with no extend option.

**S18: Clear language** → Out of scope for automated audit (locale string review). Mark as "requires manual review."

**S19: Consistent navigation** → Check nav bar position is identical across all pages. Verify `role="navigation"` placement.

**S20: Helpful error messages** → Check error strings in components — do they explain what happened and suggest fixes?

**S21: Confirmation for destructive actions** → Check delete flows in Contacts.tsx and Settings.tsx for `role="alertdialog"`.

**S22: Reduced motion** → Test in Task 1 checks `data-reduce-motion`. Verify CSS has `prefers-reduced-motion` media query.

**S23: In-app accessibility settings** → Check Settings.tsx for accessibility section with: Reduce animations, Increase touch targets, High contrast, Screen reader hints.

**S24: Preferences persist** → Check if settings use IPC backend storage (not just localStorage). Note SP-10 #55 dependency.

**S25: WCAG 2.1 AA compliance** → Composite result from axe-core (Task 1) + static analysis (Task 2).

**Step 5: Record traceability matrix**

Write `/tmp/audit-task3-traceability.md` with a table:

| Scenario | Status | Evidence | Gaps |
|----------|--------|----------|------|
| S1 | PASS/PARTIAL/FAIL | Files and line numbers | What's missing |
| ... | | | |

---

### Task 4: ARIA Pattern Correctness Review

Review the ARIA attributes for correctness against WAI-ARIA Authoring Practices. This catches "technically present but wrongly used" patterns.

**Files:**
- Read: Component files with identified patterns from Task 2–3

**Step 1: Dialog pattern review**

For each dialog, verify the complete pattern:
```
role="dialog" (or "alertdialog" for confirmations)
aria-modal="true"
aria-labelledby="<id>" → verify the referenced ID exists as a heading inside the dialog
tabIndex={-1} → programmatic focus management
onKeyDown Escape → closes dialog
Focus trap → keyboard cannot Tab outside dialog
```

Check each dialog in: Home.tsx (3), Contacts.tsx (3), Settings.tsx (3), Devices.tsx (1).

**Step 2: Live region pattern review**

Verify live regions follow correct patterns:
- `role="alert"` = implicit `aria-live="assertive"` → should NOT also have `aria-live` (redundant but harmless)
- `role="status"` = implicit `aria-live="polite"` → same
- Loading indicators: should have `aria-busy="true"` while loading, removed when done
- Timer: `role="timer"` with `aria-atomic="true"` → verify in Exchange.tsx countdown

**Step 3: Form validation pattern review**

Verify inputs follow the complete pattern:
```
<input aria-invalid={hasError} aria-describedby="error-id" aria-required={isRequired} />
<span id="error-id" role="alert">{errorMessage}</span>
```

Check that `aria-describedby` IDs actually match existing element IDs in the DOM.

**Step 4: Listbox/option pattern review**

If any component uses `role="listbox"` with `role="option"`, verify:
- `aria-activedescendant` for current selection
- `aria-selected` on options
- Keyboard: Up/Down to navigate, Enter to select

Check Contacts.tsx contact list and Settings.tsx theme grid (`role="radiogroup"` / `role="radio"`).

**Step 5: Navigation landmark pattern review**

Verify:
- Multiple `role="navigation"` elements each have unique `aria-label`
- `role="main"` appears exactly once per page
- No nested landmarks of the same type

**Step 6: Record findings**

Write `/tmp/audit-task4-pattern-review.md` with:
- Pattern compliance table (pattern × component × compliant/issue)
- Specific issues found with line numbers
- Severity classification for each issue

---

### Task 5: Write Audit Report

Synthesize findings from Tasks 1–4 into the formal audit report.

**Files:**
- Read: `/tmp/audit-task1-axe-results.md`
- Read: `/tmp/audit-task2-static-scan.md`
- Read: `/tmp/audit-task3-traceability.md`
- Read: `/tmp/audit-task4-pattern-review.md`
- Create: `_private/docs/problems/2026-02-01-accessibility-audit/audit-report.md`

**Step 1: Write the report**

Create `_private/docs/problems/2026-02-01-accessibility-audit/audit-report.md` with this structure:

```markdown
# Desktop ARIA Accessibility Audit Report

**Date**: 2026-02-25
**Auditor**: Claude (automated) + manual review
**Scope**: desktop/ui/src/ — 11 SolidJS component files, 443 ARIA attributes
**Standard**: WCAG 2.1 Level A and Level AA
**Parent**: SP-11 Accessibility Implementation

## Executive Summary

- **Scenarios audited**: 25 of 38 (desktop-relevant)
- **PASS**: X scenarios
- **PARTIAL**: X scenarios
- **FAIL**: X scenarios
- **axe-core violations**: X critical, X serious, X moderate, X minor

## 1. axe-core Automated Results

[Per-page table from Task 1]

## 2. ARIA Completeness Analysis

[Tables from Task 2: landmarks, dialogs, forms, live regions, focus styles]

## 3. Scenario Coverage Matrix

[25-row table from Task 3]

## 4. ARIA Pattern Correctness

[Findings from Task 4]

## 5. Findings by Severity

### Critical
[Findings that block screen reader users from completing core flows]

### Major
[Findings that cause significant difficulty]

### Minor
[Suboptimal but functional issues]

## 6. Recommendations

[Prioritized fix list with effort estimates]

## 7. Next Steps

- Manual VoiceOver walkthrough on macOS (requires interactive session)
- Manual NVDA testing if Windows available
- Keyboard navigation UX testing (Tab order, shortcuts, focus restore)
- Text zoom 200% visual verification
- Locale string clarity review (S18)
```

**Step 2: Update problem record status**

Read `_private/docs/problems/2026-02-01-accessibility-audit/README.md` and update the status from `planning` to `implementing` (or `testing` if this was the last audit phase).

**Step 3: Commit the report**

```bash
cd /Users/megloff1/Workspace/vauchi-3/_private && git add docs/problems/2026-02-01-accessibility-audit/audit-report.md docs/problems/2026-02-01-accessibility-audit/README.md && git commit -m "docs: desktop ARIA formal audit report (SP-11)

Automated audit of 11 SolidJS components against 25 desktop-relevant
accessibility scenarios. axe-core WCAG 2.1 AA + static ARIA analysis
+ scenario traceability + pattern correctness review.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

**Step 4: Clean up working files**

```bash
rm /tmp/audit-task1-axe-results.md /tmp/audit-task2-static-scan.md /tmp/audit-task3-traceability.md /tmp/audit-task4-pattern-review.md
```
