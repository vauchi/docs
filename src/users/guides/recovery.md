<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# How to Recover Your Account

Step-by-step guide for restoring access to your Vauchi identity.

Self-custody is a marvellous thing right up until the afternoon you're locked out. Vauchi holds nothing on your behalf — there's no "forgot password" email, because there's no one on the other end who could honour it. So recovery isn't a single button; it's whichever of these you prepared for in advance. Pick the highest row in the table you can satisfy.

---

## Choose Your Recovery Method

| Situation | Method | Time Required |
|-----------|--------|---------------|
| Have backup file + password | [Backup Restore](#backup-restore) | 5 minutes |
| Have another linked device | [Device Link](#device-link) | 5 minutes |
| Lost everything | [Social Recovery](#social-recovery) | Hours to days |

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

```admonish success
You're back! Your new device is now synced.
```

---

## Social Recovery

If you've lost all devices and don't have a backup:

### Overview

Long before passwords, identity was vouched for by people who knew you — and that older system never forgot a face. Social recovery makes it cryptographic. A handful of contacts who once exchanged with your **old** identity, in person, confirm that you are still you.

Two things to understand before you start:

- The number of vouchers needed is a small, configurable threshold — a few by default, not a magic "exactly 3." Treat "round up a handful" as the plan.
- Social recovery rebuilds your *relationships*, not your old keys. It mints a **new** cryptographic identity; the old signing keys stay lost for good. Most things carry over, but some settings — visibility rules in particular — may want re-tuning afterwards.

### Step 1: Create New Identity

1. Install Vauchi on a new device
2. Create a **new identity** (fresh start)
3. This gives you a new device to work from

### Step 2: Start Recovery

1. Go to **Settings > Recovery**
2. Tap **Recover Old Identity**
3. Enter your old public ID (if you know it)
   - If you don't know it, ask a contact — they can find it in your contact details
4. A recovery claim is generated

### Step 3: Collect Vouchers

For each voucher, you need to meet a contact in person:

1. **Meet in person** (physical presence required)
2. Show them your recovery claim
3. They open **Settings > Recovery > Help Someone Recover**
4. They paste your claim
5. They verify it's really you
6. They tap **Create Voucher**
7. They share the voucher with you

Repeat until you reach the threshold (a handful by default).

```admonish tip
Ask contacts you've met in person and who will recognize you immediately.
```

### Step 4: Submit Recovery

1. Go to **Settings > Recovery**
2. Import each voucher you received
3. Once you've reached the threshold, tap **Complete Recovery**
4. Vauchi submits your recovery proof

### Step 5: Wait for Verification

1. The relay verifies your vouchers
2. Other contacts may verify via mutual connections
3. Once verified, your identity transitions

### Step 6: Re-Exchange (If Needed)

Some contacts may need to re-verify you:

1. They'll see your card update through recovery
2. Meet them in person to confirm
3. Your relationship continues

```admonish success
You're back! Your identity has been recovered.
```

---

## Helping Someone Else Recover

If a contact asks you to vouch for their recovery:

### Step 1: Verify Their Identity

Before creating a voucher:

- **Meet in person** if possible
- Confirm they are who they claim to be
- Be suspicious of unusual requests

```admonish warning
Only vouch if you're certain. A voucher is you putting your name on "yes, this is really them" — false vouching is how identity theft gets in the door.
```

### Step 2: Create Voucher

1. Go to **Settings > Recovery**
2. Tap **Help Someone Recover**
3. Paste their recovery claim
4. Tap **Create Voucher**

### Step 3: Share Voucher

1. Copy the voucher
2. Send it to them (AirDrop, messaging, etc.)

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

### Social Recovery: "Not Enough Vouchers"

- You haven't reached the threshold yet (a handful by default)
- Round up more contacts who exchanged with your old identity
- Vouchers must come from different contacts

### Social Recovery: "Voucher Rejected"

- The voucher may be for a different identity
- Your recovery claim may have expired — a claim is valid for 48
  hours; create a fresh one and ask contacts to vouch again
- Ask the contact to create a fresh one

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
5. **Stay in touch with a handful of contacts** who could vouch for you

---

## Security Notes

- Social recovery requires in-person verification — presence is the proof
- Needing several independent vouchers prevents any single person from impersonating you
- Recovery material ages out: the claim you show contacts is valid for 48 hours, and an assembled recovery proof expires after 90 days — so stolen recovery material doesn't stay useful
- A backup is yours alone: Argon2id + XChaCha20-Poly1305, no escrow, no back door
- The relay only ever forwards encrypted blobs, routed by daily-rotating mailbox tokens — it never sees your identity, your IP, or your data

For more on security, see [Backup & Recovery Feature](../features/backup-recovery.md).
