<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

<!-- SSOT: This is the single source of truth for TDD rules -->
# TDD Rules

## Three Laws

1. **No production code without a failing test**
2. **Write only enough test to fail**
3. **Write only enough code to pass**

## Tidy-Red-Green-Refactor-Commit

```
TIDY     → Small structural improvement  → COMMIT (no behavior change)
RED      → Write failing test
GREEN    → Minimal code to pass          → COMMIT (tests green)
REFACTOR → Improve design                → COMMIT (tests still green)
```

Inspired by Kent Beck's *Tidy First?*: make the change easy, then make the easy change.

**TIDY** is an optional pre-step before starting a Red-Green cycle. A tidying is a
small, structural-only change that makes the upcoming work easier — guard clauses,
extract helper, rename for clarity, reorder for readability, delete dead code.
Tidyings never change behavior and always get their own commit (`tidy:` type).

**When to tidy:**

| Timing | Guidance |
|--------|----------|
| **Tidy First** | Default. The code you're about to change is hard to read or extend |
| **Tidy After** | You understand the shape of the change better after implementing |
| **Tidy Later** | Batch structural cleanup into a separate branch/MR |
| **Never** | Code works, won't change again, and is readable enough |

**Commit early, commit often:**

- Commit tidyings separately before the RED step (`tidy:` commit)
- Commit immediately after GREEN (tests pass for the first time)
- Commit after each REFACTOR cycle (if tests still pass)
- Small, atomic commits make rollback and review easier
- Never commit with failing tests

## Tidying Catalog

Small, safe, structural-only changes (from *Tidy First?*):

| Tidying | What it does |
|---------|-------------|
| Guard Clauses | Replace nested `if`/`match` with early returns |
| Dead Code | Delete unreachable or unused code |
| Normalize Symmetries | Make similar code use consistent patterns |
| New Interface, Old Implementation | Wrap before replacing internals |
| Reading Order | Reorder declarations top-down |
| Cohesion Order | Group related items together |
| Move Declaration and Initialization Together | Close the gap between `let` and first use |
| Explaining Variables | Name intermediate results |
| Explaining Constants | Replace magic numbers with named constants |
| Explicit Parameters | Pass values instead of relying on ambient state |
| Chunk Statements | Add blank lines between logical blocks |
| Extract Helper | Pull reusable logic into a function |
| One Pile | Inline before re-extracting with better structure |
| Explaining Comments | Add "why" comments where intent isn't obvious |
| Delete Redundant Comments | Remove comments that repeat the code |

## Test Types

| Type | Scope | Speed | Coverage |
|------|-------|-------|----------|
| Unit | Single function | < 100ms | 90% min |
| Integration | Multiple components | < 5s | Critical paths |
| E2E | Full system | < 60s | All Gherkin scenarios |

## Naming

```
test_<function>_<scenario>_<expected>

Examples:
- test_encrypt_valid_key_returns_ciphertext
- test_decrypt_wrong_key_fails
```

## Critical Rules

**Crypto** - Never mock. Test with real crypto:

- Roundtrip (encrypt/decrypt, sign/verify)
- Wrong key rejection
- Tampered data rejection

**Gherkin** - Every scenario in `features/` must have a test.

**Coverage** - 90% minimum for vauchi-core.

## Forbidden

- Writing code before tests
- Mocking crypto operations
- `#[ignore]` without tracking issue
- Flaky/non-deterministic tests
- Hardcoded test secrets

## Mocking Strategy

| Component | Approach |
|-----------|----------|
| Crypto | Real (never mock) |
| Network | Mock transport |
| Storage | In-memory DB |
| Time | Mockable clock |

## PR Checklist

- [ ] Structural tidyings in separate `tidy:` commits (if any)
- [ ] Tests written before code
- [ ] All Gherkin scenarios covered
- [ ] No ignored tests
- [ ] Coverage ≥ 90%
- [ ] Crypto has security tests
