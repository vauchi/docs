<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Unified Sponsorship Links Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add GitHub Sponsors and Liberapay links consistently across all user-facing surfaces and remove Open Collective.

**Architecture:** Each surface gets the same two links (GitHub Sponsors + Liberapay). Static surfaces (profiles, website, docs) get direct edits. Client UIs (desktop, CLI, TUI, Android, iOS) get a "Support Us" feature accessible from settings. All UI text goes through `locales/`.

**Tech Stack:** HTML (website), Markdown (docs, profiles), SolidJS/TypeScript (desktop), Rust/clap (CLI), Rust/ratatui (TUI), Kotlin/Compose (Android), SwiftUI (iOS), JSON (locales)

---

## Task 1: Add locale keys for Support Us

**Files:**

- Modify: `locales/en.json`
- Modify: `locales/de.json`
- Modify: `locales/fr.json`
- Modify: `locales/es.json`

**Step 1: Add English keys to `locales/en.json`**

Insert these keys in alphabetical order within the file (after the `sync.*` keys, before `theme.*`):

```json
"support.category_development": "Development",
"support.category_hardware": "Hardware",
"support.category_infrastructure": "Infrastructure",
"support.category_security": "Security",
"support.description": "Vauchi is community-funded. No venture capital, no data harvesting. Your support keeps development going.",
"support.github_sponsors": "GitHub Sponsors",
"support.liberapay": "Liberapay",
"support.purpose_development": "Full-time development toward v1.0",
"support.purpose_hardware": "Development machines, mobile test devices",
"support.purpose_infrastructure": "Relay server hosting, domain costs",
"support.purpose_security": "External security audits",
"support.title": "Support Vauchi",
"support.where_funds_go": "Where Funds Go",
```

**Step 2: Add German keys to `locales/de.json`**

```json
"support.category_development": "Entwicklung",
"support.category_hardware": "Hardware",
"support.category_infrastructure": "Infrastruktur",
"support.category_security": "Sicherheit",
"support.description": "Vauchi wird von der Community finanziert. Kein Risikokapital, kein Datenhandel. Deine Unterstützung hält die Entwicklung am Laufen.",
"support.github_sponsors": "GitHub Sponsors",
"support.liberapay": "Liberapay",
"support.purpose_development": "Vollzeitentwicklung bis v1.0",
"support.purpose_hardware": "Entwicklungsgeräte, mobile Testgeräte",
"support.purpose_infrastructure": "Relay-Server-Hosting, Domainkosten",
"support.purpose_security": "Externe Sicherheitsaudits",
"support.title": "Vauchi unterstützen",
"support.where_funds_go": "Wofür die Mittel verwendet werden",
```

**Step 3: Add French keys to `locales/fr.json`**

```json
"support.category_development": "Développement",
"support.category_hardware": "Matériel",
"support.category_infrastructure": "Infrastructure",
"support.category_security": "Sécurité",
"support.description": "Vauchi est financé par la communauté. Pas de capital-risque, pas de collecte de données. Votre soutien permet de poursuivre le développement.",
"support.github_sponsors": "GitHub Sponsors",
"support.liberapay": "Liberapay",
"support.purpose_development": "Développement à temps plein vers la v1.0",
"support.purpose_hardware": "Machines de développement, appareils de test mobiles",
"support.purpose_infrastructure": "Hébergement du serveur relais, coûts de domaine",
"support.purpose_security": "Audits de sécurité externes",
"support.title": "Soutenir Vauchi",
"support.where_funds_go": "Utilisation des fonds",
```

**Step 4: Add Spanish keys to `locales/es.json`**

