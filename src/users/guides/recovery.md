<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# How to Recover Your Account

Step-by-step guide for restoring access to your Vauchi identity.

Self-custody is a marvellous thing right up until the afternoon you're locked out. Vauchi holds nothing on your behalf — there's no "forgot password" email, because there's no one on the other end who could honour it. So recovery isn't a single button; it's whichever of these you prepared for in advance. Pick the highest row in the table you can satisfy: each one gets you back as **the same identity**, with your contacts where they were.

---

## Choose Your Recovery Method

| Situation | Method | Time Required |
|-----------|--------|---------------|
| Have another linked device | [Device Link](#device-link) | 5 minutes |
| Have backup file + password | [Backup Restore](#backup-restore) | 5 minutes |
| Lost everything | [Social Recovery](#social-recovery) — the last resort | Hours to days |

Getting back in is one problem. A phone that was **stolen while unlocked**
is a second one, whichever way you got back in: see
[If a device was stolen unlocked](#if-a-device-was-stolen-unlocked).

---

## Backup Restore

If you have your encrypted backup and its password:

### Step 1: Start Fresh

1. Install Vauchi on your new device
2. On the welcome screen, tap **Restore from Backup**

### Step 2: Enter Backup

1. Paste your backup code (the long string of characters)
2. Tap **Next**

### Step 3: Enter Password

1. Enter your backup password
2. Tap **Restore**

### Step 4: Wait for Sync

1. Vauchi restores your identity, contacts, your own card, and your labels straight from the backup
2. Per-contact forward-secrecy state isn't in the file; it quietly re-establishes itself on the next sync with each contact
3. Within minutes, you should see your contacts

```admonish success
You're back! Your identity is fully restored.
```

```admonish info
The backup is sealed with your password and nothing else. Vauchi stretches that password with Argon2id (deliberately slow, to make guessing expensive) and then encrypts everything with XChaCha20-Poly1305. The flip side of that strength: a forgotten password is unrecoverable, by design. No key escrow means no back door — for you or anyone else.
```

---

## Device Link

If you have another device still logged in:

### Step 1: On Your Working Device

1. Open Vauchi
2. Go to **Settings > Devices**
3. Tap **Link New Device**
4. A QR code appears

### Step 2: On Your New Device

1. Install Vauchi
2. Tap **Join Existing Identity**
3. Scan the QR code

### Step 3: Revoke Lost Device (Optional)

If your old device was lost or stolen:

1. On your working device, go to **Settings > Devices**
2. Find the lost device
3. Tap **Revoke**

Revoking stops the lost device syncing with your other devices. It doesn't
wipe it: if it was stolen while unlocked, read
[If a device was stolen unlocked](#if-a-device-was-stolen-unlocked).

```admonish success
You're back! Your new device is now synced.
```

---

## Social Recovery

If you've lost all devices and don't have a backup — the last resort.

```admonish info title="Planned"
The flow below is how social recovery is being changed to work; it isn't
in the app yet. Today's version still has your new phone make a new
identity, and your contacts don't move to it automatically: you'd meet
them again and exchange as a new contact.
```

### Overview

Long before passwords, identity was vouched for by people who knew you — and that older system never forgot a face. Social recovery makes it cryptographic. When you set it up, you choose **guardians**: people you trust and see often. Each one quietly holds a piece of your encrypted backup; they don't learn that they do until you need them. One guardian from each of your groups together can hand the backup back; none of them can open it alone.

Social recovery brings back **the same identity**: your keys, contacts and
labels come back, on your new phone as a new device of yours.

### Step 1: Start Recovery on the New Phone

1. Install Vauchi on a new device
2. Choose **Recover my identity** instead of creating one
3. Enter your old public ID (if you know it)
   - If you don't know it, ask a contact — they can find it in your contact details
4. The phone shows a recovery request

### Step 2: Meet Your Guardians

For each guardian, in person:

1. **Meet in person** (physical presence required)
2. They open the recovery request you show them
3. They check it's really you — their app tells them now that they hold a piece of your backup
4. They hand their piece back, phone to phone, right there

Repeat until you have one guardian from each of your groups.

```admonish tip
Guardians are people who'll recognize you immediately. Nobody else can hand
the pieces back, and nothing travels through the internet while they do.
```

### Step 3: Restore

1. With enough pieces, your phone opens the backup
2. You're back as yourself, with your contacts and labels
3. Conversations with each contact restart on their own

```admonish success
You're back! Same identity, new device.
```

---

## If a Device Was Stolen Unlocked

Getting back in doesn't undo a theft. Your devices share your identity's
keys, so a phone stolen while unlocked still holds them — and revoking it
only stops it syncing with your other devices. With those keys, the thief
can read what your contacts send you and pose as you to them.

```admonish info title="Planned"
Moving your contacts to a new identity the thief doesn't hold is being
built. You'll set up, in advance, a few people who approve such a move,
and a next identity registered with them; after a theft your contacts
move to it, online with those people's approval, or when you meet a
contact in person. Until that ships, tell the contacts who matter in
person, and meet them to exchange again.
```

---

## Helping Someone Else Recover

If someone you're a guardian for asks you to help:

### Step 1: Verify Their Identity

- **Meet in person** — the hand-back only happens face to face
- Confirm they are who they claim to be
- Be suspicious of unusual requests

```admonish warning
Only hand back if you're certain. Handing back is you putting your name on "yes, this is really them" — and it gives them the piece you hold.
```

### Step 2: Hand Back

1. Open the recovery request they show you
2. Check the name it shows is theirs
3. Tap **Hand back**; your phone passes your piece to theirs directly

---

## Troubleshooting

### Backup Restore: "Invalid Password"

- Check for typos
- Passwords are case-sensitive
- Try any variations you might have used

If you truly can't remember the password, there's no recovering the backup — that's the design, not a bug. Fall back to social recovery.

### Backup Restore: "Invalid Backup Code"

- Make sure you copied the entire code
- Check for extra spaces or line breaks
- Try copying again from the original source

### Social Recovery: "Not Enough Pieces"

- You need one guardian from each of your groups
- Meet another guardian from the group still missing

### Social Recovery: "Request Expired"

- A recovery request lasts 8 days (192 hours); start a fresh one and
  show it to the guardians you haven't met yet

### Can't Remember Old Public ID

- Ask any contact who had your old card
- They can find your ID in your contact details
- Look through old screenshots or notes

---

## Prevention Tips

A backup you make today is a favour to a future, locked-out version of yourself. The cheapest recovery is the one you never need.

1. **Create a backup** as soon as you set up
2. **Store backup securely** (password manager, safe)
3. **Link multiple devices** (phone + tablet/desktop)
4. **Remember your password** (use a passphrase — long beats cryptic)
5. **Choose guardians** you trust and see often, spread across groups
6. **Keep your guardians to yourself** — if nobody knows who holds a
   piece of your backup, nobody can target or impersonate them

---

## Security Notes

- Social recovery requires in-person verification — presence is the proof
- Needing a guardian from every group prevents any single person from opening your backup
- A recovery request ages out after 8 days
- A backup is yours alone: Argon2id + XChaCha20-Poly1305, no escrow, no back door
- The relay only ever forwards encrypted blobs, routed by daily-rotating mailbox tokens — it never sees your identity, your IP, or your data

For more on security, see [Backup & Recovery Feature](../features/backup-recovery.md).
