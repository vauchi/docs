# Contact Recovery Sequence

**Interaction Type:** 🤝 + 🌐 **MIXED (In-Person Vouching + Remote Distribution)**

When a user loses all devices, they can recover their contact relationships through social vouching. Existing contacts vouch for the user in-person, and the recovery proof is distributed remotely via relay.

## Participants

- **Alice** - User who lost their device
- **Alice's New Device** - Fresh install, new identity
- **Bob, Charlie, Betty** - Alice's contacts who will vouch
- **John, David** - Alice's contacts who will receive recovery proof
- **Relay** - WebSocket relay server

## Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         RECOVERY PROCESS                                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  PHASE 1: Vouching (🤝 In-Person)                                          │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                                │
│  │   Bob   │    │ Charlie │    │  Betty  │                                │
│  │  Vouch  │    │  Vouch  │    │  Vouch  │                                │
│  └────┬────┘    └────┬────┘    └────┬────┘                                │
│       │              │              │                                      │
│       └──────────────┼──────────────┘                                      │
│                      ▼                                                     │
│              ┌──────────────┐                                              │
│              │ Alice (new)  │  Threshold: 3 vouchers ✓                     │
│              └──────┬───────┘                                              │
│                     │                                                      │
│  PHASE 2: Distribution (🌐 Remote)                                         │
│                     ▼                                                      │
│              ┌──────────────┐                                              │
│              │    Relay     │  Stores proof under hash(pk_old)             │
│              └──────┬───────┘                                              │
│                     │                                                      │
│       ┌─────────────┼─────────────┐                                        │
│       ▼             ▼             ▼                                        │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐                                  │
│  │  John   │   │  David  │   │  Others │  Discover via relay query        │
│  │ Accept  │   │ Verify  │   │         │                                  │
│  └─────────┘   └─────────┘   └─────────┘                                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Phase 1: In-Person Vouching

```mermaid
sequenceDiagram
    autonumber
    participant A as Alice (Lost Device)
    participant AN as Alice New Device 📱
    participant BB as Bob's Device 📱
    participant B as Bob

    Note over A,B: 🤝 IN-PERSON: Alice meets Bob physically

    %% Alice creates new identity
    A->>AN: Install Vauchi on new device
    AN->>AN: Create new identity (pk_new)
    A->>AN: "I had identity pk_old"
    AN->>AN: Store recovery claim: pk_old → pk_new

    %% Generate recovery QR
    A->>AN: Generate recovery QR
    activate AN
    AN->>AN: Create recovery claim QR
    Note right of AN: QR contains:<br/>- type: recovery_claim<br/>- old_pk: pk_old<br/>- new_pk: pk_new<br/>- timestamp
    AN->>A: Display recovery QR
    deactivate AN

    %% Bob scans and vouches
    B->>BB: Scan Alice's recovery QR
    activate BB
    BB->>BB: Decode recovery claim
    BB->>BB: Lookup pk_old in contacts
    BB->>BB: Found: "Alice" with pk_old ✓
    BB->>B: "Alice claims device loss"
    BB->>B: Show Alice's stored name & photo
    deactivate BB

    Note over BB,B: Bob verifies Alice is physically present

    B->>BB: "Yes, this is Alice, I confirm"
    activate BB
    BB->>BB: Create voucher
    Note right of BB: Voucher:<br/>- old_pk<br/>- new_pk<br/>- voucher_pk (Bob)<br/>- timestamp<br/>- Ed25519 signature
    BB->>AN: Send voucher to Alice
    deactivate BB

    AN->>AN: Store Bob's voucher (1 of 3)
    AN->>A: "Bob vouched for you (1/3)"

    Note over A,B: Alice now has 1 voucher, needs 2 more
```

## Collecting Multiple Vouchers

```mermaid
sequenceDiagram
    participant AN as Alice New Device 📱
    participant CB as Charlie's Device 📱
    participant BB as Betty's Device 📱

    Note over AN,BB: 🤝 IN-PERSON: Alice meets more contacts

    %% Charlie vouches
    rect rgb(240, 248, 255)
        Note over AN,CB: Alice meets Charlie
        AN->>CB: Show recovery QR
        CB->>CB: Verify pk_old is contact "Alice"
        CB->>AN: Send voucher
        AN->>AN: Store Charlie's voucher (2 of 3)
    end

    %% Betty vouches
    rect rgb(240, 255, 240)
        Note over AN,BB: Alice meets Betty
        AN->>BB: Show recovery QR
        BB->>BB: Verify pk_old is contact "Alice"
        BB->>AN: Send voucher
        AN->>AN: Store Betty's voucher (3 of 3)
    end

    Note over AN: ✓ THRESHOLD MET: 3 vouchers collected

    AN->>AN: Create recovery proof
    Note right of AN: Recovery Proof:<br/>- old_pk<br/>- new_pk<br/>- threshold: 3<br/>- vouchers: [Bob, Charlie, Betty]
```

## Phase 2: Remote Distribution

