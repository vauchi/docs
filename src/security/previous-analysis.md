<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Previous Analysis

What has been reviewed before, by whom, and what changed because of
it; and what runs against the code on every change. A researcher
should not spend a week on ground already covered, and should see at
a glance what has never been done.

## What has never been done

There has been **no external cryptographic audit**. One is planned
and depends on funding; the project says so rather than implying
otherwise. There is no bug bounty. Everything below is either our own
verification or a review someone else chose to do.

## External review, July 2026

An independent reviewer read this site and asked written questions
about the cryptography and the protocol: how partial and full updates
reconcile, whether ratchets are per device, how skipped message keys
are evicted, whether mailbox tokens stay unlinkable, how the backup
seed is protected, why there is no non-repudiation mode, and how keys
are revoked. The reviewer also named what would strengthen the project
most: a third-party audit, the full threat model in public, links from
the documentation to the source, Vauchi-specific test vectors, and a
statement of how AI agents take part in development.

Our own first finding was about us: the site the reviewer read had
been serving a build from ten weeks earlier, because the deploy step
was manual and nobody had pressed it. Several premises of the review
(a transport and a backup format that had already been retired) were
artefacts of that stale build. The site was redeployed and a staleness
alarm added, so a reader of this page is reading what the repository
says.

What changed because of the review:

- The user guide said new fields were visible to everyone by default;
  the shipped default is hidden. Corrected.
- The message-delivery diagram showed a retired framing; corrected to
  the HTTP path the code uses.
- The certificate-pinning feature text named the wrong hash input;
  corrected to the SPKI the code pins.
- The [Security Claims](../developers/security-claims.md) page, the
  [Formal Verification](../developers/formal-verification.md) page,
  the [Test Vectors](../developers/test-vectors.md) and the source
  links in the [Cryptography Reference](../developers/crypto.md)
  exist because the reviewer asked for them.
- A standalone, versioned specification is being extracted from the
  code into its own repository,
  [gitlab.com/vauchi/spec](https://gitlab.com/vauchi/spec).

Positions given to the reviewer that still stand: the audit is agreed
and funding-gated; the threat model on this site is the complete one;
contact-update ratchets run per device pair once both sides have
exchanged their device registries and per contact before that;
skipped message keys are bounded by hard caps, not by age; the absence
of a non-repudiation mode is deliberate; a design in which the first
device shares the whole identity seed with linked devices is a known
limit, with per-device subkeys planned.

## What runs on every change

- **Formal models.** The Tamarin, Quint and Kani models and their
  failing controls run in Core's `test:formal` job; the
  [Formal Verification](../developers/formal-verification.md) page
  lists them.
- **Release certification lanes** in the end-to-end repository, on
  every merge request, on `main` and on a schedule. Among them: a
  six-device convergence lane with exchange and update started from
  every linked-device role; an observability lane that routes a live
  update and fails if its payload or routing token appears in the
  relay's process output or metrics; a source-address lane in which
  the application relay must observe the outer relay's address and
  never the user's; a fail-closed lane that feeds hostile key
  responses and expects zero direct requests, and checks that device
  linking, panic shred and hard shred travel only over the outer hop;
  and two long user-journey lanes with relay-side and contact-side
  leak checks.
- **Static analysis.** The Semgrep analyzer and secret detection run
  on the Core, relay and OHTTP relay pipelines; dependency advisories,
  licences and bans are checked with `cargo audit`, `cargo deny` and
  `cargo vet`.
- **Drift checks.** The test-vectors file on this site and in the
  specification is compared byte for byte with Core's canonical file
  on every pipeline; a mismatch fails the build. Claims that name a
  test or a lemma are not yet checked mechanically; a page on what is
  and is not held true by a check is in preparation.

## Still open from previous reviews

- A per-contact, per-device statement of ratchet status appears in
  the Cryptography Reference; the format changelog for the exchange
  QR code and a process page on how agents take part in development
  are being added in the same batch as this page.
- Mailbox-token unlinkability is argued against a log holder; a
  later compromise of a contact's shared key lets its holder
  recompute every past token of that channel. The specification
  states this; the threat model will.

## Having your analysis listed

Write to **security@vauchi.app** with a link or the text, and say how
you want to be named. Findings are fixed in the open and credited if
you wish; a review that found nothing is also worth listing, and will
be, with its scope.
