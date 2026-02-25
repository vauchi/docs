<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Just Tooling for Claude — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `just` the single interface Claude uses for all build, test, lint, format, and GitLab operations across every repo in the workspace.

**Architecture:** A shared bash helper (`resolve-repo.sh`) provides repo detection logic. The root justfile daily recipes are refactored to accept an optional `repo` argument using that helper. A new `just/gitlab.just` module wraps `glab` CLI for MR/pipeline/issue operations. CLAUDE.md is updated with mandatory tool usage instructions.

**Tech Stack:** just (1.46+), bash, glab CLI, cargo/npm/gradle/xcodebuild

**Design doc:** `docs/plans/2026-02-25-just-tooling-for-claude-design.md`

---

### Task 1: Create resolve-repo.sh helper

**Files:**
- Create: `scripts/scripts/resolve-repo.sh`

**Step 1: Create the helper script**

This is the shared brain that all daily recipes source. It provides two functions:
- `resolve_repo <arg>` — returns the repo name(s) to operate on
- `repo_dir <name>` — returns the working directory for a repo name
- `repo_toolchain <name>` — returns the toolchain type for a repo

```bash
#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
#
# SPDX-License-Identifier: GPL-3.0-or-later

# Shared repo detection for just recipes.
# Source this file, then call resolve_repo / repo_dir / repo_toolchain.

set -euo pipefail

# Workspace root (parent of scripts/)
WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# ── Registry ────────────────────────────────────────────────────────
# Format: name:dir:toolchain
# "dir" is relative to WORKSPACE_ROOT
REPO_REGISTRY=(
    "core:core:rust"
    "cli:cli:rust"
    "relay:relay:rust"
    "tui:tui:rust"
    "e2e:e2e:rust"
    "desktop-rust:desktop/src-tauri:rust"
    "desktop-ui:desktop/ui:npm"
    "android:android:gradle"
    "ios:ios:xcode"
    "docs:docs:mkdocs"
    "locales:locales:python"
    "themes:themes:python"
    "features:features:gherkin"
    "website:website:html"
    "scripts:scripts:shell"
)

# "desktop" is a virtual name that expands to desktop-rust + desktop-ui
DESKTOP_PARTS="desktop-rust desktop-ui"

# ── Which repos support which operations ────────────────────────────
REPOS_BUILD="core cli relay tui e2e desktop-rust desktop-ui android ios docs"
REPOS_TEST="core cli relay tui e2e desktop-rust desktop-ui android ios docs"
REPOS_FMT="core cli relay tui e2e desktop-rust desktop-ui ios"
REPOS_LINT="core cli relay tui e2e desktop-rust desktop-ui android ios docs locales themes features scripts"
REPOS_FIX="core cli relay tui e2e desktop-rust desktop-ui ios"

# ── Functions ───────────────────────────────────────────────────────

# Get the directory for a repo name (relative to workspace root)
repo_dir() {
    local name="$1"
    for entry in "${REPO_REGISTRY[@]}"; do
        IFS=: read -r n d t <<< "$entry"
        if [[ "$n" == "$name" ]]; then
            echo "$WORKSPACE_ROOT/$d"
            return 0
        fi
    done
    echo "ERROR: unknown repo '$name'" >&2
    return 1
}

# Get the toolchain for a repo name
repo_toolchain() {
    local name="$1"
    for entry in "${REPO_REGISTRY[@]}"; do
        IFS=: read -r n d t <<< "$entry"
        if [[ "$n" == "$name" ]]; then
            echo "$t"
            return 0
        fi
    done
    echo "ERROR: unknown repo '$name'" >&2
    return 1
}

# Detect repo from current working directory
_detect_repo_from_pwd() {
    local cwd="$PWD"
    # Check if we're inside a known repo directory
    for entry in "${REPO_REGISTRY[@]}"; do
        IFS=: read -r n d t <<< "$entry"
        local full="$WORKSPACE_ROOT/$d"
        if [[ "$cwd" == "$full" || "$cwd" == "$full"/* ]]; then
            echo "$n"
            return 0
        fi
    done
    # Check if we're in desktop/ (but not src-tauri/ or ui/ specifically)
    if [[ "$cwd" == "$WORKSPACE_ROOT/desktop" || "$cwd" == "$WORKSPACE_ROOT/desktop/"* ]]; then
        echo "desktop"
        return 0
    fi
    return 1
}

# Resolve repo argument to a space-separated list of repo names.
# Args: $1 = user-provided repo arg (may be empty), $2 = operation (build|test|fmt|lint|fix)
resolve_repo() {
    local arg="${1:-}"
    local operation="${2:-build}"

    # Get the allowed repos for this operation
    local allowed
    case "$operation" in
        build) allowed="$REPOS_BUILD" ;;
        test)  allowed="$REPOS_TEST" ;;
        fmt)   allowed="$REPOS_FMT" ;;
        lint)  allowed="$REPOS_LINT" ;;
        fix)   allowed="$REPOS_FIX" ;;
        *)     allowed="$REPOS_BUILD" ;;
    esac

    # Explicit "all"
    if [[ "$arg" == "all" ]]; then
        echo "$allowed"
        return 0
    fi

    # Explicit repo name
    if [[ -n "$arg" ]]; then
        # Expand "desktop" virtual name
        if [[ "$arg" == "desktop" ]]; then
            local result=""
            for part in $DESKTOP_PARTS; do
                if echo " $allowed " | grep -q " $part "; then
                    result="$result $part"
                fi
            done
            echo "${result# }"
            return 0
        fi
        # Validate it's in the allowed list
        if echo " $allowed " | grep -q " $arg "; then
            echo "$arg"
            return 0
        fi
        echo "ERROR: repo '$arg' does not support '$operation'" >&2
        echo "Available: $allowed" >&2
        return 1
    fi

    # No argument: detect from pwd
    local detected
    if detected=$(_detect_repo_from_pwd); then
        # Expand desktop if needed
        if [[ "$detected" == "desktop" ]]; then
            local result=""
            for part in $DESKTOP_PARTS; do
                if echo " $allowed " | grep -q " $part "; then
                    result="$result $part"
                fi
            done
            echo "${result# }"
        elif echo " $allowed " | grep -q " $detected "; then
            echo "$detected"
        else
            echo "ERROR: detected repo '$detected' does not support '$operation'" >&2
            return 1
        fi
        return 0
    fi

    # At workspace root: all
    echo "$allowed"
}
```

