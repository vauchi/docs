<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# What Vauchi Is Not

Most software describes only the shape of what it does. A shape also has
edges, and the edges are where people get hurt — usually because they
believed a promise nobody actually made.

So here is the other half of the pitch, in plain words. If any of it
ever stops matching the code, the code is the truth: it is public, and
you can check.

---

## It is not a way to un-share something

You choose which details each contact can see, and you can change or
withdraw that at any time. Withdrawing stops the next update. It does
not reach into someone's memory, their screenshots, or the copy they
pasted into another address book.

Once a person has read your number, they have it. That is how sharing
works everywhere, and Vauchi does not pretend otherwise.

## It is not anonymity

Vauchi shares real contact details — your phone number, your email,
sometimes your address — with people you deliberately chose. That is
the entire point. It is not an alias service, a burner number, or a
forwarding proxy.

What it avoids is the *middleman*: there is no account, no public
handle, and no company holding the list of who you know. Anonymity from
your own contacts was never on offer.

## It is not protection from someone dangerous

Vauchi can stop sending someone updates, and it does so quietly, with
no "you have been blocked" notice. That is a useful property. It is not
safety.

It cannot make you unfindable, undo what someone already learned, or
help with a person who has physical access to you or your phone. If you
are dealing with an abusive or stalking situation, please talk to
people who do that work — a local support service or hotline — before
you rely on any app, including this one.

## It is not a messenger or a social network

There is no feed, no follower count, no profile to perform, and no chat.
Vauchi carries contact details between people who already met. If you
want to say something to someone, you use whichever channel their card
gives you.

## It is not independent of the network

Exchanging in person works without internet. *Updates* do not: a change
to your card travels to your contacts through a relay server.

The relay only ever sees encrypted blobs, addressed by tokens that
change daily and mean nothing to it, so it cannot read what changed and
is not handed a list of who knows whom. It does see that something was
sent, roughly when, and roughly how big it was. Timing is jittered and
sizes are padded to blunt that, but a patient network observer may
still be able to infer connections from the pattern — a design
expectation rather than a measured guarantee, as the
[threat model](../developers/threat-model.md) says in those words.

You can run your own relay if you would rather not take our word for
any of it.

## It is not stronger than your device

If someone unlocks your phone, they have your Vauchi identity, the same
way they would have your messages and your email. Encryption protects
data in transit and at rest; it cannot protect an unlocked screen.

## It is not finished

Vauchi is being built in the open, and the apps are not released yet.
Everything described in these docs is what we are building and testing,
not a shipped consumer product you can install today. Progress is
visible in the repositories, commit by commit.

---

## How to check any of this

- [Threat Model](../developers/threat-model.md) — the exact list of
  what the design defends against, and the known limitations table
- [Security](security.md) — how data is protected, in plainer language
- [Principles](principles.md) — the commitments the rest of it follows
  from
- [Source code](https://gitlab.com/vauchi) — the final authority
