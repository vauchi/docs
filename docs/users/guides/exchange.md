<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# How to Exchange Contacts

Step-by-step guide for exchanging contact cards with other Vauchi users.

---

## Prerequisites

- Both you and the other person have Vauchi installed
- You're physically together (proximity verification required)
- Both devices have working cameras

---

## QR Code Exchange

Both people show and scan each other's QR codes. This ensures fresh encryption keys are used for every exchange (forward secrecy).

### Step 1: Open Exchange

1. Open Vauchi
2. Tap the **Exchange** tab at the bottom

### Step 2: Show Your QR Code

1. Tap **Show My QR Code**
2. A QR code appears on your screen
3. Show it to the other person

!!! tip
    Keep your screen brightness up and hold steady for easier scanning.

### Step 3: They Scan Your Code

1. The other person points their camera at your QR code
2. Their device confirms a successful scan

### Step 4: Scan Their Code

1. Tap **Scan QR Code**
2. Point your camera at their QR code
3. Wait for the scan to complete

### Step 5: Confirm

Both devices show "Exchange Successful"

You now have each other's contact cards.

---

## Troubleshooting

### QR Code Won't Scan

1. **Lighting:** Make sure the QR code is well-lit
2. **Stability:** Hold both devices steady
3. **Distance:** Try moving closer or farther
4. **Clean lens:** Wipe your camera lens
5. **Refresh:** Generate a new QR code (they expire after 5 minutes)

### Exchange Keeps Failing

1. Check internet connectivity on both devices
2. Ensure the QR code hasn't expired (5-minute limit)
3. Restart the app on both devices
4. Try a fresh QR code

---

## After Exchange

Once exchange completes:

- They appear in your **Contacts** list
- You can see their card (fields they've shared)
- They can see your card (fields you've shared)
- Future changes sync automatically

### Next Steps

- [Control what they see](visibility.md)
- [Verify their identity](../features/contact-exchange.md#security-properties)

---

## Security Notes

- QR codes expire after 5 minutes (replay protection)
- Both parties must scan each other's QR codes (mutual verification)
- Each exchange uses fresh ephemeral keys (forward secrecy)
- Exchange uses encrypted key agreement
- The relay never sees unencrypted data

For more on security, see [Encryption](../features/encryption.md).
