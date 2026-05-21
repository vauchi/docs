<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Terms of Service

**Last Updated:** April 2026

## 1. Acceptance of Terms

By downloading, installing, or using Vauchi ("the App"),
you agree to these Terms of Service ("Terms"). If you do
not agree, do not use the App.

## 2. Description of Service

Vauchi is a privacy-focused contact card exchange
application. It allows you to:

- Create and manage a personal contact card
- Exchange contact cards with others via QR code
  scanning in physical proximity
- Control which fields each contact can see
- Sync contact data across your own devices
- Back up and restore your data

## 3. Your Data and Privacy

Vauchi is designed around local-first, user-controlled
data. Please review our
[Privacy Policy](privacy-policy.md) for full details.

Key points:

- **Your data stays on your devices.** We do not store
  your contact cards, identity, or personal information
  on our servers.
- **End-to-end encryption.** Contact card updates sent
  through our relay are encrypted on your device before
  transmission. We cannot read them.
- **No accounts.** Your device holds your cryptographic
  identity. There is no username, password, or central
  account.

## 4. Relay Service

Vauchi operates a relay server that delivers encrypted
contact card updates between devices. The relay:

- Stores encrypted envelopes temporarily (deleted after
  delivery or 30 days)
- Cannot decrypt any content
- Logs connection metadata (IP address, timestamps) for
  rate limiting, retained for 24 hours
- May be rate-limited to prevent abuse

We provide the relay service on a best-effort basis and
may suspend or discontinue it at any time with reasonable
notice.

## 5. User Responsibilities

You agree to:

- Use the App only for lawful purposes
- Not attempt to circumvent security measures or
  reverse-engineer the encryption
- Not use the App to harass, stalk, or harm others
- Not transmit malicious content through contact card
  fields
- Not abuse the relay service (automated mass requests,
  denial-of-service attempts)

## 6. Account Deletion

You can delete your account and all associated data at
any time from Settings > Delete Account. A 7-day grace
period allows cancellation. After deletion:

- A revocation signal is sent to all your contacts
- The relay purges all stored data for your account
- All local data is permanently destroyed
- This action is irreversible after the grace period

## 7. Age Requirement

Vauchi is not intended for use by children under the age
of 13. By using the App, you confirm that you are at
least 13 years old, or that you have obtained parental
or guardian consent.

## 8. Intellectual Property

Vauchi is free software, licensed under the GNU General
Public License v3.0 or later (GPL-3.0-or-later). You may
use, modify, and distribute the source code under the
terms of this license. The source code is available at
[gitlab.com/vauchi](https://gitlab.com/vauchi).

The Vauchi name and logo are trademarks of the Vauchi
project. Use of these trademarks is subject to our
trademark guidelines.

## 9. Disclaimer of Warranties

THE APP IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
NON-INFRINGEMENT.

We do not warrant that:

- The App will be uninterrupted or error-free
- The relay service will be available at all times
- The encryption will protect against all possible threats

## 10. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE
VAUCHI PROJECT AND ITS CONTRIBUTORS SHALL NOT BE LIABLE
FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF
DATA, LOSS OF CONTACTS, OR INABILITY TO ACCESS YOUR
INFORMATION.

## 11. Self-Hosting

You may self-host the Vauchi relay server under the terms
of the GPL-3.0-or-later license. Self-hosted instances
are your responsibility. We provide no warranty or support
for self-hosted deployments beyond published documentation.

## 12. Third-Party Services

Vauchi does not integrate with third-party services. The
App does not use analytics, advertising networks, social
media SDKs, or cloud storage providers.

## 13. Export Compliance

Vauchi uses strong encryption. By using the App, you
acknowledge that export and use of encryption software
may be subject to regulations in your jurisdiction. You
are responsible for complying with applicable export
control laws.

## 14. Modifications to Terms

We may update these Terms from time to time. We will
notify you of significant changes through the App or our
website. Continued use after changes constitutes
acceptance of the updated Terms.

## 15. Governing Law

These Terms are governed by the laws of Switzerland. Any
disputes shall be subject to the exclusive jurisdiction
of the courts of Switzerland.

## 16. Severability

If any provision of these Terms is found to be
unenforceable, the remaining provisions continue in full
force and effect.

## 17. Contact

For questions about these Terms:

- Email: [legal@vauchi.app](mailto:legal@vauchi.app)
- GitLab: [gitlab.com/vauchi](https://gitlab.com/vauchi)
