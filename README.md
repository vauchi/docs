<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Vauchi Documentation

User and developer documentation for [Vauchi](https://gitlab.com/vauchi) — privacy-focused updatable contact cards via in-person QR exchange.

## Structure

```
docs/
├── architecture/              # System design documents
├── development/               # Developer setup and contribution guides
├── diagrams/                  # Visual system documentation (Mermaid)
├── knowledge/                 # External research (shared learnings)
├── legal/                     # Privacy policy, terms of service
├── postmortems/               # Post-incident analysis
└── workflows/                 # Development workflow documentation
```

## Key Documents

### Getting Started

| Document | Description |
|----------|-------------|
| [User Guide](2026-01-22-user-guide.md) | How to use Vauchi |
| [FAQ](2026-01-22-faq.md) | Frequently asked questions |
| [TDD Rules](2026-01-22-TDD_RULES.md) | Test-Driven Development workflow |
| [Problem to Solution Flow](2026-01-23-problem-to-solution-flow.md) | How all work flows through the project |

### Architecture

| Document | Description |
|----------|-------------|
| [Architecture Overview](architecture/) | System design documents |
| [Cryptography](architecture/2026-01-22-cryptography.md) | Cryptographic design |
| [Exchange Protocol](architecture/2026-01-22-exchange-protocol.md) | QR exchange protocol |
| [Relay Server](architecture/2026-01-22-relay.md) | Relay server design |
| [Multi-Device Sync](architecture/2026-01-22-sync.md) | Multi-device sync |
| [Tech Stack](architecture/2026-01-22-tech-stack.md) | Technology choices and rationale |

### Security

| Document | Description |
|----------|-------------|
| [Threat Analysis](2026-01-22-THREAT_ANALYSIS.md) | Threat model and mitigations |
| [Security Architecture](architecture/2026-01-22-security.md) | Security architecture |

### Diagrams

| Document | Description |
|----------|-------------|
| [Contact Exchange](diagrams/01-contact-exchange.md) | QR contact exchange flow |
| [Device Linking](diagrams/02-device-linking.md) | Device linking process |
| [Sync Updates](diagrams/03-sync-updates.md) | Contact update sync |
| [Contact Recovery](diagrams/04-contact-recovery.md) | Recovery from backup |

### Development

| Document | Description |
|----------|-------------|
| [Testing](development/2026-01-22-testing.md) | Test organization and utilities |
| [AI-Assisted Coding](development/2026-01-22-ai-assisted-coding.md) | AI tool configurations for the project |
| [Aha Moments](2026-01-22-aha-moments.md) | Key insights and design breakthroughs |

### Workflows

| Document | Description |
|----------|-------------|
| [Exchange](workflows/2026-01-22-exchange.md) | Contact exchange workflow |
| [Multi-Device](workflows/2026-01-22-multi-device.md) | Multi-device setup and sync |
| [Recovery](workflows/2026-01-22-recovery.md) | Identity and contact recovery |
| [Visibility](workflows/2026-01-22-visibility.md) | Per-contact visibility control |

## File Naming Convention

All files must be prefixed with date: `YYYY-MM-DD-<name>.md`

**Exceptions:**
- `README.md`
- `CLAUDE.md`
- `CONTRIBUTING.md`
- `roadmap.md`
- Files in `diagrams/`
- Problem artifact files (investigation.md, etc.)

## Related Repositories

| Repository | Description |
|------------|-------------|
| [vauchi/core](https://gitlab.com/vauchi/core) | Core Rust library |
| [vauchi/features](https://gitlab.com/vauchi/features) | Gherkin feature specs |
| [vauchi/relay](https://gitlab.com/vauchi/relay) | WebSocket relay server |
| [vauchi/cli](https://gitlab.com/vauchi/cli) | Command-line interface |
| [vauchi/desktop](https://gitlab.com/vauchi/desktop) | Tauri + SolidJS desktop app |
| [vauchi/android](https://gitlab.com/vauchi/android) | Android app |
| [vauchi/ios](https://gitlab.com/vauchi/ios) | iOS app |
| [vauchi/scripts](https://gitlab.com/vauchi/scripts) | Development scripts |
| [vauchi/website](https://gitlab.com/vauchi/website) | Landing page |
| [vauchi/assets](https://gitlab.com/vauchi/assets) | Brand assets |

## Contributing

1. Documentation should be clear and concise
2. Use Markdown format with date prefix
3. Include code examples where helpful
4. Keep security documentation up-to-date with code changes
5. Follow the [Problem to Solution Flow](2026-01-23-problem-to-solution-flow.md) for new features

## License

MIT
