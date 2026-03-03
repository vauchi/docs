<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Privacy Controls

Control exactly what each contact can see on your card.

---

## How It Works

Every field on your contact card can be shown to or hidden from each contact. This gives you fine-grained control over your personal information.

```
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

## Per-Contact Visibility

You control what each individual contact can see.

### To Change What Someone Sees

1. Go to **Contacts**
2. Select a contact
3. Scroll to "What They Can See"
4. Toggle fields on/off

### Visibility Options

For each field, you can set:

- **Visible** — The contact can see this field
- **Hidden** — The contact cannot see this field

### Default Visibility

New fields are visible to everyone by default. You can change this immediately after adding or later.

## Labels

Labels help you manage visibility for groups of contacts instead of individuals.

### How Labels Work

1. Create labels like "Family", "Work", "Friends"
2. Assign contacts to labels
3. Control visibility per label
4. Contacts in multiple labels see the union of visible fields

### Example Labels

| Label | What They See |
|-------|---------------|
| Family | Everything |
| Work | Work email, work phone |
| Friends | Personal email, personal phone |
| Acquaintances | Just name |

## Bulk Changes

On the home screen, tap the **visibility** button next to any field to:

- **Show to all** — Make visible to all contacts
- **Hide from all** — Hide from all contacts
- **Customize** — Toggle individual contacts

## Privacy Notes

- **They don't see changes in real-time** — Updates sync when they open the app
- **No notifications** — Contacts aren't notified when you hide fields
- **Looks like removal** — Hidden fields appear as if you removed them
- **History isn't shared** — They only see your current card, not past versions

## Common Scenarios

### Sharing Business Info

1. Create a "Business" label
2. Assign professional contacts
3. Show: Work email, work phone, LinkedIn
4. Hide: Personal phone, home address

### Close Friends Only

1. Create a "Close Friends" label
2. Assign trusted contacts
3. Show: Everything including personal details
4. Everyone else sees less

### Temporary Sharing

1. Share field with a contact
2. Complete your task
3. Hide the field again
4. They lose access immediately

## Related

- [How to Manage Visibility](../guides/visibility.md) — Step-by-step guide
- [Contact Exchange](contact-exchange.md) — How contacts are added
- [Encryption](encryption.md) — How visibility is enforced cryptographically
