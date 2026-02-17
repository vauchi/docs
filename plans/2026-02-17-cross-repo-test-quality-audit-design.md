<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Cross-Repo Test Quality Audit

**Date:** 2026-02-17
**Status:** Approved

## Goal

Review all tests across the vauchi workspace, fix tests that don't verify what they claim, and add missing tests.

## Scope

| Repo | Test Files | Approx Tests | Framework |
|---|---|---|---|
| core/ | ~134 | ~2,000 | Rust #[test], proptest, insta |
| relay/ | 10 | ~290 | Rust #[test], tokio-test |
| cli/ | 1 | ~14 | Rust #[test], assert_cmd |
| tui/ | 2 | ~134 | Rust #[test], insta |
| desktop/ | 3 | ~14 | Playwright |
| e2e/ | 9 | ~54 | Rust tokio, orchestrator |
| drift-detector/ | 8 | ~235 | Vitest |

## Approach: Parallel Per-Repo Audit

### Phase 1: Audit

Dispatch parallel agents (one per repo). Each agent reads every test file and produces a structured findings report with categories:

- **Misleading**: Test name says X but body tests Y or asserts nothing meaningful
- **Incomplete**: Correct setup but missing key assertions
- **Missing**: Public API, error path, or edge case with no test coverage

### Phase 2: Consolidation

Merge reports into a prioritized fix list by severity:

1. **Critical**: Tests that pass but don't verify what they claim (false confidence)
2. **High**: Missing tests for public APIs / security-critical paths
3. **Medium**: Incomplete assertions or missing edge cases
4. **Low**: Naming issues, style inconsistencies

### Phase 3: Fix & Add

Work through fix list repo-by-repo:

- Fix misleading/incomplete tests
- Add missing tests
- One branch per repo, commit atomically

## Out of Scope

- Refactoring production code
- Performance optimization of tests
- CI pipeline changes
- Coverage tooling setup
