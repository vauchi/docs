<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Recovery and Compromise Rotation

Two separate problems, two separate flows:

- **Getting back in** restores the **same identity**, by the first path
  that works: linking from a working device, the password backup, or,
  when both fail, social recovery. None of them rekeys contacts.
- **Compromise rotation** moves contacts to a new identity after a
  device holding the identity's keys was stolen unlocked. Linked devices
  share the master seed and derive their device keys from it, so revoking
  the stolen device in the signed registry stops its sync but takes
  nothing from it; only new keys do.

```admonish info title="Planned"
Both flows below describe the protocol being built
(vauchi/private#796). In Core today, social recovery still has the new
phone create a new identity, and no contact accepts a rekey offer: until
the policy guardians' certificate exists, every offer is dropped, and an
old-key continuation merges nothing.
```

## Social recovery: same identity, in person

**Interaction type:** 🤝 in person only; no relay.

The owner chose guardians in groups; each guardian device keeps a share
of the owner's encrypted guardian backup, sealed to it. One guardian of
every group opens the backup.

```mermaid
    accTitle: Social recovery restoring the same identity
    accDescr: A new phone in recovery mode collects re-sealed shares from guardians in person and restores the same identity
sequenceDiagram
    autonumber
    participant N as New phone (no identity)
    participant G as Guardian's device
    participant P as Guardian

    N->>N: Recovery mode: temporary recovery key r
    N->>N: Claim: old identity key, pk(r)
    Note over N,P: IN PERSON
    N->>G: Show the claim (QR)
    G->>G: Keeps a backup for the old key?
    G->>P: Reveal the role, show the owner's name
    P->>G: "Yes, this is them"
    G->>G: Re-seal its share to pk(r)
    G->>N: Share and backup, over the meeting's channel
    Note over N: Repeat with one guardian of every group
    N->>N: Open the backup with r
    N->>N: Become the old identity, new device index
    N->>N: Discard r
    Note over N: Contacts keep their shared keys;<br/>sessions restart via the registry handshake
```

## Compromise rotation: the registered next identity

The owner registered a next identity N in advance: every contact's pin
holds its hash, and its seed is split among the policy guardians (more
than (n + 1) / 2 of them, one per group). The stolen phone holds only N's
hash.

```mermaid
    accTitle: Compromise rotation to the registered next identity
    accDescr: The owner rebuilds the registered next identity from the policy guardians and contacts move to it online with a certificate or in person by recognition
sequenceDiagram
    autonumber
    participant O as Owner's phone
    participant PG as Policy guardians
    participant C as Contact online
    participant M as Contact met in person

    Note over O,PG: IN PERSON, a quorum
    PG->>O: Pieces of N's seed
    O->>O: Rebuild N
    PG->>O: Certificate: rotate to N (one decision per version)
    O->>C: Rekey offer signed by N, with the certificate
    C->>C: N matches the pinned hash, certificate valid
    C->>O: Answer, fresh shared key
    Note over O,M: IN PERSON
    M->>M: Recognizes the owner, N matches the pinned hash
    M->>M: Rotate to N; old identity marked compromised
```

A rotation and a policy change that replaces N compete in one decision
per identity and policy version, so contacts never follow two
successors. The decision is modelled in
`vauchi-app/verification/guardian_voting.qnt` (an inductive proof for
five guardians, three ballots, two values, one forgetful device) and
`guardian_history.qnt`; N's secrecy in
`vauchi-core/verification/next_identity.spthy`.

## Related

- [Social Recovery](https://spec.vauchi.app/protocols/social-recovery.html) in the protocol spec
- [How to Recover Your Account](../../users/guides/recovery.md)
