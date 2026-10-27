<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Formal Verification

Parts of Vauchi's protocol are checked by machine, not only by tests.
This page lists every model, what it covers, what it proves, and how
to run it yourself. The [Security Claims](security-claims.md) page
points at these lemmas from each claim.

Three tools are in use.

- **Tamarin** proves properties of the protocols against an attacker
  who controls the network, in the symbolic model: the attacker reads,
  drops, replays and forges any message, but cannot break the
  primitives.
- **Quint** checks the state machines that drive the user interface,
  such as device linking, for invariants over every reachable state,
  including timeouts and a lossy relay.
- **Kani** proves that the parsers of untrusted bytes never panic and
  read each field at the offset the format says, for every possible
  input.

All models live in the
[core repository](https://gitlab.com/vauchi/core): the Tamarin models
in
[`vauchi-core/verification/`](https://gitlab.com/vauchi/core/-/tree/main/vauchi-core/verification),
the Quint model in
[`vauchi-app/verification/`](https://gitlab.com/vauchi/core/-/tree/main/vauchi-app/verification),
and the Kani proofs next to the code they prove, in files named
`*_proofs.rs` or `proofs.rs`.

## Every model runs with a control that must fail

A proof that cannot fail proves nothing. Each model therefore runs
twice or more in CI: once as written, and once with a deliberate
weakening that must make the lemma fail. The weakenings are
preprocessor flags on the Tamarin models and alternative module
instances in Quint. Examples:

- `reciprocity.spthy` is verified as written and falsified with
  `-DNO_SIGNATURE`, and again with `-DNO_SIGNATURE -DSYMMETRIC_TOKENS`.
- `device_link.spthy` is verified with `-DHONEST_RELAY` and falsified
  with `-DHONEST_RELAY -DNO_CODE_CHECK`.
- `social_recovery.spthy` is verified as written and with
  `-DGROUP_OF_TWO`, and falsified with `-DONE_GUARDIAN`,
  `-DNO_PROOF_CHECK` and `-DNO_ANSWER_SIGNATURE`.
- `recovery_acceptance.spthy` is verified as written and with
  `-DIN_PERSON`, and falsified with `-DNO_LOST_KEY_CHECK`.
- The Quint device-link model must hold its invariant on a reliable
  relay and must violate it both on a lossy relay and in the
  pre-fix instance it was written to expose.

If a change to a model makes a control pass, the CI job fails.

## Tamarin models

### `qr_exchange.spthy` — in-person QR exchange

Each side shows a QR signed with its identity key; the two devices run
the key agreement bound to both identities.

- `session_key_secrecy`: the attacker never learns the session key.
- `no_misbinding`: a key agreed by one side is bound to the identity
  the other side showed.

### `device_link.spthy` — linking a second device

The device-link initiator and responder, driven over the relay's
rendezvous slots.

- `seed_secrecy`, `initiator_agreement`, `joiner_agreement`: the seed
  stays secret and both machines agree on the link.
- `photographed_qr_alone_keeps_the_seed`: a photo of the link QR is
  not enough.
- Attack lemmas (`exists-trace`): `qr_leak_exposes_seed` and
  `qr_leak_lets_attacker_choose_joiner_identity`. A leaked QR, used
  within its five-minute life, does hand over the seed. The model
  states that limit rather than hiding it.

### `card_update.spthy` — updates between contacts

The sender numbers its updates to each contact; the receiver keeps the
highest number applied.

- `update_comes_from_the_sender_for_this_recipient`
- `each_update_is_applied_once`
- `no_rollback`
- `changes_stay_secret`

### `reciprocity.spthy` — confirming an exchange

Each side derives a confirmation token from the shared key and its
identity key.

- `confirmed_means_the_peer_confirmed`
- `a_leaked_shared_key_also_needs_the_identity_key`

### `recovery_acceptance.spthy` — accepting a contact's recovery

The acceptance Core runs today, plus two candidate designs for the key
exchange that follows it. Writing this model found a defect: the lost
device's own key counted as a valid acceptor. That finding is fixed;
a second defect in the follow-up key exchange is tracked and planned.

- `accept_needs_the_real_recovery`
- `john_key_secrecy`
- `alice_rekeys_only_with_an_accepting_contact`
- Attack lemma: `a_stranger_can_rekey_with_the_recovering_user`, which
  records that acceptance alone does not authenticate the contact to
  the recovering user. The model is also checked in an in-person
  variant (`-DIN_PERSON`).

### `social_recovery.spthy` — recovering through guardians

Alice's device is stolen; she recovers through her guardians and
rekeys each contact without meeting them again.

- `backup_needs_both_guardians`
- `a_group_mate_can_stand_in`
- `john_rekeys_only_with_the_real_alice`
- `alice_rekeys_only_with_the_real_john`
- `new_key_secrecy`

### `duress_cover.spthy` — cover traffic under duress

The design for a card edit made under the duress PIN: the edit stays
in the session, and the next sync sends each real contact a cover
message of the same shape. The model is scaffolded with an
`executable` lemma only; its secrecy lemmas are still to be written.

### `ble_advertisement.spthy` — Bluetooth role tiebreak

While a Bluetooth exchange screen is open the phone advertises the
prefix of a fresh role-tiebreak token.

- `scanner_connects_to_the_displayer_it_scanned`
- `sightings_happen`

## Quint model

### `device_link_machines.qnt` — the two device-link machines

The host and joiner state machines, driven against each other over the
relay's rendezvous slots, with time in one-minute ticks: the QR lives
five minutes, and the host gives the user one minute to confirm a
claim. Crypto is left to the Tamarin model above; this one covers
where the two machines can end up.

- `joiner_seed_implies_registered`: a joiner that holds the seed is a
  registered device.
- `no_device_registered_for_a_failed_joiner`: a joiner that failed or
  timed out is never registered.

Run it with:

```sh
quint run --main=reliable_relay \
  --invariant=no_device_registered_for_a_failed_joiner
quint run --main=reliable_relay \
  --invariant=joiner_seed_implies_registered
```

## Kani proofs

Kani checks the parsers of bytes that arrive from outside the device.
Each proof covers every input of the given length.

- `unpad_never_panics_and_only_accepts_a_prefixed_plaintext`
  (`crypto/padding_proofs.rs`)
- `parse_exchange_payload_never_panics_and_reads_each_field_at_its_offset`
  (`exchange/exchange_payload_proofs.rs`)
- `ble_advertisement_parse_never_panics_and_reads_each_field_at_its_offset`
  (`exchange/ble/proofs.rs`)
- `recovery_claim_parse_never_panics_and_reads_each_field_at_its_offset`
- `interpolation_never_panics_and_refuses_a_zero_or_repeated_x` and
  `recover_byte_never_panics` (`crypto/shamir_proofs.rs`), for the
  Shamir secret sharing behind social recovery

## Running everything

From the core repository root:

```sh
sh ci/formal-verification.sh
```

The script installs Tamarin, Quint and Kani under `.formal/` on first
run, then runs every model with its controls. In CI it is the
`test:formal` job, which runs on every merge request that touches the
exchange, recovery or padding code or the models, and nightly on
`main`.

## What is not modelled

- The double ratchet and the backup format are covered by tests and
  by the primitives' own analyses, not by a Vauchi model.
- The relay's HTTP API and the Oblivious HTTP path are covered by the
  end-to-end certification lanes, not by a symbolic model.
- The link exchange has no model yet; its approval step is still open
  work.

If you want to extend a model or add one, the controls are the
contract: a new lemma ships with the weakening that falsifies it.
