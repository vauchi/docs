<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Glossary

Terms used across the developer documentation. Each entry links to the
page (or source file) where the concept is specified.

## Keys and Derivation

**Master Seed** — The 256-bit root secret created at identity setup.
Every other key derives from it (directly or via HKDF); it is what a
[backup](crypto.md#backup-format) protects and what
[recovery](diagrams/contact-recovery.md) restores. See
[Key Types](crypto.md#key-types).

**Identity Signing Key** — Ed25519 signing key. Uses the raw master
seed directly (an Ed25519 requirement), not an HKDF derivation.

**SMK (Shredding Master Key)** — Root of the crypto-shredding
hierarchy, derived once from the master seed
(`Vauchi_Shred_Key_v2`) and held in platform secure storage.
Destroying the SMK renders all locally encrypted data unreadable —
that destruction *is* [crypto shredding](#crypto-shredding).

**SEK (Storage Encryption Key)** — Derived from the SMK
(`Vauchi_Storage_Key_v2`); encrypts all local SQLite data at rest.

**FKEK (File Key Encryption Key)** — Derived from the SMK
(`Vauchi_FileKey_Key_v2`); encrypts file key storage.

**CEK (Content Encryption Key)** — Random 256-bit key, one per
contact, wrapping that contact's card data so a single contact's
content can be shredded independently. See
[`vauchi-core/src/crypto/cek.rs`](https://gitlab.com/vauchi/core/-/blob/main/vauchi-core/src/crypto/cek.rs).

**HKDF domain separation** — Every derivation path uses a unique
info string (e.g. `Vauchi_Mailbox_v1`); the full table is in the
[Cryptography Reference](crypto.md#storage-keys-shredding-hierarchy).

## Protocol

**X3DH** — Extended Triple Diffie-Hellman key agreement used at
contact exchange to establish the initial shared secret. See
[Contact Exchange](diagrams/contact-exchange.md).

**Double Ratchet** — Signal-style ratchet giving forward secrecy and
break-in recovery for card updates between two contacts. Limits:
2000 chain generations, 1000 stored skipped keys. See
[Cryptography Reference](crypto.md#double-ratchet).

**Mailbox token** — Anonymous, daily-rotating routing identifier
derived via HKDF from the per-pair shared key (or the master seed for
a device's own sync token). The relay routes by token and never sees
a stable identity; public keys are never routing identifiers.

**OHTTP (Oblivious HTTP)** — RFC 9458 relaying that hides client IP
addresses from the relay; the OHTTP gateway and the relay must be run
by distinct operators for the non-collusion privacy property. Vauchi's
current two-hop deployment remains under one operator, so that property
is not yet provided. See
[Transport Encryption](crypto.md#transport-encryption).

**SPKI pinning** — TLS certificate pinning against the SHA-256 hash
of the server's SubjectPublicKeyInfo (RFC 7469 style), so a pin
survives certificate renewal under the same key.

**WBEX** — The 4-byte magic prefix identifying a Vauchi exchange
payload in QR codes (currently format v3). A historical protocol
identifier with no current expansion. See
[Contact Exchange](diagrams/contact-exchange.md).

## Data Protection

<a id="crypto-shredding"></a>
**Crypto shredding** — Deleting data by destroying the key that
encrypts it (SMK or a per-contact CEK) instead of overwriting the
ciphertext.

**Duress PIN** — A secondary unlock credential that shows a decoy
contact list and silently alerts trusted contacts, for users unlocking
under coercion. See [Security](../about/security.md).

**Decoy contacts** — The plausible fake contact list presented in
duress mode, stored separately from real contacts.

## Related Documentation

- [Cryptography Reference](crypto.md)
- [Architecture Overview](architecture.md)
- [Threat Model](threat-model.md)
