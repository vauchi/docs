<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Contact Exchange

Exchange contact cards securely by scanning QR codes in person.

---

## How It Works

Vauchi uses in-person exchange to establish contact relationships. Both parties must be physically present to complete an exchange.

```mermaid
sequenceDiagram
    participant A as You
    participant B as Contact

    Note over A,B: Meet in person

    A->>B: Show QR code
    B->>A: Scan QR code
    Note over A,B: Proximity verified
    A->>B: Scan their QR code

    Note over A,B: Exchange complete!
    Note over A,B: Both have each other's cards
```

## Why In-Person?

The in-person requirement is a privacy and security feature:

| Threat | How In-Person Prevents It |
|--------|---------------------------|
| Spam | Can't be added by strangers |
| Impersonation | You verify identity yourself |
| Man-in-the-middle | Direct device communication |
| Screenshot attacks | Proximity verification |

## Exchange Methods

### QR Code (Primary)

The main method for exchanging contacts:

1. Open the **Exchange** tab
2. Show your QR code
3. Have the other person scan it
4. Scan their QR code
5. Exchange complete

QR codes expire after 5 minutes for security.

### One-Way Sharing

Share your card without receiving theirs:

1. Enable **Share Only** mode
2. Show your QR code
3. They scan and receive your card
4. You don't receive their card

Useful for sharing business cards at events.

### Video Call Exchange

For contacts you can't meet in person:

1. Start a video call
2. Share your screen showing the QR code
3. They scan it from the video
4. Switch roles
5. Exchange complete

!!! note
    Video call exchange is less secure than in-person because you can't verify physical proximity.

## Proximity Verification

On mobile devices, Vauchi verifies physical proximity using ultrasonic audio:

- Both phones emit and listen for an audio handshake (18-20 kHz)
- Range: approximately 2 meters
- If verification fails, exchange is blocked
- This prevents screenshot attacks

### Troubleshooting Proximity

If proximity verification fails:

1. Ensure both phones have working speakers/microphones
2. Move closer together (within 1-2 meters)
3. Reduce background noise
4. Disable any audio-blocking apps
5. Try again

On desktop, proximity verification is skipped — manual confirmation is required instead.

## After Exchange

Once exchange completes:

- The new contact appears in your **Contacts** list
- You can see their contact card (fields they've shared)
- They can see your contact card (fields you've shared)
- Future updates sync automatically

## Security Properties

| Property | Mechanism |
|----------|-----------|
| Proximity required | Ultrasonic audio handshake |
| No man-in-the-middle | X3DH key agreement with identity keys |
| Forward secrecy | Ephemeral keys discarded after exchange |
| Replay prevention | One-time token, 5-minute expiry |
| Card authenticity | Ed25519 signature on contact card |

## Related

- [How to Exchange Contacts](../guides/exchange.md) — Step-by-step guide
- [Privacy Controls](privacy-controls.md) — Control what they see
- [Encryption](encryption.md) — How exchange data is protected
