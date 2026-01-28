# Unmaintained Transitive Dependencies

**Date:** 2026-01-24
**Status:** Monitoring
**Affects:** vauchi-core, vauchi-mobile

## Overview

Three transitive dependencies have unmaintained warnings from `cargo audit`. These are **not direct dependencies** - they come from upstream crates (uniffi, tungstenite) and cannot be immediately replaced.

## Dependencies

### 1. bincode (v1.3.3)

**Advisory:** [RUSTSEC-2025-0141](https://rustsec.org/advisories/RUSTSEC-2025-0141)

| Attribute | Value |
|-----------|-------|
| Status | Unmaintained (January 2026) |
| Risk | Medium-High |
| Chain | `bincode → uniffi_macros → uniffi → vauchi-mobile` |
| Reason | Development ceased due to harassment incident |

**Alternatives:** postcard, bitcode, rkyv, wincode

**Action:** Monitor [uniffi releases](https://github.com/mozilla/uniffi-rs/releases) for migration away from bincode.

---

### 2. paste (v1.0.15)

**Advisory:** [RUSTSEC-2024-0436](https://rustsec.org/advisories/RUSTSEC-2024-0436)

| Attribute | Value |
|-----------|-------|
| Status | Unmaintained (October 2024) |
| Risk | Low-Medium |
| Chain | `paste → uniffi_core/uniffi_bindgen → uniffi → vauchi-mobile` |
| Reason | Repository archived, creator moved on |

**Alternative:** [pastey](https://crates.io/crates/pastey) (drop-in replacement)

**Action:** Monitor [uniffi releases](https://github.com/mozilla/uniffi-rs/releases) for migration to pastey.

---

### 3. rustls-pemfile (v2.2.0)

**Advisory:** [RUSTSEC-2025-0134](https://rustsec.org/advisories/RUSTSEC-2025-0134)

| Attribute | Value |
|-----------|-------|
| Status | Unmaintained (August 2025) |
| Risk | Low |
| Chain | `rustls-pemfile → rustls-native-certs → tungstenite → vauchi-core` |
| Reason | Functionality moved to rustls-pki-types |

**Alternative:** [rustls-pki-types](https://crates.io/crates/rustls-pki-types) (official migration path)

**Action:** Monitor [tungstenite releases](https://github.com/snapview/tungstenite-rs/releases) for rustls ecosystem updates.

---

## Risk Assessment

| Crate | Security Risk | Compatibility Risk | Action Required |
|-------|---------------|-------------------|-----------------|
| bincode | None known | Future Rust versions | No |
| paste | None known | Future Rust versions | No |
| rustls-pemfile | None known | Minimal (thin wrapper) | No |

All three crates have no known active vulnerabilities. The warnings are about future maintenance, not current security issues.

## Why We Cannot Replace Them

These are **transitive dependencies** from upstream crates:

1. **bincode & paste** come from Mozilla's [uniffi](https://github.com/mozilla/uniffi-rs) FFI framework
   - Replacing would require forking uniffi or switching FFI frameworks entirely
   - uniffi is critical for vauchi-mobile's Kotlin/Swift bindings

2. **rustls-pemfile** comes from [tungstenite](https://github.com/snapview/tungstenite-rs) WebSocket library
   - Part of the rustls TLS ecosystem
   - The ecosystem is actively migrating; updates expected

## Mitigation Strategy

### Immediate

- [x] Document the situation (this file)
- [ ] Ensure `cargo audit` runs in CI
- [ ] Add allowed advisories to `.cargo/audit.toml` with expiration dates

### Short-term (3-6 months)

- [ ] Subscribe to uniffi release notifications
- [ ] Subscribe to tungstenite release notifications
- [ ] Review when new versions are released

### Long-term (if upstream doesn't update)

- Evaluate alternative FFI frameworks (cbindgen, cxx, diplomat)
- Evaluate alternative WebSocket libraries (tokio-tungstenite may update separately)
- Fork upstream if necessary (last resort)

## Audit Configuration

To suppress known warnings while monitoring, add to `.cargo/audit.toml`:

```toml
[advisories]
ignore = [
    "RUSTSEC-2025-0141",  # bincode - via uniffi, monitoring upstream
    "RUSTSEC-2024-0436",  # paste - via uniffi, monitoring upstream
    "RUSTSEC-2025-0134",  # rustls-pemfile - via tungstenite, monitoring upstream
]
```

**Review quarterly** to check if upstream has addressed these.

## References

- [RUSTSEC-2025-0141: bincode unmaintained](https://rustsec.org/advisories/RUSTSEC-2025-0141)
- [RUSTSEC-2024-0436: paste unmaintained](https://rustsec.org/advisories/RUSTSEC-2024-0436)
- [RUSTSEC-2025-0134: rustls-pemfile unmaintained](https://rustsec.org/advisories/RUSTSEC-2025-0134)
- [uniffi-rs GitHub](https://github.com/mozilla/uniffi-rs)
- [tungstenite-rs GitHub](https://github.com/snapview/tungstenite-rs)
