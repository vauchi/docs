<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Privacy Policy

**Last Updated:** May 2026

## Overview

Vauchi is a privacy-focused contact card exchange
application. This privacy policy explains how we
handle your data. The short version: **your data
stays on your devices, encrypted, and under your
control.**

## Data Collection

### What We Collect

**On Your Device (Local Storage):**

- Your identity (cryptographic keypair, display name)
- Your contact card (fields you choose to add: email, phone, etc.)
- Contacts you've exchanged with (their public cards)
- Visibility rules (which contacts can see which fields)
- Device registry (for multi-device sync)

**On Our Relay Server:**

- Temporary encrypted envelopes containing contact
  card updates (deleted after delivery or 120 days)
- Connection metadata (cryptographic identity hash,
  connection timestamps) for rate limiting — IP
  addresses are NOT stored or logged
- No envelope content is ever readable by the server

### What We Don't Collect

- We do not collect analytics or telemetry
- We do not track your location
- We do not access your device contacts, photos, or other apps
- We do not use advertising identifiers
- We do not sell or share your data with third parties

## Data Storage

### Local-First Architecture

All your personal data is stored locally on your device:

- **Encryption at Rest:** Your data is encrypted
  using XChaCha20-Poly1305. The key is derived from
  a master key (the SMK) held in your device's
  platform secure storage (iOS Keychain / Android
  KeyStore / OS credential manager), never written
  to disk in the clear.
- **No Cloud Backup by Default:** Your data is not
  automatically backed up to any cloud service.
  Nothing leaves your device unless you ask it to.
- **You Control Exports:** You can create encrypted
  backups manually, protected by a password you
  choose (see *Backups* below).

### Backups

A backup is a single encrypted file that **you**
create and **you** keep — we never receive it, store
it, or see inside it.

- **What's in it:** your identity (the master seed
  that all your keys derive from), your contacts,
  your own card, and your labels/groups.
- **How it's protected:** the file is encrypted with
  XChaCha20-Poly1305 under a key stretched from your
  password with **Argon2id** (memory-hard:
  64 MB, 3 passes, 4 lanes). A weak password is the
  only weak link — the cryptography assumes your
  password is the secret, so choose a strong one.
- **What is deliberately *not* in it:** the
  per-conversation forward-secrecy keys (the Double
  Ratchet state) for each contact. These are
  intentionally ephemeral. After you restore onto a
  new device, secure channels re-establish
  themselves the next time you and a contact sync —
  you don't lose contacts, only the short-lived keys
  that protect old messages, which is exactly the
  property forward secrecy is meant to give you.
- **Where it lives:** wherever you put it. The file
  is just bytes; its safety is your password plus
  wherever you store it.

### Relay Server

The relay is a blind dead-drop. Think of it as a
left-luggage locker that the staff can never open
and whose tickets change every day. It moves
encrypted contact-card updates between your devices
and your contacts and knows as little as the design
allows:

- **It cannot read anything.** Updates are
  end-to-end encrypted before they leave your
  device. The relay only ever holds opaque
  ciphertext blobs — it has none of your keys.
- **It cannot build a social graph.** Messages are
  addressed to **daily-rotating mailbox tokens**
  derived from a secret shared only between you and
  each contact. The token for "you → Alice" is a
  different random-looking value tomorrow, so the
  relay cannot link who talks to whom across days,
  or tie a mailbox to a person.
- **Retention:** an undelivered blob is deleted
  after delivery, or after 120 days, whichever comes
  first.
- **Logs:** connection metadata only (a
  cryptographic identity hash and timestamps), never
  card content. **IP addresses are not stored or
  logged.** Rate-limiting state (keyed on the
  identity hash, not IP) is discarded after 30
  minutes of inactivity.

### Oblivious HTTP (Hiding Your IP)

There is a subtle gap in "we don't log IP
addresses": a server that *receives* a connection
still *sees* the source IP, log or no log. We close
that gap structurally rather than asking you to
trust a promise.

Client requests are wrapped in **Oblivious HTTP
(OHTTP, RFC 9458)** and routed through an
independent **OHTTP gateway** operated by a
*different party* than the relay:

- The **gateway** sees your IP address but only an
  encrypted request it cannot read.
- The **relay** sees the request but only the
  gateway's IP — never yours.

No single party holds both your identity and your
network location. The relay can't log your IP
because, by construction, it never receives it.
Transport throughout is HTTPS (TLS 1.3) with SPKI
certificate pinning to block man-in-the-middle
attacks.

