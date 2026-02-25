<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Unified Sponsorship Links

**Date:** 2026-02-25
**Status:** Approved

## Goal

Add GitHub Sponsors and Liberapay links consistently across all user-facing surfaces: website, docs, all client UIs (desktop, CLI, TUI, Android, iOS), GitLab profile, and GitHub profile. Remove Open Collective references.

## Canonical Platforms

| Platform | URL |
|----------|-----|
| GitHub Sponsors | https://github.com/sponsors/vauchi |
| Liberapay | https://liberapay.com/Vauchi/donate |

Open Collective is dropped. All surfaces must list both platforms.

## Changes

### 1. Website landing page (`website/`)

**Current:** Single Liberapay "Donate" link in footer.
**Change:** Add GitHub Sponsors link next to the existing Liberapay link in the `.links` footer section. Both use heart icon or appropriate per-platform icon.

**No changes needed:** `funding.json`, `.well-known/funding.json`, `README.md` — already have both.

### 2. Docs supporters page (`docs/`)

**File:** `docs/docs/about/supporters.md`
**Current:** "How to Support" lists GitHub Sponsors + Open Collective.
**Change:** Replace Open Collective with Liberapay in the "How to Support" section.

### 3. Desktop app (`desktop/`)

**Current:** No sponsorship content.
**Change:**

- Add `support` page type to the router (`Page` union type in `App.tsx`)
- Create `SupportUs.tsx` page component with:
  - Brief "community-funded, no VC" message
  - GitHub Sponsors button (opens external via `open()`)
  - Liberapay button (opens external via `open()`)
  - "Where Funds Go" table (Hardware, Infrastructure, Security, Development)
- Add "Support Vauchi" button in Settings help section that navigates to the new page
- Add i18n keys for all text

### 4. CLI (`cli/`)

**Current:** No sponsorship content.
**Change:** Add `support-us` subcommand that prints both links with a brief message to stdout.

### 5. TUI (`tui/`)

**Current:** No sponsorship content.
**Change:** Add "Support Us" screen or section accessible from settings/help area, displaying both links.

### 6. Android (`android/`)

**Current:** No sponsorship content.
**Change:** Add "Support Us" screen accessible from settings, with both links opening in external browser.

### 7. iOS (`ios/`)

**Current:** No sponsorship content.
**Change:** Add "Support Us" screen accessible from settings, with both links opening in external browser via `UIApplication.shared.open()`.

### 8. GitLab profile (`gitlab-profile/`)

**File:** `gitlab-profile/README.md`
**Current:** No funding links.
**Change:** Add "Support" section at the bottom with both links.

### 9. GitHub profile (`github-profile/`)

**Repo:** `gitlab.com/vauchi/github-profile` (source for `github.com/vauchi/.github`)
**Current:** GitHub Sponsors commented out, only Liberapay active.
**Change:**

- Uncomment GitHub Sponsors badge in header
- Update "Support the project" section to show both platforms with separate badges
- Keep `README.md` and `profile/README.md` in sync

### 10. Already correct (no changes)

- `.github/FUNDING.yml` — already has `github: vauchi` and `liberapay: Vauchi`
- `website/public/funding.json` — already has both
- `website/public/.well-known/funding.json` — already has both
- `website/README.md` — already has both

## UI Pattern (all clients)

All "Support Us" surfaces follow the same pattern:

- Accessible from settings or help area
- Heading: "Support Vauchi" (localized)
- Message: community-funded, no VC money, no data harvesting
- Two prominent links/buttons: GitHub Sponsors, Liberapay
- Optional: "Where Funds Go" breakdown table
- Links open in external browser

## i18n

New keys needed (added to `locales/`):

- `support.title` — "Support Vauchi"
- `support.description` — Community-funded message
- `support.github_sponsors` — "GitHub Sponsors"
- `support.liberapay` — "Liberapay"
- `support.where_funds_go` — "Where Funds Go"
- `support.category_hardware` — "Hardware"
- `support.category_infrastructure` — "Infrastructure"
- `support.category_security` — "Security"
- `support.category_development` — "Development"
- `support.purpose_hardware` — "Development machines, mobile test devices"
- `support.purpose_infrastructure` — "Relay server hosting, domain costs"
- `support.purpose_security` — "External security audits"
- `support.purpose_development` — "Full-time development toward v1.0"

## Repos touched

`website`, `docs`, `desktop`, `cli`, `tui`, `android`, `ios`, `gitlab-profile`, `github-profile`, `locales`
