<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

<!-- SSOT: This is the single source of truth for GUI design guidelines -->
# GUI Design Guidelines

**Cross-platform design rules for all vauchi client
interfaces — smartphones, dumb-phones,
smartwatches, tablets, laptops, desktops (Windows,
macOS, Linux, Android, iOS).**

These rules enforce [Principle 4: Simplicity
serves the user][p4] — vauchi stays out of your
way. All GUI
contributions must follow these guidelines. For
interaction-level guidelines (flows, physical device
usage, navigation philosophy), see the sibling
document
[UX Interaction Guidelines](ux-guidelines.md).

---

## Problem Statement

Modal dialogs and confirmation popups interrupt user
flow. Every "Are you sure?" dialog forces the user
to stop, read, and click — even for routine,
reversible actions like deleting a contact or hiding
a field. Users develop dialog fatigue: they stop
reading and click through reflexively, which defeats
the safety purpose entirely.

The fix is not fewer safety nets — it's better ones.
Modern interfaces (Gmail, Slack, iOS Mail) prove
that **act-then-undo** is both safer and faster than
**ask-then-act**. Users stay in flow, and recovery
from mistakes is immediate.

---

## The Rules

### UI-01: No Dialogs for Reversible Actions

If an action can be undone, do it immediately. Show
a non-blocking toast/snackbar with an **Undo**
button (5-second window). No confirmation dialog.

**Examples:**

| Action | Wrong | Right |
|--------|-------|-------|
| Delete contact | "Are you sure?" modal | Toast: "Deleted. **Undo**" |
| Hide field | Confirmation dialog | Toast: "Hidden. **Undo**" |
| Unlink device | "Confirm unlink?" popup | Toast: "Unlinked. **Undo**" |

**Why:** Users perform reversible actions frequently.
Interrupting each one trains them to click "OK"
without reading — making real confirmations
invisible.

---

### UI-02: Confirm Only Irrevocable Actions

Reserve confirmation for actions that **cannot be
undone**: permanent identity wipe, recovery phrase
reset, key deletion. These are rare by design.

When confirmation is needed, use **inline
confirmation** — expand the action area in place
with a clear warning and explicit confirm/cancel
buttons. Do not launch a modal overlay.

```
[ Delete Identity ]
     ↓ click
┌─────────────────────────────────────────┐
│ This permanently deletes your identity  │
│ and all contacts. This cannot be undone.│
│                                         │
│         [ Cancel ]  [ Delete Forever ]  │
└─────────────────────────────────────────┘
```

**Why:** Inline confirmation keeps context visible.
Modal dialogs obscure what the user was looking at,
forcing them to hold the context in memory.

---

### UI-03: Inline Over Overlay

Editing, status messages, errors, and form
validation appear **inline** — in the context where
the action happened. Never launch a modal to show a
single text field, a status message, or a validation
error.

| Use case | Wrong | Right |
|----------|-------|-------|
| Edit contact name | Modal with text input | Name becomes editable in place |
| Validation error | Alert popup | Red border + inline message |
| Success message | "Saved!" modal | Brief inline indicator or toast |
| Error message | Error dialog | Inline error banner at the relevant location |

**Why:** Overlays break spatial context. Users lose
their place and must re-orient after dismissing the
dialog.

---

### UI-04: Progressive Disclosure

Show only what the user needs now. Advanced options,
secondary actions, and details expand in-place on
demand.

- Default views show primary content only
- "Show more", accordions, and expandable sections reveal detail
- Settings pages use sections, not nested dialogs
- Help text appears on hover/focus, not in separate windows

**Why:** Front-loading complexity overwhelms users
and obscures the primary action. Let them drill in
when they choose to.

---

### UI-05: Follow Platform Conventions

Each platform adapts these rules using native
idioms. Users expect their platform's patterns —
don't invent new ones.