**Step 2: Make it executable**

Run: `chmod +x scripts/scripts/resolve-repo.sh`

**Step 3: Smoke test the helper**

Run from workspace root:
```bash
source scripts/scripts/resolve-repo.sh && resolve_repo "" "test"
```
Expected: all test-capable repos listed

Run from core/:
```bash
cd core && source ../scripts/scripts/resolve-repo.sh && resolve_repo "" "test"
```
Expected: `core`

Run with explicit arg:
```bash
source scripts/scripts/resolve-repo.sh && resolve_repo "cli" "test"
```
Expected: `cli`

Run with desktop:
```bash
source scripts/scripts/resolve-repo.sh && resolve_repo "desktop" "test"
```
Expected: `desktop-rust desktop-ui`

**Step 4: Commit**

```bash
git add scripts/scripts/resolve-repo.sh
git commit -m "feat: add resolve-repo.sh helper for repo-targeted just recipes

Shared bash helper that resolves repo arguments for daily just recipes.
Supports explicit name, pwd auto-detection, and 'all' default from
workspace root.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Refactor justfile daily recipes

**Files:**
- Modify: `justfile` (lines 48–148, daily + extended commands section)

The daily recipes lose their `[working-directory('core')]` directives and instead
call into a dispatch script that sources resolve-repo.sh. Each recipe becomes a
`[script('bash')]` block.

**Step 1: Replace the daily commands section**

Replace lines 48–148 of `justfile` with the following. The key changes:
- Each recipe accepts an optional `repo=''` parameter
- Each recipe sources `resolve-repo.sh` and iterates resolved repos
- Per-toolchain dispatch logic for build/test/fmt/lint

```just
# ═══════════════════════════════════════════════════════════════════
# DAILY COMMANDS - Use these regularly
# ═══════════════════════════════════════════════════════════════════