```json
"support.category_development": "Desarrollo",
"support.category_hardware": "Hardware",
"support.category_infrastructure": "Infraestructura",
"support.category_security": "Seguridad",
"support.description": "Vauchi se financia con la comunidad. Sin capital de riesgo, sin recolección de datos. Tu apoyo mantiene el desarrollo en marcha.",
"support.github_sponsors": "GitHub Sponsors",
"support.liberapay": "Liberapay",
"support.purpose_development": "Desarrollo a tiempo completo hacia la v1.0",
"support.purpose_hardware": "Máquinas de desarrollo, dispositivos móviles de prueba",
"support.purpose_infrastructure": "Alojamiento del servidor relay, costes de dominio",
"support.purpose_security": "Auditorías de seguridad externas",
"support.title": "Apoyar a Vauchi",
"support.where_funds_go": "Destino de los fondos",
```

**Step 5: Commit**

```bash
git -C locales add en.json de.json fr.json es.json
git -C locales commit -m "feat: add support-us locale keys for all languages"
```

---

## Task 2: Add GitHub Sponsors link to website landing page

**Files:**

- Modify: `website/public/index.html` (around line 1624, the `.links` div)

**Step 1: Add GitHub Sponsors link before the existing Liberapay link**

In `website/public/index.html`, find the `<span class="demo-link">Demo (coming soon)</span>` line (approx line 1623). After it, before the existing Liberapay `<a>` tag, insert:

```html
          <a
            href="https://github.com/sponsors/vauchi"
            target="_blank"
            rel="noopener"
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
            Sponsor
          </a>
```

