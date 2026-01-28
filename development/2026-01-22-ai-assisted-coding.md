<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# AI-Assisted Coding

This project supports multiple AI coding assistants with pre-configured rules to enforce TDD, test/production code separation, and testing best practices.

## Supported AI Tools

| Tool | Config Location | Type |
|------|-----------------|------|
| **Claude Code** | `.aiassistant/rules/`, `CLAUDE.md` | CLI agent |
| **GitHub Copilot** | `.github/copilot-instructions.md` | IDE extension |
| **Cursor** | `.cursor/rules/*.mdc` | AI-native editor |
| **Aider** | `CONVENTIONS.md` | CLI agent |
| **Continue** | `.continue/rules/*.md` | Open-source IDE extension |
| **Windsurf** | `.windsurfrules` | AI-native editor |
| **Cody** | `.cody/` | IDE extension |

## Configuration Files

```
vauchi/
├── .aiassistant/rules/          # Claude Code
│   ├── TDD.md
│   ├── prod-test_code_separation.md
│   └── testing-best-practices.md
├── .github/
│   └── copilot-instructions.md  # GitHub Copilot
├── .cursor/rules/               # Cursor
│   ├── tdd.mdc
│   ├── code-separation.mdc
│   └── testing-best-practices.mdc
├── .continue/rules/             # Continue
│   ├── tdd.md
│   ├── code-separation.md
│   └── testing-best-practices.md
├── .cody/                       # Sourcegraph Cody
│   ├── cody.json
│   └── instructions.md
├── .windsurfrules               # Windsurf
├── CONVENTIONS.md               # Aider
└── CLAUDE.md                    # Claude Code (root)
```

## Rules Enforced

All AI tools are configured to enforce these project standards:

### 1. Test-Driven Development (TDD)

```
RED     → Write failing test first
GREEN   → Write minimal code to pass
REFACTOR → Improve while keeping tests green
COMMIT  → Only when tests pass
```

**Key rules:**
- Never write production code without a failing test
- Tests must trace to `features/*.feature` specifications
- Ask "what test should I write?" before "what code should I write?"

### 2. Test/Production Code Separation

```
crate/
├── src/           # Production code ONLY
│   ├── lib.rs
│   └── module.rs
└── tests/         # Test code ONLY
    ├── common/    # Shared test utilities
    └── *_test.rs
```

**Forbidden:**
- `#[cfg(test)]` modules in `src/` files
- Test helpers or mocks in production directories
- Production logic in test files

### 3. Testing Best Practices

| Practice | Requirement |
|----------|-------------|
| Coverage | 90%+ on `vauchi-core` |
| Test design | One assertion per concept |
| Naming | `test_<scenario>_<expected_outcome>` |
| Structure | AAA pattern (Arrange, Act, Assert) |
| Independence | No shared mutable state |
| Speed | Unit tests < 100ms |

**Mocking policy:**
- Mock external dependencies only (network, database, filesystem)
- **NEVER mock cryptographic operations** - use real `ring` implementations
- Prefer in-memory fakes over mock frameworks

## Using AI Assistants

### Claude Code

```bash
# Uses CLAUDE.md at repo root + .aiassistant/rules/
claude

# Rules apply automatically
```

### GitHub Copilot

Instructions in `.github/copilot-instructions.md` are loaded automatically in VS Code, JetBrains, and other supported IDEs.

### Cursor

Rules in `.cursor/rules/*.mdc` are loaded automatically. The `alwaysApply: true` frontmatter ensures rules are active for all files.

### Aider

```bash
# CONVENTIONS.md is read automatically
aider

# Or specify explicitly
aider --read CONVENTIONS.md
```

### Continue

Rules in `.continue/rules/` are loaded by the Continue extension. Configure in your IDE settings.

### Windsurf

`.windsurfrules` is loaded automatically by Windsurf/Codeium.

### Cody

`.cody/cody.json` provides custom instructions for Sourcegraph Cody.

## AI Workflow Guidelines

### Before Starting

1. Ensure AI tool has loaded project rules
2. Verify the tool understands TDD requirements
3. Check that code separation rules are active

### During Development

1. **Ask for tests first** - If the AI writes production code without tests, redirect
2. **Review generated tests** - Ensure they follow naming conventions and cover edge cases
3. **Verify file placement** - Tests go in `tests/`, production code in `src/`
4. **Check mocking** - Ensure crypto operations use real implementations

### After Changes

1. Run `just check` to verify all tests pass
2. Verify coverage hasn't dropped below 90%
3. Ensure no test code leaked into `src/`

## Troubleshooting

### AI Ignoring TDD Rules

Some AI tools may not properly load rules. Try:
- Explicitly mention "follow TDD" in your prompt
- Reference the rules file: "Follow the rules in CLAUDE.md"
- Break requests into smaller steps: "First, write a failing test for X"

### Code Placed in Wrong Directory

If AI places tests in `src/` or production code in `tests/`:
- Remind the tool: "Tests belong in tests/, production code in src/"
- Ask it to move the file to the correct location

### Crypto Being Mocked

If AI suggests mocking crypto:
- Reject immediately: "Never mock crypto. Use real ring implementations"
- Point to `docs/TDD_RULES.md` for the mocking policy

## Adding Support for New Tools

To add rules for a new AI tool:

1. Research the tool's configuration format
2. Create a new config file following the tool's conventions
3. Include these three rule categories:
   - TDD workflow
   - Test/production code separation
   - Testing best practices
4. Add the tool to this documentation
5. Test that the tool properly loads and follows the rules

## References

- [`TDD_RULES.md`](../2026-01-22-TDD_RULES.md) - Full TDD methodology
- [`testing.md`](2026-01-22-testing.md) - Test organization and utilities
- `features/*.feature` - Gherkin specifications tests must trace to
