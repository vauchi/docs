<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Privacy Controls

You already do this. You give your mobile number to friends and a work
email to colleagues; you'd mention your home address to a dinner guest
but not to someone you met once at a conference. The same fact carries
different value, and different risk, depending on who's asking. We manage
this effortlessly in person and then, online, throw it all away — one
profile, identical for everyone, take it or leave it.

Vauchi's privacy controls simply let the software catch up to the social
intelligence you've had all along. One card, but each person sees the
version that fits them.

---

## How it works

Every field can be shown to or hidden from each contact, individually.
That's the whole model — granular, and entirely yours.

```text
Your Contact Card
┌────────────────────────────────────────────┐
│  Name: Alice Smith                         │
│                                            │
│  ┌─────────────────┬─────────┬─────────┐   │
│  │ Field           │ Family  │ Work    │   │
│  ├─────────────────┼─────────┼─────────┤   │
│  │ Personal Email  │   ✓     │   ✗     │   │
│  │ Work Email      │   ✓     │   ✓     │   │
│  │ Personal Phone  │   ✓     │   ✗     │   │
│  │ Work Phone      │   ✓     │   ✓     │   │
│  │ Home Address    │   ✓     │   ✗     │   │
│  └─────────────────┴─────────┴─────────┘   │
│                                            │
│  Family sees 5 fields, Work sees 2 fields  │
└────────────────────────────────────────────┘
```

## Per-contact visibility

To change what a particular person sees:

1. Go to **Contacts**
2. Select the contact
3. Find **What They Can See**
4. Toggle fields on or off

Each field is simply **Visible** or **Hidden** for that contact. New
fields start visible to everyone — a sensible default you can tighten the
moment you add them, or any time after.

## Labels — visibility without the tedium

Setting every field for every contact by hand would be exhausting, and
exhaustion is the enemy of privacy: controls people don't use protect
no one. Labels fix that by letting you decide once for a whole category
of people.

1. Create labels like **Family**, **Work**, **Friends**
2. Assign contacts to them
3. Set what each label sees
4. Someone in two labels sees the union of both

Labels are your private organising tool — a shortcut that resolves to
ordinary per-contact rules underneath. A worked example:

| Label | What they see |
|-------|---------------|
| Family | Everything |
| Work | Work email, work phone |
| Friends | Personal email, personal phone |
| Acquaintances | Just your name |

## Changing many at once

From the home screen, tap the **visibility** control beside any field:

- **Show to all** — visible to every contact
- **Hide from all** — hidden from everyone
- **Customise** — pick contacts one by one

## The quiet details that matter

- **No real-time peeking** — changes reach a contact when they next open
  the app, not the instant you make them
- **No notifications** — nobody is told when you hide something
- **It looks like removal** — a hidden field is indistinguishable from a
  deleted one, which is the point
- **No history** — contacts only ever see your card as it is now, never
  as it was

## A few worked scenarios

**Keep business and personal apart.** A "Business" label for
professional contacts: show work email, work phone, LinkedIn; hide
personal phone and home address. Your two lives stay two.

**An inner circle.** A "Close Friends" label that sees everything, while
everyone else sees a deliberately thinner card. Intimacy, by design.

**Lend a detail, then take it back.** Reveal a field to one person,
finish whatever you needed it for, then hide it again — their access
ends immediately. Sharing needn't be permanent to be useful.

## Related

- [How to Manage Visibility](../guides/visibility.md) — step by step
- [Contact Exchange](contact-exchange.md) — how contacts are added
- [Encryption](encryption.md) — how visibility is enforced, not just
  promised
