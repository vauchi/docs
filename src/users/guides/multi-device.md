<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# How to Set Up Multi-Device

Step-by-step guide for using Vauchi on multiple
devices.

Adding a device is less like copying a file and more like introducing two people who then keep each other up to date. The introduction has to happen once, in a way no eavesdropper can fake — after that, your phone and your laptop hold the same identity and sync between themselves. This guide covers the introduction, and what to do when a device is lost.

---

## Prerequisites

- Your existing device with Vauchi set up
- A new device with Vauchi installed
  (but not set up)
- Both devices have internet connectivity

---

## Linking a New Device

### Step 1: Generate Link Code

On your **existing device**:

**Mobile (iOS/Android):**

1. Open Vauchi
2. Go to **Settings** (gear icon)
3. Tap **Devices**
4. Tap **Link New Device**
5. A QR code appears (valid for 5 minutes)

**Desktop:**

1. Open Vauchi Desktop
2. Go to **Devices** (from the sidebar)
3. Click **Link New Device**
4. A QR code and data string appear
  (valid for 5 minutes)

**TUI:**

1. Open Vauchi TUI
2. Press **d** to go to Devices
3. Press **l** to generate a link
4. A QR code and data string appear in an
  overlay

**CLI:**

```bash
vauchi device link
```

A QR code and data string are displayed in the
terminal.

### Step 2: Join on New Device

On your **new device**:

**Mobile (iOS/Android):**

1. Open Vauchi
2. On the welcome screen, tap
  **Join Existing Identity**
3. Point your camera at the QR code from Step 1
4. Verify the confirmation code matches on both
  devices
5. Wait for the linking to complete

**Desktop:**

1. Open Vauchi Desktop
2. On the setup screen, click
  **Join Existing Identity**
3. Paste the data string from the existing device
4. Verify the confirmation code matches on both
  devices
5. Click **Confirm** to complete linking

**CLI:**

```bash
vauchi device join <data-string>
```

Then on the **existing device**, pass the encrypted
request data from the new device:

```bash
vauchi device complete <request-data>
```

```admonish info title="That six-digit code is doing real work"
Both devices show a short confirmation code like `123-456`. It isn't a password or a formality — each device computes it independently from the keys they just agreed on, so the numbers can only match if the two devices really negotiated with each other and nobody slipped into the middle. Matching codes are your proof of no man-in-the-middle. If they differ, stop and start over.
```

### Step 3: Confirm

Both devices should show:

- Your existing device:
  "Device linked successfully"
- Your new device:
  "Welcome back, [Your Name]"

Your new device is now synced with your
identity.

---

## Verifying Setup

After linking:

### On New Device

1. Go to **Contacts** — your contacts should appear
2. Go to **Home** — your contact card should appear
3. Go to **Settings > Devices** — both devices
  should be listed

### On Existing Device

1. Go to **Settings > Devices**
2. You should see both devices listed
3. Your new device shows its platform and last
  sync time

---

## Syncing Data

Sync is request-and-response, not a live broadcast — each device asks the relay for what's waiting and sends what's new. So changes land **near-instantly when both devices are online**, and catch up the moment a sleeping device wakes. Throughout, the relay only ever handles end-to-end encrypted blobs; it never sees your plaintext.

- **Near-instant:** When both devices are online
- **On app open:** When you open the app
- **Manual:** Pull to refresh or
  Settings > Sync Now

### What Syncs

| Data | Syncs? |
|------|--------|
| Your contact card | Yes |
| Your contacts | Yes |
| Visibility settings | Yes |
| App preferences | Yes |

---

## Managing Devices

### Viewing All Devices

**Mobile/Desktop:** Go to **Settings > Devices**
to see all linked devices. Your current device is
marked.

**TUI:** Press **d** to open the Devices screen.
Navigate with **j/k** or arrow keys. Current
device is marked `[this device]`.

**CLI:**

```bash
vauchi device list
```

### Revoking a Device

If a device is lost, stolen, or no longer
needed:

**Mobile/Desktop:**

1. Go to **Settings > Devices** on **another**
  device
2. Find the device to revoke
3. Tap **Revoke**
4. Confirm by tapping **Revoke Device**

**TUI:**

1. Press **d** to open Devices
2. Navigate to the device with **j/k**
3. Press **r** to revoke
4. Press **y** to confirm

**CLI:**

```bash
vauchi device revoke <device-id>
```

```admonish warning
You can't revoke the device in your hand — a chair
can't be pulled out from under the person sitting in
it. Revoke from another linked device.
```

```admonish danger
Revocation is immediate and permanent.
The revoked device loses all access.
```

---

## Troubleshooting

### Link Code Expired

QR codes are valid for 5 minutes. If expired:

1. On your existing device, generate a new link
  code
2. Scan or paste the new code quickly

### New Device Not Syncing

1. Check internet on both devices
2. Wait a few minutes for initial sync
3. Pull to refresh on the new device
4. Check Settings > Sync for last sync time

### "Too Many Devices" Error

Ten is the ceiling — generous, but a ceiling. An
eleventh device has to wait for a seat:

1. Go to **Settings > Devices**
2. Revoke a device you no longer use
3. Try linking the new device again

---

## Migrating to a New Phone

### Option 1: Device Linking (Recommended)

1. Keep your old phone accessible
2. Follow the steps above to link your new
  phone
3. Wait for sync to complete
4. Optionally, revoke your old phone

This is the cleanest migration path.

### Option 2: Backup & Restore

If you can't access your old phone:

1. Restore from an encrypted backup
2. See [How to Recover Your Account](recovery.md)

---

## Security Notes

- Each device has its own derived keys
- Revoking a device invalidates its keys
  immediately
- Up to 10 devices per identity; revoke one to make
  room for an eleventh
- The relay only forwards end-to-end encrypted data,
  routed by daily-rotating mailbox tokens — never
  your plaintext, identity, or IP
- Link codes expire after 5 minutes
- A 6-digit confirmation code, computed
  independently on both devices, proves you're
  linking the right two — no man-in-the-middle

For more on security, see
[Multi-Device Feature](../features/multi-device.md).
