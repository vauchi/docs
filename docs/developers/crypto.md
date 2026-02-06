<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Cryptography Reference

Concise reference for all cryptographic operations in Vauchi.

## Algorithms

| Purpose | Algorithm | Library | Notes |
|---------|-----------|---------|-------|
| **Signing** | Ed25519 | `ring` | Identity, device registry, revocation |
| **Key Exchange** | X25519 | `x25519-dalek` | Simplified X3DH for in-person exchange |
| **Symmetric Encryption** | XChaCha20-Poly1305 | `chacha20poly1305` | Primary cipher |
| **Legacy Symmetric** | AES-256-GCM | `ring` | Backward-compatible decryption |
| **Forward Secrecy** | Double Ratchet | HKDF + HMAC (`ring`) | Chain limit 2000 |
| **Key Derivation** | HKDF-SHA256 | `ring` | RFC 5869, domain-separated |
| **Password KDF** | Argon2id | `argon2` | m=64MB, t=3, p=4 (OWASP) |
| **Legacy Password** | PBKDF2-HMAC-SHA256 | `ring` | 100k iterations, backups only |
| **CSPRNG** | SystemRandom | `ring` | All random generation |

## Key Types

### Identity Keys

| Key | Type | Size | Purpose |
|-----|------|------|---------|
| Master Seed | Symmetric | 256-bit | Root of all keys |
| Signing Key | Ed25519 | 32+64 bytes | Identity, signatures |
| Exchange Key | X25519 | 32 bytes | Key agreement |

### Storage Keys (Shredding Hierarchy)

```
Master Seed (256-bit)
├── Identity Signing Key       — raw seed (Ed25519 requirement)
├── Exchange Key               — HKDF(seed, "Vauchi_Exchange_Seed")
└── SMK (Shredding Master Key) — HKDF(seed, "Vauchi_Shred_Key")
    ├── SEK (Storage Encryption Key) — HKDF(SMK, "Vauchi_Storage_Key")
    │   └── encrypts all local SQLite data
    ├── FKEK (File Key Encryption Key) — HKDF(SMK, "Vauchi_FileKey_Key")
    │   └── encrypts file key storage
    └── Per-Contact CEK — random 256-bit per contact
        └── encrypts individual contact's card data
```

**HKDF Convention**: Master seed as salt, empty IKM, domain string as info (documented as "DP-5").

### Ratchet Keys

| Key | Type | Lifecycle |
|-----|------|-----------|
| Root Key | 32 bytes | Updated on DH ratchet |
| Chain Key | 32 bytes | Advances with each message |
| Message Key | 32 bytes | Single-use, deleted after |

## Ciphertext Format

```
algorithm_tag (1 byte) || nonce || ciphertext || tag
```

| Tag | Algorithm | Nonce | Notes |
|-----|-----------|-------|-------|
| `0x01` | AES-256-GCM | 12 bytes | Legacy (ring-only era) |
| `0x02` | XChaCha20-Poly1305 | 24 bytes | Default since v0.1.2 |
| `0x03` | XChaCha20-Poly1305 + AD | 24 bytes | Double Ratchet (header-bound) |

Tag `0x03` binds message header as AEAD associated data to prevent relay manipulation.

## Message Padding

All messages padded to fixed buckets before encryption:

| Bucket | Size | Typical Content |
|--------|------|-----------------|
| Small | 256 B | ACK, presence, revocation |
| Medium | 1 KB | Card deltas, small updates |
| Large | 4 KB | Media references, large payloads |

Messages > 4 KB: rounded to next 256-byte boundary.

Format: `[4-byte BE length prefix] [plaintext] [random padding]`

## X3DH Key Agreement

Simplified X3DH for in-person exchange (no signed pre-keys):

### QR One-Way (Asymmetric)

```
Responder (scans QR):
  ephemeral ← generate X25519 keypair
  shared ← DH(ephemeral_secret, initiator_public)

Initiator (shows QR):
  shared ← DH(identity_secret, responder_ephemeral)
```

