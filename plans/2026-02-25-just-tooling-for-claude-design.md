<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Just Tooling for Claude — Design

**Date:** 2026-02-25
**Status:** Approved
**Scope:** `justfile`, `just/gitlab.just`, `scripts/scripts/resolve-repo.sh`, `CLAUDE.md`

## Problem

Claude Code doesn't use `just` recipes. Instead it runs raw `cargo`, `glab`, and
`curl` commands. This happens because:

1. No CLAUDE.md instruction tells Claude to prefer `just`
2. Daily recipes (build/test/fmt/lint/check) hardcode `[working-directory('core')]`
   — they can't target cli, relay, tui, desktop, or non-Rust repos
3. No `just` recipes exist for GitLab operations (MR, pipeline, issues), so Claude
   falls back to broken glab/MCP/curl workarounds

## Goal

Make `just` the single interface Claude uses for all build, test, lint, and GitLab
operations across every repo in the workspace.

## Design

### 1. Smart repo detection

A shared helper script `scripts/scripts/resolve-repo.sh` provides `_resolve_repo()`
used by all daily recipes.

**Resolution order:**

1. Explicit argument given → use it (`just test cli`)
2. pwd is inside a sub-repo → auto-detect that repo
3. pwd is workspace root → `all` (iterate applicable repos)

**Repo registry** — each recipe type knows which repos it applies to:

| Recipe | Rust | Frontend | Mobile | Content |
|--------|------|----------|--------|---------|
| `build` | core, cli, relay, tui, e2e, desktop/src-tauri | desktop/ui | android, ios | docs |
| `test` | core, cli, relay, tui, e2e, desktop/src-tauri | desktop/ui | android, ios | docs |
| `fmt` | core, cli, relay, tui, e2e, desktop/src-tauri | desktop/ui | ios | — |
| `lint` | core, cli, relay, tui, e2e, desktop/src-tauri | desktop/ui | android, ios | docs, locales, themes, features, scripts |
| `check` | (composite: fmt-check → lint → test for each repo) ||||
| `fix` | core, cli, relay, tui, e2e, desktop/src-tauri | desktop/ui | ios | — |

The helper maps repo names to:

- Directory path (e.g., `core` → `core/`, `desktop-rust` → `desktop/src-tauri/`)
- Toolchain type: `rust`, `gradle`, `xcode`, `npm`, `python`, `mkdocs`, `shell`

**Desktop split:** `desktop` runs both Rust and frontend steps. `desktop-rust` and
`desktop-ui` target individual sides.

### 2. Refactored daily commands

Existing recipes gain an optional `repo` argument:

```
just build [repo]      # Build
just test [repo]       # Test
just fmt [repo]        # Format
just lint [repo]       # Lint
just check [repo]      # fmt-check → lint → test (composite)
just fix [repo]        # Auto-fix formatting + lint
```

**Per-toolchain commands:**

| Toolchain | build | test | fmt | lint | fix |
|-----------|-------|------|-----|------|-----|
| Rust | `cargo build` | `cargo nextest run` (fallback: `cargo test`) | `cargo fmt` | `cargo clippy -- -D warnings` | `cargo fmt && cargo clippy --fix --allow-dirty` |
| npm (desktop/ui) | `npm run build` | `npx playwright test` | `npx prettier --write .` | `npm run lint && npm run lint:css && npm run typecheck` | `npx prettier --write .` |
| gradle (android) | `./gradlew assembleDebug` | `./gradlew test` | — | `./gradlew lint` | — |
| xcode (ios) | `xcodebuild build` | `xcodebuild test` | `swiftformat .` | `swiftlint lint --strict && swiftformat --lint .` | `swiftformat . && swiftlint --fix` |
| mkdocs (docs) | `mkdocs build --strict` | `mkdocs build --strict` | — | `markdownlint '**/*.md'` | — |
| python (locales) | — | — | — | `python3 scripts/validate.py` | — |
| python (themes) | — | — | — | `python3 scripts/validate.py` | — |
| gherkin (features) | — | — | — | `gherkin-utils format` (advisory) | — |
| shell (scripts) | — | — | — | `shellcheck scripts/*.sh` | — |

**Backward compatibility:** `just test` from workspace root now runs all repos
instead of just core. This is intentional — the old behavior was too narrow.
`just test core` gives the old behavior explicitly.

`just test-crate <crate>` stays unchanged for targeting a specific Cargo crate
within the core workspace.

### 3. GitLab module (`just/gitlab.just`)

New module exposed as `just gitlab <subcommand>`. All recipes:

- Require `glab` CLI to be authenticated
- Error immediately with actionable message if not: `ERROR: glab not authenticated — run 'glab auth login'`
- Use `glab -R vauchi/<repo>` to target the correct project
- Support the same `[repo]` smart detection as daily commands

**MR recipes:**

```
just gitlab mr list [repo]              # List open MRs
just gitlab mr view <id> [repo]         # View MR details
just gitlab mr create [repo]            # Create MR from current branch
just gitlab mr approve <id> [repo]      # Approve MR
just gitlab mr merge <id> [repo]        # Merge MR
just gitlab mr close <id> [repo]        # Close MR
```

`mr create` uses `glab mr create` with sensible defaults (target=main, title from
branch name). Does NOT use `git push -o` flags — lets glab handle it.

**Pipeline recipes:**

```
just gitlab pipeline status [repo]      # Latest pipeline for current branch
just gitlab pipeline list [repo]        # Recent pipelines
just gitlab pipeline jobs <id> [repo]   # Jobs in a pipeline
just gitlab pipeline log <job_id> [repo] # Job log output
just gitlab pipeline retry <id> [repo]  # Retry failed pipeline
just gitlab pipeline cancel <id> [repo] # Cancel running pipeline
```

**Issue recipes:**

```
just gitlab issue list [repo]           # List open issues
just gitlab issue view <id> [repo]      # View issue details
just gitlab issue create <title> [repo] # Create issue
just gitlab issue close <id> [repo]     # Close issue
```

### 4. CLAUDE.md update

Add a mandatory "Tool Usage" section instructing Claude to always use `just`:

| Instead of... | Use... |
|---------------|--------|
| `cargo build` | `just build [repo]` |
| `cargo test` / `cargo nextest` | `just test [repo]` |
| `cargo fmt` | `just fmt [repo]` |
| `cargo clippy` | `just lint [repo]` |
| `cargo fmt && cargo clippy && cargo test` | `just check [repo]` |
| `cargo test -p <crate>` | `just test-crate <crate>` |
| `cargo fmt && cargo clippy --fix` | `just fix [repo]` |
| `glab mr list` / `glab mr create` | `just gitlab mr list` / `just gitlab mr create` |
| `glab pipeline status` | `just gitlab pipeline status` |
| `git push -o merge_request.create ...` | `just gitlab mr create` |
| Raw `git -C <repo>` for multi-repo | `just git status` / `just git main` |

Update the existing "Commands" section to show the new signatures.

## Files

| File | Action |
|------|--------|
| `scripts/scripts/resolve-repo.sh` | Create — shared repo detection helper |
| `justfile` | Modify — refactor daily recipes to use resolve-repo, add gitlab module import |
| `just/gitlab.just` | Create — GitLab MR/pipeline/issue recipes |
| `CLAUDE.md` | Modify — add Tool Usage section, update Commands section |

## Not in scope

- `just/git.just` — already works well for multi-repo git
- `just/apps.just`, `just/mobile.just`, `just/e2e.just` — unchanged
- `just/deploy.just`, `just/runners.just`, `just/setup.just` — unchanged
- Sub-repo CLAUDE.md files — no changes needed (they inherit root)
