<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# User Help Content

Master reference for all user-facing help text. Organized by feature, ready for translation.

**Style Guide**:
- Short (1-2 sentences)
- Non-technical
- Actionable
- No jargon

---

## Getting Started

### What is Vauchi?

**Short**: Vauchi is a contact card that updates automatically. When you change your phone number, everyone who has your card sees the change.

**Extended**: Unlike traditional contacts, Vauchi cards stay in sync. You meet someone, scan their QR code, and you're connected. When either of you updates your info, the other sees it instantly. Your data is encrypted — only you and your contacts can read it.

### How is this different from other apps?

**Short**: No accounts, no phone number required, no server access to your data. You exchange cards in person, and they update automatically.

**Extended**: Most contact apps require you to share your phone number or create an account. Vauchi works differently — you meet someone, exchange QR codes, and stay connected. Everything is encrypted end-to-end. We never see your contacts or your information.

### Do I need an account?

**Short**: No. Your identity is created on your device. There's nothing to sign up for.

---

## Exchange

### How do I add someone?

**Short**: Meet in person and scan each other's QR codes. Tap Exchange, show your code, and scan theirs.

### Why do I need to meet in person?

**Short**: This prevents spam and ensures you only connect with people you've actually met.

**Extended**: The in-person requirement is a privacy feature. You can't be added by strangers. When you scan someone's QR code, you know who they are. This is similar to how Signal verifies contacts.

### The QR code expired

**Short**: Tap refresh to generate a new code. Codes expire after 5 minutes for security.

### Exchange keeps failing

**Short**: Make sure you're scanning an active Vauchi QR code and both devices are nearby. Try refreshing the code.

---

## Contacts

### How do I edit a contact's info?

**Short**: You can't — only they can edit their card. When they update it, you'll see the change automatically.

### How do I remove a contact?

**Short**: Open the contact, tap the menu (three dots), and select Remove. They'll no longer receive your updates.

### Why can't I add someone remotely?

**Short**: Vauchi requires meeting in person. This prevents spam and ensures you know who you're connecting with.

### What happens if I change my info?

**Short**: Everyone who has your card sees the change automatically. Updates are encrypted and only your contacts can read them.

---

## Visibility & Privacy

### What is visibility?

**Short**: You control what each contact can see. Hide your home address from work contacts, or share your personal email only with friends.

### How do I change what someone can see?

**Short**: Open the contact, tap "Manage what they see", and toggle fields on or off.

### What's the default visibility?

**Short**: All fields are visible to all contacts by default. You can restrict any field at any time.

### What are labels?

**Short**: Labels group contacts (like "Family" or "Work") so you can control visibility for groups instead of individuals.

---

## Security

### How is my data protected?

**Short**: Everything is encrypted. Only you and your contacts can read your data. Not even us.

**Extended**: Vauchi uses the same encryption as Signal. Each message uses a unique key. Even if one key is compromised, other messages stay secure. Your data is encrypted before it leaves your device.

### Who can see my data?

**Short**: Only your contacts — and only the fields you've shared with them. We never have access.

### Can someone track me?

**Short**: No. We don't collect location data. Your card contains only what you choose to add.

---

## Recovery

### What happens if I lose my phone?

**Short**: You can recover your contact relationships through Social Recovery. Meet 3+ contacts in person and have them vouch for you.

### How do I set up recovery?

**Short**: You don't need to. Any of your contacts can vouch for you. Just meet them in person when you need to recover.

### How many contacts do I need?

**Short**: At least 3 contacts need to vouch for you in person. We recommend having 5+ contacts in case some are unavailable.

### What if my contacts don't respond?

**Short**: You need to meet them in person. If you can't reach 3 contacts, you won't be able to recover. Consider setting up a backup.

---

## Backup & Restore

### How do I back up my identity?

**Short**: Go to Settings > Backup & Restore > Export Backup. Choose a strong password — you'll need it to restore.

### How do I restore from backup?

**Short**: When setting up a new device, choose "Import Backup" and enter your backup data and password.

### What's in my backup?

**Short**: Your identity (name and keys). Contacts are not included — use Social Recovery to reconnect with them.

---

## Devices

### Can I use Vauchi on multiple devices?

**Short**: Yes. Go to Settings > Devices > Link Device on your primary device, then scan the QR code on your new device.

### How do I remove a device?

**Short**: Go to Settings > Devices, select the device, and tap Revoke. It will lose access immediately.

---

## Sync

### My contacts aren't updating

**Short**: Check your internet connection. Go to Settings > Sync and tap Sync Now. If the problem persists, try restarting the app.

