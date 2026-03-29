<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Privacy Policy

**Last Updated:** February 2026

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
  using XChaCha20-Poly1305 with a key stored in
  your device's platform keychain
  (iOS Keychain / Android KeyStore)
- **No Cloud Backup by Default:** Your data is not
  automatically backed up to any cloud service
- **You Control Exports:** You can create encrypted
  backups manually, protected by a password you
  choose

### Relay Server

The relay server delivers encrypted contact card
updates between your devices and your contacts.
It operates as a store-and-forward broker:

- Contact card updates are end-to-end encrypted before leaving your device
- The server cannot decrypt any envelope content
- Envelopes are deleted immediately after delivery
  or after 120 days if undelivered
- Server logs contain only connection metadata, not contact card content
- Rate limiting data (based on cryptographic
  identity hash, not IP address) is retained for
  up to 30 minutes of inactivity

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

- **Identity Keys:** Ed25519 signing keys, never leave your device
- **Encryption:** X25519 key exchange +
  XChaCha20-Poly1305 for all contact card updates
- **Key Derivation:** Argon2id for password-based encryption (backups)
- **Forward Secrecy:** Double Ratchet protocol
  ensures each contact card update uses a unique
  encryption key

### Platform Security

- **iOS:** Keys stored in Keychain
- **Android:** Keys stored in KeyStore
- **Desktop:** Keys encrypted with OS-level secure storage

### Certificate Pinning

Certificate pinning primitives are implemented to
prevent man-in-the-middle attacks against the relay
server connection. This feature is not yet active
in client apps.

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
| Do you sell my data? | No, never |
| Do you use tracking/analytics? | No |
| Can I delete my data? | Yes, Settings > Delete Account (7-day grace) |
| Data backed up automatically? | No, you control backups |
| What if I lose my device? | Linked device or social recovery |
