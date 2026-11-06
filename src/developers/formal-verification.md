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
the Quint models in
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
- `mailbox_token.spthy` is verified as written and falsified with
  `-DSTABLE_TOKEN`, the stable per-pair token the daily rotation
  replaced.
- `link_exchange.spthy` runs the other way round: its lemma must be
  falsified on the protocol as shipped, and verified with
  `-DPIN_CONFIRMED`, the fix it is written to specify.
- `ble_handshake.spthy`'s scanner lemma is verified as written and
  falsified with `-DRADIO_ONLY`; its displayer lemma must stay
  falsified, as written and with `-DQR_PRIVATE`.
- The Quint device-link model must hold its invariant on a reliable
  relay and must violate it both on a lossy relay and in the
  pre-fix instance it was written to expose. The Bluetooth and
  multi-stage machines each carry a pre-fix or sentinel instance that
  must violate the invariant the shipped instance holds.

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

### `ble_handshake.spthy` — the Bluetooth handshake

The key offer and acknowledgement the two devices exchange over the
radio once connected, and the session key derived from two
Diffie-Hellman terms. In the default variant the scanner has pinned
the displayer's identity and exchange key from the signed QR and
echoes its nonce.

- `session_key_secrecy`: a key both honest sides accepted stays
  secret even when every static key leaks; the ephemeral keys carry
  it.
- `scanner_binds_the_displayer`: when the scanner accepts a key
  someone else knows, that someone is the displayer it scanned.
  Falsified with `-DRADIO_ONLY`, the variants with no QR to pin from
  (Magic, Bump and Shake), where the proximity gates and the
  in-person confirmation carry the binding instead.
- `displayer_binds_the_scanner` is **falsified**, and CI asserts that
  it stays so: the displayer accepts whoever echoes its nonce, under
  any identity. The displayer's screen shows the connector's card for
  the person to confirm; the protocol itself does not pin the
  connector. `-DQR_PRIVATE` shows that a QR nobody can photograph does
  not change this.

Each lemma is proved in its own prover run under a heap cap, because
the file proved as a whole exhausts memory. These runs are part of the
extended set below.

### `link_exchange.spthy` — the link exchange

The sender shares a link carrying an ephemeral key and a nonce, and gives
the person it is for a short code another way; whoever opens it runs SPAKE2
over that code in the relay's two-slot handshake gate, and both sides derive
the escrow keys and swap cards. The attacker owns the network and the channel
that carried the link.

- `contact_only_after_approval` is **verified** on the protocol as shipped,
  except for the one online guess per link the design accepts, which the
  model states as its own rule. The model assumes SPAKE2's messages offer no
  offline test; it does not prove that.
- CI keeps three variants that must be **falsified**, so the lemma is shown
  to be able to fail: `-DFIRST_OPENER` (no code: the first opener, here the
  attacker, becomes the sender's contact), `-DPIN_CONFIRMED` (a hash of a
  code in the deposit, which a short code cannot survive, as it can be tested
  offline) and `-DCODE_IN_LINK` (the code travels with the link).

### `mailbox_token.spthy` — daily mailbox tokens

A contact pair's token for a day is derived from the shared key, the
recipient's key and the day. The relay is the attacker: it sees every
token, knows every public key and the calendar.

- Observational equivalence (Tamarin's `--diff` mode): one pair's
  tokens on two days cannot be told apart from two pairs' tokens, one
  each day. Falsified with `-DSTABLE_TOKEN`, where the left side
  repeats a token and the right side does not.

## Quint models

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

### `ble_exchange_machine.qnt` — the Bluetooth screen and its machine

The Bluetooth exchange screen and the handshake machine behind it,
driven together in ten-second ticks: the screen fails a step after a
minute without progress, while a peer's writes keep reaching the
machine over the open link. Crypto is left to `ble_handshake.spthy`;
this covers where the pair can end up.

- `no_live_machine_behind_a_failed_screen`
- `a_retry_starts_from_no_machine`
- `a_contact_is_persisted_only_on_a_live_screen`

The `before_843` instance, the code before a step failure and a Retry
tore the machine down, must violate all three; the
`failure_cancels_the_machine` instance, the code as shipped, must hold
them under `quint verify`.

### `multi_stage_machine.qnt` — the multi-stage exchange machine

The machine that drives Glance, Hover and Tap-Hover-Shake, and whether
it can wait forever. A phase fails after its budget without a
transition; the final phase completes on the next tick with nothing
left to display.

- `no_phase_outlives_its_budget`

Verified under Apalache with a fifteen-step bound in `main_today` and
violated in `no_step_timeout`, the sentinel with the per-step deadline
switched off: random simulation never draws the thirteen silent ticks
the violation needs, so both run as proofs rather than simulations.

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
run, then runs every model with its controls. `FORMAL_SET=code` runs
the checks that read Rust: Kani and the wipe tests, about sixteen
minutes. `FORMAL_SET=models` runs the hand-written models, which read
no Rust: the Tamarin models that answer in minutes and the device-link
Quint checks, about twenty minutes. `FORMAL_SET=gate` runs both.
`FORMAL_SET=extended` runs the rest: the six capped prover runs of the
Bluetooth handshake and the Apalache checks of the Bluetooth and
multi-stage machines. In CI the code set is the `test:formal-code`
job, on every merge request that touches the crypto, exchange, recovery
or delta code, the wipe tests or the lockfile; the model set is
`test:formal-models`, on every merge request that touches the models.
Both run nightly on `main` and on release tags, and
`check:formal-triggers` fails a merge request whose harness or model
sits outside its job's trigger paths. The extended set is
`test:formal-extended`, nightly on `main` and available to start by
hand on a merge request that touches the models.

## What is not modelled

- The double ratchet and the backup format are covered by tests and
  by the primitives' own analyses, not by a Vauchi model.
- The relay's HTTP API and the Oblivious HTTP path are covered by the
  end-to-end certification lanes, not by a symbolic model.
- The link exchange's approval step exists only as the model's
  `-DPIN_CONFIRMED` variant; the code does not have it yet.
- The escrow encryption and the cards exchanged over a link are out
  of the link-exchange model's scope; it decides who ends up as whose
  contact.

If you want to extend a model or add one, the controls are the
contract: a new lemma ships with the weakening that falsifies it.
