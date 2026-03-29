<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- SSOT: Public threat model.
     Internal: _private/docs/reference/threat-analysis.md -->

# Threat Model

Formal threat analysis of the Vauchi system using the STRIDE framework.

---

## System Context

Vauchi is a **contact card exchange** system, not a messaging app:

- **Traffic pattern**: Generated when users
  physically meet (exchange) or update contact
  info (small delta to all contacts)
- **Data type**: Contact cards (name, phone, email, address, social handles)
- **Exchange model**: In-person only via QR code, NFC, or BLE
- **Update frequency**: Infrequent (users rarely change phone numbers or emails)
- **Update size**: Small (delta of changed fields, typically < 1 KB)

This context shapes the threat model: low traffic
volume and infrequent updates reduce the value of
traffic analysis compared to messaging apps.

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
          │                         ┌─ Optional: SOCKS5 proxy ─┐
          │                         │  (Tor, VPN, etc.)         │
          │                         └───────────────────────────┘
┌─────────▼────────────────────────────────────────────────────┐
│              SELF-HOSTED REVERSE PROXY (nginx/caddy)          │
│  • Strips all client-identifying headers                      │
│  • Relay never sees client IP addresses                       │
└─────────┬────────────────────────────────────────────────────┘
          │ Internal network
┌─────────▼────────────────────────────────────────────────────┐
│              OHTTP LAYER (RFC 9458) — optional path           │
│  • OHTTP relay: sees client IP, cannot read content           │
│  • Gateway: decrypts content, sees only OHTTP relay IP        │
│  • No single hop sees both client identity and request        │
└─────────┬────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────┐
│                      RELAY SERVER                             │
│                                                               │
│  • Assumed compromised (zero-knowledge design)               │
│  • Sees only encrypted blobs, never client IPs               │
│  • No user accounts, no decryption keys                      │
│  • Store-and-forward with TTL                                │
│  • Timing obfuscation: sync jitter, payload padding          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

| Boundary | Protection | Trust Level |
|----------|-----------|-------------|
| Client ↔ Rev. Proxy | TLS | **Trusted** (self-hosted) |
| Rev. Proxy ↔ Relay | Internal net | **Untrusted** (no client IPs) |
| Client ↔ OHTTP ↔ GW | OHTTP (9458) | No hop sees both ID + content |
| Client ↔ Client | E2E (X3DH + DR) | Verified in person |
| Device ↔ Device | HKDF device keys | Trusted (same seed) |
| Contact ↔ Contact | Per-contact CEK | Verified at exchange |

## Assets

| Asset | Sensitivity | Description |
|-------|-------------|-------------|
| Contact card data | High | Personal info (phone, email, address) |
| Identity keys | Critical | Ed25519 signing + X25519 exchange keys |
| Master seed | Critical | 256-bit root secret for all key derivation |
| Social graph | High | Who knows whom (contact relationships) |
| Update metadata | Medium | When someone changed their info |

## Adversary Model

| Adversary | Capability | Motivation |
|-----------|------------|------------|
| Passive observer | Encrypted traffic only | Surveillance |
| Malicious relay | Blobs + timing, no IPs | Data harvesting |
| OHTTP relay | Client IP, no content | Correlation |
| Compromised device | Full device access | Targeted attack |
| Physical attacker | Steals/seizes device | Law enforcement |
| Malicious contact | Legitimate contact | Stalking |

## STRIDE Analysis

### Spoofing

**Threat**: Attacker impersonates a contact or creates a fake identity.

**Mitigations**:

- Ed25519 identity keys bound to each user
- Full-trust contact exchange requires **physical
  presence** (QR, NFC, or BLE with proximity check)
- Opt-in remote discovery establishes reduced-trust
  contacts (Tier 0/1) with restricted visibility
- No trust-on-first-use for contact verification:
  you verify who you connect with in person
- Device registry is cryptographically signed;
  unauthorized devices cannot be added

**Residual risk**: Social engineering (convincing
someone to scan a QR code under false pretenses).

### Tampering

**Threat**: Relay or network attacker modifies messages in transit.

**Mitigations**:

- AEAD encryption (XChaCha20-Poly1305) detects any
  modification via authentication tag
- Ed25519 signatures verify sender authenticity
- Double Ratchet counters and per-message nonces detect replay and reordering
- Device registry version numbers prevent rollback

**Residual risk**: None. Tampering is cryptographically detected and rejected.

### Repudiation

