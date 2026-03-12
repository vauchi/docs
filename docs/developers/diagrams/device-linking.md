<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Device Linking Sequence

**Interaction Type:** :handshake: **IN-PERSON (Proximity Required)**

User links a new device to their existing identity. The new device receives the master seed and syncs all data. A confirmation code and proximity verification prevent unauthorized remote linking.

## Participants

- **User** - Person owning both devices
- **Device A (Primary)** - Existing device with identity
- **Device B (New)** - New device to be linked

## Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant DA as Device A (Primary)
    participant DB as Device B (New)

    Note over U: IN-PERSON: User has both devices physically present

    %% Generate Link QR
    U->>DA: Settings > Devices > Link New Device
    activate DA
    DA->>DA: Generate ephemeral link_key (32 bytes)
    DA->>DA: Sign QR fields with identity Ed25519 key
    DA->>DA: Create QR: WBDL | version | identity_pubkey | link_key | timestamp | signature
    DA->>U: Display QR code (expires in 5 minutes)
    deactivate DA

    %% New Device Scans
    U->>DB: "Link to Existing Identity"
    activate DB
    DB->>DB: Scan QR code from Device A
    DB->>DB: Validate WBDL magic, version, signature, expiry
    DB->>DB: Create DeviceLinkRequest (device_name, random nonce, timestamp)
    DB->>DB: Encrypt request with link_key (ChaCha20-Poly1305)
    DB->>DA: Send encrypted request
    deactivate DB

    Note over DA,DB: CONFIRMATION & PROXIMITY VERIFICATION

    %% Confirmation Code
    activate DA
    DA->>DA: Decrypt request using link_key
    DA->>DA: Derive confirmation code: HMAC-SHA256(link_key, nonce) → XXX-XXX
    DA->>U: Show: "Link device 'Device B'? Code: XXX-XXX"
    activate DB
    DB->>DB: Derive same confirmation code from link_key + nonce
    DB->>U: Show: "Confirmation code: XXX-XXX"
    U->>U: Verify codes match on both screens
    U->>DA: Confirm link
    DA->>DA: Set proximity verified
    deactivate DB

    Note over DA,DB: IDENTITY TRANSFER

    %% Build and send response
    DA->>DA: Derive new device keys from master_seed + device_index
    DA->>DA: Add Device B to registry, re-sign
    DA->>DA: Build response: master_seed + display_name + device_index + registry + sync_payload
    DA->>DA: Encrypt response with link_key (ChaCha20-Poly1305)
    DA->>DB: Send encrypted response
    deactivate DA

    %% New device processes
    activate DB
    DB->>DB: Decrypt response
    DB->>DB: Extract master_seed, registry, sync_payload
    DB->>DB: Derive own device keys from master_seed + device_index
    DB->>DB: Store identity locally
    DB->>DB: Apply sync payload (contacts, card)
    deactivate DB

    %% Success
    DA->>U: "Device B linked successfully"
    DB->>U: "Welcome back, [Your Name]"

    Note over DA,DB: Both devices now share the same identity
```

## Data Exchanged

### Link QR Code Contents

Binary format with `WBDL` magic bytes, base64-encoded for QR:

```
WBDL              (4 bytes magic)
version           (1 byte, currently 1)
identity_pubkey   (32 bytes, Ed25519 public key)
link_key          (32 bytes, random ephemeral key)
timestamp         (8 bytes, big-endian u64 unix seconds)
signature         (64 bytes, Ed25519 over all preceding fields)
─────────────────
Total: 141 bytes  (before base64 encoding)
```

The QR expires after 300 seconds (5 minutes). Signature is verified by the new device using the embedded identity public key.

### Confirmation Code

Derived independently by both devices:

```
HMAC-SHA256(link_key, request_nonce)
  → first 4 bytes as big-endian u32
  → modulo 1,000,000
  → formatted as XXX-XXX
```

Both devices display the same code. User verifies they match.

### Proximity Challenge

For external proximity verification (NFC, ultrasonic, etc.):

```
HKDF(ikm=link_key, info="vauchi-device-link-proximity-v1", len=16)
  → 16-byte challenge