# Run all checks: format-check → lint → test
[group('daily')]
check repo='':
    just fmt-check {{repo}}
    just lint {{repo}}
    just test {{repo}}

# Build workspace or specific repo
[group('daily')]
[script('bash')]
build repo='':
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    for r in $(resolve_repo "{{repo}}" "build"); do
        dir=$(repo_dir "$r")
        tc=$(repo_toolchain "$r")
        echo "═══ build: $r ($tc) ═══"
        case "$tc" in
            rust)    (cd "$dir" && cargo build --workspace 2>&1) || exit 1 ;;
            npm)     (cd "$dir" && npm ci --silent && npm run build 2>&1) || exit 1 ;;
            gradle)  (cd "$dir" && ./gradlew assembleDebug 2>&1) || exit 1 ;;
            xcode)   (cd "$dir" && xcodebuild -scheme Vauchi -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -configuration Debug build -quiet 2>&1) || exit 1 ;;
            mkdocs)  (cd "$dir" && mkdocs build --strict 2>&1) || exit 1 ;;
            *)       echo "  (no build step for $tc)" ;;
        esac
    done

# Run tests
[group('daily')]
[script('bash')]
test repo='':
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    for r in $(resolve_repo "{{repo}}" "test"); do
        dir=$(repo_dir "$r")
        tc=$(repo_toolchain "$r")
        echo "═══ test: $r ($tc) ═══"
        case "$tc" in
            rust)
                if command -v cargo-nextest &>/dev/null; then
                    (cd "$dir" && cargo nextest run --workspace 2>&1) || exit 1
                else
                    (cd "$dir" && cargo test --workspace 2>&1) || exit 1
                fi
                ;;
            npm)     (cd "$dir" && npx playwright test --project=chromium --grep-invert "@visual|@a11y" 2>&1) || exit 1 ;;
            gradle)  (cd "$dir" && ./gradlew test 2>&1) || exit 1 ;;
            xcode)   (cd "$dir" && xcodebuild -scheme Vauchi -destination 'platform=iOS Simulator,name=iPhone 17 Pro' test -quiet 2>&1) || exit 1 ;;
            mkdocs)  (cd "$dir" && mkdocs build --strict 2>&1) || exit 1 ;;
            *)       echo "  (no test step for $tc)" ;;
        esac
    done

# Format code
[group('daily')]
[script('bash')]
fmt repo='':
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    for r in $(resolve_repo "{{repo}}" "fmt"); do
        dir=$(repo_dir "$r")
        tc=$(repo_toolchain "$r")
        echo "═══ fmt: $r ($tc) ═══"
        case "$tc" in
            rust)    (cd "$dir" && cargo fmt --all 2>&1) || exit 1 ;;
            npm)     (cd "$dir" && npx prettier --write src/ 2>&1) || exit 1 ;;
            xcode)   (cd "$dir" && swiftformat . 2>&1) || exit 1 ;;
            *)       echo "  (no fmt step for $tc)" ;;
        esac
    done

# Check formatting (no changes)
[group('daily')]
[script('bash')]
fmt-check repo='':
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    for r in $(resolve_repo "{{repo}}" "fmt"); do
        dir=$(repo_dir "$r")
        tc=$(repo_toolchain "$r")
        echo "═══ fmt-check: $r ($tc) ═══"
        case "$tc" in
            rust)    (cd "$dir" && cargo fmt --all -- --check 2>&1) || exit 1 ;;
            npm)     (cd "$dir" && npx prettier --check src/ 2>&1) || exit 1 ;;
            xcode)   (cd "$dir" && swiftformat --lint . 2>&1) || exit 1 ;;
            *)       echo "  (no fmt-check step for $tc)" ;;
        esac
    done