Also change the existing Liberapay link text from "Donate" to "Donate" (keep as-is, it's fine).

**Step 2: Commit**

```bash
git -C website add public/index.html
git -C website commit -m "feat: add GitHub Sponsors link to landing page footer"
```

---

## Task 3: Replace Open Collective with Liberapay in docs

**Files:**

- Modify: `docs/docs/about/supporters.md` (line 39)

**Step 1: Replace Open Collective line**

In `docs/docs/about/supporters.md`, change line 39 from:

```markdown
- **Open Collective:** [https://opencollective.com/vauchi](https://opencollective.com/vauchi)
```

to:

```markdown
- **Liberapay:** [https://liberapay.com/Vauchi/donate](https://liberapay.com/Vauchi/donate)
```

**Step 2: Commit**

```bash
git -C docs add docs/about/supporters.md
git -C docs commit -m "docs: replace Open Collective with Liberapay on supporters page"
```

---

## Task 4: Add Support Us page to desktop app

**Files:**

- Modify: `desktop/ui/src/App.tsx` (lines 18-26 Page type, lines 60-82 switch)
- Create: `desktop/ui/src/pages/SupportUs.tsx`
- Modify: `desktop/ui/src/pages/Settings.tsx` (lines 1917-1949 help section)

**Step 1: Add `support` to Page type in `desktop/ui/src/App.tsx`**

Change the Page type (line 18) from:

```typescript
type Page =
  | 'setup'
  | 'home'
  | 'contacts'
  | 'exchange'
  | 'settings'
  | 'devices'
  | 'recovery'
  | 'help';
```

to:

```typescript
type Page =
  | 'setup'
  | 'home'
  | 'contacts'
  | 'exchange'
  | 'settings'
  | 'devices'
  | 'recovery'
  | 'help'
  | 'support';
```

**Step 2: Add import for SupportUs component**

Add to imports in `App.tsx`:

```typescript
import SupportUs from './pages/SupportUs';
```

**Step 3: Add case to the switch in `App.tsx` (after the `help` case, around line 79)**

```typescript
      case 'support':
        return <SupportUs onNavigate={setPage} />;
```

**Step 4: Create `desktop/ui/src/pages/SupportUs.tsx`**

```typescript
// SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { open } from '@tauri-apps/plugin-shell';
import { t } from '../services/i18nService';

interface SupportUsProps {
  onNavigate: (
    page:
      | 'home'
      | 'contacts'
      | 'exchange'
      | 'settings'
      | 'devices'
      | 'recovery'
      | 'help'
      | 'support'
  ) => void;
}

function SupportUs(props: SupportUsProps) {
  return (
    <div class="page support-page">
      <header class="page-header">
        <button
          class="back-btn"
          onClick={() => props.onNavigate('settings')}
          aria-label="Back to settings"
        >
          &larr;
        </button>
        <h1>{t('support.title')}</h1>
      </header>

      <div class="support-content">
        <p class="support-description">{t('support.description')}</p>

        <div class="support-links" role="group" aria-label="Funding platforms">
          <button
            class="support-btn github-sponsors"
            onClick={() => open('https://github.com/sponsors/vauchi')}
            aria-label="Open GitHub Sponsors in browser"
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {t('support.github_sponsors')}
          </button>
          <button
            class="support-btn liberapay"
            onClick={() => open('https://liberapay.com/Vauchi/donate')}
            aria-label="Open Liberapay in browser"
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {t('support.liberapay')}
          </button>
        </div>

        <section class="funds-table" aria-labelledby="funds-heading">
          <h2 id="funds-heading">{t('support.where_funds_go')}</h2>
          <table>
            <thead>
              <tr>
                <th scope="col">{t('support.category_hardware')}</th>
                <th scope="col">{t('support.category_infrastructure')}</th>
                <th scope="col">{t('support.category_security')}</th>
                <th scope="col">{t('support.category_development')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t('support.purpose_hardware')}</td>
                <td>{t('support.purpose_infrastructure')}</td>
                <td>{t('support.purpose_security')}</td>
                <td>{t('support.purpose_development')}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

export default SupportUs;
```

**Step 5: Add "Support Vauchi" button to Settings help section**

In `desktop/ui/src/pages/Settings.tsx`, find the help-links div (around line 1919). Add a new button after the "Privacy Policy" button:

```typescript
          <button
            class="secondary"
            onClick={() => props.onNavigate('support')}
            aria-label="Support Vauchi"
          >
            {t('support.title')}
          </button>
```

**Step 6: Update the `onNavigate` prop type in Settings.tsx**

Find the `SettingsProps` interface and add `'support'` to the `onNavigate` page union type. Also update the Help.tsx `HelpProps` interface to include `'support'`.

**Step 7: Commit**

```bash
git -C desktop add ui/src/App.tsx ui/src/pages/SupportUs.tsx ui/src/pages/Settings.tsx
git -C desktop commit -m "feat: add Support Us page accessible from settings"
```

---

## Task 5: Add support-us subcommand to CLI

**Files:**

- Modify: `cli/src/main.rs` (Commands enum around line 49, dispatch around line 617)
- Create: `cli/src/commands/support.rs`
- Modify: `cli/src/commands/mod.rs`

**Step 1: Add `SupportUs` variant to Commands enum in `cli/src/main.rs`**

After the `Faq` variant (around line 128), add:

```rust
    /// Show how to support Vauchi
    SupportUs,
```

**Step 2: Add dispatch case in `cli/src/main.rs`**

In the main match block (around line 617), add:

```rust
        Commands::SupportUs => commands::support::run(),
```

**Step 3: Register the module in `cli/src/commands/mod.rs`**

Add:

```rust
pub mod support;
```

**Step 4: Create `cli/src/commands/support.rs`**

```rust
// SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
//
// SPDX-License-Identifier: GPL-3.0-or-later

pub fn run() {
    println!("Support Vauchi");
    println!();
    println!(
        "Vauchi is community-funded. No venture capital, no data harvesting."
    );
    println!("Your support keeps development going.");
    println!();
    println!(
        "  GitHub Sponsors: https://github.com/sponsors/vauchi"
    );
    println!(
        "  Liberapay:       https://liberapay.com/Vauchi/donate"
    );
    println!();
    println!("Where funds go:");
    println!("  Hardware        Development machines, mobile test devices");
    println!("  Infrastructure  Relay server hosting, domain costs");
    println!("  Security        External security audits");
    println!("  Development     Full-time development toward v1.0");
}
```

**Step 5: Verify it compiles**

Run: `just build cli`

**Step 6: Commit**

```bash
git -C cli add src/main.rs src/commands/mod.rs src/commands/support.rs
git -C cli commit -m "feat: add support-us subcommand"
```

---

## Task 6: Add Support Us screen to TUI

**Files:**

- Modify: `tui/src/app.rs` (Screen enum line 12, go_back around line 380)
- Create: `tui/src/ui/support.rs`
- Modify: `tui/src/ui/mod.rs` (draw dispatch around line 27)
- Create: `tui/src/handlers/support.rs`
- Modify: `tui/src/handlers/input.rs` (dispatch around line 24)

**Step 1: Add `Support` variant to Screen enum in `tui/src/app.rs`**

After `Privacy` (around line 49), add:

```rust
    /// Support Vauchi screen
    Support,
```

**Step 2: Add back-navigation in `tui/src/app.rs` `go_back()`**

Add a case for `Screen::Support` that goes back to `Screen::Settings`:

```rust
            Screen::Support => self.screen = Screen::Settings,
```

**Step 3: Create `tui/src/ui/support.rs`**

```rust
// SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
//
// SPDX-License-Identifier: GPL-3.0-or-later

use ratatui::{
    layout::{Constraint, Direction, Layout},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph, Row, Table},
    Frame,
};

use crate::app::App;

pub fn draw(f: &mut Frame, app: &App) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(3),
            Constraint::Length(4),
            Constraint::Length(5),
            Constraint::Min(8),
            Constraint::Length(1),
        ])
        .split(f.area());

    // Title
    let title = Paragraph::new(Line::from(vec![Span::styled(
        " Support Vauchi ",
        Style::default()
            .fg(Color::Cyan)
            .add_modifier(Modifier::BOLD),
    )]))
    .block(Block::default().borders(Borders::ALL));
    f.render_widget(title, chunks[0]);

    // Description
    let desc = Paragraph::new(vec![
        Line::from(""),
        Line::from(
            "  Vauchi is community-funded. No venture capital, no data harvesting.",
        ),
        Line::from("  Your support keeps development going."),
    ]);
    f.render_widget(desc, chunks[1]);

    // Links
    let links = Paragraph::new(vec![
        Line::from(Span::styled(
            "  Funding Platforms",
            Style::default().add_modifier(Modifier::BOLD),
        )),
        Line::from(""),
        Line::from("  [1] GitHub Sponsors  https://github.com/sponsors/vauchi"),
        Line::from("  [2] Liberapay        https://liberapay.com/Vauchi/donate"),
    ]);
    f.render_widget(links, chunks[2]);

    // Where Funds Go table
    let header = Row::new(vec!["Category", "Purpose"])
        .style(
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        );
    let rows = vec![
        Row::new(vec![
            "Hardware",
            "Development machines, mobile test devices",
        ]),
        Row::new(vec![
            "Infrastructure",
            "Relay server hosting, domain costs",
        ]),
        Row::new(vec!["Security", "External security audits"]),
        Row::new(vec!["Development", "Full-time development toward v1.0"]),
    ];
    let table = Table::new(
        rows,
        [Constraint::Length(16), Constraint::Min(40)],
    )
    .header(header)
    .block(
        Block::default()
            .title(" Where Funds Go ")
            .borders(Borders::ALL),
    );
    f.render_widget(table, chunks[3]);

    // Footer
    let footer = Paragraph::new(Line::from(
        "  Press [1]/[2] to open in browser  |  [q]/[Esc] back to settings",
    ))
    .style(Style::default().fg(Color::DarkGray));
    f.render_widget(footer, chunks[4]);
}
```

**Step 4: Register UI module in `tui/src/ui/mod.rs`**

Add:

```rust
pub mod support;
```

Add draw dispatch case (in the match around line 43):

```rust
        Screen::Support => support::draw(f, app),
```

**Step 5: Create `tui/src/handlers/support.rs`**

```rust
// SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
//
// SPDX-License-Identifier: GPL-3.0-or-later

use crossterm::event::KeyCode;

use crate::app::App;

pub fn handle_support_keys(app: &mut App, key: KeyCode) {
    match key {
        KeyCode::Char('q') | KeyCode::Esc => app.go_back(),
        KeyCode::Char('1') => {
            let _ = open::that("https://github.com/sponsors/vauchi");
        }
        KeyCode::Char('2') => {
            let _ = open::that("https://liberapay.com/Vauchi/donate");
        }
        _ => {}
    }
}
```

Note: Check if the `open` crate is already a dependency of `tui/`. If not, add `open = "5"` to `tui/Cargo.toml` under `[dependencies]`. If the TUI already uses a different method to open URLs, use that instead.

**Step 6: Register handler in `tui/src/handlers/input.rs`**

Add:

```rust
pub mod support;
```

Add dispatch case (in the match around line 54):

```rust
        Screen::Support => support::handle_support_keys(app, key),
```

**Step 7: Add navigation key in settings handler**

In the settings key handler, add a key binding (e.g., `'u'` for "sUpport") that navigates to `Screen::Support`:

```rust
        KeyCode::Char('u') => app.goto(Screen::Support),
```

**Step 8: Verify it compiles**

Run: `just build tui`

**Step 9: Commit**

```bash
git -C tui add src/app.rs src/ui/mod.rs src/ui/support.rs src/handlers/input.rs src/handlers/support.rs
git -C tui commit -m "feat: add Support Us screen accessible from settings"
```

---

## Task 7: Add Support Us screen to Android app

**Files:**

- Modify: `android/app/src/main/kotlin/com/vauchi/ui/SettingsScreen.kt` (around line 774, help section)

**Step 1: Add Support Us links to the Help & Support section**

In `android/app/src/main/kotlin/com/vauchi/ui/SettingsScreen.kt`, find the Help & Support section (around line 774). The `openUrl` lambda is already defined. After the existing `HelpLinkItem` entries (Privacy Policy), add:

```kotlin
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = stringResource(R.string.support_title),
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.semantics { heading() },
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = stringResource(R.string.support_description),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(modifier = Modifier.height(8.dp))
                HelpLinkItem(
                    title = "GitHub Sponsors",
                    subtitle = stringResource(R.string.support_github_sponsors),
                    onClick = { openUrl("https://github.com/sponsors/vauchi") },
                )
                HelpLinkItem(
                    title = "Liberapay",
                    subtitle = stringResource(R.string.support_liberapay),
                    onClick = { openUrl("https://liberapay.com/Vauchi/donate") },
                )
```

Note: Check if string resources exist or if the Android app uses the shared `locales/` JSON files directly. Adapt accordingly — if using shared locales, use the app's `t()` or localization helper instead of `stringResource()`.

**Step 2: Commit**

```bash
git -C android add app/src/main/kotlin/com/vauchi/ui/SettingsScreen.kt
git -C android commit -m "feat: add Support Us links in settings"
```

---

## Task 8: Add Support Us screen to iOS app

**Files:**

- Modify: `ios/Vauchi/Views/SettingsView.swift` (around line 389, help section)

**Step 1: Add Support Us section**

In `ios/Vauchi/Views/SettingsView.swift`, find the Help & Support section (after the existing `Link` items for User Guide, Report Issue, Privacy Policy). Add a new Section:

```swift
            Section("Support Vauchi") {
                Text(NSLocalizedString("support.description", comment: ""))
                    .font(.callout)
                    .foregroundColor(.secondary)

                Link(destination: URL(string: "https://github.com/sponsors/vauchi")!) {
                    HStack {
                        Label("GitHub Sponsors", systemImage: "heart")
                        Spacer()
                        Image(systemName: "arrow.up.right")
                            .foregroundColor(.secondary)
                            .accessibilityHidden(true)
                    }
                }

                Link(destination: URL(string: "https://liberapay.com/Vauchi/donate")!) {
                    HStack {
                        Label("Liberapay", systemImage: "heart")
                        Spacer()
                        Image(systemName: "arrow.up.right")
                            .foregroundColor(.secondary)
                            .accessibilityHidden(true)
                    }
                }
            }
```

Note: Check if the iOS app uses `NSLocalizedString` or the shared `locales/` JSON approach. Adapt accordingly.

**Step 2: Commit**

```bash
git -C ios add Vauchi/Views/SettingsView.swift
git -C ios commit -m "feat: add Support Us section in settings"
```

---

## Task 9: Add support section to GitLab profile

**Files:**

- Modify: `gitlab-profile/README.md`

**Step 1: Add support section at the bottom of `gitlab-profile/README.md`**

Before the closing of the file, add:

```markdown

## Support

Vauchi is community-funded. No venture capital, no data harvesting.

- [GitHub Sponsors](https://github.com/sponsors/vauchi)
- [Liberapay](https://liberapay.com/Vauchi/donate)
```

**Step 2: Commit**

```bash
git -C gitlab-profile add README.md
git -C gitlab-profile commit -m "docs: add sponsorship links to profile"
```

---

## Task 10: Fix GitHub profile sponsorship links

**Files:**

- Modify: `github-profile/profile/README.md`
- Modify: `github-profile/README.md`

**Step 1: Uncomment GitHub Sponsors badge in header (line 16)**

Change:

```html
  <a href="https://liberapay.com/Vauchi/"><img src="https://img.shields.io/badge/sponsor-💜-cba6f7?style=flat&labelColor=1e1e2e" alt="Sponsor"></a>
  <!--<a href="https://github.com/sponsors/vauchi"><img src="https://img.shields.io/badge/sponsor-💜-cba6f7?style=flat&labelColor=1e1e2e" alt="Sponsor"></a>-->
```

to:

```html
  <a href="https://github.com/sponsors/vauchi"><img src="https://img.shields.io/badge/sponsor-💜-cba6f7?style=flat&labelColor=1e1e2e" alt="GitHub Sponsors"></a>
  <a href="https://liberapay.com/Vauchi/donate"><img src="https://img.shields.io/badge/donate-💛-f9e2af?style=flat&labelColor=1e1e2e" alt="Liberapay"></a>
```

**Step 2: Fix "Support the project" section (lines 56-63)**

Change:

```html
### Support the project

Vauchi is community-funded. No VC money, no data harvesting.

<!--<a href="https://github.com/sponsors/vauchi">-->
  <a href="https://liberapay.com/Vauchi/">
  <img src="https://img.shields.io/badge/Sponsor_on_GitHub-💜_Become_a_sponsor-cba6f7?style=for-the-badge&labelColor=1e1e2e" alt="Sponsor on GitHub">
</a>
```

to:

```html
### Support the project

Vauchi is community-funded. No VC money, no data harvesting.

<a href="https://github.com/sponsors/vauchi">
  <img src="https://img.shields.io/badge/GitHub_Sponsors-💜_Become_a_sponsor-cba6f7?style=for-the-badge&labelColor=1e1e2e" alt="GitHub Sponsors">
</a>
&nbsp;
<a href="https://liberapay.com/Vauchi/donate">
  <img src="https://img.shields.io/badge/Liberapay-💛_Donate-f9e2af?style=for-the-badge&labelColor=1e1e2e" alt="Liberapay">
</a>
```

**Step 3: Apply identical changes to `github-profile/README.md`**

The root `README.md` and `profile/README.md` are currently identical. Apply the same edits to both.

**Step 4: Commit**

```bash
git -C github-profile add profile/README.md README.md
git -C github-profile commit -m "docs: add GitHub Sponsors and Liberapay links"
```
