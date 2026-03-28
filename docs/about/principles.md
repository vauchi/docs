<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

<!-- SSOT: This is the single source of truth for Vauchi principles and philosophy -->
# Vauchi Principles

**The single source of truth for core principles and philosophy.**

All solutions must be validated against these principles before implementation.

---

## Core Value Statement

Vauchi is built on five interlocking commitments:

### 1. Privacy is a right, not an option

All design starts with:
*"How would we build this if users were our only concern?"*

- E2E encryption for all communications
- Zero-knowledge relay (sees only encrypted blobs)
- No tracking, analytics, or telemetry
- User owns and controls their data

### 2. Trust is earned in person

Human recognition is the security anchor, not passwords or platforms.

- QR exchange with physical proximity verification for
  full trust; opt-in remote discovery at reduced trust
- No accounts or registration (device IS the identity)
- Social vouching for recovery (people you've actually met)
- No trust-on-first-use, no platform-mediated relationships

### 3. Quality grows from failure

Confidence through discipline. Strength from what hits it.

- Every failure leaves evidence that makes the next iteration
  smarter — errors become rules, rules become understanding
- Tests don't prove the system works; they reveal how it fails
  and preserve the evidence for the next cycle
- Property tests find edge cases you didn't imagine; E2E tests
  break when reality shifts; snapshot tests show exactly what
  changed — each failure is an input, not a defect
- Rejected approaches are preserved with reasoning — the immune
  memory of ideas that didn't work
- A decision that was overturned by better understanding is
  stronger than one that was never challenged
- TDD is the discipline; antifragility is the purpose —
  tidy first, test first, heal always

### 4. Simplicity serves the user

Vauchi respects your time and attention — it does one thing
well and stays out of your way.

- No engagement tricks, no notifications designed to pull you back
- Clear, minimal interface — useful without a learning curve
- Features earn their place by solving real problems, not adding complexity
- The app is a tool, not a destination

### 5. Beauty adapts to the user

Simplicity and beauty go hand in hand — and beauty is personal.

- Design that feels good without demanding attention
- Theming and customisation let users make it their own
- Aesthetic choices serve clarity, never compete with it
- A beautiful tool is one that fits the person using it

---

## Principle Categories

### Privacy Principles

| Principle | Statement |
|-----------|-----------|
| **User Ownership** | All data stored locally on device, encrypted, under user control |
| **Zero Knowledge** | Relay cannot decrypt content; sees only encrypted blobs and metadata |
| **No Harvesting** | No analytics, telemetry, location tracking, or advertising IDs |
| **No Sharing** | User data never shared with third parties |
| **Selective Visibility** | Users control per-field, per-contact visibility |

### Security Principles

| Principle | Statement |
|-----------|-----------|
| **Proximity Anchors Full Trust** | QR + BLE/ultrasonic required for full trust; opt-in remote contact at restricted visibility, no recovery/introduction privileges |
| **Audited Crypto Only** | RustCrypto audited crates primary (`ed25519-dalek`, `x25519-dalek`: Trail of Bits; `sha2`, `hmac`, `hkdf`: RustCrypto); `chacha20poly1305` and `argon2` spec-mandated; `aws-lc-rs` retained for TLS only (via rustls); no custom cryptography |
| **Forward Secrecy** | Double Ratchet ensures past messages safe if keys compromised |
| **Memory Safety** | Rust enforces safety; no unsafe in crypto paths |
| **Defense in Depth** | Multiple layers: encryption, signing, verification |

### Technical Principles

| Principle | Statement |
|-----------|-----------|
| **TDD Mandatory** | Tidy→Red→Green→Refactor. Tidy first, test first. No exceptions |
| **Antifragile Tests** | Tests reveal failure modes, not just correctness; the suite gets stronger from what it catches |
| **90%+ Coverage** | For vauchi-core; real crypto in tests (no mocking) |
| **Rust Core** | Memory safety, no GC, cross-platform compilation |
| **Clean Dependencies** | vauchi-core standalone; downstream repos use git deps |
| **Gherkin Traceability** | Features in `features/*.feature` drive test writing |

### UX Principles

| Principle | Statement |
|-----------|-----------|
| **Complexity Hidden** | Users see "scan QR, contact added"; encryption invisible |
| **In-Person Trust** | Human recognition is the security anchor |
| **Offline-First** | QR exchange works without connectivity |
| **Portable Identity** | No vendor lock-in; restore from backup, switch devices |
| **Cross-Platform Consistency** | Same experience on iOS, Android, desktop |

### Process Principles

| Principle | Statement |
|-----------|-----------|
| **Problem-First** | Every task starts as a problem; ideas restated as problems |
| **Artifacts Accumulate** | Investigation, rejected solutions, retrospectives attached to problems |
| **No Wasted Rejections** | Archive rejected solutions with reasoning — immune memory |
| **Failures Become Structure** | Errors become rules, rules become understanding |
| **Small Atomic Commits** | After each green, after each refactor |
| **Retrospective Required** | Learn from every completed problem |

---

## Using These Principles

### For Solution Validation

When evaluating a proposed solution, check:

1. **Does it align with Core Principles?**
   (Privacy, Trust, Quality, Simplicity, Beauty)
2. **Does it fit the Culture?**
   (Process Principles)
3. **Is it compatible with Current Implementation?**
   (Technical Principles)
4. **Does it support existing Features?**
   (UX Principles)

If a solution conflicts with any principle, it must be
rejected with documented reasoning.

### For Decision Making

When facing a design decision:

1. Start with the user's perspective
2. Assume adversarial conditions (what could go wrong?)
3. Choose the option that best upholds all five core values
4. Document the decision and rationale

### For New Contributors

Read these principles before contributing. They are
non-negotiable. If you disagree with a principle, open a
problem record to discuss changing it — don't ignore it.

---

## Amending Principles

Principles can be amended, but only through the Problem Workflow:

1. Create a problem record explaining why the principle should change
2. Investigate impact across codebase and documentation
3. Validate the change against remaining principles
4. Implement with full retrospective

Principles are not immutable, but changes must be deliberate and documented.
