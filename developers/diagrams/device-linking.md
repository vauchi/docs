<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Device Linking Sequence

**Interaction Type:** :handshake: **IN-PERSON (Proximity Required)**

User links a new device to their existing identity. The new device receives the full identity and syncs all data. Proximity verification prevents unauthorized remote linking.

## Participants

- **User** - Person owning both devices
- **Device A (Primary)** - Existing device with identity
- **Device B (New)** - New device to be linked
- **Relay** - WebSocket relay server

## Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant DA as Device A (Primary)
    participant DB as Device B (New)
    participant R as Relay

    Note over U: IN-PERSON: User has both devices physically present

    %% Generate Link Code
    U->>DA: Settings > Link New Device
    activate DA
    DA->>DA: Generate link token (expires 5 min)
    DA->>DA: Generate device-specific keypair for B
    DA->>DA: Encrypt identity seed for transfer
    DA->>DA: Create link QR: [token, encrypted_seed, audio_seed]
    DA->>U: Display QR code + numeric fallback "123-456-789"
    deactivate DA

    %% New Device Scans
    U->>DB: "Link to Existing Identity"
    activate DB
    DB->>DB: Scan QR code from Device A
    DB->>DB: Decode link data
    DB->>DB: Validate token not expired
    deactivate DB

    Note over DA,DB: PROXIMITY VERIFICATION

    %% Proximity Check
    activate DA
    activate DB
    DA->>DA: Emit ultrasonic challenge
    DB->>DB: Detect ultrasonic challenge
    DB->>DA: Signed response (ultrasonic)
    DA->>DA: Verify proximity
    DB->>DB: Verify proximity
    deactivate DA
    deactivate DB

    Note over DA,DB: IDENTITY TRANSFER

    %% Key Derivation
    activate DA
    activate DB
    DA->>DB: Encrypted identity bundle
    Note right of DB: Bundle contains:<br/>- Master seed<br/>- Identity keypair<br/>- Device registry
    DB->>DB: Decrypt identity bundle
    DB->>DB: Derive device-specific keys
    DB->>DB: Store identity locally
    deactivate DA
    deactivate DB

    Note over DA,DB: MUTUAL VERIFICATION

    %% Fingerprint Verification
    activate DA
    activate DB
    DA->>U: Show Device B fingerprint: "ABCD-1234"
    DB->>U: Show Device A fingerprint: "WXYZ-5678"
    U->>DA: Confirm fingerprints match
    U->>DB: Confirm fingerprints match
    DA->>DA: Mark Device B as verified
    DB->>DB: Mark Device A as verified
    deactivate DA
    deactivate DB

    Note over DA,R: REMOTE: Sync via Relay

    %% Sync Full State
    activate DA
    activate DB
    DA->>R: Register Device B in device registry
    R-->>DB: Acknowledge registration

    DA->>R: Push full state (encrypted)
    Note right of R: State includes:<br/>- Contact card<br/>- All contacts<br/>- Visibility rules<br/>- Settings
    R-->>DB: Forward encrypted state
    DB->>DB: Decrypt and store state
    deactivate DA
    deactivate DB

    %% Success
    DA->>U: "Device B linked successfully"
    DB->>U: "Linked to your identity"

    Note over DA,DB: Both devices now share the same identity
```

## Data Exchanged

### Link QR Code Contents
```json
{
  "type": "device_link",
  "token": "random 32-byte link token",
  "encrypted_seed": "encrypted master seed",
  "audio_seed": "random seed for proximity check",
  "expires": "timestamp (5 min from creation)",
  "numeric_code": "123-456-789"
}
```

### Identity Bundle (Encrypted)
```json
{
  "master_seed": "32-byte seed for key derivation",
  "identity_keypair": {
    "public": "Ed25519 public key",
    "private": "encrypted Ed25519 private key"
  },
  "device_registry": {
    "version": 2,
    "devices": [
      {"id": "device_a_id", "name": "iPhone", "added": "timestamp"},
      {"id": "device_b_id", "name": "New Device", "added": "timestamp"}
    ]
  }
}
```

## Security Properties

| Property | Mechanism |
|----------|-----------|
| **Proximity Required** | Ultrasonic audio + fingerprint confirmation |
| **Unauthorized Link Prevention** | Token expires in 5 min, proximity verified |
| **Identity Isolation** | Each device has unique device key |
| **Compromise Containment** | Revoking one device doesn't expose others |

## Numeric Code Fallback (No Camera)

```mermaid
sequenceDiagram
    participant U as User
    participant DA as Device A
    participant DB as Device B (Desktop)

    Note over U: Desktop has no camera

    U->>DA: Generate link code
    DA->>U: Show: "123-456-789"

    U->>DB: "Link to Existing Identity"
    U->>DB: Enter code: "123-456-789"
    DB->>DA: Request link via relay (using code)

    Note over DA,DB: Fingerprint verification required
    DA->>U: "Confirm Device B fingerprint: ABCD-1234"
    U->>DA: Confirm

    DA->>DB: Send identity bundle (encrypted)
    DB->>DB: Complete linking
```

## Unlinking a Device

```mermaid
sequenceDiagram
    participant U as User
    participant DA as Device A
    participant DB as Device B
    participant R as Relay

    Note over U: REMOTE: Can unlink from any device

    U->>DA: Settings > Devices > Remove Device B
    U->>DA: Confirm removal

    activate DA
    DA->>DA: Update device registry (remove B)
    DA->>R: Push updated registry
    R-->>DB: Forward revocation
    DB->>DB: Receive revocation notice
    DB->>DB: Wipe all identity data
    DB->>DB: Return to welcome screen
    deactivate DA

    DA->>U: "Device B removed"
    DB->>U: "This device has been unlinked"
```

## Related Features

- [Contact Exchange](contact-exchange.md) - Similar proximity verification
- [Sync Updates](sync-updates.md) - How changes sync between linked devices
- [Contact Recovery](contact-recovery.md) - Recovery when all devices lost
