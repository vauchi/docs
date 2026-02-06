<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# State Machines

This document describes the key state machines in Vauchi.

## Exchange Session

**Location**: `core/vauchi-core/src/exchange/session.rs`

The exchange session manages contact exchange across all transport types (QR, NFC, BLE).

```mermaid
stateDiagram-v2
    [*] --> Idle: init()

    %% QR One-Way Flow
    Idle --> AwaitingScan: GenerateQR (initiator)
    Idle --> AwaitingProximity: ProcessQR (responder)

    AwaitingScan --> AwaitingKeyAgreement: TheyScannedOurQR
    AwaitingProximity --> AwaitingKeyAgreement: VerifyProximity

    %% Mutual QR Flow
    Idle --> MutualAwaitingTheirScan: StartMutualQR
    MutualAwaitingTheirScan --> MutualVerified: ScannedTheirQR
    MutualVerified --> AwaitingKeyAgreement: TheyScannedOurQR

    %% NFC Flow
    Idle --> AwaitingNfcTap: StartNfcExchange
    AwaitingNfcTap --> AwaitingKeyAgreement: NfcTapComplete

    %% BLE Flow
    Idle --> AwaitingBleConnection: StartBleExchange
    AwaitingBleConnection --> AwaitingBleVerification: BlePayloadExchanged
    AwaitingBleVerification --> AwaitingKeyAgreement: BleProximityVerified

    %% Common completion path
    AwaitingKeyAgreement --> AwaitingCardExchange: PerformKeyAgreement
    AwaitingCardExchange --> Complete: CompleteExchange

    %% Failure paths
    AwaitingScan --> Failed: Timeout
    AwaitingProximity --> Failed: ProximityFailed
    AwaitingNfcTap --> Failed: Timeout
    AwaitingBleConnection --> Failed: BleDisconnected
    AwaitingKeyAgreement --> Failed: CryptoError

    Complete --> [*]
    Failed --> [*]
```

### States

| State | Description | Next Events |
|-------|-------------|-------------|
| `Idle` | Initial state | GenerateQR, ProcessQR, StartMutualQR, StartNfcExchange, StartBleExchange |
| `AwaitingScan` | QR displayed, waiting for peer to scan | TheyScannedOurQR, Timeout |
| `AwaitingProximity` | QR scanned, verifying proximity | VerifyProximity, ProximityFailed |
| `MutualAwaitingTheirScan` | Both sides display QR, waiting to scan peer | ScannedTheirQR |
| `MutualVerified` | Scanned peer's QR, waiting for them to scan ours | TheyScannedOurQR |
| `AwaitingNfcTap` | NFC mode, waiting for tap | NfcTapComplete, Timeout |
| `AwaitingBleConnection` | BLE mode, waiting for GATT connection | BlePayloadExchanged, BleDisconnected |
| `AwaitingBleVerification` | BLE payloads exchanged, verifying proximity | BleProximityVerified |
| `AwaitingKeyAgreement` | Proximity verified, ready for X3DH | PerformKeyAgreement, CryptoError |
| `AwaitingCardExchange` | Keys agreed, exchanging encrypted cards | CompleteExchange |
| `Complete` | Exchange successful, contact created | — |
| `Failed` | Exchange failed with error | — |

### Timeouts

- **Session timeout**: 60 seconds (resumption window)
- **Proximity timeout**: 30 seconds
- **QR expiry**: 5 minutes

---

## Double Ratchet

**Location**: `core/vauchi-core/src/crypto/ratchet.rs`

The Double Ratchet provides forward secrecy for all contact communications.

```mermaid
stateDiagram-v2
    [*] --> Initialized: new_initiator() / new_responder()

    state "Send Chain Active" as SendActive {
        [*] --> ReadyToSend
        ReadyToSend --> Ratcheted: encrypt()
        Ratcheted --> ReadyToSend: next message
    }

    state "Receive Chain Active" as ReceiveActive {
        [*] --> ReadyToReceive
        ReadyToReceive --> MessageDecrypted: decrypt()
        MessageDecrypted --> ReadyToReceive: next message
    }

    Initialized --> SendActive: First send (initiator)
    Initialized --> ReceiveActive: First receive (responder)

    SendActive --> DHRatchet: Receive message with new DH key
    ReceiveActive --> DHRatchet: Send message

    DHRatchet --> SendActive: Generate new ephemeral
    DHRatchet --> ReceiveActive: Accept peer's ephemeral
```

### Chain Key Ratchet

```mermaid
stateDiagram-v2
    direction LR

    state "Chain Key N" as CKN
    state "Message Key N" as MKN
    state "Chain Key N+1" as CKN1
    state "Message Key N+1" as MKN1

    CKN --> MKN: HKDF (MESSAGE_KEY_INFO)
    CKN --> CKN1: HKDF (CHAIN_KEY_INFO)
    CKN1 --> MKN1: HKDF (MESSAGE_KEY_INFO)
```

### Limits

| Limit | Value | Purpose |
|-------|-------|---------|
| Max chain generations | 2000 | Prevent unbounded ratchet |
| Max skipped keys | 1000 | Prevent memory exhaustion |
| DH generation limit | None | Unlimited ratchet steps |

---

## Sync State

**Location**: `core/vauchi-core/src/sync/manager.rs`

The sync manager coordinates card update propagation.

