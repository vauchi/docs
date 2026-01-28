<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Research: Remote Content Updates in Privacy-Focused Apps

**Created:** 2026-01-24
**Topic:** How privacy-focused apps handle dynamic content updates without app store releases
**Related Problem:** `_docs/planning/problems/2026-01-24-remote-content-updates/`

---

## Executive Summary

Privacy-focused apps use various strategies for remote content updates. The common patterns are:

1. **Static CDN hosting** with versioned files and manifest (Signal, Standard Notes)
2. **Self-hosted feature flag services** (Flagsmith, Appwrite)
3. **Widget/plugin architectures** for extensibility (Matrix/Element, Standard Notes)
4. **Offline-first with background sync** as universal best practice

Key insight: **No privacy-focused app uses Firebase Remote Config** due to Google data collection concerns. Self-hosted or static CDN approaches dominate.

---

## Signal Messenger

### Architecture

Signal uses a **CDN-based content delivery system** for sticker packs:

- **CDN endpoint:** `cdn.signal.org/stickers/{pack_id}/`
- **Content encrypted:** AES-CBC with PKCS#7 padding
- **Pack key:** 64-character key generated client-side, never sent to server
- **Manifest:** Protocol buffer format at `manifest.proto`
- **Individual files:** Fetched at `full/{sticker_id}`

### Privacy Model

> "Signal stickers are stored in packs that are private and end-to-end encrypted. Neither the Signal CDN nor other users can read them, but servers can know the number of images in a pack, their approximate sizes, and who downloads them."

- Pack ID is public (for sharing)
- Pack key is secret (required to decrypt)
- When sharing packs publicly (e.g., signalstickers.com), both ID and key are shared intentionally

### Infrastructure

- AWS S3 + CloudFront for CDN
- Can be self-hosted with MinIO + LocalStack
- Storage Manager service handles object lifecycle

### Relevance to Vauchi

**Applicable patterns:**
- Static CDN with versioned content
- Manifest file listing all content
- Checksum/integrity verification

**Not applicable:**
- E2E encryption of content (our content is public)
- User-generated content upload

