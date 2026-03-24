<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Message Delivery Flow

**Interaction Type:** 🌐 **REMOTE (Via Relay)**

End-to-end message delivery from card update to acknowledgment.

## Participants

- **Alice** - User sending card update
- **Alice's Device** - Source device
- **Relay** - WebSocket relay server
- **Bob's Device** - Recipient device
- **Bob** - Contact receiving update

## Message Sizes & Frequency

| Message Type | Payload | Padded Size | Frequency |
|--------------|---------|-------------|-----------|
| Card delta | 50-200 B | 256 B | 1-5/month per user |
| Full card | 500 B - 2 KB | 1-4 KB | Initial exchange only |
| Acknowledgment | 32-64 B | 256 B | Per received message |
| Device sync | 100-500 B | 256 B - 1 KB | Real-time when active |

## Complete Delivery Flow

```mermaid
    accTitle: Message Delivery Sequence
    accDescr: Shows end-to-end encrypted message delivery from card update to relay acknowledgment
sequenceDiagram
    autonumber
    participant A as Alice
    participant AD as Alice's Device 📱
    participant R as Relay 🖥️
    participant BD as Bob's Device 📱
    participant B as Bob

    Note over A,B: 🌐 REMOTE: All via relay

    %% Alice edits card
    A->>AD: Edit phone: "555-1111" → "555-2222"
    activate AD
    AD->>AD: Update local card
    AD->>AD: Create CardDelta
    Note right of AD: Delta: ~100 bytes<br/>{"field":"phone","value":"555-2222"}
    deactivate AD

    %% Encryption
    activate AD
    AD->>AD: Check visibility: Bob can see phone? ✓
    AD->>AD: Ratchet send chain forward
    Note right of AD: Chain gen 42 → 43<br/>Message key derived
    AD->>AD: Encrypt delta (XChaCha20-Poly1305)
    AD->>AD: Pad to 256 bytes (bucket)
    AD->>AD: Generate CEK, sign payload
    Note right of AD: Final: ~256 bytes<br/>(v0x02 format)
    deactivate AD

    %% Send to relay
    activate AD
    AD->>R: EncryptedUpdate(recipient=Bob, blob=...)
    Note over AD,R: WebSocket frame:<br/>4-byte length + JSON envelope
    deactivate AD

    %% Relay processing
    activate R
    R->>R: Validate recipient_id format
    R->>R: Check quota (blobs < 1000, storage < 50MB)
    R->>R: Store blob indexed by recipient_id
    R-->>AD: Acknowledgment(status=Stored)
    Note right of R: Blob stored with 30-day TTL
    deactivate R

    %% Delivery
    alt Bob is Online (Connected to Relay)
        activate R
        R-->>BD: Forward EncryptedUpdate
        deactivate R

        activate BD
        BD->>BD: Receive encrypted blob
        BD->>BD: Resolve anonymous sender ID
        Note right of BD: Try each contact's<br/>shared key against<br/>anonymous_id
        BD->>BD: Found: Alice
        BD->>BD: Derive message key (chain gen 43)
        BD->>BD: Decrypt payload
        BD->>BD: Remove padding
        BD->>BD: Verify Ed25519 signature
        BD->>BD: Update Alice's card locally
        deactivate BD

        BD->>B: "Alice updated contact info"

        %% Acknowledgment chain
        activate BD
        BD->>R: Acknowledgment(status=ReceivedByRecipient)
        deactivate BD

        activate R
        R-->>AD: Forward Acknowledgment
        Note over R,AD: Sender notified if<br/>suppress_presence=false
        deactivate R

        AD->>AD: Mark update as delivered

    else Bob is Offline
        Note over R,BD: Blob queued for later

        opt Bob comes online later
            BD->>R: Connect (Handshake)
            activate R
            R-->>BD: Deliver queued blobs
            deactivate R

            activate BD
            BD->>BD: Process all pending updates
            BD->>BD: Updates applied in order
            deactivate BD
        end
    end

    Note over A,B: Bob now sees Alice's new phone
```

## Double Ratchet Message Flow

