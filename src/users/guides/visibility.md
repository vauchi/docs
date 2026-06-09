<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# How to Manage Visibility

Step-by-step guide for controlling what each contact can see.

---

## Overview

A paper business card has exactly one privacy setting: whoever holds it sees all of it. Vauchi splits that decision down to the field. Every field on your card is, for every contact, one of three things: visible to everyone, visible to a chosen few, or hidden from all. Show your work email to colleagues, your personal phone to friends, hide your home address from everyone else — and change your mind later without reprinting anything.

The rule that matters: **visibility is per field, per contact.** Everything else in this guide is shortcuts on top of that.

---

## Change What One Contact Sees

### Step 1: Open Contact

1. Go to **Contacts**
2. Tap on the contact you want to modify

### Step 2: Find Visibility Settings

1. Scroll down to **"What They Can See"**
2. You'll see a list of all your fields

### Step 3: Toggle Fields

- **Enabled (green):** They can see this field
- **Disabled (gray):** They cannot see this field

Tap any field to toggle it.

### Step 4: Confirm

Your choice is saved at once, but the contact's copy isn't updated until they next sync or open the app. Visibility is a change to the card you publish, not a live feed into their phone — so "immediately" means immediately for you, and "soon" for them.

---

## Show/Hide a Field for Everyone

### Step 1: Go to Your Card

1. Go to **Home**
2. Find the field you want to change

### Step 2: Open Visibility Menu

1. Tap the **visibility icon** (eye) next to the field
2. A menu appears

### Step 3: Choose Option

- **Show to all:** Makes the field visible to all contacts
- **Hide from all:** Hides the field from all contacts
- **Customize:** Opens per-contact toggles

---

## Using Labels

Setting visibility one contact at a time is honest but tedious, like addressing wedding invitations by hand. Labels — Work, Family, Friends — let you decide once for a category. But they aren't a separate permission system bolted on the side: a label is just a faster way to write the same per-contact rules. Under the hood, "show this to Family" expands to "show this to Alice, Bob, and Mum." Move someone out of Family and their access updates with them; the rule was always about the people, never the badge.

### Creating a Label

1. Go to **Settings > Labels**
2. Tap **Add Label**
3. Enter a name (e.g., "Work", "Family", "Friends")
4. Tap **Create**

### Assigning Contacts to Labels

1. Open a contact
2. Scroll to **Labels**
3. Tap to assign/unassign labels

### Setting Visibility by Label

1. Go to **Home**
2. Tap the visibility icon next to a field
3. Tap **Customize**
4. Switch to the **Labels** tab
5. Toggle labels on/off

Example: Enable "Family" and "Friends", disable "Work" for your personal phone.

---

## Common Configurations

### Business Card Mode

Share only professional information:

| Field | Visibility |
|-------|------------|
| Work Email | All |
| Work Phone | All |
| Personal Email | None |
| Personal Phone | None |
| Home Address | None |

### Close Friends

Share everything with trusted contacts:

1. Create a "Close Friends" label
2. Assign trusted contacts
3. Show all fields to "Close Friends"
4. Restrict fields for everyone else

### Temporary Sharing

Share a field temporarily:

1. Show the field to a specific contact
2. Complete whatever you needed
3. Hide the field again

Hiding takes effect on their side the next time they sync — quick, but not instant, so don't treat "hide" as a remote wipe of something they may already have copied down.

---

## Checking What Someone Sees

### Step 1: Open Contact

1. Go to **Contacts**
2. Tap on the contact

### Step 2: Review Visible Fields

Look at **"What They Can See"**:

- Enabled fields = they see these
- Disabled fields = they don't see these

### Summary View

At the bottom of the contact, you'll see:
> "Alice can see 3 of your 7 fields"

---

## Default Visibility

### For New Fields

When you add a new field, it's **visible to everyone** by default.

To change this:

1. Add the field
2. Immediately tap the visibility icon
3. Adjust as needed

### For New Contacts

When you exchange with someone new, they see all fields that are currently visible to "everyone".

---

## Troubleshooting

### Contact Still Sees Hidden Field

1. Changes sync when they open the app
2. Ask them to refresh their contacts
3. Wait a few minutes for sync

### Can't Find Visibility Options

1. Make sure you're on the contact's detail page
2. Scroll down — visibility is below their card info
3. If missing, update the app

### Label Changes Not Applying

1. Make sure contacts are assigned to the label
2. Check the label visibility settings
3. Try removing and re-adding the label

---

## Tips

### Be Intentional

- Review visibility when adding new fields
- Periodically audit what each contact sees
- Use labels to stay organized

### Think in Categories

Group contacts by relationship type:

- **Work:** Professional info only
- **Family:** Everything
- **Acquaintances:** Name and email only

### Start Restrictive

It's easier to show more later than to hide after sharing.

---

## Privacy Notes

- Hidden fields simply vanish from their view — and a hidden field looks exactly like one you never had. The contact can't tell "she's hiding her address" from "she never listed an address." Absence carries no information.
- No notification fires when you hide a field. The polite cough doesn't happen; the field is just gone next time they look.
- Contacts only ever see your current card — never its history. There's no changelog of what you showed and then withdrew.
- They can't see your visibility settings, only their own resulting view.
- Hiding is per field, per contact — it withdraws access, it doesn't delete the field from your card.

For more on privacy, see [Privacy Controls](../features/privacy-controls.md).
