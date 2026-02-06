<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Security

How Vauchi protects your data.

---

## Security Model

Vauchi is designed with the assumption that everything outside your device is hostile:

- **Relay server:** Assumed compromised
- **Network:** Assumed monitored
- **Other devices:** Verified through in-person exchange

Despite these assumptions, your data stays private because of end-to-end encryption.

## How We Protect You

### End-to-End Encryption

All communication is encrypted so only you and your contacts can read it:

| Data | Encryption |
|------|------------|
| Contact cards | XChaCha20-Poly1305 |
| Messages | XChaCha20-Poly1305 with Double Ratchet |
| Backups | XChaCha20-Poly1305 with Argon2id KDF |
| Local storage | AES-256-GCM |

The relay server only sees encrypted blobs. It cannot:

- Read your contacts
- See your card fields
- Decrypt any messages
- Link your identity to your data

### In-Person Verification

Contact exchange requires physical presence:

- **QR codes** contain cryptographic identity
- **Proximity verification** via ultrasonic audio
- **No trust-on-first-use** — you verify who you're connecting with

This prevents spam, impersonation, and man-in-the-middle attacks.

### Modern Cryptography

Vauchi uses battle-tested cryptographic libraries:

| Purpose | Algorithm | Library |
|---------|-----------|---------|
| Signing | Ed25519 | `ring` |
| Key exchange | X25519 | `x25519-dalek` |
| Symmetric encryption | XChaCha20-Poly1305 | `chacha20poly1305` |
| Password KDF | Argon2id | `argon2` |
| Key derivation | HKDF-SHA256 | `ring` |

All libraries are:

- Written in Rust (memory-safe)
- Well-audited
- Widely used in production

### Forward Secrecy

Each message uses a unique key derived via Double Ratchet:

- Keys are used once then deleted
- Even if one key is compromised, other messages stay safe
- Past messages can't be decrypted with current keys

## Threat Model

| Threat | Mitigation |
|--------|------------|
| **Server compromise** | E2E encryption — server can't read data |
| **Network surveillance** | TLS + E2E encryption — traffic is encrypted twice |
| **Man-in-the-middle** | In-person verification — you verify identity yourself |
| **Spam/harvesting** | Proximity required — can't be added remotely |
| **Device theft** | Hardware-backed key storage, optional biometrics |
| **Lost device** | Social recovery + encrypted backups |
| **Traffic analysis** | Message padding to fixed sizes |
| **Replay attacks** | One-time tokens, message counters |

## Best Practices

### For Users

1. **Create a backup** — Protect against device loss
2. **Use a strong backup password** — Passphrase recommended
3. **Verify important contacts** — Compare fingerprints in person
4. **Revoke lost devices immediately** — Prevent unauthorized access
5. **Keep your device secure** — Enable lock screen, update OS

### For Privacy

1. **Review visibility settings** — Control what each contact sees
2. **Limit field sharing** — Only share what's needed
3. **Remove old contacts** — They keep seeing updates otherwise

## Security Reporting

Found a security issue? Please report it responsibly:

**Email:** security@vauchi.app

We will:

- Acknowledge within 48 hours
- Investigate and fix verified issues
- Credit reporters (unless they prefer anonymity)
- Not pursue legal action against good-faith researchers

## Open Source

All code is open source and available for inspection:

- **GitLab:** [https://gitlab.com/vauchi](https://gitlab.com/vauchi)
- **GitHub Mirror:** [https://github.com/vauchi](https://github.com/vauchi)

We welcome security reviews and contributions.

## Technical Details

For cryptographic implementation details, see:

- [Encryption Feature](../users/features/encryption.md) — User-friendly explanation
- [Cryptography Reference](../developers/crypto.md) — Technical specification
