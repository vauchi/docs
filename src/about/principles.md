<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

<!-- SSOT: This is the single source of truth
for Vauchi principles and philosophy -->
# Vauchi Principles

**The single source of truth for core principles and philosophy.**

All solutions must be validated against these principles before implementation.

---

## Core Value Statement

Vauchi is built on five interlocking commitments:

### 1. Privacy is a right, not an option

All design starts with:
*"How would we build this if users were our only
concern?"*

- E2E encryption for all communications
- Zero-knowledge relay (sees only encrypted blobs)
- No tracking, analytics, or telemetry
- User owns and controls their data

### 2. Trust is earned in person

Human recognition is the security anchor, not passwords or platforms.

- QR exchange with physical proximity verification
  for full trust; opt-in remote discovery at
  reduced trust
- No accounts or registration (device IS the identity)
- Social vouching for recovery (people you've actually met)
- No trust-on-first-use for contact
  verification — you verify contacts in person.
  Relay server identity is pinned during contact
  exchange. No platform-mediated relationships

### 3. Quality comes from rigorous methodology

Confidence through discipline, not hope.

- Test-Driven Development (TDD) is mandatory
- Problem-first workflow with full traceability
- Threat modeling drives security decisions
- No hacks, no tech debt, no ignored tests

### 4. Simplicity serves the user

Vauchi respects your time and attention — it does
one thing well and stays out of your way.

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
|---|---|
| **User Ownership** | Data stored locally, encrypted, user-controlled |
| **Zero Knowledge** | Relay sees only encrypted blobs, not content |
| **No Harvesting** | No analytics, telemetry, or tracking |
| **No Sharing** | Data never shared with third parties |
| **Selective Visibility** | Per-field, per-contact visibility control |

### Security Principles

| Principle | Statement |
|---|---|
| **Proximity Full Trust** | QR + BLE/ultrasonic; remote restricted |
| **Audited Crypto Only** | RustCrypto audited crates; no custom crypto |
| **Forward Secrecy** | Double Ratchet; past messages safe if keys leak |
| **Memory Safety** | Rust enforced; no unsafe in crypto paths |
| **Defense in Depth** | Multiple layers: encryption, signing, verification |

### Technical Principles

| Principle | Statement |
|---|---|
| **TDD Mandatory** | Tidy, Red, Green, Refactor. Test first. No exceptions |
| **90%+ Coverage** | For vauchi-core; real crypto in tests (no mocking) |
| **Rust Core** | Memory safety, no GC, cross-platform compilation |
| **Clean Deps** | vauchi-core standalone; downstream uses git deps |
| **Gherkin Trace** | `features/*.feature` files drive test writing |

### UX Principles

| Principle | Statement |
|---|---|
| **Complexity Hidden** | Users see "scan QR, contact added" |
| **In-Person Trust** | Human recognition is the security anchor |
| **Local-First** | Data on device; queues offline, syncs on connect |
| **Portable Identity** | No lock-in; restore from backup, switch devices |
| **Cross-Platform** | Same experience on iOS, Android, desktop |

### Process Principles

| Principle | Statement |
|---|---|
| **Problem-First** | Every task starts as a problem |
| **Artifacts Accumulate** | Investigations and retrospectives attached |
| **No Wasted Rejections** | Archive rejected solutions with reasoning |
| **Small Atomic Commits** | After each green, after each refactor |
| **Retrospective Required** | Learn from every completed problem |

---

## Using These Principles

### For Solution Validation

When evaluating a proposed solution, check:

1. **Does it align with Core Principles?**
   (Privacy, Trust, Quality, Simplicity, Beauty)
2. **Does it fit the Culture?** (Process Principles)
3. **Is it compatible with Current Implementation?** (Technical Principles)
4. **Does it support existing Features?** (UX Principles)

If a solution conflicts with any principle, it must
be rejected with documented reasoning.

### For Decision Making

When facing a design decision:

1. Start with the user's perspective
2. Assume adversarial conditions (what could go wrong?)
3. Choose the option that best upholds all five core values
4. Document the decision and rationale

### For New Contributors

Read these principles before contributing. They are
non-negotiable. If you disagree with a principle,
open a problem record to discuss changing
it—don't ignore it.

---

## Amending Principles

Principles can be amended, but only through the Problem Workflow:

1. Create a problem record explaining why the principle should change
2. Investigate impact across codebase and documentation
3. Validate the change against remaining principles
4. Implement with full retrospective

Principles are not immutable, but changes must be deliberate and documented.
