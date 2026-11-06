<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Known Issues

Every honest product has a page like this; most hide it. Here is ours,
in plain sight. If something you're hitting is listed below, it's a known
limitation we're already working on — not something you broke. Check back
after updating to see if it's gone.

---

## Exchange

- **BLE exchange may fail on older Android devices** — Bluetooth Low
  Energy exchange requires Android 12+ with BLE 5.0 support. On older
  devices, use QR exchange instead.
- **Audio proximity verification requires quiet environment** — The
  ultrasonic proximity check can fail in noisy environments. This does
  not affect the security of the exchange, only the automatic proximity
  confirmation.
- <a id="audio-proximity-relay"></a>**The audio proximity check does not
  prove distance** — The ultrasonic check makes it harder to relay an
  exchange through a third device, but it is not proof that the other
  phone is next to yours: someone relaying the sound live could pass it.
  Exchange face to face and check the name shown before you keep the
  contact. The [threat model](../developers/threat-model.md) explains
  why.

## Sync

- **iOS background sync not yet available** — On iOS, sync only runs
  when the app is in the foreground. Open the app periodically to
  receive contact updates. Android background sync works automatically.
- <a id="own-relay"></a>**Your contacts must use the same relay as
  you** — Vauchi cannot yet pass updates from one relay to another. If
  you move to your own relay, contacts who stay on ours stop receiving
  your changes, and you stop receiving theirs.

## Desktop

- **Linux Qt: some screens not yet implemented** — A few secondary
  screens (backup scheduling, some settings panels) are still being
  wired on the Qt frontend.
- **Windows: device link dialog not yet available** — Device linking
  on Windows works via QR code but lacks the confirmation dialog.

## Privacy and Security

- <a id="linked-device-full-copy"></a>**A linked device is a full copy of
  your identity** — Every phone you link holds everything needed to act as
  you. If one is compromised, removing it from your device list does not
  fully shut it out, so someone holding it could add a new device of their
  own. Only link devices you control. A design that limits what ordinary
  devices hold is planned.
- <a id="post-quantum"></a>**Encryption is not yet quantum-resistant**
  — The key agreement used today is classical. Someone who records
  encrypted traffic now could read it if a large quantum computer is
  ever built. A hybrid post-quantum scheme is planned; the
  [cryptography page](../developers/crypto.md) has the details.
- <a id="one-operator"></a>**Vauchi runs both relay hops for now** —
  Your requests pass through two hops so that neither one alone sees
  both who you are and what you send. Until an independent operator
  runs one of them, Vauchi operates both, so the two halves are not yet
  held by different parties. The
  [security claims](../developers/security-claims.md) mark this as
  partial.

---

## Reporting Issues

Found something not listed here?

- **GitLab Issues**: [Report a bug](https://gitlab.com/vauchi/vauchi/-/issues/new)
- **Email**: [support@vauchi.app](mailto:support@vauchi.app)
- **Security issues**: [security@vauchi.app](mailto:security@vauchi.app)
  (see our [security policy](https://vauchi.app/.well-known/security.txt))

!!! warning "Privacy reminder"
    Never include QR codes, key material, or contact card content in
    bug reports — these contain cryptographic data.
