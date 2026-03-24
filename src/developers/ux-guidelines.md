<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

<!-- SSOT: This is the single source of truth for UX interaction guidelines -->
# UX Interaction Guidelines

**Cross-platform interaction rules for all vauchi clients — smartphones, dumb-phones, smartwatches, tablets, laptops, desktops (Windows, macOS, Linux, Android, iOS).**

These rules enforce [Principle 4: Simplicity serves the user](../about/principles.md#4-simplicity-serves-the-user) and [Principle 2: Trust is earned in person](../about/principles.md#2-trust-is-earned-in-person). For component-level behavior (toasts, inline editing, confirmations), see the sibling document [GUI Design Guidelines](gui-guidelines.md).

---

## Philosophy

Four commitments shape every interaction in vauchi:

1. **Don't make me think** — Every screen is self-explanatory. If a user pauses to figure out what to do, the design has failed.
2. **Keep the user informed** — Always show what's happening, what just happened, and what comes next.
3. **Success paths are straight lines** — Primary flows have no forks, no optional detours, no "you can also..." on the main screen.
4. **Simple views, few transitions** — Each view does one thing well. Don't bounce users between screens when content can update in place.

These are not aspirations — they are constraints. Designs that violate them must be reworked.

---

## The Rules

### UX-01: Physical Device First

Prefer real-world device interaction over typing, pasting, or link sharing. Vauchi's trust model is built on physical proximity — the UX must reflect that.

| Scenario | Wrong | Right |
|----------|-------|-------|
| Contact exchange (phone ↔ phone) | Copy a code, paste in app | Hold phones together, scan QR |
| Contact exchange (phone ↔ laptop) | Type a code on laptop | Point phone camera at laptop screen QR |
| NFC-capable devices | Share a link | Tap devices together |
| BLE proximity | Manual pairing flow | Automatic discovery, confirm on both devices |

**On devices without cameras or NFC** (some desktops, dumb-phones without camera, CLI): fall back to the simplest available method (display QR for the other device to scan, or paste a one-time code). The device with more hardware capabilities drives the interaction.

**On smartwatches:** the watch displays a QR code; the other person's phone scans it. Watches don't drive complex flows — they companion with the paired phone for setup and editing.

**Why:** Physical actions are faster, harder to phish, and align with Principle 2 (trust is earned in person). Copy-paste is error-prone and trains users to move secrets through clipboards.

---

### UX-02: Zero-Instruction Screens

If a screen needs written instructions to be understood, redesign it. Labels, icons, layout, and context must be self-evident.

- Button labels state the action: "Add Contact", not "Submit"
- Icons have text labels on first encounter (icon-only after familiarity)
- Empty states explain what goes here and how to start: "No contacts yet. Scan a QR code to add one."
- Error states say what went wrong and what to do (see UX-07)

**Exceptions:** Security-critical screens (identity wipe, recovery) may include a short warning. This is a safety message, not an instruction.

**Why:** Users scan, they don't read. Instructions are ignored or cause hesitation. Self-evident design eliminates both problems.

---

### UX-03: Show State, Not Chrome

Screen real estate belongs to the user's data and current status. Decorative elements, branding, and navigation chrome are subordinate.

- Contact list shows contacts, not app branding
- Exchange screen shows the camera viewfinder or QR code — not a toolbar and a sidebar
- Status indicators (syncing, connected, offline) are compact and contextual
- On small screens (phones, watches), chrome compresses or hides entirely during focused tasks

**Why:** Users open vauchi to do something with their contacts, not to admire the app. Every pixel of chrome competes with the content they came for.

---

### UX-04: One Happy Path

Primary flows (onboarding, exchange, editing a contact) have exactly one path forward. Alternatives, advanced options, and edge cases are hidden until needed.

- Onboarding: one screen at a time, one action per screen, linear progression
- Exchange: scan → confirm → done. No "choose your method" screen unless the device supports multiple methods
- Settings: grouped by topic, expanded on demand (progressive disclosure per [UI-04](gui-guidelines.md#ui-04-progressive-disclosure))

**When multiple hardware methods exist** (QR + NFC + BLE on a phone): auto-select the best available method. Show alternatives only on failure or explicit user request — not as a decision tree at the start.

**Why:** Every fork in the path is a decision point. Decisions cost attention. One clear path is faster and less stressful than three options with no clear winner.

---

### UX-05: Progress Is Always Visible

Multi-step flows show where the user is, where they've been, and how many steps remain.

- Step indicators: "Step 2 of 4" or a progress bar — not just the current screen
- Completed steps show a checkmark or similar confirmation
- The final step clearly signals completion ("Your identity is ready", not just returning to a blank home screen)
- Long operations (sync, key generation) show a progress indicator with context: "Generating keys..." not just a spinner

**On desktop and laptop:** larger screens can show a step sidebar or breadcrumb trail. On phones, a compact progress bar or step counter at the top suffices.

**Why:** Users abandon flows when they can't tell how much is left. Visible progress reduces anxiety and drop-off.

---

### UX-06: Transitions Are Earned

Don't navigate to a new screen when content can update in place. Screen changes are only for genuinely new contexts.

| Situation | Wrong | Right |
|-----------|-------|-------|
| Edit a contact field | Navigate to edit screen | Field becomes editable in place ([UI-03](gui-guidelines.md#ui-03-inline-over-overlay)) |
| Show exchange result | New "success" screen | Contact appears in list, toast confirms ([UI-01](gui-guidelines.md#ui-01-no-dialogs-for-reversible-actions)) |
| Toggle a setting | Navigate to sub-page | Toggle updates in place |
| View contact details | New screen | Expand contact card in list (phone), or side panel (desktop/laptop) |

**When a transition is appropriate:** navigating to a genuinely different context (contact list → exchange camera), entering a multi-step flow (settings → identity wipe confirmation), or switching between top-level sections.

**Desktop/laptop consideration:** larger screens should use split views, side panels, and in-place expansion more aggressively. A phone might navigate to a contact detail screen; a laptop should show it alongside the list.

**Why:** Every screen transition resets the user's spatial context. Frequent transitions create disorientation and make the app feel heavier than it is.

---

### UX-07: Errors Name the Fix

Every error message tells the user what happened and what they can do about it. Generic errors are forbidden.

| Wrong | Right |
|-------|-------|
| "Something went wrong" | "Camera permission denied. Open Settings → Privacy → Camera to allow vauchi." |
| "Network error" | "Can't reach the relay. Your changes are saved and will sync when you're back online." |
| "Invalid QR" | "This QR code isn't a vauchi contact card. Ask the other person to open vauchi and show their code." |
| "Exchange failed" | "Couldn't complete the exchange. Move closer and try again." |

**Structure:** `[What happened]. [What to do about it].` — two sentences, no jargon.

**Offline context:** When offline, never show errors for things that will work later. Instead, show status: "Saved locally. Will sync when connected."

**Why:** An error without a fix is a dead end. Users can't solve "something went wrong" — they can solve "move closer and try again."

---

### UX-08: Offline and In-Person First

QR exchange, contact viewing, and card editing work without network connectivity. The app never blocks on a network call for local operations.

- Exchange: QR generation and scanning are fully local. BLE/NFC are local. No server round-trip needed.
- Contact list and card details: always available from local storage
- Editing own card: immediate, local. Sync happens when connectivity returns.
- Sync status: shown as a subtle indicator, never as a blocking state

**What requires connectivity:** relay sync (pushing updates to contacts), recovery voucher upload, relay registration. These are background operations — never in the critical path of a user action.

**On laptops and desktops:** the same rules apply. A desktop user editing their card on a train without WiFi should have the same experience as someone on a connected phone.

**Why:** Vauchi's trust model is in-person. Two people standing next to each other should never see "Connecting..." when exchanging contacts. Local-first is both a UX and a security principle.

---

### UX-09: Hardware Guides the Flow

When the device's hardware is active (camera, NFC, BLE), the hardware's output IS the primary UI. Don't cover it with chrome.

- **Camera (QR scan):** viewfinder fills the available space. A subtle frame or overlay guides alignment — nothing more.
- **NFC:** the system's NFC animation (iOS tap indicator, Android NFC dialog) is the feedback. The app shows a brief "Hold near the other device" prompt, then gets out of the way.
- **BLE discovery:** show a compact list of nearby devices as they appear. No full-screen takeover.

**On devices without hardware** (desktop without camera, CLI): clearly communicate the fallback. "Display this QR code on your screen — the other person scans it with their phone."

**Desktop with camera:** the same camera-fills-the-space rule applies. A laptop scanning a phone's QR should show the webcam feed prominently, not buried in a small widget.

**Why:** Hardware feedback is immediate and real. Overlaying it with app UI creates competition for attention. Let the camera be the camera.

---

### UX-10: Reachability Drives Layout

Primary actions sit where the user can reach them without effort. On touch devices, this is the thumb zone. On desktop and laptop, this is the main content area and keyboard shortcuts.

**Smartphones and tablets:**

- Primary actions: bottom of screen, center or dominant-hand side
- Navigation: bottom tab bar or swipe gestures
- Destructive/rare actions: top of screen or behind a menu — require deliberate reach
- Minimum tap targets: 44×44pt (iOS) / 48×48dp (Android)

**Smartwatches:**

- One primary action per screen — crown or single tap to confirm
- Scrollable vertical list for navigation — no side menus or tabs
- Minimal text — icons and short labels only
- Destructive actions require crown press-and-hold or companion app

**Dumb-phones (KaiOS):**

- D-pad navigation — primary action on center/select key
- Soft keys at bottom for contextual actions (left = back, right = options)
- No gestures — every action reachable via key presses

**Desktop and laptop (Windows, macOS, Linux):**

- Primary actions: prominent buttons in the main content area, keyboard shortcuts for frequent actions
- Navigation: sidebar or top bar — persistent, not hidden behind a hamburger menu
- Destructive/rare actions: behind a menu or at the end of a settings list
- Keyboard accessibility: every action reachable without a mouse

**Why:** Frequent actions that are hard to reach feel heavy. Destructive actions that are easy to reach cause accidents. Layout should match action frequency and risk.

---

## Applying the Rules

### For New Flows

Before designing a new user flow, answer:

1. Can this be done with a **physical device action** instead of typing? (UX-01)
2. Does every screen **explain itself** without instructions? (UX-02)
3. Is there **one clear path** forward? (UX-04)
4. Does the user always know **where they are** in the flow? (UX-05)
5. Can any screen transition be **replaced with an in-place update**? (UX-06)
6. Does it work **offline**? If not, why not? (UX-08)

### For Existing Flows

When modifying an existing flow, check whether it violates any rule. Fix violations in a separate commit — don't mix UX fixes with feature work (same as [GUI guidelines](gui-guidelines.md#for-existing-screens)).

### For Code Review

Reviewers should check:

- [ ] Physical interaction preferred over manual input where hardware allows
- [ ] No screens require reading instructions to understand
- [ ] Primary flow has one path, no unnecessary forks
- [ ] Multi-step flows show progress
- [ ] Screen transitions only for genuinely new contexts
- [ ] Errors include what happened and what to do
- [ ] Core operations work offline
- [ ] Hardware UI (camera, NFC) not obscured by app chrome
- [ ] Primary actions in easy-reach zones per platform

---

## Platform Adaptation

These rules apply to all platforms, but implementation adapts:

| Concept | Smartphone | Dumb-phone (KaiOS) | Smartwatch | Tablet | Laptop/Desktop | CLI/TUI |
|---------|------------|-------------------|------------|--------|----------------|---------|
| **QR exchange** | Camera viewfinder | Camera viewfinder | Display QR (no camera) | Camera viewfinder | Webcam or display QR for phone to scan | Display QR in terminal (ASCII/sixel) |
| **NFC/BLE** | Native hardware | NFC if available | NFC tap | Native hardware | USB NFC reader (if available) | Not applicable — QR fallback |
| **Progress** | Top progress bar | Step counter | Minimal step dots | Top progress bar | Step sidebar or breadcrumb | Step counter: `[2/4]` |
| **Reachability** | Thumb zone (bottom) | D-pad center/select | Crown/single button | Thumb zone (bottom) | Main content area + shortcuts | Command-line arguments |
| **Inline editing** | Tap to edit | Select to edit | Not applicable — voice or companion app | Tap to edit | Click to edit, Enter to save | Not applicable — command-based |
| **Split views** | Full-screen navigation | Full-screen navigation | Single view only | Side panel + list | Side panel + list | Not applicable |

---

## Relationship to Other Documents

- **[GUI Design Guidelines](gui-guidelines.md):** Component-level behavior — how toasts, inline confirmations, and inline editing work. UX guidelines say *when* to use them; GUI guidelines say *how* they behave.
- **[Principles](../about/principles.md):** Philosophical foundation. UX guidelines are the practical application of Principles 2 (trust in person) and 4 (simplicity serves the user).
- **ADR-022 (Core-driven UI):** UX guidelines inform what `WorkflowEngine` implementations should produce; ADR-022 defines the mechanism. See the internal Architecture Decision Records for details.

---

## Decision Record

These guidelines were adopted on 2026-03-10 based on:

- Analysis of vauchi's physical-first trust model and multi-platform architecture
- [Steve Krug: Don't Make Me Think](https://sensible.com/dont-make-me-think/) — self-evident design, scanning over reading
- [Nielsen Norman Group: Visibility of System Status](https://www.nngroup.com/articles/visibility-system-status/) — keep users informed
- [Interaction Design Foundation: Progressive Disclosure](https://www.interaction-design.org/literature/topics/progressive-disclosure) — one happy path
- [Apple HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout) — thumb zone and reachability
- [Google Material Design: Navigation](https://m3.material.io/foundations/navigation/overview) — transition frequency
- [Smashing Magazine: Privacy UX](https://www.smashingmagazine.com/2019/04/privacy-ux-aware-design-framework/) — privacy-first interaction patterns
