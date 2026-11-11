<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Roadmap

This is the one page that names what Vauchi does **not** do yet. Every
other page describes what the app does today; when one of them mentions a
limit, it links here.

There are no dates on purpose: a feature is listed while it is planned and
leaves this page in the change that ships it. "Shipped so far" says what
part of a feature you can already use. The tracker numbers point to the
maintainers' issues.

| Feature | Shipped so far | Tracked in |
|---------|----------------|------------|
| Contacts move to your recovered identity automatically after social recovery | Guardians hold your encrypted backup and hand it back in person; your contacts do not move to the recovered identity yet | vauchi/private#796 |
| Post-quantum key agreement (hybrid X25519 + ML-KEM-768) | Classical X25519 key agreement | vauchi/private#109 |
| Forward secrecy for sync between your own devices | Contact updates have forward secrecy; own-device sync does not | vauchi/private#1090 |
| An independent operator for the OHTTP hop | The hop runs on a separate host, run by the same operator as the relay | vauchi/private#605 |
| Reaching messages a relay has offloaded to a peer relay | Relays can offload old messages; the app cannot yet fetch them back | vauchi/private#835 |
| Mesh exchange (several people at once over Bluetooth or Wi-Fi) | One-to-one exchange over QR, NFC, Bluetooth or a link | vauchi/private#55 |
| Screen-reader walkthrough of every journey on every app | Accessibility labels come with every screen; the walkthrough on each app is not done | vauchi/private#968 |
| Right-to-left languages and more locales | English, German, French, Italian and Spanish | vauchi/private#36 |
| Plural rules for every language | Plural forms are not applied per language yet | vauchi/private#341 |
| A physical proximity check (NFC or ultrasonic) when linking a device | Linking checks a confirmation code you compare on both screens | vauchi/private#1240 |
| Assigning an existing contact to a label from the contact's page | Labels are chosen at the end of an exchange | vauchi/private#1241 |
| Contacts vouching for a card field, and marking your own fields as self-attested | Nothing yet | vauchi/private#1242 |
| A panic button widget on the home screen | Nothing yet | vauchi/private#1243 |