```

Both devices derive the same challenge from the shared link key.

### DeviceLinkRequest (New → Existing)

Encrypted with ChaCha20-Poly1305 using `link_key`:

```
device_name_len   (4 bytes, little-endian u32)
device_name       (variable, UTF-8)
nonce             (32 bytes, random)
timestamp         (8 bytes, little-endian u64)
```

### DeviceLinkResponse (Existing → New)

Encrypted with ChaCha20-Poly1305 using `link_key`:

```
master_seed       (32 bytes, zeroized after use)
display_name_len  (4 bytes, little-endian u32)
display_name      (variable, UTF-8)
device_index      (4 bytes, little-endian u32)
registry_json_len (4 bytes, little-endian u32)
registry_json     (variable, signed DeviceRegistry)
sync_payload_len  (4 bytes, little-endian u32)
sync_payload_json (variable, contacts + card)
```

## Security Properties

| Property | Mechanism |
|----------|-----------|
| **Seed Encryption** | ChaCha20-Poly1305 with ephemeral link_key |
| **QR Authentication** | Ed25519 signature over QR fields |
| **Confirmation Code** | HMAC-SHA256(link_key, nonce) displayed on both devices |
| **Proximity Verification** | HKDF-derived 16-byte challenge; enforced before confirm |
| **Replay Prevention** | Random 32-byte nonce in each request |
| **Token Expiry** | QR expires after 5 minutes |
| **Registry Integrity** | Ed25519 signature over version + device list |
| **Memory Safety** | Master seed zeroized on Drop |
| **Device Limit** | Maximum 10 devices per identity |

## Numeric Code Fallback (No Camera)

```mermaid
sequenceDiagram
    participant U as User
    participant DA as Device A
    participant DB as Device B (Desktop/CLI)

    Note over U: Device B has no camera

    U->>DA: Generate link code
    DA->>U: Show QR code + data string

    U->>DB: "Link to Existing Identity"
    U->>DB: Paste data string from Device A
    DB->>DB: Parse WBDL data, validate signature + expiry

    Note over DA,DB: Same confirmation code flow as above
    DA->>U: "Code: XXX-XXX"
    DB->>U: "Code: XXX-XXX"
    U->>DA: Confirm

    DA->>DB: Encrypted identity bundle
    DB->>DB: Complete linking
```

## Revoking a Device

```mermaid
sequenceDiagram
    participant U as User
    participant DA as Device A
    participant DB as Device B
    participant R as Relay

    Note over U: REMOTE: Can revoke from any device

    U->>DA: Settings > Devices > Revoke Device B
    U->>DA: Confirm revocation

    activate DA
    DA->>DA: Mark Device B as revoked in registry
    DA->>DA: Re-sign registry with identity key
    DA->>DA: Increment registry version
    DA->>R: Push updated registry (encrypted)
    R-->>DB: Forward revocation
    DB->>DB: Receive revocation notice
    DB->>DB: Wipe all identity data
    DB->>DB: Return to welcome screen
    deactivate DA

    DA->>U: "Device B revoked"
    DB->>U: "This device has been unlinked"
```

## Platform Implementation Status

| Platform | Status | Notes |
|----------|--------|-------|
| **Core API** | Complete | Full protocol with tests |
| **CLI** | Complete | 7 commands: list, link, join, complete, finish, revoke, info |
| **Desktop (native)** | Complete | Native UI (SwiftUI/GTK/Qt) with QR display, confirmation overlay |
| **TUI** | Complete | ratatui UI with QR overlay, vim-style navigation |
| **iOS** | Planned | Awaiting mobile bindings |
| **Android** | Planned | Awaiting mobile bindings |

## Related Features

- [Contact Exchange](contact-exchange.md) - Similar proximity verification
- [Sync Updates](sync-updates.md) - How changes sync between linked devices
- [Contact Recovery](contact-recovery.md) - Recovery when all devices lost
