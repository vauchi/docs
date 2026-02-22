<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Desktop Device Linking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring desktop device linking to feature parity with iOS/Android — state-machine UI, relay + offline QR transports, manual confirmation code verification.

**Architecture:** Hybrid — Rust backend handles relay WebSocket + crypto via Tauri commands; SolidJS frontend drives the state machine and renders inline UI in Devices.tsx. Relay transport uses `vauchi-mobile`'s async functions (adapted for desktop since we use `vauchi-core` directly).

**Tech Stack:** Rust (Tauri 2, vauchi-core, tokio, tokio-tungstenite, qrcode), TypeScript (SolidJS, @tauri-apps/api)

---

## Tasks

### Task 1: Add QR SVG Generation Command

**Files:**

- Modify: `desktop/src-tauri/src/commands/devices.rs`

**Step 1: Write the failing test**

```rust
// In desktop/src-tauri/src/commands/devices.rs (or a test module)
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_qr_svg_contains_svg_element() {
        // Generate a QR SVG from arbitrary data
        let svg = generate_qr_svg("WBDL-test-data-string");
        assert!(svg.starts_with("<svg"), "SVG should start with <svg tag");
        assert!(svg.contains("</svg>"), "SVG should contain closing tag");
    }
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test -p vauchi-desktop test_qr_svg_contains_svg_element`
Expected: FAIL — `generate_qr_svg` not defined

**Step 3: Write minimal implementation**

Add a helper function to generate SVG from QR data:

```rust
/// Generate an SVG string for a QR code from the given data.
fn generate_qr_svg(data: &str) -> String {
    use qrcode::QrCode;

    let code = QrCode::new(data.as_bytes()).expect("QR generation failed");
    let module_count = code.width();
    let module_size = 4;
    let margin = 2;
    let total = (module_count + margin * 2) * module_size;

    let mut svg = format!(
        r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total} {total}" width="{total}" height="{total}">"#
    );
    svg.push_str(&format!(
        r#"<rect width="{total}" height="{total}" fill="white"/>"#
    ));

    for y in 0..module_count {
        for x in 0..module_count {
            if code[(x, y)] == qrcode::Color::Dark {
                let px = (x + margin) * module_size;
                let py = (y + margin) * module_size;
                svg.push_str(&format!(
                    r#"<rect x="{px}" y="{py}" width="{module_size}" height="{module_size}" fill="black"/>"#
                ));
            }
        }
    }

    svg.push_str("</svg>");
    svg
}
```

**Step 4: Run test to verify it passes**

Run: `cargo test -p vauchi-desktop test_qr_svg_contains_svg_element`
Expected: PASS

**Step 5: Add the Tauri command**

```rust
#[derive(Serialize)]
pub struct DeviceLinkQRResult {
    pub qr_data: String,
    pub qr_svg: String,
    pub fingerprint: String,
}

/// Generate device link QR data and SVG image for pairing a new device.
#[tauri::command]
pub fn generate_device_link_qr(
    state: State<'_, Mutex<AppState>>,
) -> Result<DeviceLinkQRResult, String> {
    let mut state = state.lock().unwrap();

    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| "No identity found".to_string())?;

    let qr = DeviceLinkQR::generate(identity);
    let qr_data = qr.to_data_string();
    let fingerprint = qr.identity_fingerprint();
    let qr_svg = generate_qr_svg(&qr_data);

    // Store for later use in complete flow
    state.pending_device_link_qr = Some(qr_data.clone());

    Ok(DeviceLinkQRResult {
        qr_data,
        qr_svg,
        fingerprint,
    })
}
```

**Step 6: Register command in lib.rs**

Add `commands::devices::generate_device_link_qr` to the `invoke_handler` list.

**Step 7: Commit**

```bash
git add src-tauri/src/commands/devices.rs src-tauri/src/lib.rs
git commit -m "feat: add QR SVG generation command for device linking"
```

---

### Task 2: Split Confirmation into Prepare + Confirm + Deny