**Threat**: User denies having sent an update.

**Design decision**: Repudiation is a **privacy
feature**, not a bug. Vauchi intentionally does not
provide non-repudiation for contact card updates.
Users should be able to update or remove their
information without permanent proof of past states.

### Information Disclosure

**Threat**: Unauthorized access to contact card data.

**Mitigations**:

- All data E2E encrypted with XChaCha20-Poly1305 before leaving the device
- Per-contact encryption keys (CEK) derived via X3DH + Double Ratchet
- Forward secrecy: each message uses a unique key, deleted after use
- Relay stores only encrypted blobs (zero-knowledge)
- Local storage encrypted with device-derived keys (SEK from HKDF key hierarchy)
- Sensitive key material zeroized on drop (`zeroize` crate)
- Message padding to fixed buckets
  (256 B, 512 B, 1 KB, 4 KB) prevents
  size-based inference

**Residual risk**: Metadata (connection timing,
recipient pseudonyms) visible to relay. Mitigated
by the four-layer privacy architecture: reverse
proxy (strips client IPs), OHTTP (cryptographic
content protection), timing obfuscation (sync
jitter + padding), and optional SOCKS5 proxy
support.

### Denial of Service

**Threat**: Attacker disrupts relay availability.

**Mitigations**:

- Token-bucket rate limiting (60 msgs/min per client, configurable)
- Stricter recovery rate limit (10 queries/min, anti-enumeration)
- Connection limit (max 1000 concurrent, RAII guard)
- Multi-layer timeout protection: handshake timeout, idle timeout (5 min)
- Message size limit (1 MB)
- Automatic message expiration (120-day TTL; recovery store: 90-day TTL)
- Federation support for relay redundancy

**Residual risk**: Sustained DDoS from many source
IPs can overwhelm a single relay.

### Elevation of Privilege

**Threat**: Attacker gains unauthorized capabilities.

**Mitigations**:

- No user accounts on relay: no admin interface, no privilege levels
- Client capabilities limited to own identity (can only decrypt own messages)
- Master seed required for all identity operations
- Device linking requires physical QR scan + identity key signature verification

**Residual risk**: Compromised device with master
seed has full identity control. Mitigated by device
revocation broadcast.

## Key Security Properties

| Property | Mechanism |
|----------|-----------|
| **Confidentiality** | XChaCha20-Poly1305 E2E encryption |
| **Integrity** | AEAD authentication tag + Ed25519 signatures |
| **Forward secrecy** | Double Ratchet with ephemeral DH keys |
| **Break-in recovery** | DH ratchet step generates new key material |
| **Zero-knowledge relay** | Encrypted blobs only, no keys |
| **Physical verification** | QR + audio / NFC / BLE (full); SAS (video) |
| **Traffic analysis resist.** | Bucket padding + routing tokens + jitter |
| **IP privacy** | Reverse proxy + OHTTP (RFC 9458) |
| **Memory safety** | Rust (no unsafe in crypto paths) + `zeroize` on drop |
| **Replay prevention** | Double Ratchet counters + version numbers |

## Attack Scenarios

### Relay Compromise

If an attacker gains full control of a relay:

- **Cannot** read contact card data (E2E encrypted)
- **Cannot** forge messages (AEAD + signatures)
- **Can** see pseudonymous recipient IDs and message timing
- **Can** drop or delay messages (detected by delivery acknowledgments)
- **Cannot** see client IP addresses (reverse proxy
  strips headers; OHTTP encrypts requests to
  gateway)
- **Can** observe connection timing patterns
  (mitigated by timing obfuscation: 30s-5min
  post-exchange jitter, ±15% sync interval jitter)

### Device Theft

If an attacker steals a device:

- Master seed encrypted with user password via Argon2id (m=64 MB, t=3, p=4)
- Platform-native key storage (macOS Keychain, iOS Keychain, Android KeyStore)
- All key material zeroized on drop
- Weak passwords can be brute-forced (Argon2id raises cost significantly)
- **Recommendation**: Use a strong backup password,
  enable OS-level device encryption

### Recovery Impersonation

If an attacker tries to abuse social recovery:

- Must meet K contacts in person (default threshold: 3)
- Each voucher signs with their identity key
- Vouchers validated against victim's known contact list
- Conflicting claims detected and flagged by relay
- Voucher timestamps prevent replay (48-hour window)

## Federation Security

When relays federate (forward blobs to peer relays
for redundancy), additional trust boundaries apply.

