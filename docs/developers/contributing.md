<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

<!-- SSOT: This is the single source of truth for contribution guidelines -->
# Contributing to Vauchi

## Quick Start

```bash
# Clone and setup workspace
git clone https://github.com/vauchi/vauchi.git
# or: git clone git@gitlab.com:vauchi/vauchi.git
cd vauchi
just setup

# Build and test
just build
just check
```

## Development Workflow

All repos have protected `main` branches — no direct pushes, merge via MR only, force push disabled.

### Step 1: Create a branch

```bash
git checkout -b feature/my-feature
```

Branch naming: `{type}/{short-description}`

| Type | Use Case |
|------|----------|
| `feature/` | New functionality |
| `bugfix/` | Bug fixes |
| `refactor/` | Code restructuring |
| `investigation/` | Research/exploration |

For **multi-repo features**, use the **same branch name** in every affected repo:

```bash
git -C features checkout -b feature/remote-content-updates
git -C core checkout -b feature/remote-content-updates
git -C docs checkout -b feature/remote-content-updates
```

### Step 2: Do the work — commit often

- **If changing code: strict TDD.** Red → Green → Refactor. No exceptions.
  1. Write failing test first (Red)
  2. Write minimal code to pass (Green)
  3. Refactor
  4. Tests must trace to `features/*.feature` scenarios
- Commit atomically — each commit should be a single logical change.
- Run `just check` before pushing (formats, lints, tests).
- See [Principles](../about/principles.md) for core values.

Commit message format:

```
{type}: {Short description}

{Longer description if needed}
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

Use imperative mood: "Add feature" not "Added feature". Keep first line under 72 characters.

Use `just commit` for interactive commits across all repos with changes.

### Step 3: Create a Merge Request

```bash
git push -u origin feature/my-feature \
  -o merge_request.create \
  -o merge_request.target=main \
  -o merge_request.title="feat: My feature"
```

CI must pass (security scans + tests) before merge.

If the work spans multiple repos, each MR **must list the related MRs** it depends on:

```markdown
## Summary
- Bullet points of changes

## Related MRs
- vauchi/features!42 - Gherkin specs
- vauchi/core!78 - Implementation

## Test Plan
- [ ] Tests pass
- [ ] Manual testing done

## Checklist
- [ ] Follows TDD
- [ ] Documentation updated
- [ ] Feature file updated (if applicable)
```

Use GitLab MR reference format: `{group}/{project}!{mr_number}`

## Code Guidelines

### Rust

- Use `ring` crate for all cryptography
- Never mock crypto in tests
- 90%+ test coverage for vauchi-core
- Use `Result`/`Option`, fail fast

### Structure

```
crate/
├── src/      # Production code only
└── tests/    # Integration tests only
```

## Mobile Bindings Workflow

UniFFI generates Swift/Kotlin bindings from Rust. When modifying `vauchi-mobile` or `vauchi-core`:

### When to Regenerate Bindings

Regenerate bindings when you:

- Add/remove/rename exported types or functions
- Change function signatures
- Add new `#[uniffi::export]` or `#[derive(uniffi::*)]` annotations

### How to Regenerate

```bash
cd core

# IMPORTANT: Build without symbol stripping to preserve metadata
RUSTFLAGS="-Cstrip=none" cargo build -p vauchi-mobile --release

# Regenerate for both platforms (macOS required for iOS)
./scripts/build-bindings.sh

# Or regenerate Android only (works on Linux)
./scripts/build-bindings.sh --android

# Validate bindings have all expected types
./scripts/validate-bindings.sh
```

### Common Issues

**Empty or incomplete bindings:**

- Cause: Library built with symbol stripping (default in release)
- Fix: Use `RUSTFLAGS="-Cstrip=none"` when building

**Missing types in generated code:**

- Run `validate-bindings.sh` to check expected types
- Regenerate with the steps above

## Repository Organisation

This is a multi-repo project under the [`vauchi` GitLab group](https://gitlab.com/vauchi). The root repo (`vauchi/vauchi`) is the workspace orchestrator — `just setup` clones all sub-repos as sibling directories. Each subdirectory is its own Git repo at `gitlab.com/vauchi/<name>`.

```
vauchi/                          ← root repo (justfile, CI config)
│
├── core/                        ← Rust workspace: vauchi-core + vauchi-mobile (UniFFI)
├── relay/                       ← WebSocket relay server (standalone Rust)
├── cli/                         ← Command-line interface
├── tui/                         ← Terminal user interface
├── desktop/                     ← Tauri + SolidJS desktop app
│
├── android/                     ← Kotlin/Compose native app
├── ios/                         ← SwiftUI native app
├── vauchi-mobile-android/       ← Generated Kotlin bindings + JNI libs (Gradle distribution)
├── vauchi-mobile-swift/         ← Generated Swift bindings + XCFramework (SPM distribution)
│
├── e2e/                         ← End-to-end tests
├── features/                    ← Gherkin specs (shared across all platforms)
│
├── docs/                        ← Public documentation (this site)
├── scripts/                     ← Dev tools, hooks, utilities
├── website/                     ← Landing page source
├── assets/                      ← Brand assets, logos
└── _private/                    ← Sensitive content (infra, strategy)
```

**Mobile bindings** (`vauchi-mobile-swift/`, `vauchi-mobile-android/`) are **not manually edited** — `core/` CI generates UniFFI bindings and pushes artifacts to these repos when merging to `main`.

## Useful Commands

```bash
just help              # Show all commands
just feature-audit     # Check test coverage vs features
just dev-relay         # Start local relay for testing
just dev-cli alice     # Run CLI with isolated data
just sync-repos        # Pull all repos
```

## Getting Help

- Review existing issues
- Ask in [Discussions](https://github.com/vauchi/vauchi/discussions)

## License

By contributing, you agree that your contributions will be licensed under GPL-3.0-or-later.
