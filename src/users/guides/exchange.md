<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# How to Exchange Contacts

Step-by-step guide for exchanging contact cards with other Vauchi users.

A handshake is a security check we stopped noticing centuries ago: you confirm someone is real, present, and willing, all in one gesture. A Vauchi exchange is the same idea wearing newer clothes. The simplest version — and the one this guide walks through — is two phones showing each other a QR code while you stand close enough to read them.

---

## Prerequisites

- Both you and the other person have Vauchi installed
- For the in-person QR exchange below: both devices have working cameras
- You don't strictly need both at once — see [Other ways to exchange](#other-ways-to-exchange) if you're not in the same room

---

## QR Code Exchange

Both people show and scan each other's QR codes. Every exchange uses fresh keys, so the past stays private even if a key later leaks (forward secrecy). The QR itself carries only the person's public key and a one-time token — nothing secret, and it goes stale after five minutes.

### Step 1: Open Exchange

1. Open Vauchi
2. Tap the **Exchange** tab at the bottom

### Step 2: Show Your QR Code

1. Tap **Show My QR Code**
2. A QR code appears on your screen
3. Show it to the other person

```admonish tip
Keep your screen brightness up and hold steady for easier scanning.
```

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

```admonish info
On iOS, "physically together" isn't taken on trust: the two devices play a brief ultrasonic handshake (~18–20 kHz, audible to the dog and no one else) to confirm they're within about three metres. If the tone doesn't carry, it falls back to a manual confirmation tap. Android proximity checking is planned; desktop, CLI, and TUI confirm manually.
```

---

## Other ways to exchange

QR is the default because it works on every platform and needs nothing but a camera. But proximity has more than one shape, and Vauchi offers a few:

| Mode | How it works | Best for |
|------|--------------|----------|
| **QR** (default) | Show and scan codes | Anywhere, any device |
| **Tap** | Hold phones together (NFC) | Quick face-to-face swaps |
| **Bump** | Bump or shake the devices (BLE + motion) | Crowded rooms, no line of sight |
| **Link** | Share a one-off `vauchi://exchange?…` URL | People who aren't in the room |

The first three all prove you were in the same place at the same time, which is the strongest defence against a stranger quietly inserting themselves into the middle of your exchange. **Link mode** relaxes that proof in return for reach: you send a single-use URL, and the exchange finishes asynchronously through the relay over the following days. It's the difference between a handshake and a sealed letter — both work, one knows the room was empty.

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
- The relay is a blind courier: it forwards encrypted blobs, routes them with daily-rotating mailbox tokens rather than your identity, and never learns your IP address (Oblivious HTTP). It carries the envelope; it cannot read the letter.

For more on security, see [Encryption](../features/encryption.md).