**What a federated relay CAN see**:

- Recipient routing IDs (pseudonymous public key hashes)
- Blob sizes (padded to fixed buckets: 256, 512, 1024, 4096 bytes)
- Message creation timestamps and hop count
- Network topology via gossip protocol

**What a federated relay CANNOT see**:

- Message content (E2E encrypted)
- Sender identity (not included in federation protocol)
- Real identity behind routing IDs
- Client IP addresses (federation is relay-to-relay;
  clients are behind reverse proxy + OHTTP)

**Guarantees**:

- mTLS authentication prevents unauthorized peers
- Hop count limit prevents amplification attacks
- SHA-256 integrity verification on all federated blobs
- DNS rebinding protection: explicit resolution +
  SSRF validation before connecting to peer relays

## Device Linking (STRIDE)

| Category | Threat | Mitigation |
|----------|--------|------------|
| **Spoofing** | Scan link QR | 5-min expiry, proximity |
| **Tampering** | Modified QR | Signed by identity key |
| **Info Disclosure** | Seed intercepted | Ephemeral key encryption |
| **DoS** | Excess linking | Max 10 devices |
| **Elev. of Privilege** | Unauth device | Signed registry + version |

**Known limitation**: Currently, the full master
seed is shared during device linking (not per-device
subkeys). A compromised linked device gains full
identity control. Per-device subkey isolation is
planned for 1.0 release.

## Remote Discovery (Opt-In)

When remote discovery is enabled, users can generate
discovery tokens that allow contacts to be
established without physical proximity. This
introduces a new attack surface that is mitigated
by graduated trust tiers.

### Trust Tiers

| Tier | Name | Established Via | Capabilities |
|------|------|----------------|--------------|
| 0 | Pending | Token-based contact request | View-only, expires after 30 days |
| 1 | Accepted | Recipient accepts request | `Everyone`-visibility fields only |
| 2 | VideoVerified | SAS + liveness (video) | Label-based visibility |
| 3 | InPerson | Physical QR/NFC/BLE | Full access, recovery |

Recovery and facilitated introductions remain gated to Tier 3 (InPerson) only.

### Attack Surface

| Threat | Mitigation |
|--------|------------|
| **Token spam** | Expiry, one-time use, rate limit |
| **Phishing token** | Tier 0 only, no sensitive fields |
| **Social eng. to T1** | `Everyone` fields only |
| **Video MITM** | SAS 6-digit code mismatch |
| **Deepfake/replay** | Finger-count liveness challenge |
| **Sender leak** | Sealed sender, ephemeral IDs |
| **Recipient leak** | Daily-rotating mailbox tokens |
| **Token replay** | Ed25519 sig + expiry + one-time |
| **Mailbox correlation** | Daily rotation per-contact pair |

### Sealed Sender Properties

Sealed sender is **always enabled** — it improves
metadata protection for all users, not just remote
contacts. With sealed sender delivery, the relay
sees:

- **Session ID**: Ephemeral, per-connection (no identity key)
- **Mailbox token**: Opaque, daily rotation, derived from shared key
- **Encrypted blob**: AEAD ciphertext, padded to fixed buckets

The relay **cannot** determine: who sent a message,
who the real recipient is (beyond the opaque token),
or whether two sessions belong to the same user
across reconnections.

### Residual Risks

| Risk | Sev. | Notes |
|------|------|-------|
| Weak remote trust | Low | Tier gating limits to `Everyone` |
| Untrusted token channels | Med | User responsibility |
| Compromised video platform | Low | SAS binding is independent |
| Mailbox token correlation | Low | Brief overlap, mitigated by OHTTP |

## Known Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| Relay sees metadata | Graph inference | Sealed sender, 4-layer arch |
| Device compromise | Full seed exposed | Subkeys (planned), passwords |
| Linked device = full seed | Full identity | Subkeys (planned) |
| Single relay SPOF | No sync if down | Federation (planned) |
| Blocked contacts keep data | Can't unsend | By design |
| Recovery leaks voucher PKs | Partial graph | Accepted tradeoff |
| No guardian diversity | Same circle | UX warnings (planned) |
| No key transparency | Not auditable | Signed key log (future) |
| Remote trust weaker | No in-person | Tier gating; upgrade path |
| Push leaks metadata | Delivery timing | Empty push + fetch |

## Core-UI Trust Boundary

