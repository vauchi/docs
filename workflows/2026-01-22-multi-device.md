# Multi-Device Workflow

Step-by-step guide for using Vauchi across multiple devices.

## Overview

Vauchi supports linking multiple devices to a single identity. Changes on one device sync to all others. This is different from recovery - your devices share the same identity.

## Use Cases

- Phone + Tablet
- Personal phone + Work phone
- Phone + Desktop app
- Temporary device while traveling

## Device Limits

- Maximum: **10 linked devices**
- Unlink unused devices to add new ones

## Linking a New Device

### On Your Primary Device (Device A)

1. Go to **Settings**
2. Tap **Devices** or **Link New Device**
3. A QR code appears
4. A numeric code also displays (fallback)
5. Code expires in **5 minutes**

### On the New Device (Device B)

#### Via QR Code (Recommended)

1. Install Vauchi
2. Select **Link to Existing Identity**
3. Tap **Scan QR Code**
4. Scan the QR from Device A
5. Wait for proximity verification
6. Device B receives your identity

#### Via Numeric Code

1. Install Vauchi
2. Select **Link to Existing Identity**
3. Tap **Enter Code Manually**
4. Enter the numeric code from Device A
5. Confirm device fingerprint on Device A
6. Device B receives your identity

### Proximity Requirement

For security, devices must be physically together:

- Audio handshake verifies proximity
- Prevents remote linking attacks
- If verification fails, linking is blocked

## After Linking

The new device receives:

- Your complete contact card
- All your contacts
- All visibility settings
- All labels and configurations

This may take a moment for large contact lists.

## Synchronization

### Automatic Sync

Changes sync automatically when online:

- Contact card updates
- New contacts added
- Visibility changes
- Label modifications

### Bidirectional

Changes from any device propagate to all:

- Edit on phone → appears on tablet
- Edit on tablet → appears on phone

### Conflict Resolution

If conflicting changes occur:

- Most recent change wins
- Timestamp-based resolution
- No manual merge needed

## Managing Linked Devices

### View Linked Devices

1. Go to **Settings**
2. Tap **Devices**
3. See all linked devices with:
   - Device name
   - Last active time
   - Device type

### Rename a Device

1. Go to **Settings** > **Devices**
2. Tap on a device
3. Tap **Rename**
4. Enter new name
5. Tap **Save**

### Unlink a Device

1. Go to **Settings** > **Devices**
2. Tap on the device to unlink
3. Tap **Unlink Device**
4. Confirm the action

The unlinked device:
- Loses access to your identity
- Can no longer sync
- Data remains but becomes stale
- Cannot send/receive updates

### Remote Unlink (Lost Device)

If you lose a device:

1. On any remaining linked device
2. Go to **Settings** > **Devices**
3. Find the lost device
4. Tap **Unlink Device**
5. Confirm

The lost device is immediately cut off from your identity.

## Security Considerations

### Device Compromise

If a linked device is compromised:

1. Unlink it immediately from another device
2. Consider notifying contacts
3. The compromised device can no longer receive updates

### Shared Device Keys

Linked devices share cryptographic material:

- Each device has its own device key
- But they share identity-level keys
- Unlinking revokes device-specific access

### No Message History Sync

Vauchi doesn't store message history, so:

- No messages to sync between devices
- Only contact cards and metadata sync

## Multi-Device vs. Recovery

| Scenario | Solution |
|----------|----------|
| Add second phone | Multi-device linking |
| Lost only phone | Recovery (social vouching) |
| Lost one of multiple phones | Unlink lost device |
| Lost all devices | Recovery |

## Workflow: Adding Tablet

1. Phone: Settings > Link New Device
2. Phone: Show QR code
3. Tablet: Install Vauchi
4. Tablet: "Link to Existing Identity"
5. Tablet: Scan QR code
6. Both: Wait for proximity verification
7. Tablet: Receives all data
8. Done: Both devices stay in sync

## Workflow: Replacing Phone

Upgrading to new phone:

1. Old phone: Settings > Link New Device
2. New phone: Install, link via QR
3. New phone: Receives all data
4. Old phone: Settings > Devices > Unlink self
5. (Or keep old phone as backup device)

## Troubleshooting

### Linking Failed - Proximity

- Move devices closer together
- Ensure speakers/microphones work
- Try in quieter environment

### Linking Failed - Code Expired

- Codes expire after 5 minutes
- Generate new code on primary device

### Maximum Devices Reached

- Unlink unused devices first
- Check Settings > Devices for inactive ones

### Sync Not Working

- Check internet connection on both devices
- Force sync: Pull down to refresh
- Check relay connectivity

### Device Shows Stale Data

- Pull down to refresh
- Check internet connection
- Ensure device is still linked

## Best Practices

1. **Name Devices Clearly**: "iPhone 15", "iPad Work", etc.
2. **Unlink Unused Devices**: Reduces attack surface
3. **Unlink Before Selling**: Always unlink before giving away/selling a device
4. **Keep One Device Secure**: Backup device in safe location

## Feature File Reference

See: `features/device_management.feature`
