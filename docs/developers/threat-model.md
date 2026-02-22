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

## Federation Security

When relays federate (forward blobs to peer relays for redundancy), additional trust boundaries apply.

**What a federated relay CAN see**:

- Recipient routing IDs (pseudonymous public key hashes)
- Blob sizes (padded to fixed buckets: 256, 512, 1024, 4096 bytes)
- Message creation timestamps and hop count
- Network topology via gossip protocol

**What a federated relay CANNOT see**:

- Message content (E2E encrypted)
- Sender identity (not included in federation protocol)
- Real identity behind routing IDs
- Client IP addresses (federation is relay-to-relay)

**Guarantees**:

- mTLS authentication prevents unauthorized peers
- Hop count limit prevents amplification attacks
- SHA-256 integrity verification on all federated blobs
- DNS rebinding protection: explicit resolution + SSRF validation before connecting to peer relays

## Device Linking (STRIDE)

| Category | Threat | Mitigation |
|----------|--------|------------|
| **Spoofing** | Attacker scans device link QR | QR expires in 5 min, physical proximity required |
| **Tampering** | Modified QR code | QR is signed by identity key |
| **Information Disclosure** | Master seed intercepted during transfer | Encrypted with ephemeral link key (XChaCha20-Poly1305) |
| **Denial of Service** | Excessive device linking | Maximum 10 devices per identity |
| **Elevation of Privilege** | Unauthorized device added to registry | Registry is cryptographically signed, version counter prevents rollback |

**Known limitation**: Currently, the full master seed is shared during device linking (not per-device subkeys). A compromised linked device gains full identity control. Per-device subkey isolation is planned for 1.0 release.

## Known Limitations

| Limitation | Impact | Mitigation Path |
|-----------|--------|-----------------|
| Relay sees connection metadata | Social graph inference possible | Routing token rotation, Tor support |
| Device compromise exposes master seed | All-or-nothing with master seed | Per-device subkeys (planned), strong passwords |
| Linked device receives full seed | Compromised device = full identity | Per-device subkeys (planned) |
| Single relay is availability SPOF | Users can't sync if relay is down | Federation, multi-relay failover (planned) |
| Blocked contacts retain old data | Cannot "unsend" previously shared info | By design (accept tradeoff) |
| Recovery reveals voucher public keys | Partial social graph leakage | Accepted tradeoff for recovery |
| No guardian diversity enforcement | All guardians from same circle | UX warnings (planned) |
| No key transparency post-exchange | Key history not auditable | Lightweight signed key log (future) |
| Push notifications would leak metadata | APNs/FCM see delivery timing | Empty push + app-side fetch (required design) |

## Core-UI Trust Boundary

The `vauchi-core` library is consumed by multiple UI layers (Desktop/Tauri, CLI, TUI, mobile Swift/Kotlin via UniFFI). The trust relationship between core and its callers:

**What core trusts from UI**:

- UI provides correct file paths for storage
- UI invokes lifecycle methods in the correct order (init before use)
- UI does not hold references to sensitive data after core has zeroized them

**What core does NOT trust from UI**:

- **Input lengths**: Core enforces maximum lengths at its API boundary (display name: 100 chars, field value: 1000 chars, field label: 64 chars, card size: 64 KB, avatar: 256 KB)
- **Field values**: Core validates phone/email format, URL safety, and rejects malformed data
- **Contact IDs**: Core verifies contact existence before processing updates
- **Ratchet messages**: Core validates signatures, AEAD tags, and replay nonces before accepting peer data
- **File content**: Core verifies checksums on all content fetched from remote servers

A compromised or buggy UI layer cannot cause `vauchi-core` to:

- Decrypt data for an unauthorized recipient
- Produce unsigned or weakly signed messages
- Skip replay detection or signature verification
- Bypass visibility label enforcement

**UniFFI surface note**: The UniFFI binding layer does not add rate limiting at the API boundary. Rate limiting for relay operations is enforced server-side. UI layers should implement their own rate limiting for user-facing operations to prevent accidental rapid-fire calls.