# Run lints
[group('daily')]
[script('bash')]
lint repo='':
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    for r in $(resolve_repo "{{repo}}" "lint"); do
        dir=$(repo_dir "$r")
        tc=$(repo_toolchain "$r")
        echo "═══ lint: $r ($tc) ═══"
        case "$tc" in
            rust)    (cd "$dir" && cargo clippy --workspace -- -D warnings 2>&1) || exit 1 ;;
            npm)     (cd "$dir" && npm run lint 2>&1 && npm run lint:css 2>&1) || exit 1 ;;
            gradle)  (cd "$dir" && ./gradlew lint 2>&1) || exit 1 ;;
            xcode)   (cd "$dir" && swiftlint lint --strict --quiet 2>&1 && swiftformat --lint . 2>&1) || exit 1 ;;
            mkdocs)  (cd "$dir" && markdownlint '**/*.md' 2>&1) || exit 1 ;;
            python)
                if [[ -f "$dir/scripts/validate.py" ]]; then
                    (cd "$dir" && python3 scripts/validate.py 2>&1) || exit 1
                fi
                ;;
            gherkin) echo "  (gherkin lint: advisory only)" ;;
            shell)   (cd "$dir" && shellcheck scripts/*.sh 2>&1) || exit 1 ;;
            html)    (cd "$dir" && htmlhint public/**/*.html 2>&1) || exit 1 ;;
            *)       echo "  (no lint step for $tc)" ;;
        esac
    done

# Interactive commit across repos with changes
[group('daily')]
commit:
    ./scripts/scripts/commit-interactive.sh

# ═══════════════════════════════════════════════════════════════════
# EXTENDED COMMANDS - Less frequently used
# ═══════════════════════════════════════════════════════════════════

# Run tests for specific crate (within core workspace)
[group('extended')]
[working-directory('core')]
test-crate crate:
    cargo test -p {{crate}}

# Build release binaries
[group('extended')]
[working-directory('core')]
build-release:
    cargo build --workspace --release

# Run security audit
[group('extended')]
[script('bash')]
audit repo='':
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    # Only Rust repos support cargo audit
    RUST_REPOS="core cli relay tui e2e desktop-rust"
    if [[ -z "{{repo}}" ]]; then
        repos="$RUST_REPOS"
    elif [[ "{{repo}}" == "all" ]]; then
        repos="$RUST_REPOS"
    elif [[ "{{repo}}" == "desktop" ]]; then
        repos="desktop-rust"
    else
        repos="{{repo}}"
    fi
    for r in $repos; do
        dir=$(repo_dir "$r")
        echo "═══ audit: $r ═══"
        (cd "$dir" && cargo audit 2>&1) || true
        (cd "$dir" && cargo deny check 2>&1) || true
    done

# Auto-fix lint issues
[group('extended')]
[script('bash')]
fix repo='':
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    for r in $(resolve_repo "{{repo}}" "fix"); do
        dir=$(repo_dir "$r")
        tc=$(repo_toolchain "$r")
        echo "═══ fix: $r ($tc) ═══"
        case "$tc" in
            rust)
                (cd "$dir" && cargo fmt --all 2>&1) || true
                (cd "$dir" && cargo clippy --workspace --fix --allow-dirty --allow-staged 2>&1) || true
                ;;
            npm)     (cd "$dir" && npx prettier --write src/ 2>&1) || true ;;
            xcode)
                (cd "$dir" && swiftformat . 2>&1) || true
                (cd "$dir" && swiftlint --fix 2>&1) || true
                ;;
            *)       echo "  (no fix step for $tc)" ;;
        esac
    done

# Watch for changes and run tests (core only)
[group('extended')]
[working-directory('core')]
watch:
    cargo watch -x "test --workspace"
