<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Technology Stack

## Core Library (Shared)

| Component | Technology | Notes |
|-----------|------------|-------|
| Language | Rust | Memory safety, cross-platform |
| Crypto | `ed25519-dalek`, `x25519-dalek`, `chacha20poly1305`, `argon2` | RustCrypto audited crates |
| Storage | SQLite | Encrypted with XChaCha20-Poly1305 |
| Serialization | serde + JSON | Protocol messages |
| FFI | UniFFI | Swift/Kotlin bindings |

## Mobile Apps

### iOS

| Component | Technology |
|-----------|------------|
| UI Framework | SwiftUI |
| Language | Swift |
| Bindings | UniFFI (SPM package) |
| Min iOS | 15.0 |

### Android

| Component | Technology |
|-----------|------------|
| UI Framework | Jetpack Compose |
| Language | Kotlin |
| Bindings | UniFFI (Gradle dependency) |
| Min SDK | 26 (Android 8.0) |

## Desktop Apps (Native)

| Platform | Framework | Language | Bindings |
|----------|-----------|----------|----------|
| macOS | SwiftUI | Swift | UniFFI (SPM) |
| Linux (GTK) | GTK4 + libadwaita | Rust | Direct (same process) |
| Linux (Qt) | Qt 6 | C++ | C ABI (vauchi-cabi) |
| Windows | WinUI 3 | C# (.NET 8) | C ABI (vauchi-cabi) |

## Web Demo

| Component | Technology | Notes |
|-----------|------------|-------|
| Framework | SolidJS | TypeScript, WASM bridge |
| Core | vauchi-core (WASM) | `wasm32-unknown-unknown` target |
| Crypto | Pure RustCrypto (WASM) | No WebCrypto bridge needed (SP-30) |

## CLI & TUI

| Component | Technology |
|-----------|------------|
| CLI | Rust (clap) |
| TUI | Rust (ratatui) |

## Relay Server

| Component | Technology | Notes |
|-----------|------------|-------|
| Language | Rust | Standalone binary |
| WebSocket | tokio-tungstenite | Async runtime |
| TLS | rustls | Certificate handling |
| Storage | In-memory + disk | Encrypted blobs only |

## Development Tools

| Tool | Purpose |
|------|---------|
| Just | Task runner |
| Cargo | Rust package manager |
| npm/pnpm | JavaScript dependencies |
| Docker | Containerization |
| GitLab CI | Continuous integration |

## Performance Targets

| Operation | Target |
|-----------|--------|
| Contact exchange | < 3 seconds |
| Update propagation | < 30 seconds (when online) |
| Local operations | < 100ms |
| App startup | < 2 seconds |

## Data Limits

| Limit | Value |
|-------|-------|
| Max contact card size | 64KB (encrypted) |
| Max contacts per user | 10,000 |
| Max fields per card | 100 |
| Max linked devices | 10 |

## Repository Dependencies

```
vauchi-core (standalone, no workspace deps)
    ↑ (git dependency)
cli/, tui/, e2e/, macos/, windows/, linux-gtk/, linux-qt/, web-demo/

vauchi-platform (UniFFI bindings, in core/ workspace)
    ↑ (via generated binding repos)
android/ ← vauchi-platform-kotlin (Gradle)
ios/     ← vauchi-platform-swift (SPM)

vauchi-cabi (C ABI exports, in core/ workspace)
    ↑ (cbindgen)
linux-qt/, windows/

relay/ (standalone, uses vauchi-protocol for shared types only)
```

Downstream repos use git dependencies with branch-based pinning (`branch = "main"`).
Local development uses `.cargo/config.toml` path overrides.

## Related Documentation

- [Architecture Overview](architecture.md) — System design
- [Contributing Guide](contributing.md) — Development setup
- [Crypto Reference](crypto.md) — Cryptographic details