### What is the relay?

**Short**: The relay is a server that delivers your encrypted updates. It can't read your messages — it just passes them along.

### Updates aren't being delivered

**Short**: If a contact is offline, updates wait until they come back online (up to 30 days). There's nothing you need to do.

---

## Troubleshooting

### The app is slow

**Short**: Try closing and reopening the app. If you have many contacts (500+), some operations may take a moment.

### Camera won't work

**Short**: Make sure Vauchi has camera permission. Go to your device settings and enable camera access for Vauchi.

### QR code won't scan

**Short**: Hold steady, make sure the code is well-lit and in focus. Try moving closer or further away.

---

## Locale Key Reference

This section maps help content to locale keys for implementation.

### Onboarding Help Keys

| Key | Content |
|-----|---------|
| `help.onboarding.what_is` | What is Vauchi? Short answer. |
| `help.onboarding.different` | How is this different from other apps? |
| `help.onboarding.no_account` | Do I need an account? |
| `help.onboarding.privacy` | How is my data protected? |

### Exchange Help Keys

| Key | Content |
|-----|---------|
| `help.exchange.how_to_add` | How do I add someone? |
| `help.exchange.why_in_person` | Why meet in person? |
| `help.exchange.qr_expired` | QR code expired message. |
| `help.exchange.failed` | Exchange troubleshooting. |
| `help.exchange.nfc` | Using NFC for exchange. |

### Contacts Help Keys

| Key | Content |
|-----|---------|
| `help.contacts.edit` | How to edit (you can't — they control their card). |
| `help.contacts.delete` | How to remove a contact. |
| `help.contacts.visibility` | What visibility means. |
| `help.contacts.no_remote` | Why you can't add remotely. |

### Settings Help Keys

| Key | Content |
|-----|---------|
| `help.settings.relay` | What the relay is. |
| `help.settings.backup` | How backup works. |
| `help.settings.theme` | Changing appearance. |
| `help.settings.language` | Changing language. |

### Recovery Help Keys

| Key | Content |
|-----|---------|
| `help.recovery.overview` | What recovery is. |
| `help.recovery.setup` | How to prepare (any contact can vouch). |
| `help.recovery.claim` | Creating a recovery claim. |
| `help.recovery.vouch` | How vouching works. |
| `help.recovery.threshold` | How many vouchers needed. |

### Sync Help Keys

| Key | Content |
|-----|---------|
| `help.sync.not_updating` | Troubleshooting sync. |
| `help.sync.what_is_relay` | Relay explanation. |
| `help.sync.offline_contacts` | What happens when contacts are offline. |

---

## FAQ Category Reference

The existing `help.rs` system uses these categories:

| Category | Locale Prefix | Topics |
|----------|---------------|--------|
| `getting-started` | `faq.first_contact` | First steps, basic concepts |
| `contacts` | `faq.remove_contact` | Managing contacts, visibility |
| `security` | `faq.encryption` | Privacy, encryption, tracking |
| `recovery` | `faq.phone_lost` | Device loss, social recovery |
| `troubleshooting` | `faq.offline_updates` | Common issues, sync |
| `advanced` | `faq.multiple_devices` | Power user features |

### Existing FAQ Keys (754 total in locale files)

The locale files already contain comprehensive FAQ content. Key entries:

- `faq.first_contact.question` / `faq.first_contact.answer`
- `faq.how_updates_work.question` / `faq.how_updates_work.answer`
- `faq.encryption.question` / `faq.encryption.answer`
- `faq.why_in_person.question` / `faq.why_in_person.answer`
- `faq.phone_lost.question` / `faq.phone_lost.answer`
- `faq.data_storage.question` / `faq.data_storage.answer`
- `faq.visibility_labels.question` / `faq.visibility_labels.answer`

---

## Implementation Notes

1. **help.rs Integration**: The `core/vauchi-core/src/help.rs` module loads FAQ content from locale keys.

2. **In-App Contextual Help**: Use `help.*` keys for context-sensitive help on specific screens.

3. **Search**: The help system supports full-text search across FAQ entries.

4. **Translation**: All content in `locales/{en,de,fr,es}.json`. Run `scripts/validate.py` after changes.

5. **Style Consistency**: Keep answers short. First sentence should directly answer the question.

---

## Related Documentation

- [System Overview](2026-02-06-system-overview.md) — Technical architecture
- [help.rs](https://gitlab.com/vauchi/core/-/blob/main/vauchi-core/src/help.rs) — Help system implementation
- [locales/](https://gitlab.com/vauchi/locales) — Locale JSON files