```

Note: `metrics`, `coverage`, `docs`, `install-hooks` recipes remain unchanged after
this block. The `[private] fmt-check` is replaced by the new `fmt-check` recipe that
accepts a repo arg (no longer `[private]` since it's useful standalone).

**Step 2: Add gitlab module import**

Add to the modules section (after line 47):

```just
[doc('GitLab MR, pipeline, and issue operations')]
mod gitlab 'just/gitlab.just'
```

**Step 3: Update the help recipe**

Update the help text to reflect new signatures:

```
Daily workflow:
  just check [repo]       Format + lint + test (all repos or specific)
  just build [repo]       Build (all repos or specific)
  just test [repo]        Run tests (all repos or specific)
  just fmt [repo]         Format code
  just lint [repo]        Run lints
  just fix [repo]         Auto-fix formatting + lint
  just commit             Interactive commit across repos

  Repo argument: omit = auto-detect from pwd (or all from workspace root)
  Examples: just test core, just lint cli, just check desktop

GitLab:
  just gitlab mr list     List open MRs
  just gitlab mr create   Create MR from current branch
  just gitlab pipeline status   Pipeline status for current branch
  just gitlab issue list  List open issues
  Full list: just --list --list-submodules | grep gitlab
```

**Step 4: Verify the recipes parse**

Run: `just --list --list-submodules`
Expected: all recipes listed without parse errors, gitlab module visible

**Step 5: Test the refactored recipes**

Run: `just fmt-check core`
Expected: cargo fmt --check runs in core/ only

Run: `just lint relay`
Expected: cargo clippy runs in relay/ only

Run: `just test cli`
Expected: cargo nextest runs in cli/ only

**Step 6: Commit**

```bash
git add justfile
git commit -m "feat: refactor daily recipes to accept repo argument

Daily commands (build, test, fmt, lint, check, fix, audit) now accept
an optional repo argument. Auto-detects repo from pwd when inside a
sub-repo, runs all applicable repos from workspace root.

Supports: core, cli, relay, tui, e2e, desktop, android, ios, docs,
locales, themes, features, scripts.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Create gitlab.just module

**Files:**
- Create: `just/gitlab.just`

**Step 1: Create the GitLab module**

All recipes use `glab` CLI. Every recipe checks auth first. The `[repo]` argument
uses the same detection logic — but for GitLab we need the GitLab project path
(`vauchi/<name>`), not just the directory.

