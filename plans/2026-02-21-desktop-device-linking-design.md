<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Desktop Device Linking — Design

**Date:** 2026-02-21
**Status:** Approved
**Scope:** `desktop/` (Tauri + SolidJS)

## Goal

Bring desktop device linking to feature parity with iOS/Android:
state-machine-driven UI, relay + offline QR transports, manual confirmation
code verification, inline page flow.

## Architecture

Hybrid: Rust backend handles relay WebSocket + crypto, SolidJS frontend
drives the state machine and renders UI.

## State Machine

Both roles share one `DeviceLinkState` union. The frontend holds the current
state + associated data as a SolidJS signal.

### Initiator (existing device, has identity)

```
idle -> selectTransport -> generatingQR -> waitingForRequest
     -> confirmingDevice -> completing -> success
```

### Responder (new device, no identity)

```
idle -> selectTransport -> scanOrPaste -> sendingRequest
     -> waitingForResponse -> completing -> success
```

Any state can transition to `failed`. Cancel returns to `idle`.

## Backend Commands

### New Commands (devices.rs)

| Command | Purpose | Returns |
|---------|---------|---------|
| `generate_device_link_qr` | Generate link + SVG QR | `{ qr_data, qr_svg, fingerprint }` |
| `prepare_device_confirmation` | Decrypt request, get confirmation | `{ device_name, confirmation_code, fingerprint }` |
| `confirm_device_link` | Approve link after user confirms | `{ response_data }` (base64) |
| `deny_device_link` | Reject link, clear state | `void` |
| `get_join_confirmation_code` | Responder computes matching code | `{ confirmation_code, fingerprint }` |
| `relay_listen_for_request` | Initiator: listen on relay (async, 5min) | `{ request_data }` |
| `relay_send_request` | Responder: send request via relay | `void` |
| `relay_send_response` | Initiator: send response via relay | `void` |
| `relay_wait_for_response` | Responder: wait for response (async) | `{ response_data }` |

### Modified Commands

- `complete_device_link` — deprecated, replaced by prepare + confirm
- `join_device` — device_name defaults to system hostname

### Offline Flow

Existing `join_device` / `finish_join_device` stay for offline (paste-based).
Multipart QR adds visual display for large payloads.

## Frontend Components

All inline in `Devices.tsx` (no new files):

1. **Transport selector** — "Link via Internet" / "Link Offline (QR Code)"
2. **Role selector** — "Link new device" / "Join existing account"
3. **QR display card** — SVG inline, copy button, 5-min countdown
4. **Confirmation card** — large monospaced XXX-XXX code, device name, fingerprint, Approve/Deny
5. **Status indicators** — spinner for relay async ops, progress text
6. **Multipart QR** (offline) — numbered frames with prev/next navigation

Device list at top stays unchanged. Linking flow renders below as inline cards.

## Proximity Verification

Desktop uses manual confirmation code only (no ultrasonic audio).
Both devices independently compute a 6-digit code from the shared link key.
User visually compares codes on both screens before approving.

## Security Properties

- Ed25519 signatures on QR code
- ChaCha20-Poly1305 encrypted request/response
- Mandatory confirmation code verification (manual proximity proof)
- 5-minute QR expiry
- No master seed exposure beyond encrypted channel

## Accessibility

- ARIA roles/labels on all interactive elements
- Keyboard navigation through linking steps
- Screen reader announcements for state transitions
- High contrast and reduced motion support (existing CSS patterns)

## i18n

New locale keys under `devices.link.*` namespace. All user-facing strings
go through `t()` i18n service.

## Testing Strategy

- Rust unit tests for new commands (prepare/confirm split, relay send/receive)
- Frontend: manual testing of state transitions
- Property-based tests for confirmation code consistency
