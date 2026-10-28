<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# For Security Researchers

Vauchi wants to be broken by you before it is broken by someone else.
This page is the shortest route from "what do they claim?" to "where
do I swing?", in plain language, with every claim tied to the test,
the model or the code that backs it.

## What we claim

The [Security Claims](../developers/security-claims.md) page lists
every claim with its attacker, its status and its proof. In short:

- A relay operator cannot read a contact card or an update, cannot
  forge or replay one, never sees a public key in a routing token, and
  sees padded message sizes. What it can still see, timing and volume,
  is written down in the threat model.
- Someone watching an in-person exchange over the camera, Bluetooth or
  a photographed QR code does not get the session key. A link shared
  over the internet is weaker, and the app says so.
- A stolen phone gives up what is on it at that moment, not past
  messages, and not the data once its storage key is destroyed.
- A recovery of a lost identity needs a threshold of real helpers who
  vouch for it; no single helper, and no relay, can produce one.

Each claim carries one of three statuses: shipped and proven in CI,
partial, or planned. Partial and planned claims are listed on purpose.
The limits are published next to the guarantees.

## How to check it yourself

- **Read the protocols.** The [Cryptography Reference](../developers/crypto.md)
  describes every derivation, key agreement and format as the code
  implements it, with links to the source file for each.
- **Run the proofs.** The [Formal Verification](../developers/formal-verification.md)
  page lists the Tamarin, Quint and Kani models, their lemmas, and the
  controls that must fail. One script runs them all; it is the
  `test:formal` job of every Core pipeline.
- **Check your own implementation.** The [Test Vectors](../developers/test-vectors.md)
  are produced by the shipped functions and verified by the Core test
  suite. Recompute them and compare.
- **Read the limits.** The [Threat Model](../developers/threat-model.md)
  says who the attacker is, what is defended against and what is not.
- **Read what has been reviewed.** [Previous Analysis](previous-analysis.md)
  lists the reviews so far, what changed because of them, what runs
  on every change, and what has never been done.

Everything is open source. The Core crate is
[gitlab.com/vauchi/core](https://gitlab.com/vauchi/core); the relay is
[gitlab.com/vauchi/relay](https://gitlab.com/vauchi/relay).

## Where the specification is going

The protocol pages above live on this site today. A standalone,
versioned specification is being set up in its own repository, with
numbered claims, a chapter per protocol, machine-checked vectors and a
disclosure policy. Until it is published, the pages linked here are the
reference, and this page will point to the specification when it
exists.

## How to report

Write to **security@vauchi.app**. Say what you found, how to reproduce
it, and which claim it breaks if it maps to one. You will get a reply
from the maintainer; there is no bug bounty yet, and the project says
so rather than promising one. If you have reviewed Vauchi and want
your analysis listed, say so in the same mail.

## Related Documentation

- [Security](../about/security.md): the security model, for everyone
- [For Developers](../developers/index.md): architecture, contributing,
  tooling