```just
# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
#
# SPDX-License-Identifier: GPL-3.0-or-later

# GitLab operations: MRs, pipelines, issues
# Usage: just gitlab <recipe>

# ── Helpers ─────────────────────────────────────────────────────────

# Map repo name to GitLab project path
# Most repos are vauchi/<name>, with a few exceptions
[private]
[no-cd]
[script('bash')]
_check-auth:
    if ! glab auth status &>/dev/null; then
        echo "ERROR: glab not authenticated — run 'glab auth login'"
        exit 1
    fi

# ── MR Operations ──────────────────────────────────────────────────

# List open merge requests
[no-cd]
[script('bash')]
mr-list repo='':
    just gitlab _check-auth
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    r=$(resolve_gitlab_repo "{{repo}}")
    glab mr list -R "vauchi/$r"

# View merge request details
[no-cd]
[script('bash')]
mr-view id repo='':
    just gitlab _check-auth
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    r=$(resolve_gitlab_repo "{{repo}}")
    glab mr view "{{id}}" -R "vauchi/$r"

# Create merge request from current branch
[no-cd]
[script('bash')]
mr-create repo='':
    just gitlab _check-auth
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    r=$(resolve_gitlab_repo "{{repo}}")
    dir=$(gitlab_repo_dir "{{repo}}")
    cd "$dir"
    branch=$(git branch --show-current)
    if [[ "$branch" == "main" ]]; then
        echo "ERROR: cannot create MR from main branch"
        exit 1
    fi
    # Push branch if not tracking remote
    if ! git rev-parse --abbrev-ref "@{u}" &>/dev/null; then
        git push -u origin "$branch"
    fi
    glab mr create --fill --target-branch main --push -R "vauchi/$r"

# Approve a merge request
[no-cd]
[script('bash')]
mr-approve id repo='':
    just gitlab _check-auth
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    r=$(resolve_gitlab_repo "{{repo}}")
    glab mr approve "{{id}}" -R "vauchi/$r"

# Merge a merge request
[no-cd]
[script('bash')]
mr-merge id repo='':
    just gitlab _check-auth
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    r=$(resolve_gitlab_repo "{{repo}}")
    glab mr merge "{{id}}" -R "vauchi/$r"

# Close a merge request
[no-cd]
[script('bash')]
mr-close id repo='':
    just gitlab _check-auth
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    r=$(resolve_gitlab_repo "{{repo}}")
    glab mr close "{{id}}" -R "vauchi/$r"

# ── Pipeline Operations ────────────────────────────────────────────

# Show pipeline status for current branch
[no-cd]
[script('bash')]
pipeline-status repo='':
    just gitlab _check-auth
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    r=$(resolve_gitlab_repo "{{repo}}")
    dir=$(gitlab_repo_dir "{{repo}}")
    branch=$(cd "$dir" && git branch --show-current)
    glab ci status --branch "$branch" -R "vauchi/$r"

# List recent pipelines
[no-cd]
[script('bash')]
pipeline-list repo='':
    just gitlab _check-auth
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    r=$(resolve_gitlab_repo "{{repo}}")
    glab ci list -R "vauchi/$r"

# List jobs in a pipeline
[no-cd]
[script('bash')]
pipeline-jobs id repo='':
    just gitlab _check-auth
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    r=$(resolve_gitlab_repo "{{repo}}")
    glab ci list -R "vauchi/$r" --pipeline "{{id}}"

# View job log output
[no-cd]
[script('bash')]
pipeline-log job_id repo='':
    just gitlab _check-auth
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    r=$(resolve_gitlab_repo "{{repo}}")
    glab ci trace "{{job_id}}" -R "vauchi/$r"

# Retry a failed pipeline
[no-cd]
[script('bash')]
pipeline-retry id repo='':
    just gitlab _check-auth
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    r=$(resolve_gitlab_repo "{{repo}}")
    glab ci retry "{{id}}" -R "vauchi/$r"

# Cancel a running pipeline
[no-cd]
[script('bash')]
pipeline-cancel id repo='':
    just gitlab _check-auth
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    r=$(resolve_gitlab_repo "{{repo}}")
    glab ci delete "{{id}}" -R "vauchi/$r"

# ── Issue Operations ───────────────────────────────────────────────

# List open issues
[no-cd]
[script('bash')]
issue-list repo='':
    just gitlab _check-auth
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    r=$(resolve_gitlab_repo "{{repo}}")
    glab issue list -R "vauchi/$r"

# View issue details
[no-cd]
[script('bash')]
issue-view id repo='':
    just gitlab _check-auth
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    r=$(resolve_gitlab_repo "{{repo}}")
    glab issue view "{{id}}" -R "vauchi/$r"

# Create an issue
[no-cd]
[script('bash')]
issue-create title repo='' *args='':
    just gitlab _check-auth
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    r=$(resolve_gitlab_repo "{{repo}}")
    glab issue create --title "{{title}}" --no-editor -R "vauchi/$r" {{args}}

# Close an issue
[no-cd]
[script('bash')]
issue-close id repo='':
    just gitlab _check-auth
    set -euo pipefail
    source scripts/scripts/resolve-repo.sh
    r=$(resolve_gitlab_repo "{{repo}}")
    glab issue close "{{id}}" -R "vauchi/$r"
```

**Step 2: Add GitLab helper functions to resolve-repo.sh**

Append these functions to `scripts/scripts/resolve-repo.sh`:

