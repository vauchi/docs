<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Frequently Asked Questions

The questions people actually ask, answered without the hand-waving.

---

## Privacy & Security

### Is my data encrypted?

Yes — in every state it can be in:

- **At rest:** everything on your device is encrypted with
  XChaCha20-Poly1305. The key is held in your platform's secure store
  (iOS Keychain / Android KeyStore), not lying around on disk.
- **In transit:** end-to-end encrypted (X25519 key agreement +
  XChaCha20-Poly1305), so the journey is sealed from end to end.
- **In backups:** protected by Argon2id (a deliberately slow,
  memory-hungry key stretch) plus XChaCha20-Poly1305.

The short version: the only place your data is ever readable is on the
screens of the people you chose to share it with.

### Can the relay server read my contacts?

No. The relay only ever handles sealed, encrypted blobs. It cannot
decrypt content, cannot see your contact list, cannot read a single
field, and cannot tie your identity to your data. It is, by design, a
courier that has never once been given a key.

### What does the relay actually store?

Almost the least it possibly could:

- Encrypted envelopes (deleted on delivery, or after 120 days)
- A little connection metadata for rate-limiting (a cryptographic
  identity hash — *not* your IP — discarded after 30 minutes idle)

And it never even learns your IP address: requests reach it through an
independent **Oblivious HTTP** gateway, run by a different party. The
gateway sees where you are but not what you're asking; the relay sees
what you're asking but not where you are. No one holds both halves.

### Is Vauchi *truly* private?

Here's the honest distinction. Most apps ask you to *trust* that they
won't peek. Vauchi tries to make peeking structurally impossible, so
trust isn't required:

- Your data lives on your device, not our servers
- End-to-end encryption means we couldn't read it if we wanted to —
  and we don't want the liability of being able to
- No analytics, no trackers, no ad identifiers, no accounts
- It's open source, so you don't have to take any of this on faith —
  you can check

The best privacy policy is the one you can't break even under
subpoena. That's the one we aimed for.

---

## Identity & Account

### What happens if I lose my device?

You have several ways back in, in rough order of painlessness:

1. **Another linked device** — if you have one, you've already lost
   nothing. Carry on.
2. **A backup** — restore from your encrypted backup file.
3. **Social recovery** — trusted contacts vouch that you are you.
4. **Start fresh** — mint a new identity and re-exchange. Always
   available, never necessary if you planned ahead.

The lesson hidden in that list: the five minutes you spend making a
backup *today* is what turns a lost phone from a tragedy into an errand.

### How does social recovery work?

It borrows the oldest security system humans have: people who know you.

1. On a new device, you create a "recovery claim"
2. You share it with contacts you previously marked as trusted
3. Each one issues a "voucher" confirming they recognise you
4. Once enough vouchers arrive (a handful by default), your contacts
   migrate to your new identity

It guards both doors at once: you can't be locked out (your friends can
let you in), and you can't be impersonated (a stranger would have to
fool several of your friends at the same time). Note that social
recovery mints a *new* cryptographic identity — your old signing keys
stay lost, and a few settings like per-contact visibility may need
re-tuning. You keep your people; you replace the lock.

### Can I change my display name?

Yes — Settings, edit, done. The change rolls out to your other devices
and to your contacts automatically.

### Do I need an account?

No. There is nothing to sign up for, no email to confirm, no password
to forget on our end. Your identity is created on your device and stays
there. Refreshingly little, isn't it.

---

## Contacts & Exchange

### How do I exchange contacts?

The everyday way:

1. Meet the person — actually, in person
2. Open the **Exchange** screen
3. Show them your QR code
4. Scan theirs
5. You're connected, encrypted, and you'll both stay up to date

### Why meet in person?

Because proximity is a security feature you already understand. When
you're standing in front of someone, three things become true at once:
you know they are who they appear to be, no one in the middle can slip
between you, and the trust is anchored in the real world rather than in
a username someone could have faked. It's the same instinct that makes
a handshake mean more than a friend request.

### Can I exchange contacts remotely?

Yes — there's a **Link mode** for when you can't be in the same room.
You share a one-off `vauchi://exchange?…` link (by message, email,
however you like) and the other person opens it; the exchange completes
through the relay, asynchronously, within a few days.

The in-person methods are still the default, and for good reason — they
give the strongest guarantee against a man-in-the-middle, because
physical presence is the one thing an attacker on the network can't
forge. Link mode trades a little of that assurance for reach. Use it
knowingly, the way you'd post a key versus handing it over.

### Can I remove a contact?

Yes:

1. Go to **Contacts**
2. Select the person
3. Tap **Delete / Remove** and confirm