```mermaid
    accTitle: Message Delivery Sequence (2)
    accDescr: Shows end-to-end encrypted message delivery from card update to relay acknowledgment
sequenceDiagram
    participant AD as Alice's Ratchet
    participant BD as Bob's Ratchet

    Note over AD,BD: Initial state after X3DH

    rect rgb(240, 248, 255)
        Note over AD: SEND (Message 1)
        AD->>AD: Ratchet send chain: gen 0 → 1
        AD->>AD: Derive message key (gen 0)
        AD->>AD: Encrypt with message key
        AD->>AD: Delete message key
        AD->>BD: [DH_pub, gen=0, idx=0] + ciphertext
    end

    rect rgb(240, 255, 240)
        Note over BD: RECEIVE (Message 1)
        BD->>BD: Verify DH generation matches
        BD->>BD: Ratchet receive chain: gen 0 → 1
        BD->>BD: Derive message key (gen 0)
        BD->>BD: Decrypt
        BD->>BD: Delete message key
    end

    rect rgb(255, 248, 240)
        Note over BD: SEND REPLY (triggers DH ratchet)
        BD->>BD: Generate new ephemeral DH keypair
        BD->>BD: DH ratchet: compute new root key
        BD->>BD: Create new send chain
        BD->>BD: Encrypt with new chain's key
        BD->>AD: [NEW_DH_pub, gen=1, idx=0] + ciphertext
    end

    rect rgb(248, 240, 255)
        Note over AD: RECEIVE (triggers DH ratchet)
        AD->>AD: Detect new DH public key
        AD->>AD: DH ratchet: compute matching root key
        AD->>AD: Create new receive chain
        AD->>AD: Decrypt with new chain's key
    end
```

## Out-of-Order Message Handling

```mermaid
    accTitle: Message Delivery Sequence (3)
    accDescr: Shows end-to-end encrypted message delivery from card update to relay acknowledgment
sequenceDiagram
    participant AD as Alice's Device
    participant R as Relay
    participant BD as Bob's Device

    Note over AD,BD: Messages may arrive out of order

    AD->>R: Message 1 (gen=0, idx=0)
    AD->>R: Message 2 (gen=0, idx=1)
    AD->>R: Message 3 (gen=0, idx=2)

    Note over R: Network delays

    R-->>BD: Message 3 arrives first
    activate BD
    BD->>BD: Expected idx=0, got idx=2
    BD->>BD: Skip chain to idx=2
    BD->>BD: Store skipped keys: [idx=0, idx=1]
    BD->>BD: Decrypt message 3
    deactivate BD

    R-->>BD: Message 1 arrives
    activate BD
    BD->>BD: Lookup skipped key for idx=0
    BD->>BD: Found! Decrypt message 1
    BD->>BD: Delete skipped key
    deactivate BD

    R-->>BD: Message 2 arrives
    activate BD
    BD->>BD: Lookup skipped key for idx=1
    BD->>BD: Found! Decrypt message 2
    BD->>BD: Delete skipped key
    deactivate BD

    Note over BD: All messages processed,<br/>skipped keys cleaned up
```

## Relay Acknowledgment States

```mermaid
    accTitle: Message Delivery Sequence (4)
    accDescr: Shows end-to-end encrypted message delivery from card update to relay acknowledgment
stateDiagram-v2
    direction LR

    [*] --> Sent: Message created
    Sent --> Stored: Relay confirms storage
    Stored --> Delivered: Recipient connected
    Delivered --> ReceivedByRecipient: Recipient acks

    Stored --> Failed: Quota exceeded
    Delivered --> Failed: Decrypt error

    ReceivedByRecipient --> [*]
    Failed --> [*]
```

## Wire Protocol

### Envelope Format

```
┌─────────────────────────────────────────────────────────────┐
│                    MESSAGE ENVELOPE                          │
├─────────────────────────────────────────────────────────────┤
│  4 bytes: Length (big-endian)                               │
│  JSON payload:                                               │
│  {                                                           │
│    "version": 1,                                            │
│    "message_id": "uuid",                                    │
│    "timestamp": unix_secs,                                  │
│    "payload": { ... }                                       │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### EncryptedUpdate Payload

```json
{
  "type": "EncryptedUpdate",
  "sender_id": "anonymous_id (rotating hourly)",
  "recipient_id": "Bob's public key hash",
  "blob": "base64(encrypted_delta)"
}
```

### Acknowledgment Payload

```json
{
  "type": "Acknowledgment",
  "message_id": "original message uuid",
  "status": "Stored|Delivered|ReceivedByRecipient|Failed",
  "error": null
}
```

## Timing Estimates

| Phase | Duration | Notes |
|-------|----------|-------|
| Encryption + padding | 1-5 ms | XChaCha20-Poly1305 is fast |
| Network latency | 50-200 ms | Depends on relay location |
| Relay storage | 1-10 ms | SQLite insert |
| Forward to recipient | 50-200 ms | If online |
| Decryption + verify | 1-5 ms | |
| **Total (online)** | **100-400 ms** | End-to-end |
| **Total (offline)** | **< 30 days** | Until recipient connects |

## Related Features

- [Contact Exchange](contact-exchange.md) - How keys are established
- [Sync Updates](sync-updates.md) - Multi-device sync
- [Crypto Hierarchy](crypto-hierarchy.md) - Key derivation
