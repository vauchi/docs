<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Message Delivery Flow

**Interaction Type:** 🌐 **REMOTE (Via Relay)**

End-to-end message delivery from card update to the
recipient's fetch and ack.

## Participants

- **Alice** - User sending card update
- **Alice's Device** - Source device
- **Relay** - HTTP v2 relay server
- **Bob's Device** - Recipient device
- **Bob** - Contact receiving update

## Message Sizes & Frequency

| Message Type | Payload | Padded Size | Frequency |
|--------------|---------|-------------|-----------|
| Card delta | 50-200 B | 256 B | 1-5/month |
| Full card | 500 B-2 KB | 1-4 KB | Initial only |
| Ack | 32-64 B | 256 B | Per message |
| Device sync | 100-500 B | 256 B-1 KB | Real-time |

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
    AD->>R: POST /v2/send (recipient_token, blob)
    Note over AD,R: HTTP v2:<br/>JSON body, base64-encoded blob
    deactivate AD

    %% Relay processing
    activate R
    R->>R: Validate recipient_id format
    R->>R: Check quota
    R->>R: Store blob under recipient_id (the mailbox token)
    R-->>AD: 200 OK
    Note right of R: Blob kept up to 120 days
    deactivate R
    AD->>AD: Mark update as stored on the relay

    %% Delivery: the relay never pushes; Bob pulls
    Note over R,BD: Bob's device fetches on its own schedule<br/>(app open, background sync)
    activate BD
    BD->>R: POST /v2/fetch (mailbox_tokens: today's and owed days, padded)
    deactivate BD
    activate R
    R-->>BD: blobs [blob_id, ciphertext, created_at, mailbox_token]
    deactivate R

    activate BD
    BD->>BD: Match mailbox_token to the contact it belongs to
    Note right of BD: Token derives from the<br/>shared key with Alice
    BD->>BD: Derive message key (chain gen 43)
    BD->>BD: Decrypt payload
    BD->>BD: Remove padding
    BD->>BD: Verify Ed25519 signature
    BD->>BD: Update Alice's card locally
    BD->>R: POST /v2/ack (recipient_id, blob_id)
    deactivate BD
    activate R
    R->>R: Delete the blob
    deactivate R
    Note over R,AD: No receipt reaches Alice (ADR-057)

    BD->>B: "Alice updated contact info"
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

## Sender-side Delivery States

What Alice's device can know about an update. The relay confirms that
it stored the blob; nothing tells the sender that Bob fetched or read it
(ADR-057).

```mermaid
    accTitle: Message Delivery Sequence (4)
    accDescr: Shows the sender-side states of an update, from queued to stored on the relay
stateDiagram-v2
    direction LR

    [*] --> Queued: Update created
    Queued --> Sent: POST /v2/send
    Sent --> Stored: Relay answers 200
    Sent --> Failed: Relay refuses (quota, format)
    Queued --> Expired: Never sent in time

    Stored --> [*]
    Failed --> [*]
    Expired --> [*]
```

The `Delivered` value in Core's `DeliveryStatus` belongs to the retired
push transport; the HTTP v2 relay never reports it.

## Wire Protocol

HTTP v2, JSON bodies (through the OHTTP hop where one is configured).
Types: `vauchi-protocol` `src/v2.rs`.

### Send: `POST /v2/send`

```json
{
  "recipient_id": "mailbox token (daily rotation)",
  "ciphertext": "base64(padded, encrypted, signed update)",
  "origin_hint": null
}
```

No sender identifier travels on this path.

### Fetch: `POST /v2/fetch`

```json
{ "mailbox_tokens": ["token", "..."] }
```

Answer: `{ "status": "ok", "blobs": [ { "blob_id", "ciphertext",
"created_at", "mailbox_token" } ], "truncated": false }`.

### Ack: `POST /v2/ack`

```json
{ "recipient_id": "mailbox token", "blob_id": "id from the fetch" }
```

The relay deletes the blob. The ack goes no further.

## Timing Estimates

| Phase | Duration | Notes |
|-------|----------|-------|
| Encryption + padding | 1-5 ms | XChaCha20 is fast |
| Network latency | 50-200 ms | Relay location |
| Relay storage | 1-10 ms | SQLite insert |
| Recipient fetch | 50-200 ms | When Bob's device next syncs |
| Decryption + verify | 1-5 ms | |
| **Total** | **Variable** | Bounded by when Bob's device next fetches |

## Related Features

- [Contact Exchange](contact-exchange.md)
  - How keys are established
- [Sync Updates](sync-updates.md)
  - Multi-device sync
- [Crypto Hierarchy](crypto-hierarchy.md)
  - Key derivation
