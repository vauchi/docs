<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Threat Model

Formal threat analysis of the Vauchi system using the STRIDE framework.

---

## System Context

Vauchi is a **contact card exchange** system, not a messaging app:

- **Traffic pattern**: Generated when users physically meet (exchange) or update contact info (small delta to all contacts)
- **Data type**: Contact cards (name, phone, email, address, social handles)
- **Exchange model**: In-person only via QR code, NFC, or BLE
- **Update frequency**: Infrequent (users rarely change phone numbers or emails)
- **Update size**: Small (delta of changed fields, typically < 1 KB)

This context shapes the threat model: low traffic volume and infrequent updates reduce the value of traffic analysis compared to messaging apps.

## Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT DEVICE                         │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ vauchi-core  │    │  Local DB    │    │  Platform    │   │
│  │ (crypto,     │    │ (encrypted   │    │  Keychain    │   │
│  │  protocol)   │    │  at rest)    │    │              │   │
│  └──────┬───────┘    └──────────────┘    └──────────────┘   │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │ TLS + E2E encrypted
          │
┌─────────▼────────────────────────────────────────────────────┐
│                      RELAY SERVER                             │
│                                                               │
│  • Assumed compromised (zero-knowledge design)               │
│  • Sees only encrypted blobs                                 │
│  • No user accounts, no decryption keys                      │
│  • Store-and-forward with TTL                                │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

| Boundary | Protection | Trust Level |
|----------|-----------|-------------|
| Client ↔ Relay | TLS + authenticated WebSocket | Relay is **untrusted** |
| Client ↔ Client | E2E encrypted (X3DH + Double Ratchet) | Verified in person |
| Device ↔ Device | Same identity, HKDF-derived device keys | Trusted (same master seed) |
| Contact ↔ Contact | Per-contact CEK, forward secrecy | Verified at exchange time |

## Assets

| Asset | Sensitivity | Description |
|-------|-------------|-------------|
| Contact card data | High | Personal info (phone, email, address) |
| Identity keys | Critical | Long-term Ed25519 signing and X25519 exchange keys |
| Master seed | Critical | 256-bit root secret for all key derivation |
| Social graph | High | Who knows whom (contact relationships) |
| Update metadata | Medium | When someone changed their info |

## Adversary Model

| Adversary | Capability | Motivation |
|-----------|------------|------------|
| Passive network observer | Sees encrypted traffic | Surveillance, profiling |
| Malicious relay operator | Runs a relay node | Data harvesting, traffic analysis |
| Compromised device | Full access to one device | Targeted attack, theft |
| Physical attacker | Steals or seizes device | Law enforcement, theft |
| Malicious contact | Legitimate contact | Social engineering, stalking |

## STRIDE Analysis

### Spoofing

**Threat**: Attacker impersonates a contact or creates a fake identity.

**Mitigations**:

- Ed25519 identity keys bound to each user
- Contact exchange requires **physical presence** (QR, NFC, or BLE with proximity check)
- No trust-on-first-use: you verify who you connect with in person
- Device registry is cryptographically signed; unauthorized devices cannot be added

**Residual risk**: Social engineering (convincing someone to scan a QR code under false pretenses).

### Tampering

**Threat**: Relay or network attacker modifies messages in transit.

**Mitigations**:

- AEAD encryption (XChaCha20-Poly1305) detects any modification via authentication tag
- Ed25519 signatures verify sender authenticity
- Double Ratchet message counters detect replay and reordering
- Device registry version numbers prevent rollback

**Residual risk**: None. Tampering is cryptographically detected and rejected.

### Repudiation

**Threat**: User denies having sent an update.

**Design decision**: Repudiation is a **privacy feature**, not a bug. Vauchi intentionally does not provide non-repudiation for contact card updates. Users should be able to update or remove their information without permanent proof of past states.

### Information Disclosure

**Threat**: Unauthorized access to contact card data.

**Mitigations**:

- All data E2E encrypted with XChaCha20-Poly1305 before leaving the device
- Per-contact encryption keys (CEK) derived via X3DH + Double Ratchet
- Forward secrecy: each message uses a unique key, deleted after use
- Relay stores only encrypted blobs (zero-knowledge)
- Local storage encrypted with device-derived keys (SEK from HKDF key hierarchy)
- Sensitive key material zeroized on drop (`zeroize` crate)
- Message padding to fixed buckets (256 B, 1 KB, 4 KB) prevents size-based inference

**Residual risk**: Metadata (connection timing, recipient pseudonyms) visible to relay. Mitigated by routing tokens, `suppress_presence`, and optional Tor support.

### Denial of Service

**Threat**: Attacker disrupts relay availability.

**Mitigations**:

- Token-bucket rate limiting (60 msgs/min per client, configurable)
- Stricter recovery rate limit (10 queries/min, anti-enumeration)
- Connection limit (max 1000 concurrent, RAII guard)
- Multi-layer timeout protection: handshake timeout, idle timeout (5 min)
- Message size limit (1 MB)
- Automatic message expiration (90-day TTL)
- Federation support for relay redundancy

**Residual risk**: Sustained DDoS from many source IPs can overwhelm a single relay.

### Elevation of Privilege

**Threat**: Attacker gains unauthorized capabilities.

**Mitigations**:

- No user accounts on relay: no admin interface, no privilege levels
- Client capabilities limited to own identity (can only decrypt own messages)
- Master seed required for all identity operations
- Device linking requires physical QR scan + identity key signature verification

**Residual risk**: Compromised device with master seed has full identity control. Mitigated by device revocation broadcast.

## Key Security Properties

| Property | Mechanism |
|----------|-----------|
| **Confidentiality** | XChaCha20-Poly1305 E2E encryption |
| **Integrity** | AEAD authentication tag + Ed25519 signatures |
| **Forward secrecy** | Double Ratchet with ephemeral DH keys |
| **Break-in recovery** | DH ratchet step generates new key material |
| **Zero-knowledge relay** | Relay sees only encrypted blobs, no decryption keys |
| **Physical verification** | QR + ultrasonic audio / NFC / BLE proximity |
| **Traffic analysis resistance** | Fixed-size message padding + routing tokens |
| **Memory safety** | Rust (no unsafe in crypto paths) + `zeroize` on drop |
| **Replay prevention** | Double Ratchet counters + version numbers |

## Attack Scenarios

### Relay Compromise

If an attacker gains full control of a relay:

- **Cannot** read contact card data (E2E encrypted)
- **Cannot** forge messages (AEAD + signatures)
- **Can** see pseudonymous recipient IDs and message timing
- **Can** drop or delay messages (detected by delivery acknowledgments)
- **Can** observe connection patterns (mitigated by Tor support)

### Device Theft

If an attacker steals a device:

- Master seed encrypted with user password via Argon2id (m=64 MB, t=3, p=4)
- Platform-native key storage (macOS Keychain, iOS Keychain, Android KeyStore)
- All key material zeroized on drop
- Weak passwords can be brute-forced (Argon2id raises cost significantly)
- **Recommendation**: Use a strong backup password, enable OS-level device encryption

### Recovery Impersonation

If an attacker tries to abuse social recovery:

- Must meet K contacts in person (default threshold: 3)
- Each voucher signs with their identity key
- Vouchers validated against victim's known contact list
- Conflicting claims detected and flagged by relay
- Voucher timestamps prevent replay (48-hour window)

## Known Limitations

| Limitation | Impact | Mitigation Path |
|-----------|--------|-----------------|
| Relay sees connection metadata | Social graph inference possible | Routing token rotation, Tor support |
| Device compromise exposes master seed | All-or-nothing with master seed | Strong passwords, platform keychain |
| Single relay is availability SPOF | Users can't sync if relay is down | Federation support |
| Blocked contacts retain old data | Cannot "unsend" previously shared info | By design (accept tradeoff) |
| Recovery reveals voucher public keys | Partial social graph leakage | Accepted tradeoff for recovery |

## Cryptographic Primitives

| Purpose | Algorithm | Library |
|---------|-----------|---------|
| Signing | Ed25519 | `ring` |
| Key exchange | X25519 | `x25519-dalek` |
| Symmetric encryption | XChaCha20-Poly1305 | `chacha20poly1305` |
| Legacy encryption | AES-256-GCM | `ring` |
| Password KDF | Argon2id | `argon2` |
| Key derivation | HKDF-SHA256 | `ring` |
| CSPRNG | SystemRandom | `ring` |

For the full cryptographic specification, see the [Cryptography Reference](crypto.md).

## Comparison with Messaging Apps

| Aspect | Vauchi | Messaging Apps |
|--------|--------|----------------|
| Traffic volume | Very low (rare updates) | High (continuous) |
| Timing analysis value | Low | High |
| Social graph value | Medium | High |
| Metadata exposure | Recipient ID only | Sender + recipient |
| Forward secrecy | Yes (Double Ratchet) | Varies |
| Relay knowledge | Encrypted blobs only | Often plaintext |
| Recovery model | Social vouching (K contacts, in person) | Phone number / cloud backup |

Vauchi's infrequent, small updates significantly reduce the value of traffic analysis compared to messaging apps.

## Security Reporting

Found a vulnerability? Please report it responsibly:

**Email**: security@vauchi.app

We acknowledge reports within 48 hours and do not pursue legal action against good-faith researchers.

## Related Documentation

- [Security Overview](../about/security.md) — User-friendly security explanation
- [Cryptography Reference](crypto.md) — Full cryptographic specification
- [Architecture Overview](architecture.md) — System design
