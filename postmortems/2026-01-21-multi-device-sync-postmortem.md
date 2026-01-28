<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Post-Mortem: Multi-Device Sync Failure

**Date**: 2026-01-21
**Severity**: P0 - BLOCKER
**Status**: Partially Fixed / Ongoing
**Author**: Claude Code

---

## Executive Summary

Multi-device contact synchronization has **two separate issues**:

1. **Initial Sync (at link time)** - FIXED
   - When linking a new device AFTER contacts exist, contacts weren't transferred
   - Fixed in CLI `device.rs` - now uses `process_request_with_sync()`

2. **Ongoing Sync (after link)** - NOT IMPLEMENTED
   - When contacts are exchanged AFTER devices are linked, they don't sync
   - CLI `sync` command only handles user-to-user sync, not device-to-device sync
   - **This is the E2E test failure root cause**

---

## Timeline

| Time | Event |
|------|-------|
| Unknown | Initial sync bug introduced |
| Unknown | Inter-device sync never implemented in CLI |
| 2026-01-21 | E2E tests discovered the issue |
| 2026-01-21 | Root causes identified (2 separate issues) |
| 2026-01-21 | Issue 1 fixed (initial sync at link time) |
| 2026-01-21 | Issue 2 documented (ongoing inter-device sync)

---

## Impact

### Affected Functionality
- **100% of multi-device scenarios** where contacts were exchanged before device linking
- Users linking a second phone, tablet, or desktop will have empty contact lists
- Device linking appears to succeed but provides no actual data sync

### User Experience Impact
- Users expect linked devices to show the same contacts
- Current behavior: "Linked successfully" but empty contacts
- Trust impact: Users may think they lost their contacts

### Scope
- All platforms: iOS, Android, Desktop, CLI
- All contact types: Every contact exchanged on primary device

---

## Root Cause Analysis

### Primary Cause: Incomplete CLI Implementation

The CLI has two bugs in `cli/src/commands/device.rs`:

#### Bug 1: Sync payload not generated during `device complete`

```rust
// Line 250 - ACTUAL (broken)
let (encrypted_response, updated_registry, new_device) =
    initiator.process_request(&encrypted_request)?;

// EXPECTED
let sync_payload = create_sync_payload(&wb)?;
let sync_json = serde_json::to_string(&sync_payload)?;
let (encrypted_response, updated_registry, new_device) =
    initiator.process_request_with_sync(&encrypted_request, &sync_json)?;
```

The core library provides `process_request_with_sync()` specifically for this purpose, but the CLI calls `process_request()` instead.

#### Bug 2: Sync payload not applied during `device finish`

```rust
// Lines 330-338 - ACTUAL (broken)
if !response.sync_payload_json().is_empty() {
    if let Ok(payload) = DeviceSyncPayload::from_json(response.sync_payload_json()) {
        display::info(&format!(
            "Received {} contacts from existing device.",
            payload.contact_count()
        ));
        // MISSING: orchestrator.apply_full_sync(payload)?;
    }
}
```

The payload is parsed and a message is displayed, but the contacts are never saved to storage.

### Contributing Factors

1. **Missing integration test**: No CLI-level test verifies the full device linking flow with contacts
2. **Core tests pass**: The core library has comprehensive tests for sync, but CLI integration wasn't tested
3. **Manual testing gap**: Manual testing likely used fresh identities without pre-existing contacts
4. **Silent failure**: The CLI displays success messages even though sync doesn't work

---

## Detection

### How it was found
- E2E test `test_contact_sync_across_devices` failed
- Alice device 1 had 0 contacts after linking (expected: same contacts as device 0)

### Why it wasn't caught earlier
1. Core library tests pass (they test sync logic in isolation)
2. CLI unit tests don't cover the full device linking flow
3. Manual testing typically uses fresh identities
4. No automated E2E tests were running until now

---

## Remediation

### Immediate Fix (This Session)

1. Update `cli/src/commands/device.rs:complete()`:
   - Create `DeviceSyncOrchestrator`
   - Call `create_full_sync_payload()`
   - Use `process_request_with_sync()` instead of `process_request()`

2. Update `cli/src/commands/device.rs:finish()`:
   - Create `DeviceSyncOrchestrator`
   - Call `apply_full_sync()` with received payload

### Verification

```bash
# These tests should pass after fix:
just e2e-run test_contact_sync_across_devices
just e2e-run test_five_user_full_exchange
just e2e-run test_mixed_device_count_exchange
```

---

## Prevention

### Short-term (This Sprint)
- [x] Fix initial sync during device linking (DONE)
- [ ] Implement inter-device sync in CLI sync command
- [ ] Add CLI integration test for device linking with contacts
- [ ] Add E2E tests to CI pipeline

### Long-term
- [ ] Add mobile app tests for device linking
- [ ] Create manual QA checklist that includes multi-device with contacts
- [ ] Consider adding sync status indicator in UI

---

## Issue 2: Inter-Device Sync (NOT IMPLEMENTED)

### Problem

When devices are linked FIRST and then contacts are exchanged on one device, those contacts do not sync to other linked devices. This is because the CLI `sync` command only handles:
- Exchange messages (user-to-user contact requests)
- Card updates (user-to-user card field changes)

It does NOT implement:
- Device-to-device sync within the same identity
- Syncing contacts added on one device to other linked devices

### Required Implementation

The `cli/src/commands/sync.rs` needs to:

1. When a contact is added on device A:
   - Create a `SyncItem::ContactAdded` using `DeviceSyncOrchestrator`
   - Push this to the relay for other devices

2. When syncing on device B:
   - Check for inter-device sync items from the relay
   - Apply them using `DeviceSyncOrchestrator::apply_full_sync()` or similar

### Architecture Gap

The core library (`vauchi-core`) has the infrastructure:
- `DeviceSyncOrchestrator` - manages sync state between devices
- `SyncItem` - represents changes (ContactAdded, CardUpdated, etc.)
- `InterDeviceSyncState` - tracks what's synced to each device

But the CLI doesn't use this infrastructure during `vauchi sync`.

### Files to Modify

1. `cli/src/commands/sync.rs` - Add inter-device sync logic
2. `cli/src/commands/exchange.rs` - Record contact additions as sync items
3. Possibly need relay changes to support device-to-device messaging

---

## Lessons Learned

### What went well
- Core library implementation is correct and well-tested
- E2E testing infrastructure caught the bug
- Root cause was easy to identify once tests failed

### What went wrong
- CLI integration was assumed to work if core works
- No tests verified the CLI-to-core integration for this feature
- "Happy path" manual testing missed the case of linking after exchanges

### Action Items
1. **Testing**: Every CLI command that uses core features needs integration tests
2. **Code Review**: Check that CLI uses the correct method variants (e.g., `_with_sync`)
3. **Documentation**: Document when to use `process_request` vs `process_request_with_sync`

---

## Appendix

### Affected Tests
- `test_contact_sync_across_devices` - FAIL
- `test_five_user_full_exchange` - FAIL
- `test_mixed_device_count_exchange` - FAIL

### Passing Tests (verify core works)
- `test_device_link_with_full_sync_payload` (core library)
- `test_orchestrator_create_full_sync_payload` (core library)
- `test_orchestrator_apply_full_sync` (core library)

### Files to Modify
- `cli/src/commands/device.rs`

### References
- Core sync implementation: `core/vauchi-core/src/sync/device_orchestrator.rs`
- Device link protocol: `core/vauchi-core/src/exchange/device_link.rs`
