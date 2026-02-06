<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# System Overview

Vauchi is a privacy-focused contact card system. Users exchange contact cards in person via QR code, NFC, or Bluetooth. After exchange, cards update automatically — when you change your phone number, everyone who has your card sees the change.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VAUCHI SYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                           CLIENTS                                     │   │
│  │                                                                       │   │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
│  │   │   iOS   │  │ Android │  │ Desktop │  │   CLI   │  │   TUI   │   │   │
│  │   │ SwiftUI │  │ Compose │  │  Tauri  │  │  Rust   │  │  Rust   │   │   │
│  │   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘   │   │
│  │        │            │            │            │            │         │   │
│  │        └────────────┴─────┬──────┴────────────┴────────────┘         │   │
│  │                           │                                           │   │
│  │                    ┌──────▼──────┐                                    │   │
│  │                    │ vauchi-core │   Rust core library                │   │
│  │                    │  (UniFFI)   │   Crypto, storage, protocol        │   │
│  │                    └──────┬──────┘                                    │   │
│  │                           │                                           │   │
│  └───────────────────────────┼───────────────────────────────────────────┘   │
│                              │                                               │
│                              │ WebSocket (TLS)                               │
│                              │                                               │
│  ┌───────────────────────────▼───────────────────────────────────────────┐   │
│  │                         RELAY SERVER                                   │   │
│  │                                                                        │   │
│  │   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐        │   │
│  │   │ Blob Storage   │   │ Device Sync    │   │ Recovery Store │        │   │
│  │   │ (encrypted)    │   │ (per-device)   │   │ (90-day TTL)   │        │   │
│  │   └────────────────┘   └────────────────┘   └────────────────┘        │   │
│  │                                                                        │   │
│  │   • Store-and-forward encrypted messages                              │   │
│  │   • No access to plaintext (zero-knowledge)                           │   │
│  │   • Rate limiting, quotas, GDPR purge                                 │   │
│  │                                                                        │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### vauchi-core

The Rust core library provides all cryptographic and protocol functionality:

| Module | Purpose | Key Files |
|--------|---------|-----------|
| `crypto/` | Encryption, signing, key derivation | `encryption.rs`, `signing.rs`, `ratchet.rs` |
| `exchange/` | Contact exchange protocol | `session.rs`, `qr.rs`, `x3dh.rs` |
| `sync/` | Update propagation | `manager.rs`, `delta.rs` |
| `recovery/` | Social recovery | `mod.rs`, `voucher.rs` |
| `storage/` | Local encrypted database | `db.rs`, `schema.rs` |
| `network/` | Relay communication | `connection.rs`, `protocol.rs` |
| `i18n/` | Internationalization | `mod.rs` (runtime loading) |

### Relay Server

Standalone Rust server for message routing:

- WebSocket-based store-and-forward
- TLS required in production
- No user accounts — just encrypted blobs
- Background cleanup tasks (hourly)

### Client Applications

| Platform | Stack | Binding |
|----------|-------|---------|
| iOS | SwiftUI | `vauchi-mobile-swift` (SPM) |
| Android | Kotlin/Compose | `vauchi-mobile-android` (Gradle) |
| Desktop | Tauri + SolidJS | Direct Rust linkage |
| CLI | Rust | Direct library use |
| TUI | Rust (ratatui) | Direct library use |

## Data Flow

### 1. Contact Exchange (In-Person)

```
Alice                                 Bob
  │                                    │
  │─── Display QR (identity + key) ────│
  │                                    │
  │◄─── Scan QR, verify proximity ─────│
  │                                    │
  │─── X3DH key agreement ─────────────│
  │                                    │
  │◄─── Exchange encrypted cards ──────│
  │                                    │
  │ Both now have each other's cards   │
```

### 2. Card Updates (Remote via Relay)

```
Alice updates phone number
         │
         ▼
┌─────────────────┐
│ Encrypt delta   │  Per-contact shared key
│ with CEK        │  (Double Ratchet)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Send to relay   │  WebSocket
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Relay stores    │  Indexed by recipient_id
│ encrypted blob  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Bob connects    │  Receives pending messages
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Decrypt delta   │  Update Alice's card locally
└─────────────────┘
```

### 3. Multi-Device Sync

All devices under one identity share the same master seed. Device-specific keys are derived via HKDF:

```
Master Seed
    ├── Device 1 keys (HKDF + device_index)
    ├── Device 2 keys (HKDF + device_index)
    └── Device 3 keys (HKDF + device_index)
```

Device linking uses QR code scan with time-limited token.

### 4. Recovery (Social Vouching)

When all devices are lost:

1. Create new identity
2. Generate recovery claim (old_pk → new_pk)
3. Meet contacts in person, collect signed vouchers
4. When threshold (3) met, upload proof to relay
5. Other contacts discover proof, verify via mutual contacts
6. Accept/reject identity transition

## Security Model

### End-to-End Encryption

- All card data encrypted with XChaCha20-Poly1305
- Per-contact keys derived via X3DH + Double Ratchet
- Forward secrecy: each message uses unique key
- Relay sees only encrypted blobs

### Key Hierarchy

```
Master Seed (256-bit, generated at identity creation)
├── Identity Signing Key (Ed25519, raw seed)
├── Exchange Key (X25519, HKDF derived)
└── SMK (Shredding Master Key, HKDF derived)
    ├── SEK (Storage Encryption Key)
    ├── FKEK (File Key Encryption Key)
    └── Per-Contact CEK (random 256-bit)
```

### Physical Verification

Contact exchange requires in-person presence:
- QR + ultrasonic audio verification (18-20 kHz)
- NFC tap (centimeters range)
- BLE with RSSI proximity check

## Repository Structure

```
vauchi/                    ← Orchestrator repo
├── core/                  ← vauchi-core + vauchi-mobile
├── relay/                 ← WebSocket relay server
├── desktop/               ← Tauri + SolidJS
├── ios/                   ← SwiftUI app
├── android/               ← Kotlin/Compose app
├── cli/                   ← Command-line interface
├── tui/                   ← Terminal UI
├── features/              ← Gherkin specs
├── locales/               ← i18n JSON files
├── e2e/                   ← End-to-end tests
└── docs/                  ← Documentation
```

See [CLAUDE.md](https://gitlab.com/vauchi/vauchi/-/blob/main/CLAUDE.md) for complete repository details.

## Related Documentation

- [Crypto Reference](2026-02-06-crypto-reference.md) — Cryptographic operations
- [State Machines](2026-02-06-state-machines.md) — Protocol state diagrams
- [User Help Content](2026-02-06-user-help-content.md) — User-facing documentation
- [Exchange Protocol](https://gitlab.com/vauchi/private/-/blob/main/docs/architecture/2026-01-22-exchange-protocol.md) — Exchange details (internal)
- [Sync Architecture](https://gitlab.com/vauchi/private/-/blob/main/docs/architecture/2026-01-22-sync.md) — Sync protocol (internal)