```bash
# ── GitLab helpers ──────────────────────────────────────────────────

# Map directory name to GitLab project name.
# Most are identity (core → core), with exceptions:
#   _private → private
#   desktop/src-tauri, desktop/ui → desktop
#   vauchi (root) → vauchi
_dir_to_gitlab_name() {
    local name="$1"
    case "$name" in
        desktop-rust|desktop-ui) echo "desktop" ;;
        *)                       echo "$name" ;;
    esac
}

# Resolve repo arg to a single GitLab project name.
# Unlike resolve_repo (which returns multiple), this returns exactly one.
resolve_gitlab_repo() {
    local arg="${1:-}"

    # Explicit name
    if [[ -n "$arg" ]]; then
        _dir_to_gitlab_name "$arg"
        return 0
    fi

    # Detect from pwd
    local detected
    if detected=$(_detect_repo_from_pwd); then
        _dir_to_gitlab_name "$detected"
        return 0
    fi

    # At workspace root — ambiguous for GitLab ops
    echo "ERROR: specify a repo (cannot target all repos for GitLab operations)" >&2
    return 1
}

# Get the working directory for a repo (for git branch detection etc.)
gitlab_repo_dir() {
    local arg="${1:-}"

    if [[ -n "$arg" ]]; then
        # Map to first matching directory
        case "$arg" in
            desktop-rust) echo "$WORKSPACE_ROOT/desktop/src-tauri" ;;
            desktop-ui)   echo "$WORKSPACE_ROOT/desktop/ui" ;;
            desktop)      echo "$WORKSPACE_ROOT/desktop" ;;
            *)            echo "$WORKSPACE_ROOT/$arg" ;;
        esac
        return 0
    fi

    # Detect from pwd
    local detected
    if detected=$(_detect_repo_from_pwd); then
        repo_dir "$detected"
        return 0
    fi

    echo "$WORKSPACE_ROOT"
}
```

**Step 3: Verify the module parses**

Run: `just --list --list-submodules | grep gitlab`
Expected: gitlab recipes listed

**Step 4: Test a GitLab recipe**

Run: `just gitlab mr-list core`
Expected: lists open MRs for vauchi/core (or empty list)

Run: `just gitlab pipeline-status core`
Expected: shows pipeline status for core's current branch

**Step 5: Commit**

```bash
git add just/gitlab.just scripts/scripts/resolve-repo.sh
git commit -m "feat: add gitlab.just module for MR/pipeline/issue operations

New just module wrapping glab CLI for GitLab operations:
- MR: list, view, create, approve, merge, close
- Pipeline: status, list, jobs, log, retry, cancel
- Issue: list, view, create, close

All recipes require glab auth, error immediately if not authenticated.
Repo argument auto-detects from pwd or accepts explicit name.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add Tool Usage section**

Insert after the "Pre-Push Rules (MANDATORY)" section (after line ~70), before
"PROBLEM WORKFLOW":

```markdown
## Tool Usage (MANDATORY)

**Always use `just` recipes instead of raw commands.** This applies to all build, test, lint, format, and GitLab operations. The `just` recipes handle correct working directories, toolchain detection, and multi-repo orchestration.

| Instead of... | Use... |
|---------------|--------|
| `cargo build` | `just build [repo]` |
| `cargo test` / `cargo nextest` | `just test [repo]` |
| `cargo fmt` | `just fmt [repo]` |
| `cargo clippy` | `just lint [repo]` |
| `cargo fmt && cargo clippy && cargo test` | `just check [repo]` |
| `cargo test -p <crate>` | `just test-crate <crate>` |
| `cargo fmt && cargo clippy --fix` | `just fix [repo]` |
| `cargo audit` / `cargo deny` | `just audit [repo]` |
| `glab mr list` / `glab mr create` | `just gitlab mr-list [repo]` / `just gitlab mr-create [repo]` |
| `glab ci status` | `just gitlab pipeline-status [repo]` |
| `git push -o merge_request.create ...` | `just gitlab mr-create [repo]` |
| Raw `git -C <repo>` for multi-repo ops | `just git status` / `just git main` |

**Repo argument rules:**
- **Omit** → auto-detect from pwd (inside sub-repo) or run all (from workspace root)
- **Explicit name** → `just test core`, `just lint relay`, `just check desktop`
- **`all`** → `just test all` runs across all applicable repos
- **`desktop`** → expands to both `desktop-rust` and `desktop-ui`