**Files:**

- Modify: `desktop/src-tauri/src/commands/devices.rs`
- Modify: `desktop/src-tauri/src/state.rs` (add initiator field)
- Modify: `desktop/src-tauri/src/lib.rs` (register commands)

**Step 1: Add initiator state to AppState**

In `state.rs`, add to AppState:

```rust
use vauchi_core::exchange::{DeviceLinkInitiator, DeviceLinkRequest};

pub struct AppState {
    // ... existing fields ...
    /// Active device link initiator (between prepare and confirm).
    pub pending_initiator: Option<DeviceLinkInitiator>,
    /// Pending device link request (between prepare and confirm).
    pub pending_link_request: Option<DeviceLinkRequest>,
}
```

Update `AppState::new()` to initialize these as `None`.

**Step 2: Write failing test for prepare_device_confirmation**

```rust
#[test]
fn test_prepare_device_confirmation_requires_pending_qr() {
    // Setup: AppState with identity but no pending QR
    // Call prepare_device_confirmation with some request_data
    // Should fail with "No pending device link"
}
```

**Step 3: Implement prepare_device_confirmation**

```rust
#[derive(Serialize)]
pub struct DeviceConfirmation {
    pub device_name: String,
    pub confirmation_code: String,
    pub fingerprint: String,
}

#[tauri::command]
pub fn prepare_device_confirmation(
    request_data: String,
    state: State<'_, Mutex<AppState>>,
) -> Result<DeviceConfirmation, String> {
    let mut state = state.lock().unwrap();

    let identity = state.identity.as_ref()
        .ok_or("No identity found")?;

    let pending_qr_data = state.pending_device_link_qr.as_ref()
        .ok_or("No pending device link. Generate a link QR first.")?;

    let saved_qr = DeviceLinkQR::from_data_string(pending_qr_data)
        .map_err(|e| format!("Invalid saved QR data: {:?}", e))?;

    if saved_qr.is_expired() {
        return Err("Device link QR has expired. Generate a new one.".to_string());
    }

    let registry = state.storage.load_device_registry()
        .map_err(|e| format!("Failed to load registry: {:?}", e))?
        .unwrap_or_else(|| identity.initial_device_registry());

    let initiator = identity.restore_device_link_initiator(registry, saved_qr);

    let encrypted_request = BASE64.decode(&request_data)
        .map_err(|_| "Invalid request data (not valid base64)".to_string())?;

    let (confirmation, request) = initiator.prepare_confirmation(&encrypted_request)
        .map_err(|e| format!("Failed to prepare confirmation: {:?}", e))?;

    // Store initiator and request for confirm step
    state.pending_initiator = Some(initiator);
    state.pending_link_request = Some(request);

    Ok(DeviceConfirmation {
        device_name: confirmation.device_name,
        confirmation_code: confirmation.confirmation_code,
        fingerprint: confirmation.identity_fingerprint,
    })
}
```

**Step 4: Implement confirm_device_link (new two-step version)**

```rust
#[derive(Serialize)]
pub struct DeviceLinkResponse {
    pub response_data: String,
}

#[tauri::command]
pub fn confirm_device_link_approved(
    state: State<'_, Mutex<AppState>>,
) -> Result<DeviceLinkResponse, String> {
    let mut state = state.lock().unwrap();

    let mut initiator = state.pending_initiator.take()
        .ok_or("No pending device link confirmation")?;
    let request = state.pending_link_request.take()
        .ok_or("No pending link request")?;

    // Set proximity verified (desktop uses manual confirmation code)
    initiator.set_proximity_verified();

    let (encrypted_response, updated_registry, _new_device) = initiator.confirm_link(&request)
        .map_err(|e| format!("Failed to confirm link: {:?}", e))?;

    state.storage.save_device_registry(&updated_registry)
        .map_err(|e| format!("Failed to save registry: {:?}", e))?;

    // Clear pending QR
    state.pending_device_link_qr = None;

    Ok(DeviceLinkResponse {
        response_data: BASE64.encode(&encrypted_response),
    })
}
```

