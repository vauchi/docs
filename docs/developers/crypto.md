<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- SSOT: Public cryptography reference. Internal spec: _private/docs/specs/2026-01-22-cryptography.md -->

# Cryptography Reference

Concise reference for all cryptographic operations in Vauchi.

## Algorithms

| Purpose | Algorithm | Library | Notes |
|---------|-----------|---------|-------|
| **Signing** | Ed25519 | `ring` | Identity, device registry, revocation |
| **Key Exchange** | X25519 | `x25519-dalek` | X3DH with identity binding for in-person exchange |
| **Symmetric Encryption** | XChaCha20-Poly1305 | `chacha20poly1305` | Primary cipher |
| **Legacy Symmetric** | AES-256-GCM | `ring` | Backward-compatible decryption |
| **Forward Secrecy** | Double Ratchet | HKDF + HMAC (`ring`) | Chain limit 2000 |
| **Key Derivation** | HKDF-SHA256 | `ring` | RFC 5869, domain-separated |
| **Password KDF** | Argon2id | `argon2` | m=64MB, t=3, p=4 (OWASP) |
| **Legacy Password** | PBKDF2-HMAC-SHA256 | `ring` | 600k iterations (v18+) / 100k (pre-v18), backups only |
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
├── Exchange Key               — HKDF(seed, "Vauchi_Exchange_Seed_v2")
└── SMK (Shredding Master Key) — HKDF(seed, "Vauchi_Shred_Key_v2")
    ├── SEK (Storage Encryption Key) — HKDF(SMK, "Vauchi_Storage_Key_v2")
    │   └── encrypts all local SQLite data
    ├── FKEK (File Key Encryption Key) — HKDF(SMK, "Vauchi_FileKey_Key_v2")
    │   └── encrypts file key storage
    └── Per-Contact CEK — random 256-bit per contact
        └── encrypts individual contact's card data
```

**HKDF Convention**: Master seed as IKM, no salt, domain string as info. All derivations use `HKDF::derive_key(None, &seed, info)`.

**HKDF Context Strings**:

| Context | Usage |
|---------|-------|
| `Vauchi_Exchange_Seed_v2` | Exchange key derivation from master seed |
| `Vauchi_Shred_Key_v2` | SMK derivation from master seed |
| `Vauchi_Storage_Key_v2` | SEK derivation from SMK |
| `Vauchi_FileKey_Key_v2` | FKEK derivation from SMK |
| `vauchi-x3dh-symmetric-v2` | X3DH transcript binding (4-key HKDF info) |
| `vauchi-x3dh-key-v2` | X3DH key agreement derivation |
| `Vauchi_Root_Ratchet` | DH ratchet root key step |
| `Vauchi_Message_Key` | Symmetric ratchet message key |
| `Vauchi_Chain_Key` | Symmetric ratchet chain key advance |
| `Vauchi_AnonymousSender_v2` | Anonymous sender ID derivation |

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

Full X3DH with identity binding (no signed pre-keys):

### QR / Mutual Exchange (Symmetric)

```
Both sides:
  ephemeral ← generate X25519 keypair
  shared_bytes ← DH(our_ephemeral_secret, their_ephemeral_public)

  // Transcript binding: all four public keys sorted lexicographically
  // and appended to info, preventing identity misbinding attacks
  info ← "vauchi-x3dh-symmetric-v2" || sort(id_lo, id_hi) || sort(eph_lo, eph_hi)
  shared ← HKDF(ikm=shared_bytes, salt=None, info=info)
```

### NFC/BLE Exchange

Same as Mutual QR — fresh ephemeral keys on both sides, HKDF-derived shared secret.

## Double Ratchet

```
┌─────────────────────────────────────────────────────────────────┐
│                         DOUBLE RATCHET                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                        DH RATCHET                         │  │
│  │                                                           │  │
│  │    our_dh_secret × their_dh_public                        │  │
│  │              ↓                                            │  │
│  │    HKDF(root_key, shared_secret, "Vauchi_Root_Ratchet")   │  │
│  │              ↓                                            │  │
│  │    [new_root_key, new_chain_key]                          │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   SYMMETRIC RATCHET                       │  │
│  │                                                           │  │
│  │    chain_key                                              │  │
│  │        ↓                                                  │  │
│  │    HKDF(chain_key, "Vauchi_Message_Key")                  │  │
│  │        → message_key (single use)                         │  │
│  │        ↓                                                  │  │
│  │    HKDF(chain_key, "Vauchi_Chain_Key")                    │  │
│  │        → next_chain_key                                   │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Limits:                                                        │
│    • Max chain generations: 2000                                │
│    • Max skipped keys stored: 1000                              │
│    • Message key deleted immediately after use                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Ratchet Message (Authenticated, Not Encrypted Header)

```rust
RatchetMessage {
    dh_public: [u8; 32],      // Current DH public key
    dh_generation: u32,       // DH ratchet step counter
    message_index: u32,       // Message index in current chain
    previous_chain_length: u32, // Messages sent in previous chain
    ciphertext: Vec<u8>,      // Encrypted payload
}
```

Header (44 bytes) bound as AEAD associated data (tag `0x03`).

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

- Key derivation: PBKDF2-HMAC-SHA256 (600k iterations v18+ / 100k pre-v18)
- Cipher: AES-256-GCM

Import auto-detects version by first byte.

## Transport Encryption (Noise NK)

Client-to-relay communication uses a Noise NK inner transport layer as defense-in-depth inside TLS.

### Pattern

```
Noise_NK_25519_ChaChaPoly_BLAKE2s
```

**NK** means the relay's static public key is known to the client before the handshake (distributed via the `/info` HTTP endpoint as base64url). The client does **not** authenticate to the relay (anonymous initiator).

### Handshake

```
Pre-message:  <- s   (relay's static public key, known to client)
Message 1:    -> e, es   (client sends ephemeral, DH with relay static)
Message 2:    <- e, ee   (relay sends ephemeral, DH between ephemerals)
```

After Message 2, both sides derive symmetric keys for bidirectional encryption.

### v2 Framing

v2 (Noise-encrypted) connections are identified by a 3-byte magic prefix:

```
0x00 'V' '2' || 48-byte NK handshake message
```

The `0x00` first byte distinguishes v2 from v1 (plaintext JSON, which always starts with `{`). After the handshake completes, all subsequent WebSocket frames are Noise-encrypted.

### Why NK?

| Property | Benefit |
|----------|---------|
| **No client authentication** | Preserves anonymity — relay cannot link connections to identities |
| **Forward secrecy** | Ephemeral DH keys ensure past sessions can't be decrypted |
| **Relay authentication** | Client verifies the relay's identity via its static key |
| **Defense-in-depth** | If TLS is compromised, routing metadata (recipient IDs, message types) stays encrypted |

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `RELAY_REQUIRE_NOISE` | `false` | Reject v1 (plaintext) connections |

The relay's Noise keypair is auto-generated on first start and persisted to `{data_dir}/relay_noise_key.bin`.

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
| **Transport Encryption** | Noise NK inside TLS (defense-in-depth) |

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
| X3DH Session (Symmetric) | `core/vauchi-core/src/exchange/session.rs` |
| Padding | `core/vauchi-core/src/crypto/padding.rs` |

## Related Documentation

- [Architecture Overview](architecture.md) — System design
- [Encryption Feature](../users/features/encryption.md) — User-friendly explanation
- [Security](../about/security.md) — Security model overview