**Sources:**
- [Signal Sticker Internals](https://github.com/signalstickers/signalstickers-client/blob/master/STICKERS_INTERNALS.md)
- [Signal Storage Manager](https://github.com/signalapp/storage-manager)
- [Signal Server Setup Guide](https://github.com/madeindra/signal-setup-guide)

---

## Proton Mail

### Approach

Proton uses **server-synced settings** rather than static content files:

- Settings sync across web, iOS, and Android apps
- Theme selection stored server-side with account
- Remote content (images) blocked by default for privacy
- Email tracker protection via server-side image proxying

### Theme System

- Web app has more themes than desktop/mobile
- Custom CSS themes supported (web only)
- Content-Security-Policy blocks `@import` from remote sources

### Privacy Features

- Auto-load remote content: OFF by default
- Email tracking protection: ON by default
- Images pre-loaded on delivery (not on open) to prevent tracking

### Relevance to Vauchi

**Applicable patterns:**
- Privacy-preserving defaults (block remote by default)
- User control over remote fetching

**Not directly applicable:**
- Account-based sync (Vauchi has no accounts)
- Server-side settings storage

**Sources:**
- [Proton Mail Settings](https://proton.me/support/mail/using-mail/mail-settings)
- [Proton Email Tracker Protection](https://proton.me/support/email-tracker-protection)
- [Proton Android Security Model](https://proton.me/blog/android-client-security-model)

---

## Standard Notes

### Plugin/Extension Architecture

Standard Notes has the most sophisticated **remote plugin system** among privacy apps:

```json
{
  "identifier": "com.example.my-theme",
  "name": "My Theme",
  "content_type": "SN|Theme",
  "url": "https://example.com/my-theme/theme.css",
  "download_url": "https://example.com/my-theme/dist.zip",
  "latest_url": "https://example.com/my-theme/ext.json",
  "version": "1.0.0"
}
```

### Auto-Update Mechanism

> "Standard Notes will ping the `latest_url` endpoint automatically to update plugins."

- `latest_url` points to JSON with `version` property
- Desktop app checks version and downloads if newer
- `download_url` provides full distribution (HTML, CSS, JS)
- Web app uses hosted model (fetches on each use)

### Installation Methods

1. **Official marketplace** - Curated plugins
2. **Custom URL** - User enters descriptor URL (`ext.json`)
3. **Local installation** - Desktop-only, runs from filesystem

### Offline Support

> "When using the desktop app, extensions that support local installation will default to installing and running directly from your computer."

- Desktop downloads and caches plugins locally
- Web falls back to remote fetch if local unavailable
- Offline-first for desktop users

### Theme Structure

Themes are simple CSS files overriding variables:
- Works across all platforms automatically
- Can be hosted on GitHub Releases
- Uses `Source code (zip)` auto-generated archive

### Relevance to Vauchi

**Highly applicable:**
- Manifest/descriptor JSON pattern
- `latest_url` for version checking
- `download_url` for full distribution
- Automatic update checking
- Offline-first with local cache

**Sources:**
- [Standard Notes Plugin Publishing](https://standardnotes.com/help/plugins/publishing)
- [Building Theme Plugins](https://standardnotes.com/help/plugins/themes)
- [Standard Notes Plugins GitHub](https://github.com/standardnotes/plugins)

---

## Matrix/Element

### Sticker Pack Approaches

Matrix has **two competing implementations**:

1. **MSC#1951** - Integration manager based (Scalar, Dimension)
2. **MSC#2545** - Room-based packs (Nheko)

### Integration Manager Model (Element)

- Scalar (default): Can't self-host, predefined packs only
- Dimension (alternative): Self-hostable, custom packs supported
- Users add packs via URL in sticker picker

### Room-Based Model (MSC#2545)

> "No integration manager needed. Trivially easy to share packs - just invite someone into the same room!"

- Stickers stored in Matrix room state
- Room members automatically have access
- Can enable room packs globally in settings

### Relevance to Vauchi

**Interesting patterns:**
- Multiple implementation approaches coexisting
- Widget-based extensibility
- User-controlled content sources

**Not directly applicable:**
- Room-based storage (we don't have Matrix rooms)
- Integration manager complexity

**Sources:**
- [Maunium Sticker Picker](https://github.com/maunium/stickerpicker)
- [Matrix Custom Sticker Packs](https://github.com/turt2live/matrix-dimension/blob/master/docs/custom_stickerpacks.md)
- [MSC#2545 Custom Emoji](https://github.com/matrix-org/matrix-doc/issues/1256)

---

## Firebase Alternatives (Self-Hosted)

### Why Privacy Apps Avoid Firebase

> "Firebase's costs quickly escalate once you exceed the free tier, and its lack of self-hosting options makes it difficult for teams with strict privacy and data compliance requirements."

> "Google has information and data about your app users... which has to comply with modern, international user privacy laws."

### Flagsmith

**Open-source feature flags + remote config:**
- Self-hostable via Docker
- REST API for config fetching
- Free tier: 50,000 requests/month
- SDKs for iOS, Android, JS

```bash
docker-compose up  # Bootstraps admin, org, project
```

### Appwrite

**Self-hosted backend-as-a-service:**
- Docker-based deployment
- Official SDKs: Flutter, Swift, Kotlin, Python
- Full control over data and infrastructure
- GraphQL and REST APIs

### Supabase

**PostgreSQL-based Firebase alternative:**
- Row-Level Security for access control
- Auto-generated REST and GraphQL APIs
- Self-hostable or managed cloud

### PocketBase

**Lightweight, single-binary BaaS:**
- Local-first design
- Embedded SQLite database
- Minimal dependencies

### TelemetryDeck (Privacy Analytics)

> "Each signal is provided with an identifier that is unique per user but cannot be traced back to the natural person behind it. They achieve this by not only hashing the identifier, but also applying a unique salt."

### Relevance to Vauchi

**Consideration:** These are full backend services - likely overkill for static content delivery. Static CDN is simpler and more aligned with Vauchi's minimalist approach.

**Sources:**
- [Flagsmith GitHub](https://github.com/Flagsmith/flagsmith)
- [Firebase Alternatives Comparison](https://www.flagsmith.com/blog/firebase-remote-config-alternatives)
- [Open Source Firebase Alternatives](https://medium.com/@nocobase/6-open-source-firebase-alternatives-for-self-hosting-and-data-control-ba4607323258)
- [TelemetryDeck](https://telemetrydeck.com/telemetrydeck-vs-google-firebase-analytics/)

---

## OTA Update Best Practices (2025)

### Industry Trends

> "In 2025, the pace of mobile app development will never be faster. Gone are the days when apps could afford to wait for App Store approvals just to fix a typo."

- Microsoft App Center retired March 2025
- Expo Updates / EAS Update gaining adoption
- Capgo: 502M updates, 1.8K apps (as of Feb 2025)

### App Store Compliance

**Allowed via OTA:**
- Bug fixes
- Performance updates
- Minor UI tweaks
- Content updates (strings, themes, help)

**Requires Store Review:**
- Major features
- Native code changes
- Core functionality alterations

### Security Requirements

1. **Digital signatures** - All packages must be signed
2. **Cryptographic verification** - Device validates before install
3. **HTTPS delivery** - Mandatory for transport
4. **Rollback protection** - Staged rollouts recommended

### Compliance (DMA, GDPR)

> "DMA and GDPR mandate transparency in update delivery and user consent in certain regions. Best practice is to document and log every OTA update deployed."

### Version Control

> "Always attach a clear version number to every update. Google Play now requires clear version tracking for dynamically updated content."

**Sources:**
- [OTA Best Practices - AppsOnAir](https://www.appsonair.com/blogs/best-practices-for-over-the-air-app-updates)
- [App Store Compliant OTA - Capgo](https://capgo.app/blog/ultimate-guide-to-app-store-compliant-ota-updates/)
- [OTA Updates - Perficient](https://blogs.perficient.com/2025/06/02/over-the-air-ota-deployment-process-for-mobile-app/)

---

## Offline-First Architecture

### Core Principles

> "In an offline-first app, there must be at least one data source that does not need network access to perform its most critical tasks."

> "At the heart of every offline-first application lies the local database. It is more than a cache; it is the authoritative store of truth."

### Why Offline-First Matters

**Problems with remote-first:**
- User waits for every fetch
- Wasted bandwidth on unchanged data
- Multiple network failure points

**Benefits of offline-first:**
- Operations go against local storage "almost instantly"
- No loading spinners needed
- Local query: milliseconds vs API call: hundreds of ms

### Recommended Pattern: Bundle + Background Sync

> "Download all content at first run, then re-download in background once a day. User sees loading indicator only once - first run."

```
App Launch
    │
    ├─► Has cached content? ─► YES ─► Use cache, sync in background
    │
    └─► NO ─► Fetch from remote
              └─► Save to local DB
                  └─► App uses local DB
```

### Sync Implementation

**Android:** WorkManager for background jobs
**iOS:** BackgroundTasks API

Sync engine responsibilities:
1. Push unsynced local changes
2. Pull remote deltas
3. Handle conflicts (usually "last write wins")
4. Update local database

### When to Choose Offline-First

> "If offline usability is a core feature — go offline-first."

Ideal for:
- Field apps (logistics, agriculture, healthcare)
- Note-taking and productivity apps
- Apps targeting unreliable networks
- **Privacy apps** (minimize network exposure)

**Sources:**
- [Android Offline-First Guide](https://developer.android.com/topic/architecture/data-layer/offline-first)
- [Flutter Offline-First Docs](https://docs.flutter.dev/app-architecture/design-patterns/offline-first)
- [Offline-First Done Right](https://developersvoice.com/blog/mobile/offline-first-sync-patterns/)
- [Offline vs Online First Comparison](https://openmobilekit.medium.com/offline-first-vs-online-first-app-architecture-choosing-the-right-strategy-for-your-app-0533c588e913)

---

## Recommendations for Vauchi

### Architecture Choice

**Recommended:** Static CDN with manifest (Signal/Standard Notes model)

```
vauchi.app/app-files/
├── manifest.json          # Version index + checksums
├── networks/v1/networks.json
├── locales/v1/{lang}.json
├── help/v1/{lang}.json
└── themes/v1/default.json
```

### Implementation Priorities

1. **Networks registry** - Lowest risk, clear value
2. **Locales** - Enables community translations
3. **Help content** - Improves user experience
4. **Themes** - Nice-to-have, lowest priority

### Key Design Decisions

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Hosting | Static CDN (GitLab Pages) | Simple, no backend needed |
| Versioning | Semantic versioning in manifest | Industry standard |
| Integrity | SHA-256 checksums | Sufficient for MVP, add signatures later if needed |
| Updates | Check on launch, respect sync interval | Aligns with existing sync behavior |
| Fallback | Always bundle baseline content | Offline-first principle |
| Opt-out | User setting to disable | Privacy principle |

### Manifest Schema (Standard Notes inspired)

```json
{
  "schema_version": 1,
  "generated_at": "2026-01-24T10:00:00Z",
  "content": {
    "networks": {
      "version": "1.0.0",
      "url": "networks/v1/networks.json",
      "checksum": "sha256:...",
      "size_bytes": 12450,
      "min_app_version": "1.0.0"
    }
  }
}
```

### Privacy Considerations

1. **Minimal requests** - Single manifest check, conditional fetches
2. **No tracking** - No analytics on content fetches
3. **Tor compatible** - Route through existing proxy config
4. **User control** - Allow disabling remote updates entirely