**Step 5: Implement deny_device_link**

```rust
#[tauri::command]
pub fn deny_device_link(state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let mut state = state.lock().unwrap();
    state.pending_initiator = None;
    state.pending_link_request = None;
    state.pending_device_link_qr = None;
    Ok(())
}
```

**Step 6: Register all three commands in lib.rs**

**Step 7: Commit**

```bash
git commit -m "feat: split device link confirmation into prepare/confirm/deny"
```

---

### Task 3: Add Responder Confirmation Code Command

**Files:**

- Modify: `desktop/src-tauri/src/commands/devices.rs`
- Modify: `desktop/src-tauri/src/lib.rs`

**Step 1: Write failing test**

```rust
#[test]
fn test_get_join_confirmation_code_requires_pending_join() {
    // Should fail when no pending join exists
}
```

**Step 2: Implement get_join_confirmation_code**

This is trickier because the current `join_device` doesn't store the responder. Modify `PendingJoin` to include the request nonce (needed for confirmation code), then add:

```rust
#[derive(Serialize)]
pub struct JoinConfirmation {
    pub confirmation_code: String,
    pub fingerprint: String,
}

#[tauri::command]
pub fn get_join_confirmation_code(
    state: State<'_, Mutex<AppState>>,
) -> Result<JoinConfirmation, String> {
    let state = state.lock().unwrap();

    let pending_json = state.pending_device_join.as_ref()
        .ok_or("No pending device join")?;
    let pending: PendingJoin = serde_json::from_str(pending_json)
        .map_err(|_| "Invalid pending join state")?;

    let qr = DeviceLinkQR::from_data_string(&pending.qr_data)
        .map_err(|e| format!("Invalid QR data: {:?}", e))?;

    let mut responder = DeviceLinkResponder::from_qr(qr, pending.device_name.clone())
        .map_err(|e| format!("Failed to create responder: {:?}", e))?;

    // Recreate request to get nonce (needed for confirmation code)
    // Note: This regenerates a new nonce. To fix, store nonce in PendingJoin.
    let _ = responder.create_request()
        .map_err(|e| format!("Failed to create request: {:?}", e))?;

    let code = responder.compute_confirmation_code()
        .map_err(|e| format!("Failed to compute confirmation code: {:?}", e))?;
    let fingerprint = responder.identity_fingerprint();

    Ok(JoinConfirmation {
        confirmation_code: code,
        fingerprint,
    })
}
```

**Important:** The `PendingJoin` struct must store the request nonce so the confirmation code matches. Update `join_device` to serialize the nonce into the pending state.

**Step 3: Register and commit**

```bash
git commit -m "feat: add responder confirmation code command"
```

---

### Task 4: Add Relay Transport Commands

**Files:**

- Modify: `desktop/src-tauri/src/commands/devices.rs`
- Modify: `desktop/src-tauri/src/lib.rs`

The relay logic from `vauchi-mobile/src/device_link_relay.rs` uses `tokio-tungstenite` which desktop already depends on. We can either:

- (a) Copy the relay functions into the desktop crate
- (b) Add `vauchi-mobile` as a dependency (heavy — includes UniFFI)
- (c) Extract relay functions to `vauchi-core` (best long-term, but scope creep)

**Recommended:** (a) Copy the relay helpers into a new module `desktop/src-tauri/src/relay.rs`, adapted from `vauchi-mobile/src/device_link_relay.rs`.

**Step 1: Create relay module**

Create `desktop/src-tauri/src/relay.rs` with:

