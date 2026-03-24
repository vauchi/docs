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

Use `just git branch` to create branches — it handles multi-repo consistency:

```bash
# Create branch in specific repos
just git branch feature/my-feature core cli docs

# Create branch in all repos (for broad changes)
just git branch feature/my-feature
```

**Never use bare `git checkout -b`** for multi-repo work — branches must share the same name across repos.

Branch naming: `{type}/{short-description}`

| Type | Use Case |
|------|----------|
| `feature/` | New functionality |
| `bugfix/` | Bug fixes |
| `refactor/` | Code restructuring |
| `tidy/` | Structural-only cleanup (Tidy First) |
| `investigation/` | Research/exploration |

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

- Use RustCrypto audited crates (`ed25519-dalek`, `x25519-dalek`, `sha2`, `hmac`, `hkdf`, `chacha20poly1305`, `argon2`); `aws-lc-rs` for TLS only (via rustls)
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

UniFFI generates Swift/Kotlin bindings from Rust. When modifying `vauchi-platform` or `vauchi-core`:

### When to Regenerate Bindings

Regenerate bindings when you:

- Add/remove/rename exported types or functions
- Change function signatures
- Add new `#[uniffi::export]` or `#[derive(uniffi::*)]` annotations

### How to Regenerate

```bash
# IMPORTANT: Build without symbol stripping to preserve metadata
RUSTFLAGS="-Cstrip=none" cargo --manifest-path core/Cargo.toml build -p vauchi-platform --release

# Regenerate for both platforms (macOS required for iOS)
core/scripts/build-bindings.sh

# Or regenerate Android only (works on Linux)
core/scripts/build-bindings.sh --android

# Validate bindings have all expected types
core/scripts/validate-bindings.sh
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
├── core/                        ← Rust workspace:
│   ├── vauchi-core/             ←   crypto, protocols, data models
│   ├── vauchi-platform/         ←   UniFFI bindings for mobile/macOS
│   ├── vauchi-protocol/         ←   shared relay/client types (serde-only)
│   └── vauchi-cabi/             ←   C ABI exports for linux-qt, windows
├── relay/                       ← WebSocket relay server (standalone Rust)
├── cli/                         ← Command-line interface
├── tui/                         ← Terminal user interface
│
├── android/                     ← Kotlin/Compose native app
├── ios/                         ← SwiftUI native app
├── macos/                       ← SwiftUI macOS app
├── linux-gtk/                   ← GTK4 + libadwaita Linux app
├── linux-qt/                    ← Qt6 Linux app
├── windows/                     ← WinUI 3 Windows app
├── web-demo/                    ← SolidJS + WASM demo app
├── vauchi-platform-swift/       ← Generated Swift bindings + XCFramework (SPM distribution)
│
├── e2e/                         ← End-to-end tests
├── features/                    ← Gherkin specs (shared across all platforms)
│
├── locales/                     ← Translation files (JSON per locale)
├── themes/                      ← Theme definitions (JSON)
├── docs/                        ← Public documentation (this site)
├── scripts/                     ← Dev tools, hooks, utilities
├── drift-detector/              ← Plan-vs-code drift analysis tool
├── website/                     ← Landing page source
├── gitlab-profile/              ← GitLab group profile page
├── github-profile/              ← GitHub mirror profile page
└── assets/                      ← Brand assets, logos
```

**Platform bindings** (`vauchi-platform-swift/`) are **not manually edited** — `core/` CI generates UniFFI bindings and pushes artifacts to this repo when merging to `main`. Android bindings are published as Maven AARs directly from core CI.

## Cross-Repo Changes

When a change spans multiple repos, follow the dependency ordering:

### Dependency Graph

```
Tier 0 (no deps):     core, relay, features, docs, scripts, locales
Tier 1 (needs core):  cli, tui, linux-gtk, linux-qt, windows, e2e
Tier 2 (automated):   ios, android, macos (CI-triggered after core merge)
```

### Workflow

1. **Create the same branch** in all affected repos: `just git branch feature/my-thing core cli`
2. **Implement Tier 0 repos first** (usually `core`), run `just check core`
3. **Update Tier 1 repos** to use the new core API, run `just check cli` etc.
4. **During local dev**, use path overrides in `.cargo/config.toml` so Tier 1 repos build against your local core changes (these overrides are `.gitignore`-d)
5. **Push and create MRs** — Tier 0 as ready MRs, Tier 1 as Draft MRs
6. **Merge Tier 0 first**, wait for CI to publish, then un-draft Tier 1 MRs
7. iOS/Android are automatic — core's release pipeline triggers binding distribution

Use `just git push-all` to push all repos at once.

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
just release-prod [repo]     # Full release. E.g., just release-prod core
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
- Ask in [GitLab Issues](https://gitlab.com/vauchi/vauchi/-/issues)

## License

By contributing, you agree that your contributions will be licensed under GPL-3.0-or-later.
