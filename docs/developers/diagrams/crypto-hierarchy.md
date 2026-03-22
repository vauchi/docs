<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Crypto Key Hierarchy

Visual documentation of Vauchi's cryptographic key hierarchy and derivation paths.

## Master Hierarchy

```mermaid
flowchart TB
    subgraph Identity["Identity Creation"]
        SEED["Master Seed<br/>(256-bit, CSPRNG)"]
    end

    subgraph Signing["Signing Keys"]
        SIGN_SK["Identity Signing Key<br/>(Ed25519 secret)"]
        SIGN_PK["Identity Public Key<br/>(Ed25519 public)"]
    end

    subgraph Exchange["Exchange Keys"]
        EXCH_SK["Exchange Secret Key<br/>(X25519)"]
        EXCH_PK["Exchange Public Key<br/>(X25519)"]
    end

    subgraph Shredding["Shredding Hierarchy"]
        SMK["SMK<br/>(Shredding Master Key)"]
        SEK["SEK<br/>(Storage Encryption Key)"]
        FKEK["FKEK<br/>(File Key Encryption Key)"]
    end

    subgraph PerContact["Per-Contact Keys"]
        CEK1["CEK (Contact 1)<br/>random 256-bit"]
        CEK2["CEK (Contact 2)<br/>random 256-bit"]
        CEK3["CEK (Contact N)<br/>random 256-bit"]
    end

    SEED -->|"raw seed<br/>(Ed25519 requirement)"| SIGN_SK
    SIGN_SK --> SIGN_PK

    SEED -->|"HKDF<br/>info='Vauchi_Exchange_Seed'"| EXCH_SK
    EXCH_SK --> EXCH_PK

    SEED -->|"HKDF<br/>info='Vauchi_Shred_Key'"| SMK
    SMK -->|"HKDF<br/>info='Vauchi_Storage_Key'"| SEK
    SMK -->|"HKDF<br/>info='Vauchi_FileKey_Key'"| FKEK

    SEK -.->|"encrypts"| CEK1
    SEK -.->|"encrypts"| CEK2
    SEK -.->|"encrypts"| CEK3

    style SEED fill:#ff9,stroke:#333
    style SMK fill:#f99,stroke:#333
    style SEK fill:#f99,stroke:#333
    style FKEK fill:#f99,stroke:#333
    style CEK1 fill:#9f9,stroke:#333
    style CEK2 fill:#9f9,stroke:#333
    style CEK3 fill:#9f9,stroke:#333
```

## Key Derivation Details

### HKDF Convention

All HKDF derivations use standard RFC 5869 (documented as "DP-5"):

```
HKDF-SHA256:
  - salt: None (zeros per RFC 5869 §2.2)
  - ikm: master_seed (32 bytes, high-entropy input)
  - info: domain string (e.g., "Vauchi_Exchange_Seed_v2")
  - output: 32 bytes
```

This follows standard HKDF convention: high-entropy seed as IKM, no salt needed.

### Key Sizes

| Key | Size | Algorithm |
|-----|------|-----------|
| Master Seed | 256 bits | CSPRNG |
| Identity Signing | 32 + 64 bytes | Ed25519 (seed + keypair) |
| Exchange | 32 bytes | X25519 |
| SMK | 256 bits | HKDF-SHA256 |
| SEK | 256 bits | HKDF-SHA256 |
| FKEK | 256 bits | HKDF-SHA256 |
| CEK | 256 bits | CSPRNG |

## Double Ratchet Key Hierarchy

```mermaid
flowchart TB
    subgraph Initial["Initial Key Agreement (X3DH)"]
        X3DH["X3DH Shared Secret<br/>(32 bytes)"]
    end

    subgraph RootChain["Root Chain"]
        RK0["Root Key 0"]
        RK1["Root Key 1"]
        RK2["Root Key 2"]
        RKN["Root Key N"]
    end

    subgraph DHRatchet["DH Ratchet Steps"]
        DH1["DH(our_secret × their_pub)"]
        DH2["DH(our_secret × their_pub)"]
    end

    subgraph SendChain["Send Chain"]
        SCK0["Send Chain Key 0"]
        SCK1["Send Chain Key 1"]
        MK0["Message Key 0"]
        MK1["Message Key 1"]
    end

    subgraph RecvChain["Receive Chain"]
        RCK0["Recv Chain Key 0"]
        RCK1["Recv Chain Key 1"]
        RMK0["Message Key 0"]
        RMK1["Message Key 1"]
    end

    X3DH -->|"HKDF<br/>init"| RK0

    RK0 --> DH1
    DH1 -->|"HKDF"| RK1
    DH1 -->|"HKDF"| SCK0

    RK1 --> DH2
    DH2 -->|"HKDF"| RK2
    DH2 -->|"HKDF"| RCK0

    RK2 --> RKN

    SCK0 -->|"HKDF<br/>MESSAGE_KEY_INFO"| MK0
    SCK0 -->|"HKDF<br/>CHAIN_KEY_INFO"| SCK1
    SCK1 -->|"HKDF"| MK1

    RCK0 -->|"HKDF<br/>MESSAGE_KEY_INFO"| RMK0
    RCK0 -->|"HKDF<br/>CHAIN_KEY_INFO"| RCK1
    RCK1 -->|"HKDF"| RMK1

    style X3DH fill:#ff9,stroke:#333
    style RK0 fill:#f9f,stroke:#333
    style RK1 fill:#f9f,stroke:#333
    style RK2 fill:#f9f,stroke:#333
    style MK0 fill:#9ff,stroke:#333
    style MK1 fill:#9ff,stroke:#333
    style RMK0 fill:#9ff,stroke:#333
    style RMK1 fill:#9ff,stroke:#333
```