```mermaid
sequenceDiagram
    autonumber
    participant AN as Alice New Device 📱
    participant R as Relay 🖥️
    participant JD as John's Device 📱
    participant DD as David's Device 📱

    Note over AN,DD: 🌐 REMOTE: Distribution via relay

    %% Upload proof
    AN->>R: Upload recovery proof
    R->>R: Store under key: hash(pk_old)
    R-->>AN: Stored ✓

    Note over R: Proof stored for 90 days

    %% John discovers proof
    JD->>R: Batch query for contact recovery proofs
    Note right of JD: Query: [hash(pk1), hash(pk2), hash(pk_old), ...]
    R-->>JD: Found proof for hash(pk_old)

    activate JD
    JD->>JD: Decode recovery proof
    JD->>JD: Verify: pk_old is contact "Alice"
    JD->>JD: Check vouchers for mutual contacts

    alt Has Mutual Contacts (Bob, Charlie)
        JD->>JD: Bob is my contact ✓
        JD->>JD: Charlie is my contact ✓
        JD->>JD: 2 mutual vouchers ≥ threshold ✓
        JD->>JD: "High confidence recovery"
    else No Mutual Contacts
        JD->>JD: No vouchers are my contacts
        JD->>JD: "⚠️ Cannot verify - meet Alice in person"
    end
    deactivate JD

    %% David (isolated contact) case
    DD->>R: Query for recovery proofs
    R-->>DD: Found proof for Alice

    activate DD
    DD->>DD: Check vouchers: Bob, Charlie, Betty
    DD->>DD: None are David's contacts
    DD->>DD: "⚠️ Warning: Unknown vouchers"
    DD->>DD: Options: Meet in person / Verify another way / Accept anyway
    deactivate DD
```

## John Accepts Recovery (Mutual Contacts)

```mermaid
sequenceDiagram
    participant J as John
    participant JD as John's Device 📱
    participant AN as Alice New Device 📱
    participant R as Relay 🖥️

    Note over J,AN: 🌐 REMOTE: Automatic verification

    JD->>J: "Alice recovered identity"
    JD->>J: "Vouched by Bob ✓, Charlie ✓, Betty"
    JD->>J: "2 mutual contacts - High confidence"

    J->>JD: Accept recovery

    activate JD
    JD->>JD: Update contact: pk_old → pk_new
    JD->>JD: Initiate X3DH with pk_new
    JD->>R: Send key exchange to Alice
    R-->>AN: Forward key exchange
    AN->>AN: Complete X3DH
    AN->>R: Send Alice's contact card
    R-->>JD: Forward contact card
    JD->>JD: Store Alice's updated card
    deactivate JD

    JD->>J: "Reconnected with Alice" ✓
```

## David Verifies In-Person (Isolated Contact)

```mermaid
sequenceDiagram
    participant D as David
    participant DD as David's Device 📱
    participant AN as Alice New Device 📱

    Note over D,AN: David has no mutual contacts with vouchers

    DD->>D: "⚠️ Alice claims recovery"
    DD->>D: "Vouched by: Bob, Charlie, Betty"
    DD->>D: "⚠️ You don't know any vouchers"

    D->>DD: "Meet in Person"

    Note over D,AN: 🤝 IN-PERSON: David meets Alice

    DD->>AN: Scan Alice's recovery QR
    DD->>DD: Verify pk_old matches contact
    D->>DD: "Yes, this is Alice"
    DD->>DD: Create David's voucher
    DD->>AN: Send voucher

    Note over DD: David is now a voucher + reconnected

    DD->>DD: Update contact: pk_old → pk_new
    DD->>DD: Initiate X3DH with pk_new
    AN->>AN: Update proof with David's voucher
    AN->>AN: Upload updated proof to relay

    Note over D,AN: Other isolated contacts who know David<br/>can now verify via mutual contact
```

## Data Structures

### Recovery Claim QR
```json
{
  "type": "recovery_claim",
  "old_pk": "Ed25519 public key (lost)",
  "new_pk": "Ed25519 public key (new)",
  "timestamp": "2026-01-21T10:00:00Z"
}
```

### Voucher
```json
{
  "old_pk": "Alice's old public key",
  "new_pk": "Alice's new public key",
  "voucher_pk": "Bob's public key",
  "timestamp": "2026-01-21T10:05:00Z",
  "signature": "Ed25519 signature of above fields"
}
```

### Recovery Proof
```json
{
  "old_pk": "Alice's old public key",
  "new_pk": "Alice's new public key",
  "threshold": 3,
  "vouchers": [
    { /* Bob's voucher */ },
    { /* Charlie's voucher */ },
    { /* Betty's voucher */ }
  ],
  "expires": "2026-04-21T10:00:00Z"
}
```

## Security Properties

| Property | Mechanism |
|----------|-----------|
| **In-Person Vouching** | Vouchers must physically verify the person |
| **Threshold Security** | Requires N vouchers (configurable, default 3) |
| **Mutual Contact Verification** | Recipients verify via contacts they trust |
| **Relay Privacy** | Relay stores proof under hash, learns nothing |
| **Replay Prevention** | Timestamps, signatures, 90-day expiry |
| **Attack Detection** | Conflicting claims trigger warnings |

## Edge Cases

### Conflicting Recovery Claims

```mermaid
sequenceDiagram
    participant R as Relay 🖥️
    participant JD as John's Device 📱

    Note over R: Two proofs exist for same pk_old

    JD->>R: Query for hash(pk_old)
    R-->>JD: Return BOTH proofs

    JD->>JD: Detect conflict!
    JD->>JD: Proof 1: pk_old → pk_new_1 (3 vouchers)
    JD->>JD: Proof 2: pk_old → pk_new_2 (2 vouchers)

    JD->>JD: ⚠️ "Multiple recovery claims detected"
    JD->>JD: "This may indicate an attack"
    JD->>JD: "Verify with Alice directly"
```

## Related Features

- [Contact Exchange](01-contact-exchange.md) - Original key exchange
- [Device Linking](02-device-linking.md) - Recovery not needed if devices linked
- [Sync Updates](03-sync-updates.md) - How reconnected contacts sync