```rust
//! Device link relay transport for desktop.
//!
//! Adapted from vauchi-mobile/src/device_link_relay.rs.

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tokio_tungstenite::connect_async;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceLinkRelayMessage {
    pub target_identity: String,
    pub sender_token: String,
    pub payload: Vec<u8>,
}

/// Initiator: listen for device link request on relay.
/// Returns (encrypted_payload, sender_token).
pub async fn listen_for_request(
    relay_url: &str,
    identity_id: &str,
    timeout_secs: u64,
) -> Result<(Vec<u8>, String), String> {
    // Connect to relay WebSocket
    // Send: {"type": "device_link_listen", "identity_id": "<id>"}
    // Wait for incoming message with payload
    // Return (payload, sender_token)
    // ... (implement from vauchi-mobile reference)
    todo!()
}

/// Initiator: send encrypted response back via relay.
pub async fn send_response(
    relay_url: &str,
    sender_token: &str,
    response_payload: Vec<u8>,
) -> Result<(), String> {
    todo!()
}

/// Responder: send request and wait for response via relay.
pub async fn send_and_receive(
    relay_url: &str,
    message: &DeviceLinkRelayMessage,
    timeout_secs: u64,
) -> Result<Vec<u8>, String> {
    todo!()
}
```

**Step 2: Add Tauri async commands**

```rust
#[tauri::command]
pub async fn relay_listen_for_request(
    state: State<'_, Mutex<AppState>>,
) -> Result<String, String> {
    let (relay_url, identity_id) = {
        let state = state.lock().unwrap();
        let identity = state.identity.as_ref()
            .ok_or("No identity found")?;
        let relay_url = state.relay_url().to_string();
        let identity_id = hex::encode(identity.public_key());
        (relay_url, identity_id)
    };

    let (payload, sender_token) = crate::relay::listen_for_request(
        &relay_url, &identity_id, 300
    ).await?;

    // Store sender_token for send_response
    {
        let mut state = state.lock().unwrap();
        state.pending_sender_token = Some(sender_token);
    }

    Ok(BASE64.encode(&payload))
}

#[tauri::command]
pub async fn relay_send_response(
    response_data: String,
    state: State<'_, Mutex<AppState>>,
) -> Result<(), String> {
    let (relay_url, sender_token) = {
        let state = state.lock().unwrap();
        let relay_url = state.relay_url().to_string();
        let sender_token = state.pending_sender_token.clone()
            .ok_or("No pending sender token")?;
        (relay_url, sender_token)
    };

    let payload = BASE64.decode(&response_data)
        .map_err(|_| "Invalid base64")?;

    crate::relay::send_response(&relay_url, &sender_token, payload).await
}
```

Add similar `relay_send_request` and `relay_wait_for_response` for the responder side.

**Step 3: Add `pending_sender_token` to AppState**

**Step 4: Register commands and commit**

```bash
git commit -m "feat: add relay transport commands for device linking"
```

---

### Task 5: Frontend State Machine and Transport Selector

**Files:**

- Modify: `desktop/ui/src/pages/Devices.tsx`

**Step 1: Define state types and signal**

Replace the current dialog-based signals with a discriminated union state:

```typescript
type DeviceLinkState =
  | { step: 'idle' }
  | { step: 'selectTransport' }
  | { step: 'selectRole'; transport: 'relay' | 'offline' }
  | { step: 'generatingQR'; transport: 'relay' | 'offline' }
  | { step: 'waitingForRequest'; transport: 'relay' | 'offline'; qrData: string; qrSvg: string; fingerprint: string }
  | { step: 'confirmingDevice'; deviceName: string; confirmationCode: string; fingerprint: string }
  | { step: 'completing' }
  | { step: 'success'; deviceName: string }
  | { step: 'failed'; error: string }
  | { step: 'joinPaste'; transport: 'relay' | 'offline' }
  | { step: 'joinWaiting'; confirmationCode: string; fingerprint: string }
  | { step: 'joinSuccess'; displayName: string };
```

Replace existing signals:
```typescript
const [linkState, setLinkState] = createSignal<DeviceLinkState>({ step: 'idle' });
```

Remove: `showLinkDialog`, `showJoinDialog`, `linkData`, `joinData`, `joinMessage`, `isJoining`.

**Step 2: Build transport selector UI**

