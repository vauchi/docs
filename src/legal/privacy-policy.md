<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Privacy Policy

**Last Updated:** November 9, 2026

This policy distinguishes contact-card exchanges from this website and
its optional email waitlist. The app's end-to-end encryption does not
protect the address you give the waitlist.

## Website and Waitlist

### Who is responsible

Mattia Egloff, Switzerland, is responsible for processing personal data
for this website and its optional waitlist. For questions or requests,
contact [security@vauchi.app](mailto:security@vauchi.app).

### Visiting the website

Your browser requests pages and assets from `vauchi.app` and
`cdn.vauchi.app`. Serving those requests involves connection details,
including your IP address. The pages do not send behavior-analytics
events. This is separate from the encrypted contact-card exchanges
described in the app and relay sections below.

This website does not set cookies. Your browser can still remember theme
preferences and tab-only language and presentation settings. These are
display settings, not analytics identifiers. You can clear them in your
browser's site-data settings.

### The optional waitlist

We use your email for confirmation, removal links you request and one
launch announcement. We also keep confirmation status, timestamps and
information needed to verify confirmation and removal links.

The stored address is encrypted with an operator-held key. Vauchi can
read it to send these messages. This is not end-to-end encryption.

Unconfirmed entries expire after seven days. Confirmed entries expire
365 days after confirmation. You can leave earlier using the removal
link in your email, or
[request a new link](https://vauchi.app/waitlist/manage?lang=en).

Leaving removes the active entry. Expired entries are excluded from new
launch-mail lists; an outage can delay removal from storage. Leaving
cannot recall mail already being sent. Earlier exports and backups can
retain copies after the active entry is removed. The
[management page](https://vauchi.app/waitlist/manage?lang=en) explains
expiry and removal limits before you submit a request.

The website is hosted by IONOS. Messages are sent through Vauchi's
self-hosted mail server and reach your email provider. The app's
contact-card encryption does not hide your waitlist address from the
people and systems needed to send those messages.

We encrypt backups before uploading them to Cloudflare R2. Local backup
copies are normally cleaned up after about two weeks. Off-site backups
are deleted manually, without a fixed deletion date. They can retain a
removed address for longer than a year. Vauchi can decrypt these backups;
this is separate from the app's end-to-end encryption.

You can ask security@vauchi.app about your waitlist information or request
access, correction or deletion. Other rights depend on the applicable
law. You can also contact the competent data-protection authority; in
Switzerland, the
[Federal Data Protection and Information Commissioner](https://www.edoeb.admin.ch/en).

## Overview

The following app and relay sections describe Vauchi's contact-card
exchange application. They do not describe the separate website and
waitlist processing above. Contact-card contents are end-to-end encrypted;
that protection does not apply to waitlist email.

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
- If you set up social recovery: an encrypted list of
  the contacts you trust for recovery (kept up to 365
  days), and, after a recovery, the signed proof your
  contacts check (kept up to 9 days). The relay
  cannot read who is on the list.
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
  logged.** Rate-limiting state (keyed on mailbox
  tokens and recipient IDs, never IP) is discarded
  after 30 minutes of inactivity.

<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

### Oblivious HTTP (Hiding Your IP)

There is a subtle gap in "we don't log IP
addresses": a server that *receives* a connection
still *sees* the source IP, log or no log. We close
part of that gap structurally rather than relying
only on a promise.

Client requests are wrapped in **Oblivious HTTP
(OHTTP, RFC 9458)**. They travel through two
servers:

- The **OHTTP relay** receives the request from
  your device. It sees your IP address but only an
  encrypted request it cannot read. To limit how
  fast one address can send requests, it keeps your
  address in memory, never on disk, and removes it
  once that address has sent nothing for 30 minutes
  (the check runs every 10 minutes). It keeps no
  request log.
- The **application relay** unwraps the request and
  handles it: it sees the encrypted card update and
  the daily mailbox token it is addressed to, but
  only the OHTTP relay's address, never yours.

**One operator runs both servers during the
alpha.** OHTTP is designed for two operators who do
not share what they see. During the alpha, both
servers are run by the same person, the one named
under *Who is responsible* above, on separate
machines. Today that means: other people on the
network, and someone who breaks into only one of
the two machines, cannot connect your address to
your requests. The operator could: by matching the
timing of a request at both servers, the operator
can link your address to the mailbox tokens you
use. Contact-card contents stay end-to-end
encrypted either way. Vauchi's release plan
requires an independent operator for the OHTTP
relay before the first full release.

**A direct request for the key.** To wrap a
request, the app first needs the public key of the
application relay's OHTTP endpoint. It fetches that
key, and later fresh copies of it, directly from
the OHTTP relay's server. That request carries no
account, mailbox or contact data. The server sees
your address and when the app fetches the key; like
every other request there, it is not logged.

Between your device and these servers, traffic uses
HTTPS (TLS 1.2 or 1.3) with SPKI certificate
pinning, which blocks man-in-the-middle attacks.
The two servers talk to each other over an
encrypted WireGuard tunnel.

## Data Sharing

### With Your Contacts

When you exchange contact cards with someone:

- You explicitly choose which fields they can see
- You can change visibility settings at any time
- Changes sync automatically to their device

### With Third Parties

We do not sell your data. Contact-card contents remain end-to-end
encrypted and are shared with the contacts you choose. The separate
website and waitlist section describes hosting, mail delivery and backup
infrastructure involved in operating those services.

### With Law Enforcement

For stored contact-card exchanges, the relay holds:

- Application-relay connection metadata: a cryptographic identity hash
  and connection timestamps
- Encrypted envelopes (which we cannot decrypt)

The application relay cannot decrypt contact-card contents. This does
not mean the operator cannot access a waitlist email address or observe
connection metadata at an OHTTP hop; those separate limits are described
in the website and Oblivious HTTP sections.

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
  application relay sees the OHTTP hop's IP address.
  The OHTTP hop sees your IP; the both-hop correlation
  limitation above still applies.

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

- **Identity Deletion:** Use Settings > Privacy >
  Delete Identity. If you trust contacts for
  recovery, you choose first:
  - **Keep recovery:** the relay keeps your encrypted
    list of trusted contacts for up to 365 days, so
    they can still help you recover.
  - **Erase everything:** the list goes too, and
    recovery is no longer possible.

  A 7-day grace period lets you cancel. After it,
  the app sends a revocation signal to all your
  contacts (authenticated with your cryptographic
  identity), asks the relay to erase what it holds
  for your identity — including any recovery proof
  you uploaded and, if you chose to erase
  everything, your list of trusted contacts — and
  permanently deletes all local data (database,
  keys, and secure storage entries). Your contacts'
  apps automatically delete your card when the
  revocation arrives. Updates still waiting for
  delivery expire on the relay within 120 days.
- **Single Contact Removal:** You can remove any
  contact, which deletes their data from your
  device
- **Linked devices:** Delete your identity on each
  linked device; a deletion started on one device
  does not yet reach the others.

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
- **Encrypted backup:** a backup file you made,
  sealed with your password, restores your
  identity and data on a new device.
- **Social recovery (all devices lost, no
  backup):** guardians you designated each keep a
  piece of an encrypted backup of your data. Met in
  person, a guardian from each of your groups hands
  their piece back to your new device, which
  restores your identity from it. The pieces pass
  directly between the two phones; nothing goes to
  a server. In the version shipped today, recovery
  instead creates a new identity, and contacts are
  not moved to it automatically.

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

- Email: [security@vauchi.app](mailto:security@vauchi.app)
- GitLab: [gitlab.com/vauchi](https://gitlab.com/vauchi)

---

## Summary

| Question | Answer |
|----------|--------|
| Store my contacts on servers? | Cards are encrypted in device storage; relays hold end-to-end encrypted updates |
| Can you read my card updates? | No, end-to-end encrypted |
| Can you see who I talk to? | Tokens rotate daily; an operator running both hops can still correlate metadata |
| Who can see my IP address? | The OHTTP hop sees it; the application relay sees that hop's IP. Website requests are separate |
| Can you read my waitlist email? | Yes; the optional waitlist is separate from contact-card encryption |
| Do you sell my data? | No, never |
| Do you use tracking/analytics? | No |
| Can I delete my data? | App: Settings > Privacy > Delete Identity (7-day grace). Waitlist: use the removal link |
| What's in an app backup? | Your identity, contacts, card, labels — encrypted with your password |
| Who controls backups? | You control app backups; operator backups can retain waitlist copies |
| What if I lose my device? | Linked device or social recovery |
