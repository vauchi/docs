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
| Local storage | XChaCha20-Poly1305 |

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
| Signing | Ed25519 | `ed25519-dalek` |
| Key exchange | X25519 | `x25519-dalek` |
| Symmetric encryption | XChaCha20-Poly1305 | `chacha20poly1305` |
| Password KDF | Argon2id | `argon2` |
| Key derivation | HKDF-SHA256 | `hkdf` |

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
| **Network surveillance** | TLS + Noise NK + E2E encryption — traffic is encrypted three layers deep |
| **Man-in-the-middle** | In-person verification — you verify identity yourself |
| **Spam/harvesting** | Proximity required — can't be added remotely |
| **Device theft** | Hardware-backed key storage, optional biometrics |
| **Lost device** | Social recovery + encrypted backups |
| **Traffic analysis** | Message padding to fixed sizes |
| **Replay attacks** | One-time tokens, message counters |

## Best Practices

### For Users

1. **Create a backup** — Protect against device loss
2. **Use a strong backup password** — A passphrase (4+ words) is recommended. Store it somewhere safe, separate from your devices
3. **Verify important contacts** — Compare fingerprints in person
4. **Revoke lost devices immediately** — Prevent unauthorized access
5. **Keep your device secure** — Enable lock screen, update OS
6. **Only link devices you physically control** — Each linked device has full access to your identity

### For Privacy

1. **Review visibility settings** — Control what each contact sees
2. **Limit field sharing** — Only share what's needed
3. **Remove old contacts** — They keep seeing updates otherwise

### For Recovery

Set up social recovery to protect against total device loss:

1. **Choose diverse guardians** — Spread across different social circles (e.g., one family member, one friend, one colleague)
2. **Don't rely on one group** — If all guardians are family, a single household event could make recovery impossible
3. **Set threshold to at least 3** — Higher thresholds are more secure
4. **Update guardians when relationships change** — Remove guardians you've lost touch with and add new ones
5. **Review periodically** — Check your guardian list once a year

### For Backups

1. **Use a strong passphrase** — At least 4 random words or equivalent strength
2. **Store backups securely** — On a USB drive, external storage, or a secure location separate from your devices
3. **Don't store on cloud services** — Backup files are encrypted, but keeping them local is more private
4. **Create fresh backups** — After adding new contacts or linking devices

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
