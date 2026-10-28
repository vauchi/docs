<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Security Claims

This page is written for people who break things. Each entry says
what Vauchi claims, who the attacker is, what they are assumed to
have, and where the claim is proven: a test, a formal model, or a
release certification lane. If you find a claim that does not hold,
write to **security@vauchi.app**. The maintainer replies and credits
reporters; the terms are in the specification's
[disclosure policy](https://gitlab.com/vauchi/spec/-/blob/main/src/disclosure.md).

The [Cryptography Reference](crypto.md) describes the mechanisms. The
[Threat Model](threat-model.md) describes the adversaries. This page
connects the two: it is the list of things we believe an attacker
cannot do, in plain words, with the evidence next to each one.

The numbered claims here are the claims S1 to S17 of the
[protocol specification](https://gitlab.com/vauchi/spec), whose
[claims chapter](https://gitlab.com/vauchi/spec/-/blob/main/src/claims.md)
is the normative list: it names the attacker, the exact statement,
the test or lemma, and where the code is weaker than the sentence.
When this page and that chapter differ, the chapter is right and this
page is behind.

## How to read this page

Every claim carries one of three statuses.

- **Shipped**: the code is on `main` and the proof runs in CI.
- **Partial**: the mechanism exists, but the proof or part of the
  behaviour is missing. The entry says what is missing.
- **Planned**: a known gap with a tracked design. Not a claim yet.

Proof pointers name a test function, a lemma in a formal model, or a
certification lane. Tests live in the
[core repository](https://gitlab.com/vauchi/core); the models are in
[`vauchi-core/verification/`](https://gitlab.com/vauchi/core/-/tree/main/vauchi-core/verification)
and
[`vauchi-app/verification/`](https://gitlab.com/vauchi/core/-/tree/main/vauchi-app/verification);
the lanes run in the
[end-to-end repository](https://gitlab.com/vauchi/e2e) on every
change to `main`.

Lemma names ending in a behaviour, such as `qr_leak_exposes_seed`, are
`exists-trace` lemmas. They prove that the attack exists in the model.
We publish them on purpose: a reviewer should see the limits as
clearly as the guarantees.

## What the relay cannot do

The relay is the server that stores and forwards encrypted updates.
The attacker here runs that server, with its database and logs.

### 1. The relay cannot read a contact card or an update

Every card and update is encrypted on the sender's device for one
recipient. The relay stores and forwards bytes it cannot open.

- Status: **Shipped**
- Proof: lane `test:release-rg6-observability`, case
  `integration_ohttp_relay_observations_exclude_update_content`;
  Tamarin `card_update.spthy`, lemma `changes_stay_secret`

### 2. An update is from the contact it claims, applied once, never rolled back

A relay that replays an old update, swaps the sender, or serves a
stale version cannot change what the recipient ends up with.

- Status: **Shipped**
- Proof: Tamarin `card_update.spthy`, lemmas
  `update_comes_from_the_sender_for_this_recipient` and
  `each_update_is_applied_once`; ratchet tests
  `test_crypto_hardening_ratchet_same_chain_auth_failure_rolls_back_state`
  and `test_crypto_hardening_ratchet_new_dh_auth_failure_rolls_back_state`
  in `crypto_ratchet_tests.rs`. "Never rolled back" rests on the
  version floor in code, tested by
  `stale_version_delta_rejected_by_device_receiver` and
  `delta_version_floor_is_tracked_per_peer_device`; the model's
  `no_rollback` lemma reaches no verdict with the floor and is stated,
  not proved.

### 3. The relay does not learn the user's network address

Clients reach the relay through Oblivious HTTP. The gateway sees the
address but not the content; the relay sees the content but not the
address. Nothing in Core talks to the relay without that hop.

- Status: **Partial**. The split holds against an outside observer and
  against each operator alone. Until the first release one operator
  runs both hops, so the two halves are not yet independently
  controlled. The release gate for that is open and tracked.
- Proof: lane `test:release-rg7`, case
  `application_relay_observes_the_ohttp_relay_never_the_end_user`;
  lane `test:release-rg8`, cases
  `device_link_chain_makes_zero_requests_to_either_hop` and
  `hostile_bootstrap_responses_fail_closed`; test
  `content_is_never_fetched_without_ohttp` in
  `content_over_ohttp_tests.rs`

### 4. Public keys never route traffic

Mailboxes are addressed by tokens that rotate daily. A relay log holds
tokens, not identities, and a token from one day does not name the
same mailbox the next day.

- Status: **Partial**. The token rules are tested; linkability of a
  mailbox across days is a design argument in the crypto reference
  without a dedicated experiment. On the code as released, the
  fetcher is linkable across days: each sync fetched today's and
  yesterday's token of every contact in one request set, so
  consecutive days' sets overlapped and the relay could chain one
  anonymous fetcher and count its contacts; a fix in review groups
  requests per day, after which only timing correlation remains.
  Token unlinkability is not forward secure: whoever later
  obtains a contact's shared key can recompute every past token of
  that channel. Guardian sets, recovery proofs and purge requests are
  addressed by the identity key or its hash, by design.
- Proof: tests `unsolicited_tokens_are_rejected_for_immediate_fetches`,
  `unsolicited_tokens_are_rejected_for_delayed_fetches` and
  `unattributed_blobs_are_not_delivered_or_acknowledged` in
  `delayed_mailbox_routing_tests.rs`; design in
  [Mailbox Routing](crypto.md#mailbox-routing-daily-rotating-tokens)

### 5. Message sizes are padded

Ciphertexts are padded to fixed buckets before encryption, so the
relay sees bucket sizes rather than exact lengths.

- Status: **Partial**. The padding is implemented and unit-tested. The
  claim that bucket sizes defeat a traffic-analysis attacker has not
  been measured against one.
- Proof: padding tests in `crypto_tests.rs`; design in
  [Message Padding](crypto.md#message-padding)

## What someone watching an exchange cannot do

The attacker stands next to two people exchanging cards, sees the
screen, records the radio, or sits in the relay path between them.

### 6. Watching the QR exchange does not give the session key

The two devices run a key agreement bound to both identity keys. A
transcript of the QR codes alone yields no key, and a key agreed with
the wrong identity fails.

- Status: **Shipped**
- Proof: Tamarin `qr_exchange.spthy`, lemmas `session_key_secrecy`
  and `no_misbinding`; tests
  `test_transcript_binding_includes_identity_keys` and
  `test_transcript_binding_includes_ephemeral_keys` in
  `exchange_ceremony_tests.rs`, which exercise the symmetric
  derivation the QR exchange uses. The `exchange_x3dh_tests.rs` tests
  cover the two-DH agreement of the relay-mediated exchange, not this
  one.

### 7. A confirmation means the other side really confirmed

Reciprocity tokens prove the peer completed the exchange. A leaked
shared key is not enough to forge one; the identity key is also
needed.

- Status: **Partial**. The identity signature exists on the
  relay-sync confirmation only. The Bluetooth confirmation is
  authenticated by the session key alone, and the escrow confirmation
  by a token derived from the exchange's DH output; on those two paths
  the confirmation is as strong as the exchange's own secrecy (claim
  6), not stronger.
- Proof: Tamarin `reciprocity.spthy`, lemmas
  `confirmed_means_the_peer_confirmed` and
  `a_leaked_shared_key_also_needs_the_identity_key`, for the
  relay-sync path

### 8. Over Bluetooth, the scanner connects to the device it scanned

The advertisement binds the radio session to the QR the user scanned,
so a nearby device cannot step into the exchange.

- Status: **Shipped**
- Proof: Tamarin `ble_advertisement.spthy`, lemma
  `scanner_connects_to_the_displayer_it_scanned`

### 9. A remote exchange over a link is weaker, and says so

A card can be exchanged by sending a link. The link carries a signed
bootstrap, and the result is a live contact with a shared key.

- Status: **Partial**. Today whoever opens the link first becomes a
  contact, with no approval by the sender and no code to compare out
  of band. The 6-digit comparison code exists only for the
  relay-mediated video exchange. Sender approval and an out-of-band
  code are tracked as open work. Until then, treat a link as you
  would treat a message to that person: send it over a channel you
  already trust, and compare key fingerprints afterwards, which
  raises the contact to the Verified level. The protocol itself is
  in [Link Exchange](crypto.md#link-exchange-asynchronous-via-relay-escrow).
- Proof: test
  `v2_two_party_completes_to_a_live_exchanged_link_contact_with_symmetric_key`
  in `complete_link_exchange_tests.rs`; `derive_sas` in
  `relay_exchange_tests.rs`

### 10. Trust level follows how you exchanged, and cannot be edited

The trust shown for a contact is derived from the exchange facts:
the transport, the proximity evidence, and whether the user compared
key fingerprints out of band. There is no control to set a level by
hand; the fingerprint comparison is the only user action, and it is
recorded as its own level.

- Status: **Shipped**
- Proof: test
  `the_trust_shown_follows_the_exchange_and_cannot_be_tapped` in
  `contact_trust_tests.rs` (vauchi-app)

## What a stolen or compromised device gives away

The attacker has a device, or a copy of its storage, taken at some
point in time.

### 11. Old messages stay secret after a compromise

Each update between contacts uses a key that is deleted after use.
Someone who recorded the traffic and later takes the current ratchet
state does not open earlier updates, and the channel heals once a
fresh exchange of ephemeral keys happens.

- Status: **Partial**. Two paths have no forward secrecy and the
  claim does not cover them: the first message of a session opened
  without a prior exchange (it resumes at the first reply), and all
  sync between a person's own devices, which is encrypted under a
  static agreement between the devices' exchange keys and carries
  contacts, cards and ratchet states.
- Proof: tests `test_dr_forward_secrecy`,
  `test_forward_secrecy_compromised_state` and
  `test_dr_skipped_message_limit` in `crypto_ratchet_tests.rs`

### 12. Destroying the storage key makes the data unrecoverable

Everything at rest is encrypted under a hierarchy rooted in one
storage master key kept in the platform's secure storage. Wiping that
key wipes the data, and one identity's keys never open another's.

- Status: **Partial**. Proven for the Core storage layer. On Android
  and iOS the key destruction step is incomplete; the fix is in
  testing.
- Proof: tests `test_smk_destruction_makes_data_irrecoverable`,
  `test_shredding_isolation_across_identities` and
  `test_fkek_protects_file_keys` in
  `crypto_shredding_integration_tests.rs`; lane `test:release-rg8`,
  case `hard_shred_after_grace_fanout_over_outer_hop_only`

### 13. A backup without its password reveals nothing

Backups are encrypted with a key derived from the password. The file
never contains key material in the clear, and a wrong password fails
rather than yielding garbage.

- Status: **Shipped**. The claim is about the file. Its strength
  against guessing is the password through Argon2id, and today only
  the identity-only backup checks the password's strength: the full
  backup, which is the default and holds every contact's shared key,
  accepts any password (tracked).
- Proof: tests `v2_backup_encrypts_the_seed_and_leaks_no_key_material`,
  `test_v2_wrong_password` and
  `backup_debug_output_carries_no_secrets_or_contact_data` in
  `backup_format_versioning_tests.rs` and `backup_boundary_tests.rs`;
  for the current format,
  `backup_v6_vector_decrypts_under_its_header_and_not_under_a_changed_one`
  and
  `backup_v6_vector_imports_with_production_argon2id_and_refuses_a_wrong_password`
  in `protocol_test_vectors_tests.rs`

### 14. A duress unlock shows a decoy and sends nothing that reveals it

Unlocking with the duress PIN opens a decoy. Anything the app sends
afterwards has the shape of normal traffic: cover items carry the
length and timestamp of the real item they stand for, and applying
one changes nothing on a linked device.

- Status: **Partial**. The cover traffic is tested in Core. The
  Tamarin model for duress cover is scaffolded but states no lemma
  yet.
- Proof: tests `applying_a_cover_item_changes_nothing` and
  `a_cover_item_has_the_length_and_timestamp_of_the_item_it_stands_for`
  in `duress_cover_tests.rs`

### 15. A linked device is a full copy of the identity

Linking a device transfers the identity seed. A photograph of the
link QR alone does not give it away. A leaked link QR does, and lets
the attacker choose which device identity joins. The QR expires after
five minutes.

- Status: **Shipped**, with the limit stated. Per-device subkeys that
  would contain a leak are planned.
- Proof: Tamarin `device_link.spthy`, lemmas `seed_secrecy`,
  `photographed_qr_alone_keeps_the_seed`, `initiator_agreement`,
  `joiner_agreement`, and the attack lemmas `qr_leak_exposes_seed` and
  `qr_leak_lets_attacker_choose_joiner_identity`; Quint
  `device_link_machines.qnt`, invariants
  `joiner_seed_implies_registered` and
  `no_device_registered_for_a_failed_joiner`

## What a recovery cannot be used for

The attacker tells your contacts you lost your phone.

### 16. Accepting a recovery needs the real recovery

A contact only rekeys with a recovering user whose recovery was
genuinely initiated, and the recovered key stays secret from the
contact who accepts it.

- Status: **Partial**. The protocol lemmas hold. A shipped defect means
  a contact who accepts a recovery proof does not yet receive a key
  bound to the recovered identity; the fix is planned.
- Proof: Tamarin `recovery_acceptance.spthy`, lemmas
  `accept_needs_the_real_recovery`, `john_key_secrecy`,
  `alice_rekeys_only_with_an_accepting_contact`, and the attack lemma
  `a_stranger_can_rekey_with_the_recovering_user`

### 17. Social recovery needs the guardians, and only the real ones

Restoring from guardians needs both guardians' shares. A member of the
same recovery group can stand in for an absent guardian. Each side
rekeys only with the real counterpart.

- Status: **Partial**. The share split, the sealing of shares to
  guardians and the restore are in Core with tests. The rekey of each
  contact after a recovery, which the last two lemmas describe, is a
  design that is not in the code yet, and the app does not yet hand
  shares to guardians automatically.
- Proof: Tamarin `social_recovery.spthy`, lemmas
  `backup_needs_both_guardians` and `a_group_mate_can_stand_in`; the
  rekey lemmas `john_rekeys_only_with_the_real_alice` and
  `alice_rekeys_only_with_the_real_john` model the planned design

## What we do not claim

These are the limits we know about. The
[Known Limitations](threat-model.md#known-limitations) table in the
threat model keeps the full list.

- The relay sees metadata: which mailbox tokens receive how much, and
  when. Sealed sender and padding reduce it; they do not remove it.
- A compromised device exposes the whole identity seed. Subkeys are
  planned.
- There is no key transparency log yet. A relay that hands out a wrong
  key for a first contact is not auditable today; a signed log is
  planned.
- Today's key agreement is not post-quantum. Recorded ciphertext could
  be read by a future quantum computer; a hybrid ML-KEM scheme is
  planned.
- No external cryptographic audit has been performed yet. It is
  planned and depends on funding.

## How the proofs run

- **Tests**: `just test core` runs the Core suites, including every
  test named above. The property-based tests use `proptest`; a
  counterexample that is ever found becomes a permanent regression
  test. The [test vectors](test-vectors.md) are part of the suite: an
  independent implementation can check its key derivations, X3DH,
  ratchet, mailbox tokens and backup format against them.
- **Formal models**: see [Formal Verification](formal-verification.md).
  `core/ci/formal-verification.sh` runs the Kani
  parser proofs, the Tamarin models and the Quint model in the
  `test:formal` job on every change to the exchange, recovery and
  padding code, and nightly. Each model also runs a control that must
  fail, so a weakened lemma cannot pass unnoticed.
- **Release certification**: seven blocking end-to-end lanes run the
  six-device topology against real relays and collect one
  machine-readable report per pipeline. The release gate refuses a
  report that is missing, stale, partial or has skipped cases.

## Previous analysis

What has been reviewed before, what changed because of it, and what
runs on every change is on the
[Previous Analysis](../security/previous-analysis.md) page. If you
have reviewed Vauchi and want your analysis listed, write to
security@vauchi.app.
