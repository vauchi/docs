<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# How to Recover Your Account

Step-by-step guide for restoring access to your Vauchi identity.

---

## Choose Your Recovery Method

| Situation | Method | Time Required |
|-----------|--------|---------------|
| Have backup code + password | [Backup Restore](#backup-restore) | 5 minutes |
| Have another linked device | [Device Link](#device-link) | 5 minutes |
| Lost everything | [Social Recovery](#social-recovery) | Hours to days |

---

## Backup Restore

If you have your encrypted backup code and password:

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

1. Vauchi restores your identity
2. Your contacts sync automatically via the relay
3. Within minutes, you should see your contacts

!!! success
    You're back! Your identity is fully restored.

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

!!! success
    You're back! Your new device is now synced.

---

## Social Recovery

If you've lost all devices and don't have a backup:

### Overview

Social recovery uses your real-world relationships to verify your identity. You need vouchers from 3 or more contacts who have previously exchanged with you.

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

1. **Meet in person** (video call as last resort)
2. Show them your recovery claim
3. They open **Settings > Recovery > Help Someone Recover**
4. They paste your claim
5. They verify it's really you
6. They tap **Create Voucher**
7. They share the voucher with you

Repeat until you have **3 or more vouchers**.

!!! tip
    Ask contacts you've met in person and who will recognize you immediately.

### Step 4: Submit Recovery

1. Go to **Settings > Recovery**
2. Import each voucher you received
3. Once you have 3+, tap **Complete Recovery**
4. Vauchi submits your recovery proof

### Step 5: Wait for Verification

1. The relay verifies your vouchers
2. Other contacts may verify via mutual connections
3. Once verified, your identity transitions

### Step 6: Re-Exchange (If Needed)

Some contacts may need to re-verify you:

1. They'll see a notification about your recovery
2. Meet them in person to confirm
3. Your relationship continues

!!! success
    You're back! Your identity has been recovered.

---

## Helping Someone Else Recover

If a contact asks you to vouch for their recovery:

### Step 1: Verify Their Identity

Before creating a voucher:

- **Meet in person** if possible
- Confirm they are who they claim to be
- Be suspicious of unusual requests

!!! warning
    Only vouch if you're certain. False vouching enables identity theft.

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

If you truly can't remember the password, you'll need to use social recovery.

### Backup Restore: "Invalid Backup Code"

- Make sure you copied the entire code
- Check for extra spaces or line breaks
- Try copying again from the original source

### Social Recovery: "Not Enough Vouchers"

- You need at least 3 vouchers
- Contact more people who have exchanged with your old identity
- Vouchers must be from different contacts

### Social Recovery: "Voucher Rejected"

- The voucher may be for a different identity
- The voucher may have expired (90 days)
- Ask the contact to create a fresh voucher

### Can't Remember Old Public ID

- Ask any contact who had your old card
- They can find your ID in your contact details
- Look through old screenshots or notes

---

## Prevention Tips

To avoid needing recovery:

1. **Create a backup** as soon as you set up
2. **Store backup securely** (password manager, safe)
3. **Link multiple devices** (phone + tablet/desktop)
4. **Remember your password** (use a passphrase)
5. **Have 5+ contacts** who could vouch for you

---

## Security Notes

- Social recovery requires in-person verification
- 3 vouchers prevent single-point-of-failure attacks
- Vouchers expire after 90 days
- Recovery is logged for transparency

For more on security, see [Backup & Recovery Feature](../features/backup-recovery.md).
