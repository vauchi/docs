<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- description: The one page that lists what Vauchi does not do yet: planned features without dates, what part of each already ships, and the tracker issue behind each one. -->

# Roadmap

This is the one page that names what Vauchi does **not** do yet. Every
other page describes what the app does today; when one of them mentions a
limit, it links here.

There are no dates on purpose: a feature is listed while it is planned and
leaves this page in the change that ships it. "Shipped so far" says what
part of a feature you can already use. The tracker numbers point to the
maintainers' issues.

| Feature | Shipped so far | Tracked in |
|---------|----------------|------------|
| Contacts move to your recovered identity automatically after social recovery | Guardians hold your encrypted backup and hand it back in person; your contacts do not move to the recovered identity yet | vauchi/private#796 |
| Post-quantum key agreement (hybrid X25519 + ML-KEM-768) | Classical X25519 key agreement | vauchi/private#109 |
| Forward secrecy for sync between your own devices | Contact updates have forward secrecy; own-device sync does not | vauchi/private#1090 |
| Per-device authority and key isolation | Every linked device receives the master seed and can act as the whole identity; removing a device does not take away that seed | vauchi/private#1098 |
| An independent operator for the OHTTP hop | The hop runs on a separate host, run by the same operator as the relay | vauchi/private#605 |
| Reaching messages a relay has offloaded to a peer relay | Relays can offload old messages; the app cannot yet fetch them back | vauchi/private#835 |
| Mesh exchange (several people at once over Bluetooth or Wi-Fi) | One-to-one exchange over QR, NFC, Bluetooth or a link | vauchi/private#55 |
| Screen-reader walkthrough of every journey on every app | Accessibility labels come with every screen; the walkthrough on each app is not done | vauchi/private#968 |
| Right-to-left languages and more locales | English, German, French, Italian and Spanish | vauchi/private#36 |
| Plural rules for every language | Plural forms are not applied per language yet | vauchi/private#341 |
| A physical proximity check (NFC or ultrasonic) when linking a device | Linking checks a confirmation code you compare on both screens | vauchi/private#1240 |
| Assigning an existing contact to a label from the contact's page | Labels are chosen at the end of an exchange | vauchi/private#1241 |
| Contacts vouching for a card field, and marking your own fields as self-attested | Nothing yet | vauchi/private#1242 |
| A panic button widget on the home screen | Nothing yet | vauchi/private#1243 |
| Hiding who writes to whom from the relays: [mailbox cohorts](#mailbox-cohorts-design-under-review) | The relay sees daily-rotating mailbox tokens, padded sizes and timing, behind an OHTTP hop | vauchi/private#1281 |

## Mailbox cohorts (design under review)

This design is not in the app. It exists as a written design, as
research models, and as first parts of its code, in the app's core and
on the relay, that nothing uses yet. AI models from three providers
attacked fifteen versions of the code that handles notices (the part
below that delivers keys). Their reviews kept finding faults until the
version in core commit 3af62982a (on main as adfb1f7d8, the same notice
code), in which none of the three found what
they looked for: a way for a relay alone to raise a false alarm, stop
updates for good or link records, or for a later copy of a phone to
read more than the design says. That shows what those reviews looked
for and did not find, not that the design is secure. A test sends one
phone's records through a real relay and back and the card arrives, but
the app does not use any of this, and parts of the design have no code
yet. A human cryptographer reviews it before any release. The numbers
below are the design's today and may change.

**What it fixes.** Today the relay cannot read your updates, but it sees
which mailbox tokens (the daily-changing addresses your updates are
delivered to) receive how much, and when (see the
[threat model](developers/threat-model.md#relay-metadata-exposure-analysis)).
Over time that can hint at who is in touch with whom.

**How it works.**

- Phones are grouped into **cohorts**. Every member downloads the
  cohort's whole daily batch, so the download does not show the relay
  which records were meant for whom.
- Every phone writes the same number of same-sized records on a fixed
  schedule, real or dummy, in random order. The relay sees that you
  wrote, but the records themselves do not show whether any was real, or
  for whom.
- A card update is encrypted once per visibility group. Each contact
  device gets its key in a tiny **notice**, sealed with a key used once
  and then deleted, so keys stolen today open no notice the phone has
  already read.
- Every week each contact device sends a fresh key. The sender answers
  it and sends its current card again, so on a phone with a few
  contacts a lost notice or a lost part of a card is replaced within
  about a week, and someone who quietly copied a phone and only reads
  loses access within about three to four weeks of normal use. A phone
  that only syncs in the background has room in each session for this
  for about five contacts, so with many contacts and the app never
  opened, both take longer: several weeks with a few dozen contacts.

**What it costs and what it does not do.**

- **Data.** Downloading the whole batch costs each phone from about one
  to several tens of megabytes a day, depending on the cohort's size and
  how long the app stays open.
- **Delay.** The target for an open app is an update within about five
  minutes. A phone that only syncs in the background catches up at its
  next background session; with strict battery limits that can take a
  few days.
- **Being online still shows.** The relay sees when each app is active,
  and which cohort each phone is in is public. Phones are placed in
  cohorts at random, not by whom they know, so that says nothing about
  your connections; but a recipient is hidden only among its cohort, and
  a small cohort is a small crowd, so the first pilot makes no anonymity
  claim.
- **A copied phone that keeps writing may go unnoticed.** Someone who
  copies a phone's whole state and then keeps sending records of their
  own can keep reading new updates to or from that phone, and the app
  may never notice. The app raises an alarm when it sees certain signs
  of this, but there is no promise that it always does, or that the
  reading ever stops on its own. Re-verifying the contact in person
  ends it. Copying needs the phone's unlocked storage.
- **Old keys are deleted only while the app runs.** A phone that stays
  switched off keeps, until the app next runs, keys the design would
  otherwise have deleted. A copy of its storage taken then can read
  updates from the few weeks before it was switched off that the design
  would no longer let it read.
- **Alarms ask you to meet.** An alarm warns you and asks you to
  re-verify the contact in person; updates keep flowing meanwhile. The
  design aims to raise no alarm for phones that connect every three
  days, are away for up to two weeks, or have clocks up to three days
  off. The models and tests run so far raised none in those cases,
  which shows the cases they tried, not every case.
- **Card photos are not covered yet.** A card of up to about 3.9 KB travels
  this way; how a photo does is not designed yet.
- **Many edits at once take a slower path.** The fixed schedule leaves
  little room: a phone that connects only every three days carries just
  a few card edits every two weeks this way, more if it connects daily;
  the exact numbers are still being measured. Beyond that, the app sends
  your whole card again instead. Nothing is lost, but it costs more
  data.
