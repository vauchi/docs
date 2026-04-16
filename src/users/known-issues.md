<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Known Issues

This page lists known issues in the current release. Check back after
updating to see if your issue has been resolved.

---

## Exchange

- **BLE exchange may fail on older Android devices** — Bluetooth Low
  Energy exchange requires Android 12+ with BLE 5.0 support. On older
  devices, use QR exchange instead.
- **Audio proximity verification requires quiet environment** — The
  ultrasonic proximity check can fail in noisy environments. This does
  not affect the security of the exchange, only the automatic proximity
  confirmation.

## Sync

- **iOS background sync not yet available** — On iOS, sync only runs
  when the app is in the foreground. Open the app periodically to
  receive contact updates. Android background sync works automatically.

## Desktop

- **Linux Qt: some screens not yet implemented** — A few secondary
  screens (backup scheduling, some settings panels) are still being
  wired on the Qt frontend.
- **Windows: device link dialog not yet available** — Device linking
  on Windows works via QR code but lacks the confirmation dialog.

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
