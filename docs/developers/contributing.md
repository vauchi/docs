<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

<!-- SSOT: This is the single source of truth for contribution guidelines -->
# Contributing to Vauchi

## Quick Start

```bash
# Clone and setup workspace
git clone git@gitlab.com:vauchi/vauchi.git
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
| `tidy/` | Structural-only cleanup (Tidy First) |
| `investigation/` | Research/exploration |

For **multi-repo features**, use the **same branch name** in every affected repo:

```bash
just git branch feature/remote-content-updates features core docs
```

### Step 2: Do the work — commit often

- **If changing code: strict TDD.** Tidy → Red → Green → Refactor. No exceptions.
  1. Tidy first — small structural improvement if the code is hard to change (own `tidy:` commit)
  2. Write failing test first (Red)
  3. Write minimal code to pass (Green)
  4. Refactor
  5. Tests must trace to `features/*.feature` scenarios
- Commit atomically — each commit should be a single logical change.
- Run `just check` before pushing (formats, lints, tests).
- See [Principles](../about/principles.md) for core values.

Commit message format:

```
{type}: {Short description}

{Longer description if needed}
```

Types: `feat`, `fix`, `refactor`, `tidy`, `docs`, `test`, `chore`

Use imperative mood: "Add feature" not "Added feature". Keep first line under 72 characters.

Use `just commit` for interactive commits across all repos with changes.

### Step 3: Create a Merge Request

```bash
# Push all repos with changes (runs pre-push checks)
just git push-all

# Create MR for a specific repo
just gitlab mr-create core
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
- [ ] Follows [GUI Guidelines](gui-guidelines.md) and [UX Guidelines](ux-guidelines.md) (if UI changes)
```

Use GitLab MR reference format: `{group}/{project}!{mr_number}`

## Code Guidelines

### Rust

- Use `aws-lc-rs` crate for all cryptography (FIPS 140-3 Level 1)
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
└── assets/                      ← Brand assets, logos
```

**Mobile bindings** (`vauchi-mobile-swift/`, `vauchi-mobile-android/`) are **not manually edited** — `core/` CI generates UniFFI bindings and pushes artifacts to these repos when merging to `main`.

## Release Workflow

Vauchi uses a 3-tier versioning system. Each tier triggers a different CI pipeline scope:

| Tier | Tag Format | What Runs | Publishes? |
|------|-----------|-----------|------------|
| **Dev** | `v0.2.3-dev.N` | Lint + test only | No |
| **RC** | `v0.2.3-rc.N` | Lint + test + coverage + mutation + security | No |
| **PROD** | `v0.2.3` | Full release: build, package, publish, deploy, trigger mobile bindings | Yes |

### Creating releases

```bash
just release-dev [repo]      # Fast feedback — default: core. E.g., just release-dev cli
just release-rc [repo]       # Full quality gate. E.g., just release-rc relay
just release-prod [repo]     # Full release. E.g., just release-prod desktop
just release-history [repo]  # Show promotion chain. E.g., just release-history tui
```

### Typical flow

1. Merge feature MRs to `main`
2. `just release-dev` — verify basic CI passes (~2 min)
3. `just release-rc` — full quality gate with coverage + mutation (~15 min)
4. `just release-prod` — publish to package registry, trigger mobile binding distribution

Dev and RC tags never publish artifacts, trigger mobile repos, or create GitLab releases. Only PROD tags do.

## Useful Commands

```bash
just help              # Show all commands
just check-annotations # Check test coverage vs features
just relay             # Start local relay for testing
just run cli           # Run CLI
just git sync          # Fetch all + pull where on main
```

## Getting Help

- Review existing issues
- Ask in [Discussions](https://github.com/vauchi/vauchi/discussions)

## License

By contributing, you agree that your contributions will be licensed under GPL-3.0-or-later.