**Valid repo names:** `core`, `cli`, `relay`, `tui`, `e2e`, `desktop` (or `desktop-rust`/`desktop-ui`), `android`, `ios`, `docs`, `locales`, `themes`, `features`, `website`, `scripts`
```

**Step 2: Update the Commands section**

Replace the existing Commands section with:

```markdown
## Commands

```bash
# Daily workflow
just check [repo]           # Format-check + lint + test
just build [repo]           # Build
just test [repo]            # Run tests
just fmt [repo]             # Format code
just lint [repo]            # Run lints
just fix [repo]             # Auto-fix formatting + lint
just commit                 # Interactive commit across repos

# Repo targeting
just test core              # Test core only
just lint desktop           # Lint desktop (Rust + frontend)
just check                  # Check all (from workspace root)

# Extended
just test-crate <crate>     # Test specific crate in core workspace
just audit [repo]           # Security audit (Rust repos)
just coverage               # Coverage report (core)
just watch                  # Watch + test (core)
just build-release          # Release build (core)

# GitLab
just gitlab mr-list [repo]          # List open MRs
just gitlab mr-view <id> [repo]     # View MR details
just gitlab mr-create [repo]        # Create MR from current branch
just gitlab mr-approve <id> [repo]  # Approve MR
just gitlab mr-merge <id> [repo]    # Merge MR
just gitlab pipeline-status [repo]  # Pipeline status
just gitlab pipeline-list [repo]    # Recent pipelines
just gitlab pipeline-log <id> [repo] # Job log
just gitlab issue-list [repo]       # List issues
just gitlab issue-create <title> [repo] # Create issue

# Git (multi-repo)
just git status             # Status across all repos
just git main               # Stash → checkout main → pull (all repos)
just git pull-all           # Pull latest in all repos
just git branches           # Show branches across repos
just git cleanup            # Preview merged branch cleanup

# Setup
just setup                  # Clone all repos, init workspace
just install-dev-deps       # Install toolchain
just clean                  # Clean all build artifacts
just help                   # Show all commands
```
```

**Step 3: Verify CLAUDE.md is well-formed**

Read the file and check no markdown formatting issues.

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add mandatory tool usage rules for Claude

Adds Tool Usage (MANDATORY) section requiring Claude to use just
recipes instead of raw cargo/glab/git commands. Updates Commands
section to show new repo-targeted signatures and GitLab operations.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Update help recipe and verify end-to-end

**Files:**
- Modify: `justfile` (help recipe)

**Step 1: Update help recipe**

Replace the help recipe content to reflect all new signatures including GitLab
module and repo argument.

**Step 2: Run full verification**

Run: `just --list --list-submodules`
Expected: all recipes listed, gitlab module visible, no parse errors

Run: `just check core`
Expected: fmt-check → lint → test runs for core only

Run: `just gitlab mr-list core`
Expected: lists MRs (or empty) without error

Run: `cd cli && just test`
Expected: detects cli from pwd, runs cargo nextest in cli/

Run: `cd .. && just lint scripts`
Expected: runs shellcheck on scripts/*.sh

**Step 3: Commit**

```bash
git add justfile
git commit -m "docs: update help recipe with new signatures

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Test Strategy

This is tooling/infrastructure, not application code — TDD doesn't apply in the
traditional sense. Instead:

- **Task 1:** Manual smoke tests of resolve-repo.sh from different directories
- **Task 2:** `just --list` parse check + targeted recipe execution per repo
- **Task 3:** `just gitlab` commands against real GitLab (read-only: mr-list, pipeline-status)
- **Task 4:** Visual review of CLAUDE.md formatting
- **Task 5:** End-to-end verification of all common workflows

## Risks

- **`glab` auth may be broken** — recipes error immediately with clear message, by design
- **Non-Rust toolchains may not be installed** — recipes will fail with tool-not-found errors; this is acceptable (same as raw commands would fail)
- **Desktop submodule structure** — the `desktop-rust`/`desktop-ui` split may need tuning based on actual playwright/tauri setup