Replace the old dialog buttons with an inline section that renders based on `linkState()`:

```tsx
<Show when={linkState().step === 'selectTransport'}>
  <div class="link-flow" role="group" aria-label="Choose transport">
    <h3>{t('devices.link.choose_transport')}</h3>
    <button class="transport-option" onClick={() => setLinkState({ step: 'selectRole', transport: 'relay' })}>
      Link via Internet
    </button>
    <button class="transport-option" onClick={() => setLinkState({ step: 'selectRole', transport: 'offline' })}>
      Link Offline (QR Code)
    </button>
    <button class="small secondary" onClick={() => setLinkState({ step: 'idle' })}>
      {t('action.cancel')}
    </button>
  </div>
</Show>
```

**Step 3: Commit**

```bash
git commit -m "feat: add device linking state machine and transport selector"
```

---

### Task 6: Frontend Initiator Flow (QR Display + Confirmation)

**Files:**

- Modify: `desktop/ui/src/pages/Devices.tsx`

**Step 1: Implement QR generation step**

When user selects "Link new device" role, call `generate_device_link_qr`, then show QR:

```tsx
<Show when={linkState().step === 'waitingForRequest'}>
  <div class="link-flow qr-display">
    <h3>Scan this code on your new device</h3>
    <div class="qr-container" innerHTML={state.qrSvg} />
    <div class="qr-actions">
      <button class="small" onClick={copyQrData}>Copy Link Data</button>
      <p class="expiry-timer">Expires in {countdown()}s</p>
    </div>
    <p class="fingerprint">Fingerprint: {state.fingerprint}</p>
    <button class="secondary" onClick={cancel}>Cancel</button>
  </div>
</Show>
```

**Step 2: Implement relay listener**

After generating QR, start relay listener in background:

```typescript
const startInitiatorFlow = async (transport: 'relay' | 'offline') => {
  setLinkState({ step: 'generatingQR', transport });
  try {
    const result = await invoke<DeviceLinkQRResult>('generate_device_link_qr');
    setLinkState({
      step: 'waitingForRequest', transport,
      qrData: result.qr_data, qrSvg: result.qr_svg, fingerprint: result.fingerprint
    });

    if (transport === 'relay') {
      // Start listening for request in background
      const requestData = await invoke<string>('relay_listen_for_request');
      // Process the request
      const confirmation = await invoke<DeviceConfirmation>('prepare_device_confirmation', { requestData });
      setLinkState({
        step: 'confirmingDevice',
        deviceName: confirmation.device_name,
        confirmationCode: confirmation.confirmation_code,
        fingerprint: confirmation.fingerprint,
      });
    }
  } catch (e) {
    setLinkState({ step: 'failed', error: String(e) });
  }
};
```

**Step 3: Implement confirmation card**

```tsx
<Show when={linkState().step === 'confirmingDevice'}>
  <div class="link-flow confirmation-card">
    <h3>Confirm Device Link</h3>
    <p>Device: <strong>{state.deviceName}</strong></p>
    <div class="confirmation-code" aria-label="Confirmation code">
      {state.confirmationCode}
    </div>
    <p>Verify this code matches on your new device.</p>
    <div class="dialog-actions">
      <button class="primary" onClick={approveLink}>Approve</button>
      <button class="danger" onClick={denyLink}>Deny</button>
    </div>
  </div>
</Show>
```

**Step 4: Implement approve/deny handlers**

```typescript
const approveLink = async () => {
  setLinkState({ step: 'completing' });
  try {
    const result = await invoke<{ response_data: string }>('confirm_device_link_approved');
    // For relay: send response back
    await invoke('relay_send_response', { responseData: result.response_data });
    setLinkState({ step: 'success', deviceName: state.deviceName });
    refetch(); // refresh device list
  } catch (e) {
    setLinkState({ step: 'failed', error: String(e) });
  }
};
```

**Step 5: Commit**

```bash
git commit -m "feat: add initiator flow UI with QR display and confirmation"
```