```mermaid
stateDiagram-v2
    [*] --> Idle: init()

    Idle --> Connecting: sync_requested
    Connecting --> Connected: connection_established
    Connecting --> Error: connection_failed

    Connected --> Syncing: begin_sync
    Syncing --> ReceivingUpdates: receive_pending
    ReceivingUpdates --> SendingUpdates: all_received
    SendingUpdates --> ProcessingAcks: all_sent
    ProcessingAcks --> Complete: all_acked

    Complete --> Idle: reset
    Error --> Idle: retry

    %% Continuous connection
    Connected --> Connected: heartbeat
    Connected --> Idle: disconnect
```

### Sync Operations

| Operation | Direction | Description |
|-----------|-----------|-------------|
| `receive_pending` | Relay → Client | Get messages queued for this identity |
| `send_updates` | Client → Relay | Push encrypted deltas to contacts |
| `process_acks` | Relay → Client | Handle delivery confirmations |

### Delivery States

```mermaid
stateDiagram-v2
    direction LR

    [*] --> Sent: Message created
    Sent --> Stored: Relay confirms storage
    Stored --> Delivered: Recipient connected
    Delivered --> ReceivedByRecipient: Recipient acks

    Stored --> Failed: Quota exceeded
    Delivered --> Failed: Decrypt error
```

---

## Recovery State

**Location**: `core/vauchi-core/src/recovery/mod.rs`

Social recovery for lost identities.

```mermaid
stateDiagram-v2
    [*] --> NoRecovery: init()

    NoRecovery --> ClaimCreated: create_claim()
    ClaimCreated --> CollectingVouchers: share_claim

    CollectingVouchers --> CollectingVouchers: add_voucher (count < threshold)
    CollectingVouchers --> ThresholdMet: add_voucher (count >= threshold)

    ThresholdMet --> ProofUploaded: upload_to_relay

    %% Discovery side
    state "Other Contacts" as OtherContacts {
        Synced --> ProofDiscovered: batch_query
        ProofDiscovered --> Verified: verify_proof

        Verified --> Accepted: accept_recovery
        Verified --> Rejected: reject_recovery
        Verified --> Deferred: remind_later
    }

    ProofUploaded --> Synced: relay stores proof

    %% Expiration
    ClaimCreated --> Expired: 48 hours
    ProofUploaded --> Expired: 90 days
```

### Verification Results

| Result | Criteria | UI Action |
|--------|----------|-----------|
| `HighConfidence` | ≥ 2 mutual contacts vouched | Auto-prompt to accept |
| `MediumConfidence` | 1 mutual contact vouched | Prompt with warning |
| `LowConfidence` | 0 mutual contacts vouched | Strong warning, suggest in-person verify |

---

## Device Link State

**Location**: `core/vauchi-core/src/identity/device_link.rs`

Linking additional devices to an identity.

```mermaid
stateDiagram-v2
    [*] --> SingleDevice: identity_created

    SingleDevice --> LinkInitiated: generate_link_qr
    LinkInitiated --> AwaitingScan: display_qr
    AwaitingScan --> Linking: scan_received

    Linking --> Verifying: x3dh_complete
    Verifying --> Linked: signature_verified

    Linked --> MultiDevice: sync_complete
    MultiDevice --> MultiDevice: add_device
    MultiDevice --> SingleDevice: revoke_last_device

    %% Failure
    AwaitingScan --> Expired: 10 minute timeout
    Linking --> Failed: crypto_error
    Expired --> SingleDevice: reset
    Failed --> SingleDevice: reset
```

### Device Registry

Each identity maintains a signed device registry:

```rust
DeviceRegistry {
    devices: Vec<DeviceInfo>,
    version: u64,
    signature: [u8; 64],  // Signed by identity key
}

DeviceInfo {
    device_id: [u8; 16],
    name: String,
    public_key: [u8; 32],
    added_at: u64,
    last_seen: u64,
}
```

---

## Connection State

**Location**: `core/vauchi-core/src/network/connection.rs`

WebSocket connection lifecycle.

```mermaid
stateDiagram-v2
    [*] --> Disconnected

    Disconnected --> Connecting: connect()
    Connecting --> Handshaking: tcp_connected
    Handshaking --> Connected: handshake_ack

    Connected --> Connected: message_exchange
    Connected --> Reconnecting: connection_lost

    Reconnecting --> Connecting: retry
    Reconnecting --> Disconnected: max_retries

    Connected --> Disconnected: disconnect()

    %% Idle handling
    Connected --> Idle: no_activity (5 min)
    Idle --> Connected: activity
    Idle --> Disconnected: idle_timeout
```

### Reconnection Strategy

| Attempt | Delay | Notes |
|---------|-------|-------|
| 1 | 1s | Immediate retry |
| 2 | 2s | Exponential backoff |
| 3 | 4s | |
| 4 | 8s | |
| 5+ | 30s | Cap at 30 seconds |

---

## Related Documentation

- [System Overview](2026-02-06-system-overview.md) — High-level architecture
- [Crypto Reference](2026-02-06-crypto-reference.md) — Cryptographic operations
- [Exchange Protocol](https://gitlab.com/vauchi/private/-/blob/main/docs/architecture/2026-01-22-exchange-protocol.md) — Exchange details (internal)
- [Sequence Diagrams](https://gitlab.com/vauchi/private/-/blob/main/docs/diagrams/README.md) — Interaction flows (internal)
