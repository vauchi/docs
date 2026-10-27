<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Security Claims

This page is written for people who break things. Each entry says
what Vauchi claims, who the attacker is, what they are assumed to
have, and where the claim is proven: a test, a formal model, or a
release certification lane. If you find a claim that does not hold,
write to **security@vauchi.app**. We answer within 48 hours and credit
reporters. Good-faith research will not be met with legal action.

The [Cryptography Reference](crypto.md) describes the mechanisms. The
[Threat Model](threat-model.md) describes the adversaries. This page
connects the two: it is the list of things we believe an attacker
cannot do, in plain words, with the evidence next to each one.

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
  `update_comes_from_the_sender_for_this_recipient`,
  `each_update_is_applied_once`, `no_rollback`; ratchet tests
  `test_crypto_hardening_ratchet_same_chain_auth_failure_rolls_back_state`
  and `test_crypto_hardening_ratchet_new_dh_auth_failure_rolls_back_state`
  in `crypto_ratchet_tests.rs`

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

- Status: **Partial**. The token rules are tested; linkability across
  days is a design argument in the crypto reference without a
  dedicated experiment.
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
  `test_x3dh_identity_binding_wrong_key_fails`,
  `test_x3dh_zero_identity_rejected` and
  `test_x3dh_full_bidirectional_agreement` in `exchange_x3dh_tests.rs`

### 7. A confirmation means the other side really confirmed

Reciprocity tokens prove the peer completed the exchange. A leaked
shared key is not enough to forge one; the identity key is also
needed.

- Status: **Shipped**
- Proof: Tamarin `reciprocity.spthy`, lemmas
  `confirmed_means_the_peer_confirmed` and
  `a_leaked_shared_key_also_needs_the_identity_key`

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
  already trust.
- Proof: test
  `v2_two_party_completes_to_a_live_exchanged_link_contact_with_symmetric_key`
  in `complete_link_exchange_tests.rs`; `derive_sas` in
  `relay_exchange_tests.rs`

### 10. Trust level follows how you exchanged, and cannot be edited

The trust shown for a contact is derived from the exchange facts.
There is no control to raise it by hand.

- Status: **Shipped**
- Proof: test
  `the_trust_shown_follows_the_exchange_and_cannot_be_tapped` in
  `contact_trust_tests.rs` (vauchi-app)

## What a stolen or compromised device gives away

The attacker has a device, or a copy of its storage, taken at some
point in time.

### 11. Old messages stay secret after a compromise

Each message uses a key that is deleted after use. Taking the current
ratchet state does not open earlier messages, and the channel heals
once a fresh exchange of ephemeral keys happens.

- Status: **Shipped**
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

- Status: **Shipped**
- Proof: tests `v2_backup_encrypts_the_seed_and_leaks_no_key_material`,
  `test_v2_wrong_password` and
  `backup_debug_output_carries_no_secrets_or_contact_data` in
  `backup_format_versioning_tests.rs` and `backup_boundary_tests.rs`

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

- Status: **Shipped**
- Proof: Tamarin `social_recovery.spthy`, lemmas
  `backup_needs_both_guardians`, `a_group_mate_can_stand_in`,
  `john_rekeys_only_with_the_real_alice` and
  `alice_rekeys_only_with_the_real_john`

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
  test.
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

- **July 2026**: an external reviewer went through the public docs and
  the crypto reference. The one correctness finding, that the docs
  said new fields default to visible, was corrected. The remaining
  items became the plan this page comes from.
- **Every Core pipeline** runs static analysis (semgrep and GitLab
  SAST) and dependency checks (`cargo deny`, `cargo vet`).

If you have reviewed Vauchi and want your analysis listed here, write
to security@vauchi.app.