## Relay Metadata Exposure Analysis

While the relay sees only encrypted blobs, it observes metadata that can reveal the social graph:

**What the relay sees**:

| Datum | Visibility | Example |
|-------|-----------|---------|
| Sender pseudonym (routing ID) | Per-session | `a3f8...` (rotated on reconnect) |
| Recipient pseudonym | Per-message | `b7c2...` (stored message target) |
| Message timing | Exact | Timestamp of send/receive |
| Message size | Approximate | Encrypted blob size (padded to buckets) |
| Connection frequency | Exact | How often a client connects |

**What the relay CANNOT see**:

- Message content (E2E encrypted, AEAD)
- Contact card fields (encrypted under per-contact CEK)
- Sender identity beyond pseudonymous routing ID
- Which specific contact fields changed

**Risk assessment for Vauchi**:

The social graph inference risk is **lower than for messaging apps** because:

1. Updates are infrequent (users rarely change contact info)
2. Updates are small and padded to fixed buckets (256 B, 512 B, 1 KB, 4 KB)
3. All locale files are downloaded in bulk to prevent language inference
4. Routing IDs are pseudonymous and session-scoped

**Current mitigations**: Routing token rotation, `suppress_presence` flag, optional Tor support, fixed-size message padding.

**Future considerations**: Mixnet-based relay routing or Private Information Retrieval (PIR) could eliminate recipient pseudonym visibility entirely. These are not currently prioritized given Vauchi's low-frequency traffic pattern, but remain on the architectural roadmap for high-threat deployments.

## Key Transparency

### Current Model

Vauchi uses a **trust-on-exchange** model: during the initial in-person exchange (QR/NFC/BLE), both parties verify each other's Ed25519 identity keys directly. This provides strong initial authentication.

After the exchange, contacts receive updates via the Double Ratchet:

- If a user adds a new device, it derives keys from the same master seed
- Contacts receive a `DeviceRegistry` update signed by the existing identity key
- The ratchet provides forward secrecy and break-in recovery

### Gap

There is no append-only, auditable log of a user's key history. A sophisticated attacker who compromises both a relay and a user's device could theoretically:

1. Generate a new identity key for the victim
2. Distribute it to the victim's contacts via the compromised relay
3. Contacts would have no way to verify this is consistent with the victim's key history

### Accepted Tradeoff

This attack requires simultaneous compromise of both the relay and the target device, which is beyond Vauchi's primary threat model (relay-only compromise). The in-person exchange provides a strong root of trust that subsequent key changes cannot easily override without raising suspicion (contacts would see unexpected re-exchange requests).

### Future Direction

A lightweight key transparency mechanism could provide additional assurance:

- **Signed key history**: Each user maintains a signed append-only log of their key changes. Contacts can audit this log to detect unauthorized key modifications.
- **Cross-contact verification**: Contacts can compare their view of a user's key history with other contacts to detect divergence (split-world attack detection).

This is not currently implemented but is documented as a future enhancement for high-assurance deployments. A full CONIKS-style transparency log is not necessary given Vauchi's decentralized architecture and low update frequency.

## Push Notification Constraints

Push notifications (APNs for iOS, FCM for Android) are **not currently implemented**. If they are added in the future, the following constraint is mandatory:

**Threat**: Naive push notifications would expose message receipt timing to Apple/Google. Even though the relay sees only encrypted blobs, a push notification would link a specific device token (tied to a real Apple/Google account) to the exact moment a Vauchi message arrives. This undermines the zero-knowledge relay design.

**Required pattern**: **Empty push + app-side fetch**.

1. The relay sends a push notification with **no payload** and **no sender information** — only a "wake up" signal
2. The app receives the push, connects to the relay independently over TLS
3. The app fetches pending messages using its normal encrypted channel
4. Apple/Google learn only that the app was woken up, not who sent a message or what it contains

This pattern is used by Signal and other privacy-focused applications. Any implementation of push notifications in Vauchi **must** follow this pattern. Direct payload delivery via push is explicitly prohibited.

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