That deletes them from your device and cuts off future updates. What
they already saw, they keep — you can close the tap, but you can't
un-pour the water. Which is simply how sharing works, here as anywhere.

---

## Multi-Device

### Can I use Vauchi on multiple devices?

Yes:

1. Set up Vauchi on your first device
2. Go to **Settings > Devices** and generate a device link
3. Follow the linking steps on the second device
4. Both now share one identity and stay in sync

### How many devices can I link?

Up to **10** per identity — comfortably more than most people own, and
few enough to keep the trust circle small.

### How do I move to a new phone?

Either method works:

**Link it (recommended).** On the old phone, **Settings > Devices >**
generate a link; on the new phone, install Vauchi and join. Once synced,
retire the old phone.

**Restore from backup.** On the old phone, create an encrypted backup;
on the new phone, install and restore. Handy when the old phone is
already gone.

---

## Backup & Restore

### How do backups work?

1. You pick a password
2. Vauchi encrypts a complete copy of your account under it
3. You get a backup file to keep wherever you like
4. To restore: backup file + password = you, again

The password never leaves your head, and the file never leaves your
control. That's the whole trick.

### What's in a backup?

A full backup carries your whole account:

- Your **identity** (the master seed all your keys grow from)
- Your **contacts**
- Your **own card**
- Your **labels and groups**

The one thing it deliberately *omits* is the per-conversation
forward-secrecy state (the Double Ratchet keys) for each contact. Those
are meant to be short-lived — that's what gives you forward secrecy —
so they simply re-establish themselves the next time you and a contact
sync. You get your people back; you don't drag along yesterday's
disposable keys.

### I forgot my backup password. Can you recover it?

No — and you should be glad. The backup is encrypted so that *only* the
password unlocks it. If we could recover it for you, so could anyone who
compromised us, and the whole guarantee would be theatre. The price of a
lock no one else can pick is that you have to keep the key. Choose a
passphrase you'll remember; write it somewhere safe if you must.

---

## Visibility & Sharing

### How do I control what each contact sees?

1. Open a contact's detail page
2. Find **What They Can See**
3. Toggle individual fields on or off

### Do contacts know when I hide a field?

No notification fires. The field simply stops appearing on your card,
indistinguishable from your having removed it. Privacy that announces
itself isn't privacy.

### Can I share different details with different people?

Yes — this is the whole point, not a side feature:

- **Work contacts:** work email, no personal mobile
- **Family:** everything
- **People you just met:** the basics, until they earn more

One card, many faces — the same way you already behave in real life,
just finally possible in software.

---

## Technical

### What's the relay server for?

Think of it as a post office for sealed envelopes — one that rewrites
the address label every night so it can't keep a diary of who writes to
whom. It:

- Routes encrypted messages between your devices and contacts
- Holds messages briefly when a device is offline, then forwards them
- Addresses everything by daily-rotating tokens, so it never learns the
  social graph
- Cannot read a word of any of it

### Does Vauchi work offline?

Partly, and sensibly so:

- View all your data offline — yes
- Edit your card offline — yes; changes sync when you reconnect
- Exchange a *new* contact — needs the relevant hardware (camera, etc.)
  and, for remote Link exchanges, a network

### What cryptography does Vauchi use?

- **Signing:** Ed25519
- **Key agreement:** X25519 (Curve25519)
- **Symmetric encryption:** XChaCha20-Poly1305
- **Key derivation:** HKDF-SHA256 internally; Argon2id for passwords
- **Forward secrecy:** the Double Ratchet protocol

All of it is built on well-known, audited Rust libraries implementing
IETF-standardised algorithms — nothing home-rolled where a reviewed
standard exists. For the full reference, see the
[Cryptography](../developers/crypto.md) page.

### Is Vauchi open source?

Yes — every line:
[gitlab.com/vauchi](https://gitlab.com/vauchi). You can read how your
data is handled, check the security claims yourself, contribute, or run
your own relay. "Trust us" is a weaker promise than "go and look."

---

## Troubleshooting

### My contacts don't see my updates

1. Check your internet connection
2. Confirm sync is current (**Settings >** last-sync time)
3. Make sure the field is actually visible to that contact
4. Ask them to refresh manually

### The QR scanner won't read the code

1. Check camera permissions
2. Add light
3. Wipe the lens
4. Adjust your distance to the code
5. Restart the app

### Sync seems stuck

1. Check connectivity
2. Trigger a manual sync (pull to refresh, or **Settings > Sync**)
3. Confirm the relay is reachable
4. Restart the app

---

## Still have questions?

- **GitLab issues:**
  [gitlab.com/vauchi/vauchi/-/issues](https://gitlab.com/vauchi/vauchi/-/issues)
- **Email:** support@vauchi.app