### Mutual QR (Symmetric)

```
Both sides:
  ephemeral ← generate X25519 keypair
  shared ← DH(our_ephemeral_secret, their_ephemeral_public)
```

### NFC/BLE Exchange

Same as Mutual QR — fresh ephemeral keys on both sides for full forward secrecy.

## Double Ratchet

```
┌─────────────────────────────────────────────────────────────┐
│                    DOUBLE RATCHET                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  DH RATCHET                          │   │
│  │                                                      │   │
│  │    our_dh_secret × their_dh_public                  │   │
│  │              ↓                                       │   │
│  │    HKDF(root_key, shared_secret)                    │   │
│  │              ↓                                       │   │
│  │    [new_root_key, new_chain_key]                    │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              SYMMETRIC RATCHET                       │   │
│  │                                                      │   │
│  │    chain_key                                        │   │
│  │        ↓                                            │   │
│  │    HKDF(chain_key, "Vauchi_Message_Key")           │   │
│  │        → message_key (single use)                   │   │
│  │        ↓                                            │   │
│  │    HKDF(chain_key, "Vauchi_Chain_Key")             │   │
│  │        → next_chain_key                             │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Limits:                                                    │
│    • Max chain generations: 2000                           │
│    • Max skipped keys stored: 1000                         │
│    • Message key deleted immediately after use             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Message Header (Authenticated, Not Encrypted)

```rust
RatchetHeader {
    dh_public: [u8; 32],      // Current DH public key
    dh_generation: u32,       // DH ratchet step counter
    message_index: u32,       // Message index in current chain
    previous_chain_length: u32, // Messages sent in previous chain
}
```

Total: 44 bytes, bound as AEAD associated data (tag `0x03`).

## Backup Format

### v2 (Current)

```
[0x02] || salt(16) || ciphertext
```

- Key derivation: Argon2id (m=64MB, t=3, p=4)
- Cipher: XChaCha20-Poly1305
- Plaintext: `display_name_len(4) || display_name || master_seed(32) || device_index(4) || device_name_len(4) || device_name`

### v1 (Legacy)

```
salt(16) || nonce(12) || ciphertext || tag(16)
```

- Key derivation: PBKDF2-HMAC-SHA256 (100k iterations)
- Cipher: AES-256-GCM

Import auto-detects version by first byte.

## Security Properties

| Property | Mechanism |
|----------|-----------|
| **Confidentiality** | XChaCha20-Poly1305 encryption |
| **Integrity** | AEAD authentication tag |
| **Authenticity** | Ed25519 signatures |
| **Forward Secrecy** | Double Ratchet, message keys deleted |
| **Break-in Recovery** | DH ratchet with ephemeral keys |
| **No Nonce Reuse** | Random 24-byte nonces |
| **Memory Safety** | `zeroize` on drop for all keys |
| **Traffic Analysis Prevention** | Fixed-size message padding |
| **Replay Prevention** | Double Ratchet counters |

## Source Files

| Module | Path |
|--------|------|
| Key Derivation | `core/vauchi-core/src/crypto/kdf.rs` |
| Signing | `core/vauchi-core/src/crypto/signing.rs` |
| Encryption | `core/vauchi-core/src/crypto/encryption.rs` |
| Double Ratchet | `core/vauchi-core/src/crypto/ratchet.rs` |
| Chain Key | `core/vauchi-core/src/crypto/chain.rs` |
| CEK | `core/vauchi-core/src/crypto/cek.rs` |
| Shredding | `core/vauchi-core/src/crypto/shredding.rs` |
| Password KDF | `core/vauchi-core/src/crypto/password_kdf.rs` |
| X3DH | `core/vauchi-core/src/exchange/x3dh.rs` |
| Padding | `core/vauchi-core/src/crypto/padding.rs` |

## Related Documentation

- [Architecture Overview](architecture.md) — System design
- [Encryption Feature](../users/features/encryption.md) — User-friendly explanation
- [Security](../about/security.md) — Security model overview
