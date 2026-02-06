<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Diagrams

Sequence diagrams for core Vauchi flows.

---

## Available Diagrams

| Diagram | Description |
|---------|-------------|
| [Contact Exchange](contact-exchange.md) | In-person QR code exchange |
| [Device Linking](device-linking.md) | Multi-device setup |
| [Sync Updates](sync-updates.md) | How card updates propagate |
| [Contact Recovery](contact-recovery.md) | Social recovery flow |

---

## Reading These Diagrams

All diagrams use [Mermaid](https://mermaid.js.org/) sequence diagram notation:

- **Solid arrows** (`->>`) = Synchronous request
- **Dashed arrows** (`-->>`) = Asynchronous/response
- **Notes** = Context or explanation
- **Participants** = Entities involved in the flow

## Interaction Types

Each diagram indicates the interaction type:

| Icon | Type | Meaning |
|------|------|---------|
| :handshake: | IN-PERSON | Physical proximity required |
| :cloud: | REMOTE | Via relay server |
| :lock: | ENCRYPTED | End-to-end encrypted |

---

## Related Documentation

- [Architecture Overview](../architecture.md) — System design
- [Crypto Reference](../crypto.md) — Cryptographic details
