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

This design is not in the app. It exists as a written design and as
research models. Reviews by AI models from two providers have asked for
changes on every version so far, and the current one is under review
again; a human cryptographer's review comes before any release. The
numbers below are the design's today and may change.

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
- Each contact device sends back short receipts, so lost notices are
  sent again. Every week it also sends a fresh key, so someone who
  quietly copied a phone loses access once that key takes effect.

**What it costs and what it does not do.**

- **Data.** Downloading the whole batch costs each phone from about one
  to several tens of megabytes a day, depending on the cohort's size and
  how long the app stays open.
- **Delay.** The target for an open app is an update within about five
  minutes. A phone that only syncs in the background catches up at its
  next background session; with strict battery limits that can take a
  few days.
- **Being online still shows.** The relay sees when each app is active,
  and cohort membership is public. A recipient is hidden only among its
  cohort, and a small cohort is a small crowd, so the first pilot makes
  no anonymity claim.
- **A copied phone is detected, not prevented.** Someone who copies a
  phone's whole state and keeps interfering can read new updates until
  the app notices: up
  to about 25 days if they copied the sender's phone, about 51 if they
  copied the recipient's. In the second case, if the relay also helps
  them, only the recipient's phone raises the alarm, and the reading
  stops when you act on it.
- **Alarms ask you to meet.** Signs of a stolen state pause updates to
  that contact, and the strongest ones ask you to re-verify the contact
  in person. The design aims to raise no alarm for phones that connect
  every three days, are away for up to two weeks, or have clocks up to
  three days off, and the research models show it does. Outside that, an
  alarm is possible, and an alarm that clears when a contact
  comes back hints that they had been offline.
- **Many edits at once take a slower path.** The fixed schedule leaves
  little room: a phone that connects only every three days carries just
  a few card edits every two weeks this way, more if it connects daily;
  the exact numbers are still being measured. Beyond that, the app sends
  your whole card again instead. Nothing is lost, but it costs more
  data.