The `vauchi-core` library is consumed by multiple
UI layers (macOS/SwiftUI, Linux-GTK, Linux-Qt, CLI,
TUI, mobile Swift/Kotlin via UniFFI). The trust
relationship between core and its callers:

**What core trusts from UI**:

- UI provides correct file paths for storage
- UI invokes lifecycle methods in the correct order (init before use)
- UI does not hold references to sensitive data after core has zeroized them

**What core does NOT trust from UI**:

- **Input lengths**: Core enforces maximum lengths
  at its API boundary (display name: 100 chars,
  field value: 1000 chars, field label: 64 chars,
  card size: 64 KB, avatar: 256 KB)
- **Field values**: Core validates phone/email
  format, URL safety, and rejects malformed data
- **Contact IDs**: Core verifies contact existence before processing updates
- **Ratchet messages**: Core validates signatures,
  AEAD tags, and replay nonces before accepting
  peer data
- **File content**: Core verifies checksums on all
  content fetched from remote servers

A compromised or buggy UI layer cannot cause `vauchi-core` to:

- Decrypt data for an unauthorized recipient
- Produce unsigned or weakly signed messages
- Skip replay detection or signature verification
- Bypass visibility label enforcement

**UniFFI surface note**: The UniFFI binding layer
does not add rate limiting at the API boundary.
Rate limiting for relay operations is enforced
server-side. UI layers should implement their own
rate limiting for user-facing operations to prevent
accidental rapid-fire calls.

## Relay Metadata Exposure Analysis

While the relay sees only encrypted blobs, it
observes metadata that can reveal the social graph:

**What the relay sees**:

| Datum | Visibility | Example |
|-------|-----------|---------|
| Sender (session ID) | Per-connection | Ephemeral, no identity key |
| Recipient (mailbox) | Daily rotation | HKDF-derived, opaque |
| Message timing | Obfuscated | Jittered 30s-5min / ±15% |
| Message size | Approximate | Padded to buckets |
| Connection freq. | Approximate | Jittered intervals |

**What the relay CANNOT see**:

- Client IP addresses (stripped by self-hosted
  reverse proxy; OHTTP provides additional
  cryptographic separation)
- Message content (E2E encrypted, AEAD)
- Contact card fields (encrypted under per-contact CEK)
- Sender identity beyond pseudonymous routing ID
- Which specific contact fields changed

**Risk assessment for Vauchi**:

The social graph inference risk is **lower than for
messaging apps** because:

1. Updates are infrequent (users rarely change contact info)
2. Updates are small and padded to fixed buckets
   (256 B, 512 B, 1 KB, 4 KB)
3. All locale files are downloaded in bulk to
   prevent language inference
4. Routing IDs are pseudonymous and session-scoped
5. Relay never sees client IPs (reverse proxy strips
   headers; OHTTP provides cryptographic separation)
6. Timing obfuscation (sync jitter, post-exchange
   delay) prevents correlation of connection patterns

**Current mitigations** (four-layer privacy architecture):

1. **Self-hosted reverse proxy** (nginx/caddy) —
   strips all client-identifying headers before
   forwarding to relay. The relay provably never
   touches client IP addresses.
2. **OHTTP** (RFC 9458) — cryptographic content
   protection. The OHTTP relay sees the client IP
   but cannot read request content (encrypted to
   gateway). The gateway decrypts but only sees the
   OHTTP relay's internal IP. No single hop sees
   both client identity and request content.
3. **Timing obfuscation** — post-exchange sync
   jitter (30s-5min random delay), sync interval
   jitter (+-15%), payload padding to bucket sizes.
   Applied to all users by default.
4. **Generic SOCKS5 proxy support** — optional,
   user-configured. Route through Tor, VPN, or any
   SOCKS5 proxy for ISP-level hiding.

Additional mitigations: routing token rotation,
`suppress_presence` flag, standardized bucket-size
message padding.

**Why OHTTP over Tor**: Tor's 90-120s mobile
bootstrap latency is fatal for adoption. Tor
traffic is banned or flagged in countries that
need privacy most (China, Iran, Russia). OHTTP
traffic is indistinguishable from normal HTTPS —
no special protocol signatures. The four-layer
architecture provides equivalent metadata
protection for Vauchi's threat model without the
usability and censorship-resistance penalties.

**Future considerations**: Private Information
Retrieval (PIR) could eliminate recipient pseudonym
visibility entirely. Cover traffic patterns could
further reduce timing correlation. These are not
currently prioritized given Vauchi's low-frequency
traffic pattern, but remain on the architectural
roadmap for high-threat deployments.

