<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Cryptography

## User Identity

- Each user generates a **Ed25519 keypair** on first launch
- Public key serves as the user's unique identifier
- Private key never leaves the device (stored in secure enclave when available)

## Key Derivation

```
Master Seed (256-bit)
    │
    ├── Identity Keypair (Ed25519) - for signing
    │
    ├── Exchange Keypair (X25519) - for key exchange
    │
    └── Per-Contact Symmetric Keys (derived via X3DH)
```

## Encryption Scheme

- **Contact Card Encryption**: AES-256-GCM with per-contact keys
- **Key Exchange**: X3DH (Extended Triple Diffie-Hellman) for initial exchange
- **Forward Secrecy**: Double Ratchet algorithm for update propagation

> **Note**: Original design specified XChaCha20-Poly1305, but `ring` crate doesn't support it.
> AES-256-GCM provides equivalent security. See [ADR-002](decisions.md#adr-002-use-ring-for-all-cryptography).

## Implementation

Vauchi uses the `ring` crate (audited, production-ready) for all cryptographic operations:

- **Signing**: Ed25519 for identity and message signatures
- **Encryption**: AES-256-GCM with random nonces (256-bit keys, 96-bit nonces)
- **Key Exchange**: X25519 for ECDH
- **Key Derivation**: HKDF for key derivation, PBKDF2 for password-derived keys
- **Memory Safety**: Sensitive data (seeds, keys) zeroed on drop via `zeroize`
