<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Contact Exchange Sequence

**Interaction Type:** :handshake: **IN-PERSON (Proximity Required)**

Two users exchange contact cards by scanning QR codes while physically present together. Proximity is verified via ultrasonic audio handshake to prevent remote/screenshot attacks.

## Participants

- **Alice** - User initiating exchange (displays QR)
- **Alice's Device** - Mobile/Desktop running Vauchi
- **Bob** - User completing exchange (scans QR)
- **Bob's Device** - Mobile/Desktop running Vauchi
- **Relay** - WebSocket relay server (fallback only)

## Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant A as Alice
    participant AD as Alice's Device
    participant BD as Bob's Device
    participant B as Bob
    participant R as Relay

    Note over A,B: IN-PERSON: Alice and Bob meet physically

    %% QR Generation
    A->>AD: Tap "Share Contact"
    activate AD
    AD->>AD: Generate ephemeral X25519 keypair
    AD->>AD: Create exchange token (expires 5 min)
    AD->>AD: Generate audio challenge seed
    AD->>AD: Encode QR: [public_key, token, audio_seed]
    AD->>A: Display QR code
    deactivate AD

    %% QR Scanning
    B->>BD: Open camera, scan QR
    activate BD
    BD->>BD: Decode QR data
    BD->>BD: Validate token not expired
    BD->>BD: Extract Alice's public key
    deactivate BD

    Note over AD,BD: PROXIMITY VERIFICATION (Ultrasonic Audio)

    %% Proximity Verification
    activate AD
    activate BD
    AD->>AD: Emit ultrasonic challenge (18-20 kHz)
    BD->>BD: Detect ultrasonic challenge
    BD->>BD: Sign challenge with Bob's key
    BD->>BD: Emit ultrasonic response
    AD->>AD: Detect and verify response
    AD->>AD: Confirm proximity
    BD->>BD: Confirm proximity
    deactivate AD
    deactivate BD

    Note over AD,BD: X3DH KEY AGREEMENT

    %% Key Exchange
    activate AD
    activate BD
    BD->>BD: Generate ephemeral X25519 keypair
    BD->>AD: Send: [Bob's identity key, ephemeral key]
    AD->>AD: X3DH: Derive shared secret
    AD->>BD: Send: [Alice's identity key, ephemeral key]
    BD->>BD: X3DH: Derive shared secret
    Note over AD,BD: Both have identical shared secret
    deactivate AD
    deactivate BD

    Note over AD,BD: CONTACT CARD EXCHANGE

    %% Card Exchange
    activate AD
    activate BD
    AD->>AD: Encrypt Alice's card with shared secret
    AD->>BD: Send encrypted contact card
    BD->>BD: Decrypt Alice's card
    BD->>BD: Store Alice as contact

    BD->>BD: Encrypt Bob's card with shared secret
    BD->>AD: Send encrypted contact card
    AD->>AD: Decrypt Bob's card
    AD->>AD: Store Bob as contact
    deactivate AD
    deactivate BD

    %% Success
    AD->>A: "Exchange Successful"
    BD->>B: "Exchange Successful"

    Note over A,B: Alice and Bob now have each other's contact cards
```

## Data Exchanged

### QR Code Contents

```json
{
  "type": "exchange",
  "pk": "base64(Alice's X25519 public key)",
  "token": "random 32-byte exchange token",
  "audio_seed": "random seed for audio challenge",
  "expires": "timestamp (5 min from creation)"
}
```

### Contact Card (Encrypted)

```json
{
  "display_name": "Alice Smith",
  "fields": [
    {"type": "phone", "label": "Mobile", "value": "+1-555-1234"},
    {"type": "email", "label": "Personal", "value": "alice@example.com"}
  ],
  "signature": "Ed25519 signature of card"
}
```

## Security Properties

| Property | Mechanism |
|----------|-----------|
| **Proximity Required** | Ultrasonic audio handshake (18-20 kHz) |
| **No Man-in-the-Middle** | X3DH key agreement with identity keys |
| **Forward Secrecy** | Ephemeral keys discarded after exchange |
| **Replay Prevention** | One-time token, 5-minute expiry |
| **Card Authenticity** | Ed25519 signature on contact card |

## Failure Scenarios

### Proximity Verification Fails

```mermaid
sequenceDiagram
    participant AD as Alice's Device
    participant BD as Bob's Device

    Note over AD,BD: Bob scanning from screenshot (remote)
    AD->>AD: Emit ultrasonic challenge
    BD--xBD: No ultrasonic detected (too far)
    BD->>BD: Proximity verification FAILED
    BD->>BD: "Proximity verification failed"
    Note over AD,BD: Exchange blocked - no cards exchanged
```

### QR Code Expired

```mermaid
sequenceDiagram
    participant AD as Alice's Device
    participant BD as Bob's Device

    Note over AD,BD: QR scanned after 5 minutes
    BD->>BD: Decode QR, check expiry
    BD->>BD: Token expired
    BD->>BD: "QR code expired"
    Note over AD,BD: Alice must generate new QR
```

## Platform Variations

| Platform | Proximity Method | Fallback |
|----------|------------------|----------|
| iOS ↔ iOS | Ultrasonic audio | Manual confirmation |
| Android ↔ Android | Ultrasonic audio | Manual confirmation |
| iOS ↔ Android | Ultrasonic audio | Manual confirmation |
| Desktop ↔ Mobile | N/A (no mic) | Manual confirmation required |
| Desktop ↔ Desktop | N/A | Manual confirmation required |

## Related Features

- [Device Linking](device-linking.md) - Similar QR flow for linking devices
- [Sync Updates](sync-updates.md) - How card updates propagate after exchange