---

### Task 7: Frontend Responder Flow (Join)

**Files:**

- Modify: `desktop/ui/src/pages/Devices.tsx`

**Step 1: Implement paste/input step**

```tsx
<Show when={linkState().step === 'joinPaste'}>
  <div class="link-flow join-paste">
    <h3>Join Existing Account</h3>
    <input type="text" placeholder="Device name" ... />
    <textarea placeholder="Paste link data from other device..." ... />
    <button class="primary" onClick={startJoin}>Join</button>
    <button class="secondary" onClick={cancel}>Cancel</button>
  </div>
</Show>
```

**Step 2: Implement join flow**

```typescript
const startJoin = async () => {
  try {
    const joinResult = await invoke<JoinStartResult>('join_device', {
      linkData: pasteData(), deviceName: deviceName()
    });
    if (!joinResult.success) {
      setLinkState({ step: 'failed', error: joinResult.message });
      return;
    }
    // Get confirmation code
    const confirmation = await invoke<JoinConfirmation>('get_join_confirmation_code');
    setLinkState({
      step: 'joinWaiting',
      confirmationCode: confirmation.confirmation_code,
      fingerprint: confirmation.fingerprint,
    });

    if (transport === 'relay') {
      // Send request via relay and wait for response
      await invoke('relay_send_request', { requestData: joinResult.request_data });
      const responseData = await invoke<string>('relay_wait_for_response');
      await invoke('finish_join_device', { responseData });
      setLinkState({ step: 'joinSuccess', displayName: '...' });
    }
  } catch (e) {
    setLinkState({ step: 'failed', error: String(e) });
  }
};
```

**Step 3: Show confirmation code while waiting**

```tsx
<Show when={linkState().step === 'joinWaiting'}>
  <div class="link-flow join-waiting">
    <h3>Waiting for Approval</h3>
    <div class="confirmation-code">{state.confirmationCode}</div>
    <p>Verify this code matches on your other device, then approve there.</p>
    <div class="spinner" />
  </div>
</Show>
```

**Step 4: Commit**

```bash
git commit -m "feat: add responder join flow with confirmation code"
```

---

### Task 8: Offline Multipart QR Flow

**Files:**

- Modify: `desktop/ui/src/pages/Devices.tsx`
- Modify: `desktop/src-tauri/src/commands/devices.rs` (add multipart QR commands)

**Step 1: Add backend multipart QR generation**

For payloads that exceed single QR capacity (~2KB), split into numbered frames:

```rust
#[derive(Serialize)]
pub struct MultipartQRFrame {
    pub frame_number: usize,
    pub total_frames: usize,
    pub svg: String,
}

#[tauri::command]
pub fn generate_multipart_qr(data: String) -> Result<Vec<MultipartQRFrame>, String> {
    let bytes = data.as_bytes();
    let chunk_size = 1500; // Safe QR capacity
    let chunks: Vec<&[u8]> = bytes.chunks(chunk_size).collect();
    let total = chunks.len();

    let frames: Vec<MultipartQRFrame> = chunks.iter().enumerate().map(|(i, chunk)| {
        let frame_data = format!("WBMP|{}|{}|{}", i + 1, total, BASE64.encode(chunk));
        MultipartQRFrame {
            frame_number: i + 1,
            total_frames: total,
            svg: generate_qr_svg(&frame_data),
        }
    }).collect();

    Ok(frames)
}
```

**Step 2: Add frontend multipart QR navigation**

```tsx
<Show when={isOfflineMultipart()}>
  <div class="multipart-qr">
    <p>Frame {currentFrame()} of {totalFrames()}</p>
    <div innerHTML={frames()[currentFrame() - 1].svg} />
    <div class="frame-nav">
      <button disabled={currentFrame() <= 1} onClick={() => setCurrentFrame(f => f - 1)}>Previous</button>
      <button disabled={currentFrame() >= totalFrames()} onClick={() => setCurrentFrame(f => f + 1)}>Next</button>
    </div>
  </div>
</Show>
```

