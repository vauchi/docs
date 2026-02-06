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

1. Open Vauchi
2. Go to **Settings** (gear icon)
3. Tap **Devices**
4. Tap **Link New Device**
5. A QR code appears (valid for 10 minutes)

### Step 2: Join on New Device

On your **new device**:

1. Open Vauchi
2. On the welcome screen, tap **Join Existing Identity**
3. Point your camera at the QR code from Step 1
4. Wait for the linking to complete

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

1. Go to **Settings > Devices**
2. See all linked devices
3. Your current device is marked

### Renaming a Device

1. Go to **Settings > Devices**
2. Tap on a device
3. Tap **Rename**
4. Enter a new name (e.g., "Work Laptop", "iPad")

### Revoking a Device

If a device is lost, stolen, or no longer needed:

1. Go to **Settings > Devices** on **another** device
2. Find the device to revoke
3. Tap **Revoke**
4. Confirm by tapping **Revoke Device**

!!! warning
    You cannot revoke your current device. Use another linked device.

!!! danger
    Revocation is immediate and permanent. The revoked device loses all access.

---

## Troubleshooting

### Link Code Expired

QR codes are valid for 10 minutes. If expired:

1. On your existing device, go back to Settings > Devices
2. Tap **Link New Device** again
3. A fresh QR code appears
4. Scan it quickly

### New Device Not Syncing

1. Check internet on both devices
2. Wait a few minutes for initial sync
3. Pull to refresh on the new device
4. Check Settings > Sync for last sync time

### Device Not Appearing in List

1. On both devices, go to Settings > Devices
2. Pull to refresh
3. Wait 1-2 minutes
4. If still missing, try unlinking and relinking

### "Too Many Devices" Error

You can have up to 5 devices. To add another:

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
- Link codes expire after 10 minutes

For more on security, see [Multi-Device Feature](../features/multi-device.md).
