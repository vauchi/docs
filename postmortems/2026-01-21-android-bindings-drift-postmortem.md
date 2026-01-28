# Post-Mortem: Android UniFFI Bindings Drift

**Date**: 2026-01-21
**Severity**: HIGH (blocked Android builds)
**Duration**: Unknown start → 2026-01-21 (discovered and fixed)

## Summary

Android builds failed because UniFFI-generated Kotlin bindings were missing 19 out of 22 types, including critical types like `MobileSyncResult`, `MobileContact`, `MobileRecoveryClaim`, etc. iOS bindings were unaffected.

## Root Causes

### 1. Primary: Symbol Stripping Removed UniFFI Metadata

When building the native library for binding generation, Rust's release profile strips symbols by default. UniFFI embeds type metadata as special symbols (e.g., `UNIFFI_META_VAUCHI_MOBILE_*`). Stripping removes these symbols, causing `uniffi-bindgen --library` to extract **empty metadata**.

**Evidence**:
```bash
# Before fix (stripped)
$ nm -g target/release/libvauchi_mobile.so
nm: target/release/libvauchi_mobile.so: no symbols

$ cargo run --bin uniffi-bindgen -- print-repr target/release/libvauchi_mobile.so
[]  # Empty!

# After fix (unstripped)
$ RUSTFLAGS="-Cstrip=none" cargo build --release
$ cargo run --bin uniffi-bindgen -- print-repr target/release/libvauchi_mobile.so
[Namespace(...), Record(MobileContact...), ...]  # All types present
```

### 2. Secondary: Inconsistent Generation Approaches

| Platform | Method | Result |
|----------|--------|--------|
| iOS | `--library libvauchi_mobile.a` | Works (static libs preserve metadata) |
| Android | UDL file + `--lib-file` | Only types in UDL file (outdated) |

The build script used different approaches:
- **iOS**: Used `--library` flag which extracts metadata from compiled library
- **Android**: Used outdated UDL file as primary source

### 3. Tertiary: Gitignore Policy Mismatch

| Repo | Bindings Tracked | Effect |
|------|-----------------|--------|
| iOS | Yes (committed) | Bindings stay in sync |
| Android | No (gitignored) | Each dev must regenerate locally |

```gitignore
# android/.gitignore line 17:
app/src/main/kotlin/uniffi/  # Bindings are gitignored!
```

## Timeline

1. **Unknown date**: UDL file created with subset of types
2. **Later commits**: New types added via proc-macros (not in UDL)
3. **2026-01-20**: iOS bindings regenerated with `--library` (worked)
4. **2026-01-21**: Android build attempted → failed
5. **2026-01-21**: Root cause identified and fixed

## Impact

- Android app could not compile
- Blocked mobile testing (Task 05)
- Delayed MVP timeline

## Fix Applied

### 1. Regenerated Android bindings with unstripped library
```bash
RUSTFLAGS="-Cstrip=none" cargo build -p vauchi-mobile --release
cargo run --bin uniffi-bindgen -- generate \
    --library target/release/libvauchi_mobile.so \
    --language kotlin \
    --out-dir ../android/app/src/main/kotlin/
```

**Result**: 2,184 lines → 5,393 lines (19 missing types restored)

### 2. Updated build-bindings.sh
- Added `RUSTFLAGS="-Cstrip=none"` to preserve metadata
- Changed Android generation to use `--library` mode (matching iOS)

### 3. Fixed Android code API changes
- `MobileProximityVerifier.new(handler)` → `MobileProximityVerifier(handler)`
- `challenge.toList()` → `challenge` (ByteArray directly)
- `response.toByteArray()` → `response` (already ByteArray)

## Prevention

### Immediate Actions (Completed 2026-01-21)
- [x] Add CI check: `lint:bindings` job in `.gitlab-ci.yml`
- [x] Track Android bindings in git: Updated `android/.gitignore`
- [x] Add validation script: `code/scripts/validate-bindings.sh`

### Long-term Recommendations (Completed 2026-01-21)

1. **Unify gitignore policy**: Android bindings now tracked (matching iOS)
2. **Add binding validation test**: `validate-bindings.sh` checks expected types
3. **Document binding workflow**: Added to `docs/CONTRIBUTING.md`
4. **Remove UDL file**: Renamed to `.deprecated`, all types now proc-macro-based

### Remaining Work
- [x] Regenerate iOS bindings on macOS (completed 2026-01-21 via macos-remote.sh)

## Lessons Learned

1. **Symbol stripping breaks UniFFI metadata extraction** - Always use `-Cstrip=none` when building for binding generation
2. **Inconsistent approaches across platforms cause drift** - Use same generation method for all platforms
3. **Gitignored generated files can silently diverge** - Either track them or add CI validation

## References

- UniFFI proc-macro docs: https://mozilla.github.io/uniffi-rs/proc_macro/index.html
- Fix commit: (pending)
- Related issue: Task 05 (Mobile Tests) was blocked by this