**Step 3: Commit**

```bash
git commit -m "feat: add offline multipart QR display for device linking"
```

---

### Task 9: CSS Styling for Link Flow

**Files:**

- Modify: `desktop/ui/src/styles/app.css` (or wherever device styles live)

**Step 1: Add styles for linking flow components**

```css
.link-flow {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}

.qr-container svg {
  max-width: 280px;
  margin: var(--spacing-md) auto;
  display: block;
}

.confirmation-code {
  font-family: var(--font-mono);
  font-size: 2rem;
  letter-spacing: 0.15em;
  text-align: center;
  padding: var(--spacing-lg);
  background: var(--surface-secondary);
  border-radius: var(--border-radius);
  margin: var(--spacing-md) 0;
}

.transport-option {
  display: block;
  width: 100%;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  text-align: left;
}
```

**Step 2: Commit**

```bash
git commit -m "feat: add CSS styles for device linking flow"
```

---

### Task 10: i18n Keys

**Files:**

- Modify: `locales/en.json` (add `devices.link.*` keys)
- Modify: other locale files (de, fr, es) with placeholder translations

**Step 1: Add English locale keys**

```json
{
  "devices.link.choose_transport": "How do you want to link?",
  "devices.link.via_internet": "Link via Internet",
  "devices.link.via_offline": "Link Offline (QR Code)",
  "devices.link.choose_role": "What would you like to do?",
  "devices.link.role_initiator": "Link a new device to this account",
  "devices.link.role_responder": "Join this device to another account",
  "devices.link.scan_qr": "Scan this code on your new device",
  "devices.link.copy_data": "Copy Link Data",
  "devices.link.expires_in": "Expires in {seconds}s",
  "devices.link.confirm_title": "Confirm Device Link",
  "devices.link.confirm_device": "Device: {name}",
  "devices.link.confirm_code_match": "Verify this code matches on your new device",
  "devices.link.approve": "Approve",
  "devices.link.deny": "Deny",
  "devices.link.waiting_approval": "Waiting for approval on other device...",
  "devices.link.success": "Device linked successfully!",
  "devices.link.join_title": "Join Existing Account",
  "devices.link.paste_data": "Paste link data from your other device",
  "devices.link.device_name": "Name for this device",
  "devices.link.join_success": "Successfully joined! Run sync to fetch contacts.",
  "devices.link.frame_of": "Frame {current} of {total}"
}
```

**Step 2: Commit**

```bash
git commit -m "feat: add i18n keys for device linking flow"
```

---

### Task 11: Integration Testing and Cleanup

**Files:**

- Modify: `desktop/src-tauri/src/commands/devices.rs` (deprecate old `complete_device_link`)
- Modify: `desktop/ui/src/pages/Devices.tsx` (remove old dialog code)

**Step 1: Remove old dialog code from Devices.tsx**

Delete the `showLinkDialog`, `showJoinDialog` signals and their associated dialog overlays.

**Step 2: Mark old `complete_device_link` as deprecated**

```rust
#[deprecated(note = "Use prepare_device_confirmation + confirm_device_link_approved instead")]
```

**Step 3: Run full check**

```bash
cd desktop && cargo fmt --all -- --check && cargo clippy --all-targets -- -D warnings
cd desktop/ui && npm run build
```

**Step 4: Commit**

```bash
git commit -m "refactor: remove old dialog-based device linking, deprecate complete_device_link"
```

---

## Execution Notes

- Tasks 1-4 are backend (Rust), can be done sequentially
- Tasks 5-8 are frontend (TypeScript), depend on Tasks 1-4
- Tasks 9-10 are styling/i18n, can be done in parallel with Tasks 5-8
- Task 11 is cleanup, depends on everything else
- The relay module (Task 4) is the most complex — reference `vauchi-mobile/src/device_link_relay.rs` for the WebSocket protocol
- All frontend code goes in `Devices.tsx` — no new component files
