<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Test Vectors

A test vector is a set of inputs with the output the code produced from
them. If you write your own implementation of a Vauchi derivation, or
want to check that ours does what the [cryptography
reference](crypto.md) says, you feed it the same inputs and compare.

Vauchi ships one file of vectors, produced by the functions in
`vauchi-core` that the apps run:

- canonical copy, checked by the Core test suite on every pipeline:
  [`vauchi-core/tests/fixtures/test-vectors/vauchi-protocol-vectors-v1.json`](https://gitlab.com/vauchi/core/-/blob/main/vauchi-core/tests/fixtures/test-vectors/vauchi-protocol-vectors-v1.json)
- the test that reads it and recomputes every value:
  [`vauchi-core/tests/it/protocol_test_vectors_tests.rs`](https://gitlab.com/vauchi/core/-/blob/main/vauchi-core/tests/it/protocol_test_vectors_tests.rs)
- a copy of the file at the bottom of this page, and as a download:
  [vauchi-protocol-vectors-v1.json](test-vectors/vauchi-protocol-vectors-v1.json)

The Core copy is the one the tests enforce. If the two ever differ, the
Core copy is right and this page is behind.

## Conventions

- Every byte string is lower-case hex.
- `HKDF` means HKDF-SHA256 as in RFC 5869. Where a vector says
  `salt = none`, the salt is absent, which the RFC defines as 32 zero
  bytes. The `info` strings are listed in the file next to the values
  they produced; they are the domain-separation labels the code uses,
  byte for byte.
- `X25519(a, B)` is the Diffie-Hellman output of secret `a` and public
  key `B`. The secrets in the file are the raw 32-byte scalars the
  code loads with `X3DHKeyPair::from_bytes`.
- Encryption is XChaCha20-Poly1305 in the tagged format from the
  [ciphertext format](crypto.md#ciphertext-format) section:
  one algorithm byte, a 24-byte nonce, the ciphertext, a 16-byte tag.
- The whole file was produced in one run and is internally consistent:
  the X3DH shared key is the ratchet's `x3dh_secret`, for example.

## How to run them

The vectors are ordinary tests in the Core integration suite:

```bash
cd core
cargo test -p vauchi-core --features testing --test it protocol_test_vectors
```

`just test core` runs them with everything else. To regenerate the file
after a deliberate change to a derivation, run the same command with
`VAUCHI_WRITE_TEST_VECTORS=1` and without the `test-kdf` feature, then
copy the result here. `test-kdf` weakens Argon2id so the test suite
runs faster; the backup vector must carry the production parameters.

## What each section covers

### `identity`: keys from a master seed

Everything an identity owns comes from one 32-byte master seed.

- The Ed25519 signing key is the seed itself, used directly as the
  Ed25519 private key. `signing_public_key` is its public key and
  `fingerprint` is that key in hex, which is what the apps show as the
  public ID.
- The X25519 exchange key is `HKDF(seed, exchange_seed_info)`, loaded
  as an X25519 secret. `exchange_public_key` is its public key.
- Each device of the identity gets its own id and exchange key:
  `HKDF(seed, device_id_info || index)` and
  `HKDF(seed, device_exchange_info || index)`, with the index as a
  little-endian 32-bit integer. The vector uses device index 0.

### `x3dh`: the shared key of an asymmetric exchange

In a one-directional exchange (NFC, BLE and the link exchange) the
initiator holds a static key and makes an ephemeral one; the responder
holds a static key and contributes nothing fresh. The code calls this
X3DH; it is two Diffie-Hellman operations, with no signed or one-time
prekey on the responder's side. Both sides compute:

```text
DH1 = X25519(initiator static, responder static)
DH2 = X25519(initiator ephemeral, responder static)
shared_key = HKDF(salt = none, ikm = DH1 || DH2, info)
```

The vector records all three key pairs, both Diffie-Hellman outputs and
the shared key. The test recomputes it through `X3DH::respond`, the
responder's function, because the initiator's function draws its
ephemeral key at random and cannot be replayed. The initiator reaches
the same key; the `x3dh_vector_matches_the_responder_derivation_and_its_formula`
test also checks the formula by hand.

The symmetric variant used by the QR exchange, where both sides
contribute an ephemeral key and the `info` carries both identity keys
in sorted order, has no standalone function in Core yet and is not in
this file. Its derivation is described under
[X3DH Key Agreement](crypto.md#x3dh-key-agreement).

### `ratchet`: one Double Ratchet step and one message

After X3DH, the initiator starts a Double Ratchet with the responder's
ratchet key:

```text
root_key || send_chain_key_0 =
    HKDF(salt = x3dh_secret, ikm = X25519(initiator dh, responder dh),
         root_info, 64 bytes)
message_key_0    = HKDF(send_chain_key_0, message_key_info)
send_chain_key_1 = HKDF(send_chain_key_0, chain_key_info)
```

The vector records the keys and one message the initiator sent with
`message_key_0`. The message header (`dh_public`, `dh_generation`,
`message_index`, `previous_chain_length`) is sent in the clear and
bound to the ciphertext as the 44-byte `associated_data`: the public
key, then the three counters as big-endian 32-bit integers. The
plaintext is padded to the 256-byte bucket before encryption, so the
ciphertext is 1 + 24 + 256 + 16 = 297 bytes.

The nonce and the padding bytes are random, so a fresh encryption of
the same plaintext gives a different ciphertext. What the test proves
is decryption: a responder built from `x3dh_secret` and
`responder_dh_secret` alone opens the recorded message and gets the
plaintext back, performing its first Diffie-Hellman ratchet step on
the way. The test also checks that sending one message through the
shipped code leaves `send_chain_key_1` as the next chain key.

### `mailbox_tokens`: the three daily tokens

The relay routes by 32-byte tokens that change every day
(`day_epoch` = Unix seconds / 86400) and never contain a key:

```text
contact_token        = HKDF(shared_key,
                            contact_info || recipient key || day)
device_contact_token = HKDF(shared_key,
                            device_contact_info || recipient key ||
                            recipient device id || day)
device_sync_token    = HKDF(master_seed,
                            device_sync_info || recipient device id || day)
```

`day` is the day epoch as a big-endian 64-bit integer. The recipient
key is the Ed25519 public key of whoever will fetch the message, so
each direction of a contact channel has its own mailbox. The
device-scoped token gives each of a contact's devices its own mailbox;
the device-sync token is what an identity's own devices use among
themselves.

### `backup`: a v3 backup and its key

A full backup is:

```text
0x03 || salt (16 bytes) || XChaCha20-Poly1305(key, zlib(JSON envelope))
key = HKDF-expand(HKDF-extract(salt = none, Argon2id(password, salt)),
                  hkdf_info, 32 bytes)
```

Argon2id runs with 64 MiB of memory, 3 iterations, 4 lanes and a
32-byte output, as the `argon2id` object in the file states. The vector
records the password, the backup bytes, the Argon2id output and the
final key, and names the display name, master seed, device and
creation time the envelope must contain. The envelope in this vector
holds no contacts.

Two tests cover it. One starts from the recorded Argon2id output and
runs in every build. The other starts from the password and runs only
in builds with production Argon2id parameters, where it also imports
the backup through the same function the apps use.

### `backup_v6`: the backup the app writes today

A v3 file is still imported, but a new backup is written as v6, whose
header is in the clear and authenticated:

```text
header = 0x06 || salt (16 bytes)
file   = header || XChaCha20-Poly1305(key, zlib(JSON snapshot); AD = header)
key    = HKDF-expand(HKDF-extract(salt = none, Argon2id(password, salt)),
                     "vauchi-backup-v6-state", 32 bytes)
```

Because the header is the associated data, a file whose version byte
or salt was changed fails the tag instead of decrypting to garbage.
The vector records the password, the salt, the header, the Argon2id
output, the final key and the complete file, and names the display
name, master seed, device and creation time the snapshot must contain;
the snapshot holds no contacts. The same two tests as for v3 cover it:
one opens the file from the recorded Argon2id output in every build
and checks that a changed header is refused, the other imports it
through the apps' own function in builds with production parameters
and checks that a wrong password is refused.

## What is not in this file

These derivations exist in Core but have no vector yet. They are the
natural next additions:

- the symmetric QR exchange key and its confirmation tokens;
- the link exchange: handshake gate, presence slot and escrow keys;
- the relay-mediated short code and its SAS;
- the BLE handshake and advertisement tokens;
- device-link confirmation codes and the social-recovery shares.

A vector that would help you and is missing from this list is a good
reason to [open an issue](https://gitlab.com/vauchi/core/-/issues).

## The file

```json
{{#include test-vectors/vauchi-protocol-vectors-v1.json}}
```

## Related Documentation

- [Cryptography](crypto.md): the algorithms and formats the vectors
  exercise
- [Security Claims](security-claims.md): what each mechanism is
  claimed to protect, with its proof
- [Formal Verification](formal-verification.md): the models that cover
  the protocols around these primitives
