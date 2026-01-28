# Sync Updates Sequence

**Interaction Type:** 🌐 **REMOTE (Via Relay)**

Contact card changes propagate automatically to contacts via the relay network. All data is end-to-end encrypted - relays only see encrypted blobs.

## Participants

- **Alice** - User updating their contact card
- **Alice's Device** - Device where change is made
- **Alice's Other Device** - Another linked device
- **Relay** - WebSocket relay server
- **Bob's Device** - Contact receiving the update
- **Bob** - Contact who will see the update

## Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant A as Alice
    participant AD1 as Alice Device 1 📱
    participant AD2 as Alice Device 2 📱
    participant R as Relay 🖥️
    participant BD as Bob's Device 📱
    participant B as Bob

    Note over A,B: 🌐 REMOTE: All communication via relay

    %% Alice makes a change
    A->>AD1: Update phone: "555-1111" → "555-2222"
    activate AD1
    AD1->>AD1: Update local contact card
    AD1->>AD1: Increment card version
    AD1->>AD1: Sign card with identity key
    deactivate AD1

    Note over AD1,R: 📤 PUSH TO OWN DEVICES

    %% Sync to own devices
    activate AD1
    AD1->>AD1: Encrypt update for Device 2
    AD1->>R: Push encrypted update (for AD2)
    R-->>AD2: Forward encrypted update
    activate AD2
    AD2->>AD2: Decrypt update
    AD2->>AD2: Apply change locally
    AD2->>AD2: Verify signature
    deactivate AD2
    deactivate AD1

    Note over AD1,R: 📤 PUSH TO CONTACTS

    %% Determine who can see the field
    activate AD1
    AD1->>AD1: Check visibility rules
    Note right of AD1: Phone visible to:<br/>- Bob ✓<br/>- Carol ✓<br/>- Dave ✗ (restricted)
    deactivate AD1

    %% Sync to Bob (online)
    activate AD1
    AD1->>AD1: Encrypt delta for Bob (shared key)
    Note right of AD1: Delta: {field: "phone", value: "555-2222"}
    AD1->>R: Push encrypted delta (for Bob)

    alt Bob is Online
        R-->>BD: Forward encrypted delta
        activate BD
        BD->>BD: Decrypt with Alice-Bob shared key
        BD->>BD: Verify signature
        BD->>BD: Update Alice's contact card locally
        BD->>B: Notification: "Alice updated contact info"
        deactivate BD
    else Bob is Offline
        R->>R: Queue message for Bob
        Note right of R: Queued until Bob connects
    end
    deactivate AD1

    %% Bob comes online later
    opt Bob was Offline
        BD->>R: Connect to relay
        R-->>BD: Deliver queued messages
        activate BD
        BD->>BD: Process Alice's update
        BD->>BD: Update local contact card
        BD->>B: "Alice updated contact info"
        deactivate BD
    end

    Note over A,B: Bob now sees Alice's new phone number
```

## Multi-Device Sync Detail

```mermaid
sequenceDiagram
    participant AD1 as Alice Device 1 📱
    participant AD2 as Alice Device 2 📱
    participant AD3 as Alice Device 3 📱
    participant R as Relay 🖥️

    Note over AD1,AD3: 🌐 REMOTE: Sync across Alice's devices

    AD1->>AD1: Make change (version 5 → 6)

    par Parallel sync to all devices
        AD1->>R: Push to Device 2
        R-->>AD2: Forward
        AD2->>AD2: Apply (now version 6)
    and
        AD1->>R: Push to Device 3
        R-->>AD3: Forward
        AD3->>AD3: Apply (now version 6)
    end

    Note over AD1,AD3: All devices at version 6
```

## Conflict Resolution (CRDT)

```mermaid
sequenceDiagram
    participant AD1 as Alice Device 1 📱
    participant AD2 as Alice Device 2 📱
    participant R as Relay 🖥️

    Note over AD1,AD2: Both devices offline, make concurrent changes

    AD1->>AD1: Update phone to "111-1111" (offline)
    AD1->>AD1: Version vector: {D1: 5, D2: 4}

    AD2->>AD2: Update phone to "222-2222" (offline)
    AD2->>AD2: Version vector: {D1: 4, D2: 5}

    Note over AD1,AD2: 🌐 Both come online

    AD1->>R: Push change
    AD2->>R: Push change

    R-->>AD1: Receive AD2's change
    R-->>AD2: Receive AD1's change

    Note over AD1,AD2: Detect concurrent updates via version vectors

    AD1->>AD1: Compare timestamps, D2's change is newer
    AD1->>AD1: Accept "222-2222" as winner

    AD2->>AD2: Compare timestamps, D2's change is newer
    AD2->>AD2: Keep "222-2222"

    Note over AD1,AD2: Both converge to "222-2222"
```

## Data Exchanged

### Update Delta (Encrypted)
```json
{
  "type": "card_update",
  "from": "Alice's public key",
  "version": 6,
  "timestamp": "2026-01-21T12:00:00Z",
  "changes": [
    {
      "op": "update",
      "path": "/fields/phone",
      "value": "555-2222"
    }
  ],
  "signature": "Ed25519 signature"
}
```

### Sync Status Response
```json
{
  "contact_id": "bob_public_key_hash",
  "status": "synced",
  "last_sync": "2026-01-21T12:00:05Z",
  "pending_updates": 0
}
```

## Visibility-Aware Sync

```mermaid
sequenceDiagram
    participant AD as Alice's Device 📱
    participant R as Relay 🖥️
    participant BD as Bob's Device 📱
    participant CD as Carol's Device 📱
    participant DD as Dave's Device 📱

    Note over AD: Alice updates phone number

    AD->>AD: Check visibility rules

    Note right of AD: Visibility:<br/>Bob: [name, phone, email] ✓<br/>Carol: [name, email] ✓<br/>Dave: [name only] ✓

    par Send to contacts based on visibility
        AD->>R: To Bob: {phone: "555-2222"}
        R-->>BD: Forward (Bob can see phone)
    and
        Note over AD,CD: Carol cannot see phone field
        AD--xCD: No update sent (field not visible)
    and
        Note over AD,DD: Dave cannot see phone field
        AD--xDD: No update sent (field not visible)
    end
```

## Offline Queue Handling

```mermaid
sequenceDiagram
    participant AD as Alice's Device 📱
    participant R as Relay 🖥️
    participant BD as Bob's Device 📱

    Note over BD: Bob is offline for 3 days

    AD->>AD: Update 1: Change phone
    AD->>R: Queue for Bob
    R->>R: Store encrypted message

    AD->>AD: Update 2: Change email
    AD->>R: Queue for Bob
    R->>R: Store encrypted message

    AD->>AD: Update 3: Change phone again
    AD->>R: Queue for Bob
    R->>R: Store encrypted message

    Note over R: Relay coalesces updates

    BD->>R: Connect (back online)
    R->>R: Coalesce: 3 updates → 1 combined
    R-->>BD: Deliver combined update

    BD->>BD: Apply final state
    Note over BD: Bob sees latest values only
```

## Security Properties

| Property | Mechanism |
|----------|-----------|
| **End-to-End Encryption** | Updates encrypted with per-contact shared keys |
| **Relay Blindness** | Relay sees only encrypted blobs, no metadata |
| **Update Authenticity** | Ed25519 signature on all updates |
| **Replay Prevention** | Monotonic version numbers + timestamps |
| **Visibility Enforcement** | Only visible fields sent to each contact |

## Related Features

- [Contact Exchange](01-contact-exchange.md) - How shared keys are established
- [Device Linking](02-device-linking.md) - How devices sync with each other