## Device Key Derivation

```mermaid
flowchart TB
    subgraph Master["Master Identity"]
        SEED["Master Seed"]
        IDX0["Device Index 0<br/>(Primary)"]
        IDX1["Device Index 1"]
        IDX2["Device Index 2"]
    end

    subgraph Device0["Device 0 Keys"]
        D0_SIGN["Signing Key 0"]
        D0_EXCH["Exchange Key 0"]
    end

    subgraph Device1["Device 1 Keys"]
        D1_SIGN["Signing Key 1"]
        D1_EXCH["Exchange Key 1"]
    end

    subgraph Device2["Device 2 Keys"]
        D2_SIGN["Signing Key 2"]
        D2_EXCH["Exchange Key 2"]
    end

    SEED --> IDX0
    SEED --> IDX1
    SEED --> IDX2

    IDX0 -->|"HKDF(seed, device_index=0)"| D0_SIGN
    IDX0 --> D0_EXCH

    IDX1 -->|"HKDF(seed, device_index=1)"| D1_SIGN
    IDX1 --> D1_EXCH

    IDX2 -->|"HKDF(seed, device_index=2)"| D2_SIGN
    IDX2 --> D2_EXCH

    style SEED fill:#ff9,stroke:#333
```

## Crypto-Shredding Paths

```mermaid
flowchart TB
    subgraph Destroy["Destruction Targets"]
        DSEED["Destroy Seed"]
        DSMK["Destroy SMK"]
        DCEK["Destroy CEK"]
    end

    subgraph Effect["Effect"]
        E_ALL["All data unreadable"]
        E_LOCAL["All local data unreadable"]
        E_CONTACT["Single contact unreadable"]
    end

    DSEED -->|"Complete identity destruction"| E_ALL
    DSMK -->|"Storage shredding"| E_LOCAL
    DCEK -->|"Per-contact shredding"| E_CONTACT

    style DSEED fill:#f99,stroke:#333
    style DSMK fill:#f99,stroke:#333
    style DCEK fill:#f99,stroke:#333
```

## Key Storage Locations

```mermaid
flowchart LR
    subgraph Platform["Platform Keychain"]
        SMK_STORED["SMK<br/>(encrypted)"]
    end

    subgraph SQLite["SQLite Database"]
        SEK_DATA["Data encrypted<br/>with SEK"]
        CEK_STORED["CEK encrypted<br/>with SEK"]
        RATCHET["Ratchet state<br/>encrypted with SEK"]
    end

    subgraph Memory["Memory Only"]
        SEK_MEM["SEK (derived at boot)"]
        MK_MEM["Message keys<br/>(single use)"]
        CHAIN_MEM["Active chain keys"]
    end

    SMK_STORED -->|"derive on boot"| SEK_MEM
    SEK_MEM -->|"encrypt/decrypt"| SEK_DATA
    SEK_MEM -->|"encrypt/decrypt"| CEK_STORED
    SEK_MEM -->|"encrypt/decrypt"| RATCHET

    CHAIN_MEM -->|"derive"| MK_MEM
    MK_MEM -->|"delete after use"| MK_MEM

    style SMK_STORED fill:#f9f,stroke:#333
    style SEK_MEM fill:#9ff,stroke:#333
    style MK_MEM fill:#9f9,stroke:#333
```

## Backup Key Derivation

```mermaid
flowchart TB
    subgraph Input["User Input"]
        PASSWORD["Password"]
        SALT["Random Salt<br/>(16 bytes)"]
    end

    subgraph KDF["Key Derivation"]
        ARGON["Argon2id<br/>m=64MB, t=3, p=4"]
    end

    subgraph Output["Output"]
        BACKUP_KEY["Backup Key<br/>(256 bits)"]
        ENCRYPTED["Encrypted Backup"]
    end

    subgraph Plaintext["Backup Contents"]
        NAME["Display Name"]
        SEED_PT["Master Seed"]
        DEV_IDX["Device Index"]
        DEV_NAME["Device Name"]
    end

    PASSWORD --> ARGON
    SALT --> ARGON
    ARGON --> BACKUP_KEY

    BACKUP_KEY -->|"XChaCha20-Poly1305"| ENCRYPTED

    NAME --> ENCRYPTED
    SEED_PT --> ENCRYPTED
    DEV_IDX --> ENCRYPTED
    DEV_NAME --> ENCRYPTED

    style PASSWORD fill:#ff9,stroke:#333
    style BACKUP_KEY fill:#9ff,stroke:#333
```

## Security Properties by Key

| Key | Forward Secrecy | Break-in Recovery | Zeroized on Drop |
|-----|-----------------|-------------------|------------------|
| Master Seed | N/A | No | Yes |
| Identity Signing | No | No | Yes |
| Exchange Key | No | No | Yes |
| SMK | No | No | Yes |
| SEK | No | No | Yes (memory only) |
| CEK | Per-contact | N/A | Yes |
| Root Key | Via DH ratchet | Yes | Yes |
| Chain Key | Via symmetric ratchet | N/A | Yes |
| Message Key | Single-use, deleted | N/A | Yes |

## Related Documentation

- [Crypto Reference](../crypto.md) — Algorithm details
- [Architecture Overview](../architecture.md) — System design
- [Message Delivery Flow](message-delivery.md) — Ratchet in action
