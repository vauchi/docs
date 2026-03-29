<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# For Developers

Welcome to Vauchi development! This section contains
everything you need to contribute.

---

## Getting Started

New to the project? Start here:

1. [**Contributing Guide**](contributing.md) — Set up
   your environment and learn the workflow
2. [**Architecture Overview**](architecture.md) —
   Understand how the system works
3. [**GUI Guidelines**](gui-guidelines.md) &
   [**UX Guidelines**](ux-guidelines.md) — Design
   rules for all platforms
4. [**Cryptography Reference**](crypto.md) — Deep dive into encryption

## Documentation

| Document | Description |
|----------|-------------|
| [Contributing](contributing.md) | Dev workflow, code guidelines, PR process |
| [GUI Guidelines](gui-guidelines.md) | Component design — toasts, editing |
| [UX Guidelines](ux-guidelines.md) | Physical-first, local-first, flow design |
| [Architecture](architecture.md) | System overview, components, data flow |
| [Cryptography](crypto.md) | Encryption algorithms, key management, protocols |
| [Tech Stack](tech-stack.md) | Languages, frameworks, libraries |
| [Diagrams](diagrams/index.md) | Sequence diagrams for core flows |

## Repository Structure

Vauchi is a multi-repo project under the
[`vauchi` GitLab group](https://gitlab.com/vauchi):

| Repository | Purpose |
|------------|---------|
| `vauchi/` | Orchestrator repo (this documentation) |
| `core/` | Rust workspace: vauchi-core + UniFFI bindings |
| `relay/` | WebSocket relay server |
| `linux-gtk/` | GTK4 Linux desktop app |
| `linux-qt/` | Qt6 (Widgets) Linux desktop app |
| `macos/` | macOS native app (SwiftUI) |
| `windows/` | Windows native app (WinUI3) |
| `ios/` | SwiftUI app |
| `android/` | Kotlin/Compose app |
| `features/` | Gherkin specs |
| `locales/` | i18n JSON files |

## Quick Commands

```bash
# Clone and setup workspace
git clone git@gitlab.com:vauchi/vauchi.git
cd vauchi
just setup

# Build everything
just build

# Run all checks
just check

# Run tests
just test

# Show all commands
just help
```

## Key Principles

All development follows our [core principles](../about/principles.md):

- **TDD mandatory** — Red → Green → Refactor
- **90%+ coverage** — For vauchi-core
- **Real crypto in tests** — No mocking
- **Problem-first** — Every task starts as a problem record

## Getting Help

- **Issues:** [GitLab Issues](https://gitlab.com/vauchi/vauchi/-/issues)
- **Discussions:** [GitLab Issues](https://gitlab.com/vauchi/vauchi/-/issues)
- **Code of Conduct:** [Community Standards](../about/community.md)
