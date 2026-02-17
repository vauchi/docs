<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Cross-Repo Test Quality Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Review all tests across 7 repos, fix tests that don't test what they claim, and add missing tests.

**Architecture:** Parallel audit agents scan each repo's tests for quality issues, findings are consolidated into a prioritized fix list, then fixes are applied repo-by-repo with TDD discipline.

**Tech Stack:** Rust (`cargo test`), TypeScript/Vitest (drift-detector), Playwright (desktop)

---

## Phase 1: Parallel Audit (Tasks 1-7)

All 7 tasks are independent and MUST be dispatched in parallel.

Each audit agent must check every test in its assigned repo against these criteria:

**Misleading tests** (test name promises X, body does Y):

- Test name says "test_encryption" but only checks serialization
- Test name says "test_error_handling" but only tests the happy path
- Test asserts on setup/fixture data, not on the behavior under test

**Incomplete tests** (correct intent, weak assertions):

- Uses only `assert!(result.is_ok())` without checking the Ok value
- Checks return type but not content
- No assertion at all (test that just "doesn't panic")
- Missing error case assertions

**Missing tests** (gaps in coverage):

- Public functions/methods with no test
- Error/failure paths not tested
- Edge cases (empty input, max values, concurrent access)
- Security-critical paths without dedicated tests

---

### Task 1: Audit core/ tests

**Scope:** `/Users/megloff1/Workspace/vauchi-2/core/vauchi-core/`

- All files in `tests/` (~120 files)
- All `#[cfg(test)]` modules in `src/` (~36 files)
- Focus areas: crypto, exchange protocol, sync, GDPR, storage, visibility

**Output:** Structured findings list with file path, line number, test name, category (misleading/incomplete/missing), description of issue, and suggested fix.

---

### Task 2: Audit relay/ tests

**Scope:** `/Users/megloff1/Workspace/vauchi-2/relay/`

- All files in `tests/` (9 test files + common)
- All `#[cfg(test)]` modules in `src/` (~17 files)
- Focus areas: WebSocket handling, federation, load tests, Noise protocol

**Output:** Same structured format as Task 1.

---

### Task 3: Audit cli/ tests

**Scope:** `/Users/megloff1/Workspace/vauchi-2/cli/`

- `tests/cli_integration_tests.rs`
- All `#[cfg(test)]` modules in `src/` (~2 files)
- Focus areas: command parsing, output formatting, error messages

**Output:** Same structured format as Task 1.

---

### Task 4: Audit tui/ tests

**Scope:** `/Users/megloff1/Workspace/vauchi-2/tui/`

- `tests/snapshot_tests.rs`, `tests/ui_interaction_tests.rs`
- All `#[cfg(test)]` modules in `src/` (~4 files)
- Focus areas: UI rendering, keyboard navigation, state transitions

**Output:** Same structured format as Task 1.

---

### Task 5: Audit desktop/ tests

**Scope:** `/Users/megloff1/Workspace/vauchi-2/desktop/ui/e2e/tests/`

- `app.spec.ts`, `accessibility.spec.ts`, `visual.spec.ts`
- Focus areas: Tauri IPC mocking, user flows, accessibility

**Output:** Same structured format as Task 1.

---

### Task 6: Audit e2e/ tests

**Scope:** `/Users/megloff1/Workspace/vauchi-2/e2e/`

- All files in `tests/` (9 scenario files)
- Test infrastructure in `src/`
- Focus areas: multi-user scenarios, error paths, failover

**Output:** Same structured format as Task 1.

---

### Task 7: Audit drift-detector/ tests

**Scope:** `/Users/megloff1/Workspace/vauchi-2/drift-detector/tests/`

- All 8 test files
- Focus areas: parser correctness, matching logic, database operations

**Output:** Same structured format as Task 1.

---

## Phase 2: Consolidation (Task 8)

### Task 8: Consolidate audit findings

**Step 1:** Merge all 7 audit reports into a single prioritized list.

**Step 2:** Group by severity:

1. **Critical** - Tests that pass but don't verify their claimed behavior
2. **High** - Missing tests for public APIs / security-critical paths
3. **Medium** - Incomplete assertions or missing edge cases
4. **Low** - Naming issues only

**Step 3:** Create fix tasks (Phase 3) from the consolidated findings.

---

## Phase 3: Fix & Add (Tasks 9+)

Tasks will be created dynamically based on Phase 2 findings. Each fix task will follow TDD:

1. If fixing a misleading test: rewrite the test to actually test the claimed behavior, verify it fails against current code if the behavior is wrong, or passes if behavior is correct but test was just poorly written
2. If adding a missing test: write the test first, verify it passes (since the code exists)
3. Commit atomically per logical fix group
4. One branch per repo: `chore/test-quality-audit`
