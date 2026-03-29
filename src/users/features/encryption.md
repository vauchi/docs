<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Encryption

How Vauchi protects your data.

---

## Overview

Everything in Vauchi is end-to-end encrypted.
Only you and your contacts can read your data —
not us, not the relay server, not anyone else.

## What's Encrypted

| Data | Encrypted? | Who Can Read |
|------|------------|--------------|
| Your contact card | Yes | You + your contacts |
| Messages between devices | Yes | Your devices only |
| Backup | Yes | You only (with password) |
| Data at rest (on device) | Yes | You only |
| Data in transit | Yes | You + recipient only |

## How It Works

### Your Identity

When you create your identity, Vauchi generates:

- A **master seed** (256 random bits) — the root
  of all your keys
- A **signing key** (Ed25519) — proves messages
  are from you
- An **exchange key** (X25519) — establishes shared
  secrets with contacts

These keys never leave your device unencrypted.

### Exchanging Contacts

When you exchange with someone:

1. You scan their QR code
  (contains their public key)
2. Both devices perform X3DH key agreement
3. A shared secret is established that only you
  two know
4. All future communication is encrypted with
  this secret

```
Your Keys          Shared Secret          Their Keys
    ↘                   ↓                    ↙
     └───── X3DH Key Agreement ─────┘
                    ↓
          Unique encryption key
          (known only to you two)
```

### Updates Between Contacts

When you update your card:

1. The update is encrypted with the shared key
  for each contact
2. Different contacts may receive different updates
  (per visibility)
3. Each message uses a unique key (forward secrecy)
4. The relay only sees encrypted blobs

### Forward Secrecy

Vauchi uses the Double Ratchet protocol
(same as Signal):

- Each message uses a unique encryption key
- Keys are derived, used once, then deleted
- Even if one key is compromised, other messages
  stay secure
- Past messages can't be decrypted with current keys

## Encryption Algorithms

| Purpose | Algorithm | Notes |
|---------|-----------|-------|
| Signing | Ed25519 | Identity and authenticity |
| Key exchange | X25519 | Shared secrets |
| Symmetric encryption | XChaCha20-Poly1305 | All data |
| Key derivation | HKDF-SHA256 | Derives keys from seeds |
| Password KDF | Argon2id | Protects backups |

All cryptography uses well-known Rust libraries.
Core signing and key-exchange libraries
(`ed25519-dalek`, `x25519-dalek`) were
professionally audited by Trail of Bits.
Encryption and KDF libraries
(`chacha20poly1305`, `argon2`) implement
IETF-standardized algorithms.

## What the Relay Server Sees

The relay server routes messages but cannot read
them:

| Relay Sees | Relay Cannot See |
|------------|------------------|
| Encrypted blobs | Message content |
| Recipient ID | Your identity |
| Timestamps | What you changed |
| Message size (padded) | Who you are |

Messages are padded to standardized bucket sizes
(256 B, 512 B, 1 KB, 4 KB) to prevent size-based
analysis.

## Device Security

Your data is protected on your device:

| Platform | Key Storage | Protection |
|----------|-------------|------------|
| iOS | Keychain | OS-protected |
| Android | KeyStore | OS-protected |
| macOS | Keychain | OS-protected |
| Windows | Credential Manager | OS-protected |
| Linux | Secret Service | If available |

## Backup Security

Backups are encrypted with your password:

1. **Key derivation:** Argon2id
  (memory-hard, resistant to brute force)
2. **Encryption:** XChaCha20-Poly1305
3. **Result:** Without your password, the backup
  is useless

We recommend passphrases (4+ random words) for
memorable yet secure passwords.

## Security Properties

| Property | How Vauchi Achieves It |
|----------|------------------------|
| **Confidentiality** | XChaCha20-Poly1305 |
| **Integrity** | AEAD authentication tags |
| **Authenticity** | Ed25519 signatures |
| **Forward secrecy** | Double Ratchet, one-time keys |
| **Break-in recovery** | DH ratchet, ephemeral keys |
| **Replay prevention** | Per-message nonces |
| **Traffic analysis** | Message padding |

## Open Source

All Vauchi code is open source:

- Inspect the encryption implementation yourself
- Verify our security claims
- Report vulnerabilities responsibly

Source: [https://gitlab.com/vauchi](https://gitlab.com/vauchi)

## Limitations

What encryption **doesn't** protect:

- **Metadata you share:** Your name, fields you
  make visible
- **Physical access:** Someone with your unlocked
  device
- **Screenshots:** If a contact screenshots your
  card
- **Deleted data:** Until secure delete completes

## Related

- [Security Overview](../../about/security.md)
  — Broader security information
- [Cryptography Reference](../../developers/crypto.md)
  — Technical details
- [Privacy Controls](privacy-controls.md)
  — Control what contacts see