| Concept | Linux GTK4 | Linux Qt (Widgets) | Windows (WinUI3) | macOS (SwiftUI) | Android (Compose) | iOS (SwiftUI) | watchOS / Wear OS | KaiOS (Web) |
|---------|------------|-------------|-----------------|-----------------|-------------------|---------------|-------------------|-------------|
| **Toast/Undo** | `adw::Toast` | Custom `QWidget` overlay | `InfoBar` | Custom overlay | `SnackbarHost` | Custom overlay | Haptic + brief text | Soft-key toast |
| **Inline confirm** | In-place `gtk::Box` | Inline `QHBoxLayout` | Inline `StackPanel` | Inline `VStack` | Inline `Row` | Swipe + confirm | Crown press-hold | Confirm soft-key |
| **Inline edit** | `gtk::Entry` swap | `QLineEdit` swap | `TextBox` swap | `TextField` swap | `TextField` swap | `TextField` swap | Voice or companion | D-pad select |
| **Navigation** | `adw::NavigationView` | `QStackedWidget` | `NavigationView` | `NavigationStack` | `NavHost` / M3 | `NavigationStack` | Vertical page list | Soft-key tabs |
| **Loading** | `gtk::Spinner` | `QProgressBar` | `ProgressRing` | `ProgressView` | `CircularProgress` | `ProgressView` | Dots animation | Inline text |

**When platform convention conflicts with these
rules:** Platform convention wins for interaction
patterns (gestures, navigation, system dialogs).
These rules win for information architecture (what
triggers a dialog vs. inline action).

---

### UI-06: One Primary Action per Screen

Each screen has one primary action, visually
dominant. Secondary actions are visually subordinate
(smaller, muted, or behind a menu).

- Primary action: filled/accent button, prominent placement
- Secondary actions: outlined or text buttons, grouped away from primary
- Destructive actions: never the primary visual
  element — require deliberate reach (end of list,
  behind a menu, or expandable section)

**Why:** When everything is prominent, nothing is.
Users hesitate when faced with multiple equally
weighted choices.

---

### UI-07: Immediate Feedback

Every user action gets visible feedback within 100ms.

- Tap/click: visual state change (pressed state, color shift)
- Submit: loading indicator or optimistic UI update
- Error: inline message at the point of failure
- Success: brief visual confirmation (checkmark, state change) — not a dialog

If an operation takes longer than 300ms, show a
loading state. If longer than 2 seconds, show a
progress indicator with context
("Syncing contacts...").

**Why:** Delayed feedback makes users tap again,
double-submit, or assume the app is broken.

---

### UI-08: Escape Hatches Are Visible

Every state must have a clear, visible way back.

- Back buttons are always present in navigation stacks
- Cancel is always available during multi-step flows
- Undo appears immediately after destructive actions (see UI-01)
- No state requires a gesture (swipe, long-press)
  as the *only* way out — always provide a visible
  alternative

**Why:** Hidden escape hatches create anxiety. Users
avoid taking actions when they're unsure they can
get back.

---

## Applying the Rules

### For New Screens

Before implementing a new screen, answer:

1. What is the **one primary action** on this screen? (UI-06)
2. Are any actions **truly irrevocable**? List them.
   Everything else gets undo. (UI-01, UI-02)
3. Can all editing happen **inline**? (UI-03)
4. What is the **minimum** the user needs to see on first load? (UI-04)

### For Existing Screens

When modifying an existing screen, check whether it
violates any rule. If it does, fix the violation in
a separate commit — don't mix guideline fixes with
feature work.

### For Code Review

Reviewers should check:

- [ ] No new modal dialogs for reversible actions
- [ ] Confirmation only for irrevocable actions, done inline
- [ ] Error and status messages appear inline
- [ ] Primary action is visually clear
- [ ] Every action has visible feedback
- [ ] Undo is available for destructive but reversible actions

---

## Decision Record

These guidelines were adopted on 2026-02-24 based on:

- Analysis of current dialog patterns across
  desktop, Android, and iOS implementations
- [NNG: Modal & Nonmodal Dialogs][nng-modal]
- [NNG: Confirmation Dialogs][nng-confirm]
- [Apple HIG: Modality][apple-modality]
- [Material Design: Dialogs][md-dialogs]
- [IxDF: Progressive Disclosure][ixdf-pd]
- [UX Planet: Confirmation Dialogs][uxplanet]

[p4]: ../about/principles.md#4-simplicity-serves-the-user
[nng-modal]: https://www.nngroup.com/articles/modal-nonmodal-dialog/
[nng-confirm]: https://www.nngroup.com/articles/confirmation-dialog/
[apple-modality]: https://developer.apple.com/design/human-interface-guidelines/modality
[md-dialogs]: https://m1.material.io/components/dialogs.html
[ixdf-pd]: https://www.interaction-design.org/literature/topics/progressive-disclosure
[uxplanet]: https://uxplanet.org/confirmation-dialogs-how-to-design-dialogues-without-irritation-7b4cf2599956
