<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# How to Set Up Multi-Device

Step-by-step guide for using Vauchi on multiple devices.

---

## Prerequisites

- Your existing device with Vauchi set up
- A new device with Vauchi installed (but not set up)
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
4. A QR code and data string appear (valid for 5 minutes)

**TUI:**

1. Open Vauchi TUI
2. Press **d** to go to Devices
3. Press **l** to generate a link
4. A QR code and data string appear in an overlay

**CLI:**

```bash
vauchi device link
```

A QR code and data string are displayed in the terminal.

### Step 2: Join on New Device

On your **new device**:

**Mobile (iOS/Android):**

1. Open Vauchi
2. On the welcome screen, tap **Join Existing Identity**
3. Point your camera at the QR code from Step 1
4. Verify the confirmation code matches on both devices
5. Wait for the linking to complete

**Desktop:**

1. Open Vauchi Desktop
2. On the setup screen, click **Join Existing Identity**
3. Paste the data string from the existing device
4. Verify the confirmation code matches on both devices
5. Click **Confirm** to complete linking

**CLI:**

```bash
vauchi device join <data-string>
```

Then verify the confirmation code and run:

```bash
vauchi device complete <confirmation-code>
```

### Step 3: Confirm

Both devices should show:

- Your existing device: "Device linked successfully"
- Your new device: "Welcome back, [Your Name]"

Your new device is now synced with your identity.

---

## Verifying Setup

After linking:

### On New Device

1. Go to **Contacts** — your contacts should appear
2. Go to **Home** — your contact card should appear
3. Go to **Settings > Devices** — both devices should be listed

### On Existing Device

1. Go to **Settings > Devices**
2. You should see both devices listed
3. Your new device shows its platform and last sync time

---

## Syncing Data

Data syncs automatically:

- **Immediately:** When both devices are online
- **On app open:** When you open the app
- **Manual:** Pull to refresh or Settings > Sync Now

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

**Mobile/Desktop:** Go to **Settings > Devices** to see all linked devices. Your current device is marked.

**TUI:** Press **d** to open the Devices screen. Navigate with **j/k** or arrow keys. Current device is marked `[this device]`.

**CLI:**

```bash
vauchi device list
```

### Revoking a Device

If a device is lost, stolen, or no longer needed:

**Mobile/Desktop:**

1. Go to **Settings > Devices** on **another** device
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
vauchi device revoke <device-index>
```

```admonish warning
You cannot revoke your current device. Use another linked device.
```

```admonish danger
Revocation is immediate and permanent. The revoked device loses all access.
```

---

## Troubleshooting

### Link Code Expired

QR codes are valid for 5 minutes. If expired:

1. On your existing device, generate a new link code
2. Scan or paste the new code quickly

### New Device Not Syncing

1. Check internet on both devices
2. Wait a few minutes for initial sync
3. Pull to refresh on the new device
4. Check Settings > Sync for last sync time

### "Too Many Devices" Error

You can have up to 10 devices. To add another:

1. Go to **Settings > Devices**
2. Revoke a device you no longer use
3. Try linking the new device again

---

## Migrating to a New Phone

### Option 1: Device Linking (Recommended)

1. Keep your old phone accessible
2. Follow the steps above to link your new phone
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
- Revoking a device invalidates its keys immediately
- The relay never sees plaintext data
- Link codes expire after 5 minutes
- A 6-digit confirmation code ensures you're linking the right devices

For more on security, see [Multi-Device Feature](../features/multi-device.md).