## Data Sharing

### With Your Contacts

When you exchange contact cards with someone:

- You explicitly choose which fields they can see
- You can change visibility settings at any time
- Changes sync automatically to their device

### With Third Parties

We do not share your data with any third parties. Period.

### With Law Enforcement

If required by law, we can only provide:

- Connection metadata (timestamps only — IP addresses are not stored or logged)
- Encrypted envelopes (which we cannot decrypt)

We cannot provide your contact card content, contact
list, IP addresses, or any decrypted data because we
do not have access to it.

## Data Security

### Cryptographic Protections

- **Identity Keys:** Ed25519 signing keys, derived
  from a 256-bit master seed, never leave your device
- **Encryption:** X25519 key agreement +
  XChaCha20-Poly1305 for all contact card updates
- **Key Derivation:** HKDF-SHA256 with domain
  separation for all internal keys; Argon2id for
  password-based encryption (backups)
- **Forward Secrecy:** Double Ratchet protocol
  ensures each contact card update uses a unique,
  single-use encryption key that is deleted after use
- **Network Privacy:** Oblivious HTTP (RFC 9458)
  separates your IP address from your requests; the
  relay never sees your network location

### Platform Security

- **iOS:** Keys stored in Keychain
- **Android:** Keys stored in KeyStore
- **Desktop:** Keys encrypted with OS-level secure storage

### Certificate Pinning

All client apps use SPKI certificate pinning to prevent
man-in-the-middle attacks against relay server
connections.

## Your Rights

### Access Your Data

All your data is stored locally on your device.
You can view it directly in the app.

### Export Your Data

You can export an encrypted backup of all your data
at any time from Settings > Backup.

### Delete Your Data

- **Account Deletion:** Use Settings > Delete
  Account to initiate deletion. A 7-day grace
  period allows you to cancel. After 7 days, the
  app sends a revocation signal to all your
  contacts (authenticated with your cryptographic
  identity), requests the relay server to purge
  all stored data for your account, and
  permanently deletes all local data (database,
  keys, and secure storage entries). Your
  contacts' apps will automatically delete your
  card upon receiving the revocation.
- **Single Contact Removal:** You can remove any
  contact, which deletes their data from your
  device
- **Multi-Device:** Account deletion is synchronized
  across all your linked devices. Initiating
  deletion on one device starts the grace period
  on all devices; cancellation from any device
  cancels on all devices.

### Data Portability

Encrypted backups can be imported on any device where you install Vauchi.

## Account Recovery

Vauchi has no central account or "forgot password"
mechanism. Recovery depends on your situation:

- **Linked devices (primary method):** If you have
  multiple linked devices and at least one remains
  accessible, your identity and all data are
  already synchronized. No recovery process is
  needed.
- **Social recovery (all devices lost):** If all
  your devices are lost, trusted contacts you
  previously designated can vouch for your
  identity, allowing you to migrate your contacts
  to a new cryptographic identity on a new device.
  Note: social recovery creates a new identity —
  your old signing keys cannot be recovered.
  Trusted contact designations and per-contact
  visibility labels may need to be reconfigured.

## Children's Privacy

Vauchi does not require registration and does not
verify the age of its users. Parents and guardians
should be aware that Vauchi allows users to share
contact information with people they meet in person.

## Changes to This Policy

We may update this privacy policy from time to time.
We will notify you of significant changes through
the app or our website. Continued use of Vauchi
after changes constitutes acceptance of the updated
policy.

## Open Source

Vauchi is open source software. You can inspect
exactly how your data is handled by reviewing our
source code at:
[gitlab.com/vauchi](https://gitlab.com/vauchi)

## Contact Us

For privacy-related questions or concerns:

- Email: [privacy@vauchi.app](mailto:privacy@vauchi.app)
- GitLab: [gitlab.com/vauchi](https://gitlab.com/vauchi)

---

## Summary

| Question | Answer |
|----------|--------|
| Store my contacts on servers? | No, only on your device |
| Can you read my card updates? | No, end-to-end encrypted |
| Can you see who I talk to? | No, daily-rotating mailbox tokens |
| Do you log my IP address? | No — Oblivious HTTP hides it from the relay |
| Do you sell my data? | No, never |
| Do you use tracking/analytics? | No |
| Can I delete my data? | Yes, Settings > Delete Account (7-day grace) |
| What's in a backup? | Your identity, contacts, card, labels — encrypted with your password |
| Data backed up automatically? | No, you control backups |
| What if I lose my device? | Linked device or social recovery |