## Key Transparency

### Current Model

Vauchi uses a **trust-on-exchange** model: during
the initial in-person exchange (QR/NFC/BLE), both
parties verify each other's Ed25519 identity keys
directly. This provides strong initial
authentication.

After the exchange, contacts receive updates via the Double Ratchet:

- If a user adds a new device, it derives keys
  from the same master seed
- Contacts receive a `DeviceRegistry` update signed
  by the existing identity key
- The ratchet provides forward secrecy and break-in recovery

### Gap

There is no append-only, auditable log of a user's
key history. A sophisticated attacker who compromises
both a relay and a user's device could theoretically:

1. Generate a new identity key for the victim
2. Distribute it to the victim's contacts via the
   compromised relay
3. Contacts would have no way to verify this is
   consistent with the victim's key history

### Accepted Tradeoff

This attack requires simultaneous compromise of both
the relay and the target device, which is beyond
Vauchi's primary threat model (relay-only
compromise). The in-person exchange provides a
strong root of trust that subsequent key changes
cannot easily override without raising suspicion
(contacts would see unexpected re-exchange
requests).

### Future Direction

A lightweight key transparency mechanism could
provide additional assurance:

- **Signed key history**: Each user maintains a
  signed append-only log of their key changes.
  Contacts can audit this log to detect
  unauthorized key modifications.
- **Cross-contact verification**: Contacts can
  compare their view of a user's key history with
  other contacts to detect divergence (split-world
  attack detection).

This is not currently implemented but is documented
as a future enhancement for high-assurance
deployments. A full CONIKS-style transparency log
is not necessary given Vauchi's decentralized
architecture and low update frequency.

## Push Notification Constraints

Push notifications (APNs for iOS, FCM for Android)
are **not currently implemented**. If they are added
in the future, the following constraint is
mandatory:

**Threat**: Naive push notifications would expose
message receipt timing to Apple/Google. Even though
the relay sees only encrypted blobs, a push
notification would link a specific device token
(tied to a real Apple/Google account) to the exact
moment a Vauchi message arrives. This undermines
the zero-knowledge relay design.

**Required pattern**: **Empty push + app-side fetch**.

1. The relay sends a push notification with
   **no payload** and **no sender information** —
   only a "wake up" signal
2. The app receives the push, connects to the
   relay independently over TLS
3. The app fetches pending messages using its
   normal encrypted channel
4. Apple/Google learn only that the app was woken
   up, not who sent a message or what it contains

This pattern is used by Signal and other
privacy-focused applications. Any implementation
of push notifications in Vauchi **must** follow
this pattern. Direct payload delivery via push is
explicitly prohibited.

## Cryptographic Primitives

| Purpose | Algorithm | Library |
|---------|-----------|---------|
| Signing | Ed25519 | `ed25519-dalek` |
| Key exchange | X25519 | `x25519-dalek` |
| Symmetric encryption | XChaCha20-Poly1305 | `chacha20poly1305` |
| Password KDF | Argon2id | `argon2` |
| Key derivation | HKDF-SHA256 | `hkdf` |
| CSPRNG | OsRng | `rand` |
| TLS | TLS 1.2/1.3 | `rustls` (`aws-lc-rs` backend) |

For the full cryptographic specification, see the
[Cryptography Reference](crypto.md).

## Comparison with Messaging Apps

| Aspect | Vauchi | Messaging Apps |
|--------|--------|----------------|
| Traffic volume | Very low | High (continuous) |
| Timing analysis | Low (jittered) | High |
| Social graph | Low (no IPs) | High |
| Metadata | Recipient ID only | Sender + recip + IPs |
| IP privacy | Proxy + OHTTP | Often server sees IPs |
| Forward secrecy | Yes (DR) | Varies |
| Relay knowledge | Encrypted blobs | Often plaintext |
| Recovery | Social vouching | Phone/cloud backup |

Vauchi's infrequent, small updates significantly
reduce the value of traffic analysis compared to
messaging apps.

## Security Reporting

Found a vulnerability? Please report it responsibly:

**Email**: security@vauchi.app

We acknowledge reports within 48 hours and do not
pursue legal action against good-faith researchers.

## Related Documentation

- [Security Overview](../about/security.md) — User-friendly security explanation
- [Cryptography Reference](crypto.md) — Full cryptographic specification
- [Architecture Overview](architecture.md) — System design
